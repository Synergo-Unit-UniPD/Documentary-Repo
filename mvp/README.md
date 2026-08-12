# Second Brain — MVP

[![CI](https://github.com/Synergo-Unit-UniPD/Second-Brain/actions/workflows/ci.yml/badge.svg)](https://github.com/Synergo-Unit-UniPD/Second-Brain/actions/workflows/ci.yml)
[![Coverage backend](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/sofdb/5a95435983605f413fb0e015f7e68deb/raw/second-brain-backend-coverage.json)](https://github.com/Synergo-Unit-UniPD/Second-Brain/actions/workflows/ci.yml)
[![Coverage frontend](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/sofdb/5a95435983605f413fb0e015f7e68deb/raw/second-brain-frontend-coverage.json)](https://github.com/Synergo-Unit-UniPD/Second-Brain/actions/workflows/ci.yml)

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
virtualenv Python (vedi sopra), seleziona l'interprete con
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

Se sei su Windows e non hai `make` installato, usa lo script PowerShell incluso, `ci.ps1`, che fa esattamente le stesse cose:

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

L'analisi statica (lint/format/type-check) è un gate: se fallisce, i test non partono nemmeno, per un feedback più veloce. I report di coverage vengono caricati come artifact scaricabili dalla pagina della run su GitHub Actions, e la percentuale viene pubblicata nei badge in cima a questo file (solo sui push a `main`).

## Soglie di coverage attuali

- **Backend**: 90% (attuale: ~95%)
- **Frontend**: 70% linee/statement, 65% branch/funzioni (attuale: ~80%/71%/70%)

Le soglie hanno un margine rispetto alla copertura reale: l'obiettivo è che la CI fallisca se la copertura *peggiora* in modo significativo, non che debba essere aggiornata a ogni piccola modifica. Si alzeranno gradualmente durante la revisione del codice.

---

<sub>Nota per chi mantiene la CI: i badge di coverage leggono da un Gist pubblico aggiornato automaticamente dalla pipeline (secret `GIST_SECRET` + variabile `GIST_ID` nelle Settings del repository). Se vanno rigenerati da zero, i passaggi sono in `.github/workflows/ci.yml` (step "Update ... coverage badge").</sub>