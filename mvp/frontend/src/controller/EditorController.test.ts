import { describe, it, expect, vi } from 'vitest';
import { EditorController } from './EditorController';
import { EditorView } from '../view/EditorView';
import { NoteModel } from '../model/NoteModel';
import { MarkdownContentEditor } from '../model/MarkdownContentEditor';
import { CommandHistory } from '../model/CommandHistory';
import { NoteService } from '../proxy/NoteService';
import { FormatType } from '../model/FormatType';
import { Note } from '../model/Note';
import { FormatTextCommand } from '../model/FormatTextCommand';

const mockNoteService: NoteService = {
    save: vi.fn().mockResolvedValue(undefined),
    open: vi.fn().mockResolvedValue(new Note('1', ''))
};

describe('EditorController - Formattazione con Undo', () => {
    it('dovrebbe eseguire il flusso di formattazione e undo secondo il diagramma di sequenza', () => {
        const markdownEditor = new MarkdownContentEditor();
        // Mock dei metodi chiamati dal comando come da SD (Step 12 e 29)
        const applyFormatSpy = vi.spyOn(markdownEditor, 'applyFormat').mockReturnValue('**testo**');
        const removeFormatSpy = vi.spyOn(markdownEditor, 'removeFormat').mockReturnValue('testo');

        const history = new CommandHistory();
        const pushSpy = vi.spyOn(history, 'push');
        const historyUndoSpy = vi.spyOn(history, 'undo');

        const model = new NoteModel(markdownEditor, history, mockNoteService);
        const executeCommandSpy = vi.spyOn(model, 'executeCommand');
        const modelUndoSpy = vi.spyOn(model, 'undo');
        const markDirtySpy = vi.spyOn(model, 'markDirtyAndNotify');

        const view = new EditorView(model, {} as any);
        const updateSpy = vi.spyOn(view, 'update');

        const controller = new EditorController(model, view);

        // SIMULAZIONE: Step 1-3: seleziona testo, click "Grassetto" -> notify
        view.simulateFormatAction(FormatType.BOLD);

        // VERIFICA Flusso Formattazione
        expect(executeCommandSpy).toHaveBeenCalledTimes(1);
        expect(executeCommandSpy).toHaveBeenCalledWith(expect.any(FormatTextCommand));
        expect(pushSpy).toHaveBeenCalledTimes(1); // Step 10
        expect(applyFormatSpy).toHaveBeenCalledTimes(1); // Step 12
        expect(markDirtySpy).toHaveBeenCalledTimes(1); // Step 13
        expect(updateSpy).toHaveBeenCalled(); // Step 15

        // SIMULAZIONE: Step 19-21: click "Undo" -> notify
        view.simulateAction('undo');

        // VERIFICA Flusso Undo
        expect(modelUndoSpy).toHaveBeenCalledTimes(1); // Step 26
        expect(historyUndoSpy).toHaveBeenCalledTimes(1); // Step 27
        expect(removeFormatSpy).toHaveBeenCalledTimes(1); // Step 29
        expect(markDirtySpy).toHaveBeenCalledTimes(2); // Step 30
        expect(updateSpy).toHaveBeenCalledTimes(2); // Step 32
    });
});