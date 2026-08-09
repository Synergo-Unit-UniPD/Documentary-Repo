import { Observer } from '../model/Observer';
import { Subject } from '../model/Subject';
import { AIRequestModel } from '../model/AIRequestModel';
import { RequestedOperation } from '../model/RequestedOperation';
import { ProposalActionType } from '../model/ProposalActionType';
import { ProposalReadyState } from '../model/ProposalReadyState';

/**
 * Vista del pannello AI. Osserva il Model per i cambiamenti di stato
 * e agisce come Subject verso il Controller per le interazioni utente.
 */
export class AIPanelView implements Observer, Subject {
    private model: AIRequestModel;
    private observers: Observer[] = [];
    private lastRequestedOperation?: RequestedOperation;
    private lastProposalAction?: ProposalActionType;

    constructor(model: AIRequestModel) {
        this.model = model;
        this.model.attach(this);
    }

    public attach(o: Observer): void {
        if (!this.observers.includes(o)) {
            this.observers.push(o);
        }
    }

    public detach(o: Observer): void {
        this.observers = this.observers.filter(obs => obs !== o);
    }

    public notify(): void {
        for (const observer of this.observers) {
            observer.update();
        }
    }

    // passi di Ricezione proposta AI (tratto Frontend).jpg
    // 4: update() richiamato dal notify() di AIRequestModel
    public update(): void {
        this.render();
    }

    public render(): void {
        // 5 e 6: getAIState per recuperare lo stato aggiornato
        const currentState = this.model.getAIState();

        // 7: mostra proposta; pulsanti Accept, Reject, Regenerate
        if (currentState instanceof ProposalReadyState) {
            // Qui avverrà il rendering reattivo gestito da Vue.js
            // currentState.proposal conterrà il dato da visualizzare.
        }
    }

    public getLastRequestedOperation(): RequestedOperation | undefined {
        return this.lastRequestedOperation;
    }

    public getLastProposalAction(): ProposalActionType | undefined {
        return this.lastProposalAction;
    }

    public simulateSubmitRequest(op: RequestedOperation): void {
        this.lastRequestedOperation = op;
        this.lastProposalAction = undefined;
        this.notify();
    }

    public simulateProposalAction(action: ProposalActionType): void {
        this.lastProposalAction = action;
        this.lastRequestedOperation = undefined;
        this.notify();
    }
}