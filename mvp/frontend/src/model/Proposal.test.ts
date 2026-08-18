import { describe, it, expect } from 'vitest'
import { Proposal } from './Proposal'

describe('Proposal', () => {
  it('dovrebbe inizializzare correttamente gli attributi con i valori forniti', () => {
    const testDate = new Date('2026-08-07T12:00:00Z')
    const proposal = new Proposal('Testo di prova per AI', 'distant_writing', testDate)

    expect(proposal.content).toBe('Testo di prova per AI')
    expect(proposal.operationType).toBe('distant_writing')
    expect(proposal.createdAt).toEqual(testDate)
  })

  it('dovrebbe assegnare la data corrente se createdAt non viene fornito', () => {
    const proposal = new Proposal('Testo con data automatica', 'red_hat')

    expect(proposal.createdAt).toBeInstanceOf(Date)
  })
})
