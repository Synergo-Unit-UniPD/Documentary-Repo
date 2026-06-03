<script setup lang="ts">
type SuggestionMode = 'hat' | 'distant'

defineProps<{
  mode: SuggestionMode
  selectedText: string
  suggestedText: string
  suggestionComment: string
}>()

const emit = defineEmits<{
  close: []
  accept: []
}>()
</script>

<template>
  <div class="modal-overlay">
    <div class="modal large-modal">
      <div class="modal-header">
        <h2>{{ mode === 'hat' ? 'Cappello Rosso' : 'Distant Writing' }}</h2>
        <button class="close-button" @click="emit('close')">×</button>
      </div>

      <p class="modal-subtitle">
        {{
          mode === 'hat'
            ? 'Proposta generata a partire dal testo selezionato.'
            : 'Proposta generata a partire dalla richiesta inserita.'
        }}
      </p>

      <div v-if="selectedText" class="result-box">
        <strong>Testo selezionato</strong>
        <p>{{ selectedText }}</p>
      </div>

      <div class="result-box">
        <strong>Proposta</strong>
        <span class="box-hint">Questa è la proposta che verrà inserita nel testo.</span>
        <p>{{ suggestedText }}</p>
      </div>

      <div v-if="mode === 'hat' && suggestionComment" class="result-box">
        <strong>Commento secondo il Cappello Rosso</strong>
        <span class="box-hint">Questo commento non verrà inserito nel Markdown.</span>
        <p>{{ suggestionComment }}</p>
      </div>

      <div class="modal-actions">
        <button @click="emit('close')">Rifiuta</button>
        <button class="primary" @click="emit('accept')">Accetta</button>
      </div>
    </div>
  </div>
</template>