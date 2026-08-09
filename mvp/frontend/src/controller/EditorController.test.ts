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

describe('EditorController - Formattazione con Undo e Redo', () => {
    it('dovrebbe eseguire il flusso di formattazione, undo e redo secondo i diagrammi di sequenza', () => {
        const markdownEditor = new MarkdownContentEditor();
        // Mock dei metodi chiamati dal comando come da SD (Step 12 e 29 per Formattazione/Undo, Step 11 per Redo)
        const applyFormatSpy = vi.spyOn(markdownEditor, 'applyFormat').mockReturnValue('**testo**');
        const removeFormatSpy = vi.spyOn(markdownEditor, 'removeFormat').mockReturnValue('testo');

        const history = new CommandHistory();
        const pushSpy = vi.spyOn(history, 'push');
        const historyUndoSpy = vi.spyOn(history, 'undo');
        const historyRedoSpy = vi.spyOn(history, 'redo'); // Aggiunto spia per redo

        const model = new NoteModel(markdownEditor, history, mockNoteService);
        const executeCommandSpy = vi.spyOn(model, 'executeCommand');
        const modelUndoSpy = vi.spyOn(model, 'undo');
        const modelRedoSpy = vi.spyOn(model, 'redo'); // Aggiunta spia per redo
        const markDirtySpy = vi.spyOn(model, 'markDirtyAndNotify');

        const view = new EditorView(model, {} as any);
        const updateSpy = vi.spyOn(view, 'update');

        const controller = new EditorController(model, view);

        // --- FLUSSO: Formattazione ---
        // SIMULAZIONE: seleziona testo, click "Grassetto" -> notify
        view.simulateFormatAction(FormatType.BOLD);

        // VERIFICA Flusso Formattazione
        expect(executeCommandSpy).toHaveBeenCalledTimes(1);
        expect(executeCommandSpy).toHaveBeenCalledWith(expect.any(FormatTextCommand));
        expect(pushSpy).toHaveBeenCalledTimes(1); 
        expect(applyFormatSpy).toHaveBeenCalledTimes(1); 
        expect(markDirtySpy).toHaveBeenCalledTimes(1); 
        expect(updateSpy).toHaveBeenCalled(); 

        // --- FLUSSO: Undo ---
        // SIMULAZIONE: click "Undo" -> notify
        view.simulateAction('undo');

        // VERIFICA Flusso Undo
        expect(modelUndoSpy).toHaveBeenCalledTimes(1); 
        expect(historyUndoSpy).toHaveBeenCalledTimes(1); 
        expect(removeFormatSpy).toHaveBeenCalledTimes(1); 
        expect(markDirtySpy).toHaveBeenCalledTimes(2); 
        expect(updateSpy).toHaveBeenCalledTimes(2); 

        // --- FLUSSO: Redo ---
        // SIMULAZIONE: Step 1-3: click "Redo" -> notify
        view.simulateAction('redo');

        // VERIFICA Flusso Redo
        expect(modelRedoSpy).toHaveBeenCalledTimes(1); // Step 8: onRedoCommand chiama redo su NoteModel
        expect(historyRedoSpy).toHaveBeenCalledTimes(1); // Step 9: NoteModel chiama redo su CommandHistory
        expect(applyFormatSpy).toHaveBeenCalledTimes(2); // Step 11: Il comando recuperato (FormatTextCommand) riesegue applyFormat
        expect(markDirtySpy).toHaveBeenCalledTimes(3); // Step 12: NoteModel chiama markDirtyAndNotify
        expect(updateSpy).toHaveBeenCalledTimes(3); // Step 14: Viene notificata la View
    });
});