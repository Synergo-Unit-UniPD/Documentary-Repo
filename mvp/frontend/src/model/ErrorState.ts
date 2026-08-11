/**
 * Rappresenta lo stato in cui si è verificato un errore (es. fallimento API o LLM).
 */
export class ErrorState {
    public message: string;

    constructor(message: string) {
        this.message = message;
    }
}