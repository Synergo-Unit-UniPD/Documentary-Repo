import { describe, it, expect } from 'vitest'
import { FormatTextCommand } from './FormatTextCommand'
import { MarkdownContentEditor } from './MarkdownContentEditor'
import { TextRange } from './TextRange'
import { FormatType } from './FormatType'

describe('FormatTextCommand', () => {
  it("dovrebbe salvare il contenuto ed eseguire l'operazione di formattazione", () => {
    const editor = new MarkdownContentEditor('Testo')
    const range = new TextRange(0, 5)

    const command = new FormatTextCommand(range, FormatType.BOLD, editor)

    command.execute()
    command.undo()

    expect(editor.getContent()).toBe('Testo')
  })

  it('un secondo comando sul range aggiornato (come farebbe la UI reale) rimuove la formattazione appena applicata (toggle)', () => {
    // Riproduce esattamente lo scenario:
    // testo selezionato -> grassetto -> **testo selezionato** -> grassetto -> testo selezionato
    // Dopo l'apply, App.vue riposiziona la selezione sul testo (esclusi i marcatori):
    // è QUEL range che il secondo comando riceve, non quello originale pre-wrap.
    const editor = new MarkdownContentEditor('testo selezionato')
    const range = new TextRange(0, 17)
    const openLength = editor.getFormatMarkerOpenLength(FormatType.BOLD)

    const first = new FormatTextCommand(range, FormatType.BOLD, editor)
    first.execute()
    expect(editor.getContent()).toBe('**testo selezionato**')

    const shiftedRange = new TextRange(range.start + openLength, range.end + openLength)
    const second = new FormatTextCommand(shiftedRange, FormatType.BOLD, editor)
    second.execute()
    expect(editor.getContent()).toBe('testo selezionato')
  })

  it('funziona anche con selezione vuota (cursore): grassetto -> **|** -> grassetto -> |', () => {
    const editor = new MarkdownContentEditor('')
    const range = new TextRange(0, 0)
    const openLength = editor.getFormatMarkerOpenLength(FormatType.BOLD)

    const first = new FormatTextCommand(range, FormatType.BOLD, editor)
    first.execute()
    expect(editor.getContent()).toBe('****')

    // Dopo l'apply su selezione vuota, il cursore si sposta TRA i due marcatori.
    const cursorAfterApply = new TextRange(openLength, openLength)
    const second = new FormatTextCommand(cursorAfterApply, FormatType.BOLD, editor)
    second.execute()
    expect(editor.getContent()).toBe('')
  })

  it('il toggle funziona per tutti i tipi di formattazione, non solo il grassetto', () => {
    const cases: Array<[FormatType, string]> = [
      [FormatType.ITALIC, 'parola'],
      [FormatType.UNDERLINE, 'parola'],
      [FormatType.STRIKETHROUGH, 'parola'],
      [FormatType.QUOTE, 'parola'],
      [FormatType.HEADING, 'parola'],
    ]

    for (const [type, text] of cases) {
      const editor = new MarkdownContentEditor(text)
      const range = new TextRange(0, text.length)
      const openLength = editor.getFormatMarkerOpenLength(type)

      const apply = new FormatTextCommand(range, type, editor)
      apply.execute()
      expect(editor.getContent()).not.toBe(text)

      // Per i tipi di riga (QUOTE/HEADING) isFormatted riconosce la riga a
      // prescindere dallo shift; per i tipi inline serve il range aggiornato.
      const removeRange = new TextRange(range.start + openLength, range.end + openLength)
      const remove = new FormatTextCommand(removeRange, type, editor)
      remove.execute()
      expect(editor.getContent()).toBe(text)
    }
  })

  it('undo dopo un toggle di rimozione ripristina correttamente il testo ancora formattato', () => {
    const editor = new MarkdownContentEditor('testo')
    const range = new TextRange(0, 5)
    const openLength = editor.getFormatMarkerOpenLength(FormatType.BOLD)

    const apply = new FormatTextCommand(range, FormatType.BOLD, editor)
    apply.execute()
    expect(editor.getContent()).toBe('**testo**')

    const shiftedRange = new TextRange(range.start + openLength, range.end + openLength)
    const remove = new FormatTextCommand(shiftedRange, FormatType.BOLD, editor)
    remove.execute()
    expect(editor.getContent()).toBe('testo')

    remove.undo()
    expect(editor.getContent()).toBe('**testo**')

    apply.undo()
    expect(editor.getContent()).toBe('testo')
  })

  it('riproduce esattamente | -> grassetto -> **|** -> grassetto -> | con il range che la UI imposterebbe', () => {
    const editor = new MarkdownContentEditor('inizio-fine')
    const cursorPos = 'inizio-'.length
    const range = new TextRange(cursorPos, cursorPos)
    const openLength = editor.getFormatMarkerOpenLength(FormatType.BOLD)

    const first = new FormatTextCommand(range, FormatType.BOLD, editor)
    first.execute()
    expect(editor.getContent()).toBe('inizio-****fine')

    const cursorAfterApply = new TextRange(cursorPos + openLength, cursorPos + openLength)
    const second = new FormatTextCommand(cursorAfterApply, FormatType.BOLD, editor)
    second.execute()
    expect(editor.getContent()).toBe('inizio-fine')
  })
})
