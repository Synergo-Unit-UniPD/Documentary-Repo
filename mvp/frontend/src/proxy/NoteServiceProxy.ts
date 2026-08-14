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
 */
export class NoteServiceProxy implements NoteService {
  private fileHandles: Map<string, FileSystemFileHandle> = new Map()

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
      if (!(window as any).showSaveFilePicker) {
        throw new Error('File System API non supportata dal browser')
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
      if (!(window as any).showOpenFilePicker) {
        throw new Error('File System API non supportata dal browser')
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

  private generateNoteId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    return `nota-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}
