<script setup lang="ts">
defineProps<{
  html: string
}>()

const emit = defineEmits<{
  'invalid-link': [href: string]
}>()

function onPreviewClick(event: MouseEvent): void {
  const link = (event.target as HTMLElement | null)?.closest('a')
  if (!link) return

  event.preventDefault()

  const href = link.getAttribute('href') ?? ''
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(href)

  if (!hasScheme) {
    emit('invalid-link', href)
    return
  }

  window.open(href, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="preview-panel">
    <div class="preview-content" @click="onPreviewClick" v-html="html"></div>
  </div>
</template>
