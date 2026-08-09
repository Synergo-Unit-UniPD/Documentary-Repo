import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NoteServiceProxy } from './NoteServiceProxy';
import { Note } from '../model/Note';
import { NoteIOError } from '../model/NoteIOError';

describe('NoteServiceProxy - Salvataggio nota locale', () => {
    beforeEach(() => {
        // Mock globale della File System API del browser (cast ad any per TS)
        (globalThis as any).window = {
            showSaveFilePicker: vi.fn()
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
        delete (globalThis as any).window;
    });

    it('dovrebbe eseguire il salvataggio per una nuova nota (noteID null/vuoto) aprendo il file picker', async () => {
        const mockWritable = {
            write: vi.fn().mockResolvedValue(undefined),
            close: vi.fn().mockResolvedValue(undefined)
        };
        const mockFileHandle = {
            createWritable: vi.fn().mockResolvedValue(mockWritable)
        };
        
        (globalThis.window as any).showSaveFilePicker.mockResolvedValue(mockFileHandle);

        const proxy = new NoteServiceProxy('http://localhost:8000');
        const noteVuota = new Note('', 'Contenuto di test');
        
        await proxy.save(noteVuota);
        
        // Verifica chiamate al BrowserFileSystem API (Step 11, 12, 13)
        expect((globalThis.window as any).showSaveFilePicker).toHaveBeenCalledTimes(1);
        expect(mockFileHandle.createWritable).toHaveBeenCalledTimes(1);
        expect(mockWritable.write).toHaveBeenCalledWith('Contenuto di test');
        expect(mockWritable.close).toHaveBeenCalledTimes(1);
    });

    it('dovrebbe eseguire il salvataggio per una nota esistente senza aprire il file picker', async () => {
        const proxy = new NoteServiceProxy('http://localhost:8000');
        const noteEsistente = new Note('nota-123', 'Contenuto aggiornato');
        
        await proxy.save(noteEsistente);
        
        // Verifica Ramo [noteID presente]: Non deve chiedere all'utente dove salvare
        expect((globalThis.window as any).showSaveFilePicker).not.toHaveBeenCalled();
    });
    
    it('dovrebbe lanciare NoteIOError in caso di errore della File System API', async () => {
        (globalThis.window as any).showSaveFilePicker.mockRejectedValue(new Error('User cancelled'));
        
        const proxy = new NoteServiceProxy('http://localhost:8000');
        const noteVuota = new Note('', 'Contenuto');
        
        await expect(proxy.save(noteVuota)).rejects.toThrowError(NoteIOError);
    });
});