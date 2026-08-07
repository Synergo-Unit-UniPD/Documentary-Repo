import { describe, it, expect } from 'vitest';
import { AIRequestState } from './AIRequestState';

describe('AIRequestState', () => {
    it('dovrebbe istanziare correttamente la classe AIRequestState', () => {
        const state = new AIRequestState();
        expect(state).toBeInstanceOf(AIRequestState);
    });
});