import { Subject } from './Subject';
import { Observer } from './Observer';
import { AIRequestState } from './AIRequestState';
import { IdleState } from './IdleState';
import { ProcessingState } from './ProcessingState';
import { ProposalReadyState } from './ProposalReadyState';
import { ErrorState } from './ErrorState';
import { AIService } from '../proxy/AIService';

/**
 * Modello centrale delegato alla gestione dello stato delle richieste AI.
 */
export class AIRequestModel implements Subject {
    private aiState: AIRequestState;
    private observers: Observer[] = [];
    private aiService: AIService;

    constructor(aiService: AIService) {
        this.aiService = aiService;
        this.aiState = new IdleState();
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

    public getAIState(): AIRequestState {
        return this.aiState;
    }

    public async requestAIOperation(type: string, text: string, params: object): Promise<void> {
        try {
            // Stato transitorio di caricamento
            this.aiState = new ProcessingState();
            this.notify();
            
            // passi di Ricezione proposta AI (tratto Frontend).jpg
            // 1: Risoluzione Promise di requestOperation
            const proposal = await this.aiService.requestOperation(type, text, params);
            
            // 2: aiState = ProposalReadyState(proposal)
            this.aiState = new ProposalReadyState(proposal);
            
            // 3: notify
            this.notify();
        } catch (error: any) {
            this.aiState = new ErrorState(error.message || "Errore durante l'operazione AI");
            this.notify();
        }
    }

    public interruptAIOperation(): void {
        this.aiState = new IdleState();
        this.notify();
    }

    public acceptProposal(): void {
        this.aiState = new IdleState();
        this.notify();
    }

    public rejectProposal(): void {
        this.aiState = new IdleState();
        this.notify();
    }

    public regenerateProposal(): void {
        this.aiState = new IdleState();
        this.notify();
    }

    public async listOperations(): Promise<string[]> {
        return this.aiService.listOperations();
    }
}