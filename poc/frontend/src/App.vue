<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorSelection } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

import TopBar from './components/topBar.vue'
import MarkdownEditor from './components/markdownEditor.vue'
import MarkdownPreview from './components/markdownPreview.vue'
import PromptModal from './components/promptModal.vue'
import ResultModal from './components/resultModal.vue'
import LoadingModal from './components/loadingModal.vue'

import {
  getStatus,
  generateRedHatProposal,
  generateDistantWritingProposal
} from './services/api'

type SuggestionMode = 'hat' | 'distant'

const code = ref<string>('')
const lastSavedContent = ref<string>('')
const fileHandle = ref<any>(null)

const extensions = [markdown({ codeLanguages: languages }), oneDark]
const editorView = ref<EditorView | null>(null)

const connectionStatus = ref<string>('Verifica...')
const documentStatus = ref<string>('')
const operationStatus = ref<string>('')
const showPromptModal = ref(false)
const showResultModal = ref(false)

const isGenerating = ref(false)
const loadingTitle = ref('Generazione in corso...')

const prompt = ref('')
const suggestedText = ref('')
const suggestionComment = ref('')
const selectedText = ref('')
const suggestionMode = ref<SuggestionMode>('hat')
const savedRange = ref<{ from: number; to: number } | null>(null)
const savedCursor = ref<number | null>(null)

const apiStatus = computed(() => operationStatus.value || documentStatus.value || connectionStatus.value)
const compiledMarkdown = computed(() => DOMPurify.sanitize(marked(code.value) as string))

const setOperationStatus = (status: string, autoClear = true): void => {
  operationStatus.value = status

  if (!autoClear) return

  setTimeout(() => {
    if (operationStatus.value === status) {
      operationStatus.value = ''
    }
  }, 1800)
}

const handleReady = (payload: any): void => {
  editorView.value = payload.view ?? payload
}

const getView = (): EditorView | null => editorView.value

const testConnection = async (): Promise<void> => {
  try {
    await getStatus()
    connectionStatus.value = 'Online'
  } catch {
    connectionStatus.value = 'Offline'
  }
}

const importMarkdownFile = async (): Promise<void> => {
  if (!('showOpenFilePicker' in window)) {
    setOperationStatus('Import non supportato dal browser', false)
    return
  }

  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: 'Markdown',
          accept: {
            'text/markdown': ['.md'],
            'text/plain': ['.md', '.txt']
          }
        }
      ],
      multiple: false
    })

    const file = await handle.getFile()
    const content = await file.text()

    fileHandle.value = handle
    code.value = content
    lastSavedContent.value = content
    documentStatus.value = 'Salvato'
    setOperationStatus('File importato')
  } catch {
    setOperationStatus('Importazione annullata')
  }
}

const saveCurrentDocument = async (): Promise<void> => {
  if (!fileHandle.value && !('showSaveFilePicker' in window)) {
    setOperationStatus('Salvataggio non supportato dal browser', false)
    return
  }

  try {
    if (!fileHandle.value) {
      fileHandle.value = await (window as any).showSaveFilePicker({
        suggestedName: 'nota.md',
        types: [
          {
            description: 'Markdown',
            accept: {
              'text/markdown': ['.md'],
              'text/plain': ['.md']
            }
          }
        ]
      })
    }

    const writable = await fileHandle.value.createWritable()
    await writable.write(code.value)
    await writable.close()

    lastSavedContent.value = code.value
    documentStatus.value = 'Salvato'
    setOperationStatus('Salvato')
  } catch {
    setOperationStatus('Salvataggio annullato')
  }
}

watch(code, (newValue) => {
  documentStatus.value = newValue !== lastSavedContent.value ? 'Modifiche non salvate' : 'Salvato'
})

const insertBold = (): void => {
  const view = getView()
  if (!view) return

  const { from, to } = view.state.selection.main
  const selected = view.state.doc.sliceString(from, to)

  if (selected.startsWith('**') && selected.endsWith('**') && selected.length >= 4) {
    const unboldText = selected.slice(2, -2)

    view.dispatch({
      changes: { from, to, insert: unboldText },
      selection: EditorSelection.range(from, from + unboldText.length),
      scrollIntoView: true
    })

    view.focus()
    return
  }

  const before = view.state.doc.sliceString(Math.max(0, from - 2), from)
  const after = view.state.doc.sliceString(to, Math.min(view.state.doc.length, to + 2))

  if (!selected && before === '**' && after === '**') {
    view.dispatch({
      changes: [
        { from: to, to: to + 2, insert: '' },
        { from: from - 2, to: from, insert: '' }
      ],
      selection: EditorSelection.cursor(from - 2),
      scrollIntoView: true
    })

    view.focus()
    return
  }

  if (selected && before === '**' && after === '**') {
    view.dispatch({
      changes: [
        { from: to, to: to + 2, insert: '' },
        { from: from - 2, to: from, insert: '' }
      ],
      selection: EditorSelection.range(from - 2, to - 2),
      scrollIntoView: true
    })

    view.focus()
    return
  }

  if (selected) {
    view.dispatch({
      changes: { from, to, insert: `**${selected}**` },
      selection: EditorSelection.range(from + 2, to + 2),
      scrollIntoView: true
    })

    view.focus()
    return
  }

  view.dispatch({
    changes: { from, insert: '****' },
    selection: EditorSelection.cursor(from + 2),
    scrollIntoView: true
  })

  view.focus()
}

const openRedHat = async (): Promise<void> => {
  const view = getView()
  if (!view) return

  const { from, to } = view.state.selection.main
  const selected = view.state.doc.sliceString(from, to)

  if (!selected) {
    selectedText.value = ''
    suggestedText.value = 'Seleziona una porzione di testo prima di applicare il Cappello Rosso.'
    suggestionComment.value = ''
    suggestionMode.value = 'hat'
    savedRange.value = null
    showResultModal.value = true
    return
  }

  selectedText.value = selected
  savedRange.value = { from, to }
  suggestionMode.value = 'hat'

  try {
    loadingTitle.value = 'Analisi Cappello Rosso in corso...'
    isGenerating.value = true

    const data = await generateRedHatProposal(selected)

    suggestedText.value = data.proposal
    suggestionComment.value = data.comment
    showResultModal.value = true
  } catch (error) {
      console.error('ERRORE OPEN RED HAT:', error)
      suggestedText.value = 'Errore durante la generazione della proposta.'
      suggestionComment.value = String(error)
      suggestionMode.value = 'hat'
      showResultModal.value = true
      setOperationStatus('Errore LLM', false)
} finally {
    isGenerating.value = false
  }
}

const openDistantWriting = (): void => {
  const view = getView()
  if (!view) return

  savedCursor.value = view.state.selection.main.from
  suggestionMode.value = 'distant'
  prompt.value = ''
  showPromptModal.value = true
}

const generateDistantWriting = async (): Promise<void> => {
  suggestionMode.value = 'distant'

  try {
    loadingTitle.value = 'Generazione Distant Writing in corso...'
    isGenerating.value = true

    const data = await generateDistantWritingProposal(prompt.value)

    suggestedText.value = data.proposal
    suggestionComment.value = ''
    selectedText.value = ''
    showPromptModal.value = false
    showResultModal.value = true
  } catch (error) {
      console.error('ERRORE DISTANT WRITING:', error)
      suggestedText.value = 'Errore durante la generazione della proposta.'
      suggestionComment.value = String(error)
      selectedText.value = ''
      showPromptModal.value = false
      showResultModal.value = true
      setOperationStatus('Errore LLM', false)
  } finally {
      isGenerating.value = false
    }
}

const acceptSuggestion = (): void => {
  const view = getView()
  if (!view) return

  if (suggestionMode.value === 'hat' && savedRange.value) {
    view.dispatch({
      changes: {
        from: savedRange.value.from,
        to: savedRange.value.to,
        insert: suggestedText.value
      },
      selection: EditorSelection.cursor(savedRange.value.from + suggestedText.value.length),
      scrollIntoView: true
    })
  }

  if (suggestionMode.value === 'distant' && savedCursor.value !== null) {
    view.dispatch({
      changes: {
        from: savedCursor.value,
        insert: suggestedText.value
      },
      selection: EditorSelection.cursor(savedCursor.value + suggestedText.value.length),
      scrollIntoView: true
    })
  }

  closeModals()
  view.focus()
}

const closeModals = (): void => {
  showPromptModal.value = false
  showResultModal.value = false
  savedRange.value = null
  savedCursor.value = null
  selectedText.value = ''
  suggestedText.value = ''
  suggestionComment.value = ''
}

onMounted(async () => {
  await testConnection()
})
</script>

<template>
  <main class="app">
    <TopBar
      :api-status="apiStatus"
      @bold="insertBold"
      @red-hat="openRedHat"
      @distant-writing="openDistantWriting"
      @import-document="importMarkdownFile"
      @save-document="saveCurrentDocument"
    />

    <section class="workspace">
      <section class="panel">
        <div class="panel-header">
          <h2>Markdown</h2>
        </div>

        <MarkdownEditor
          v-model="code"
          :extensions="extensions"
          @ready="handleReady"
        />
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>Anteprima</h2>
        </div>

        <MarkdownPreview :html="compiledMarkdown" />
      </section>
    </section>

    <PromptModal
      v-if="showPromptModal"
      v-model="prompt"
      @close="closeModals"
      @generate="generateDistantWriting"
    />

    <ResultModal
      v-if="showResultModal"
      :mode="suggestionMode"
      :selected-text="selectedText"
      :suggested-text="suggestedText"
      :suggestion-comment="suggestionComment"
      @close="closeModals"
      @accept="acceptSuggestion"
    />

    <LoadingModal
      v-if="isGenerating"
      :title="loadingTitle"
    />
  </main>
</template>