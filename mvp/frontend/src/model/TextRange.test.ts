import { describe, it, expect } from 'vitest'
import { TextRange } from './TextRange'

describe('TextRange', () => {
  it('dovrebbe inizializzare correttamente gli attributi start ed end', () => {
    const range = new TextRange(5, 15)

    expect(range.start).toBe(5)
    expect(range.end).toBe(15)
  })
})
