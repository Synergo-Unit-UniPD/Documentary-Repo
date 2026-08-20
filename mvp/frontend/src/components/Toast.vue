<script setup lang="ts">
defineProps<{
  message: string
  type: 'error' | 'success' | 'info'
}>()

const emit = defineEmits<{
  close: []
}>()

const ICONS: Record<'error' | 'success' | 'info', string> = {
  error: '⚠',
  success: '✓',
  info: 'ℹ',
}
</script>

<template>
  <div class="toast" :class="type" role="alert">
    <span class="toast-icon">{{ ICONS[type] }}</span>
    <span class="toast-message">{{ message }}</span>
    <button class="toast-close" aria-label="Chiudi notifica" @click="emit('close')">&times;</button>
  </div>
</template>
