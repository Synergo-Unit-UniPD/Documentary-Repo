import { EditCommand } from './EditCommand'
import { NoteModel } from './NoteModel'
import { MarkdownContentEditor } from './MarkdownContentEditor'
import { TableActionRequest } from './TableActionRequest'
import { TextRange } from './TextRange'

export class TableCommand implements EditCommand {
  private model: NoteModel
  private request: TableActionRequest
  private range: TextRange
  private previousContent: string
  private editor: MarkdownContentEditor

  constructor(
    model: NoteModel,
    request: TableActionRequest,
    editor: MarkdownContentEditor,
    range: TextRange = new TextRange(0, 0),
  ) {
    this.model = model
    this.request = request
    this.editor = editor
    this.range = range
    this.previousContent = ''
  }

  public execute(): void {
    this.previousContent = this.editor.getContent()
    const newContent = this.editor.applyTableOperation(this.request, this.range)
    this.editor.setContent(newContent)
  }

  public undo(): void {
    this.editor.setContent(this.previousContent)
  }
}
