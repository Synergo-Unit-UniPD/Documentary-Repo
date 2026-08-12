# Second Brain — MVP

[![CI](https://github.com/<GITHUB_USERNAME>/Second-Brain/actions/workflows/ci.yml/badge.svg)](https://github.com/<GITHUB_USERNAME>/Second-Brain/actions/workflows/ci.yml)
[![Coverage backend](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/<GITHUB_USERNAME>/<GIST_ID>/raw/second-brain-backend-coverage.json)](https://github.com/<GITHUB_USERNAME>/Second-Brain/actions/workflows/ci.yml)
[![Coverage frontend](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/<GITHUB_USERNAME>/<GIST_ID>/raw/second-brain-frontend-coverage.json)](https://github.com/<GITHUB_USERNAME>/Second-Brain/actions/workflows/ci.yml)

> I placeholder `<GITHUB_USERNAME>` e `<GIST_ID>` vanno sostituiti una volta
> completato il setup (vedi sezione "Setup dei badge di coverage" più sotto).
> Finché non lo fai, il badge CI funziona comunque; quelli di coverage
> mostreranno "invalid" finché il gist non esiste.

Editor Markdown con supporto AI (LLM). Frontend Vue 3 + TypeScript + CodeMirror, backend FastAPI + Python.

## Struttura

```
mvp/
├── backend/          FastAPI, dominio AI (pattern Strategy/Factory/Decorator), export PDF/HTML/JSON
├── frontend/          Vue 3 + TS, editor CodeMirror, pattern MVC "pull model"
├── docker-compose.yml
└── Makefile           scorciatoie per lint/test/coverage, identiche a quelle usate in CI
```

La pipeline CI (`.github/workflows/ci.yml`, alla radice del repository) si attiva **solo** per modifiche dentro `mvp/`: il resto del repository (documentazione, verbali) non la fa scattare.

## Avvio rapido (Docker)

```bash
cd mvp
docker compose up -d --build
```

Frontend: http://localhost:5173 — Backend: http://localhost:8000

Configura `mvp/.env` con le credenziali del modello LLM prima di avviare (vedi `ZUCCHETTI_LLM_*` in `backend/config.py`).

## Setup per sviluppo locale (senza Docker)

Serve per lanciare lint/test/coverage con lo stesso comando usato dalla CI, **prima di fare push**.

### Backend

```bash
cd mvp/backend
python3 -m venv .venv
source .venv/bin/activate          # su Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt   # include anche le dipendenze di runtime
```

### Frontend

```bash
cd mvp/frontend
npm install
```

## Setup VS Code

Il repository include `.vscode/extensions.json` e `.vscode/settings.json`
(alla radice del repo, non dentro `mvp/`). Aprendo la cartella del repo in VS
Code, l'editor propone da solo di installare le estensioni consigliate
(Python, Ruff, Volar per Vue, ESLint, Prettier, Vitest). Dopo aver creato il
virtualenv Python (vedi sotto), seleziona l'interprete con
`Ctrl+Shift+P` → "Python: Select Interpreter" → `mvp/backend/.venv`: da lì in
poi il pannello "Testing" di VS Code mostra ed esegue anche i test pytest,
oltre a quelli Vitest tramite l'estensione dedicata.

## Comandi locali (identici a quelli della CI)

Dalla cartella `mvp/` (richiede il venv Python attivo e `npm install` già eseguito):

| Comando               | Cosa fa                                                              |
| ---------------------- | --------------------------------------------------------------------- |
| `make lint`            | Lint backend (ruff) + frontend (eslint)                              |
| `make lint-fix`        | Come sopra, ma corregge automaticamente quello che può               |
| `make format`          | Formatta backend (ruff format) + frontend (prettier)                 |
| `make format-check`    | Verifica la formattazione senza modificare nulla (quello usato in CI)|
| `make typecheck`       | Type-check backend (mypy) + frontend (vue-tsc)                       |
| `make test`            | Esegue tutti i test (pytest + vitest)                                |
| `make coverage`        | Test + report di code coverage (soglie: 90% backend, 70% frontend)   |
| `make ci`              | **Riproduce l'intera pipeline CI in locale**, nello stesso ordine    |

**Prima di ogni push**, il modo più veloce per sapere se la CI passerà è:

```bash
cd mvp
make ci
```

Se `make ci` esce con codice 0, la pipeline su GitHub Actions dovrebbe passare. I report di coverage HTML restano in `backend/htmlcov/index.html` e `frontend/coverage/index.html` dopo aver lanciato `make coverage`.

### Windows senza `make`

Se sei su Windows e non hai `make` installato (né `winget`/`choco`/`scoop` per installarlo), usa lo script PowerShell incluso, `ci.ps1`, che fa esattamente le stesse cose:

```powershell
cd mvp
.\ci.ps1              # equivalente a "make ci"
.\ci.ps1 lint
.\ci.ps1 format-check
.\ci.ps1 typecheck
.\ci.ps1 test
.\ci.ps1 coverage
```

Se PowerShell rifiuta di eseguirlo (Execution Policy — capita di default su molti sistemi), lancialo così, vale solo per quella sessione di terminale:

```powershell
powershell -ExecutionPolicy Bypass -File .\ci.ps1 ci
```

In alternativa, per installare `make` in un secondo momento: `winget install GnuWin32.Make` richiede "App Installer" dal Microsoft Store (se `winget` stesso non è riconosciuto, è quello che manca). Non è comunque necessario: `ci.ps1` copre lo stesso identico flusso senza installare nulla.

### Comandi singoli, se serve isolare un problema

```bash
# Backend
cd mvp/backend
ruff check .              # lint
ruff format --check .     # formattazione
mypy .                    # type-check
pytest -v                 # test
pytest --cov=. --cov-report=term-missing   # test + coverage nel terminale

# Frontend
cd mvp/frontend
npx eslint .               # lint
npx prettier --check "src/**/*.{ts,vue}"   # formattazione
npm run type-check         # type-check (vue-tsc)
npm run test:unit          # test (esecuzione singola, non watch)
npm run test:coverage      # test + coverage
```

## Pipeline CI

Quattro job, in `.github/workflows/ci.yml`:

```
backend-static-analysis  →  backend-test (con coverage)
frontend-static-analysis →  frontend-test (con coverage + build)
```

L'analisi statica (lint/format/type-check) è un gate: se fallisce, i test non partono nemmeno, per un feedback più veloce. I report di coverage vengono caricati come artifact scaricabili dalla pagina della run su GitHub Actions.

## Soglie di coverage attuali

- **Backend**: 90% (attuale: ~95%)
- **Frontend**: 70% linee/statement, 65% branch/funzioni (attuale: ~80%/71%/70%)

Le soglie hanno un margine rispetto alla copertura reale: l'obiettivo è che la CI fallisca se la copertura *peggiora* in modo significativo, non che debba essere aggiornata a ogni piccola modifica. Si alzeranno gradualmente durante la revisione del codice.

## Setup dei badge di coverage (una tantum)

Il badge CI (in alto) funziona da subito, senza configurazione: GitHub genera
quell'URL automaticamente per ogni workflow. I badge di **coverage** invece
mostrano un numero dinamico (la percentuale reale, aggiornata a ogni push su
`main`) e per farlo servono un posto dove "scrivere" quel numero: usiamo un
[Gist](https://gist.github.com) pubblico + [shields.io](https://shields.io)
(endpoint badge), che è gratuito e non richiede la creazione di un account su
servizi terzi come Codecov. Va fatto una sola volta.

1. **Crea un Gist pubblico** su <https://gist.github.com/>. Basta che
   contenga un file, anche vuoto, chiamato `second-brain-backend-coverage.json`
   (il contenuto iniziale non conta: la CI lo sovrascriverà al primo push su
   `main`). Salvalo come "Public gist", non "Secret".
   Copia l'ID del gist dall'URL: `https://gist.github.com/<user>/`**`<GIST_ID>`**.

2. **Crea un Personal Access Token (PAT)** con permesso di scrivere sui gist:
   - Vai su GitHub → Settings (del tuo account, non del repo) → Developer
     settings → Personal access tokens → Tokens (classic) → Generate new token.
   - Seleziona **solo** lo scope `gist` (non serve altro).
   - Copia il token subito dopo averlo generato: GitHub lo mostra una volta sola.

3. **Aggiungi token e ID del gist al repository** (Settings del *repository*
   `Second-Brain`, non del tuo account):
   - Settings → Secrets and variables → Actions → tab **Secrets** → New
     repository secret → nome `GIST_SECRET`, valore il token del punto 2.
   - Stessa pagina, tab **Variables** → New repository variable → nome
     `GIST_ID`, valore l'ID del gist del punto 1.

4. **Sostituisci i placeholder** in cima a questo README:
   `<GITHUB_USERNAME>` con il tuo username GitHub, `<GIST_ID>` con l'ID del
   gist (lo stesso di sopra).

5. **Fai un push su `main`** che tocchi `mvp/**` (qualunque modifica va bene):
   la pipeline gira, i job `backend-test`/`frontend-test` aggiornano i due
   file dentro il gist con la percentuale reale, e i badge nel README
   iniziano a mostrare il numero corretto (può volerci un minuto o due prima
   che la cache di shields.io si aggiorni).

Finché non completi questi passaggi, gli step "Update ... coverage badge" in
CI falliscono silenziosamente (`continue-on-error: true`): non bloccano la
pipeline, semplicemente non fanno nulla.
