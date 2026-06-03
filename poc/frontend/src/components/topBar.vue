<script setup lang="ts">
defineProps<{
  apiStatus: string
}>()

const emit = defineEmits<{
  bold: []
  redHat: []
  distantWriting: []
  importDocument: []
  saveDocument: []
}>()

</script>

<template>
  <header class="topbar">
    <div class="brand">
        <div class="brand-text">
            <h1>Second Brain</h1>
            <p>Editor Markdown con supporto LLM</p>
        </div>
    </div>

    <div class="actions">
        <button class="tool-button square" @click="emit('bold')" title="Grassetto">
            <strong>G</strong>
        </button>

        <div class="separator"></div>

        <button class="tool-button" @click="emit('redHat')">
            <svg class="icon hat-icon hat-icon-large" viewBox="0 0 64 64" fill="none">
                <path
                    d="M20 36.5C21.8 29.5 24.1 17 25.4 12.6C26.2 10 28.6 8.2 31.4 8.2H32.6C35.4 8.2 37.8 10 38.6 12.6C39.9 17 42.2 29.5 44 36.5"
                    fill="#e11d48"
                    stroke="#080808"
                    stroke-width="3"
                    stroke-linejoin="round"
                />
                <path
                    d="M17.5 35.5C21.2 32.6 25.8 31.2 32 31.2C38.2 31.2 42.8 32.6 46.5 35.5"
                    stroke="#080808"
                    stroke-width="3"
                    stroke-linecap="round"
                />
                <path
                    d="M8.5 41C13.2 36.8 21.5 34.6 32 34.6C42.5 34.6 50.8 36.8 55.5 41C57.2 42.5 56.4 45.2 54.1 45.8C48.2 47.4 40.7 48.4 32 48.4C23.3 48.4 15.8 47.4 9.9 45.8C7.6 45.2 6.8 42.5 8.5 41Z"
                    fill="#ef4444"
                    stroke="#080808"
                    stroke-width="3"
                    stroke-linejoin="round"
                />
                <path
                    d="M18 41.6C22.2 43 26.9 43.7 32 43.7C37.1 43.7 41.8 43 46 41.6"
                    stroke="#7f1d1d"
                    stroke-width="2.5"
                    stroke-linecap="round"
                />
            </svg>
            Cappello Rosso
        </button>

        <button class="tool-button" @click="emit('distantWriting')">
            <svg class="icon" viewBox="0 0 24 24" fill="none">
            <path
                d="M4 20L15.5 8.5"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
            />
            <path
                d="M13.5 6.5L17.5 10.5"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
            />
            <path
                d="M18 4.5L18.7 6.3L20.5 7L18.7 7.7L18 9.5L17.3 7.7L15.5 7L17.3 6.3L18 4.5Z"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linejoin="round"
            />
            <path
                d="M9 4.5L9.4 5.6L10.5 6L9.4 6.4L9 7.5L8.6 6.4L7.5 6L8.6 5.6L9 4.5Z"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linejoin="round"
            />
            </svg>
            Distant Writing
        </button>

        <div class="separator"></div>

        <button class="tool-button" @click="emit('importDocument')">
            <svg class="icon" viewBox="0 0 24 24" fill="none">
            <path
                d="M12 4V13M12 13L15 10M12 13L9 10"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M5 15V18C5 19.1 5.9 20 7 20H17C18.1 20 19 19.1 19 18V15"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
            />
            </svg>
            Importa
        </button>

        <button class="tool-button primary" @click="emit('saveDocument')">
            <svg class="icon" viewBox="0 0 24 24" fill="none">
            <path
                d="M5 4H16L19 7V19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V5C5 4.4 5.4 4 6 4H16Z"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linejoin="round"
            />
            <path
                d="M8 4V9H15V4"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linejoin="round"
            />
            <path
                d="M8 20V14H16V20"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linejoin="round"
            />
            </svg>
            Salva
        </button>

        <span class="status" :class="{ offline: apiStatus === 'Offline' }">
            {{ apiStatus }}
        </span>
        </div>
  </header>
</template>