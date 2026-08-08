import { describe, it, expect } from 'vitest';
import { NoteServiceProxy } from './NoteServiceProxy';
import { Note } from '../model/Note';
import { NoteIOError } from '../model/NoteIOError';

describe('NoteServiceProxy', () => {
    it('dovrebbe istanziarsi correttamente e avere i metodi save e open', async () => {
        const proxy = new NoteServiceProxy('http://localhost:8000');
        expect(typeof proxy.save).toBe('function');
        expect(typeof proxy.open).toBe('function');
        
        const note = await proxy.open();
        expect(note.id).toBe('default-id');
    });

    it('dovrebbe sollevare NoteIOError in caso di simulazione errore di salvataggio', async () => {
        const proxy = new NoteServiceProxy('http://localhost:8000');
        const invalidNote = new Note('', 'Testo'); // Nota senza ID
        
        await expect(proxy.save(invalidNote)).rejects.toThrowError(NoteIOError);
    });
});