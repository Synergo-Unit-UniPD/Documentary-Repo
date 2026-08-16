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

/** Marcatori inline associati a ciascun FormatType "wrap" (grassetto, corsivo, ...). */
const INLINE_MARKERS: Partial<Record<FormatType, { open: string; close: string }>> = {
  [FormatType.BOLD]: { open: '**', close: '**' },
  [FormatType.ITALIC]: { open: '*', close: '*' },
  [FormatType.UNDERLINE]: { open: '<u>', close: '</u>' },
  [FormatType.STRIKETHROUGH]: { open: '~~', close: '~~' },
}

/** FormatType che agiscono a livello di riga (prefisso), non di wrap inline. */
const LINE_PREFIXES: Partial<Record<FormatType, string>> = {
  [FormatType.QUOTE]: '> ',
  [FormatType.HEADING]: '# ',
}

const UNORDERED_MARKER = '- '
const ORDERED_MARKER_REGEX = /^\d+\.\s/
const LIST_ITEM_REGEX = /^(\s*)(-\s|\d+\.\s)/
const LINK_REGEX = /\[([^\]]*)\]\(([^)]*)\)/g

/**
 * Editor "puro" del contenuto Markdown della nota: incapsula tutte le trasformazioni
 * testuali (inserimento, formattazione, tabelle, elenchi, link) operando sulla stringa
 * di contenuto corrente. Non conosce CodeMirror né la UI: viene guidato dai Command
 * (pattern Command, Sezione 5.3.2 Specifica Tecnica) costruiti dall'EditorController.
 */
export class MarkdownContentEditor {
  private content: string

  constructor(initialContent: string = '') {
    this.content = initialContent
  }

  public getContent(): string {
    return this.content
  }

  public setContent(content: string): void {
    this.content = content
  }

  // ------------------------------------------------------------------
  // Inserimento testo libero (scrittura manuale e accettazione proposte AI)
  // ------------------------------------------------------------------

  public insertText(position: number, text: string): string {
    const safePosition = Math.max(0, Math.min(position, this.content.length))
    return this.content.slice(0, safePosition) + text + this.content.slice(safePosition)
  }

  // ------------------------------------------------------------------
  // Formattazione inline e di riga (grassetto, corsivo, sottolineato,
  // barrato, citazione, intestazione) - R5-R28
  // ------------------------------------------------------------------

  /**
   * Lunghezza del prefisso "strutturale" (citazione ed elenco, anche
   * combinati come "> - ") all'inizio della riga indicata, da ESCLUDERE
   * quando si applica/rimuove un marcatore inline su un blocco multi-riga:
   * senza questa esclusione, il marcatore finirebbe prima del prefisso su
   * alcune righe e dopo su altre (a seconda di dove cade il bordo grezzo
   * della selezione, non della struttura reale della riga), producendo un
   * risultato incoerente riga per riga e rompendo la sintassi della lista
   * o della citazione.
   */
  private structuralPrefixLength(line: string): number {
    let rest = line
    let length = 0

    const quotePrefix = LINE_PREFIXES[FormatType.QUOTE]
    if (quotePrefix !== undefined && rest.startsWith(quotePrefix)) {
      length += quotePrefix.length
      rest = rest.slice(quotePrefix.length)
    }

    const listMatch = rest.match(LIST_ITEM_REGEX)
    if (listMatch) {
      length += listMatch[0].length
    }

    return length
  }

  public applyFormat(range: TextRange, type: FormatType): string {
    const linePrefix = LINE_PREFIXES[type]
    if (linePrefix !== undefined) {
      return this.applyLinePrefix(range, linePrefix)
    }

    const marker = INLINE_MARKERS[type]
    if (marker === undefined) {
      return this.content
    }

    const { start, end } = this.normalizeRange(range)
    const selected = this.content.slice(start, end)

    if (!selected.includes('\n')) {
      // Caso comune: selezione su una sola riga, avvolge esattamente la
      // selezione (permette di formattare anche solo una parte della riga).
      return this.content.slice(0, start) + marker.open + selected + marker.close + this.content.slice(end)
    }

    // Selezione multi-riga (R5-R28): si espande SEMPRE alle righe INTERE
    // toccate (come già fanno Quote/Heading/Elenchi), indipendentemente da
    // dove cade il bordo grezzo della selezione - altrimenti il risultato
    // dipenderebbe in modo imprevedibile da dove esattamente l'utente ha
    // iniziato/finito il trascinamento, con esiti diversi riga per riga
    // (bug segnalato). Il marcatore va sempre subito dopo l'eventuale
    // prefisso strutturale (elenco/citazione) e avvolge tutto il resto
    // della riga, compresi eventuali marcatori già presenti da
    // formattazioni precedenti applicate in un ordine diverso (es. elenco
    // + barrato + sottolineato, in qualsiasi ordine). Le righe senza
    // contenuto reale (vuote, o solo prefisso) restano intatte.
    const { lineStart, lineEnd } = this.expandToLines(range)
    const block = this.content.slice(lineStart, lineEnd)
    const formattedLines = block.split('\n').map((line) => {
      const prefixLen = this.structuralPrefixLength(line)
      const prefix = line.slice(0, prefixLen)
      const rest = line.slice(prefixLen)
      if (rest.length === 0) return line
      return prefix + marker.open + rest + marker.close
    })
    return this.content.slice(0, lineStart) + formattedLines.join('\n') + this.content.slice(lineEnd)
  }

  public removeFormat(range: TextRange, type: FormatType): string {
    const linePrefix = LINE_PREFIXES[type]
    if (linePrefix !== undefined) {
      return this.removeLinePrefix(range, linePrefix)
    }

    const marker = INLINE_MARKERS[type]
    if (marker === undefined) {
      return this.content
    }

    const { start, end } = this.normalizeRange(range)
    const selected = this.content.slice(start, end)

    if (!selected.includes('\n')) {
      // Contratto "adiacente": il range rappresenta il testo/cursore ATTUALMENTE
      // selezionato (che, dopo un apply, corrisponde al testo racchiuso tra i
      // marcatori, non ai marcatori stessi) e i marcatori si cercano subito
      // PRIMA dell'inizio e subito DOPO la fine del range. Questo è coerente con
      // come App.vue riposiziona la selezione dopo ogni toggle (vedi toggleFormat).
      const openStart = start - marker.open.length
      const openEnd = start
      const closeStart = end
      const closeEnd = end + marker.close.length

      const hasOpenMarker = openStart >= 0 && this.content.slice(openStart, openEnd) === marker.open
      const hasCloseMarker = this.content.slice(closeStart, closeEnd) === marker.close

      if (!hasOpenMarker || !hasCloseMarker) {
        // I marcatori non sono (più) presenti nella posizione attesa: nessuna modifica.
        return this.content
      }

      return this.content.slice(0, openStart) + this.content.slice(openEnd, closeStart) + this.content.slice(closeEnd)
    }

    // Selezione multi-riga: stessa espansione a righe intere di applyFormat
    // sopra, per lo stesso motivo (indipendenza dal bordo grezzo della
    // selezione). Rimuove i marcatori da ciascuna riga singolarmente, DOPO
    // l'eventuale prefisso strutturale: una riga viene toccata solo se, in
    // quella posizione, ha davvero entrambi i marcatori (comportamento
    // "adiacente", coerente col caso a riga singola sopra) - così righe con
    // altre formattazioni annidate ma senza QUESTO specifico marcatore
    // restano intatte.
    const { lineStart, lineEnd } = this.expandToLines(range)
    const block = this.content.slice(lineStart, lineEnd)
    const strippedLines = block.split('\n').map((line) => {
      const prefixLen = this.structuralPrefixLength(line)
      const prefix = line.slice(0, prefixLen)
      const rest = line.slice(prefixLen)
      const hasBothMarkers =
        rest.length >= marker.open.length + marker.close.length &&
        rest.startsWith(marker.open) &&
        rest.endsWith(marker.close)
      if (!hasBothMarkers) return line
      return prefix + rest.slice(marker.open.length, rest.length - marker.close.length)
    })
    return this.content.slice(0, lineStart) + strippedLines.join('\n') + this.content.slice(lineEnd)
  }

  /**
   * Determina se il range indicato è già formattato con il tipo dato, riusando
   * esattamente la stessa logica di posizionamento di removeFormat: un range è
   * "formattato" se i marcatori risultano esattamente nelle posizioni in cui
   * removeFormat li rimuoverebbe (cioè subito prima e subito dopo il range).
   * Per una selezione multi-riga, si espande alle righe intere (come
   * applyFormat/removeFormat) ed è "formattato" solo se OGNI riga con
   * contenuto reale ha già entrambi i marcatori subito dopo l'eventuale
   * prefisso strutturale.
   * Serve a decidere, in toggleFormat, se applicare o rimuovere la formattazione
   * (R5-R28: ogni formattazione deve essere rimovibile con lo stesso comando
   * usato per applicarla, sia con del testo selezionato sia con selezione vuota).
   */
  public isFormatted(range: TextRange, type: FormatType): boolean {
    const linePrefix = LINE_PREFIXES[type]
    if (linePrefix !== undefined) {
      const { lineStart } = this.expandToLines(range)
      return this.content.slice(lineStart, lineStart + linePrefix.length) === linePrefix
    }

    const marker = INLINE_MARKERS[type]
    if (marker === undefined) {
      return false
    }

    const { start, end } = this.normalizeRange(range)
    const selected = this.content.slice(start, end)

    if (!selected.includes('\n')) {
      const openStart = start - marker.open.length
      const hasOpenMarker = openStart >= 0 && this.content.slice(openStart, start) === marker.open
      const hasCloseMarker = this.content.slice(end, end + marker.close.length) === marker.close
      return hasOpenMarker && hasCloseMarker
    }

    const { lineStart, lineEnd } = this.expandToLines(range)
    const block = this.content.slice(lineStart, lineEnd)
    const linesWithContent = block
      .split('\n')
      .map((line) => line.slice(this.structuralPrefixLength(line)))
      .filter((rest) => rest.length > 0)
    if (linesWithContent.length === 0) {
      return false
    }
    return linesWithContent.every(
      (rest) =>
        rest.length >= marker.open.length + marker.close.length &&
        rest.startsWith(marker.open) &&
        rest.endsWith(marker.close),
    )
  }

  /**
   * Applica o rimuove la formattazione a seconda dello stato corrente del range
   * (toggle): un secondo click sullo stesso pulsante di formattazione, sulla
   * stessa selezione (o sullo stesso punto del cursore, per una selezione vuota),
   * annulla la formattazione appena applicata invece di aggiungerne un'altra.
   */
  public toggleFormat(range: TextRange, type: FormatType): string {
    return this.isFormatted(range, type) ? this.removeFormat(range, type) : this.applyFormat(range, type)
  }

  /**
   * Lunghezza del marcatore/prefisso di apertura per il tipo indicato: usata dal
   * chiamante (App.vue) per calcolare di quanto spostare cursore/selezione dopo
   * un toggle, così che il cursore finisca esattamente tra i marcatori appena
   * inseriti (es. grassetto su selezione vuota: | -> **|**) invece di restare
   * prima di essi.
   */
  public getFormatMarkerOpenLength(type: FormatType): number {
    const linePrefix = LINE_PREFIXES[type]
    if (linePrefix !== undefined) {
      return linePrefix.length
    }

    const marker = INLINE_MARKERS[type]
    return marker !== undefined ? marker.open.length : 0
  }

  /**
   * Calcola di quanto devono spostarsi l'inizio e la fine della selezione
   * dopo un toggle di formattazione inline (grassetto/corsivo/sottolineato/
   * barrato), PRIMA di eseguire il comando (il chiamante, App.vue, applica
   * lo spostamento dopo che CodeMirror ha aggiornato il documento).
   *
   * Su una selezione a riga singola i due estremi si spostano della stessa
   * quantità (la selezione resta "tra" i marcatori aperti/chiusi).
   *
   * Su una selezione multi-riga la nuova selezione copre sempre l'intero
   * blocco di righe intere trasformato (stesso principio di applyFormat/
   * removeFormat: si espande alle righe intere, non alla selezione grezza).
   * Lo spostamento viene calcolato eseguendo DAVVERO la trasformazione
   * (toggleFormat, che non muta lo stato di questo editor - restituisce solo
   * una nuova stringa), invece di ricalcolarla separatamente: questo
   * garantisce che il calcolo non possa MAI divergere dal comportamento
   * reale di apply/remove, indipendentemente da quali altre formattazioni
   * siano già presenti sulla riga o in quale ordine siano state applicate.
   */
  public computeFormatToggleShift(range: TextRange, type: FormatType): { startDelta: number; endDelta: number } {
    const marker = INLINE_MARKERS[type]
    if (marker === undefined) {
      // Le formattazioni di riga (Quote/Heading) continuano a usare lo
      // spostamento uniforme esistente via getFormatMarkerOpenLength.
      return { startDelta: 0, endDelta: 0 }
    }

    const { start, end } = this.normalizeRange(range)
    const selected = this.content.slice(start, end)

    if (!selected.includes('\n')) {
      const applying = !this.isFormatted(range, type)
      const sign = applying ? 1 : -1
      return { startDelta: sign * marker.open.length, endDelta: sign * marker.open.length }
    }

    const { lineStart, lineEnd } = this.expandToLines(range)
    const newContent = this.toggleFormat(range, type)
    const tailLength = this.content.length - lineEnd
    const newLineEnd = newContent.length - tailLength

    return { startDelta: lineStart - start, endDelta: newLineEnd - end }
  }

  private applyLinePrefix(range: TextRange, prefix: string): string {
    const { lineStart, lineEnd } = this.expandToLines(range)
    const block = this.content.slice(lineStart, lineEnd)
    // Antepone il prefisso anche a una riga vuota: è il caso "cursore su riga
    // vuota -> citazione/intestazione -> pronto per la digitazione", analogo
    // al fix già applicato a toListItem per gli elenchi.
    const prefixed = block
      .split('\n')
      .map((line) => prefix + line)
      .join('\n')

    return this.content.slice(0, lineStart) + prefixed + this.content.slice(lineEnd)
  }

  private removeLinePrefix(range: TextRange, prefix: string): string {
    const { lineStart, lineEnd } = this.expandToLines(range)
    const block = this.content.slice(lineStart, lineEnd)
    const stripped = block
      .split('\n')
      .map((line) => (line.startsWith(prefix) ? line.slice(prefix.length) : line))
      .join('\n')

    return this.content.slice(0, lineStart) + stripped + this.content.slice(lineEnd)
  }

  // ------------------------------------------------------------------
  // Tabelle Markdown - R36-R42
  // ------------------------------------------------------------------

  public applyTableOperation(request: TableActionRequest, range: TextRange = new TextRange(0, 0)): string {
    switch (request.operation) {
      case TableOperationType.CREATE_TABLE:
        return this.createTable(request)
      case TableOperationType.DELETE_TABLE:
        return this.withTableAt(range.start, (table) => null)
      case TableOperationType.INSERT_ROW:
        return this.withTableAt(range.start, (table) => this.tableInsertRow(table))
      case TableOperationType.DELETE_ROW:
        return this.withTableAt(range.start, (table) => this.tableDeleteRow(table, request.rowIndex))
      case TableOperationType.INSERT_COLUMN:
        return this.withTableAt(range.start, (table) => this.tableInsertColumn(table))
      case TableOperationType.DELETE_COLUMN:
        return this.withTableAt(range.start, (table) => this.tableDeleteColumn(table, request.colIndex))
      case TableOperationType.EDIT_CELL:
        return this.withTableAt(range.start, (table) =>
          this.tableEditCell(table, request.rowIndex, request.colIndex, request.cellContent),
        )
      default:
        return this.content
    }
  }

  private createTable(request: TableActionRequest): string {
    const rowCount = request.rowCount
    const colCount = request.colCount

    if (rowCount === undefined || rowCount <= 0 || colCount === undefined || colCount <= 0) {
      throw new InvalidTableDimensionError('Dimensioni tabella non valide')
    }

    const header = this.buildTableRow(Array.from({ length: colCount }, (_, i) => `Colonna ${i + 1}`))
    const separator = this.buildTableRow(Array.from({ length: colCount }, () => '---'))
    const bodyRows = Array.from({ length: rowCount }, () =>
      this.buildTableRow(Array.from({ length: colCount }, () => '')),
    )

    const table = [header, separator, ...bodyRows].join('\n')
    const separatorBefore = this.content.length > 0 && !this.content.endsWith('\n\n') ? '\n\n' : ''

    return this.content + separatorBefore + table + '\n'
  }

  private buildTableRow(cells: string[]): string {
    return `| ${cells.join(' | ')} |`
  }

  /** Individua la tabella Markdown che contiene la posizione data e applica la trasformazione richiesta. */
  private withTableAt(position: number, transform: (rows: string[][]) => string[][] | null): string {
    const found = this.findTableBlockAt(position)
    if (found === null) {
      return this.content
    }

    const { start, end, rows } = found
    const transformed = transform(rows)

    if (transformed === null) {
      // DELETE_TABLE: rimuove il blocco (e una eventuale riga vuota residua)
      const before = this.content.slice(0, start).replace(/\n{2,}$/, '\n')
      const after = this.content.slice(end)
      return before + after
    }

    // `rows` non include mai la riga separatore (scartata in fase di parsing):
    // va ricostruita qui, subito dopo l'header, per riottenere una tabella Markdown valida.
    const [header, ...body] = transformed
    const separatorRow = header.map(() => '---')
    const serialized = [header, separatorRow, ...body].map((row) => this.buildTableRow(row)).join('\n')
    return this.content.slice(0, start) + serialized + this.content.slice(end)
  }

  /**
   * Individua TUTTI i blocchi di tabella Markdown presenti nel contenuto (righe
   * consecutive che sembrano righe di tabella, separate da righe non-tabella).
   */
  private findAllTableBlocks(): Array<{ start: number; end: number; rows: string[][] }> {
    const lines = this.content.split('\n')
    const lineBlocks: Array<{ startLine: number; endLine: number }> = []
    let candidateStart = -1

    for (let i = 0; i < lines.length; i++) {
      if (this.isTableRowLine(lines[i])) {
        if (candidateStart === -1) candidateStart = i
      } else if (candidateStart !== -1) {
        lineBlocks.push({ startLine: candidateStart, endLine: i - 1 })
        candidateStart = -1
      }
    }
    if (candidateStart !== -1) {
      lineBlocks.push({ startLine: candidateStart, endLine: lines.length - 1 })
    }

    return lineBlocks.map(({ startLine, endLine }) => {
      const tableLines = lines.slice(startLine, endLine + 1)
      const rows = tableLines
        .filter((_, idx) => idx !== 1) // scarta la riga separatore "---"
        .map((line) => this.parseTableRow(line))

      const start = lines.slice(0, startLine).join('\n').length + (startLine > 0 ? 1 : 0)
      const end = start + tableLines.join('\n').length

      return { start, end, rows }
    })
  }

  /**
   * Individua la tabella su cui operare in base alla posizione del cursore/selezione:
   * preferisce quella che CONTIENE la posizione data (così "Elimina tabella" con il
   * cursore dentro una tabella specifica elimina QUELLA, non l'ultima creata nel
   * documento); se il cursore non è dentro nessuna tabella, ricade sulla più vicina.
   */
  private findTableBlockAt(position: number): { start: number; end: number; rows: string[][] } | null {
    const blocks = this.findAllTableBlocks()
    if (blocks.length === 0) {
      return null
    }

    const containing = blocks.find((block) => position >= block.start && position <= block.end)
    if (containing) {
      return containing
    }

    let closest = blocks[0]
    let closestDistance = Infinity
    for (const block of blocks) {
      const distance = position < block.start ? block.start - position : position - block.end
      if (distance < closestDistance) {
        closestDistance = distance
        closest = block
      }
    }
    return closest
  }

  private isTableRowLine(line: string): boolean {
    return /^\s*\|.*\|\s*$/.test(line)
  }

  private parseTableRow(line: string): string[] {
    return line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim())
  }

  private tableInsertRow(rows: string[][]): string[][] {
    const colCount = rows[0]?.length ?? 1
    return [...rows, Array.from({ length: colCount }, () => '')]
  }

  private tableDeleteRow(rows: string[][], rowIndex?: number): string[][] {
    // rowIndex è relativo alle righe di dati (esclude l'header, indice 0 dell'array rows)
    const targetIndex = (rowIndex ?? rows.length - 2) + 1
    if (targetIndex <= 0 || targetIndex >= rows.length) return rows
    return rows.filter((_, idx) => idx !== targetIndex)
  }

  private tableInsertColumn(rows: string[][]): string[][] {
    return rows.map((row, idx) => [...row, idx === 0 ? `Colonna ${row.length + 1}` : ''])
  }

  private tableDeleteColumn(rows: string[][], colIndex?: number): string[][] {
    const targetIndex = colIndex ?? rows[0].length - 1
    if (rows[0].length <= 1) return rows
    return rows.map((row) => row.filter((_, idx) => idx !== targetIndex))
  }

  private tableEditCell(rows: string[][], rowIndex?: number, colIndex?: number, cellContent?: string): string[][] {
    if (rowIndex === undefined || colIndex === undefined) return rows
    const targetRow = rowIndex + 1 // +1 per saltare l'header
    if (targetRow < 0 || targetRow >= rows.length) return rows
    if (colIndex < 0 || colIndex >= rows[targetRow].length) return rows

    const updated = rows.map((row) => [...row])
    updated[targetRow][colIndex] = cellContent ?? ''
    return updated
  }

  // ------------------------------------------------------------------
  // Elenchi puntati e numerati - R32-R35
  // ------------------------------------------------------------------

  public applyListOperation(range: TextRange, request: ListActionRequest): string {
    switch (request.operation) {
      case ListOperationType.CREATE_LIST:
        // "Elenco puntato"/"Elenco numerato" sono pulsanti toggle "intelligenti":
        // creano l'elenco se assente, lo convertono se è dell'altro tipo, lo
        // rimuovono se è già del tipo richiesto (analogo alle formattazioni
        // di riga, R32-R35: ogni elenco deve essere rimovibile con lo stesso
        // comando usato per crearlo, sia su selezione sia su cursore vuoto).
        return this.toggleListFormat(range, request.listType)
      case ListOperationType.ADD_ITEM: {
        const { lineEnd } = this.expandToLines(range)
        const marker = request.listType === ListType.ORDERED ? '1. ' : UNORDERED_MARKER
        const insertion = (this.content[lineEnd - 1] === '\n' || lineEnd === 0 ? '' : '\n') + marker
        return this.content.slice(0, lineEnd) + insertion + this.content.slice(lineEnd)
      }
      case ListOperationType.INDENT_ITEM:
        return this.transformLines(range, (line) => '  ' + line)
      case ListOperationType.OUTDENT_ITEM:
        return this.transformLines(range, (line) => line.replace(/^ {1,2}/, ''))
      case ListOperationType.TOGGLE_LIST_TYPE:
        return this.transformLines(range, (line) => this.toggleListMarker(line))
      case ListOperationType.DEACTIVATE_LIST_MODE:
      case ListOperationType.REMOVE_LIST:
        return this.transformLines(range, (line) => line.replace(LIST_ITEM_REGEX, '$1'))
      default:
        return this.content
    }
  }

  /**
   * Comando "intelligente" condiviso dai pulsanti Elenco puntato/numerato:
   * - riga non ancora un elenco -> crea un elemento del tipo richiesto;
   * - riga già un elenco del tipo richiesto -> rimuove la formattazione (toggle off);
   * - riga già un elenco dell'ALTRO tipo -> converte al tipo richiesto.
   * Su un blocco multi-riga, la numerazione degli elementi ordinati viene
   * assegnata in sequenza (1, 2, 3, ...).
   * La decisione (crea/converti/rimuovi) è presa una sola volta in base alla
   * PRIMA riga del blocco e applicata in modo uniforme a tutte le righe.
   */
  private toggleListFormat(range: TextRange, listType?: ListType): string {
    const { lineStart, lineEnd } = this.expandToLines(range)
    const block = this.content.slice(lineStart, lineEnd)
    const lines = block.split('\n')

    const firstMatch = lines[0]?.match(LIST_ITEM_REGEX)
    const firstIsRequestedType =
      firstMatch !== null && firstMatch !== undefined
        ? ORDERED_MARKER_REGEX.test(firstMatch[2]) === (listType === ListType.ORDERED)
        : false

    let orderedCounter = 1

    const transformed = lines.map((line) => {
      const match = line.match(LIST_ITEM_REGEX)

      if (firstIsRequestedType) {
        // L'intero blocco è già del tipo richiesto: rimuove il marcatore
        // da ogni riga che ne ha uno (toggle off).
        return match ? line.slice(match[0].length) : line
      }

      // Crea (se assente) o converte (se di tipo diverso) al tipo richiesto.
      const indent = match ? match[1] : ''
      const rest = match ? line.slice(match[0].length) : line
      const marker = listType === ListType.ORDERED ? `${orderedCounter++}. ` : UNORDERED_MARKER
      return indent + marker + rest
    })

    return this.content.slice(0, lineStart) + transformed.join('\n') + this.content.slice(lineEnd)
  }

  /**
   * Calcola di quanto devono spostarsi l'inizio e la fine della selezione
   * dopo un'operazione CREATE_LIST (elenco puntato/numerato), PRIMA di
   * eseguire il comando. La nuova selezione copre sempre l'intero blocco di
   * righe intere trasformato (stesso principio di computeFormatToggleShift):
   * lo spostamento viene calcolato eseguendo DAVVERO la trasformazione
   * (toggleListFormat, che non muta lo stato di questo editor), non
   * ricalcolato separatamente - garantendo che non possa mai divergere dal
   * comportamento reale, anche quando marcatori numerati di lunghezza
   * diversa (es. "1. " vs "10. ") rendono lo spostamento non uniforme.
   */
  public computeListToggleShift(range: TextRange, listType?: ListType): { startDelta: number; endDelta: number } {
    const { start, end } = this.normalizeRange(range)
    const { lineStart, lineEnd } = this.expandToLines(range)
    const newContent = this.toggleListFormat(range, listType)
    const tailLength = this.content.length - lineEnd
    const newLineEnd = newContent.length - tailLength

    return { startDelta: lineStart - start, endDelta: newLineEnd - end }
  }

  private toggleListMarker(line: string): string {
    const match = line.match(LIST_ITEM_REGEX)
    if (!match) return line

    const [, indent, marker] = match
    const rest = line.slice(match[0].length)
    const isOrdered = ORDERED_MARKER_REGEX.test(marker)
    return indent + (isOrdered ? UNORDERED_MARKER : '1. ') + rest
  }

  // ------------------------------------------------------------------
  // Link ipertestuali - R29-R31
  // ------------------------------------------------------------------

  public applyLinkOperation(range: TextRange, request: LinkActionRequest): string {
    const { start, end } = this.normalizeRange(range)

    switch (request.operation) {
      case LinkOperationType.INSERT_LINK: {
        const label = request.label ?? this.content.slice(start, end) ?? request.url ?? ''
        const url = request.url ?? ''
        const markdown = `[${label}](${url})`
        return this.content.slice(0, start) + markdown + this.content.slice(end)
      }
      case LinkOperationType.EDIT_LINK: {
        const existing = this.findLinkAt(start, end)
        if (existing === null) return this.content
        const label = request.label ?? existing.label
        const url = request.url ?? existing.url
        const markdown = `[${label}](${url})`
        return this.content.slice(0, existing.start) + markdown + this.content.slice(existing.end)
      }
      case LinkOperationType.REMOVE_LINK: {
        const existing = this.findLinkAt(start, end)
        if (existing === null) return this.content
        return this.content.slice(0, existing.start) + existing.label + this.content.slice(existing.end)
      }
      default:
        return this.content
    }
  }

  public getLinkAt(range: TextRange): LinkActionRequest {
    const { start, end } = this.normalizeRange(range)
    const existing = this.findLinkAt(start, end)

    if (existing === null) {
      return new LinkActionRequest(LinkOperationType.INSERT_LINK)
    }

    return new LinkActionRequest(LinkOperationType.EDIT_LINK, existing.url, existing.label)
  }

  private findLinkAt(start: number, end: number): { start: number; end: number; label: string; url: string } | null {
    LINK_REGEX.lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = LINK_REGEX.exec(this.content)) !== null) {
      const matchStart = match.index
      const matchEnd = matchStart + match[0].length

      if (start >= matchStart && end <= matchEnd) {
        return { start: matchStart, end: matchEnd, label: match[1], url: match[2] }
      }
    }

    return null
  }

  // ------------------------------------------------------------------
  // Utilità condivise
  // ------------------------------------------------------------------

  private normalizeRange(range: TextRange): { start: number; end: number } {
    const start = Math.max(0, Math.min(range.start, this.content.length))
    const end = Math.max(start, Math.min(range.end, this.content.length))
    return { start, end }
  }

  /** Espande un range di caratteri fino ai confini della/e riga/e che copre. */
  private expandToLines(range: TextRange): { lineStart: number; lineEnd: number } {
    const { start, end } = this.normalizeRange(range)

    const lastNewlineBeforeStart = this.content.lastIndexOf('\n', Math.max(0, start - 1))
    const lineStart = lastNewlineBeforeStart === -1 ? 0 : lastNewlineBeforeStart + 1

    const nextNewlineAfterEnd = this.content.indexOf('\n', end)
    const lineEnd = nextNewlineAfterEnd === -1 ? this.content.length : nextNewlineAfterEnd

    return { lineStart, lineEnd }
  }

  private transformLines(range: TextRange, transform: (line: string) => string): string {
    const { lineStart, lineEnd } = this.expandToLines(range)
    const block = this.content.slice(lineStart, lineEnd)
    const transformed = block.split('\n').map(transform).join('\n')
    return this.content.slice(0, lineStart) + transformed + this.content.slice(lineEnd)
  }
}
