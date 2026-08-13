import { describe, it, expect } from 'vitest'
import { LinkCommand } from './LinkCommand'
import { NoteModel } from './NoteModel'
import { MarkdownContentEditor } from './MarkdownContentEditor'
import { TextRange } from './TextRange'
import { LinkActionRequest } from './LinkActionRequest'
import { LinkOperationType } from './LinkOperationType'

describe('LinkCommand', () => {
  it("dovrebbe eseguire l'operazione sul link e supportare undo", () => {
    const editor = new MarkdownContentEditor('Link')
    const model = {} as NoteModel
    const range = new TextRange(0, 4)
    const request = new LinkActionRequest(LinkOperationType.INSERT_LINK, 'url', 'testo')

    const command = new LinkCommand(model, range, request, editor)

    command.execute()
    command.undo()
    expect(editor.getContent()).toBe('Link')
  })
})
