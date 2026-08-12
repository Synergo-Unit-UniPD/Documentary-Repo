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
      // Soglia scelta in base alla copertura reale attuale (con un margine),
      // da alzare gradualmente durante la revisione del codice modulo per modulo.
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 65,
        branches: 65,
      },
    },
  }
})
