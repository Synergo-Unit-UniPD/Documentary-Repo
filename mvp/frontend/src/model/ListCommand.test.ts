import { describe, it, expect } from 'vitest'
import { ListCommand } from './ListCommand'
import { MarkdownContentEditor } from './MarkdownContentEditor'
import { TextRange } from './TextRange'
import { ListActionRequest } from './ListActionRequest'
import { ListOperationType } from './ListOperationType'

describe('ListCommand', () => {
  it("dovrebbe eseguire l'operazione sulla lista e supportare undo", () => {
    const editor = new MarkdownContentEditor('Lista')
    const range = new TextRange(0, 5)
    const request = new ListActionRequest(ListOperationType.CREATE_LIST)

    const command = new ListCommand(range, request, editor)

    command.execute()
    command.undo()
    expect(editor.getContent()).toBe('Lista')
  })
})
