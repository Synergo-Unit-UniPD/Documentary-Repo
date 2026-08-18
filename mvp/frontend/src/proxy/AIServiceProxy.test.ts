import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AIServiceProxy } from './AIServiceProxy'
import { Proposal } from '../model/Proposal'

describe('AIServiceProxy', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('dovrebbe recuperare la lista delle operazioni disponibili (GET api/ai/operations)', async () => {
    const mockOperations = ['summary', 'translate', 'red_hat']

    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockOperations,
    })

    const proxy = new AIServiceProxy('http://localhost:8000')
    const operations = await proxy.listOperations()

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/ai/operations',
      expect.objectContaining({ method: 'GET' }),
    )
    expect(operations).toEqual(mockOperations)
  })

  it('dovrebbe lanciare un errore col testo grezzo se il corpo della risposta non è JSON', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: false,
      text: async () => 'Internal Server Error',
    })

    const proxy = new AIServiceProxy('http://localhost:8000')
    await expect(proxy.listOperations()).rejects.toThrow('Errore nel recupero delle operazioni: Internal Server Error')
  })

  it('dovrebbe inviare una requestOperation e restituire una Proposal', async () => {
    const mockResponse = { content: 'Testo generato', operation_type: 'red_hat', created_at: new Date().toISOString() }
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const proxy = new AIServiceProxy('http://localhost:8000')
    const proposal = await proxy.requestOperation('red_hat', 'testo', {})

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/ai/operations',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type: 'red_hat', text: 'testo', params: {} }),
      }),
    )

    expect(proposal).toBeInstanceOf(Proposal)
    expect(proposal.content).toBe('Testo generato')
    expect(proposal.operationType).toBe('red_hat')
  })

  it('dovrebbe tradurre LLMUnavailableError in un messaggio amichevole, non nel JSON grezzo', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: false,
      text: async () =>
        JSON.stringify({ error: 'LLMUnavailableError', message: 'LLM non raggiungibile: Connection error.' }),
    })

    const proxy = new AIServiceProxy('http://localhost:8000')
    await expect(proxy.requestOperation('summarize', 'testo', {})).rejects.toThrow(
      'Il servizio AI non è raggiungibile al momento. Controlla la connessione e riprova.',
    )
  })

  it('dovrebbe tradurre LLMTimeoutError in un messaggio amichevole', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ error: 'LLMTimeoutError', message: 'Timeout LLM' }),
    })

    const proxy = new AIServiceProxy('http://localhost:8000')
    await expect(proxy.requestOperation('summarize', 'testo', {})).rejects.toThrow(
      'Il modello AI ha impiegato troppo tempo a rispondere. Riprova.',
    )
  })

  it('dovrebbe tradurre UnknownOperationError in un messaggio amichevole', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ error: 'UnknownOperationError', message: "Operazione AI sconosciuta: 'x'" }),
    })

    const proxy = new AIServiceProxy('http://localhost:8000')
    await expect(proxy.requestOperation('x', 'testo', {})).rejects.toThrow('Operazione AI non riconosciuta.')
  })

  it('per un tipo di errore non mappato usa il messaggio del backend, non il JSON grezzo', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ error: 'ErroreFuturo', message: 'Dettaglio specifico del nuovo errore' }),
    })

    const proxy = new AIServiceProxy('http://localhost:8000')
    await expect(proxy.requestOperation('summarize', 'testo', {})).rejects.toThrow(
      'Dettaglio specifico del nuovo errore',
    )
  })
})
