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
import { ProposalReadyState } from '../model/ProposalReadyState';
import { Proposal } from '../model/Proposal';
import { Note } from '../model/Note';
import { InsertTextCommand } from '../model/InsertTextCommand';

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
        
        const op = new RequestedOperation('distant_writing', { prompt: 'scrivi' });
        view.simulateSubmitRequest(op);
        
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

    it('dovrebbe creare un InsertTextCommand ed eseguirlo sul NoteModel all\'accettazione della proposta', () => {
        const aiModel = new AIRequestModel(mockAIService);
        // Forziamo lo stato per simulare la presenza di una proposta (Step 9)
        const proposal = new Proposal('Testo proposto dall AI', 'summary');
        (aiModel as any).aiState = new ProposalReadyState(proposal);

        const markdownEditor = new MarkdownContentEditor('Testo iniziale');
        const commandHistory = new CommandHistory();
        const noteModel = new NoteModel(markdownEditor, commandHistory, mockNoteService);
        
        const executeCommandSpy = vi.spyOn(noteModel, 'executeCommand');

        const view = new AIPanelView(aiModel);
        const controller = new AIController(aiModel, view, noteModel);

        // Simuliamo l'azione di Accept da parte dell'utente (Step 1-6)
        view.simulateProposalAction(ProposalActionType.ACCEPT);

        // Verifichiamo che il NoteModel abbia eseguito il comando corretto (Step 10-15)
        expect(executeCommandSpy).toHaveBeenCalledTimes(1);
        expect(executeCommandSpy).toHaveBeenCalledWith(expect.any(InsertTextCommand));
    });
});