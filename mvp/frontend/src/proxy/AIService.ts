import { Proposal } from '../model/Proposal'

/**
 * Interfaccia per il servizio Proxy che comunica con il backend per le operazioni AI.
 */
export interface AIService {
  requestOperation(type: string, text: string, params: object): Promise<Proposal>
  listOperations(): Promise<string[]>
}
