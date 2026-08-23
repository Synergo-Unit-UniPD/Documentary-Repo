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

// Nei test sotto, il secondo argomento del costruttore (0) disattiva
// l'attesa minima di visualizzazione di ProcessingState (R2-P-O, default
// 2000ms reali): qui si verifica la logica di transizione degli stati, non
// la temporizzazione, quindi i test restano veloci e deterministici. Il
// comportamento reale della durata minima è verificato a parte, con i timer
// finti di Vitest, nel blocco "R2-P-O" più sotto.
describe('AIRequestModel', () => {
  it('dovrebbe seguire il diagramma di sequenza durante requestAIOperation', async () => {
    const mockProposal = new Proposal('Testo generato', 'red_hat', new Date())
    const mockAIService: AIService = {
      requestOperation: vi.fn().mockResolvedValue(mockProposal),
      listOperations: vi.fn().mockResolvedValue([]),
    }

    const model = new AIRequestModel(mockAIService, 0)
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

    const model = new AIRequestModel(mockAIService, 0)
    await model.requestAIOperation('red_hat', 'testo', {})

    expect(model.getAIState()).toBeInstanceOf(ErrorState)
  })

  it('dovrebbe delegare listOperations al proxy AIService', async () => {
    const mockOperations = ['summary', 'distant_writing']
    const mockAIService: AIService = {
      requestOperation: vi.fn(),
      listOperations: vi.fn().mockResolvedValue(mockOperations),
    }

    const model = new AIRequestModel(mockAIService, 0)
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

    const model = new AIRequestModel(mockAIService, 0)
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

    const model = new AIRequestModel(mockAIService, 0)
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

    const model = new AIRequestModel(mockAIService, 0)
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

    const model = new AIRequestModel(mockAIService, 0)

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

describe('AIRequestModel - durata minima di ProcessingState (R2-P-O, VE-7.3)', () => {
  it('con il servizio che risponde quasi istantaneamente, resta in ProcessingState finché non trascorrono ~2000ms', async () => {
    vi.useFakeTimers()
    try {
      const mockProposal = new Proposal('Testo generato', 'summarize', new Date())
      const mockAIService: AIService = {
        requestOperation: vi.fn().mockResolvedValue(mockProposal),
        listOperations: vi.fn().mockResolvedValue([]),
      }

      const model = new AIRequestModel(mockAIService) // durata minima di default (2000ms)
      const requestPromise = model.requestAIOperation('summarize', 'testo', {})

      // Il servizio si è già "risolto" (microtask), ma la durata minima non è
      // ancora trascorsa: lo stato deve restare ProcessingState.
      await vi.advanceTimersByTimeAsync(500)
      expect(model.getAIState()).toBeInstanceOf(ProcessingState)

      await vi.advanceTimersByTimeAsync(1600) // totale ~2100ms
      await requestPromise

      expect(model.getAIState()).toBeInstanceOf(ProposalReadyState)
    } finally {
      vi.useRealTimers()
    }
  })

  it('se il servizio impiega già più della durata minima, non introduce alcuna attesa aggiuntiva', async () => {
    vi.useFakeTimers()
    try {
      const mockProposal = new Proposal('Testo generato', 'summarize', new Date())
      let resolveRequest: (proposal: Proposal) => void
      const pending = new Promise<Proposal>((resolve) => {
        resolveRequest = resolve
      })
      const mockAIService: AIService = {
        requestOperation: vi.fn().mockReturnValue(pending),
        listOperations: vi.fn().mockResolvedValue([]),
      }

      const model = new AIRequestModel(mockAIService)
      const requestPromise = model.requestAIOperation('summarize', 'testo', {})

      await vi.advanceTimersByTimeAsync(5000) // ben oltre la durata minima
      resolveRequest!(mockProposal)
      await requestPromise

      // Nessuna attesa residua da aggiungere: la transizione avviene subito.
      expect(model.getAIState()).toBeInstanceOf(ProposalReadyState)
    } finally {
      vi.useRealTimers()
    }
  })

  it("un'interruzione manuale durante l'attesa residua (R73-F-O) resta valida: nessuna proposta appare dopo", async () => {
    vi.useFakeTimers()
    try {
      const mockProposal = new Proposal('Testo generato', 'summarize', new Date())
      const mockAIService: AIService = {
        requestOperation: vi.fn().mockResolvedValue(mockProposal),
        listOperations: vi.fn().mockResolvedValue([]),
      }

      const model = new AIRequestModel(mockAIService)
      const requestPromise = model.requestAIOperation('summarize', 'testo', {})

      await vi.advanceTimersByTimeAsync(500)
      // L'utente interrompe MENTRE si sta ancora attendendo il tempo minimo.
      model.interruptAIOperation()
      expect(model.getAIState()).toBeInstanceOf(IdleState)

      await vi.advanceTimersByTimeAsync(2000)
      await requestPromise

      // Lo stato deve restare Idle: l'interruzione non deve essere "ripresa"
      // dalla logica di attesa minima una volta trascorso il tempo.
      expect(model.getAIState()).toBeInstanceOf(IdleState)
    } finally {
      vi.useRealTimers()
    }
  })

  it('la durata minima si applica anche al percorso di errore', async () => {
    vi.useFakeTimers()
    try {
      const mockAIService: AIService = {
        requestOperation: vi.fn().mockRejectedValue(new Error('LLM non raggiungibile')),
        listOperations: vi.fn().mockResolvedValue([]),
      }

      const model = new AIRequestModel(mockAIService)
      const requestPromise = model.requestAIOperation('summarize', 'testo', {})

      await vi.advanceTimersByTimeAsync(500)
      expect(model.getAIState()).toBeInstanceOf(ProcessingState)

      await vi.advanceTimersByTimeAsync(1600)
      await requestPromise

      expect(model.getAIState()).toBeInstanceOf(ErrorState)
    } finally {
      vi.useRealTimers()
    }
  })
})
