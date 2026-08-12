<script setup lang="ts">
defineProps<{
  message: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>Errore durante l'operazione AI</h2>
        <button class="close-button" aria-label="Chiudi" @click="emit('close')">&times;</button>
      </div>

      <p class="modal-subtitle">Il documento non è stato modificato.</p>

      <div class="result-box error-box">
        <p>{{ message }}</p>
      </div>

      <div class="modal-actions">
        <button class="primary" @click="emit('close')">Chiudi</button>
      </div>
    </div>
  </div>
</template>
