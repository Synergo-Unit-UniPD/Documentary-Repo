import { EditCommand } from './EditCommand'
import { MarkdownContentEditor } from './MarkdownContentEditor'

/**
 * Comando generico che sostituisce l'intero contenuto della nota con uno nuovo,
 * mantenendo lo snapshot precedente per l'undo. Serve a raggruppare in un'unica
 * voce di CommandHistory le sequenze di digitazione libera e le operazioni di
 * copia/incolla nell'editor, che diversamente bypasserebbero il pattern Command
 * (Sezione 5.3.2 Specifica Tecnica) e non risulterebbero annullabili con Undo.
 *
 * `updateNewContent` permette di aggiornare il contenuto finale mentre l'utente
 * continua a digitare, senza creare una nuova voce di history per ogni carattere:
 * l'orchestrazione del raggruppamento ("burst" di digitazione) è responsabilità
 * del chiamante (vedi App.vue).
 */
export class ReplaceContentCommand implements EditCommand {
  private editor: MarkdownContentEditor
  private newContent: string
  private previousContent: string

  constructor(editor: MarkdownContentEditor, newContent: string) {
    this.editor = editor
    this.newContent = newContent
    this.previousContent = ''
  }

  public updateNewContent(content: string): void {
    this.newContent = content
  }

  public execute(): void {
    this.previousContent = this.editor.getContent()
    this.editor.setContent(this.newContent)
  }

  public undo(): void {
    this.editor.setContent(this.previousContent)
  }
}
