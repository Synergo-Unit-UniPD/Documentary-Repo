<script setup lang="ts">
import Codemirror from 'vue-codemirror6'
import type { Extension } from '@codemirror/state'

defineProps<{
  modelValue: string
  extensions: Extension[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  ready: [payload: unknown]
}>()

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
