import { EditCommand } from './EditCommand';
import { NoteModel } from './NoteModel';
import { MarkdownContentEditor } from './MarkdownContentEditor';
import { TextRange } from './TextRange';
import { FormatType } from './FormatType';

export class FormatTextCommand implements EditCommand {
    private model: NoteModel;
    private range: TextRange;
    private formatType: FormatType;
    private editor: MarkdownContentEditor;
    private previousContent: string;

    constructor(model: NoteModel, range: TextRange, formatType: FormatType, editor: MarkdownContentEditor) {
        this.model = model;
        this.range = range;
        this.formatType = formatType;
        this.editor = editor;
        this.previousContent = '';
    }

    public execute(): void {
        this.previousContent = this.editor.getContent();
        
        const newContent = this.editor.removeFormat(this.range, this.formatType);
        this.editor.setContent(newContent);
    }

    public undo(): void {
        this.editor.setContent(this.previousContent);
    }
}