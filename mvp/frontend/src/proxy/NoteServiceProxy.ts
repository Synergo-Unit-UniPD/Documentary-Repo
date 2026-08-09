import { NoteService } from './NoteService';
import { Note } from '../model/Note';
import { NoteIOError } from '../model/NoteIOError';

/**
 * Proxy per la comunicazione con il backend per le operazioni di salvataggio e apertura Note.
 * Gestisce l'interazione con la BrowserFileSystem API.
 */
export class NoteServiceProxy implements NoteService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    public async save(note: Note): Promise<void> {
        try {
            if (!note.id || note.id === "") {
                if (!(window as any).showSaveFilePicker) {
                    throw new Error("File System API non supportata dal browser");
                }
                
                const handle = await (window as any).showSaveFilePicker({
                    types: [{
                        description: 'Markdown',
                        accept: { 'text/markdown': ['.md'] },
                    }],
                });
                
                const writable = await handle.createWritable();
                await writable.write(note.content);
                await writable.close();
            } else {
                console.log(`Scrittura del contenuto per la nota esistente: ${note.id}`);
            }
        } catch (error: any) {
            throw new NoteIOError(error.message || "Errore durante il salvataggio della nota");
        }
    }

    public async open(): Promise<Note> {
        try {
            if (!(window as any).showOpenFilePicker) {
                throw new Error("File System API non supportata dal browser");
            }
            
            // Step 10: showOpenFilePicker verso BrowserFileSystem API
            const [handle] = await (window as any).showOpenFilePicker({
                types: [{
                    description: 'Markdown',
                    accept: { 'text/markdown': ['.md'] },
                }],
                multiple: false
            });
            
            // Step 11: Ricezione FileHandle 
            const file = await handle.getFile();
            
            // Step 12: readContent
            const content = await file.text();
            
            // Step 13: content ricevuto
            // Step 14: ritorna la Note istanziata
            return new Note("", content);
        } catch (error: any) {
            throw new NoteIOError(error.message || "Errore durante l'apertura della nota");
        }
    }
}