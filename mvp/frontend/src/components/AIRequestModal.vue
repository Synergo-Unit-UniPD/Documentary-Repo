<script setup lang="ts">
import { ref } from 'vue'

// Modale unico per le due operazioni AI che richiedono un input aggiuntivo
// dall'utente prima di poter essere lanciate (R50-F-O traduzione, R55-F-O
// Distant Writing). Tutte le altre operazioni (riassunto, riscrittura, Sei
// Cappelli) partono direttamente dalla selezione, senza input extra, e non
// passano da questo componente.
const props = defineProps<{
  mode: 'translate' | 'distant_writing'
}>()

const emit = defineEmits<{
  close: []
  submit: [params: Record<string, string>]
}>()

const targetLanguage = ref('en')
const userPrompt = ref('')

// Deve restare allineata a TranslateOperation.SUPPORTED_LANGUAGES nel
// backend (backend/AI_Domain/domain/operations.py): un valore qui non
// presente lì verrebbe rifiutato con errore di validazione lingua.
const LANGUAGES: { value: string; label: string }[] = [
  { value: 'en', label: 'Inglese' },
  { value: 'fr', label: 'Francese' },
  { value: 'es', label: 'Spagnolo' },
  { value: 'de', label: 'Tedesco' },
]

// Il payload inviato al backend dipende dalla modalità: solo uno dei due
// campi (target_language / user_prompt) è rilevante per volta, in base
// all'operazione AI che il genitore ha richiesto di aprire.
function submit(): void {
  if (props.mode === 'translate') {
    emit('submit', { target_language: targetLanguage.value })
  } else {
    emit('submit', { user_prompt: userPrompt.value })
  }
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ mode === 'translate' ? 'Traduci il testo selezionato' : 'Distant Writing' }}</h2>
        <button class="close-button" aria-label="Chiudi" @click="emit('close')">&times;</button>
      </div>

      <p v-if="mode === 'translate'" class="modal-subtitle">Scegli la lingua di destinazione.</p>
      <p v-else class="modal-subtitle">Descrivi il testo che vuoi generare.</p>

      <select v-if="mode === 'translate'" v-model="targetLanguage" class="language-select">
        <option v-for="lang in LANGUAGES" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
      </select>

      <textarea v-else v-model="userPrompt" placeholder="Esempio: scrivi una conclusione breve e professionale..." />

      <div class="modal-actions">
        <button @click="emit('close')">Annulla</button>
        <button class="primary" @click="submit">Genera</button>
      </div>
    </div>
  </div>
</template>
