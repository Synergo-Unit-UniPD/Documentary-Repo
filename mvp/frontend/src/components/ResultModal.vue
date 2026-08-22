<script setup lang="ts">
// Modale dedicato che mostra la proposta generata dall'AI separata dal
// testo della nota (R74-F-O), da cui l'utente può accettarla (R69-F-O),
// rifiutarla lasciando il documento invariato ("close", R70-F-O) o
// richiederne una nuova generazione (R71-F-O). È lo stesso componente per
// tutte le operazioni AI: cambia solo l'etichetta mostrata in intestazione.
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

// Etichetta leggibile per ciascun tipo di operazione (allineata alle
// classi AIOperation registrate in backend/AI_Domain/domain/operations.py).
// Se operationType non è mappato, si mostra un titolo generico invece di
// lasciare l'intestazione vuota.
const OPERATION_LABELS: Record<string, string> = {
  summarize: 'Riassunto',
  translate: 'Traduzione',
  rewrite: 'Riscrittura',
  distant_writing: 'Distant Writing',
  hat_analysis: 'Analisi - Sei Cappelli per Pensare',
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal large-modal">
      <div class="modal-header">
        <h2>{{ OPERATION_LABELS[props.operationType] ?? 'Proposta AI' }}</h2>
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
