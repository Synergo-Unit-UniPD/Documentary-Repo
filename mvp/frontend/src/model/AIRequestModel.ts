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
        return this.aiState; // Step 8 & 22
    }

    public async requestAIOperation(type: string, text: string, params: object): Promise<void> {
        try {
            this.aiState = new ProcessingState();
            this.notify();
            
            const proposal = await this.aiService.requestOperation(type, text, params);
            
            this.aiState = new ProposalReadyState(proposal);
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
        // Step 19: aiState = Idle
        this.aiState = new IdleState();
        // Step 20: notify (-> Step 21 update su AIPanelView, Step 23 IdleState, Step 24 nasconde pannello)
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