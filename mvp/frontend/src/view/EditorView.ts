import { Observer } from '../model/Observer';
import { Subject } from '../model/Subject';
import { NoteModel } from '../model/NoteModel';
import { ViewMode } from '../model/ViewMode';
import { FormatType } from '../model/FormatType';
import { TableActionRequest } from '../model/TableActionRequest';
import { ListActionRequest } from '../model/ListActionRequest';
import { LinkActionRequest } from '../model/LinkActionRequest';
import { TextRange } from '../model/TextRange';


export interface CodeMirrorInstance {}

/**
 * Gestisce l'interfaccia dell'editor e l'interazione con l'istanza CodeMirror.
 * Opera come Subject per notificare i cambiamenti all'EditorController in modalità pull.
 */
export class EditorView implements Observer, Subject {
    private editor: CodeMirrorInstance; 
    private model: NoteModel;
    private observers: Observer[] = [];
    private viewMode: ViewMode;
    
    private lastInputEvent?: InputEvent;
    private lastFormatRequest?: FormatType;
    private lastTableRequest?: TableActionRequest;
    private lastListRequest?: ListActionRequest;
    private lastLinkRequest?: LinkActionRequest;
    
    private saveRequested: boolean = false;
    private openRequested: boolean = false;
    private undoRequested: boolean = false;
    private redoRequested: boolean = false;

    constructor(model: NoteModel, editorInstance: CodeMirrorInstance) {
        this.model = model;
        this.editor = editorInstance;
        this.viewMode = ViewMode.SPLIT;
        this.model.attach(this);
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

    public update(): void {
        this.render();
    }

    public render(): void {
        // La logica di rendering verrà gestita reattivamente da Vue/CodeMirror
    }

    public toTextRange(cmPos: object): TextRange {
        return new TextRange(0, 0);
    }

    public toCodeMirrorPos(range: TextRange): object {
        return {};
    }

    public setViewMode(mode: ViewMode): void {
        this.viewMode = mode;
        this.render();
    }

    public getLastInputEvent(): InputEvent | undefined { return this.lastInputEvent; }
    public getLastFormatRequest(): FormatType | undefined { return this.lastFormatRequest; }
    public getLastTableRequest(): TableActionRequest | undefined { return this.lastTableRequest; }
    public getLastListRequest(): ListActionRequest | undefined { return this.lastListRequest; }
    public getLastLinkRequest(): LinkActionRequest | undefined { return this.lastLinkRequest; }

    public consumeSaveRequest(): boolean {
        const req = this.saveRequested;
        this.saveRequested = false;
        return req;
    }

    public consumeOpenRequest(): boolean {
        const req = this.openRequested;
        this.openRequested = false;
        return req;
    }

    public consumeUndoRequest(): boolean {
        const req = this.undoRequested;
        this.undoRequested = false;
        return req;
    }

    public consumeRedoRequest(): boolean {
        const req = this.redoRequested;
        this.redoRequested = false;
        return req;
    }

    public displayError(message: string): void {
        console.error(`Editor Error: ${message}`);
    }

    public simulateFormatAction(type: FormatType): void {
        this.lastFormatRequest = type;
        this.notify();
        this.lastFormatRequest = undefined;
    }

    public simulateAction(action: 'save' | 'open' | 'undo' | 'redo'): void {
        if (action === 'save') this.saveRequested = true;
        if (action === 'open') this.openRequested = true;
        if (action === 'undo') this.undoRequested = true;
        if (action === 'redo') this.redoRequested = true;
        this.notify();
    }
}