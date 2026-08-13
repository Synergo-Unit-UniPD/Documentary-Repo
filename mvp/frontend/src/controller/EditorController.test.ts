import { describe, it, expect, vi } from 'vitest'
import { EditorController } from './EditorController'
import { EditorView } from '../view/EditorView'
import { NoteModel } from '../model/NoteModel'
import { MarkdownContentEditor } from '../model/MarkdownContentEditor'
import { CommandHistory } from '../model/CommandHistory'
import { NoteService } from '../proxy/NoteService'
import { FormatType } from '../model/FormatType'
import { Note } from '../model/Note'
import { FormatTextCommand } from '../model/FormatTextCommand'
import { TableCommand } from '../model/TableCommand'
import { NoteIOError } from '../model/NoteIOError'
import { TextRange } from '../model/TextRange'
import { ListActionRequest } from '../model/ListActionRequest'
import { ListOperationType } from '../model/ListOperationType'
import { LinkActionRequest } from '../model/LinkActionRequest'
import { LinkOperationType } from '../model/LinkOperationType'

const mockNoteService: NoteService = {
  save: vi.fn().mockResolvedValue(undefined),
  open: vi.fn().mockResolvedValue(new Note('1', '')),
}

describe('EditorController - Formattazione con Undo e Redo', () => {
  it('dovrebbe eseguire il flusso di formattazione, undo e redo secondo i diagrammi di sequenza', () => {
    const markdownEditor = new MarkdownContentEditor()
    const applyFormatSpy = vi.spyOn(markdownEditor, 'applyFormat').mockReturnValue('**testo**')
    const removeFormatSpy = vi.spyOn(markdownEditor, 'removeFormat').mockReturnValue('testo')

    const history = new CommandHistory()
    const pushSpy = vi.spyOn(history, 'push')
    const historyUndoSpy = vi.spyOn(history, 'undo')
    const historyRedoSpy = vi.spyOn(history, 'redo')

    const model = new NoteModel(markdownEditor, history, mockNoteService)
    const executeCommandSpy = vi.spyOn(model, 'executeCommand')
    const modelUndoSpy = vi.spyOn(model, 'undo')
    const modelRedoSpy = vi.spyOn(model, 'redo')
    const markDirtySpy = vi.spyOn(model, 'markDirtyAndNotify')

    const view = new EditorView(model, {} as any)
    const updateSpy = vi.spyOn(view, 'update')

    const controller = new EditorController(model, view)

    // --- FLUSSO: Formattazione ---
    view.simulateFormatAction(FormatType.BOLD)

    expect(executeCommandSpy).toHaveBeenCalledTimes(1)
    expect(executeCommandSpy).toHaveBeenCalledWith(expect.any(FormatTextCommand))
    expect(pushSpy).toHaveBeenCalledTimes(1)
    expect(applyFormatSpy).toHaveBeenCalledTimes(1)
    expect(markDirtySpy).toHaveBeenCalledTimes(1)
    expect(updateSpy).toHaveBeenCalled()

    // --- FLUSSO: Undo ---
    view.simulateAction('undo')

    expect(modelUndoSpy).toHaveBeenCalledTimes(1)
    expect(historyUndoSpy).toHaveBeenCalledTimes(1)
    // FormatTextCommand.undo() ripristina uno snapshot del contenuto precedente
    // (necessario per supportare il toggle, vedi FormatTextCommand.test.ts):
    // non richiama più removeFormat direttamente.
    expect(removeFormatSpy).not.toHaveBeenCalled()
    expect(markdownEditor.getContent()).toBe('')
    expect(markDirtySpy).toHaveBeenCalledTimes(2)
    expect(updateSpy).toHaveBeenCalledTimes(2)

    // --- FLUSSO: Redo ---
    view.simulateAction('redo')

    expect(modelRedoSpy).toHaveBeenCalledTimes(1)
    expect(historyRedoSpy).toHaveBeenCalledTimes(1)
    expect(applyFormatSpy).toHaveBeenCalledTimes(2)
    expect(markDirtySpy).toHaveBeenCalledTimes(3)
    expect(updateSpy).toHaveBeenCalledTimes(3)
  })
})

describe('EditorController - Inserimento tabella con validazione', () => {
  it("dovrebbe gestire l'errore se le dimensioni della tabella non sono valide (Step 1-15)", () => {
    const markdownEditor = new MarkdownContentEditor()
    const history = new CommandHistory()
    const model = new NoteModel(markdownEditor, history, mockNoteService)
    const view = new EditorView(model, {} as any)
    const controller = new EditorController(model, view)

    const displayErrorSpy = vi.spyOn(view, 'displayError')

    view.simulateTableAction(-1, 0)

    expect(displayErrorSpy).toHaveBeenCalledTimes(1)
    expect(displayErrorSpy).toHaveBeenCalledWith('Dimensioni tabella non valide')
  })

  it('dovrebbe inserire la tabella se le dimensioni sono valide (Step 1-11, 16-19)', () => {
    const markdownEditor = new MarkdownContentEditor()
    const applyTableSpy = vi.spyOn(markdownEditor, 'applyTableOperation')
    const history = new CommandHistory()
    const model = new NoteModel(markdownEditor, history, mockNoteService)
    const view = new EditorView(model, {} as any)
    const controller = new EditorController(model, view)

    const executeCommandSpy = vi.spyOn(model, 'executeCommand')
    const markDirtySpy = vi.spyOn(model, 'markDirtyAndNotify')
    const updateSpy = vi.spyOn(view, 'update')

    view.simulateTableAction(3, 3)

    expect(executeCommandSpy).toHaveBeenCalledWith(expect.any(TableCommand))
    expect(applyTableSpy).toHaveBeenCalledTimes(1)
    expect(markDirtySpy).toHaveBeenCalledTimes(1)
    expect(updateSpy).toHaveBeenCalled()
  })
})

describe('EditorController - Salvataggio con errore', () => {
  it("dovrebbe intercettare NoteIOError e mostrare l'errore nella View (Step 1-15)", async () => {
    const markdownEditor = new MarkdownContentEditor()
    const history = new CommandHistory()
    const model = new NoteModel(markdownEditor, history, mockNoteService)
    const view = new EditorView(model, {} as any)
    const controller = new EditorController(model, view)

    // Simuliamo la propagazione di un errore di I/O dal Model (Step 8-12)
    const saveSpy = vi.spyOn(model, 'save').mockRejectedValue(new NoteIOError('Scrittura fallita: utente ha annullato'))
    const displayErrorSpy = vi.spyOn(view, 'displayError')

    // SIMULAZIONE: click "Save"
    view.simulateAction('save')

    // Attendiamo che la Promise asincrona nel controller venga gestita
    await Promise.resolve()

    // VERIFICA: L'errore deve essere mostrato (Step 14)
    expect(saveSpy).toHaveBeenCalledTimes(1)
    expect(displayErrorSpy).toHaveBeenCalledTimes(1)
    expect(displayErrorSpy).toHaveBeenCalledWith('Scrittura fallita: utente ha annullato')
  })
})
describe('EditorController - propagazione del range di selezione', () => {
  it('costruisce il FormatTextCommand con il range effettivamente selezionato', () => {
    const markdownEditor = new MarkdownContentEditor('Testo di prova')
    const applyFormatSpy = vi.spyOn(markdownEditor, 'applyFormat')
    const history = new CommandHistory()
    const model = new NoteModel(markdownEditor, history, mockNoteService)
    const view = new EditorView(model, {} as any)
    new EditorController(model, view)

    view.simulateFormatAction(FormatType.BOLD, new TextRange(2, 7))

    expect(applyFormatSpy).toHaveBeenCalledWith(new TextRange(2, 7), FormatType.BOLD)
  })

  it('costruisce il ListCommand con il range effettivamente selezionato', () => {
    const markdownEditor = new MarkdownContentEditor('- elemento')
    const applyListSpy = vi.spyOn(markdownEditor, 'applyListOperation')
    const history = new CommandHistory()
    const model = new NoteModel(markdownEditor, history, mockNoteService)
    const view = new EditorView(model, {} as any)
    new EditorController(model, view)

    const request = new ListActionRequest(ListOperationType.TOGGLE_LIST_TYPE)
    view.simulateListAction(request, new TextRange(1, 5))

    expect(applyListSpy).toHaveBeenCalledWith(new TextRange(1, 5), request)
  })

  it('costruisce il LinkCommand con il range effettivamente selezionato', () => {
    const markdownEditor = new MarkdownContentEditor('vedi qui')
    const applyLinkSpy = vi.spyOn(markdownEditor, 'applyLinkOperation')
    const history = new CommandHistory()
    const model = new NoteModel(markdownEditor, history, mockNoteService)
    const view = new EditorView(model, {} as any)
    new EditorController(model, view)

    const request = new LinkActionRequest(LinkOperationType.INSERT_LINK, 'https://esempio.it')
    view.simulateLinkAction(request, new TextRange(5, 8))

    expect(applyLinkSpy).toHaveBeenCalledWith(new TextRange(5, 8), request)
  })
})
