import { describe, it, expect } from 'vitest'
import { MarkdownContentEditor } from '../model/MarkdownContentEditor'
import { CommandHistory } from '../model/CommandHistory'
import { NoteModel } from '../model/NoteModel'
import { ReplaceContentCommand } from '../model/ReplaceContentCommand'
import { NoteService } from '../proxy/NoteService'

class DummyNoteService implements NoteService {
  async save(): Promise<string> { return '' }
  async open(): Promise<any> {
    return { id: '', content: '' }
  }
}

describe('Riproduzione: "ciao come va" digitato in 5 burst separati (pause > 900ms)', () => {
  it('5 comandi separati, poi 5 undo, poi 5 redo devono ripristinare tutto correttamente', () => {
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

    function commitBurst(): void {
      activeTypingCommand = null
    }

    // Simula 5 burst separati (come se ci fosse una pausa > 900ms tra ognuno)
    onEditorInput('ciao')
    commitBurst()
    onEditorInput('ciao ')
    commitBurst()
    onEditorInput('ciao come')
    commitBurst()
    onEditorInput('ciao come ')
    commitBurst()
    onEditorInput('ciao come va')
    commitBurst()

    expect(noteModel.getContent()).toBe('ciao come va')
    expect(commandHistory.canUndo()).toBe(true)

    // 5 UNDO consecutivi
    const statesAfterUndo: string[] = []
    for (let i = 0; i < 5; i++) {
      noteModel.undo()
      statesAfterUndo.push(noteModel.getContent())
    }
    console.log('Stati dopo ogni undo:', statesAfterUndo)
    expect(statesAfterUndo).toEqual(['ciao come ', 'ciao come', 'ciao ', 'ciao', ''])
    expect(commandHistory.canUndo()).toBe(false)
    expect(commandHistory.canRedo()).toBe(true)

    // 5 REDO consecutivi: deve tornare esattamente sugli stessi stati intermedi
    const statesAfterRedo: string[] = []
    for (let i = 0; i < 5; i++) {
      noteModel.redo()
      statesAfterRedo.push(noteModel.getContent())
    }
    console.log('Stati dopo ogni redo:', statesAfterRedo)
    expect(statesAfterRedo).toEqual(['ciao', 'ciao ', 'ciao come', 'ciao come ', 'ciao come va'])
    expect(commandHistory.canRedo()).toBe(false)
  })
})
