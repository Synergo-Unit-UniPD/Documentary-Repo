import { Observer } from '../model/Observer';
import { Subject } from '../model/Subject';
import { AIRequestModel } from '../model/AIRequestModel';
import { RequestedOperation } from '../model/RequestedOperation';
import { ProposalActionType } from '../model/ProposalActionType';
import { ProposalReadyState } from '../model/ProposalReadyState';
import { ProcessingState } from '../model/ProcessingState';

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
            // Step 4: update sul Controller
            observer.update();
        }
    }

    public update(): void {
        // Step 11: update() richiamato dal notify() di AIRequestModel
        this.render();
    }

    public render(): void {
        // Step 12: getAIState per recuperare lo stato aggiornato
        const currentState = this.model.getAIState(); // Step 13: ProcessingState (o altri)

        if (currentState instanceof ProcessingState) {
            // Step 14: mostra spinner, "Interrompi"
            // Il rendering visivo reale è delegato reattivamente al template Vue.js
        } else if (currentState instanceof ProposalReadyState) {
            // (Dal diagramma: Ricezione proposta AI)
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
        // Step 1: L'utente seleziona testo, click "Riassumi" -> la UI di Vue chiama questo metodo
        // Step 2: lastRequestedOperation = RequestedOperation(SUMMARIZE, params)
        this.lastRequestedOperation = op;
        this.lastProposalAction = undefined;
        
        // Step 3: notify
        this.notify();
    }

    public simulateProposalAction(action: ProposalActionType): void {
        this.lastProposalAction = action;
        this.lastRequestedOperation = undefined;
        this.notify();
    }
}