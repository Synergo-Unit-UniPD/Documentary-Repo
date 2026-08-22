import { EditCommand } from './EditCommand'
import { MarkdownContentEditor } from './MarkdownContentEditor'
import { TextRange } from './TextRange'
import { LinkActionRequest } from './LinkActionRequest'

/**
 * Comando (pattern Command) che applica un'operazione sui link Markdown
 * (creazione, modifica o rimozione) sul testo selezionato. Conserva il
 * contenuto precedente per l'undo.
 */
export class LinkCommand implements EditCommand {
  private range: TextRange
  private request: LinkActionRequest
  private previousContent: string
  private editor: MarkdownContentEditor

  constructor(range: TextRange, request: LinkActionRequest, editor: MarkdownContentEditor) {
    this.range = range
    this.request = request
    this.editor = editor
    this.previousContent = ''
  }

  public execute(): void {
    this.previousContent = this.editor.getContent()
    const newContent = this.editor.applyLinkOperation(this.range, this.request)
    this.editor.setContent(newContent)
  }

  public undo(): void {
    this.editor.setContent(this.previousContent)
  }
}
