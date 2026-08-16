import { describe, it, expect } from 'vitest'
import { ProposalReadyState } from './ProposalReadyState'
import { Proposal } from './Proposal'

describe('ProposalReadyState', () => {
  it('dovrebbe inizializzare lo stato e contenere la Proposal passata al costruttore', () => {
    const testDate = new Date('2026-08-07T12:00:00Z')
    const mockProposal = new Proposal('Testo generato', 'distant_writing', testDate)

    const state = new ProposalReadyState(mockProposal)

    expect(state.proposal).toBeDefined()
    expect(state.proposal.content).toBe('Testo generato')
    expect(state.proposal.operationType).toBe('distant_writing')
  })
})
