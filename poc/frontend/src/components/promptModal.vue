<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  close: []
  generate: []
}>()
</script>

<template>
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>Distant Writing</h2>
        <button class="close-button" aria-label="Chiudi" @click="emit('close')">&times;</button>
      </div>

      <p class="modal-subtitle">Descrivi il testo che vuoi generare.</p>

      <textarea
        :value="modelValue"
        placeholder="Esempio: scrivi una conclusione breve e professionale..."
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />

      <div class="modal-actions">
        <button @click="emit('close')">Annulla</button>
        <button class="primary" @click="emit('generate')">Genera</button>
      </div>
    </div>
  </div>
</template>