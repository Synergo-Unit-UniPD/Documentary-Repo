import { describe, it, expect, vi } from 'vitest'
import { EditorView } from './EditorView'
import { NoteModel } from '../model/NoteModel'
import { MarkdownContentEditor } from '../model/MarkdownContentEditor'
import { CommandHistory } from '../model/CommandHistory'
import { NoteService } from '../proxy/NoteService'
import { Observer } from '../model/Observer'
import { Note } from '../model/Note'
import { FormatType } from '../model/FormatType'
import { TextRange } from '../model/TextRange'
import { ListActionRequest } from '../model/ListActionRequest'
import { ListOperationType } from '../model/ListOperationType'
import { LinkActionRequest } from '../model/LinkActionRequest'
import { LinkOperationType } from '../model/LinkOperationType'
import { TableActionRequest } from '../model/TableActionRequest'
import { TableOperationType } from '../model/TableOperationType'

const mockNoteService: NoteService = {
  save: vi.fn(),
  open: vi.fn().mockResolvedValue(new Note('1', '')),
}

class MockObserver implements Observer {
  update = vi.fn()
}

describe('EditorView', () => {
  it('dovrebbe gestire le richieste di consume correttamente (MVC Pull)', () => {
    const model = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService)
    const view = new EditorView(model, {})

    expect(view.consumeSaveRequest()).toBe(false)

    view.simulateAction('save')
    // Dopo la notifica, il controller o il test dovrebbe "consumare" il true
    expect(view.consumeSaveRequest()).toBe(true)
    // La successiva lettura deve essere false
    expect(view.consumeSaveRequest()).toBe(false)
  })

  it("dovrebbe notificare il controller all'emissione di un evento", () => {
    const model = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService)
    const view = new EditorView(model, {})
    const controller = new MockObserver()

    view.attach(controller)
    view.simulateFormatAction(FormatType.BOLD)

    expect(controller.update).toHaveBeenCalledTimes(1)
  })

  it("espone il range associato all'ultima richiesta di formattazione solo durante la notifica", () => {
    const model = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService)
    const view = new EditorView(model, {})
    const range = new TextRange(3, 8)

    let observedRange: TextRange | undefined
    view.attach({
      update: () => {
        observedRange = view.getLastFormatRange()
      },
    })

    view.simulateFormatAction(FormatType.BOLD, range)

    expect(observedRange).toEqual(range)
    // Dopo la notifica il valore "one-shot" viene ripulito (semantica pull, come save/open/undo/redo)
    expect(view.getLastFormatRange()).toBeUndefined()
  })

  it('espone richiesta e range per le operazioni sugli elenchi', () => {
    const model = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService)
    const view = new EditorView(model, {})
    const request = new ListActionRequest(ListOperationType.CREATE_LIST)
    const range = new TextRange(0, 4)

    const observed: { req?: ListActionRequest; range?: TextRange } = {}
    view.attach({
      update: () => {
        observed.req = view.getLastListRequest()
        observed.range = view.getLastListRange()
      },
    })

    view.simulateListAction(request, range)

    expect(observed.req).toBe(request)
    expect(observed.range).toEqual(range)
  })

  it('espone richiesta e range per le operazioni sui link', () => {
    const model = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService)
    const view = new EditorView(model, {})
    const request = new LinkActionRequest(LinkOperationType.INSERT_LINK, 'https://esempio.it', 'testo')
    const range = new TextRange(2, 6)

    const observed: { req?: LinkActionRequest; range?: TextRange } = {}
    view.attach({
      update: () => {
        observed.req = view.getLastLinkRequest()
        observed.range = view.getLastLinkRange()
      },
    })

    view.simulateLinkAction(request, range)

    expect(observed.req).toBe(request)
    expect(observed.range).toEqual(range)
  })

  it('simulateTableRequest espone una TableActionRequest generica (non solo CREATE_TABLE)', () => {
    const model = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService)
    const view = new EditorView(model, {})
    const request = new TableActionRequest(TableOperationType.INSERT_ROW)

    let observed: TableActionRequest | undefined
    view.attach({
      update: () => {
        observed = view.getLastTableRequest()
      },
    })

    view.simulateTableRequest(request)

    expect(observed).toBe(request)
  })

  it('simulateTableAction resta un caso particolare di simulateTableRequest (CREATE_TABLE)', () => {
    const model = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService)
    const view = new EditorView(model, {})

    let observed: TableActionRequest | undefined
    view.attach({
      update: () => {
        observed = view.getLastTableRequest()
      },
    })

    view.simulateTableAction(2, 3)

    expect(observed?.operation).toBe(TableOperationType.CREATE_TABLE)
    expect(observed?.rowCount).toBe(2)
    expect(observed?.colCount).toBe(3)
  })
})
