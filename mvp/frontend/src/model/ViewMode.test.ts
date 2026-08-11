import { describe, it, expect } from 'vitest';
import { ViewMode } from './ViewMode';

describe('ViewMode', () => {
    it('dovrebbe contenere i valori corretti', () => {
        expect(ViewMode.EDITOR_ONLY).toBe('EDITOR_ONLY');
        expect(ViewMode.PREVIEW_ONLY).toBe('PREVIEW_ONLY');
        expect(ViewMode.SPLIT).toBe('SPLIT');
    });
});