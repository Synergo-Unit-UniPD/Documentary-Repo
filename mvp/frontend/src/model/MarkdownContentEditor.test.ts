import { describe, it, expect } from 'vitest'
import { MarkdownContentEditor } from './MarkdownContentEditor'
import { TextRange } from './TextRange'
import { FormatType } from './FormatType'
import { TableActionRequest } from './TableActionRequest'
import { TableOperationType } from './TableOperationType'
import { ListActionRequest } from './ListActionRequest'
import { ListOperationType } from './ListOperationType'
import { ListType } from './ListType'
import { LinkActionRequest } from './LinkActionRequest'
import { LinkOperationType } from './LinkOperationType'
import { InvalidTableDimensionError } from './InvalidTableDimensionError'

describe('MarkdownContentEditor - get/set', () => {
  it('dovrebbe gestire get e set del content', () => {
    const editor = new MarkdownContentEditor('Testo iniziale')
    expect(editor.getContent()).toBe('Testo iniziale')

    editor.setContent('Nuovo testo')
    expect(editor.getContent()).toBe('Nuovo testo')
  })

  it('dovrebbe possedere tutte le firme previste da UML', () => {
    const editor = new MarkdownContentEditor()
    const range = new TextRange(0, 5)

    expect(typeof editor.insertText).toBe('function')
    expect(typeof editor.removeFormat).toBe('function')
    expect(typeof editor.applyTableOperation).toBe('function')
    expect(typeof editor.applyListOperation).toBe('function')
    expect(typeof editor.applyLinkOperation).toBe('function')
    expect(editor.getLinkAt(range)).toBeDefined()
  })
})

describe('MarkdownContentEditor - insertText', () => {
  it('inserisce testo alla posizione richiesta', () => {
    const editor = new MarkdownContentEditor('Ciao mondo')
    const result = editor.insertText(5, 'bel ')
    expect(result).toBe('Ciao bel mondo')
  })

  it('gestisce posizioni fuori dai limiti senza generare errori', () => {
    const editor = new MarkdownContentEditor('abc')
    expect(editor.insertText(100, 'X')).toBe('abcX')
    expect(editor.insertText(-5, 'X')).toBe('Xabc')
  })
})

describe('MarkdownContentEditor - formattazione inline', () => {
  it('applyFormat(BOLD) racchiude il range tra doppi asterischi', () => {
    const editor = new MarkdownContentEditor('Testo')
    const result = editor.applyFormat(new TextRange(0, 5), FormatType.BOLD)
    expect(result).toBe('**Testo**')
  })

  it('applyFormat(ITALIC) usa un singolo asterisco', () => {
    const editor = new MarkdownContentEditor('parola')
    const result = editor.applyFormat(new TextRange(0, 6), FormatType.ITALIC)
    expect(result).toBe('*parola*')
  })

  it('applyFormat(STRIKETHROUGH) usa la doppia tilde', () => {
    const editor = new MarkdownContentEditor('errore')
    const result = editor.applyFormat(new TextRange(0, 6), FormatType.STRIKETHROUGH)
    expect(result).toBe('~~errore~~')
  })

  it('applyFormat(UNDERLINE) usa i tag <u>', () => {
    const editor = new MarkdownContentEditor('importante')
    const result = editor.applyFormat(new TextRange(0, 10), FormatType.UNDERLINE)
    expect(result).toBe('<u>importante</u>')
  })

  it('removeFormat rimuove i marcatori adiacenti al range (contratto "selezione corrente")', () => {
    const editor = new MarkdownContentEditor('Testo')
    const range = new TextRange(0, 5)

    editor.setContent(editor.applyFormat(range, FormatType.BOLD))
    expect(editor.getContent()).toBe('**Testo**')

    // Dopo l'apply, il testo logico si trova ora spostato di open.length (2 per **):
    // removeFormat si aspetta il range della selezione ATTUALE (il testo, non i
    // marcatori), non il range originale pre-wrap: è così che App.vue riposiziona
    // la selezione dopo ogni toggle (vedi anche il test "isFormatted...").
    const shiftedRange = new TextRange(2, 7)
    editor.setContent(editor.removeFormat(shiftedRange, FormatType.BOLD))
    expect(editor.getContent()).toBe('Testo')
  })

  it('removeFormat non modifica il contenuto se i marcatori non combaciano', () => {
    const editor = new MarkdownContentEditor('Testo semplice')
    const result = editor.removeFormat(new TextRange(0, 5), FormatType.BOLD)
    expect(result).toBe('Testo semplice')
  })

  it('applyFormat opera su una selezione parziale di una riga più ampia', () => {
    const editor = new MarkdownContentEditor('Una frase con parola chiave da evidenziare')
    const start = 'Una frase con '.length
    const end = start + 'parola'.length

    const result = editor.applyFormat(new TextRange(start, end), FormatType.BOLD)
    expect(result).toBe('Una frase con **parola** chiave da evidenziare')
  })
})

describe('MarkdownContentEditor - formattazione di riga (citazione, intestazione)', () => {
  it('applyFormat(QUOTE) antepone "> " alla riga', () => {
    const editor = new MarkdownContentEditor('Una citazione')
    const result = editor.applyFormat(new TextRange(0, 4), FormatType.QUOTE)
    expect(result).toBe('> Una citazione')
  })

  it('applyFormat(HEADING) antepone "# " alla riga', () => {
    const editor = new MarkdownContentEditor('Titolo')
    const result = editor.applyFormat(new TextRange(0, 3), FormatType.HEADING)
    expect(result).toBe('# Titolo')
  })

  it('removeFormat(QUOTE) rimuove il prefisso "> "', () => {
    const editor = new MarkdownContentEditor('> Una citazione')
    const result = editor.removeFormat(new TextRange(2, 5), FormatType.QUOTE)
    expect(result).toBe('Una citazione')
  })

  it('la formattazione di riga si applica a tutte le righe coperte dal range', () => {
    const editor = new MarkdownContentEditor('riga uno\nriga due\nriga tre')
    const range = new TextRange(0, editor.getContent().indexOf('riga due') + 'riga due'.length)

    const result = editor.applyFormat(range, FormatType.QUOTE)
    expect(result).toBe('> riga uno\n> riga due\nriga tre')
  })
})

describe('MarkdownContentEditor - tabelle', () => {
  it('CREATE_TABLE con dimensioni valide genera una tabella Markdown ben formata', () => {
    const editor = new MarkdownContentEditor('')
    const request = new TableActionRequest(TableOperationType.CREATE_TABLE, 2, 2)

    const result = editor.applyTableOperation(request)

    expect(result).toContain('| Colonna 1 | Colonna 2 |')
    expect(result).toContain('| --- | --- |')
    // 2 righe header/separatore + 2 righe dati
    expect(result.trim().split('\n')).toHaveLength(4)
  })

  it('CREATE_TABLE con dimensioni non valide solleva InvalidTableDimensionError', () => {
    const editor = new MarkdownContentEditor('')
    const request = new TableActionRequest(TableOperationType.CREATE_TABLE, -1, 0)

    expect(() => editor.applyTableOperation(request)).toThrow(InvalidTableDimensionError)
  })

  it('INSERT_ROW aggiunge una riga alla tabella esistente', () => {
    const editor = new MarkdownContentEditor('')
    editor.setContent(editor.applyTableOperation(new TableActionRequest(TableOperationType.CREATE_TABLE, 1, 2)))

    const before = editor.getContent().trim().split('\n').length
    editor.setContent(editor.applyTableOperation(new TableActionRequest(TableOperationType.INSERT_ROW)))
    const after = editor.getContent().trim().split('\n').length

    expect(after).toBe(before + 1)
  })

  it('DELETE_ROW rimuove una riga dati dalla tabella', () => {
    const editor = new MarkdownContentEditor('')
    editor.setContent(editor.applyTableOperation(new TableActionRequest(TableOperationType.CREATE_TABLE, 2, 2)))

    const before = editor.getContent().trim().split('\n').length
    editor.setContent(
      editor.applyTableOperation(new TableActionRequest(TableOperationType.DELETE_ROW, undefined, undefined, 0)),
    )
    const after = editor.getContent().trim().split('\n').length

    expect(after).toBe(before - 1)
  })

  it('EDIT_CELL aggiorna il contenuto della cella indicata', () => {
    const editor = new MarkdownContentEditor('')
    editor.setContent(editor.applyTableOperation(new TableActionRequest(TableOperationType.CREATE_TABLE, 1, 1)))

    const request = new TableActionRequest(TableOperationType.EDIT_CELL, undefined, undefined, 0, 0, 'valore')
    editor.setContent(editor.applyTableOperation(request))

    expect(editor.getContent()).toContain('valore')
  })

  it('DELETE_TABLE rimuove interamente il blocco tabella', () => {
    const editor = new MarkdownContentEditor('Testo prima\n\n')
    editor.setContent(editor.applyTableOperation(new TableActionRequest(TableOperationType.CREATE_TABLE, 1, 1)))
    expect(editor.getContent()).toContain('|')

    editor.setContent(editor.applyTableOperation(new TableActionRequest(TableOperationType.DELETE_TABLE)))
    expect(editor.getContent()).not.toContain('|')
    expect(editor.getContent()).toContain('Testo prima')
  })
})

describe("MarkdownContentEditor - operazioni su tabelle multiple: opera su quella selezionata, non sull'ultima creata", () => {
  function buildTwoTablesDocument(): {
    editor: MarkdownContentEditor
    firstTableStart: number
    secondTableStart: number
  } {
    const editor = new MarkdownContentEditor('Prima tabella\n\n')
    editor.setContent(editor.applyTableOperation(new TableActionRequest(TableOperationType.CREATE_TABLE, 1, 1)))
    const firstTableStart = editor.getContent().indexOf('| Colonna 1 |')

    editor.setContent(editor.getContent() + '\nTesto in mezzo\n\n')
    editor.setContent(editor.applyTableOperation(new TableActionRequest(TableOperationType.CREATE_TABLE, 1, 1)))
    const secondTableStart = editor.getContent().lastIndexOf('| Colonna 1 |')

    return { editor, firstTableStart, secondTableStart }
  }

  it("DELETE_TABLE con il cursore sulla PRIMA tabella elimina quella, non la seconda (l'ultima creata)", () => {
    const { editor, firstTableStart, secondTableStart } = buildTwoTablesDocument()
    expect(editor.getContent().match(/\|/g)?.length).toBeGreaterThan(0)

    const cursorInFirstTable = new TextRange(firstTableStart + 2, firstTableStart + 2)
    editor.setContent(
      editor.applyTableOperation(new TableActionRequest(TableOperationType.DELETE_TABLE), cursorInFirstTable),
    )

    // La seconda tabella deve essere sopravvissuta, la prima no.
    const remaining = editor.getContent()
    expect(remaining).toContain('Testo in mezzo')
    expect(remaining.indexOf('| Colonna 1 |')).toBeGreaterThan(remaining.indexOf('Testo in mezzo'))
    expect(remaining.split('| Colonna 1 |').length - 1).toBe(1) // una sola tabella rimasta
  })

  it('DELETE_TABLE con il cursore sulla SECONDA tabella elimina quella, non la prima', () => {
    const { editor, secondTableStart } = buildTwoTablesDocument()

    const cursorInSecondTable = new TextRange(secondTableStart + 2, secondTableStart + 2)
    editor.setContent(
      editor.applyTableOperation(new TableActionRequest(TableOperationType.DELETE_TABLE), cursorInSecondTable),
    )

    const remaining = editor.getContent()
    expect(remaining).toContain('Prima tabella')
    expect(remaining.split('| Colonna 1 |').length - 1).toBe(1) // solo la prima tabella rimasta
    expect(remaining.indexOf('| Colonna 1 |')).toBeLessThan(remaining.indexOf('Testo in mezzo'))
  })

  it('INSERT_ROW con il cursore sulla prima tabella aggiunge la riga lì, non nella seconda', () => {
    const { editor, firstTableStart } = buildTwoTablesDocument()
    const secondTableRowsBefore = editor.getContent().split('| Colonna 1 |')[2]?.split('\n').length

    const cursorInFirstTable = new TextRange(firstTableStart + 2, firstTableStart + 2)
    editor.setContent(
      editor.applyTableOperation(new TableActionRequest(TableOperationType.INSERT_ROW), cursorInFirstTable),
    )

    // La prima tabella ora ha una riga dati in più (2 invece di 1)
    const firstTableBlock = editor.getContent().split('Testo in mezzo')[0]
    const firstTableLineCount = firstTableBlock
      .trim()
      .split('\n')
      .filter((l) => l.startsWith('|')).length
    expect(firstTableLineCount).toBe(4) // header + separatore + 2 righe dati
  })
})

describe('MarkdownContentEditor - elenchi', () => {
  it('CREATE_LIST (non ordinato) antepone "- " alla riga selezionata', () => {
    const editor = new MarkdownContentEditor('primo elemento')
    const request = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.UNORDERED)

    const result = editor.applyListOperation(new TextRange(0, 5), request)
    expect(result).toBe('- primo elemento')
  })

  it('CREATE_LIST (ordinato) antepone "1. " alla riga selezionata', () => {
    const editor = new MarkdownContentEditor('primo elemento')
    const request = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.ORDERED)

    const result = editor.applyListOperation(new TextRange(0, 5), request)
    expect(result).toBe('1. primo elemento')
  })

  it('TOGGLE_LIST_TYPE trasforma un elenco puntato in numerato', () => {
    const editor = new MarkdownContentEditor('- elemento')
    const request = new ListActionRequest(ListOperationType.TOGGLE_LIST_TYPE)

    const result = editor.applyListOperation(new TextRange(2, 10), request)
    expect(result).toBe('1. elemento')
  })

  it('REMOVE_LIST rimuove il marcatore mantenendo il testo', () => {
    const editor = new MarkdownContentEditor('- elemento da spuntare')
    const request = new ListActionRequest(ListOperationType.REMOVE_LIST)

    const result = editor.applyListOperation(new TextRange(2, 10), request)
    expect(result).toBe('elemento da spuntare')
  })

  it('INDENT_ITEM aggiunge indentazione, OUTDENT_ITEM la rimuove', () => {
    const editor = new MarkdownContentEditor('- elemento')

    const indented = editor.applyListOperation(
      new TextRange(0, 5),
      new ListActionRequest(ListOperationType.INDENT_ITEM),
    )
    expect(indented).toBe('  - elemento')

    editor.setContent(indented)
    const outdented = editor.applyListOperation(
      new TextRange(0, 5),
      new ListActionRequest(ListOperationType.OUTDENT_ITEM),
    )
    expect(outdented).toBe('- elemento')
  })
})

describe('MarkdownContentEditor - CREATE_LIST come toggle "intelligente"', () => {
  it('cliccando lo stesso tipo su una riga già di quel tipo, lo RIMUOVE (toggle off)', () => {
    const editor = new MarkdownContentEditor('- elemento')
    const request = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.UNORDERED)

    const result = editor.applyListOperation(new TextRange(2, 2), request)
    expect(result).toBe('elemento')
  })

  it('cliccando un tipo diverso da quello attuale, lo CONVERTE (non aggiunge un secondo marcatore)', () => {
    const editor = new MarkdownContentEditor('- elemento')
    const request = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.ORDERED)

    const result = editor.applyListOperation(new TextRange(2, 2), request)
    expect(result).toBe('1. elemento')
  })

  it('la conversione viceversa (numerato -> puntato) funziona allo stesso modo', () => {
    const editor = new MarkdownContentEditor('1. elemento')
    const request = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.UNORDERED)

    const result = editor.applyListOperation(new TextRange(3, 3), request)
    expect(result).toBe('- elemento')
  })

  it('funziona su testo selezionato ESATTAMENTE come su cursore vuoto, senza bisogno di un pulsante "rimuovi" separato', () => {
    const editor = new MarkdownContentEditor('- elemento intero selezionato')
    const request = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.UNORDERED)
    const fullSelection = new TextRange(2, editor.getContent().length)

    const result = editor.applyListOperation(fullSelection, request)
    expect(result).toBe('elemento intero selezionato')
  })

  it('converte più righe puntate in numerate con numerazione progressiva (bug: produceva "1.ciao" per ogni riga)', () => {
    const editor = new MarkdownContentEditor('- ciao\n- ciao')
    const request = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.ORDERED)
    const fullSelection = new TextRange(0, editor.getContent().length)

    const result = editor.applyListOperation(fullSelection, request)
    expect(result).toBe('1. ciao\n2. ciao')
  })

  it('rimuove più righe numerate in un colpo solo se già del tipo richiesto', () => {
    const editor = new MarkdownContentEditor('1. uno\n2. due\n3. tre')
    const request = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.ORDERED)
    const fullSelection = new TextRange(0, editor.getContent().length)

    const result = editor.applyListOperation(fullSelection, request)
    expect(result).toBe('uno\ndue\ntre')
  })

  it('| -> elenco -> -| : la riga vuota diventa un elemento (nessun contenuto perso)', () => {
    const editor = new MarkdownContentEditor('')
    const request = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.UNORDERED)

    const result = editor.applyListOperation(new TextRange(0, 0), request)
    expect(result).toBe('- ')
  })
})

describe('MarkdownContentEditor - isListOfType (per la UI: capire cosa farà il toggle)', () => {
  it('è true se la riga è già un elenco dello stesso tipo richiesto', () => {
    const editor = new MarkdownContentEditor('- elemento')
    expect(editor.isListOfType(new TextRange(2, 2), ListType.UNORDERED)).toBe(true)
    expect(editor.isListOfType(new TextRange(2, 2), ListType.ORDERED)).toBe(false)
  })

  it('è false se la riga non è ancora un elenco', () => {
    const editor = new MarkdownContentEditor('testo normale')
    expect(editor.isListOfType(new TextRange(0, 0), ListType.UNORDERED)).toBe(false)
  })
})

describe('MarkdownContentEditor - link ipertestuali', () => {
  it('INSERT_LINK trasforma il testo selezionato in un link Markdown', () => {
    const editor = new MarkdownContentEditor('vedi qui per approfondire')
    const start = 'vedi '.length
    const end = start + 'qui'.length
    const request = new LinkActionRequest(LinkOperationType.INSERT_LINK, 'https://esempio.it')

    const result = editor.applyLinkOperation(new TextRange(start, end), request)
    expect(result).toBe('vedi [qui](https://esempio.it) per approfondire')
  })

  it('getLinkAt individua un link esistente che copre il range', () => {
    const editor = new MarkdownContentEditor('vedi [qui](https://esempio.it) per approfondire')
    const linkStart = editor.getContent().indexOf('qui')
    const linkEnd = linkStart + 3

    const found = editor.getLinkAt(new TextRange(linkStart, linkEnd))
    expect(found.operation).toBe(LinkOperationType.EDIT_LINK)
    expect(found.url).toBe('https://esempio.it')
    expect(found.label).toBe('qui')
  })

  it('EDIT_LINK aggiorna url e label di un link esistente', () => {
    const editor = new MarkdownContentEditor('[qui](https://vecchio.it)')
    const request = new LinkActionRequest(LinkOperationType.EDIT_LINK, 'https://nuovo.it', 'link')

    const result = editor.applyLinkOperation(new TextRange(1, 4), request)
    expect(result).toBe('[link](https://nuovo.it)')
  })

  it('REMOVE_LINK mantiene solo il testo visibile del link', () => {
    const editor = new MarkdownContentEditor('vedi [qui](https://esempio.it) per approfondire')
    const linkStart = editor.getContent().indexOf('qui')

    const result = editor.applyLinkOperation(
      new TextRange(linkStart, linkStart + 3),
      new LinkActionRequest(LinkOperationType.REMOVE_LINK),
    )
    expect(result).toBe('vedi qui per approfondire')
  })
})

describe('MarkdownContentEditor - isFormatted / toggleFormat (rimovibilità della formattazione)', () => {
  it('isFormatted è false prima di applicare la formattazione', () => {
    const editor = new MarkdownContentEditor('Testo')
    expect(editor.isFormatted(new TextRange(0, 5), FormatType.BOLD)).toBe(false)
  })

  it('isFormatted è true su un range adiacente ai marcatori appena applicati', () => {
    const editor = new MarkdownContentEditor('Testo')
    editor.setContent(editor.applyFormat(new TextRange(0, 5), FormatType.BOLD))
    expect(editor.getContent()).toBe('**Testo**')

    // Il range che rappresenta il testo (non i marcatori) è ora (2,7): è quello
    // che App.vue imposta come selezione dopo l'apply (vedi App.vue onFormat).
    expect(editor.isFormatted(new TextRange(2, 7), FormatType.BOLD)).toBe(true)
  })

  it('toggleFormat applica la formattazione se assente e la rimuove se già presente (con range aggiornato)', () => {
    const editor = new MarkdownContentEditor('testo selezionato')
    const range = new TextRange(0, 17)

    editor.setContent(editor.toggleFormat(range, FormatType.BOLD))
    expect(editor.getContent()).toBe('**testo selezionato**')

    // Come nella UI reale: dopo l'apply la selezione "logica" si sposta di
    // open.length (2), quindi il secondo toggle usa il range shiftato.
    const shiftedRange = new TextRange(2, 19)
    editor.setContent(editor.toggleFormat(shiftedRange, FormatType.BOLD))
    expect(editor.getContent()).toBe('testo selezionato')
  })

  it('toggleFormat funziona con una selezione vuota (cursore senza testo selezionato)', () => {
    const editor = new MarkdownContentEditor('')
    const range = new TextRange(0, 0)

    editor.setContent(editor.toggleFormat(range, FormatType.BOLD))
    expect(editor.getContent()).toBe('****')

    // Dopo l'apply su selezione vuota, il cursore si sposta tra i marcatori (posizione 2).
    const cursorAfterApply = new TextRange(2, 2)
    editor.setContent(editor.toggleFormat(cursorAfterApply, FormatType.BOLD))
    expect(editor.getContent()).toBe('')
  })

  it('toggleFormat con cursore in mezzo a testo esistente inserisce ed espelle i marcatori nello stesso punto', () => {
    const editor = new MarkdownContentEditor('inizio-fine')
    const cursorPos = 'inizio-'.length
    const range = new TextRange(cursorPos, cursorPos)

    editor.setContent(editor.toggleFormat(range, FormatType.BOLD))
    expect(editor.getContent()).toBe('inizio-****fine')

    const cursorAfterApply = new TextRange(cursorPos + 2, cursorPos + 2)
    editor.setContent(editor.toggleFormat(cursorAfterApply, FormatType.BOLD))
    expect(editor.getContent()).toBe('inizio-fine')
  })

  it('isFormatted riconosce anche le formattazioni di riga (citazione, intestazione)', () => {
    const editor = new MarkdownContentEditor('Titolo')
    expect(editor.isFormatted(new TextRange(0, 6), FormatType.HEADING)).toBe(false)

    editor.setContent(editor.applyFormat(new TextRange(0, 6), FormatType.HEADING))
    expect(editor.getContent()).toBe('# Titolo')
    expect(editor.isFormatted(new TextRange(2, 8), FormatType.HEADING)).toBe(true)
  })
})

describe('MarkdownContentEditor - getListMarkerLength (per il riposizionamento del cursore)', () => {
  it('restituisce 0 se la riga non è un elemento di un elenco', () => {
    const editor = new MarkdownContentEditor('riga normale')
    expect(editor.getListMarkerLength(new TextRange(0, 0))).toBe(0)
  })

  it('restituisce la lunghezza del marcatore puntato "- "', () => {
    const editor = new MarkdownContentEditor('- elemento')
    expect(editor.getListMarkerLength(new TextRange(2, 2))).toBe(2)
  })

  it('restituisce la lunghezza del marcatore numerato "1. "', () => {
    const editor = new MarkdownContentEditor('1. elemento')
    expect(editor.getListMarkerLength(new TextRange(3, 3))).toBe(3)
  })

  it('include un eventuale rientro nella lunghezza del marcatore', () => {
    const editor = new MarkdownContentEditor('  - elemento rientrato')
    expect(editor.getListMarkerLength(new TextRange(4, 4))).toBe(4)
  })
})

describe('MarkdownContentEditor - CREATE_LIST su riga vuota (cursore)', () => {
  it('| -> elenco puntato -> -| : la riga vuota diventa un elemento di elenco', () => {
    const editor = new MarkdownContentEditor('')
    const request = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.UNORDERED)

    const result = editor.applyListOperation(new TextRange(0, 0), request)
    expect(result).toBe('- ')
  })

  it('funziona anche su una riga vuota in mezzo ad altro testo', () => {
    const editor = new MarkdownContentEditor('prima\n\ndopo')
    const emptyLineStart = 'prima\n'.length
    const request = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.UNORDERED)

    const result = editor.applyListOperation(new TextRange(emptyLineStart, emptyLineStart), request)
    expect(result).toBe('prima\n- \ndopo')
  })
})

describe('MarkdownContentEditor - citazione e intestazione su riga vuota (cursore)', () => {
  it('| -> citazione -> >| : la riga vuota diventa una citazione', () => {
    const editor = new MarkdownContentEditor('')
    const range = new TextRange(0, 0)

    const applied = editor.applyFormat(range, FormatType.QUOTE)
    expect(applied).toBe('> ')
  })

  it('>| -> citazione -> | : un secondo toggle rimuove la citazione dalla riga vuota', () => {
    const editor = new MarkdownContentEditor('> ')
    const range = new TextRange(2, 2)

    const removed = editor.toggleFormat(range, FormatType.QUOTE)
    expect(removed).toBe('')
  })

  it("| -> intestazione -> #| : la riga vuota diventa un'intestazione", () => {
    const editor = new MarkdownContentEditor('')
    const range = new TextRange(0, 0)

    const applied = editor.applyFormat(range, FormatType.HEADING)
    expect(applied).toBe('# ')
  })

  it('il ciclo completo di toggle su riga vuota funziona sia per citazione sia per intestazione', () => {
    for (const type of [FormatType.QUOTE, FormatType.HEADING]) {
      const editor = new MarkdownContentEditor('')
      const range = new TextRange(0, 0)

      const applied = editor.toggleFormat(range, type)
      expect(applied).not.toBe('')

      editor.setContent(applied)
      const prefixLength = editor.getFormatMarkerOpenLength(type)
      const removed = editor.toggleFormat(new TextRange(prefixLength, prefixLength), type)
      expect(removed).toBe('')
    }
  })
})
