import { describe, it, expect } from 'vitest'
import { TableCommand } from './TableCommand'
import { NoteModel } from './NoteModel'
import { MarkdownContentEditor } from './MarkdownContentEditor'
import { TableActionRequest } from './TableActionRequest'
import { TableOperationType } from './TableOperationType'

describe('TableCommand', () => {
  it("dovrebbe eseguire l'operazione sulla tabella e supportare undo", () => {
    const editor = new MarkdownContentEditor('Tabella')
    const model = {} as NoteModel
    const request = new TableActionRequest(TableOperationType.CREATE_TABLE, 2, 2)

    const command = new TableCommand(model, request, editor)

    command.execute()
    command.undo()
    expect(editor.getContent()).toBe('Tabella')
  })
})
