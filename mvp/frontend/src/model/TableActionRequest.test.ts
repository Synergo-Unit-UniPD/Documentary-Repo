import { describe, it, expect } from 'vitest'
import { TableActionRequest } from './TableActionRequest'
import { TableOperationType } from './TableOperationType'

describe('TableActionRequest', () => {
  it('dovrebbe istanziare TableActionRequest con campi opzionali', () => {
    const req = new TableActionRequest(TableOperationType.CREATE_TABLE, 3, 3)
    expect(req.operation).toBe(TableOperationType.CREATE_TABLE)
    expect(req.rowCount).toBe(3)
    expect(req.colCount).toBe(3)
    expect(req.rowIndex).toBeUndefined()
  })
})
