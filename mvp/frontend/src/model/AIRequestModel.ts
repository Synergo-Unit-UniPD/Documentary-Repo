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

  constructor(aiService: AIService) {
    this.aiService = aiService
    this.aiState = new IdleState()
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

    try {
      this.aiState = new ProcessingState()
      this.notify()

      const proposal = await this.aiService.requestOperation(type, text, params)

      if (generation !== this.requestGeneration) {
        // La richiesta è stata interrotta (o superata da una successiva) nel
        // frattempo: l'esito arrivato in ritardo non deve più avere effetto.
        return
      }

      this.aiState = new ProposalReadyState(proposal)
      this.notify()
    } catch (error: any) {
      if (generation !== this.requestGeneration) {
        return
      }

      this.aiState = new ErrorState(error.message || "Errore durante l'operazione AI")
      this.notify()
    }
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
