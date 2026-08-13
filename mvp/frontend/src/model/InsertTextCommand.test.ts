import { describe, it, expect } from 'vitest'
import { InsertTextCommand } from './InsertTextCommand'
import { NoteModel } from './NoteModel'
import { MarkdownContentEditor } from './MarkdownContentEditor'

describe('InsertTextCommand', () => {
  it("dovrebbe salvare il contenuto precedente, eseguire l'inserimento e permettere l'undo", () => {
    const editor = new MarkdownContentEditor('Testo')
    const model = {} as NoteModel // Mock leggero di NoteModel, non usato direttamente dall'editor in questa fase

    const command = new InsertTextCommand(model, 5, ' nuovo', editor)

    command.execute()
    expect(editor.getContent()).toBe('Testo nuovo')

    command.undo()
    expect(editor.getContent()).toBe('Testo')
  })
})
