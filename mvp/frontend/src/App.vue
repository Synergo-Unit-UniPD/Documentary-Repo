<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'
import type { EditorView as CMEditorView } from '@codemirror/view'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

import TopBar from './components/TopBar.vue'
import MarkdownEditor from './components/MarkdownEditor.vue'
import MarkdownPreview from './components/MarkdownPreview.vue'
import LoadingModal from './components/LoadingModal.vue'
import ResultModal from './components/ResultModal.vue'
import ErrorModal from './components/ErrorModal.vue'
import AIRequestModal from './components/AIRequestModal.vue'
import LinkModal from './components/LinkModal.vue'
import TableModal from './components/TableModal.vue'
import Toast from './components/Toast.vue'

import { MarkdownContentEditor } from './model/MarkdownContentEditor'
import { ReplaceContentCommand } from './model/ReplaceContentCommand'
import { CommandHistory } from './model/CommandHistory'
import { NoteModel } from './model/NoteModel'
import { AIRequestModel } from './model/AIRequestModel'
import { EditorView as AppEditorView } from './view/EditorView'
import { AIPanelView } from './view/AIPanelView'
import { EditorController } from './controller/EditorController'
import { AIController } from './controller/AIController'
import { NoteServiceProxy } from './proxy/NoteServiceProxy'
import { AIServiceProxy } from './proxy/AIServiceProxy'
import { ExportServiceProxy } from './proxy/ExportServiceProxy'
import type { ExportFormat } from './proxy/ExportService'

import { FormatType } from './model/FormatType'
import { TextRange } from './model/TextRange'
import { ListActionRequest } from './model/ListActionRequest'
import { ListOperationType } from './model/ListOperationType'
import { ListType } from './model/ListType'
import { LinkActionRequest } from './model/LinkActionRequest'
import { LinkOperationType } from './model/LinkOperationType'
import { TableActionRequest } from './model/TableActionRequest'
import { TableOperationType } from './model/TableOperationType'
import { RequestedOperation } from './model/RequestedOperation'
import { ProposalActionType } from './model/ProposalActionType'
import { ViewMode } from './model/ViewMode'
import { IdleState } from './model/IdleState'
import { ProcessingState } from './model/ProcessingState'
import { ProposalReadyState } from './model/ProposalReadyState'
import { ErrorState } from './model/ErrorState'
import { InvalidTableDimensionError } from './model/InvalidTableDimensionError'
import type { AIRequestState } from './model/AIRequestState'

// ---------------------------------------------------------------------------
// Composizione del dominio: Model -> View -> Controller, secondo il pattern
// MVC "Pull Model" descritto in Specifica Tecnica, Sezione 3.3.
// ---------------------------------------------------------------------------
const markdownEditor = new MarkdownContentEditor('')
const commandHistory = new CommandHistory()
const noteService = new NoteServiceProxy()
const exportService = new ExportServiceProxy('')
const noteModel = new NoteModel(markdownEditor, commandHistory, noteService, exportService)

const editorView = new AppEditorView(noteModel, {})
const editorController = new EditorController(noteModel, editorView)
void editorController // mantenuto in vita dal riferimento della EditorView (attach)

const aiService = new AIServiceProxy('')
const aiRequestModel = new AIRequestModel(aiService)
const aiPanelView = new AIPanelView(aiRequestModel)
const aiController = new AIController(aiRequestModel, aiPanelView, noteModel)
void aiController

// ---------------------------------------------------------------------------
// Stato reattivo Vue: aggiornato tramite Observer agganciati direttamente ai
// Model (oltre a EditorView/AIPanelView, che vi si agganciano a loro volta).
// ---------------------------------------------------------------------------
const content = ref('')
const isDirty = ref(false)
const canUndo = ref(false)
const canRedo = ref(false)
const aiState = ref<AIRequestState>(new IdleState())
const viewMode = ref<ViewMode>(ViewMode.SPLIT)

noteModel.attach({
  update: () => {
    content.value = noteModel.getContent()
    isDirty.value = noteModel.getIsDirty()
    canUndo.value = noteModel.canUndo()
    canRedo.value = noteModel.canRedo()
  },
})

aiRequestModel.attach({
  update: () => {
    aiState.value = aiRequestModel.getAIState()
  },
})

// EditorView.displayError è pensato per la UI: qui lo colleghiamo al toast dedicato
// (R14, R15: notifica dell'errore senza modificare il documento), non più al pallino
// di stato della toolbar, che resta riservato al solo indicatore Salvato/Non salvato.
editorView.displayError = (message: string, tone: 'error' | 'info' = 'error') => {
  showToast(message, tone === 'info' ? 'info' : 'error')
}

// ---------------------------------------------------------------------------
// Editor CodeMirror
// ---------------------------------------------------------------------------
// `basicSetup` (attivato da `:basic="true"` in MarkdownEditor.vue) include una
// propria estensione history() con Ctrl-Z/Ctrl-Y legati ai comandi undo/redo
// interni di CodeMirror. Poiché il contenuto viene sincronizzato dall'esterno
// a ogni comando (Sezione 5.3.2 Specifica Tecnica), OGNI modifica -- comprese
// quelle già tracciate dal nostro CommandHistory -- finisce ANCHE nella
// cronologia interna di CodeMirror, creando due sistemi di undo paralleli e
// inconsistenti. Intercettiamo qui le scorciatoie da tastiera con priorità
// massima e le rediriggiamo al nostro NoteModel, l'unica fonte di verità.
const undoRedoKeymap = Prec.highest(
  keymap.of([
    {
      key: 'Mod-z',
      run: () => {
        onUndo()
        return true
      },
    },
    {
      key: 'Mod-y',
      run: () => {
        onRedo()
        return true
      },
    },
    {
      key: 'Mod-Shift-z',
      run: () => {
        onRedo()
        return true
      },
    },
  ]),
)

const extensions = [markdown({ codeLanguages: languages }), oneDark, undoRedoKeymap]
const cmView = ref<CMEditorView | null>(null)

// Raggruppa digitazione/incolla in un'unica voce di history per "burst" (pausa tra
// una modifica e la successiva): evita sia un comando per carattere sia la perdita
// di annullabilità di copia/incolla lamentata in revisione.
const TYPING_BURST_TIMEOUT_MS = 900
let activeTypingCommand: ReplaceContentCommand | null = null
let typingBurstTimer: ReturnType<typeof setTimeout> | undefined

function handleReady(payload: any): void {
  cmView.value = payload.view ?? payload
}

function currentSelection(): TextRange {
  const view = cmView.value
  if (!view) return new TextRange(0, 0)
  const { from, to } = view.state.selection.main
  return new TextRange(from, to)
}

function currentSelectedText(): string {
  const range = currentSelection()
  return content.value.slice(range.start, range.end)
}

/**
 * Riposiziona la selezione di CodeMirror dopo una modifica che ha spostato il
 * testo di `startDelta`/`endDelta` caratteri rispetto a `range.start`/`range.end`
 * (es. inserimento/rimozione di marcatori di formattazione o di elenco). I due
 * spostamenti possono essere diversi tra loro: su una selezione multi-riga,
 * l'inizio e la fine della selezione non si spostano necessariamente della
 * stessa quantità (vedi MarkdownContentEditor.computeFormatToggleShift /
 * computeListToggleShift).
 * Va chiamata dopo `await nextTick()`, quando il documento di CodeMirror
 * riflette già il nuovo contenuto (altrimenti la nuova selezione potrebbe
 * cadere fuori dai limiti del documento ancora "vecchio").
 */
function repositionSelection(range: TextRange, startDelta: number, endDelta: number = startDelta): void {
  if (startDelta === 0 && endDelta === 0) return
  const view = cmView.value
  if (!view) return

  const docLength = view.state.doc.length
  const clamp = (n: number) => Math.max(0, Math.min(n, docLength))
  const anchor = clamp(range.start + startDelta)
  const head = clamp(range.end + endDelta)

  view.dispatch({ selection: { anchor, head } })
}

/**
 * Applica un range di selezione ASSOLUTO, già calcolato per intero dal
 * chiamante (es. il testo appena inserito da una proposta AI accettata) -
 * a differenza di repositionSelection, che somma un DELTA a un range
 * preesistente e salta il dispatch se il delta è zero (ottimizzazione
 * corretta per quel caso d'uso, ma sbagliata qui: passare 0 come "nessun
 * delta da sommare" farebbe uscire subito repositionSelection senza mai
 * applicare il range assoluto voluto - bug osservato: la vecchia selezione,
 * mai sostituita, restava valida sul contenuto nuovo, selezionando una
 * porzione sbagliata e spesso più ampia di quella attesa).
 */
function selectRange(range: TextRange): void {
  const view = cmView.value
  if (!view) return
  const docLength = view.state.doc.length
  const clamp = (n: number) => Math.max(0, Math.min(n, docLength))
  view.dispatch({ selection: { anchor: clamp(range.start), head: clamp(range.end) } })
}

/** Posiziona il cursore (selezione collassata) a una posizione precisa del
 *  documento, usata da Taglia/Incolla dove non basta un semplice spostamento
 *  relativo (il testo sostituito ha una lunghezza diversa da quello originale). */
function setCursorPosition(position: number): void {
  const view = cmView.value
  if (!view) return
  const clamped = Math.max(0, Math.min(position, view.state.doc.length))
  view.dispatch({ selection: { anchor: clamped, head: clamped } })
}

function onEditorInput(newValue: string): void {
  if (newValue === markdownEditor.getContent()) {
    return
  }

  if (activeTypingCommand === null) {
    activeTypingCommand = new ReplaceContentCommand(markdownEditor, newValue)
    noteModel.executeCommand(activeTypingCommand)
  } else {
    activeTypingCommand.updateNewContent(newValue)
    markdownEditor.setContent(newValue)
    noteModel.markDirtyAndNotify()
  }

  clearTimeout(typingBurstTimer)
  typingBurstTimer = setTimeout(() => {
    activeTypingCommand = null
  }, TYPING_BURST_TIMEOUT_MS)
}

function commitTypingBurst(): void {
  clearTimeout(typingBurstTimer)
  activeTypingCommand = null
}

const saveStatus = computed(() => (isDirty.value ? 'Modifiche non salvate' : 'Salvato'))

const toastMessage = ref('')
const toastType = ref<'error' | 'success' | 'info'>('error')
const toastVisible = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | undefined

function showToast(message: string, type: 'error' | 'success' | 'info' = 'error', durationMs = 3200): void {
  toastMessage.value = message
  toastType.value = type
  toastVisible.value = true

  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, durationMs)
}

function dismissToast(): void {
  clearTimeout(toastTimer)
  toastVisible.value = false
}

function onInvalidLinkClick(): void {
  // Il link non ha uno schema (es. "ciao" invece di "https://..."): non è
  // una destinazione valida, non naviga da nessuna parte (vedi
  // MarkdownPreview.vue). Feedback neutro, non un errore vero e proprio.
  showToast('Il link non è valido: manca lo schema (es. "https://").', 'info')
}

async function testConnection(): Promise<void> {
  try {
    const response = await fetch('/api/status')
    if (!response.ok) {
      showToast('Impossibile raggiungere il server (risposta non valida).')
    }
  } catch {
    showToast('Impossibile raggiungere il server: verifica la connessione.')
  }
}

const compiledMarkdown = computed(() => DOMPurify.sanitize(marked(content.value) as string))

async function onCopy(): Promise<void> {
  const text = currentSelectedText()
  if (!text) {
    showToast('Seleziona del testo da copiare')
    return
  }
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    showToast('Impossibile accedere agli appunti del browser')
    return
  }
  cmView.value?.focus()
}

async function onCut(): Promise<void> {
  const range = currentSelection()
  const text = currentSelectedText()
  if (!text) {
    showToast('Seleziona del testo da tagliare')
    return
  }

  try {
    await navigator.clipboard.writeText(text)
  } catch {
    showToast('Impossibile accedere agli appunti del browser')
    return
  }

  commitTypingBurst()
  const newContent = markdownEditor.getContent().slice(0, range.start) + markdownEditor.getContent().slice(range.end)
  const command = new ReplaceContentCommand(markdownEditor, newContent)
  noteModel.executeCommand(command)

  await nextTick()
  setCursorPosition(range.start)
  cmView.value?.focus()
}

async function onPaste(): Promise<void> {
  let clipboardText = ''
  try {
    clipboardText = await navigator.clipboard.readText()
  } catch {
    showToast('Impossibile leggere dagli appunti del browser (permesso negato o non supportato)')
    return
  }
  if (!clipboardText) return

  commitTypingBurst()
  const range = currentSelection()
  const current = markdownEditor.getContent()
  const newContent = current.slice(0, range.start) + clipboardText + current.slice(range.end)
  const command = new ReplaceContentCommand(markdownEditor, newContent)
  noteModel.executeCommand(command)

  await nextTick()
  setCursorPosition(range.start + clipboardText.length)
  cmView.value?.focus()
}

async function onFormat(type: FormatType): Promise<void> {
  commitTypingBurst()
  const range = currentSelection()
  const { startDelta, endDelta } = markdownEditor.computeFormatToggleShift(range, type)
  const wasFormatted = markdownEditor.isFormatted(range, type)
  const openLength = markdownEditor.getFormatMarkerOpenLength(type)

  editorView.simulateFormatAction(type, range)

  await nextTick()
  if (startDelta === 0 && endDelta === 0) {
    // Formattazioni di riga (Quote/Heading): computeFormatToggleShift non le
    // copre (restituisce {0,0}), continuano a usare lo spostamento uniforme.
    repositionSelection(range, wasFormatted ? -openLength : openLength)
  } else {
    repositionSelection(range, startDelta, endDelta)
  }
  cmView.value?.focus()
}

async function onList(operation: ListOperationType, listType?: ListType): Promise<void> {
  commitTypingBurst()
  const range = currentSelection()

  if (operation === ListOperationType.CREATE_LIST) {
    const { startDelta, endDelta } = markdownEditor.computeListToggleShift(range, listType)

    editorView.simulateListAction(new ListActionRequest(operation, listType), range)
    await nextTick()

    repositionSelection(range, startDelta, endDelta)
  } else {
    editorView.simulateListAction(new ListActionRequest(operation, listType), range)
  }

  cmView.value?.focus()
}

async function onTableOp(operation: TableOperationType): Promise<void> {
  commitTypingBurst()
  const range = currentSelection()
  try {
    const request = new TableActionRequest(operation)
    const newCursorPosition = markdownEditor.computeTableOperationCursor(request, range)
    editorView.simulateTableRequest(request, range)
    await nextTick()
    setCursorPosition(newCursorPosition)
  } catch (error) {
    if (error instanceof InvalidTableDimensionError) {
      showToast(error.message)
    } else {
      throw error
    }
  }
  cmView.value?.focus()
}

const showLinkModal = ref(false)
const linkModalInitialUrl = ref('')
const linkModalInitialLabel = ref('')
const linkModalIsEditing = ref(false)
let linkModalRange = new TextRange(0, 0)

function openLinkModal(): void {
  commitTypingBurst()
  linkModalRange = currentSelection()
  const existing = markdownEditor.getLinkAt(linkModalRange)
  linkModalIsEditing.value = existing.operation === LinkOperationType.EDIT_LINK
  linkModalInitialUrl.value = existing.url ?? ''
  linkModalInitialLabel.value = existing.label ?? currentSelectedText()
  showLinkModal.value = true
}

function submitLink(url: string, label: string): void {
  commitTypingBurst()
  const operation = linkModalIsEditing.value ? LinkOperationType.EDIT_LINK : LinkOperationType.INSERT_LINK
  editorView.simulateLinkAction(new LinkActionRequest(operation, url, label), linkModalRange)
  showLinkModal.value = false
  cmView.value?.focus()
}

function removeLink(): void {
  commitTypingBurst()
  editorView.simulateLinkAction(new LinkActionRequest(LinkOperationType.REMOVE_LINK), linkModalRange)
  showLinkModal.value = false
  cmView.value?.focus()
}

const showTableModal = ref(false)

async function submitTable(rowCount: number, colCount: number): Promise<void> {
  commitTypingBurst()
  try {
    const request = new TableActionRequest(TableOperationType.CREATE_TABLE, rowCount, colCount)
    const newCursorPosition = markdownEditor.computeTableOperationCursor(request, currentSelection())
    editorView.simulateTableAction(rowCount, colCount)
    await nextTick()
    setCursorPosition(newCursorPosition)
  } catch (error) {
    if (error instanceof InvalidTableDimensionError) {
      showToast(error.message)
    } else {
      throw error
    }
  }
  showTableModal.value = false
}

function onUndo(): void {
  commitTypingBurst()
  editorView.simulateAction('undo')
  cmView.value?.focus()
}

function onRedo(): void {
  commitTypingBurst()
  editorView.simulateAction('redo')
  cmView.value?.focus()
}

async function onSave(): Promise<void> {
  commitTypingBurst()
  editorView.simulateAction('save')
}

async function onOpen(): Promise<void> {
  commitTypingBurst()
  editorView.simulateAction('open')
}

function onViewMode(mode: ViewMode): void {
  viewMode.value = mode
  editorView.setViewMode(mode)
}

async function onExport(format: ExportFormat): Promise<void> {
  try {
    const blob = await noteModel.exportContent(format)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nota.${format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    showToast(`Esportato in ${format.toUpperCase()}`, 'success')
  } catch (error: any) {
    showToast(error.message ?? "Errore durante l'esportazione")
  }
}

const showAIRequestModal = ref(false)
const aiRequestModalMode = ref<'translate' | 'distant_writing'>('translate')
let pendingAIType = ''
const lastAIRequestText = ref('')

function onAIOperation(rawType: string): void {
  const [type, hatType] = rawType.split(':')

  if (type === 'translate') {
    aiRequestModalMode.value = 'translate'
    pendingAIType = type
    showAIRequestModal.value = true
    return
  }

  if (type === 'distant_writing') {
    aiRequestModalMode.value = 'distant_writing'
    pendingAIType = type
    showAIRequestModal.value = true
    return
  }

  const range = currentSelection()
  const text = currentSelectedText()

  if (!text) {
    showToast('Seleziona del testo prima di richiedere questa operazione')
    return
  }

  const params = type === 'hat_analysis' ? { hat_type: hatType } : {}
  lastAIRequestText.value = text
  aiPanelView.simulateSubmitRequest(new RequestedOperation(type, params, text, range))
}

function submitAIRequestModal(params: Record<string, string>): void {
  showAIRequestModal.value = false
  const range =
    pendingAIType === 'distant_writing' ? new TextRange(content.value.length, content.value.length) : currentSelection()
  const text = pendingAIType === 'distant_writing' ? '' : currentSelectedText()

  if (pendingAIType === 'translate' && !text) {
    showToast('Seleziona del testo da tradurre prima di continuare')
    return
  }

  lastAIRequestText.value = text
  aiPanelView.simulateSubmitRequest(new RequestedOperation(pendingAIType, params, text, range))
}

async function acceptProposal(): Promise<void> {
  commitTypingBurst()
  aiPanelView.simulateProposalAction(ProposalActionType.ACCEPT)

  const insertedRange = aiController.getLastAcceptedRange()
  if (insertedRange) {
    await nextTick()
    // Riseleziona esattamente il testo appena inserito dalla proposta
    // accettata (non più il range della selezione originaria, che può avere
    // una lunghezza diversa): serve applicare il range ASSOLUTO calcolato,
    // non uno spostamento relativo (vedi selectRange).
    selectRange(insertedRange)
  }

  cmView.value?.focus()
}

function rejectProposal(): void {
  aiPanelView.simulateProposalAction(ProposalActionType.REJECT)
}

function regenerateProposal(): void {
  aiPanelView.simulateProposalAction(ProposalActionType.REGENERATE)
}

function interruptAIOperation(): void {
  aiPanelView.simulateProposalAction(ProposalActionType.INTERRUPT)
}

function dismissError(): void {
  aiPanelView.simulateProposalAction(ProposalActionType.INTERRUPT)
}

/**
 * Chiede conferma al browser prima di chiudere la scheda/finestra o
 * ricaricare la pagina, se ci sono modifiche non salvate. Il testo del
 * messaggio non è personalizzabile nei browser moderni (Chrome, Firefox,
 * Safari lo ignorano per motivi di sicurezza, mostrando sempre un messaggio
 * generico proprio): impostare comunque `returnValue` e chiamare
 * `preventDefault()` è quello che fa scattare il dialogo nativo.
 */
function onBeforeUnloadWindow(event: BeforeUnloadEvent): void {
  if (!isDirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(async () => {
  await testConnection()
  window.addEventListener('beforeunload', onBeforeUnloadWindow)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnloadWindow)
})

/**
 * Selezione REALE attualmente applicata a CodeMirror (non il valore che il
 * codice intendeva applicare: un bug può nascondersi proprio nel passaggio
 * "calcolato correttamente ma mai davvero applicato all'editor"). Esposta
 * solo per i test (App.smoke.test.ts); restituisce numeri semplici, non
 * l'istanza di CodeMirror stessa, per non far trapelare i suoi tipi interni
 * nella superficie pubblica del componente.
 */
function getCurrentSelectionForTesting(): { from: number; to: number } | null {
  const view = cmView.value
  if (!view) return null
  const { from, to } = view.state.selection.main
  return { from, to }
}

/** Imposta una selezione reale in CodeMirror, solo per i test: permette di
 *  simulare "l'utente ha selezionato del testo" senza un vero trascinamento
 *  del mouse (non disponibile in jsdom). */
function setSelectionForTesting(from: number, to: number): void {
  const view = cmView.value
  if (!view) return
  view.dispatch({ selection: { anchor: from, head: to } })
}

defineExpose({ getCurrentSelectionForTesting, setSelectionForTesting })
</script>

<template>
  <main class="app">
    <TopBar
      :save-status="saveStatus"
      :view-mode="viewMode"
      :can-undo="canUndo"
      :can-redo="canRedo"
      @format="onFormat"
      @list="onList"
      @table-op="onTableOp"
      @insert-link="openLinkModal"
      @insert-table="showTableModal = true"
      @copy="onCopy"
      @cut="onCut"
      @paste="onPaste"
      @undo="onUndo"
      @redo="onRedo"
      @save="onSave"
      @open="onOpen"
      @export="onExport"
      @ai-operation="onAIOperation"
      @view-mode="onViewMode"
    />

    <section class="workspace" :class="`view-${viewMode.toLowerCase()}`">
      <section v-if="viewMode !== ViewMode.PREVIEW_ONLY" class="panel">
        <div class="panel-header">
          <h2>Markdown</h2>
        </div>

        <MarkdownEditor
          :model-value="content"
          :extensions="extensions"
          @update:model-value="onEditorInput"
          @ready="handleReady"
        />
      </section>

      <section v-if="viewMode !== ViewMode.EDITOR_ONLY" class="panel">
        <div class="panel-header">
          <h2>Anteprima</h2>
        </div>

        <MarkdownPreview :html="compiledMarkdown" @invalid-link="onInvalidLinkClick" />
      </section>
    </section>

    <LinkModal
      v-if="showLinkModal"
      :initial-url="linkModalInitialUrl"
      :initial-label="linkModalInitialLabel"
      :is-editing="linkModalIsEditing"
      @close="showLinkModal = false"
      @submit="submitLink"
      @remove="removeLink"
    />

    <TableModal v-if="showTableModal" @close="showTableModal = false" @submit="submitTable" />

    <AIRequestModal
      v-if="showAIRequestModal"
      :mode="aiRequestModalMode"
      @close="showAIRequestModal = false"
      @submit="submitAIRequestModal"
    />

    <LoadingModal
      v-if="aiState instanceof ProcessingState"
      title="Generazione in corso..."
      @interrupt="interruptAIOperation"
    />

    <ResultModal
      v-if="aiState instanceof ProposalReadyState"
      :operation-type="aiState.proposal.operationType"
      :selected-text="lastAIRequestText"
      :proposal-content="aiState.proposal.content"
      @close="rejectProposal"
      @accept="acceptProposal"
      @regenerate="regenerateProposal"
    />

    <ErrorModal v-if="aiState instanceof ErrorState" :message="aiState.message" @close="dismissError" />

    <Toast v-if="toastVisible" :message="toastMessage" :type="toastType" @close="dismissToast" />
  </main>
</template>
