import { NoteService } from './NoteService';
import { Note } from '../model/Note';
import { NoteIOError } from '../model/NoteIOError';

/**
 * Proxy per la comunicazione con il backend per le operazioni di salvataggio e apertura Note.
 */
export class NoteServiceProxy implements NoteService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    public async save(note: Note): Promise<void> {
        // Implementazione dummy per TDD/PoC. 
        // Verrà integrata la logica di fetch() reale collegata al backend.
        if (!note.id) {
            throw new NoteIOError("Impossibile salvare: ID nota mancante");
        }
        return Promise.resolve();
    }

    public async open(): Promise<Note> {
        // Implementazione dummy per TDD/PoC.
        return Promise.resolve(new Note("default-id", "Contenuto recuperato"));
    }
}