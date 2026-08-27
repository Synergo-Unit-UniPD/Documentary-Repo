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
├── test_sistema/      Test di Sistema (vitest): esercitano Model+View+Controller+Proxy reali
│                      end-to-end sui casi d'uso, eseguiti insieme ai test di frontend/ (vedi sotto)
├── docker-compose.yml
└── Makefile           scorciatoie per lint/test/coverage, identiche a quelle usate in CI
```

La pipeline CI (`.github/workflows/ci.yml`, alla radice del repository) si attiva **solo** per modifiche dentro `mvp/`: il resto del repository (documentazione, verbali) non la fa scattare.

## Avvio rapido (Docker)

### Al primo avvio
Crea un file `mvp/.env` con le credenziali del modello LLM fornite dalla proponente (vedi `ZUCCHETTI_LLM_*` in `backend/config.py`):

```bash
ZUCCHETTI_LLM_BASE_URL=<indirizzo fornito dalla proponente>
ZUCCHETTI_LLM_API_KEY=<chiave fornita dalla proponente>
ZUCCHETTI_LLM_MODEL=gemma4:12b
```

### Avvio

```bash
cd mvp
docker compose up -d --build
```

Frontend: http://localhost:5173 — Backend: http://localhost:8000

Negli avvii successivi al primo non serve ripetere `--build` né ricreare `.env`: basta `docker compose up -d` dalla cartella `mvp/`. Usa di nuovo `--build` solo dopo aver aggiornato le dipendenze (`package.json`/`requirements.txt`) o il Dockerfile.

**Nota per lo sviluppo tramite Docker**: entrambi i container montano il codice sorgente locale come volume e ricaricano automaticamente ad ogni modifica (`--reload` per il backend, server di sviluppo Vite per il frontend) — sono pensati per lo sviluppo, non per un'immagine di produzione.

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

Richiede **Node.js 22 o superiore** (coerente con la versione usata in CI e nel Dockerfile): `jsdom`, usato dai test dei componenti Vue, non supporta versioni precedenti.

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
| `make test`            | Esegue tutti i test (pytest + vitest, quest'ultimo comprensivo dei Test di Sistema in `test_sistema/`), **senza** verificare le soglie di coverage |
| `make coverage`        | Test + report di code coverage, con verifica delle soglie (vedi sotto) |
| `make test-sistema`    | Esegue solo i Test di Sistema (`test_sistema/`) in isolamento, senza i Test di Unità — comodo per iterare rapidamente su di essi durante lo sviluppo (non è un target separato in CI: in CI girano già insieme a `test-frontend`/`coverage-frontend`) |
| `make ci`              | **Riproduce l'intera pipeline CI in locale** (lint + format-check + typecheck + coverage + build), nello stesso ordine e con le stesse verifiche della pipeline reale |

**Prima di ogni push**, il modo più veloce per sapere se la CI passerà è:

```bash
cd mvp
make ci
```

Se `make ci` esce con codice 0, la pipeline su GitHub Actions dovrebbe passare: include già la verifica delle soglie di coverage (`make coverage`), non serve lanciarla separatamente. I report di coverage HTML restano comunque in `backend/htmlcov/index.html` e `frontend/coverage/index.html` al termine.

> **Test di Sistema (`test_sistema/`)**: sono richiamati automaticamente da `npm run test:unit` (quindi da `make test-frontend`, `make test`, `make coverage` e `make ci`), tramite `test.include` in `frontend/vite.config.js`. Non serve alcun comando o pipeline separati: un singolo `make ci` locale, o un singolo push, esegue e verifica sia i Test di Unità sia i Test di Sistema, con un unico report.

### Windows senza `make`

Se sei su Windows e non hai `make` installato, usa lo script PowerShell incluso, `ci.ps1`, che fa esattamente le stesse cose:

```powershell
cd mvp
.\ci.ps1              # equivalente a "make ci": lint + format-check + typecheck + coverage + build
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

Anche `ci.ps1` esegue `npm run test:unit`, quindi include automaticamente i Test di Sistema (`test_sistema/`) insieme a quelli di unità, senza bisogno di comandi aggiuntivi.

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
npx prettier --check "src/**/*.{ts,vue,css}"   # formattazione
npm run type-check         # type-check (vue-tsc)
npm run test:unit          # test (Test di Unità + Test di Sistema, esecuzione singola, non watch)
npm run test:coverage      # test + coverage
npx vitest run ../test_sistema   # solo i Test di Sistema, isolati dai Test di Unità
```

## Pipeline CI

Quattro job, in `.github/workflows/ci.yml`:

```
backend-static-analysis  →  backend-test (con coverage)
frontend-static-analysis →  frontend-test (con coverage + build)
```

`frontend-test` esegue sia i Test di Unità (`frontend/src/**`) sia i Test di Sistema (`test_sistema/`), con un unico comando e un unico report di coverage (si veda la nota nella sezione precedente).

L'analisi statica (lint/format/type-check) è un gate: se fallisce, i test non partono nemmeno, per un feedback più veloce. I report di coverage vengono caricati come artifact scaricabili dalla pagina della run su GitHub Actions, e la percentuale viene pubblicata nei badge in cima a questo file (solo sui push a `main`).

## Soglie di coverage attuali

- **Backend**: soglia 90% — attuale ~95%
- **Frontend**: soglia 85% linee, 83% statement, 78% funzioni, 78% branch — attuale ~89,8% linee, ~88,5% statement, ~89,7% funzioni, ~83,76% branch (calcolata su Test di Unità e Test di Sistema insieme, eseguiti dallo stesso comando)

Le soglie hanno un margine rispetto alla copertura reale: l'obiettivo è che la CI fallisca se la copertura *peggiora* in modo significativo, non che debba essere aggiornata a ogni piccola modifica. Sono state alzate gradualmente durante la revisione del codice (vedi `frontend/vite.config.js` per i valori sorgente e il dettaglio dei moduli esclusi).

## Licenza

Distribuito con licenza MIT — vedi [`LICENSE`](../LICENSE) alla radice della repository.

---

<sub>Nota per chi mantiene la CI: i badge di coverage leggono da un Gist pubblico aggiornato automaticamente dalla pipeline (secret `GIST_SECRET` + variabile `GIST_ID` nelle Settings del repository). Se vanno rigenerati da zero, i passaggi sono in `.github/workflows/ci.yml` (step "Update ... coverage badge").</sub>