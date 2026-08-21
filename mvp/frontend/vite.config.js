import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// In Docker Compose il backend è raggiungibile come "backend:8000" sulla rete
// interna; per lo sviluppo locale senza container è possibile sovrascrivere
// questo indirizzo con la variabile d'ambiente VITE_BACKEND_URL.
const backendTarget = process.env.VITE_BACKEND_URL || 'http://backend:8000'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    watch: {
      usePolling: true
    },
    allowedHosts: true,
    // redirect all "/api" calls to backend container
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/**/*.test.ts',
        'src/__tests__/**',
        'src/main.ts',
        'src/vite-env.d.ts',
      ],
      // Soglie allineate a R1-Q-O (line coverage minima 80% sui moduli che
      // implementano i casi d'uso principali): fissate qualche punto sotto
      // la copertura reale raggiunta in fase PB (87,86% lines / 86,41%
      // statements / 86,11% functions / 81,97% branches), per lasciare
      // margine a piccole oscillazioni senza far fallire la CI, restando
      // comunque sempre sopra la soglia richiesta dal requisito.
      thresholds: {
        lines: 85,
        statements: 83,
        functions: 78,
        branches: 78,
      },
    },
  }
})