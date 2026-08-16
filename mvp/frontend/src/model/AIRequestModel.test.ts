import { describe, it, expect, vi } from 'vitest'
import { AIRequestModel } from './AIRequestModel'
import { Observer } from './Observer'
import { IdleState } from './IdleState'
import { ProcessingState } from './ProcessingState'
import { ProposalReadyState } from './ProposalReadyState'
import { ErrorState } from './ErrorState'
import { AIService } from '../proxy/AIService'
import { Proposal } from './Proposal'

class MockObserver implements Observer {
  update = vi.fn()
}

describe('AIRequestModel', () => {
  it('dovrebbe seguire il diagramma di sequenza durante requestAIOperation', async () => {
    const mockProposal = new Proposal('Testo generato', 'red_hat', new Date())
    const mockAIService: AIService = {
      requestOperation: vi.fn().mockResolvedValue(mockProposal),
      listOperations: vi.fn().mockResolvedValue([]),
    }

    const model = new AIRequestModel(mockAIService)
    const observer = new MockObserver()
    model.attach(observer)

    const requestPromise = model.requestAIOperation('red_hat', 'testo', {})

    expect(model.getAIState()).toBeInstanceOf(ProcessingState)
    expect(observer.update).toHaveBeenCalledTimes(1)

    await requestPromise

    const finalState = model.getAIState()
    expect(finalState).toBeInstanceOf(ProposalReadyState)
    expect((finalState as ProposalReadyState).proposal).toBe(mockProposal)
    expect(observer.update).toHaveBeenCalledTimes(2)
  })

  it('dovrebbe gestire gli errori e passare in ErrorState', async () => {
    const mockAIService: AIService = {
      requestOperation: vi.fn().mockRejectedValue(new Error('Network error')),
      listOperations: vi.fn().mockResolvedValue([]),
    }

    const model = new AIRequestModel(mockAIService)
    await model.requestAIOperation('red_hat', 'testo', {})

    expect(model.getAIState()).toBeInstanceOf(ErrorState)
  })

  it('dovrebbe delegare listOperations al proxy AIService', async () => {
    const mockOperations = ['summary', 'distant_writing']
    const mockAIService: AIService = {
      requestOperation: vi.fn(),
      listOperations: vi.fn().mockResolvedValue(mockOperations),
    }

    const model = new AIRequestModel(mockAIService)
    const result = await model.listOperations()

    expect(mockAIService.listOperations).toHaveBeenCalledTimes(1)
    expect(result).toEqual(mockOperations)
  })
})
describe('AIRequestModel - interruzione (R73-F-O) e condizione di gara con risposte tardive', () => {
  it('interruptAIOperation riporta subito lo stato a Idle', () => {
    const mockAIService: AIService = {
      requestOperation: vi.fn(),
      listOperations: vi.fn().mockResolvedValue([]),
    }

    const model = new AIRequestModel(mockAIService)
    model.interruptAIOperation()

    expect(model.getAIState()).toBeInstanceOf(IdleState)
  })

  it("una risposta con successo che arriva DOPO l'interruzione non deve più mostrare la proposta", async () => {
    let resolveRequest: (proposal: Proposal) => void
    const pending = new Promise<Proposal>((resolve) => {
      resolveRequest = resolve
    })

    const mockAIService: AIService = {
      requestOperation: vi.fn().mockReturnValue(pending),
      listOperations: vi.fn().mockResolvedValue([]),
    }

    const model = new AIRequestModel(mockAIService)
    const observer = new MockObserver()
    model.attach(observer)

    const requestPromise = model.requestAIOperation('summarize', 'testo', {})
    expect(model.getAIState()).toBeInstanceOf(ProcessingState)

    // L'utente interrompe MENTRE la richiesta è ancora in volo
    model.interruptAIOperation()
    expect(model.getAIState()).toBeInstanceOf(IdleState)

    // La risposta del backend arriva comunque, in ritardo, dopo l'interruzione
    resolveRequest!(new Proposal('Contenuto tardivo', 'summarize', new Date()))
    await requestPromise

    // Lo stato deve restare Idle: la risposta tardiva non deve riaprire alcun modale
    expect(model.getAIState()).toBeInstanceOf(IdleState)
  })

  it("un errore (es. timeout) che arriva DOPO l'interruzione non deve mostrare il modale di errore", async () => {
    let rejectRequest: (error: Error) => void
    const pending = new Promise<Proposal>((_, reject) => {
      rejectRequest = reject
    })

    const mockAIService: AIService = {
      requestOperation: vi.fn().mockReturnValue(pending),
      listOperations: vi.fn().mockResolvedValue([]),
    }

    const model = new AIRequestModel(mockAIService)
    const requestPromise = model.requestAIOperation('summarize', 'testo', {})

    model.interruptAIOperation()
    expect(model.getAIState()).toBeInstanceOf(IdleState)

    // Il timeout lato Backend arriva dopo che l'utente ha già interrotto
    rejectRequest!(new Error('Timeout LLM'))
    await requestPromise

    // Nessun ErrorState "fantasma": l'interruzione dell'utente resta valida
    expect(model.getAIState()).toBeInstanceOf(IdleState)
  })

  it("avviare una NUOVA richiesta invalida allo stesso modo l'esito di quella precedente ancora in volo", async () => {
    let resolveFirst: (proposal: Proposal) => void
    const firstPending = new Promise<Proposal>((resolve) => {
      resolveFirst = resolve
    })

    const secondProposal = new Proposal('Seconda proposta', 'rewrite', new Date())
    const mockAIService: AIService = {
      requestOperation: vi.fn().mockReturnValueOnce(firstPending).mockResolvedValueOnce(secondProposal),
      listOperations: vi.fn().mockResolvedValue([]),
    }

    const model = new AIRequestModel(mockAIService)

    const firstRequest = model.requestAIOperation('summarize', 'primo testo', {})
    const secondRequest = model.requestAIOperation('rewrite', 'secondo testo', {})
    await secondRequest

    expect(model.getAIState()).toBeInstanceOf(ProposalReadyState)
    expect((model.getAIState() as ProposalReadyState).proposal).toBe(secondProposal)

    // La prima richiesta, ormai superata, si risolve tardi: non deve sovrascrivere la seconda
    resolveFirst!(new Proposal('Prima proposta (obsoleta)', 'summarize', new Date()))
    await firstRequest

    expect((model.getAIState() as ProposalReadyState).proposal).toBe(secondProposal)
  })
})
