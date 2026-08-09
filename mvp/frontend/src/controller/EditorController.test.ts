import { describe, it, expect, vi } from 'vitest';
import { EditorController } from './EditorController';
import { EditorView } from '../view/EditorView';
import { NoteModel } from '../model/NoteModel';
import { MarkdownContentEditor } from '../model/MarkdownContentEditor';
import { CommandHistory } from '../model/CommandHistory';
import { NoteService } from '../proxy/NoteService';
import { FormatType } from '../model/FormatType';
import { Note } from '../model/Note';

const mockNoteService: NoteService = {
    save: vi.fn().mockResolvedValue(undefined),
    open: vi.fn().mockResolvedValue(new Note('1', ''))
};

describe('EditorController', () => {
    it('dovrebbe istanziare i comandi e passarli al model in risposta agli eventi della View', () => {
        const markdownEditor = new MarkdownContentEditor();
        const model = new NoteModel(markdownEditor, new CommandHistory(), mockNoteService);
        const view = new EditorView(model, {} as any);
        
        const executeSpy = vi.spyOn(model, 'executeCommand');
        const saveSpy = vi.spyOn(model, 'save');

        const controller = new EditorController(model, view);

        // Simuliamo la formattazione
        view.simulateFormatAction(FormatType.BOLD);
        expect(executeSpy).toHaveBeenCalledTimes(1);
        
        // Simuliamo il salvataggio
        view.simulateAction('save');
        expect(saveSpy).toHaveBeenCalledTimes(1);
    });
});