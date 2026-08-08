import { Subject } from './Subject';
import { Observer } from './Observer';
import { AIRequestState } from './AIRequestState';
import { IdleState } from './IdleState';
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
        // Implementazione temporanea vuota per validazione firme
    }

    public interruptAIOperation(): void {
        // Implementazione temporanea vuota
    }

    public acceptProposal(): void {
        // Implementazione temporanea vuota
    }

    public rejectProposal(): void {
        // Implementazione temporanea vuota
    }

    public regenerateProposal(): void {
        // Implementazione temporanea vuota
    }

    public async listOperations(): Promise<string[]> {
        return this.aiService.listOperations();
    }
}