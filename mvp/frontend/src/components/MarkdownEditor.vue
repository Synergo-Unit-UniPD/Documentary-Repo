<script setup lang="ts">
import Codemirror from 'vue-codemirror6'
import type { Extension } from '@codemirror/state'

// Wrapper "sottile" attorno a CodeMirror: il componente non conosce la
// sintassi Markdown né la logica di editing (che vive interamente in
// MarkdownContentEditor/EditorController, pattern MVC), si limita a
// mostrare il testo e a propagare gli eventi verso l'alto. Le extensions
// (syntax highlighting, keymap, ecc.) sono passate dal genitore.
defineProps<{
  modelValue: string
  extensions: Extension[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  ready: [payload: unknown]
}>()

// vue-codemirror6 può emettere undefined o un oggetto ancora da convertire
// in stringa (a seconda della modalità di update interna): si normalizza
// sempre a una string prima di propagare l'evento, così il genitore riceve
// un contratto stabile.
function onModelValueUpdate(value?: string | { toString(): string }): void {
  emit('update:modelValue', value === undefined ? '' : value.toString())
}
</script>

<template>
  <div class="editor-panel">
    <Codemirror
      class="markdown-codemirror"
      :model-value="modelValue"
      :extensions="extensions"
      :basic="true"
      :dark="true"
      :wrap="true"
      placeholder="Scrivi qui il tuo Markdown..."
      @update:model-value="onModelValueUpdate"
      @ready="emit('ready', $event)"
    />
  </div>
</template>
