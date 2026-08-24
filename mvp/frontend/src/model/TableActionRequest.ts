import { TableOperationType } from './TableOperationType'

/**
 * Value Object che descrive una richiesta di operazione su una tabella:
 * quale operazione eseguire (TableOperationType) e i parametri necessari
 * (dimensioni per la creazione, indici per riga/colonna, contenuto cella).
 * I campi non pertinenti all'operazione richiesta restano undefined.
 */
export class TableActionRequest {
  public operation: TableOperationType
  public rowCount?: number
  public colCount?: number
  public rowIndex?: number
  public colIndex?: number
  public cellContent?: string

  constructor(
    operation: TableOperationType,
    rowCount?: number,
    colCount?: number,
    rowIndex?: number,
    colIndex?: number,
    cellContent?: string,
  ) {
    this.operation = operation
    this.rowCount = rowCount
    this.colCount = colCount
    this.rowIndex = rowIndex
    this.colIndex = colIndex
    this.cellContent = cellContent
  }
}
