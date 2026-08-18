import { describe, it, expect, vi } from 'vitest'
import { CommandHistory } from './CommandHistory'
import { EditCommand } from './EditCommand'

class MockCommand implements EditCommand {
  execute = vi.fn()
  undo = vi.fn()
}

describe('CommandHistory', () => {
  it('dovrebbe aggiungere un comando ed eseguire correttamente undo e redo', () => {
    const history = new CommandHistory()
    const cmd = new MockCommand()

    history.push(cmd)

    history.undo()
    expect(cmd.undo).toHaveBeenCalledTimes(1)

    history.redo()
    expect(cmd.execute).toHaveBeenCalledTimes(1)
  })

  it('dovrebbe svuotare il redoStack quando viene aggiunto un nuovo comando', () => {
    const history = new CommandHistory()
    const cmd1 = new MockCommand()
    const cmd2 = new MockCommand()

    history.push(cmd1)
    history.undo()

    history.push(cmd2)
    history.redo()

    expect(cmd1.execute).not.toHaveBeenCalled()
  })

  it('dovrebbe svuotare tutte le code invocando clear', () => {
    const history = new CommandHistory()
    const cmd = new MockCommand()

    history.push(cmd)
    history.clear()
    history.undo()

    expect(cmd.undo).not.toHaveBeenCalled()
  })
})

describe('CommandHistory - canUndo / canRedo', () => {
  it('riflette correttamente la disponibilità di undo/redo lungo il ciclo di vita', () => {
    const history = new CommandHistory()
    const cmd = new MockCommand()

    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)

    history.push(cmd)
    expect(history.canUndo()).toBe(true)
    expect(history.canRedo()).toBe(false)

    history.undo()
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(true)

    history.redo()
    expect(history.canUndo()).toBe(true)
    expect(history.canRedo()).toBe(false)

    history.clear()
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
  })
})
