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
import { TableCommand } from '../model/TableCommand';

const mockNoteService: NoteService = {
    save: vi.fn().mockResolvedValue(undefined),
    open: vi.fn().mockResolvedValue(new Note('1', ''))
};

describe('EditorController - Formattazione con Undo e Redo', () => {
    it('dovrebbe eseguire il flusso di formattazione, undo e redo secondo i diagrammi di sequenza', () => {
        const markdownEditor = new MarkdownContentEditor();
        const applyFormatSpy = vi.spyOn(markdownEditor, 'applyFormat').mockReturnValue('**testo**');
        const removeFormatSpy = vi.spyOn(markdownEditor, 'removeFormat').mockReturnValue('testo');

        const history = new CommandHistory();
        const pushSpy = vi.spyOn(history, 'push');
        const historyUndoSpy = vi.spyOn(history, 'undo');
        const historyRedoSpy = vi.spyOn(history, 'redo');

        const model = new NoteModel(markdownEditor, history, mockNoteService);
        const executeCommandSpy = vi.spyOn(model, 'executeCommand');
        const modelUndoSpy = vi.spyOn(model, 'undo');
        const modelRedoSpy = vi.spyOn(model, 'redo');
        const markDirtySpy = vi.spyOn(model, 'markDirtyAndNotify');

        const view = new EditorView(model, {} as any);
        const updateSpy = vi.spyOn(view, 'update');

        const controller = new EditorController(model, view);

        // --- FLUSSO: Formattazione ---
        view.simulateFormatAction(FormatType.BOLD);

        expect(executeCommandSpy).toHaveBeenCalledTimes(1);
        expect(executeCommandSpy).toHaveBeenCalledWith(expect.any(FormatTextCommand));
        expect(pushSpy).toHaveBeenCalledTimes(1); 
        expect(applyFormatSpy).toHaveBeenCalledTimes(1); 
        expect(markDirtySpy).toHaveBeenCalledTimes(1); 
        expect(updateSpy).toHaveBeenCalled(); 

        // --- FLUSSO: Undo ---
        view.simulateAction('undo');

        expect(modelUndoSpy).toHaveBeenCalledTimes(1); 
        expect(historyUndoSpy).toHaveBeenCalledTimes(1); 
        expect(removeFormatSpy).toHaveBeenCalledTimes(1); 
        expect(markDirtySpy).toHaveBeenCalledTimes(2); 
        expect(updateSpy).toHaveBeenCalledTimes(2); 

        // --- FLUSSO: Redo ---
        view.simulateAction('redo');

        expect(modelRedoSpy).toHaveBeenCalledTimes(1); 
        expect(historyRedoSpy).toHaveBeenCalledTimes(1); 
        expect(applyFormatSpy).toHaveBeenCalledTimes(2); 
        expect(markDirtySpy).toHaveBeenCalledTimes(3); 
        expect(updateSpy).toHaveBeenCalledTimes(3); 
    });
});

describe('EditorController - Inserimento tabella con validazione', () => {
    it('dovrebbe gestire l\'errore se le dimensioni della tabella non sono valide (Step 1-15)', () => {
        const markdownEditor = new MarkdownContentEditor();
        const history = new CommandHistory();
        const model = new NoteModel(markdownEditor, history, mockNoteService);
        const view = new EditorView(model, {} as any);
        const controller = new EditorController(model, view);

        const displayErrorSpy = vi.spyOn(view, 'displayError');
        
        // SIMULAZIONE: Step 1-3 con dimensioni non valide (es. riga negativa)
        view.simulateTableAction(-1, 0);

        // VERIFICA: L'errore deve essere intercettato e inviato alla view
        expect(displayErrorSpy).toHaveBeenCalledTimes(1);
        expect(displayErrorSpy).toHaveBeenCalledWith('Dimensioni tabella non valide');
    });

    it('dovrebbe inserire la tabella se le dimensioni sono valide (Step 1-11, 16-19)', () => {
        const markdownEditor = new MarkdownContentEditor();
        const applyTableSpy = vi.spyOn(markdownEditor, 'applyTableOperation');
        const history = new CommandHistory();
        const model = new NoteModel(markdownEditor, history, mockNoteService);
        const view = new EditorView(model, {} as any);
        const controller = new EditorController(model, view);

        const executeCommandSpy = vi.spyOn(model, 'executeCommand');
        const markDirtySpy = vi.spyOn(model, 'markDirtyAndNotify');
        const updateSpy = vi.spyOn(view, 'update');

        // SIMULAZIONE: Step 1-3 con dimensioni valide
        view.simulateTableAction(3, 3);

        // VERIFICA: Il flusso esegue il comando e notifica il successo
        expect(executeCommandSpy).toHaveBeenCalledWith(expect.any(TableCommand));
        expect(applyTableSpy).toHaveBeenCalledTimes(1); // Step 12 & 16
        expect(markDirtySpy).toHaveBeenCalledTimes(1); // Step 17
        expect(updateSpy).toHaveBeenCalled(); // Step 19
    });
});