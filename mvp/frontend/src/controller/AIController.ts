import { Observer } from '../model/Observer';
import { AIRequestModel } from '../model/AIRequestModel';
import { AIPanelView } from '../view/AIPanelView';
import { NoteModel } from '../model/NoteModel';
import { ProposalActionType } from '../model/ProposalActionType';
import { ProposalReadyState } from '../model/ProposalReadyState';
import { InsertTextCommand } from '../model/InsertTextCommand';
import { MarkdownContentEditor } from '../model/MarkdownContentEditor';

/**
 * Controller che fa da collante tra le interazioni dell'AIPanelView e l'AIRequestModel.
 */
export class AIController implements Observer {
    private model: AIRequestModel;
    private view: AIPanelView;
    public noteModel: NoteModel;

    constructor(model: AIRequestModel, view: AIPanelView, noteModel: NoteModel) {
        this.model = model;
        this.view = view;
        this.noteModel = noteModel;
        
        this.view.attach(this);
    }

    public update(): void {
        const requestedOp = this.view.getLastRequestedOperation();
        if (requestedOp) {
            this.onAIRequest(requestedOp.type, requestedOp.params);
            return;
        }

        // Step 5 & 6: getLastProposalAction -> ACCEPT
        const action = this.view.getLastProposalAction();
        if (action) {
            switch (action) {
                case ProposalActionType.ACCEPT:
                    this.onAcceptProposal(); // Step 7
                    break;
                case ProposalActionType.REJECT:
                    this.onRejectProposal();
                    break;
                case ProposalActionType.REGENERATE:
                    this.onRegenerateProposal();
                    break;
                case ProposalActionType.INTERRUPT:
                    this.onInterrupt();
                    break;
            }
        }
    }

    private onAIRequest(type: string, params: object): void {
        const currentText = this.noteModel.getContent();
        this.model.requestAIOperation(type, currentText, params);
    }

    private onAcceptProposal(): void {
        // Step 8: getAIState dal Model
        const currentState = this.model.getAIState();
        
        if (currentState instanceof ProposalReadyState) {
            const proposal = currentState.proposal;
            const editor = (this.noteModel as any).contentEditor as MarkdownContentEditor;
            
            // Step 10: new InsertTextCommand(noteModel, position, proposal.content)
            // Assumiamo di inserire la proposta alla fine o alla posizione corrente (es. 0 o lunghezza attuale)
            const position = editor.getContent().length;
            const command = new InsertTextCommand(this.noteModel, position, proposal.content, editor);
            
            // Step 11 & 12 & 13 & 14 & 15: executeCommand sul NoteModel
            this.noteModel.executeCommand(command);
        }

        // Step 18: acceptProposal sul model per riportarlo in Idle
        this.model.acceptProposal();
    }

    private onRejectProposal(): void {
        this.model.rejectProposal();
    }

    private onRegenerateProposal(): void {
        this.model.regenerateProposal();
    }

    private onInterrupt(): void {
        this.model.interruptAIOperation();
    }
}