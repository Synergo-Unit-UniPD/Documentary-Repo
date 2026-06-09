<script setup lang="ts">
import Codemirror from 'vue-codemirror6'

defineProps<{
  modelValue: string
  extensions: unknown[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  ready: [payload: unknown]
}>()
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
      @update:model-value="emit('update:modelValue', $event)"
      @ready="emit('ready', $event)"
    />
  </div>
</template>