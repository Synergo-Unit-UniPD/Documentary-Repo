import { describe, it, expect } from 'vitest'
import { MarkdownContentEditor } from '../model/MarkdownContentEditor'
import { CommandHistory } from '../model/CommandHistory'
import { NoteModel } from '../model/NoteModel'
import { ReplaceContentCommand } from '../model/ReplaceContentCommand'
import { NoteService } from '../proxy/NoteService'

class DummyNoteService implements NoteService {
  async save(): Promise<string> {
    return ''
  }
  async open(): Promise<any> {
    return { id: '', content: '' }
  }
}

describe('Riproduzione isolata (senza Vue) del flusso digitazione -> Undo -> Redo', () => {
  it('replica esattamente la logica di App.vue onEditorInput/onUndo', () => {
    const markdownEditor = new MarkdownContentEditor('')
    const commandHistory = new CommandHistory()
    const noteModel = new NoteModel(markdownEditor, commandHistory, new DummyNoteService())

    let activeTypingCommand: ReplaceContentCommand | null = null

    function onEditorInput(newValue: string): void {
      if (activeTypingCommand === null) {
        activeTypingCommand = new ReplaceContentCommand(markdownEditor, newValue)
        noteModel.executeCommand(activeTypingCommand)
      } else {
        activeTypingCommand.updateNewContent(newValue)
        markdownEditor.setContent(newValue)
        noteModel.markDirtyAndNotify()
      }
    }

    // Simula la digitazione di "Ciao" (un solo evento, come nel test Vue)
    onEditorInput('Ciao')

    expect(noteModel.getContent()).toBe('Ciao')
    expect(noteModel.canUndo()).toBe(true)
    expect(noteModel.canRedo()).toBe(false)

    // Simula il click su "Annulla"
    activeTypingCommand = null // equivalente a commitTypingBurst()
    noteModel.undo()

    expect(noteModel.getContent()).toBe('')
    expect(noteModel.canUndo()).toBe(false)
    expect(noteModel.canRedo()).toBe(true) // <-- verifichiamo qui il comportamento reale

    // Simula il click su "Ripeti"
    noteModel.redo()
    expect(noteModel.getContent()).toBe('Ciao')
  })
})
