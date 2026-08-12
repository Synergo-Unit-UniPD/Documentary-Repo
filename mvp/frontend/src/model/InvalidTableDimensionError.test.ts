import { describe, it, expect } from 'vitest'
import { InvalidTableDimensionError } from './InvalidTableDimensionError'

describe('InvalidTableDimensionError', () => {
  it("dovrebbe istanziare correttamente l'eccezione con il messaggio fornito", () => {
    const error = new InvalidTableDimensionError('Dimensioni tabella non valide')
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('InvalidTableDimensionError')
    expect(error.message).toBe('Dimensioni tabella non valide')
  })
})
