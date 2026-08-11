/**
 * Eccezione sollevata se rowCount o colCount non sono validi per un'operazione CREATE_TABLE.
 */
export class InvalidTableDimensionError extends Error {
    public message: string;

    constructor(message: string) {
        super(message);
        this.name = 'InvalidTableDimensionError';
        this.message = message;
    }
}