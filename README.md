# Second Brain

Repository ufficiale del progetto **Second Brain**, sviluppato dal gruppo **Synergo Unit** nell'ambito del corso di **Ingegneria del Software** dell'Università degli Studi di Padova (A.A. 2025/2026), in collaborazione con **Zucchetti S.p.A.**.

## Descrizione

Second Brain è un'applicazione di *note taking* supportata da modelli di *Large Language Models (LLM)*, finalizzata ad assistere l'utente nella produzione, organizzazione e rielaborazione di contenuti testuali.

## Documentazione

La documentazione ufficiale del progetto è pubblicata tramite GitHub Pages ed è disponibile al seguente indirizzo:

https://synergo-unit-unipd.github.io/Second-Brain/

## Struttura della repository

```text
Second-Brain/
├── assets/
├── docs/
├── mvp/
├── poc/
├── scripts/
└── README.md
```

`mvp/` contiene il prodotto sviluppato in fase PB (Frontend Vue 3, Backend FastAPI, test, Docker Compose, CI — vedi [`mvp/README.md`](mvp/README.md) per il dettaglio). `poc/` contiene il Proof of Concept della fase RTB, artefatto "usa e getta" a livello architetturale, mantenuto come riferimento storico ma non più attivo: per lo sviluppo, il testing e l'esecuzione del prodotto si fa riferimento esclusivamente a `mvp/`.

## Team di sviluppo

**Synergo Unit** – Gruppo 20

Corso di Ingegneria del Software
Università degli Studi di Padova
Anno Accademico 2025/2026

## Licenza

Il contenuto della repository ha ambiti di licenza distinti:

- **`mvp/`** (codice sorgente) e le sottocartelle **`doc_tecnici/`** all'interno
  di `docs/RTB` e `docs/PB` (Specifica Tecnica, Analisi dei
  Requisiti, Manuale Utente e altra documentazione tecnica
  del prodotto) sono rilasciati sotto licenza **MIT** — vedi [`LICENSE`](LICENSE).
- Il resto della documentazione (materiale gestionale, verbali, slide,
  template, riferimenti normativi) è prodotto per finalità didattiche
  nell'ambito del corso di Ingegneria del Software dell'Università degli
  Studi di Padova e non è coperto dalla licenza MIT.