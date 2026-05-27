<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Codemirror from 'vue-codemirror6'
import { markdown } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'
import { marked } from 'marked'

const code = ref<string>('# Ciao Mondo!\n\nScrivi qui il tuo **Markdown**.')
const extensions = [markdown({ codeLanguages: languages }), oneDark]
const compiledMarkdown = computed(() => {
  return marked(code.value) as string
})

// - - - - - TEST API - - - - -
const apiStatus = ref<string>('Verifica connessione al backend in corso...')

const testConnessione = async () => {
  try {
    const response = await fetch('/api/status')

    if (!response.ok) {
      throw new Error(`Errore del server backend: ${response.status} ❌`)
    }

    const response_status = await response.status
    apiStatus.value = `✅ Connesso al server backend, ${response_status} ✅`

  } catch (error) {
    apiStatus.value = `❌ Connessione al backend fallita: ${error instanceof Error ? error.message : 'Errore sconosciuto ❌'}`
  }
}

// Esegui il test quando il componente viene montato
onMounted(() => {
  testConnessione()
})
</script>

<template>
  <div class="api-banner" :class="{ 'error': apiStatus.includes('❌'), 'connected': apiStatus.includes('✅') }"> {{ apiStatus }} </div>

  <div class="editor-container">
    <!-- Editor panel -->
    <div class="editor-panel">
      <Codemirror v-model="code" :extensions="extensions" :basic="true" :dark="true" :wrap="true"
        placeholder="Scrivi qui il tuo Markdown..." />
    </div>

    <!-- Preview panel -->
    <div class="preview-panel">
      <div class="preview-content" v-html="compiledMarkdown"></div>
    </div>
  </div>
</template>


<!--css-->
<style scoped>
.api-banner {
  background-color: #707070;
  color: white;
  padding: 0.5rem 1rem;
  font-family: monospace;
  font-size: 0.9rem;
  text-align: center;
}
.api-banner.error {
  background-color: #c62828;
}
.api-banner.connected {
  background-color: #2e7d32;
}

.editor-container {
  display: flex;
  gap: 1rem;
  height: 100vh;
  padding: 1rem;
  background-color: #1e1e2f;
  /* sfondo scuro per abbinare il tema */
}

.editor-panel,
.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  border-radius: 8px;
  background-color: #282c34;
}

/* Assicura che l'editor occupi tutto lo spazio del pannello */
.editor-panel :deep(.cm-editor) {
  height: 100%;
}

.preview-content {
  padding: 1rem;
  color: #e0e0e0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-y: auto;
}

/* Stili base per l'HTML generato (Markdown) */
.preview-content h1,
.preview-content h2,
.preview-content h3 {
  color: #ffffff;
}

.preview-content code {
  background-color: #3a3f4b;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
}

.preview-content pre {
  background-color: #1e1e2f;
  padding: 0.5rem;
  border-radius: 6px;
  overflow-x: auto;
}

.preview-content a {
  color: #61dafb;
}
</style>
