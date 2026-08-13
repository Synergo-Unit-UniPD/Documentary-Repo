import { Proposal } from './Proposal'

/**
 * Rappresenta lo stato dell'applicazione in cui una proposta generata dall'AI
 * è pronta per essere mostrata e valutata dall'utente.
 */
export class ProposalReadyState {
  public proposal: Proposal

  constructor(proposal: Proposal) {
    this.proposal = proposal
  }
}
