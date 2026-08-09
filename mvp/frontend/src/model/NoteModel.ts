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
            observer.update(); // Usato allo Step 15 e Step 32
        }
    }

    public executeCommand(c: EditCommand): void {
        // Step 10: push(command)
        this.history.push(c);
        // Step 11: execute
        c.execute();
        // Step 13: markDirtyAndNotify
        this.markDirtyAndNotify();
    }

    public undo(): void {
        // Step 27: undo
        this.history.undo();
        // Step 30: markDirtyAndNotify
        this.markDirtyAndNotify();
    }

    public redo(): void {
        this.history.redo();
        this.markDirtyAndNotify();
    }

    public getContent(): string {
        // Step 16: getContent
        return this.contentEditor.getContent();
    }

    public getIsDirty(): boolean {
        return this.isDirty;
    }

    public async save(): Promise<void> {
        const note = new Note(this.noteId || "default-id", this.getContent());
        await this.noteService.save(note);
        this.isDirty = false;
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
        // Step 14 / Step 31: notify
        this.notify();
    }
}