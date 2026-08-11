import { describe, it, expect, vi } from 'vitest';
import { EditorView } from './EditorView';
import { NoteModel } from '../model/NoteModel';
import { MarkdownContentEditor } from '../model/MarkdownContentEditor';
import { CommandHistory } from '../model/CommandHistory';
import { NoteService } from '../proxy/NoteService';
import { Observer } from '../model/Observer';
import { Note } from '../model/Note';
import { FormatType } from '../model/FormatType';

const mockNoteService: NoteService = {
    save: vi.fn(),
    open: vi.fn().mockResolvedValue(new Note('1', ''))
};

class MockObserver implements Observer {
    update = vi.fn();
}

describe('EditorView', () => {
    it('dovrebbe gestire le richieste di consume correttamente (MVC Pull)', () => {
        const model = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService);
        const view = new EditorView(model, {});
        
        expect(view.consumeSaveRequest()).toBe(false);
        
        view.simulateAction('save');
        // Dopo la notifica, il controller o il test dovrebbe "consumare" il true
        expect(view.consumeSaveRequest()).toBe(true);
        // La successiva lettura deve essere false
        expect(view.consumeSaveRequest()).toBe(false);
    });

    it('dovrebbe notificare il controller all\'emissione di un evento', () => {
        const model = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService);
        const view = new EditorView(model, {});
        const controller = new MockObserver();
        
        view.attach(controller);
        view.simulateFormatAction(FormatType.BOLD);
        
        expect(controller.update).toHaveBeenCalledTimes(1);
    });
});