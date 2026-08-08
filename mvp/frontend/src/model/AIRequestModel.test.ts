import { describe, it, expect, vi } from 'vitest';
import { AIRequestModel } from './AIRequestModel';
import { Observer } from './Observer';
import { IdleState } from './IdleState';
import { AIService } from '../proxy/AIService';

class MockObserver implements Observer {
    update = vi.fn();
}

const mockAIService: AIService = {
    requestOperation: vi.fn(),
    listOperations: vi.fn().mockResolvedValue(['distant_writing', 'red_hat'])
};

describe('AIRequestModel', () => {
    it('dovrebbe inizializzarsi con IdleState', () => {
        const model = new AIRequestModel(mockAIService);
        expect(model.getAIState()).toBeInstanceOf(IdleState);
    });

    it('dovrebbe gestire la lista degli Observer (attach, detach, notify)', () => {
        const model = new AIRequestModel(mockAIService);
        const observer = new MockObserver();

        model.attach(observer);
        model.notify();
        expect(observer.update).toHaveBeenCalledTimes(1);

        model.detach(observer);
        model.notify();
        expect(observer.update).toHaveBeenCalledTimes(1); // Non incrementa
    });

    it('dovrebbe richiamare listOperations dal servizio proxy', async () => {
        const model = new AIRequestModel(mockAIService);
        const operations = await model.listOperations();
        
        expect(mockAIService.listOperations).toHaveBeenCalled();
        expect(operations).toEqual(['distant_writing', 'red_hat']);
    });
});