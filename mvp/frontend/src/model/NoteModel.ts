import { Subject } from './Subject'
import { Observer } from './Observer'
import { CommandHistory } from './CommandHistory'
import { EditCommand } from './EditCommand'
import { MarkdownContentEditor } from './MarkdownContentEditor'
import { NoteService } from '../proxy/NoteService'
import { ExportService, ExportFormat } from '../proxy/ExportService'
import { Note } from './Note'

/**
 * Modello centrale del dominio che gestisce il contenuto della nota,
 * la cronologia dei comandi e notifica le viste in modalità pull.
 */
export class NoteModel implements Subject {
  private contentEditor: MarkdownContentEditor
  private history: CommandHistory
  private observers: Observer[] = []
  private noteService: NoteService
  /** Opzionale (a differenza di noteService): l'esportazione è una funzionalità
   *  accessoria, non indispensabile al funzionamento del resto del Model, quindi
   *  non tutti i chiamanti (es. i test che non la esercitano) devono fornirla. */
  private exportService?: ExportService
  private noteId: string | undefined
  private isDirty: boolean = false

  constructor(
    contentEditor: MarkdownContentEditor,
    history: CommandHistory,
    noteService: NoteService,
    exportService?: ExportService,
  ) {
    this.contentEditor = contentEditor
    this.history = history
    this.noteService = noteService
    this.exportService = exportService
  }

  public attach(o: Observer): void {
    if (!this.observers.includes(o)) {
      this.observers.push(o)
    }
  }

  public detach(o: Observer): void {
    this.observers = this.observers.filter((obs) => obs !== o)
  }

  public notify(): void {
    for (const observer of this.observers) {
      observer.update()
    }
  }

  public executeCommand(c: EditCommand): void {
    this.history.push(c)
    c.execute()
    this.markDirtyAndNotify()
  }

  public undo(): void {
    this.history.undo()
    this.markDirtyAndNotify()
  }

  public redo(): void {
    this.history.redo()
    this.markDirtyAndNotify()
  }

  public getContent(): string {
    return this.contentEditor.getContent()
  }

  /** Espone l'editor di dominio ai Controller che devono costruire i Command
   *  (FormatTextCommand, TableCommand, ecc.) */
  public getContentEditor(): MarkdownContentEditor {
    return this.contentEditor
  }

  public getIsDirty(): boolean {
    return this.isDirty
  }

  public canUndo(): boolean {
    return this.history.canUndo()
  }

  public canRedo(): boolean {
    return this.history.canRedo()
  }

  public async save(): Promise<void> {
    // Step 9: controlla noteId. Usa una stringa vuota se undefined (NoteVuota)
    const currentId = this.noteId ? this.noteId : ''
    const note = new Note(currentId, this.getContent())

    // Step 10 / Step 16: save(NoteVuota / NoteEsistente)
    // Il Proxy restituisce l'id definitivo della nota (nuovo al primo
    // salvataggio, invariato altrimenti): va memorizzato per far sì che il
    // PROSSIMO salvataggio scriva direttamente, senza richiedere di nuovo
    // un nome/percorso.
    this.noteId = await this.noteService.save(note)

    // Step 19: isDirtyFalse
    this.isDirty = false

    // Step 20: notify -> porterà all'update (Step 21) su EditorView
    this.notify()
  }

  public async openNote(): Promise<void> {
    const note = await this.noteService.open()
    this.noteId = note.id
    this.contentEditor.setContent(note.content)
    this.history.clear()
    this.isDirty = false
    this.notify()
  }

  /**
   * Esporta il contenuto corrente della nota nel formato richiesto (R77-F-O),
   * delegando a ExportService. Instrada l'esportazione attraverso il Model,
   * invece di far chiamare ExportServiceProxy direttamente da App.vue, per
   * coerenza con come NoteService e AIService sono già iniettati rispettivamente
   * in NoteModel e AIRequestModel.
   */
  public async exportContent(format: ExportFormat): Promise<Blob> {
    if (!this.exportService) {
      throw new Error('Servizio di esportazione non configurato')
    }
    return this.exportService.exportNote(format, this.getContent())
  }

  public markDirtyAndNotify(): void {
    this.isDirty = true
    this.notify()
  }
}
