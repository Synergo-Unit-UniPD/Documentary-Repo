<script setup lang="ts">
defineProps<{
  title?: string
}>()

const emit = defineEmits<{
  interrupt: []
}>()
</script>

<template>
  <div class="modal-overlay">
    <div class="loading-modal">
      <div class="spinner"></div>

      <h2>{{ title ?? 'Generazione in corso...' }}</h2>

      <p>Il modello sta elaborando la richiesta.</p>

      <div class="modal-actions" style="justify-content: center; margin-top: 20px">
        <button @click="emit('interrupt')">Interrompi</button>
      </div>
    </div>
  </div>
</template>
