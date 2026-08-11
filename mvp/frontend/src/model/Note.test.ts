import { describe, it, expect } from 'vitest';
import { Note } from './Note';

describe('Note', () => {
    it('dovrebbe inizializzare correttamente id e content', () => {
        const note = new Note('nota-123', 'Contenuto di prova Markdown');
        
        expect(note.id).toBe('nota-123');
        expect(note.content).toBe('Contenuto di prova Markdown');
    });
});