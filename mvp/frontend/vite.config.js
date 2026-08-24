import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// In Docker Compose il backend è raggiungibile come "backend:8000" sulla rete
// interna; per lo sviluppo locale senza container è possibile sovrascrivere
// questo indirizzo con la variabile d'ambiente VITE_BACKEND_URL.
const backendTarget = process.env.VITE_BACKEND_URL || 'http://backend:8000'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // I Test di Sistema in ../test_sistema che montano componenti Vue reali
      // (es. TS27, TS28) vivono fuori dalla root del progetto frontend: la
      // risoluzione di default dei package "nudi" (bare import) parte dal file
      // che li importa e risale l'albero delle cartelle, senza mai raggiungere
      // frontend/node_modules per file esterni a frontend/. L'alias punta
      // esplicitamente lì, così @vue/test-utils si risolve correttamente anche
      // da test_sistema/. Non serve per vue stesso, marked, ecc.: quei pacchetti
      // sono importati da dentro i file .vue in frontend/src/, che restano
      // "ancorati" a frontend/node_modules tramite il proprio percorso reale.
      '@vue/test-utils': fileURLToPath(new URL('./node_modules/@vue/test-utils', import.meta.url)),
    },
  },
  server: {
    // Necessario perché vitest (che riusa il server Vite) deve poter caricare
    // i Test di Sistema in ../test_sistema, al di fuori della root del
    // progetto frontend (vedi "test.include" più sotto).
    fs: { allow: ['..'] },
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
    // I Test di Sistema (test_sistema/TSxx.test.ts, cfr. Specifica dei Test)
    // vivono fuori da frontend/ perché esercitano l'applicazione nel suo
    // insieme (Model+View+Controller+Proxy reali) e non un singolo modulo di
    // frontend/src. Includerli qui li fa girare con lo stesso comando
    // (`npm run test:unit` / `make test-frontend` / CI) usato per i TU,
    // senza bisogno di un runner o una pipeline separata.
    include: ['src/**/*.{test,spec}.ts', '../test_sistema/**/*.test.ts'],
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
      // la copertura reale raggiunta in fase PB, TU + Test di Sistema inclusi
      // (89,75% lines / 88,51% statements / 89,72% functions / 83,61%
      // branches), per lasciare margine a piccole oscillazioni senza far
      // fallire la CI, restando comunque sempre sopra la soglia richiesta
      // dal requisito.
      thresholds: {
        lines: 85,
        statements: 83,
        functions: 78,
        branches: 78,
      },
    },
  }
})