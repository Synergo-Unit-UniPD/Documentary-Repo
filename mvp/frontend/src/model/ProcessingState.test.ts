import { describe, it, expect } from 'vitest';
import { ProcessingState } from './ProcessingState';

describe('ProcessingState', () => {
    it('dovrebbe istanziare correttamente la classe ProcessingState', () => {
        const state = new ProcessingState();
        expect(state).toBeInstanceOf(ProcessingState);
    });
});