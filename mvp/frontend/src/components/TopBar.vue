<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { FormatType } from '../model/FormatType'
import { ListOperationType } from '../model/ListOperationType'
import { ListType } from '../model/ListType'
import { TableOperationType } from '../model/TableOperationType'
import { ViewMode } from '../model/ViewMode'

defineProps<{
  saveStatus: string
  viewMode: ViewMode
  canUndo: boolean
  canRedo: boolean
}>()

const emit = defineEmits<{
  format: [type: FormatType]
  list: [operation: ListOperationType, listType?: ListType]
  'table-op': [operation: TableOperationType]
  'insert-link': []
  'insert-table': []
  copy: []
  cut: []
  paste: []
  undo: []
  redo: []
  save: []
  open: []
  export: [format: 'pdf' | 'html' | 'json']
  'ai-operation': [type: string]
  'view-mode': [mode: ViewMode]
}>()

const ViewModeEnum = ViewMode
const aiMenuOpen = ref(false)
const hatMenuOpen = ref(false)
const exportMenuOpen = ref(false)
const tableMenuOpen = ref(false)

function toggleAiMenu(): void {
  aiMenuOpen.value = !aiMenuOpen.value
  hatMenuOpen.value = false
}

function selectAiOperation(type: string): void {
  emit('ai-operation', type)
  aiMenuOpen.value = false
  hatMenuOpen.value = false
}

function selectExport(format: 'pdf' | 'html' | 'json'): void {
  emit('export', format)
  exportMenuOpen.value = false
}

function selectTableOp(operation: TableOperationType): void {
  emit('table-op', operation)
  tableMenuOpen.value = false
}

function closeMenus(): void {
  aiMenuOpen.value = false
  hatMenuOpen.value = false
  exportMenuOpen.value = false
  tableMenuOpen.value = false
}

// Chiude qualunque menu a tendina aperto se l'utente clicca al di fuori della toolbar
// (es. dentro l'editor), non solo cliccando esplicitamente sullo sfondo della toolbar.
function handleDocumentClick(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (!target.closest('.topbar')) {
    closeMenus()
  }
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
</script>

<template>
  <header class="topbar" @click.self="closeMenus">
    <div class="topbar-top">
      <div class="brand">
        <div class="brand-text">
          <h1>Second Brain</h1>
          <p>Editor Markdown con supporto LLM</p>
        </div>
      </div>

      <div class="view-mode-switch">
        <button
          class="view-mode-option"
          :class="{ active: viewMode === ViewModeEnum.EDITOR_ONLY }"
          title="Solo editor"
          @click="emit('view-mode', ViewModeEnum.EDITOR_ONLY)"
        >
          Editor
        </button>
        <button
          class="view-mode-option"
          :class="{ active: viewMode === ViewModeEnum.SPLIT }"
          title="Editor e anteprima"
          @click="emit('view-mode', ViewModeEnum.SPLIT)"
        >
          Split
        </button>
        <button
          class="view-mode-option"
          :class="{ active: viewMode === ViewModeEnum.PREVIEW_ONLY }"
          title="Solo anteprima"
          @click="emit('view-mode', ViewModeEnum.PREVIEW_ONLY)"
        >
          Anteprima
        </button>
      </div>

      <div class="file-actions">
        <span class="status" :class="{ unsaved: saveStatus === 'Modifiche non salvate' }">
          {{ saveStatus }}
        </span>

        <button class="tool-button primary" title="Salva la nota" @click="emit('save')">
          <svg class="icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 4H16L19 7V19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V5C5 4.4 5.4 4 6 4H16Z"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linejoin="round"
            />
            <path d="M8 4V9H15V4" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
            <path d="M8 20V14H16V20" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
          </svg>
          Salva
        </button>

        <button class="tool-button" title="Importa un file Markdown" @click="emit('open')">
          <svg class="icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 4V13M12 13L15 10M12 13L9 10"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M5 15V18C5 19.1 5.9 20 7 20H17C18.1 20 19 19.1 19 18V15"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
            />
          </svg>
          Importa
        </button>

        <div class="dropdown">
          <button class="tool-button" title="Esporta la nota" @click.stop="exportMenuOpen = !exportMenuOpen">
            <svg class="icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 15V4M12 4L9 7M12 4L15 7"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M5 15V18C5 19.1 5.9 20 7 20H17C18.1 20 19 19.1 19 18V15"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
            </svg>
            Esporta
          </button>
          <div v-if="exportMenuOpen" class="dropdown-menu">
            <button @click="selectExport('pdf')">PDF</button>
            <button @click="selectExport('html')">HTML</button>
            <button @click="selectExport('json')">JSON</button>
          </div>
        </div>
      </div>
    </div>

    <div class="toolbar-groups">
      <div class="tool-group">
        <span class="group-label">Stile</span>
        <div class="group-buttons">
          <button class="tool-button square" title="Grassetto" @click="emit('format', FormatType.BOLD)">
            <strong>G</strong>
          </button>
          <button class="tool-button square" title="Corsivo" @click="emit('format', FormatType.ITALIC)">
            <em>I</em>
          </button>
          <button class="tool-button square" title="Sottolineato" @click="emit('format', FormatType.UNDERLINE)">
            <span style="text-decoration: underline">S</span>
          </button>
          <button class="tool-button square" title="Barrato" @click="emit('format', FormatType.STRIKETHROUGH)">
            <span style="text-decoration: line-through">B</span>
          </button>
          <button class="tool-button square" title="Citazione" @click="emit('format', FormatType.QUOTE)">
            &rdquo;
          </button>
          <button class="tool-button square" title="Intestazione" @click="emit('format', FormatType.HEADING)">H</button>
        </div>
      </div>

      <div class="tool-group">
        <span class="group-label">Elenchi</span>
        <div class="group-buttons">
          <button
            class="tool-button square"
            title="Elenco puntato (clic di nuovo per rimuovere)"
            @click="emit('list', ListOperationType.CREATE_LIST, ListType.UNORDERED)"
          >
            &bull;
          </button>
          <button
            class="tool-button square"
            title="Elenco numerato (clic di nuovo per rimuovere)"
            @click="emit('list', ListOperationType.CREATE_LIST, ListType.ORDERED)"
          >
            1.
          </button>
          <button
            class="tool-button square"
            title="Aumenta rientro"
            @click="emit('list', ListOperationType.INDENT_ITEM)"
          >
            &rarr;
          </button>
          <button
            class="tool-button square"
            title="Riduci rientro"
            @click="emit('list', ListOperationType.OUTDENT_ITEM)"
          >
            &larr;
          </button>
        </div>
      </div>

      <div class="tool-group">
        <span class="group-label">Link e tabelle</span>
        <div class="group-buttons">
          <button class="tool-button square" title="Inserisci link" @click="emit('insert-link')">&#128279;</button>
          <button class="tool-button square" title="Inserisci tabella" @click="emit('insert-table')">&#9638;</button>

          <div class="dropdown">
            <button class="tool-button square" title="Modifica tabella" @click.stop="tableMenuOpen = !tableMenuOpen">
              &#8942;
            </button>
            <div v-if="tableMenuOpen" class="dropdown-menu">
              <button @click="selectTableOp(TableOperationType.INSERT_ROW)">Aggiungi riga</button>
              <button @click="selectTableOp(TableOperationType.DELETE_ROW)">Rimuovi ultima riga</button>
              <button @click="selectTableOp(TableOperationType.INSERT_COLUMN)">Aggiungi colonna</button>
              <button @click="selectTableOp(TableOperationType.DELETE_COLUMN)">Rimuovi ultima colonna</button>
              <button @click="selectTableOp(TableOperationType.DELETE_TABLE)">Elimina tabella</button>
            </div>
          </div>
        </div>
      </div>

      <div class="tool-group">
        <span class="group-label">Modifica</span>
        <div class="group-buttons">
          <button class="tool-button square" title="Copia" @click="emit('copy')">
            <svg class="icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 11C6 8.17157 6 6.75736 6.87868 5.87868C7.75736 5 9.17157 5 12 5H15C17.8284 5 19.2426 5 20.1213 5.87868C21 6.75736 21 8.17157 21 11V16C21 18.8284 21 20.2426 20.1213 21.1213C19.2426 22 17.8284 22 15 22H12C9.17157 22 7.75736 22 6.87868 21.1213C6 20.2426 6 18.8284 6 16V11Z"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <path
                d="M6 19C4.34315 19 3 17.6569 3 16V10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H15C16.6569 2 18 3.34315 18 5"
                stroke="currentColor"
                stroke-width="1.5"
              />
            </svg>
          </button>
          <button class="tool-button square" title="Taglia" @click="emit('cut')">
            <svg class="icon" viewBox="0 0 24 24" fill="none">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M5.36676 3.22604C5.79421 2.87631 6.42423 2.93932 6.77396 3.36676L12 9.75415L17.226 3.36676C17.5758 2.93932 18.2058 2.87631 18.6332 3.22604C19.0607 3.57577 19.1237 4.20579 18.774 4.63324L13.2921 11.3333L15.4739 14H16.5C18.433 14 20 15.567 20 17.5V18C20 19.6569 18.6569 21 17 21C15.3431 21 14 19.6569 14 18V15.357L12 12.9125L10 15.357V18C10 19.6569 8.65685 21 7 21C5.34315 21 4 19.6569 4 18V17.5C4 15.567 5.567 14 7.5 14H8.52612L10.7079 11.3333L5.22604 4.63324C4.87632 4.20579 4.93932 3.57577 5.36676 3.22604ZM8 16H7.5C6.67157 16 6 16.6716 6 17.5V18C6 18.5523 6.44772 19 7 19C7.55228 19 8 18.5523 8 18V16ZM16 16V18C16 18.5523 16.4477 19 17 19C17.5523 19 18 18.5523 18 18V17.5C18 16.6716 17.3284 16 16.5 16H16Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button class="tool-button square" title="Incolla" @click="emit('paste')">
            <svg class="icon" viewBox="0 0 24 24" fill="none">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M12 0C11.2347 0 10.6293 0.125708 10.1567 0.359214C9.9845 0.44429 9.82065 0.544674 9.68861 0.62717L9.59036 0.688808C9.49144 0.751003 9.4082 0.803334 9.32081 0.853848C9.09464 0.984584 9.00895 0.998492 9.00053 0.999859C8.99983 0.999973 9.00019 0.999859 9.00053 0.999859C7.89596 0.999859 7 1.89543 7 3H6C4.34315 3 3 4.34315 3 6V20C3 21.6569 4.34315 23 6 23H18C19.6569 23 21 21.6569 21 20V6C21 4.34315 19.6569 3 18 3H17C17 1.89543 16.1046 1 15 1C15.0003 1 15.0007 1.00011 15 1C14.9916 0.998633 14.9054 0.984584 14.6792 0.853848C14.5918 0.80333 14.5086 0.751004 14.4096 0.688804L14.3114 0.62717C14.1793 0.544674 14.0155 0.44429 13.8433 0.359214C13.3707 0.125708 12.7653 0 12 0ZM16.7324 5C16.3866 5.5978 15.7403 6 15 6H9C8.25972 6 7.61337 5.5978 7.26756 5H6C5.44772 5 5 5.44772 5 6V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V6C19 5.44772 18.5523 5 18 5H16.7324ZM11.0426 2.15229C11.1626 2.09301 11.4425 2 12 2C12.5575 2 12.8374 2.09301 12.9574 2.15229C13.0328 2.18953 13.1236 2.24334 13.2516 2.32333L13.3261 2.37008C13.43 2.43542 13.5553 2.51428 13.6783 2.58539C13.9712 2.75469 14.4433 3 15 3V4H9V3C9.55666 3 10.0288 2.75469 10.3217 2.58539C10.4447 2.51428 10.57 2.43543 10.6739 2.37008L10.7484 2.32333C10.8764 2.24334 10.9672 2.18953 11.0426 2.15229Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button class="tool-button square" title="Annulla" :disabled="!canUndo" @click="emit('undo')">&#8630;</button>
          <button class="tool-button square" title="Ripeti" :disabled="!canRedo" @click="emit('redo')">&#8631;</button>
        </div>
      </div>

      <div class="tool-group">
        <span class="group-label">Assistente AI</span>
        <div class="group-buttons">
          <div class="dropdown">
            <button class="tool-button ai-button" @click.stop="toggleAiMenu">
              <svg class="icon" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 7C9.23858 7 7 9.23858 7 12C7 13.3613 7.54402 14.5955 8.42651 15.4972C8.77025 15.8484 9.05281 16.2663 9.14923 16.7482L9.67833 19.3924C9.86537 20.3272 10.6862 21 11.6395 21H12.3605C13.3138 21 14.1346 20.3272 14.3217 19.3924L14.8508 16.7482C14.9472 16.2663 15.2297 15.8484 15.5735 15.4972C16.456 14.5955 17 13.3613 17 12C17 9.23858 14.7614 7 12 7Z"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M12 4V3"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M18 6L19 5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M20 12H21"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M4 12H3"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M5 5L6 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M10 17H14"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Assistente AI
            </button>
            <div v-if="aiMenuOpen" class="dropdown-menu">
              <button @click="selectAiOperation('summarize')">Riassumi</button>
              <button @click="selectAiOperation('translate')">Traduci</button>
              <button @click="selectAiOperation('rewrite')">Riscrivi</button>
              <button @click="selectAiOperation('distant_writing')">Distant Writing</button>
              <button class="submenu-trigger" @click.stop="hatMenuOpen = !hatMenuOpen">
                Sei Cappelli per Pensare
                <span class="submenu-caret" :class="{ open: hatMenuOpen }">&rsaquo;</span>
              </button>
              <div v-if="hatMenuOpen" class="dropdown-submenu-inline">
                <button @click="selectAiOperation('hat_analysis:white')">&#9898; Bianco - fatti e dati</button>
                <button @click="selectAiOperation('hat_analysis:red')">&#128308; Rosso - emozioni</button>
                <button @click="selectAiOperation('hat_analysis:black')">&#9899; Nero - criticità</button>
                <button @click="selectAiOperation('hat_analysis:yellow')">&#128993; Giallo - benefici</button>
                <button @click="selectAiOperation('hat_analysis:green')">&#128994; Verde - creatività</button>
                <button @click="selectAiOperation('hat_analysis:blue')">&#128309; Blu - visione d'insieme</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
