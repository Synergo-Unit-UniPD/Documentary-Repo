import { Note } from '../model/Note';

/**
 * Interfaccia per il servizio Proxy di salvataggio e apertura delle note.
 */
export interface NoteService {
    save(note: Note): Promise<void>;
    open(): Promise<Note>;
}