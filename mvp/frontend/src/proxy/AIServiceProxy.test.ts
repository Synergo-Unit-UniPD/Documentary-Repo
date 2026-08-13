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

  it('dovrebbe recuperare la lista delle operazioni disponibili (GET api/ai-operations)', async () => {
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

  it('dovrebbe lanciare un errore se listOperations fallisce', async () => {
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
})
