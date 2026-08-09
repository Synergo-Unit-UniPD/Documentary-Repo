import { describe, it, expect, vi } from 'vitest';
import { AIRequestModel } from './AIRequestModel';
import { Observer } from './Observer';
import { IdleState } from './IdleState';
import { ProcessingState } from './ProcessingState';
import { ProposalReadyState } from './ProposalReadyState';
import { ErrorState } from './ErrorState';
import { AIService } from '../proxy/AIService';
import { Proposal } from './Proposal';

class MockObserver implements Observer {
    update = vi.fn();
}

describe('AIRequestModel', () => {
    it('dovrebbe seguire il diagramma di sequenza durante requestAIOperation', async () => {
        const mockProposal = new Proposal('Testo generato', 'red_hat', new Date());
        const mockAIService: AIService = {
            requestOperation: vi.fn().mockResolvedValue(mockProposal),
            listOperations: vi.fn().mockResolvedValue([])
        };

        const model = new AIRequestModel(mockAIService);
        const observer = new MockObserver();
        model.attach(observer);

        // Avvio chiamata asincrona
        const requestPromise = model.requestAIOperation('red_hat', 'testo', {});
        
        // Verifica transizione in ProcessingState
        expect(model.getAIState()).toBeInstanceOf(ProcessingState);
        expect(observer.update).toHaveBeenCalledTimes(1);

        await requestPromise;

        // Verifica transizione in ProposalReadyState
        const finalState = model.getAIState();
        expect(finalState).toBeInstanceOf(ProposalReadyState);
        expect((finalState as ProposalReadyState).proposal).toBe(mockProposal);
        expect(observer.update).toHaveBeenCalledTimes(2);
    });

    it('dovrebbe gestire gli errori e passare in ErrorState', async () => {
        const mockAIService: AIService = {
            requestOperation: vi.fn().mockRejectedValue(new Error('Network error')),
            listOperations: vi.fn().mockResolvedValue([])
        };

        const model = new AIRequestModel(mockAIService);
        await model.requestAIOperation('red_hat', 'testo', {});

        expect(model.getAIState()).toBeInstanceOf(ErrorState);
    });
});