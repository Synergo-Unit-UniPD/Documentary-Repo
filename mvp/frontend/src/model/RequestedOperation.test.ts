import { describe, it, expect } from 'vitest'
import { RequestedOperation } from './RequestedOperation'
import { TextRange } from './TextRange'

describe('RequestedOperation', () => {
  it('dovrebbe inizializzare correttamente type e params', () => {
    const params = { prompt: 'Genera un riassunto' }
    const operation = new RequestedOperation('distant_writing', params)

    expect(operation.type).toBe('distant_writing')
    expect(operation.params).toEqual(params)
  })

  it('dovrebbe inizializzare correttamente anche i campi opzionali text e range', () => {
    const range = new TextRange(3, 10)
    const operation = new RequestedOperation('summarize', {}, 'testo selezionato', range)

    expect(operation.text).toBe('testo selezionato')
    expect(operation.range).toBe(range)
  })
})
