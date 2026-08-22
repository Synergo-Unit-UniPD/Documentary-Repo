import { EditCommand } from './EditCommand'
import { MarkdownContentEditor } from './MarkdownContentEditor'

/**
 * Comando (pattern Command) che inserisce del testo in una posizione
 * precisa del documento (es. una proposta AI accettata senza selezione
 * attiva). Conserva il contenuto precedente per l'undo.
 */
export class InsertTextCommand implements EditCommand {
  private position: number
  private text: string
  private editor: MarkdownContentEditor
  private previousContent: string

  constructor(position: number, text: string, editor: MarkdownContentEditor) {
    this.position = position
    this.text = text
    this.editor = editor
    this.previousContent = ''
  }

  public execute(): void {
    this.previousContent = this.editor.getContent()
    const newContent = this.editor.insertText(this.position, this.text)
    this.editor.setContent(newContent)
  }

  public undo(): void {
    this.editor.setContent(this.previousContent)
  }
}
