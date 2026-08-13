import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NoteServiceProxy } from './NoteServiceProxy'
import { Note } from '../model/Note'
import { NoteIOError } from '../model/NoteIOError'

describe('NoteServiceProxy - Salvataggio e Apertura nota locale', () => {
  beforeEach(() => {
    // Mock globale della File System API del browser (cast ad any per TS)
    ;(globalThis as any).window = {
      showSaveFilePicker: vi.fn(),
      showOpenFilePicker: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
    delete (globalThis as any).window
  })

  it('dovrebbe eseguire il salvataggio per una nuova nota (noteID null/vuoto) aprendo il file picker, e restituire un id', async () => {
    const mockWritable = {
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    }
    const mockFileHandle = {
      createWritable: vi.fn().mockResolvedValue(mockWritable),
    }

    ;(globalThis.window as any).showSaveFilePicker.mockResolvedValue(mockFileHandle)

    const proxy = new NoteServiceProxy()
    const noteVuota = new Note('', 'Contenuto di test')

    const newId = await proxy.save(noteVuota)

    expect((globalThis.window as any).showSaveFilePicker).toHaveBeenCalledTimes(1)
    expect(mockFileHandle.createWritable).toHaveBeenCalledTimes(1)
    expect(mockWritable.write).toHaveBeenCalledWith('Contenuto di test')
    expect(mockWritable.close).toHaveBeenCalledTimes(1)
    expect(newId).toBeTruthy() // deve restituire un id da riusare nei salvataggi successivi
  })

  it("un secondo salvataggio con l'id restituito dal primo scrive direttamente, SENZA riaprire il file picker", async () => {
    const mockWritable = {
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    }
    const mockFileHandle = {
      createWritable: vi.fn().mockResolvedValue(mockWritable),
    }
    ;(globalThis.window as any).showSaveFilePicker.mockResolvedValue(mockFileHandle)

    const proxy = new NoteServiceProxy()

    // Primo salvataggio: nota vuota, apre il picker e ottiene un id
    const firstId = await proxy.save(new Note('', 'Prima versione'))
    expect((globalThis.window as any).showSaveFilePicker).toHaveBeenCalledTimes(1)

    // Secondo salvataggio: STESSO id restituito dal primo -> deve scrivere
    // direttamente, senza chiedere di nuovo dove salvare.
    const secondId = await proxy.save(new Note(firstId, 'Seconda versione'))

    expect((globalThis.window as any).showSaveFilePicker).toHaveBeenCalledTimes(1) // non richiamato una seconda volta
    expect(mockWritable.write).toHaveBeenNthCalledWith(2, 'Seconda versione')
    expect(secondId).toBe(firstId) // l'id resta lo stesso
  })

  it('salvare con un id sconosciuto (mai associato a un file in questa sessione) riapre comunque il file picker', async () => {
    const mockWritable = {
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    }
    const mockFileHandle = {
      createWritable: vi.fn().mockResolvedValue(mockWritable),
    }
    ;(globalThis.window as any).showSaveFilePicker.mockResolvedValue(mockFileHandle)

    const proxy = new NoteServiceProxy()
    await proxy.save(new Note('id-mai-visto-da-questo-proxy', 'Contenuto'))

    expect((globalThis.window as any).showSaveFilePicker).toHaveBeenCalledTimes(1)
  })

  it('dovrebbe lanciare NoteIOError in caso di errore della File System API al salvataggio', async () => {
    ;(globalThis.window as any).showSaveFilePicker.mockRejectedValue(new Error('User cancelled'))

    const proxy = new NoteServiceProxy()
    const noteVuota = new Note('', 'Contenuto')

    await expect(proxy.save(noteVuota)).rejects.toThrowError(NoteIOError)
  })

  it("dovrebbe eseguire l'apertura di una nota locale tramite file picker (Step 10-14) e restituire un id riusabile", async () => {
    const mockFile = {
      text: vi.fn().mockResolvedValue('Contenuto importato'),
    }
    const mockFileHandle = {
      getFile: vi.fn().mockResolvedValue(mockFile),
    }

    // L'API showOpenFilePicker restituisce sempre un array di handle
    ;(globalThis.window as any).showOpenFilePicker.mockResolvedValue([mockFileHandle])

    const proxy = new NoteServiceProxy()

    const note = await proxy.open()

    expect((globalThis.window as any).showOpenFilePicker).toHaveBeenCalledTimes(1)
    expect(mockFileHandle.getFile).toHaveBeenCalledTimes(1)
    expect(mockFile.text).toHaveBeenCalledTimes(1)
    expect(note.content).toBe('Contenuto importato')
    // L'id NON deve essere vuoto: deve essere associato all'handle del file
    // appena aperto, così un successivo Salva scrive lì direttamente.
    expect(note.id).not.toBe('')
  })

  it("salvare subito dopo un'apertura scrive direttamente sul file APERTO, senza riaprire il picker", async () => {
    const mockFile = { text: vi.fn().mockResolvedValue('Contenuto importato') }
    const mockWritable = {
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    }
    const mockFileHandle = {
      getFile: vi.fn().mockResolvedValue(mockFile),
      createWritable: vi.fn().mockResolvedValue(mockWritable),
    }
    ;(globalThis.window as any).showOpenFilePicker.mockResolvedValue([mockFileHandle])

    const proxy = new NoteServiceProxy()
    const opened = await proxy.open()

    await proxy.save(new Note(opened.id, "Contenuto modificato dopo l'importazione"))

    expect((globalThis.window as any).showSaveFilePicker).not.toHaveBeenCalled()
    expect(mockFileHandle.createWritable).toHaveBeenCalledTimes(1)
    expect(mockWritable.write).toHaveBeenCalledWith("Contenuto modificato dopo l'importazione")
  })

  it("dovrebbe lanciare NoteIOError in caso di errore della File System API all'apertura", async () => {
    ;(globalThis.window as any).showOpenFilePicker.mockRejectedValue(new Error('User cancelled'))

    const proxy = new NoteServiceProxy()

    await expect(proxy.open()).rejects.toThrowError(NoteIOError)
  })
})
