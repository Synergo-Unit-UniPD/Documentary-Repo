import { describe, it, expect } from 'vitest'
import { ReplaceContentCommand } from './ReplaceContentCommand'
import { MarkdownContentEditor } from './MarkdownContentEditor'
import { NoteModel } from './NoteModel'
import { CommandHistory } from './CommandHistory'

class MockNoteService {
  async save(): Promise<void> {}
  async open(): Promise<string> {
    return ''
  }
}

describe('ReplaceContentCommand', () => {
  it('execute() sostituisce il contenuto e memorizza lo snapshot precedente', () => {
    const editor = new MarkdownContentEditor('testo iniziale')
    const command = new ReplaceContentCommand(editor, 'testo iniziale con aggiunta')

    command.execute()

    expect(editor.getContent()).toBe('testo iniziale con aggiunta')
  })

  it('undo() ripristina esattamente il contenuto precedente a execute()', () => {
    const editor = new MarkdownContentEditor('originale')
    const command = new ReplaceContentCommand(editor, 'modificato')

    command.execute()
    command.undo()

    expect(editor.getContent()).toBe('originale')
  })

  it('updateNewContent permette di aggiornare il testo finale prima di eseguire il commit', () => {
    const editor = new MarkdownContentEditor('base')
    const command = new ReplaceContentCommand(editor, 'base+a')

    command.updateNewContent('base+a+b')
    command.updateNewContent('base+a+b+c')
    command.execute()

    expect(editor.getContent()).toBe('base+a+b+c')

    command.undo()
    expect(editor.getContent()).toBe('base')
  })

  it('si integra correttamente con NoteModel.executeCommand/undo/redo (round-trip)', () => {
    const editor = new MarkdownContentEditor('prima della digitazione')
    const history = new CommandHistory()
    const model = new NoteModel(editor, history, new MockNoteService())

    const command = new ReplaceContentCommand(editor, 'prima della digitazione libera')
    model.executeCommand(command)

    expect(model.getContent()).toBe('prima della digitazione libera')
    expect(model.canUndo()).toBe(true)

    model.undo()
    expect(model.getContent()).toBe('prima della digitazione')
    expect(model.canRedo()).toBe(true)

    model.redo()
    expect(model.getContent()).toBe('prima della digitazione libera')
  })
})
