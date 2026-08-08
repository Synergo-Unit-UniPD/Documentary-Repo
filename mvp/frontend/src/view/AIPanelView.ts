import { Observer } from '../model/Observer';
import { Subject } from '../model/Subject';
import { AIRequestModel } from '../model/AIRequestModel';
import { RequestedOperation } from '../model/RequestedOperation';
import { ProposalActionType } from '../model/ProposalActionType';

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

    public update(): void {
        this.render();
    }

    public render(): void {
        // Logica di rendering (in Vue sarà delegata alla reattività del framework)
    }

    public getLastRequestedOperation(): RequestedOperation | undefined {
        return this.lastRequestedOperation;
    }

    public getLastProposalAction(): ProposalActionType | undefined {
        return this.lastProposalAction;
    }

    // Metodi per permettere i test
    // Vue di simulare gli input dell'utente e notificare il controller.
    public simulateSubmitRequest(op: RequestedOperation): void {
        this.lastRequestedOperation = op;
        this.lastProposalAction = undefined; // Resetta l'azione precedente
        this.notify();
    }

    public simulateProposalAction(action: ProposalActionType): void {
        this.lastProposalAction = action;
        this.lastRequestedOperation = undefined;
        this.notify();
    }
}