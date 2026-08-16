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

describe('MarkdownContentEditor - formattazione inline su selezione multi-riga', () => {
  it("applyFormat(BOLD) su tre righe selezionate racchiude OGNI riga singolarmente, non l'intera selezione", () => {
    const editor = new MarkdownContentEditor('uno\ndue\ntre')
    const result = editor.applyFormat(new TextRange(0, 'uno\ndue\ntre'.length), FormatType.BOLD)

    expect(result).toBe('**uno**\n**due**\n**tre**')
  })

  it('applyFormat(ITALIC) su selezione multi-riga usa il singolo asterisco per riga', () => {
    const editor = new MarkdownContentEditor('uno\ndue')
    const result = editor.applyFormat(new TextRange(0, 'uno\ndue'.length), FormatType.ITALIC)

    expect(result).toBe('*uno*\n*due*')
  })

  it('applyFormat su selezione multi-riga non tocca le righe vuote (nessun marcatore vuoto)', () => {
    const editor = new MarkdownContentEditor('uno\n\ntre')
    const result = editor.applyFormat(new TextRange(0, 'uno\n\ntre'.length), FormatType.BOLD)

    expect(result).toBe('**uno**\n\n**tre**')
  })

  it('applyFormat su multi-riga non corrompe un elenco numerato adiacente sulla stessa selezione', () => {
    // Riproduce esattamente lo scenario segnalato: elenco numerato già applicato,
    // poi grassetto sulla stessa selezione multi-riga.
    const editor = new MarkdownContentEditor('1. uno\n2. due\n3. tre')
    const result = editor.applyFormat(new TextRange(0, '1. uno\n2. due\n3. tre'.length), FormatType.BOLD)

    // Il marcatore di apertura deve restare DOPO il prefisso numerico di ogni riga
    // (il grassetto si applica al contenuto, non al marcatore di elenco stesso),
    // non spostare/rompere la numerazione (a differenza del comportamento originale,
    // che produceva "**3. tre" con l'asterisco prima del numero).
    expect(result).toBe('1. **uno**\n2. **due**\n3. **tre**')
  })

  it('isFormatted riconosce una selezione multi-riga come formattata solo se OGNI riga lo è', () => {
    const editor = new MarkdownContentEditor('**uno**\n**due**\n**tre**')
    const formatted = editor.isFormatted(new TextRange(0, '**uno**\n**due**\n**tre**'.length), FormatType.BOLD)

    expect(formatted).toBe(true)
  })

  it('isFormatted è false su multi-riga se anche una sola riga non è formattata', () => {
    const editor = new MarkdownContentEditor('**uno**\ndue\n**tre**')
    const formatted = editor.isFormatted(new TextRange(0, '**uno**\ndue\n**tre**'.length), FormatType.BOLD)

    expect(formatted).toBe(false)
  })

  it('toggleFormat su multi-riga già formattata rimuove i marcatori da ogni riga (round-trip apply/remove)', () => {
    const editor = new MarkdownContentEditor('uno\ndue\ntre')
    const range = new TextRange(0, 'uno\ndue\ntre'.length)

    const applied = editor.toggleFormat(range, FormatType.BOLD)
    expect(applied).toBe('**uno**\n**due**\n**tre**')

    editor.setContent(applied)
    const removed = editor.toggleFormat(new TextRange(0, applied.length), FormatType.BOLD)
    expect(removed).toBe('uno\ndue\ntre')
  })

  it('removeFormat su multi-riga tocca solo le righe che hanno davvero entrambi i marcatori', () => {
    const editor = new MarkdownContentEditor('**uno**\ndue\n**tre**')
    const result = editor.removeFormat(new TextRange(0, '**uno**\ndue\n**tre**'.length), FormatType.BOLD)

    expect(result).toBe('uno\ndue\ntre')
  })
})

describe('MarkdownContentEditor - computeFormatToggleShift (riposizionamento selezione dopo toggle)', () => {
  it('su riga singola restituisce lo stesso spostamento per inizio e fine (comportamento invariato)', () => {
    const editor = new MarkdownContentEditor('uno')
    const { startDelta, endDelta } = editor.computeFormatToggleShift(new TextRange(0, 3), FormatType.BOLD)

    expect(startDelta).toBe(2) // "**".length
    expect(endDelta).toBe(2)
  })

  it("su multi-riga la nuova selezione copre SEMPRE l'intero blocco trasformato (righe intere)", () => {
    const editor = new MarkdownContentEditor('uno\ndue\ntre')
    const range = new TextRange(0, 'uno\ndue\ntre'.length)
    const { startDelta, endDelta } = editor.computeFormatToggleShift(range, FormatType.BOLD)

    // range.start era già all'inizio della riga (lineStart coincide con start): nessuno spostamento.
    expect(startDelta).toBe(0)
    // Fine: l'intero blocco trasformato, marcatori "interni" compresi.
    expect(endDelta).toBe(12)

    // Verifica che lo spostamento calcolato corrisponda davvero al contenuto risultante:
    // la nuova selezione copre l'INTERO blocco trasformato, marcatori compresi su ogni riga.
    const newContent = editor.applyFormat(range, FormatType.BOLD)
    expect(newContent).toBe('**uno**\n**due**\n**tre**')
    expect(newContent.slice(range.start + startDelta, range.end + endDelta)).toBe('**uno**\n**due**\n**tre**')
  })

  it('in rimozione (formattazione già presente) endDelta è negativo, startDelta resta 0 se già a inizio riga', () => {
    const editor = new MarkdownContentEditor('**uno**\n**due**')
    const range = new TextRange(0, '**uno**\n**due**'.length)
    const { startDelta, endDelta } = editor.computeFormatToggleShift(range, FormatType.BOLD)

    expect(startDelta).toBe(0)
    expect(endDelta).toBe(-8) // 2 righe * 4 caratteri

    const removed = editor.removeFormat(range, FormatType.BOLD)
    expect(removed).toBe('uno\ndue')
    expect(removed.slice(range.start + startDelta, range.end + endDelta)).toBe('uno\ndue')
  })
})

describe('MarkdownContentEditor - formattazione inline che rispetta prefissi strutturali (elenco, citazione)', () => {
  it('grassetto su un elenco puntato multi-riga esclude il marcatore "- " da ogni riga, in modo uniforme', () => {
    // Riproduce esattamente lo scenario segnalato: prima riga corretta,
    // righe successive con "**" prima del marcatore invece che dopo.
    const editor = new MarkdownContentEditor('- uno\n- due\n- tre')
    const result = editor.applyFormat(new TextRange(0, '- uno\n- due\n- tre'.length), FormatType.BOLD)

    expect(result).toBe('- **uno**\n- **due**\n- **tre**')
  })

  it('elenco + citazione + barrato: ogni prefisso resta fuori dal marcatore, su tutte le righe allo stesso modo', () => {
    // Riproduce lo scenario "elenco -> citazione -> barrato": prima elenco
    // puntato, poi citazione (che antepone "> " a ogni riga, incluso il
    // marcatore di elenco già presente), poi barrato sull'intera selezione.
    const withList = '- uno\n- due\n- tre'
    const withQuote = '> - uno\n> - due\n> - tre'
    // Verifica di partenza: la citazione produce davvero "> - " su ogni riga
    // (prerequisito dello scenario, non l'oggetto di questo test).
    expect(new MarkdownContentEditor(withList).applyFormat(new TextRange(0, withList.length), FormatType.QUOTE)).toBe(
      withQuote,
    )

    const editor = new MarkdownContentEditor(withQuote)
    const result = editor.applyFormat(new TextRange(0, withQuote.length), FormatType.STRIKETHROUGH)

    // Il barrato deve avvolgere SOLO il contenuto ("uno"/"due"/"tre"),
    // lasciando "> - " intatto e fuori dai marcatori, su ogni riga.
    expect(result).toBe('> - ~~uno~~\n> - ~~due~~\n> - ~~tre~~')
  })

  it('isFormatted riconosce correttamente il grassetto su un elenco multi-riga (prefisso escluso dal controllo)', () => {
    const editor = new MarkdownContentEditor('- **uno**\n- **due**')
    const formatted = editor.isFormatted(new TextRange(0, '- **uno**\n- **due**'.length), FormatType.BOLD)

    expect(formatted).toBe(true)
  })

  it('toggleFormat su un elenco multi-riga: round-trip apply/remove non tocca il marcatore di elenco', () => {
    const editor = new MarkdownContentEditor('- uno\n- due')
    const range = new TextRange(0, '- uno\n- due'.length)

    const applied = editor.toggleFormat(range, FormatType.BOLD)
    expect(applied).toBe('- **uno**\n- **due**')

    editor.setContent(applied)
    const removed = editor.toggleFormat(new TextRange(0, applied.length), FormatType.BOLD)
    expect(removed).toBe('- uno\n- due')
  })

  it('computeFormatToggleShift su un elenco multi-riga: il marcatore di apertura si inserisce DOPO "- ", range.start non si sposta', () => {
    const editor = new MarkdownContentEditor('- uno\n- due')
    const range = new TextRange(0, '- uno\n- due'.length)
    const { startDelta, endDelta } = editor.computeFormatToggleShift(range, FormatType.BOLD)

    // range.start punta a "-", che resta invariato (il "**" si inserisce dopo "- ").
    expect(startDelta).toBe(0)
    // 2 righe * 4 caratteri ("**"+"**") = 8.
    expect(endDelta).toBe(8)

    const newContent = editor.applyFormat(range, FormatType.BOLD)
    expect(newContent).toBe('- **uno**\n- **due**')
  })
})

describe('MarkdownContentEditor - combinazioni multiple di formattazione (elenco + più marcatori inline)', () => {
  it('elenco numerato + barrato + sottolineato, in questo ordine, producono nesting coerente su ogni riga', () => {
    // Riproduce esattamente lo scenario segnalato: 3 elementi di un elenco
    // numerato, poi barrato, poi sottolineato, applicati sull'intera selezione
    // multi-riga ogni volta (come fa App.vue, che riseleziona l'intero blocco
    // dopo ogni comando tramite computeFormatToggleShift/computeListToggleShift).
    let editor = new MarkdownContentEditor('uno\ndue\ntre')
    let range = new TextRange(0, editor.getContent().length)

    // 1. Elenco numerato
    const listShift = editor.computeListToggleShift(range, ListType.ORDERED)
    editor = new MarkdownContentEditor(
      editor.applyListOperation(range, new ListActionRequest(ListOperationType.CREATE_LIST, ListType.ORDERED)),
    )
    range = new TextRange(range.start + listShift.startDelta, range.end + listShift.endDelta)
    expect(editor.getContent()).toBe('1. uno\n2. due\n3. tre')
    expect(editor.getContent().slice(range.start, range.end)).toBe('1. uno\n2. due\n3. tre')

    // 2. Barrato
    const strikeShift = editor.computeFormatToggleShift(range, FormatType.STRIKETHROUGH)
    editor = new MarkdownContentEditor(editor.applyFormat(range, FormatType.STRIKETHROUGH))
    range = new TextRange(range.start + strikeShift.startDelta, range.end + strikeShift.endDelta)
    expect(editor.getContent()).toBe('1. ~~uno~~\n2. ~~due~~\n3. ~~tre~~')
    expect(editor.getContent().slice(range.start, range.end)).toBe('1. ~~uno~~\n2. ~~due~~\n3. ~~tre~~')

    // 3. Sottolineato
    const underlineShift = editor.computeFormatToggleShift(range, FormatType.UNDERLINE)
    editor = new MarkdownContentEditor(editor.applyFormat(range, FormatType.UNDERLINE))
    range = new TextRange(range.start + underlineShift.startDelta, range.end + underlineShift.endDelta)

    // Ogni riga deve avere lo stesso identico nesting coerente: elenco -> <u> -> ~~ -> testo,
    // non una riga diversa dalle altre a seconda di dove cadeva un bordo di selezione.
    expect(editor.getContent()).toBe('1. <u>~~uno~~</u>\n2. <u>~~due~~</u>\n3. <u>~~tre~~</u>')
    expect(editor.getContent().slice(range.start, range.end)).toBe(
      '1. <u>~~uno~~</u>\n2. <u>~~due~~</u>\n3. <u>~~tre~~</u>',
    )
  })

  it('round-trip completo: applicare e poi rimuovere le stesse tre formattazioni riporta al testo originale', () => {
    let editor = new MarkdownContentEditor('uno\ndue\ntre')
    let range = new TextRange(0, editor.getContent().length)

    const applyList = () => {
      const shift = editor.computeListToggleShift(range, ListType.ORDERED)
      editor = new MarkdownContentEditor(
        editor.applyListOperation(range, new ListActionRequest(ListOperationType.CREATE_LIST, ListType.ORDERED)),
      )
      range = new TextRange(range.start + shift.startDelta, range.end + shift.endDelta)
    }
    const toggleFormatAndReselect = (type: FormatType) => {
      const shift = editor.computeFormatToggleShift(range, type)
      editor = new MarkdownContentEditor(editor.toggleFormat(range, type))
      range = new TextRange(range.start + shift.startDelta, range.end + shift.endDelta)
    }

    applyList()
    toggleFormatAndReselect(FormatType.STRIKETHROUGH)
    toggleFormatAndReselect(FormatType.UNDERLINE)
    expect(editor.getContent()).toBe('1. <u>~~uno~~</u>\n2. <u>~~due~~</u>\n3. <u>~~tre~~</u>')

    // Rimuove nell'ordine inverso: sottolineato, poi barrato, poi elenco.
    toggleFormatAndReselect(FormatType.UNDERLINE)
    expect(editor.getContent()).toBe('1. ~~uno~~\n2. ~~due~~\n3. ~~tre~~')

    toggleFormatAndReselect(FormatType.STRIKETHROUGH)
    expect(editor.getContent()).toBe('1. uno\n2. due\n3. tre')

    const listShiftOff = editor.computeListToggleShift(range, ListType.ORDERED)
    editor = new MarkdownContentEditor(
      editor.applyListOperation(range, new ListActionRequest(ListOperationType.CREATE_LIST, ListType.ORDERED)),
    )
    range = new TextRange(range.start + listShiftOff.startDelta, range.end + listShiftOff.endDelta)
    expect(editor.getContent()).toBe('uno\ndue\ntre')
  })

  it('elenco + citazione + barrato (scenario segnalato in precedenza) resta corretto anche dopo la revisione', () => {
    const withList = '- uno\n- due\n- tre'
    const withQuote = new MarkdownContentEditor(withList).applyFormat(
      new TextRange(0, withList.length),
      FormatType.QUOTE,
    )
    expect(withQuote).toBe('> - uno\n> - due\n> - tre')

    const editor = new MarkdownContentEditor(withQuote)
    const result = editor.applyFormat(new TextRange(0, withQuote.length), FormatType.STRIKETHROUGH)
    expect(result).toBe('> - ~~uno~~\n> - ~~due~~\n> - ~~tre~~')
  })
})

describe('MarkdownContentEditor - computeListToggleShift (riposizionamento selezione dopo toggle lista)', () => {
  it("creazione di un elenco puntato su 3 righe: la nuova selezione copre l'intero blocco trasformato", () => {
    const editor = new MarkdownContentEditor('uno\ndue\ntre')
    const range = new TextRange(0, 'uno\ndue\ntre'.length)
    const { startDelta, endDelta } = editor.computeListToggleShift(range, ListType.UNORDERED)

    // range.start era già a inizio riga (lineStart coincide con start): nessuno spostamento.
    expect(startDelta).toBe(0)
    expect(endDelta).toBe(6) // "- ".length * 3 righe

    const newContent = editor.applyListOperation(
      range,
      new ListActionRequest(ListOperationType.CREATE_LIST, ListType.UNORDERED),
    )
    expect(newContent.slice(range.start + startDelta, range.end + endDelta)).toBe('- uno\n- due\n- tre')
  })

  it('conversione da puntato a numerato su multi-riga: i marcatori numerati hanno lunghezze diverse tra loro', () => {
    // Riproduce lo scenario segnalato: elenco puntato ("- ", 2 caratteri)
    // convertito in numerato ("1. ", "2. ", "3. ", tutti a 3 caratteri qui,
    // ma il punto è che lo spostamento totale è calcolato osservando OGNI
    // riga, non stimato da un singolo valore esterno.
    const editor = new MarkdownContentEditor('- uno\n- due\n- tre')
    const range = new TextRange(0, '- uno\n- due\n- tre'.length)
    const { startDelta, endDelta } = editor.computeListToggleShift(range, ListType.ORDERED)

    expect(startDelta).toBe(0)
    expect(endDelta).toBe(3) // +1 per ciascuna delle 3 righe

    const newContent = editor.applyListOperation(
      range,
      new ListActionRequest(ListOperationType.CREATE_LIST, ListType.ORDERED),
    )
    expect(newContent).toBe('1. uno\n2. due\n3. tre')
    expect(newContent.slice(range.start + startDelta, range.end + endDelta)).toBe('1. uno\n2. due\n3. tre')
  })

  it('rimozione (toggle off) di un elenco su multi-riga: endDelta è negativo, startDelta resta 0 se già a inizio riga', () => {
    const editor = new MarkdownContentEditor('- uno\n- due\n- tre')
    const range = new TextRange(0, '- uno\n- due\n- tre'.length)
    const { startDelta, endDelta } = editor.computeListToggleShift(range, ListType.UNORDERED)

    expect(startDelta).toBe(0)
    expect(endDelta).toBe(-6)
  })

  it('con marcatori numerati a due cifre (10., 11., ...) lo spostamento totale tiene conto della lunghezza diversa di ogni riga', () => {
    // 9 righe: la numerazione passa da una cifra a due, il marcatore "10. "
    // è più lungo di "1. ", quindi lo spostamento non può essere un multiplo
    // fisso di un singolo valore.
    const lines = Array.from({ length: 11 }, (_, i) => `riga${i + 1}`)
    const editor = new MarkdownContentEditor(lines.join('\n'))
    const range = new TextRange(0, editor.getContent().length)

    const { endDelta } = editor.computeListToggleShift(range, ListType.ORDERED)

    // Righe 1-9: marcatore "1. ".."9. " (3 caratteri) = 9*3 = 27
    // Righe 10-11: marcatore "10. ", "11. " (4 caratteri) = 2*4 = 8
    expect(endDelta).toBe(27 + 8)
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

describe('MarkdownContentEditor - computeTableOperationCursor (riposizionamento cursore dopo operazioni su tabella)', () => {
  it('CREATE_TABLE posiziona il cursore in fondo al documento, dove la tabella viene davvero creata', () => {
    const editor = new MarkdownContentEditor('Testo prima del cursore, in mezzo al documento.')
    const request = new TableActionRequest(TableOperationType.CREATE_TABLE, 1, 1)
    // Il cursore (prima dell'operazione) è a metà del documento, non in fondo.
    const range = new TextRange(5, 5)

    const cursor = editor.computeTableOperationCursor(request, range)
    const newContent = editor.applyTableOperation(request, range)

    expect(cursor).toBe(newContent.length)
  })

  it("INSERT_ROW/DELETE_ROW posizionano il cursore all'INIZIO della tabella modificata, non dove si trovava prima", () => {
    const editor = new MarkdownContentEditor('')
    editor.setContent(editor.applyTableOperation(new TableActionRequest(TableOperationType.CREATE_TABLE, 2, 1)))
    const tableStart = 0

    const request = new TableActionRequest(TableOperationType.DELETE_ROW, undefined, undefined, 0)
    const range = new TextRange(tableStart + 3, tableStart + 3) // cursore da qualche parte dentro la tabella

    const cursor = editor.computeTableOperationCursor(request, range)

    expect(cursor).toBe(tableStart)
  })

  it('con DUE tabelle, eliminare una riga dalla PRIMA posiziona il cursore lì, non dentro la seconda tabella (bug segnalato)', () => {
    let editor = new MarkdownContentEditor('')
    editor.setContent(editor.applyTableOperation(new TableActionRequest(TableOperationType.CREATE_TABLE, 3, 1)))
    editor.setContent(editor.getContent() + '\nTesto tra le due tabelle.\n\n')
    editor.setContent(editor.applyTableOperation(new TableActionRequest(TableOperationType.CREATE_TABLE, 2, 1)))

    // Ricostruiamo un editor "pulito" con lo stesso contenuto, per calcolare
    // dove inizia esattamente la prima tabella (posizione 0, dato che è la
    // primissima cosa nel documento).
    editor = new MarkdownContentEditor(editor.getContent())
    const firstTableStart = 0

    // Cursore dentro la PRIMA tabella (che ha più righe della seconda: la
    // differenza di lunghezza tra le due, dopo l'eliminazione, è proprio ciò
    // che prima faceva "saltare" il cursore nella tabella sbagliata).
    const range = new TextRange(3, 3)
    const request = new TableActionRequest(TableOperationType.DELETE_ROW, undefined, undefined, 0)

    const cursor = editor.computeTableOperationCursor(request, range)

    expect(cursor).toBe(firstTableStart)
  })

  it('DELETE_TABLE posiziona il cursore dove il testo riprende, non alla vecchia posizione numerica', () => {
    const editor = new MarkdownContentEditor('Prima\n\n| Colonna 1 |\n| --- |\n|  |\nDopo')

    const tableStart = 'Prima\n\n'.length
    const range = new TextRange(tableStart + 2, tableStart + 2)
    const request = new TableActionRequest(TableOperationType.DELETE_TABLE)

    const cursor = editor.computeTableOperationCursor(request, range)
    const newContent = editor.applyTableOperation(request, range)

    expect(newContent.slice(cursor)).toBe('\nDopo')
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
