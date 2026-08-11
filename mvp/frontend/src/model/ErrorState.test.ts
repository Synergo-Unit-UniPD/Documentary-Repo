import { describe, it, expect } from 'vitest';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
    it('dovrebbe inizializzare lo stato assegnando il messaggio di errore fornito', () => {
        const errorMessage = 'Errore di connessione al servizio LLM';
        const state = new ErrorState(errorMessage);
        
        expect(state.message).toBe(errorMessage);
    });
});