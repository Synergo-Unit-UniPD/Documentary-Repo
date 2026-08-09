import { Observer } from '../model/Observer';
import { NoteModel } from '../model/NoteModel';
import { EditorView } from '../view/EditorView';
import { FormatType } from '../model/FormatType';
import { TableActionRequest } from '../model/TableActionRequest';
import { ListActionRequest } from '../model/ListActionRequest';
import { LinkActionRequest } from '../model/LinkActionRequest';
import { FormatTextCommand } from '../model/FormatTextCommand';
import { TableCommand } from '../model/TableCommand';
import { ListCommand } from '../model/ListCommand';
import { LinkCommand } from '../model/LinkCommand';
import { TextRange } from '../model/TextRange';
import { MarkdownContentEditor } from '../model/MarkdownContentEditor';

/**
 * Controller principale dell'editor. Gestisce gli input provenienti dall'EditorView,
 * costruisce i Command e li passa al NoteModel per l'esecuzione.
 */
export class EditorController implements Observer {
    private model: NoteModel;
    private view: EditorView;

    constructor(model: NoteModel, view: EditorView) {
        this.model = model;
        this.view = view;
        
        this.view.attach(this);
    }

    public update(): void {
        if (this.view.consumeSaveRequest()) this.onSaveCommand();
        if (this.view.consumeOpenRequest()) this.onOpenCommand();
        if (this.view.consumeUndoRequest()) this.onUndoCommand();
        if (this.view.consumeRedoRequest()) this.onRedoCommand();

        const formatReq = this.view.getLastFormatRequest();
        if (formatReq) this.onFormatCommand(formatReq);

        const tableReq = this.view.getLastTableRequest();
        if (tableReq) this.onTableCommand(tableReq);

        const listReq = this.view.getLastListRequest();
        if (listReq) this.onListCommand(listReq);

        const linkReq = this.view.getLastLinkRequest();
        if (linkReq) this.onLinkCommand(linkReq);

        const inputEvent = this.view.getLastInputEvent();
        if (inputEvent) this.onUserInput(inputEvent);
    }

    private onUserInput(event: InputEvent): void {
        // Da agganciare logicamente all'InsertTextCommand
    }

    private getEditorReceiver(): MarkdownContentEditor {
        return (this.model as any).contentEditor as MarkdownContentEditor;
    }

    private onFormatCommand(type: FormatType): void {
        const range = new TextRange(0, 0); 
        const command = new FormatTextCommand(this.model, range, type, this.getEditorReceiver());
        this.model.executeCommand(command);
    }

    public onTableCommand(request: TableActionRequest): void {
        const command = new TableCommand(this.model, request, this.getEditorReceiver());
        this.model.executeCommand(command);
    }

    public onListCommand(request: ListActionRequest): void {
        const range = new TextRange(0, 0);
        const command = new ListCommand(this.model, range, request, this.getEditorReceiver());
        this.model.executeCommand(command);
    }

    public onLinkCommand(request: LinkActionRequest): void {
        const range = new TextRange(0, 0);
        const command = new LinkCommand(this.model, range, request, this.getEditorReceiver());
        this.model.executeCommand(command);
    }

    private onUndoCommand(): void {
        this.model.undo();
    }

    private onRedoCommand(): void {
        this.model.redo();
    }

    private onSaveCommand(): void {
        this.model.save();
    }

    private onOpenCommand(): void {
        this.model.openNote();
    }
}