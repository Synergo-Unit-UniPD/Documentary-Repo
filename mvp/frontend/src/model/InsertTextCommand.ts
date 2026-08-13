import { EditCommand } from './EditCommand'
import { NoteModel } from './NoteModel'
import { MarkdownContentEditor } from './MarkdownContentEditor'

export class InsertTextCommand implements EditCommand {
  private model: NoteModel
  private position: number
  private text: string
  private editor: MarkdownContentEditor
  private previousContent: string

  constructor(model: NoteModel, position: number, text: string, editor: MarkdownContentEditor) {
    this.model = model
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
