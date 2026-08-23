<script setup lang="ts">
// Anteprima Markdown renderizzata (R46-F-O/R47-F-O). Implementa anche
// R88-F-O: i link con URL assoluto si aprono in una nuova scheda, quelli
// con URL non valido/incompleto vengono segnalati (evento invalid-link)
// SENZA alcuna navigazione, invece di lasciare che il browser tenti di
// risolvere un href relativo o malformato in modo silenzioso e confuso.
defineProps<{
  html: string
}>()

const emit = defineEmits<{
  'invalid-link': [href: string]
}>()

function onPreviewClick(event: MouseEvent): void {
  // closest('a') gestisce anche i click su elementi annidati dentro il tag
  // <a> (es. testo formattato in grassetto dentro un link).
  const link = (event.target as HTMLElement | null)?.closest('a')
  if (!link) return

  // v-html non è un router SPA: la navigazione va sempre intercettata e
  // gestita manualmente, altrimenti il browser ricaricherebbe l'intera
  // pagina perdendo lo stato dell'editor.
  event.preventDefault()

  const href = link.getAttribute('href') ?? ''
  // Un URL "assoluto" ha uno schema esplicito (http:, https:, mailto:, ...);
  // href relativi o vuoti non sono navigabili in modo affidabile fuori dal
  // contesto dell'app e vengono trattati come non validi (R88-F-O).
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(href)

  if (!hasScheme) {
    emit('invalid-link', href)
    return
  }

  window.open(href, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="preview-panel">
    <div class="preview-content" @click="onPreviewClick" v-html="html"></div>
  </div>
</template>
