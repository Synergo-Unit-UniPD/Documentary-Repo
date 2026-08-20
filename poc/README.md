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

## Requisiti

Per eseguire il PoC è necessario avere installato:

* Docker Desktop;
* Google Chrome o Microsoft Edge per utilizzare correttamente importazione e salvataggio locale dei file Markdown.

---

## Configurazione LLM

Le funzionalità basate su Large Language Models richiedono credenziali fornite dalla proponente.

Per motivi di sicurezza, il file `.env` non è versionato e non viene distribuito all'interno del repository.

Prima dell'avvio è quindi necessario creare nella cartella `poc/` un file `.env`.

È possibile partire dal file di esempio:

```bash
cp .env.example .env
```

Su Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Il file `.env` deve contenere:

```env
ZUCCHETTI_LLM_BASE_URL=https://llm.padova.zucchettitest.it
ZUCCHETTI_LLM_API_KEY=INSERIRE_API_KEY
```

Il valore `INSERIRE_API_KEY` deve essere sostituito con la chiave fornita dal proponente.

In assenza di una chiave valida, il backend viene avviato correttamente ma le funzionalità AI (Cappello Rosso e Distant Writing) non saranno disponibili.

---

## Struttura del progetto

```text
poc/
├── backend/
├── frontend/
├── .env.example
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

È possibile importare un file Markdown (`.md`) presente sul proprio dispositivo.

### Salvataggio file

È possibile salvare le modifiche effettuate sul file aperto oppure creare una nuova nota Markdown.

### Anteprima live

L'anteprima del documento viene aggiornata in tempo reale durante la scrittura.

### Grassetto

Permette di applicare o rimuovere automaticamente la formattazione Markdown:

```markdown
**testo**
```

### Cappello Rosso

Il testo selezionato viene analizzato secondo il Cappello Rosso del metodo dei Sei Cappelli per Pensare.

Il sistema restituisce:

* una proposta di riscrittura;
* un commento emotivo coerente con la proposta generata.

Il commento viene mostrato all'utente ma non viene inserito nel documento.

### Distant Writing

Permette di generare nuovo testo a partire da una richiesta inserita dall'utente.

La proposta viene inserita nel documento solo dopo l'accettazione esplicita dell'utente.

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

* interfaccia utente;
* editor Markdown;
* anteprima in tempo reale;
* importazione e salvataggio locale dei file;
* selezione del testo;
* accettazione o rifiuto delle proposte generate.

### Backend

Gestisce:

* API REST;
* costruzione dei prompt;
* comunicazione con il modello LLM;
* restituzione delle risposte al frontend.

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

## Tecnologie utilizzate

* Vue 3
* TypeScript
* CodeMirror
* FastAPI
* Docker
* Docker Compose
* Large Language Models tramite API compatibili OpenAI

---

## Note

Il backend è progettato per poter integrare differenti Large Language Models senza modificare il frontend.

L'integrazione specifica dell'LLM può essere configurata e sostituita indipendentemente dalla componente client.
