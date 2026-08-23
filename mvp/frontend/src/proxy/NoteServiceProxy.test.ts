import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NoteServiceProxy } from './NoteServiceProxy'
import { Note } from '../model/Note'
import { NoteIOError } from '../model/NoteIOError'

// Catturato PRIMA di qualunque mock: il describe "File System API disponibile"
// più sotto sostituisce (e poi elimina) globalThis.window per i suoi test,
// quindi il riferimento reale a window va salvato qui, a livello di modulo,
// perché i test del fallback (secondo describe) hanno comunque bisogno di un
// window/document DOM reali per addEventListener/dispatchEvent/createElement.
const realWindow: any = globalThis.window

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

  it("dovrebbe lanciare NoteIOError con cancelled=true se l'utente annulla il selettore di salvataggio (AbortError)", async () => {
    ;(globalThis.window as any).showSaveFilePicker.mockRejectedValue(
      new DOMException('The user aborted a request.', 'AbortError'),
    )

    const proxy = new NoteServiceProxy()
    const noteVuota = new Note('', 'Contenuto')

    try {
      await proxy.save(noteVuota)
      expect.fail('doveva sollevare NoteIOError')
    } catch (error) {
      expect(error).toBeInstanceOf(NoteIOError)
      expect((error as NoteIOError).cancelled).toBe(true)
      // Non deve mai comparire il messaggio tecnico grezzo del browser.
      expect((error as NoteIOError).message).not.toContain('showSaveFilePicker')
      expect((error as NoteIOError).message).not.toContain('aborted')
    }
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

  it("dovrebbe lanciare NoteIOError con cancelled=true se l'utente annulla il selettore di apertura (AbortError)", async () => {
    ;(globalThis.window as any).showOpenFilePicker.mockRejectedValue(
      new DOMException('The user aborted a request.', 'AbortError'),
    )

    const proxy = new NoteServiceProxy()

    try {
      await proxy.open()
      expect.fail('doveva sollevare NoteIOError')
    } catch (error) {
      expect(error).toBeInstanceOf(NoteIOError)
      expect((error as NoteIOError).cancelled).toBe(true)
      expect((error as NoteIOError).message).not.toContain('showOpenFilePicker')
      expect((error as NoteIOError).message).not.toContain('aborted')
    }
  })
})

describe('NoteServiceProxy - Fallback per browser senza File System Access API (Firefox, Safari)', () => {
  beforeEach(() => {
    // Simula un browser SENZA File System Access API: nessuna delle due
    // funzioni è disponibile, a differenza del mock del describe precedente.
    ;(globalThis as any).window = {
      addEventListener: realWindow.addEventListener.bind(realWindow),
      removeEventListener: realWindow.removeEventListener.bind(realWindow),
      prompt: vi.fn(),
    }
    ;(globalThis as any).URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    ;(globalThis as any).URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
    delete (globalThis as any).window
  })

  /** Sostituisce document.createElement('a') con un anchor la cui click() è
   *  spiata, mantenendo il comportamento reale per tutti gli altri tag
   *  (in particolare per l'<input> creato da openViaInputFallback). */
  function spyOnAnchorClick(): { clickSpy: ReturnType<typeof vi.fn>; restore: () => void } {
    const originalCreateElement = document.createElement.bind(document)
    const clickSpy = vi.fn()
    const spy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') {
        Object.defineProperty(el, 'click', { value: clickSpy, configurable: true })
      }
      return el
    })
    return { clickSpy, restore: () => spy.mockRestore() }
  }

  it('save: senza File System Access API chiede il nome file e scarica un .md tramite <a download>', async () => {
    ;(globalThis.window as any).prompt.mockReturnValue('la-mia-nota')
    const { clickSpy, restore } = spyOnAnchorClick()
    const appendSpy = vi.spyOn(document.body, 'appendChild')

    const proxy = new NoteServiceProxy()
    const id = await proxy.save(new Note('', 'Contenuto senza FS Access API'))

    expect((globalThis.window as any).prompt).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(appendSpy).toHaveBeenCalled()
    expect(id).toBeTruthy()

    restore()
    appendSpy.mockRestore()
  })

  it('save: un secondo salvataggio della STESSA nota riusa il nome già scelto, senza richiederlo di nuovo', async () => {
    ;(globalThis.window as any).prompt.mockReturnValue('riusabile')
    const { clickSpy, restore } = spyOnAnchorClick()

    const proxy = new NoteServiceProxy()
    const firstId = await proxy.save(new Note('', 'Prima versione'))
    await proxy.save(new Note(firstId, 'Seconda versione'))

    // Il prompt del nome file va chiesto una volta sola per nota.
    expect((globalThis.window as any).prompt).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(2)

    restore()
  })

  it('save: annullare il prompt del nome file produce NoteIOError con cancelled=true, come per AbortError', async () => {
    ;(globalThis.window as any).prompt.mockReturnValue(null)

    const proxy = new NoteServiceProxy()

    try {
      await proxy.save(new Note('', 'Contenuto'))
      expect.fail('doveva sollevare NoteIOError')
    } catch (error) {
      expect(error).toBeInstanceOf(NoteIOError)
      expect((error as NoteIOError).cancelled).toBe(true)
    }
  })

  it('open: senza File System Access API usa un <input type=file> e restituisce la nota letta', async () => {
    const proxy = new NoteServiceProxy()
    const openPromise = proxy.open()

    // Recupera l'input creato dinamicamente e simula la scelta di un file.
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeTruthy()

    const file = new File(['Contenuto da input fallback'], 'importata.md', { type: 'text/markdown' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change'))

    const note = await openPromise
    expect(note.content).toBe('Contenuto da input fallback')
    expect(note.id).toBeTruthy()
  })

  it('open: un errore nella lettura del file scelto (file.text() fallisce) propaga il rifiuto originale', async () => {
    const proxy = new NoteServiceProxy()
    const openPromise = proxy.open()
    const assertion = expect(openPromise).rejects.toThrow('Lettura corrotta')

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const brokenFile = { name: 'rotto.md', text: vi.fn().mockRejectedValue(new Error('Lettura corrotta')) }
    Object.defineProperty(input, 'files', { value: [brokenFile], configurable: true })
    input.dispatchEvent(new Event('change'))

    await assertion
  })

  it('open: annullare il selettore (nessun file scelto, la finestra riottiene il focus) produce NoteIOError con cancelled=true', async () => {
    vi.useFakeTimers()
    const proxy = new NoteServiceProxy()
    const openPromise = proxy.open()
    // L'assertion va agganciata alla Promise PRIMA di avanzare i timer fake,
    // altrimenti il reject scatta durante advanceTimersByTimeAsync senza
    // nessuno in ascolto, e Vitest segnala una unhandled rejection anche se
    // il test finisce per passare.
    const assertion = expect(openPromise).rejects.toMatchObject({ cancelled: true })

    // Nessun 'change': l'utente ha chiuso il selettore senza scegliere nulla,
    // la finestra riottiene il focus. Il listener è stato registrato dal
    // Proxy sul window reale (vedi mock in beforeEach), quindi va sparato lì.
    realWindow.dispatchEvent(new Event('focus'))
    await vi.advanceTimersByTimeAsync(300)
    vi.useRealTimers()

    await assertion
  })
})
