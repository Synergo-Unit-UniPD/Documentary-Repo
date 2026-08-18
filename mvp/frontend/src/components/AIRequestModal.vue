<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  mode: 'translate' | 'distant_writing'
}>()

const emit = defineEmits<{
  close: []
  submit: [params: Record<string, string>]
}>()

const targetLanguage = ref('en')
const userPrompt = ref('')

const LANGUAGES: { value: string; label: string }[] = [
  { value: 'en', label: 'Inglese' },
  { value: 'fr', label: 'Francese' },
  { value: 'es', label: 'Spagnolo' },
  { value: 'de', label: 'Tedesco' },
]

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
