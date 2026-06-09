<script setup lang="ts">
defineProps<{
  html: string
}>()
</script>

<template>
  <div class="preview-panel">
    <div class="preview-content" v-html="html"></div>
  </div>
</template>