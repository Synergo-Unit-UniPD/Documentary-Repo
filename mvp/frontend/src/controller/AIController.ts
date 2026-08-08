import { Observer } from '../model/Observer';
import { AIRequestModel } from '../model/AIRequestModel';
import { AIPanelView } from '../view/AIPanelView';
import { NoteModel } from '../model/NoteModel';
import { ProposalActionType } from '../model/ProposalActionType';

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

        const action = this.view.getLastProposalAction();
        if (action) {
            switch (action) {
                case ProposalActionType.ACCEPT:
                    this.onAcceptProposal();
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