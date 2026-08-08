/**
 * Eccezione sollevata in caso di fallimento durante il salvataggio o l'apertura di una nota.
 */
export class NoteIOError extends Error {
    public message: string;

    constructor(message: string) {
        super(message);
        this.name = 'NoteIOError';
        this.message = message;
    }
}