import { describe, it, expect, vi } from 'vitest';
import { NoteModel } from './NoteModel';
import { CommandHistory } from './CommandHistory';
import { MarkdownContentEditor } from './MarkdownContentEditor';
import { NoteService } from '../proxy/NoteService';
import { EditCommand } from './EditCommand';
import { Observer } from './Observer';
import { Note } from './Note';

class MockEditor extends MarkdownContentEditor {
    private mockContent = 'Testo della nota';
    
    override getContent(): string {
        return this.mockContent;
    }
    override setContent(content: string): void {
        this.mockContent = content;
    }
}

class MockNoteService implements NoteService {
    save = vi.fn().mockResolvedValue(undefined);
    open = vi.fn().mockResolvedValue(new Note('note-1', 'Testo caricato'));
}

class MockCommand implements EditCommand {
    execute = vi.fn();
    undo = vi.fn();
}

class MockObserver implements Observer {
    update = vi.fn();
}

describe('NoteModel', () => {
    it('dovrebbe eseguire un comando, impostare isDirty a true e notificare gli observer', () => {
        const editor = new MockEditor();
        const history = new CommandHistory();
        const service = new MockNoteService();
        const model = new NoteModel(editor, history, service);
        const observer = new MockObserver();
        
        model.attach(observer);
        const cmd = new MockCommand();
        
        model.executeCommand(cmd);
        
        expect(cmd.execute).toHaveBeenCalledTimes(1);
        expect(model.getIsDirty()).toBe(true);
        expect(observer.update).toHaveBeenCalledTimes(1);
    });

    it('dovrebbe salvare la nota reimpostando isDirty a false', async () => {
        const editor = new MockEditor();
        const history = new CommandHistory();
        const service = new MockNoteService();
        const model = new NoteModel(editor, history, service);
        
        model.markDirtyAndNotify();
        expect(model.getIsDirty()).toBe(true);
        
        await model.save();
        
        expect(service.save).toHaveBeenCalledTimes(1);
        expect(model.getIsDirty()).toBe(false);
    });

    it('dovrebbe caricare una nota pulendo la cronologia e isDirty', async () => {
        const editor = new MockEditor();
        const history = new CommandHistory();
        const service = new MockNoteService();
        const model = new NoteModel(editor, history, service);
        
        const historySpy = vi.spyOn(history, 'clear');
        
        await model.openNote();
        
        expect(service.open).toHaveBeenCalledTimes(1);
        expect(historySpy).toHaveBeenCalledTimes(1);
        expect(model.getIsDirty()).toBe(false);
        expect(editor.getContent()).toBe('Testo caricato');
    });
});