import { Subject } from './Subject';
import { Observer } from './Observer';
import { CommandHistory } from './CommandHistory';
import { EditCommand } from './EditCommand';
import { MarkdownContentEditor } from './MarkdownContentEditor';
import { NoteService } from '../proxy/NoteService';
import { Note } from './Note';

/**
 * Modello centrale del dominio che gestisce il contenuto della nota, 
 * la cronologia dei comandi e notifica le viste in modalità pull.
 */
export class NoteModel implements Subject {
    private contentEditor: MarkdownContentEditor;
    private history: CommandHistory;
    private observers: Observer[] = [];
    private noteService: NoteService;
    private noteId: string | undefined;
    private isDirty: boolean = false;

    constructor(contentEditor: MarkdownContentEditor, history: CommandHistory, noteService: NoteService) {
        this.contentEditor = contentEditor;
        this.history = history;
        this.noteService = noteService;
    }

    public attach(o: Observer): void {
        if (!this.observers.includes(o)) {
            this.observers.push(o);
        }
    }

    public detach(o: Observer): void {
        this.observers = this.observers.filter(obs => obs !== o);
    }

    public notify(): void {
        for (const observer of this.observers) {
            observer.update();
        }
    }

    public executeCommand(c: EditCommand): void {
        this.history.push(c);
        c.execute();
        this.markDirtyAndNotify();
    }

    public undo(): void {
        this.history.undo();
        this.markDirtyAndNotify();
    }

    public redo(): void {
        this.history.redo();
        this.markDirtyAndNotify();
    }

    public getContent(): string {
        return this.contentEditor.getContent();
    }

    public getIsDirty(): boolean {
        return this.isDirty;
    }

    public async save(): Promise<void> {
        // Step 9: controlla noteId. Usa una stringa vuota se undefined (NoteVuota)
        const currentId = this.noteId ? this.noteId : "";
        const note = new Note(currentId, this.getContent());
        
        // Step 10 / Step 16: save(NoteVuota / NoteEsistente)
        await this.noteService.save(note);
        
        // Step 19: isDirtyFalse
        this.isDirty = false;
        
        // Step 20: notify -> porterà all'update (Step 21) su EditorView
        this.notify();
    }

    public async openNote(): Promise<void> {
        const note = await this.noteService.open();
        this.noteId = note.id;
        this.contentEditor.setContent(note.content);
        this.history.clear();
        this.isDirty = false;
        this.notify();
    }

    public markDirtyAndNotify(): void {
        this.isDirty = true;
        this.notify();
    }
}