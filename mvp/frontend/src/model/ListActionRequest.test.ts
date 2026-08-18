import { describe, it, expect } from 'vitest'
import { ListActionRequest } from './ListActionRequest'
import { ListOperationType } from './ListOperationType'
import { ListType } from './ListType'

describe('ListActionRequest', () => {
  it('dovrebbe istanziare ListActionRequest', () => {
    const req = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.ORDERED)
    expect(req.operation).toBe(ListOperationType.CREATE_LIST)
    expect(req.listType).toBe(ListType.ORDERED)
  })
})
