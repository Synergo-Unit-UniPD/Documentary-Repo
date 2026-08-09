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
            // alt noteID
            if (!note.id || note.id === "") {
                // Ramo [noteID null]
                if (!(window as any).showSaveFilePicker) {
                    throw new Error("File System API non supportata dal browser");
                }
                
                // Step 11: showSaveFilePicker verso BrowserFileSystem API
                const handle = await (window as any).showSaveFilePicker({
                    types: [{
                        description: 'Markdown',
                        accept: { 'text/markdown': ['.md'] },
                    }],
                });
                
                // Step 12: Ricezione FileHandle e apertura stream (createWritable)
                const writable = await handle.createWritable();
                
                // Step 13: write(content)
                await writable.write(note.content);
                await writable.close();
                
                // Step 14: void (Ritorno implicito)
            } else {
                // Ramo [noteID presente]
                // Step 16: save(NoteEsistente)
                // Step 17: write(content)
                console.log(`Scrittura del contenuto per la nota esistente: ${note.id}`);
                
                // Step 18: void (Ritorno implicito)
            }
        } catch (error: any) {
            // Viene lanciata un'eccezione di dominio catturabile dai livelli superiori
            throw new NoteIOError(error.message || "Errore durante il salvataggio della nota");
        }
    }

    public async open(): Promise<Note> {
        return Promise.resolve(new Note("default-id", "Contenuto recuperato"));
    }
}