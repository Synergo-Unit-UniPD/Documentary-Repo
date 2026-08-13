import { EditCommand } from './EditCommand'
import { NoteModel } from './NoteModel'
import { MarkdownContentEditor } from './MarkdownContentEditor'
import { TextRange } from './TextRange'
import { ListActionRequest } from './ListActionRequest'

export class ListCommand implements EditCommand {
  private model: NoteModel
  private range: TextRange
  private request: ListActionRequest
  private previousContent: string
  private editor: MarkdownContentEditor

  constructor(model: NoteModel, range: TextRange, request: ListActionRequest, editor: MarkdownContentEditor) {
    this.model = model
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
