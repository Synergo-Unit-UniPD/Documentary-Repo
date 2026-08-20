import { EditCommand } from './EditCommand'
import { MarkdownContentEditor } from './MarkdownContentEditor'
import { TextRange } from './TextRange'
import { FormatType } from './FormatType'

export class FormatTextCommand implements EditCommand {
  private range: TextRange
  private formatType: FormatType
  private editor: MarkdownContentEditor
  private previousContent: string

  constructor(range: TextRange, formatType: FormatType, editor: MarkdownContentEditor) {
    this.range = range
    this.formatType = formatType
    this.editor = editor
    this.previousContent = ''
  }

  public execute(): void {
    this.previousContent = this.editor.getContent()

    // Step 11: execute -> Step 12: applyFormat(range, BOLD)
    // Il toggle decide autonomamente se applicare o rimuovere la formattazione,
    // in base allo stato corrente del range (R5-R28: ogni formattazione deve
    // essere annullabile ripetendo lo stesso comando sulla stessa selezione).
    const newContent = this.editor.toggleFormat(this.range, this.formatType)
    this.editor.setContent(newContent)
  }

  public undo(): void {
    // Ripristina esattamente lo stato precedente all'esecuzione (indipendentemente
    // dal fatto che execute() abbia applicato o rimosso la formattazione).
    this.editor.setContent(this.previousContent)
  }
}
