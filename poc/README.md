# Second Brain – Proof of Concept

## Descrizione

Second Brain è un editor Markdown assistito da Intelligenza Artificiale sviluppato come Proof of Concept (PoC).

L'applicazione consente di scrivere e modificare documenti Markdown tramite un'interfaccia web, fornendo funzionalità di supporto alla scrittura basate su Large Language Models (LLM).

Il PoC è composto da:

- Frontend sviluppato con Vue 3 e TypeScript;
- Editor Markdown basato su CodeMirror;
- Backend sviluppato con FastAPI;
- Containerizzazione tramite Docker e Docker Compose.

---

## Requisiti

Per eseguire il PoC è necessario avere installato:

- Docker Desktop;
- Google Chrome o Microsoft Edge per usare correttamente importazione e salvataggio locale dei file Markdown.

---

## Configurazione LLM

Prima dell'avvio creare nella cartella `poc/` un file `.env` con il seguente contenuto:

```env
ZUCCHETTI_LLM_BASE_URL=https://llm.padova.zucchettitest.it
ZUCCHETTI_LLM_API_KEY=INSERIRE_API_KEY
```

Il file .env non deve essere versionato.
---

## Struttura del progetto

```text
poc/
├── backend/
├── frontend/
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## Avvio del progetto

Aprire un terminale nella cartella:

```bash
poc/
```

e avviare i container eseguendo:

```bash
docker compose up --build
```

Al termine dell'avvio verranno creati e avviati:

* il container frontend;
* il container backend.

L'applicazione sarà disponibile all'indirizzo:

```text
http://localhost:5173
```

---

## Arresto del progetto

Per arrestare i container:

```bash
docker compose down
```

---

## Funzionalità disponibili
### Editor Markdown

All'avvio l'editor viene aperto vuoto. L'utente può iniziare a scrivere una nuova nota oppure importare un file Markdown locale.

### Importazione file

È possibile importare un file Markdown (.md) presente sul proprio dispositivo.

### Salvataggio file

È possibile salvare le modifiche effettuate sul file aperto oppure creare una nuova nota Markdown.

### Anteprima live

L'anteprima del documento viene aggiornata in tempo reale durante la scrittura.

### Grassetto

Permette di applicare o rimuovere automaticamente la formattazione Markdown **testo**.

### Cappello Rosso

Il testo selezionato viene analizzato secondo il Cappello Rosso del metodo dei Sei Cappelli per Pensare. Il sistema restituisce:
- una proposta di riscrittura;
- un commento emotivo, che non viene inserito nel documento.

### Distant Writing

Permette di generare nuovo testo a partire da una richiesta inserita dall'utente. La proposta viene inserita nel punto del cursore solo dopo accettazione.

### Connessione backend

L'interfaccia mostra lo stato della connessione al backend.

---

## Architettura

```text
Frontend (Vue + TypeScript)
            │
            ▼
      Backend (FastAPI)
            │
            ▼
            LLM
```

### Frontend

Gestisce:

- interfaccia utente;
- editor Markdown;
- anteprima in tempo reale;
- importazione e salvataggio locale dei file;
- selezione del testo;
- accettazione o rifiuto delle proposte generate.

### Backend

Gestisce:

- API REST;
- costruzione dei prompt;
- comunicazione con il modello LLM;
- restituzione delle risposte al frontend.

---

## API utilizzate

### Stato backend

```http
GET /api/status
```

### Cappello Rosso

```http
POST /api/red-hat
```

Request:

```JSON
{
  "text": "testo selezionato"
}
```

Response:

```JSON
{
  "proposal": "testo riscritto",
  "comment": "analisi emotiva"
}
```

### Distant Writing

```http
POST /api/distant-writing
```

Request:

```JSON
{
  "prompt": "richiesta dell'utente"
}
```

Response:

```JSON
{
  "proposal": "testo generato"
}
```
--- 
## Note

Il backend è progettato per poter integrare differenti Large Language Models senza modificare il frontend.

L'integrazione specifica dell'LLM può essere configurata e sostituita indipendentemente dalla componente client.