<script setup lang="ts">
const props = defineProps<{
  operationType: string
  selectedText: string
  proposalContent: string
}>()

const emit = defineEmits<{
  close: []
  accept: []
  regenerate: []
}>()

const OPERATION_LABELS: Record<string, string> = {
  summarize: 'Riassunto',
  translate: 'Traduzione',
  rewrite: 'Riscrittura',
  distant_writing: 'Distant Writing',
  hat_analysis: 'Analisi - Sei Cappelli per Pensare',
}

function baseOperationType(type: string): string {
  return type.split(':')[0]
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal large-modal">
      <div class="modal-header">
        <h2>{{ OPERATION_LABELS[baseOperationType(props.operationType)] ?? 'Proposta AI' }}</h2>
        <button class="close-button" aria-label="Chiudi" @click="emit('close')">&times;</button>
      </div>

      <p class="modal-subtitle">Proposta generata dal modello, pronta per essere valutata.</p>

      <div v-if="selectedText" class="result-box">
        <strong>Testo di partenza</strong>
        <p>{{ selectedText }}</p>
      </div>

      <div class="result-box">
        <strong>Proposta</strong>
        <span class="box-hint">Verrà inserita nel documento se scegli "Accetta".</span>
        <p>{{ proposalContent }}</p>
      </div>

      <div class="modal-actions">
        <button @click="emit('close')">Rifiuta</button>
        <button @click="emit('regenerate')">Rigenera</button>
        <button class="primary" @click="emit('accept')">Accetta</button>
      </div>
    </div>
  </div>
</template>
