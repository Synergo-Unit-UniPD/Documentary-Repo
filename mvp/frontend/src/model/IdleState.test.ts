import { describe, it, expect } from 'vitest'
import { IdleState } from './IdleState'

describe('IdleState', () => {
  it('dovrebbe istanziare correttamente la classe IdleState', () => {
    const state = new IdleState()
    expect(state).toBeInstanceOf(IdleState)
  })
})
