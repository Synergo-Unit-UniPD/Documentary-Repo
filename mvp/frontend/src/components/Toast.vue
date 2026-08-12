<script setup lang="ts">
defineProps<{
  message: string
  type: 'error' | 'success'
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="toast" :class="type" role="alert">
    <span class="toast-icon">{{ type === 'error' ? '⚠' : '✓' }}</span>
    <span class="toast-message">{{ message }}</span>
    <button class="toast-close" aria-label="Chiudi notifica" @click="emit('close')">&times;</button>
  </div>
</template>
