import { describe, it, expect } from 'vitest';
import { FormatTextCommand } from './FormatTextCommand';
import { NoteModel } from './NoteModel';
import { MarkdownContentEditor } from './MarkdownContentEditor';
import { TextRange } from './TextRange';
import { FormatType } from './FormatType';

describe('FormatTextCommand', () => {
    it('dovrebbe salvare il contenuto ed eseguire l\'operazione di formattazione', () => {
        const editor = new MarkdownContentEditor('Testo');
        const model = {} as NoteModel;
        const range = new TextRange(0, 5);
        
        const command = new FormatTextCommand(model, range, FormatType.BOLD, editor);
        
        command.execute();
        command.undo();
        
        expect(editor.getContent()).toBe('Testo');
    });
});