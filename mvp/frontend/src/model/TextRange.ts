/**
 * Rappresenta un intervallo di testo selezionato all'interno dell'editor.
 */
export class TextRange {
    public start: number;
    public end: number;

    constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
    }
}