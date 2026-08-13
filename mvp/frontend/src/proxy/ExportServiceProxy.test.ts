import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ExportServiceProxy } from './ExportServiceProxy'

describe('ExportServiceProxy', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.clearAllMocks()
  })

  it('invia una richiesta POST a /api/export/{format} con il contenuto della nota', async () => {
    const mockBlob = new Blob(['contenuto'], { type: 'application/pdf' })
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      blob: async () => mockBlob,
    })

    const proxy = new ExportServiceProxy('http://localhost:8000')
    const result = await proxy.exportNote('pdf', '# Titolo')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/export/pdf',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: '# Titolo' }),
      }),
    )
    expect(result).toBe(mockBlob)
  })

  it('solleva un errore se la risposta non è ok', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: false,
      text: async () => 'Formato non supportato',
    })

    const proxy = new ExportServiceProxy('http://localhost:8000')
    await expect(proxy.exportNote('html', 'testo')).rejects.toThrow(
      "Errore durante l'esportazione in formato html: Formato non supportato",
    )
  })
})
