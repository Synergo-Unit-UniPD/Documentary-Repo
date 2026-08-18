import { describe, it, expect } from 'vitest'
import { NoteIOError } from './NoteIOError'

describe('NoteIOError', () => {
  it("dovrebbe istanziare correttamente l'eccezione di I/O", () => {
    const error = new NoteIOError('Errore di connessione al database')
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('NoteIOError')
    expect(error.message).toBe('Errore di connessione al database')
  })
})
