import { EditCommand } from './EditCommand'
import { MarkdownContentEditor } from './MarkdownContentEditor'
import { TextRange } from './TextRange'
import { ListActionRequest } from './ListActionRequest'

/**
 * Comando (pattern Command) che applica un'operazione di formattazione a
 * elenco (puntato/numerato, incremento o riduzione del livello di indentazione)
 * sul testo selezionato. Conserva il contenuto precedente per l'undo.
 */
export class ListCommand implements EditCommand {
  private range: TextRange
  private request: ListActionRequest
  private previousContent: string
  private editor: MarkdownContentEditor

  constructor(range: TextRange, request: ListActionRequest, editor: MarkdownContentEditor) {
    this.range = range
    this.request = request
    this.editor = editor
    this.previousContent = ''
  }

  public execute(): void {
    this.previousContent = this.editor.getContent()
    const newContent = this.editor.applyListOperation(this.range, this.request)
    this.editor.setContent(newContent)
  }

  public undo(): void {
    this.editor.setContent(this.previousContent)
  }
}
