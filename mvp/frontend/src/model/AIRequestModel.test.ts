import { describe, it, expect, vi } from 'vitest';
import { AIRequestModel } from './AIRequestModel';
import { Observer } from './Observer';
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

        const requestPromise = model.requestAIOperation('red_hat', 'testo', {});
        
        expect(model.getAIState()).toBeInstanceOf(ProcessingState);
        expect(observer.update).toHaveBeenCalledTimes(1);

        await requestPromise;

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

    it('dovrebbe delegare listOperations al proxy AIService', async () => {
        const mockOperations = ['summary', 'distant_writing'];
        const mockAIService: AIService = {
            requestOperation: vi.fn(),
            listOperations: vi.fn().mockResolvedValue(mockOperations)
        };

        const model = new AIRequestModel(mockAIService);
        const result = await model.listOperations();

        expect(mockAIService.listOperations).toHaveBeenCalledTimes(1);
        expect(result).toEqual(mockOperations);
    });
});