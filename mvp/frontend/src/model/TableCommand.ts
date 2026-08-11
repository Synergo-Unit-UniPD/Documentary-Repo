import { EditCommand } from './EditCommand';
import { NoteModel } from './NoteModel';
import { MarkdownContentEditor } from './MarkdownContentEditor';
import { TableActionRequest } from './TableActionRequest';

export class TableCommand implements EditCommand {
    private model: NoteModel;
    private request: TableActionRequest;
    private previousContent: string;
    private editor: MarkdownContentEditor;

    constructor(model: NoteModel, request: TableActionRequest, editor: MarkdownContentEditor) {
        this.model = model;
        this.request = request;
        this.editor = editor;
        this.previousContent = '';
    }

    public execute(): void {
        this.previousContent = this.editor.getContent();
        const newContent = this.editor.applyTableOperation(this.request);
        this.editor.setContent(newContent);
    }

    public undo(): void {
        this.editor.setContent(this.previousContent);
    }
}