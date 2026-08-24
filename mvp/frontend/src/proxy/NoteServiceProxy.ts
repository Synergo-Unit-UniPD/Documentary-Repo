import { NoteService } from './NoteService'
import { Note } from '../model/Note'
import { NoteIOError } from '../model/NoteIOError'

/**
 * Proxy per la comunicazione con il backend per le operazioni di salvataggio e apertura Note.
 * Gestisce l'interazione con la BrowserFileSystem API.
 *
 * Mantiene in memoria (per la durata della sessione) l'associazione tra l'id
 * della nota e il FileSystemFileHandle ottenuto da showSaveFilePicker/
 * showOpenFilePicker: è quello che permette ai salvataggi successivi al primo
 * (o dopo un'apertura) di scrivere direttamente sul file, senza richiedere di
 * nuovo nome/percorso ogni volta (R75-F-O, R76-F-O).
 *
 * File System Access API (showSaveFilePicker/showOpenFilePicker) è supportata
 * solo dai browser Chromium: R5-V-O richiede invece il supporto anche a
 * Firefox e Safari. Su questi browser il Proxy passa a un fallback basato su
 * API web standard (download via <a>, selezione via <input type="file">):
 * non permette la riscrittura in-place dello stesso file (limite di
 * piattaforma, non aggirabile lato applicazione), ma mantiene lo stesso
 * contratto NoteService/NoteIOError verso il resto del sistema, che quindi
 * non deve conoscere questa differenza (R13-Q-D).
 */
export class NoteServiceProxy implements NoteService {
  private fileHandles: Map<string, FileSystemFileHandle> = new Map()

  // Per il fallback: nome di file scelto al primo salvataggio di ciascuna
  // nota (per id), riproposto nei salvataggi successivi della stessa nota
  // così da non richiederlo di nuovo ogni volta, in linea con lo spirito di
  // R75-F-O anche se il browser non consente una vera riscrittura in-place.
  private fallbackFilenames: Map<string, string> = new Map()

  private static isFileSystemAccessSupported(): boolean {
    return (
      typeof (window as any).showSaveFilePicker === 'function' &&
      typeof (window as any).showOpenFilePicker === 'function'
    )
  }

  public async save(note: Note): Promise<string> {
    try {
      const existingHandle = note.id ? this.fileHandles.get(note.id) : undefined

      if (existingHandle) {
        // La nota è già associata a un file (salvata in precedenza in questa
        // sessione, oppure aperta tramite "Apri"): scrive direttamente.
        const writable = await existingHandle.createWritable()
        await writable.write(note.content)
        await writable.close()
        return note.id
      }

      // Nessun file associato: è il primo salvataggio, serve chiedere dove salvare.
      if (!NoteServiceProxy.isFileSystemAccessSupported()) {
        return this.saveViaDownloadFallback(note)
      }

      const handle = await (window as any).showSaveFilePicker({
        types: [
          {
            description: 'Markdown',
            accept: { 'text/markdown': ['.md'] },
          },
        ],
      })

      const writable = await handle.createWritable()
      await writable.write(note.content)
      await writable.close()

      const newId = this.generateNoteId()
      this.fileHandles.set(newId, handle)
      return newId
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        // L'utente ha annullato il selettore di file: non è un errore, non va
        // mostrato come tale al chiamante (vedi EditorController.onSaveCommand).
        throw new NoteIOError("Salvataggio annullato dall'utente", true)
      }
      throw new NoteIOError(error.message || 'Errore durante il salvataggio della nota')
    }
  }

  public async open(): Promise<Note> {
    try {
      if (!NoteServiceProxy.isFileSystemAccessSupported()) {
        return await this.openViaInputFallback()
      }

      // Step 10: showOpenFilePicker verso BrowserFileSystem API
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'Markdown',
            accept: { 'text/markdown': ['.md'] },
          },
        ],
        multiple: false,
      })

      // Step 11: Ricezione FileHandle
      const file = await handle.getFile()

      // Step 12: readContent
      const content = await file.text()

      // Memorizza l'handle associandolo a un nuovo id: è quello che permette
      // ai salvataggi successivi di scrivere direttamente su QUESTO file,
      // invece di chiedere di nuovo un percorso.
      const id = this.generateNoteId()
      this.fileHandles.set(id, handle)

      // Step 13: content ricevuto
      // Step 14: ritorna la Note istanziata
      return new Note(id, content)
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        // L'utente ha annullato il selettore di file: non è un errore, non va
        // mostrato come tale al chiamante (vedi EditorController.onOpenCommand).
        throw new NoteIOError("Apertura annullata dall'utente", true)
      }
      throw new NoteIOError(error.message || "Errore durante l'apertura della nota")
    }
  }

  // ------------------------------------------------------------------
  // Fallback per browser senza File System Access API (Firefox, Safari).
  // ------------------------------------------------------------------

  /**
   * Salva scaricando un file .md tramite un elemento <a download> temporaneo.
   * Non può riscrivere lo stesso file sul disco (limite delle API browser
   * standard): il nome viene chiesto una sola volta per nota e riusato nei
   * salvataggi successivi, per restare il più vicino possibile al
   * comportamento di showSaveFilePicker.
   */
  private saveViaDownloadFallback(note: Note): string {
    const id = note.id || this.generateNoteId()
    let filename = this.fallbackFilenames.get(id)

    if (!filename) {
      const chosen = this.promptFilename()
      if (chosen === null) {
        // L'utente ha annullato l'inserimento del nome: stesso trattamento
        // dell'AbortError di showSaveFilePicker, gestito dal blocco catch
        // di save() che avvolge questa chiamata.
        throw Object.assign(new Error("Salvataggio annullato dall'utente"), { name: 'AbortError' })
      }
      filename = chosen
      this.fallbackFilenames.set(id, filename)
    }

    const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    try {
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
    } finally {
      URL.revokeObjectURL(url)
    }

    return id
  }

  /**
   * Chiede il nome del file al primo salvataggio di una nota in fallback.
   * `window.prompt` è un dialog nativo del browser, coerente in spirito con
   * il selettore nativo di showSaveFilePicker che sostituisce.
   */
  private promptFilename(): string | null {
    const input = window.prompt('Nome del file (verrà salvato come .md):', 'nota.md')
    if (input === null) return null
    const trimmed = input.trim()
    if (trimmed.length === 0) return 'nota.md'
    return trimmed.toLowerCase().endsWith('.md') ? trimmed : `${trimmed}.md`
  }

  /**
   * Apre un file .md tramite un <input type="file"> nascosto.
   * Rilevare l'annullamento è delicato: non tutti i browser emettono un
   * evento standard sull'input quando l'utente chiude il selettore senza
   * scegliere un file. Si usa il ritorno del focus sulla finestra come
   * segnale indiretto, con un breve margine di tempo per lasciare che
   * l'evento 'change' scatti per primo se un file è stato davvero scelto.
   */
  private openViaInputFallback(): Promise<Note> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.md,text/markdown'
      input.style.display = 'none'

      let settled = false

      const cleanup = (): void => {
        window.removeEventListener('focus', onWindowFocus)
        input.remove()
      }

      const onChange = async (): Promise<void> => {
        if (settled) return
        const file = input.files?.[0]
        if (!file) return
        settled = true
        cleanup()
        try {
          const content = await file.text()
          const id = this.generateNoteId()
          this.fallbackFilenames.set(id, file.name)
          resolve(new Note(id, content))
        } catch (readError: any) {
          reject(readError)
        }
      }

      const onWindowFocus = (): void => {
        window.removeEventListener('focus', onWindowFocus)
        setTimeout(() => {
          if (!settled && (!input.files || input.files.length === 0)) {
            settled = true
            cleanup()
            reject(Object.assign(new Error("Apertura annullata dall'utente"), { name: 'AbortError' }))
          }
        }, 300)
      }

      input.addEventListener('change', onChange)
      window.addEventListener('focus', onWindowFocus)
      document.body.appendChild(input)
      input.click()
    })
  }

  private generateNoteId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    return `nota-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}
