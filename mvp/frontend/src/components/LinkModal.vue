<script setup lang="ts">
import { ref } from 'vue'

// Modale unico per inserimento e modifica di un link (R29-F-O, R30-F-O):
// isEditing distingue le due modalità (titolo, campi precompilati con
// initialUrl/initialLabel, pulsante "Rimuovi link" per R31-F-O visibile
// solo in modifica).
const props = defineProps<{
  initialUrl?: string
  initialLabel?: string
  isEditing: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [url: string, label: string]
  remove: []
}>()

const url = ref(props.initialUrl ?? '')
const label = ref(props.initialLabel ?? '')

function submit(): void {
  // L'URL è obbligatorio (un link senza indirizzo non ha senso); la label
  // è invece facoltativa nel form, ma non nel Markdown risultante: se
  // lasciata vuota si usa l'URL stesso come testo visualizzato.
  if (!url.value.trim()) return
  emit('submit', url.value.trim(), label.value.trim() || url.value.trim())
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ isEditing ? 'Modifica link' : 'Inserisci link' }}</h2>
        <button class="close-button" aria-label="Chiudi" @click="emit('close')">&times;</button>
      </div>

      <label class="field-label" for="link-url">Indirizzo</label>
      <input id="link-url" v-model="url" class="text-input" type="text" placeholder="https://esempio.it" />

      <label class="field-label" for="link-label">Testo visualizzato</label>
      <input id="link-label" v-model="label" class="text-input" type="text" placeholder="(facoltativo)" />

      <div class="modal-actions">
        <button v-if="isEditing" @click="emit('remove')">Rimuovi link</button>
        <button @click="emit('close')">Annulla</button>
        <button class="primary" @click="submit">{{ isEditing ? 'Salva' : 'Inserisci' }}</button>
      </div>
    </div>
  </div>
</template>
