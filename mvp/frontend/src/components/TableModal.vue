<script setup lang="ts">
import { ref, computed } from 'vue'

// Modale per l'inserimento di una nuova tabella Markdown (R36-F-O): la
// validazione dei parametri (righe/colonne > 0) avviene qui, lato client,
// prima ancora di costruire la TableActionRequest, così l'utente vede
// subito l'errore senza dover passare dal MarkdownContentEditor.
const emit = defineEmits<{
  close: []
  submit: [rowCount: number, colCount: number]
}>()

const rowCount = ref(2)
const colCount = ref(2)

const isValid = computed(() => rowCount.value > 0 && colCount.value > 0)

function submit(): void {
  // Guardia difensiva: il pulsante è già disabilitato quando !isValid,
  // ma si evita comunque di emettere un submit con dimensioni non valide
  // (es. se l'utente forza l'invio da tastiera).
  if (!isValid.value) return
  emit('submit', rowCount.value, colCount.value)
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>Inserisci tabella</h2>
        <button class="close-button" aria-label="Chiudi" @click="emit('close')">&times;</button>
      </div>

      <p class="modal-subtitle">Scegli il numero di righe e colonne.</p>

      <div class="table-dims-row">
        <div>
          <label class="field-label" for="table-rows">Righe</label>
          <input id="table-rows" v-model.number="rowCount" class="text-input" type="number" min="1" />
        </div>
        <div>
          <label class="field-label" for="table-cols">Colonne</label>
          <input id="table-cols" v-model.number="colCount" class="text-input" type="number" min="1" />
        </div>
      </div>

      <p v-if="!isValid" class="field-error">Righe e colonne devono essere numeri maggiori di zero.</p>

      <div class="modal-actions">
        <button @click="emit('close')">Annulla</button>
        <button class="primary" :disabled="!isValid" @click="submit">Inserisci</button>
      </div>
    </div>
  </div>
</template>
