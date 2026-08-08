import { IdleState } from './IdleState';
import { ProcessingState } from './ProcessingState';
import { ProposalReadyState } from './ProposalReadyState';
import { ErrorState } from './ErrorState';

/**
 * Discriminated union che rappresenta lo stato mutuamente esclusivo 
 * della richiesta AI in un dato momento.
 */
export type AIRequestState = IdleState | ProcessingState | ProposalReadyState | ErrorState;