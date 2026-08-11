import { describe, it, expect } from 'vitest';
import { TableActionRequest } from './TableActionRequest';
import { TableOperationType } from './TableOperationType';
import { ListActionRequest } from './ListActionRequest';
import { ListOperationType } from './ListOperationType';
import { ListType } from './ListType';
import { LinkActionRequest } from './LinkActionRequest';
import { LinkOperationType } from './LinkOperationType';

describe('ActionRequests Value Objects', () => {
    it('dovrebbe istanziare TableActionRequest con campi opzionali', () => {
        const req = new TableActionRequest(TableOperationType.CREATE_TABLE, 3, 3);
        expect(req.operation).toBe(TableOperationType.CREATE_TABLE);
        expect(req.rowCount).toBe(3);
        expect(req.colCount).toBe(3);
        expect(req.rowIndex).toBeUndefined();
    });

    it('dovrebbe istanziare ListActionRequest', () => {
        const req = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.ORDERED);
        expect(req.operation).toBe(ListOperationType.CREATE_LIST);
        expect(req.listType).toBe(ListType.ORDERED);
    });

    it('dovrebbe istanziare LinkActionRequest', () => {
        const req = new LinkActionRequest(LinkOperationType.INSERT_LINK, 'https://test.com', 'Label');
        expect(req.operation).toBe(LinkOperationType.INSERT_LINK);
        expect(req.url).toBe('https://test.com');
        expect(req.label).toBe('Label');
    });
});