# Second Brain – Proof of Concept

## Descrizione

Second Brain è un editor Markdown assistito da Intelligenza Artificiale sviluppato come Proof of Concept (PoC).

L'applicazione consente di scrivere e modificare documenti Markdown tramite un'interfaccia web, fornendo funzionalità di supporto alla scrittura basate su Large Language Models (LLM).

Il PoC è composto da:

* Frontend sviluppato con Vue 3 e TypeScript;
* Editor Markdown basato su CodeMirror;
* Backend sviluppato con FastAPI;
* Containerizzazione tramite Docker e Docker Compose.

---

## Funzionalità disponibili

### Editor Markdown

Consente la scrittura e la modifica di documenti Markdown con anteprima in tempo reale.

### Importazione file

È possibile importare un file Markdown (`.md`) presente sul proprio dispositivo.

### Salvataggio file

È possibile salvare le modifiche effettuate sul file aperto oppure creare una nuova nota Markdown.

### Grassetto

Permette di applicare o rimuovere automaticamente la formattazione Markdown per il testo selezionato.

### Cappello Rosso

Funzionalità basata sul metodo dei Sei Cappelli per Pensare.

Il testo selezionato viene analizzato dal punto di vista emotivo e percettivo e viene proposta una riscrittura coerente con il Cappello Rosso.

### Distant Writing

Permette di generare nuovi contenuti a partire da una richiesta testuale inserita dall'utente.

### Connessione Backend

L'interfaccia verifica automaticamente la disponibilità del backend e ne mostra lo stato.

---

## Requisiti

Per eseguire il PoC è necessario avere installato:

* Docker Desktop

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

## Architettura

Il sistema è organizzato secondo un'architettura client-server.

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

* interfaccia utente;
* editor Markdown;
* anteprima in tempo reale;
* selezione del testo;
* gestione delle proposte generate.

### Backend

Gestisce:

* esposizione delle API REST;
* costruzione dei prompt;
* interazione con il Large Language Model;
* restituzione delle risposte al frontend.

---

## API utilizzate

### Stato del backend

```http
GET /api/status
```

### Cappello Rosso

```http
POST /api/red-hat
```

Request:

```json
{
  "text": "testo selezionato"
}
```

Response:

```json
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

```json
{
  "prompt": "richiesta dell'utente"
}
```

Response:

```json
{
  "proposal": "testo generato"
}
```

---

## Note

Il backend è progettato per poter integrare differenti Large Language Models senza modificare il frontend.

L'integrazione specifica dell'LLM può essere configurata e sostituita indipendentemente dalla componente client.
