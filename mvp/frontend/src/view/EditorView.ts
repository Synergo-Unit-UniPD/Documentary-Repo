import { Observer } from '../model/Observer'
import { Subject } from '../model/Subject'
import { NoteModel } from '../model/NoteModel'
import { ViewMode } from '../model/ViewMode'
import { FormatType } from '../model/FormatType'
import { TableActionRequest } from '../model/TableActionRequest'
import { TableOperationType } from '../model/TableOperationType'
import { ListActionRequest } from '../model/ListActionRequest'
import { LinkActionRequest } from '../model/LinkActionRequest'
import { TextRange } from '../model/TextRange'

// Placeholder architetturale: EditorView (Model/View) non deve conoscere i
// dettagli di CodeMirror (Sezione 3.3 Specifica Tecnica, separazione tra
// dominio e framework di rendering). L'istanza reale è gestita da App.vue.
export type CodeMirrorInstance = object

/**
 * Gestisce l'interfaccia dell'editor e l'interazione con l'istanza CodeMirror.
 * Opera come Subject per notificare i cambiamenti all'EditorController in modalità pull.
 */
export class EditorView implements Observer, Subject {
  private editor: CodeMirrorInstance
  private model: NoteModel
  private observers: Observer[] = []
  private viewMode: ViewMode

  private lastFormatRequest?: FormatType
  private lastFormatRange?: TextRange
  private lastTableRequest?: TableActionRequest
  private lastTableRange?: TextRange
  private lastListRequest?: ListActionRequest
  private lastListRange?: TextRange
  private lastLinkRequest?: LinkActionRequest
  private lastLinkRange?: TextRange

  private saveRequested: boolean = false
  private openRequested: boolean = false
  private undoRequested: boolean = false
  private redoRequested: boolean = false

  constructor(model: NoteModel, editorInstance: CodeMirrorInstance) {
    this.model = model
    this.editor = editorInstance
    this.viewMode = ViewMode.SPLIT
    this.model.attach(this)
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

  public update(): void {
    const currentText = this.model.getContent()
    this.render()
  }

  public render(): void {
    // La logica di rendering verrà gestita reattivamente da Vue/CodeMirror
  }

  public setViewMode(mode: ViewMode): void {
    this.viewMode = mode
    this.render()
  }

  public getLastFormatRequest(): FormatType | undefined {
    return this.lastFormatRequest
  }
  public getLastFormatRange(): TextRange | undefined {
    return this.lastFormatRange
  }

  // Step 5: getLastTableRequest
  public getLastTableRequest(): TableActionRequest | undefined {
    return this.lastTableRequest
  }
  public getLastTableRange(): TextRange | undefined {
    return this.lastTableRange
  }
  public getLastListRequest(): ListActionRequest | undefined {
    return this.lastListRequest
  }
  public getLastListRange(): TextRange | undefined {
    return this.lastListRange
  }
  public getLastLinkRequest(): LinkActionRequest | undefined {
    return this.lastLinkRequest
  }
  public getLastLinkRange(): TextRange | undefined {
    return this.lastLinkRange
  }

  public consumeSaveRequest(): boolean {
    const req = this.saveRequested
    this.saveRequested = false
    return req
  }

  public consumeOpenRequest(): boolean {
    const req = this.openRequested
    this.openRequested = false
    return req
  }

  public consumeUndoRequest(): boolean {
    const req = this.undoRequested
    this.undoRequested = false
    return req
  }

  public consumeRedoRequest(): boolean {
    const req = this.redoRequested
    this.redoRequested = false
    return req
  }

  public displayError(message: string, tone: 'error' | 'info' = 'error'): void {
    // Step 15: mostra a video l'errore generato (es. via console.error o toast di Vue)
    console.error(`Editor ${tone === 'info' ? 'Info' : 'Error'}: ${message}`)
  }

  public simulateFormatAction(type: FormatType, range: TextRange = new TextRange(0, 0)): void {
    this.lastFormatRequest = type
    this.lastFormatRange = range
    this.notify()
    this.lastFormatRequest = undefined
    this.lastFormatRange = undefined
  }

  public simulateListAction(request: ListActionRequest, range: TextRange = new TextRange(0, 0)): void {
    this.lastListRequest = request
    this.lastListRange = range
    this.notify()
    this.lastListRequest = undefined
    this.lastListRange = undefined
  }

  public simulateLinkAction(request: LinkActionRequest, range: TextRange = new TextRange(0, 0)): void {
    this.lastLinkRequest = request
    this.lastLinkRange = range
    this.notify()
    this.lastLinkRequest = undefined
    this.lastLinkRange = undefined
  }

  public simulateTableAction(rowCount: number, colCount: number): void {
    // Step 1: clickInserisciTabella(rowCount, colCount)
    this.simulateTableRequest(new TableActionRequest(TableOperationType.CREATE_TABLE, rowCount, colCount))
  }

  /** Versione generica di simulateTableAction, per le operazioni sulla tabella
   *  successive alla creazione (inserimento/rimozione righe e colonne, modifica cella).
   *  `range` individua la posizione del cursore/selezione, usata per determinare SU
   *  QUALE tabella operare quando il documento ne contiene più di una. */
  public simulateTableRequest(request: TableActionRequest, range: TextRange = new TextRange(0, 0)): void {
    // Step 2: lastTableRequest = TableActionRequest(...)
    this.lastTableRequest = request
    this.lastTableRange = range
    // Step 3: notify() al Controller
    this.notify()
    this.lastTableRequest = undefined
    this.lastTableRange = undefined
  }

  public simulateAction(action: 'save' | 'open' | 'undo' | 'redo'): void {
    if (action === 'save') this.saveRequested = true
    if (action === 'open') this.openRequested = true
    if (action === 'undo') this.undoRequested = true
    if (action === 'redo') this.redoRequested = true
    this.notify()
  }
}
