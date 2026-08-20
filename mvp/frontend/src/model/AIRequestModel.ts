import { Subject } from './Subject'
import { Observer } from './Observer'
import { AIRequestState } from './AIRequestState'
import { IdleState } from './IdleState'
import { ProcessingState } from './ProcessingState'
import { ProposalReadyState } from './ProposalReadyState'
import { ErrorState } from './ErrorState'
import { AIService } from '../proxy/AIService'

/**
 * Modello centrale delegato alla gestione dello stato delle richieste AI.
 */
export class AIRequestModel implements Subject {
  private aiState: AIRequestState
  private observers: Observer[] = []
  private aiService: AIService
  /** Contatore di generazione: ogni richiesta in corso lo cattura all'avvio e lo
   *  verifica prima di applicare l'esito (successo o errore). Interrompere la
   *  richiesta (o avviarne una nuova) incrementa il contatore, così una risposta
   *  che arriva in ritardo da una richiesta ormai abbandonata viene ignorata
   *  invece di sovrascrivere lo stato Idle con una proposta o un errore "fantasma". */
  private requestGeneration = 0
  /** Durata minima (ms) di visualizzazione di ProcessingState (R2-P-O, VE-7.3:
   *  "tempo minimo di visualizzazione dell'indicatore di caricamento pari a
   *  circa 2 secondi"), indipendentemente da quanto velocemente risponda il
   *  servizio AI - evita un lampeggio troppo rapido del modale di
   *  caricamento per richieste che si risolvono quasi istantaneamente.
   *  Configurabile (default 2000ms reali) per permettere ai test di
   *  disattivarla esplicitamente passando 0, senza dover simulare il tempo. */
  private readonly minProcessingDurationMs: number

  constructor(aiService: AIService, minProcessingDurationMs: number = 2000) {
    this.aiService = aiService
    this.aiState = new IdleState()
    this.minProcessingDurationMs = minProcessingDurationMs
  }

  public attach(o: Observer): void {
    if (!this.observers.includes(o)) {
      this.observers.push(o)
    }
  }

  public detach(o: Observer): void {
    this.observers = this.observers.filter((obs) => obs !== o)
  }

  public notify(): void {
    for (const observer of this.observers) {
      observer.update()
    }
  }

  public getAIState(): AIRequestState {
    return this.aiState // Step 8 & 22
  }

  public async requestAIOperation(type: string, text: string, params: object): Promise<void> {
    const generation = ++this.requestGeneration
    const startedAt = Date.now()

    try {
      this.aiState = new ProcessingState()
      this.notify()

      const proposal = await this.aiService.requestOperation(type, text, params)

      if (generation !== this.requestGeneration) {
        // La richiesta è stata interrotta (o superata da una successiva) nel
        // frattempo: l'esito arrivato in ritardo non deve più avere effetto.
        return
      }

      await this.waitForMinimumProcessingDuration(startedAt)

      if (generation !== this.requestGeneration) {
        // L'utente potrebbe aver interrotto proprio durante l'attesa residua
        // (R2-P-O): ricontrolliamo anche dopo, non solo prima di attendere.
        return
      }

      this.aiState = new ProposalReadyState(proposal)
      this.notify()
    } catch (error: any) {
      if (generation !== this.requestGeneration) {
        return
      }

      await this.waitForMinimumProcessingDuration(startedAt)

      if (generation !== this.requestGeneration) {
        return
      }

      this.aiState = new ErrorState(error.message || "Errore durante l'operazione AI")
      this.notify()
    }
  }

  /**
   * Attende, se necessario, il tempo residuo per raggiungere
   * minProcessingDurationMs dall'avvio della richiesta (R2-P-O). Se il
   * servizio AI ha già impiegato più del minimo, non introduce alcuna
   * attesa aggiuntiva.
   */
  private waitForMinimumProcessingDuration(startedAt: number): Promise<void> {
    const elapsed = Date.now() - startedAt
    const remaining = this.minProcessingDurationMs - elapsed
    if (remaining <= 0) {
      return Promise.resolve()
    }
    return new Promise((resolve) => setTimeout(resolve, remaining))
  }

  public interruptAIOperation(): void {
    // Invalida la richiesta eventualmente ancora in volo (vedi requestAIOperation).
    this.requestGeneration++
    this.aiState = new IdleState()
    this.notify()
  }

  public acceptProposal(): void {
    // Step 19: aiState = Idle
    this.aiState = new IdleState()
    // Step 20: notify (-> Step 21 update su AIPanelView, Step 23 IdleState, Step 24 nasconde pannello)
    this.notify()
  }

  public rejectProposal(): void {
    this.aiState = new IdleState()
    this.notify()
  }

  public async listOperations(): Promise<string[]> {
    return this.aiService.listOperations()
  }
}
