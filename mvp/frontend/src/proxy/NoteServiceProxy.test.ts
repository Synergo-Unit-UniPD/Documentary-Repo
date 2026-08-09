import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NoteServiceProxy } from './NoteServiceProxy';
import { Note } from '../model/Note';
import { NoteIOError } from '../model/NoteIOError';

describe('NoteServiceProxy - Salvataggio e Apertura nota locale', () => {
    beforeEach(() => {
        // Mock globale della File System API del browser (cast ad any per TS)
        (globalThis as any).window = {
            showSaveFilePicker: vi.fn(),
            showOpenFilePicker: vi.fn()
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
        
        expect((globalThis.window as any).showSaveFilePicker).toHaveBeenCalledTimes(1);
        expect(mockFileHandle.createWritable).toHaveBeenCalledTimes(1);
        expect(mockWritable.write).toHaveBeenCalledWith('Contenuto di test');
        expect(mockWritable.close).toHaveBeenCalledTimes(1);
    });

    it('dovrebbe eseguire il salvataggio per una nota esistente senza aprire il file picker', async () => {
        const proxy = new NoteServiceProxy('http://localhost:8000');
        const noteEsistente = new Note('nota-123', 'Contenuto aggiornato');
        
        await proxy.save(noteEsistente);
        
        expect((globalThis.window as any).showSaveFilePicker).not.toHaveBeenCalled();
    });
    
    it('dovrebbe lanciare NoteIOError in caso di errore della File System API al salvataggio', async () => {
        (globalThis.window as any).showSaveFilePicker.mockRejectedValue(new Error('User cancelled'));
        
        const proxy = new NoteServiceProxy('http://localhost:8000');
        const noteVuota = new Note('', 'Contenuto');
        
        await expect(proxy.save(noteVuota)).rejects.toThrowError(NoteIOError);
    });

    it('dovrebbe eseguire l\'apertura di una nota locale tramite file picker (Step 10-14)', async () => {
        const mockFile = {
            text: vi.fn().mockResolvedValue('Contenuto importato')
        };
        const mockFileHandle = {
            getFile: vi.fn().mockResolvedValue(mockFile)
        };
        
        // L'API showOpenFilePicker restituisce sempre un array di handle
        (globalThis.window as any).showOpenFilePicker.mockResolvedValue([mockFileHandle]);

        const proxy = new NoteServiceProxy('http://localhost:8000');
        
        const note = await proxy.open();
        
        expect((globalThis.window as any).showOpenFilePicker).toHaveBeenCalledTimes(1);
        expect(mockFileHandle.getFile).toHaveBeenCalledTimes(1);
        expect(mockFile.text).toHaveBeenCalledTimes(1);
        expect(note.content).toBe('Contenuto importato');
        expect(note.id).toBe(''); // ID vuoto per file importati localmente
    });

    it('dovrebbe lanciare NoteIOError in caso di errore della File System API all\'apertura', async () => {
        (globalThis.window as any).showOpenFilePicker.mockRejectedValue(new Error('User cancelled'));
        
        const proxy = new NoteServiceProxy('http://localhost:8000');
        
        await expect(proxy.open()).rejects.toThrowError(NoteIOError);
    });
});