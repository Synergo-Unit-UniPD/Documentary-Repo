import { describe, it, expect, vi } from 'vitest';
import { AIController } from './AIController';
import { AIRequestModel } from '../model/AIRequestModel';
import { AIPanelView } from '../view/AIPanelView';
import { NoteModel } from '../model/NoteModel';
import { CommandHistory } from '../model/CommandHistory';
import { MarkdownContentEditor } from '../model/MarkdownContentEditor';
import { NoteService } from '../proxy/NoteService';
import { AIService } from '../proxy/AIService';
import { RequestedOperation } from '../model/RequestedOperation';
import { ProposalActionType } from '../model/ProposalActionType';
import { Note } from '../model/Note';

// Setup dei Mock
const mockAIService: AIService = {
    requestOperation: vi.fn(),
    listOperations: vi.fn().mockResolvedValue([])
};

const mockNoteService: NoteService = {
    save: vi.fn().mockResolvedValue(undefined),
    open: vi.fn().mockResolvedValue(new Note('id', 'testo'))
};

describe('AIController', () => {
    it('dovrebbe invocare requestAIOperation sul model alla ricezione di una RequestedOperation', () => {
        const aiModel = new AIRequestModel(mockAIService);
        const requestSpy = vi.spyOn(aiModel, 'requestAIOperation');
        
        const noteModel = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService);
        vi.spyOn(noteModel, 'getContent').mockReturnValue('testo nota');

        const view = new AIPanelView(aiModel);
        
        const controller = new AIController(aiModel, view, noteModel);
        
        // Simuliamo l'interazione della vista
        const op = new RequestedOperation('distant_writing', { prompt: 'scrivi' });
        view.simulateSubmitRequest(op); // Questo trigghera il notify() della vista -> update() del controller
        
        expect(requestSpy).toHaveBeenCalledWith('distant_writing', 'testo nota', { prompt: 'scrivi' });
    });

    it('dovrebbe invocare acceptProposal sul model se l\'utente accetta', () => {
        const aiModel = new AIRequestModel(mockAIService);
        const acceptSpy = vi.spyOn(aiModel, 'acceptProposal');
        const noteModel = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService);
        const view = new AIPanelView(aiModel);
        
        const controller = new AIController(aiModel, view, noteModel);
        
        view.simulateProposalAction(ProposalActionType.ACCEPT);
        
        expect(acceptSpy).toHaveBeenCalledTimes(1);
    });
});