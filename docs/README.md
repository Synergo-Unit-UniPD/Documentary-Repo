# Documentazione

Questa cartella contiene la documentazione del progetto **Second Brain**.

La struttura è organizzata per fase di avanzamento e per tipologia di documento, in modo da separare la documentazione gestionale da quella tecnica e distinguere gli artefatti destinati all'uso interno da quelli destinati alla consegna esterna.

## Struttura generale

```text
docs/
├── CC/
├── RTB/
├── template/
└── rif_norm_ISO/
```

## Fasi di progetto

### `CC`

Contiene la documentazione relativa alla fase di **Candidatura Capitolati**, dedicata all'analisi dei capitolati e alla selezione del progetto da sviluppare.

### `RTB`

Contiene la documentazione relativa alla fase di **Requirements and Technology Baseline**, dedicata alla definizione dei requisiti, delle tecnologie e della pianificazione del progetto.

## Organizzazione dei documenti

All'interno delle diverse fasi di progetto, i documenti sono suddivisi principalmente in:

```text
doc_gestionali/
doc_tecnici/
```

I documenti gestionali riguardano pianificazione, qualità, norme, glossario e verbali.

I documenti tecnici riguardano analisi, requisiti, progettazione e altri contenuti tecnici del prodotto.

Quando necessario, i documenti sono ulteriormente suddivisi in:

```text
doc_interni/
doc_esterni/
verb_interni/
verb_esterni/
```

dove:

* `doc_interni/` contiene documenti destinati all'uso interno del gruppo;
* `doc_esterni/` contiene documenti destinati alla consegna o alla consultazione esterna;
* `verb_interni/` contiene i verbali degli incontri interni;
* `verb_esterni/` contiene i verbali degli incontri con proponente, committente o altri soggetti esterni.

## Slide

Il materiale di presentazione è contenuto nella cartella:

```text
RTB/slides/
```

ed è suddiviso in:

```text
diario_di_bordo/
presentazioni/
```

La cartella `diario_di_bordo/` contiene le slide utilizzate per il diario di bordo.

La cartella `presentazioni/` contiene le presentazioni ufficiali relative alle revisioni di progetto.

## Template

La cartella:

```text
template/
```

contiene i template LaTeX e le risorse condivise utilizzate per produrre la documentazione del progetto.

## Consultazione online

La documentazione approvata e pubblicata è consultabile anche tramite il sito documentale del progetto:

https://synergo-unit-unipd.github.io/Documentary-Repo/

## Compilazione dei documenti

La documentazione è sviluppata in LaTeX utilizzando Visual Studio Code con l'estensione **LaTeX Workshop**.

La compilazione dei documenti e la generazione dei PDF avvengono automaticamente tramite la configurazione condivisa del progetto.

## File ausiliari

Le cartelle dei documenti possono contenere file generati automaticamente dalla compilazione LaTeX, ad esempio:

```text
.aux
.log
.out
.toc
.fls
.fdb_latexmk
.synctex.gz
```

Questi file sono artefatti di compilazione e non rappresentano documenti finali.