import { describe, it, expect } from 'vitest';
import { RequestedOperation } from './RequestedOperation';

describe('RequestedOperation', () => {
    it('dovrebbe inizializzare correttamente type e params', () => {
        const params = { prompt: 'Genera un riassunto' };
        const operation = new RequestedOperation('distant_writing', params);
        
        expect(operation.type).toBe('distant_writing');
        expect(operation.params).toEqual(params);
    });
});