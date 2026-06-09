<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="modal-overlay">
    <div class="loading-modal">
      <div class="spinner"></div>

      <h2>{{ title ?? 'Generazione in corso...' }}</h2>

      <p>Il modello sta elaborando la richiesta.</p>
    </div>
  </div>
</template>