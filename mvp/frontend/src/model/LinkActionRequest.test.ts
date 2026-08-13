import { describe, it, expect } from 'vitest'
import { LinkActionRequest } from './LinkActionRequest'
import { LinkOperationType } from './LinkOperationType'

describe('LinkActionRequest', () => {
  it('dovrebbe istanziare LinkActionRequest', () => {
    const req = new LinkActionRequest(LinkOperationType.INSERT_LINK, 'https://test.com', 'Label')
    expect(req.operation).toBe(LinkOperationType.INSERT_LINK)
    expect(req.url).toBe('https://test.com')
    expect(req.label).toBe('Label')
  })
})
