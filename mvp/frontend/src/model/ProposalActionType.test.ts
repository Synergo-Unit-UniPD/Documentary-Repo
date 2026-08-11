import { describe, it, expect } from 'vitest';
import { ProposalActionType } from './ProposalActionType';

describe('ProposalActionType', () => {
    it('dovrebbe contenere tutti i valori definiti nell\'UML', () => {
        expect(ProposalActionType.ACCEPT).toBe('ACCEPT');
        expect(ProposalActionType.REJECT).toBe('REJECT');
        expect(ProposalActionType.REGENERATE).toBe('REGENERATE');
        expect(ProposalActionType.INTERRUPT).toBe('INTERRUPT');
    });
});