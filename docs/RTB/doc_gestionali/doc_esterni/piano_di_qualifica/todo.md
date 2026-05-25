Ciao! Il **Cruscotto di Valutazione** all'interno del Piano di Qualifica (PdQ) è la sezione operativa e "data-driven" in cui il team raccoglie l'evidenza empirica del proprio lavoro. Invece di limitarsi a dichiarare degli obiettivi, in questa sezione si mostrano i risultati reali delle misurazioni effettuate durante i vari Sprint, confrontandoli con le soglie di accettabilità e ottimalità per guidare il miglioramento continuo tramite il ciclo PDCA (Plan-Do-Check-Act).

In base allo standard seguito dal documento dell'altro gruppo (ispirato agli standard ISO/IEC 12207 per i processi e ISO/IEC 25010 per il prodotto), ecco la **lista logica delle cose da fare**, divise per area, spiegando per ognuna quali dati raccogliere e cosa indicano i rispettivi grafici.

---

### 1. Processi Primari: Fornitura (Gestione Economica e Avanzamento - EVM)

Questa è una delle parti più importanti e si basa sulla metodologia **EVM (Earned Value Management)**, che incrocia i tempi di sviluppo con i costi monetari del budget. Logicamente, per popolare questa sezione devi estrarre i dati dal vostro strumento di tracciamento delle ore (es. i consuntivi del Piano di Progetto).

* **Trend di Progetto (PV, AC, EV)**:
* *Che dati servono*: Per ogni Sprint, si calcolano tre valori monetari espressi in Euro (€). Il **Planned Value (PV)** rappresenta il valore del lavoro che si era pianificato di fare secondo il preventivo. L'**Actual Cost (AC)** indica il costo reale delle ore effettivamente spese dal team. L'**Earned Value (EV)** esprime il valore economico del lavoro effettivamente completato e verificato alla fine dello Sprint.
* *Cosa spiega il grafico*: Mostra l'andamento temporale e lo stato di salute generale del progetto. Viene rappresentato con un grafico a linee contenente le tre curve. Se la curva dell'EV si trova al di sotto del PV significa che siete in ritardo sulle scadenze; se l'AC si trova al di sopra dell'EV significa che state spendendo più risorse di quanto il valore prodotto giustifichi (inefficienza produttiva o debito tecnico).
* **Varianze di Progetto (Schedule Variance - SV e Budget Variance - BV)**:
* *Che dati servono*: Si ricavano applicando formule matematiche fisse basate sui dati precedenti, dove $SV = EV - PV$ e la varianza di budget mette in relazione il preventivo totale (BAC) con la stima a finire.
* *Cosa spiega il grafico*: Solitamente mostrato con un grafico a linee o a barre, indica lo scostamento esatto in Euro rispetto alla pianificazione ideale. Una Schedule Variance stabilmente sopra o vicina allo zero attesta la puntualità del team. Una flessione negativa di entrambe le varianze indica che un periodo critico ha causato sia ritardi sia extra-costi.


* **Indici di Performance (CPI e SPI)**:
* *Che dati servono*: Sono indici adimensionale calcolati come $CPI = EV / AC$ (efficienza dei costi) e $SPI = EV / PV$ (efficienza dei tempi).
* *Cosa spiega il grafico*: Mostra l'efficienza pura del team in ogni Sprint. Il valore ideale di riferimento è 1.00. Se gli indici scendono sotto le soglie accettabili (es. 0.90), il grafico evidenzia graficamente la necessità immediata di attuare azioni correttive organizzative.


* **Previsione di Spesa Finale (Estimate at Completion - EAC)**:
* *Che dati servono*: Si calcola dividendo il budget totale preventivato a inizio progetto (BAC) per il CPI attuale dello Sprint ($EAC = BAC / CPI$).
* *Cosa spiega il grafico*: È un grafico a linee che proietta il costo totale stimato del progetto alla fine dei giochi se si continua a lavorare con l'efficienza corrente. Serve al Responsabile di progetto per monitorare se la previsione di spesa rischia di sforare il budget massimo concordato con il committente.



---

### 2. Processi Primari: Sviluppo (Gestione dell'Ambito)

* **Requirements Stability Index (RSI)**:
* *Che dati servono*: Il numero totale di requisiti iniziali e la variazione numerica ($\Delta R$, ovvero requisiti aggiunti, modificati o eliminati) nel corso di ciascuna iterazione.
* *Cosa spiega il grafico*: Rappresenta la stabilità dei requisiti del software. Un indice vicino al 100% mostra che state lavorando su obiettivi consolidati, mentre repentine fluttuazioni indicano instabilità dell'analisi o continue richieste di modifica da parte del proponente (fenomeno dello *Scope Creep*).



---

### 3. Processi di Supporto: Documentazione

* **Indice di Gulpease e Correttezza Ortografica**:
* *Che dati servono*: Parametri testuali (numero di lettere, parole e frasi) estratti dai principali documenti scritti (Analisi dei Requisiti, Norme di Progetto, Piano di Qualifica, ecc.) e il conteggio di eventuali errori o refusi ortografici residui.
* *Cosa spiega il grafico*: Solitamente documentato tramite istogrammi, valuta l'accessibilità linguistica e la qualità formale dei testi. L'Indice di Gulpease deve superare la soglia di leggibilità (es. accettabile $\ge 40$, ottimo $\ge 60$), mentre gli errori ortografici devono tendere rapidamente a zero grazie alle revisioni.



---

### 4. Processi di Supporto: Verifica (Testing)

* **Code Coverage e Test Success Rate**:
* *Che dati servono*: Dati tecnici estratti automaticamente dai vostri strumenti di Continuous Integration (es. Jest, JUnit, GitHub Actions). Nello specifico, la percentuale di righe di codice coperte dai test e il tasso di successo dei test calcolato come $\frac{\text{Test Passati}}{\text{Test Eseguiti}} \times 100$.
* *Cosa spiega il grafico*: Misura l'estensione e la robustezza della vostra suite di test dinamici. Il Test Success Rate deve rimanere tassativamente al 100% per garantire che non vi siano regressioni nel software, mentre la percentuale di Code Coverage evidenzia se il codice rilasciato è opportunamente protetto da verifiche automatizzate prima del build.



---

### 5. Processi Organizzativi: Gestione e Controllo Interno

* **Sprint Goal Achievement (SGA)**:
* *Che dati servono*: Il rapporto percentuale tra gli obiettivi (o i task) pianificati durante la riunione di Sprint Planning e quelli effettivamente completati entro la fine dello Sprint.
* *Cosa spiega il grafico*: Misura la precisione e l'affidabilità della pianificazione del team. Se il valore è basso, indica che il team tende a sovrastimare la propria capacità produttiva (*Velocity*), rendendo necessaria una migliore scomposizione dei task.


* **Metrics Satisfaction**:
* *Che dati servono*: La percentuale di metriche totali del progetto che, a seguito dei calcoli effettuati, rientrano nelle soglie di accettabilità prefissate.
* *Cosa spiega il grafico*: È un indicatore sintetico (KPI) di altissimo livello che riassume in un'unica occhiata lo stato di adeguatezza dell'intero impianto di qualità del progetto.



---

### 6. Qualità di Prodotto (ISO/IEC 25010)

Mentre i punti precedenti misurano "come lavora il team" (qualità di processo), questa sezione conclusiva raccoglie le metriche intrinseche del software finale consegnato.

* **Copertura dei Requisiti Obbligatori**:
* *Che dati servono*: Il numero di requisiti obbligatori (definiti nell'Analisi dei Requisiti) che risultano effettivamente implementati e che superano i rispettivi Test di Sistema.
* *Cosa spiega*: Certifica il livello di adeguatezza funzionale del prodotto verso il cliente, e deve raggiungere obbligatoriamente il 100% in prossimità del rilascio finale.


* **Metriche statiche del codice (Complessità Ciclomatica, Accoppiamento, Densità dei Commenti)**:
* *Che dati servono*: Numeri estratti da analizzatori statici del codice sorgente (es. SonarQube, ESLint o estensioni specifiche) relativi alla complessità dei bivi decisionali nelle funzioni ($V(G)$), al numero di dipendenze esterne dei moduli (Fan-out) e alla percentuale di righe dedicate ai commenti esplicativi.
* *Cosa spiega*: Valuta la manutenibilità futura del software. Valori troppo alti di complessità o accoppiamento segnalano un codice ingarbugliato e fragile, difficile da aggiornare o correggere.


* **Affidabilità e Sicurezza (Failure Density, Availability, Vulnerabilità)**:
* *Che dati servono*: Numero di guasti rilevati per KLOC (migliaia di linee di codice), tempo di uptime del sistema durante le sessioni di esercizio e conteggio di vulnerabilità di sicurezza critiche rilevate nei pacchetti o nel codice.
* *Cosa spiega*: Monitora la robustezza dell'applicazione in un contesto operativo reale e l'assenza totale di falle di sicurezza che metterebbero a rischio il sistema.



---

### Logica della Divisione Temporale: La differenza tra RTB e PB

Per scrivere bene questo cruscotto, devi tenere conto che **non tutte le metriche possono essere estratte fin dal primo giorno**. La struttura logica prevede infatti una netta separazione temporale basata sulle tappe del progetto:

1. **Periodo RTB (Requirements and Technology Baseline)**: In questa fase iniziale il codice dell'applicazione vera e propria non esiste ancora diffusamente (c'è solo un prototipo sperimentale o *Proof of Concept*). Di conseguenza, nel cruscotto relativo alla RTB mostrerai i dati economici (EVM), l'indice dei requisiti (RSI), la qualità dei documenti (Gulpease ed errori ortografici) e l'efficienza organizzativa. Metriche come *Code Coverage*, *Test Success*, *Complessità Ciclomatica* o *Failure Density* risulteranno logicamente contrassegnate come **"Non Rilevate"** o non applicabili.
2. **Periodo PB (Product Baseline)**: Questa è la fase di sviluppo massivo del software (il *Minimum Viable Product*). In questa sezione del cruscotto, tutte le metriche precedentemente inattive entrano a pieno regime. Mostrerai la crescita costante della copertura dei test, i grafici di complessità del codice man mano che scrivete le funzioni, e l'abbattimento delle vulnerabilità di sicurezza, affiancandoli al monitoraggio economico degli ultimi Sprint di progetto.

In sintesi, per iniziare ti conviene predisporre un foglio di calcolo strutturato per **Sprint** in cui ogni membro inserisce i dati grezzi (ore spese, metriche dei tool di test, indici dei documenti). Da questa base dati centrale potrai calcolare le formule standard e generare i grafici di trend da commentare ed inserire nel cruscotto del tuo PdQ.