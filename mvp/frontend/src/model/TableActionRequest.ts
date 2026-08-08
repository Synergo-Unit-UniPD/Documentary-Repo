import { TableOperationType } from './TableOperationType';

export class TableActionRequest {
    public operation: TableOperationType;
    public rowCount?: number;
    public colCount?: number;
    public rowIndex?: number;
    public colIndex?: number;
    public cellContent?: string;

    constructor(
        operation: TableOperationType,
        rowCount?: number,
        colCount?: number,
        rowIndex?: number,
        colIndex?: number,
        cellContent?: string
    ) {
        this.operation = operation;
        this.rowCount = rowCount;
        this.colCount = colCount;
        this.rowIndex = rowIndex;
        this.colIndex = colIndex;
        this.cellContent = cellContent;
    }
}