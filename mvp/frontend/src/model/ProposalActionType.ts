/**
 * Rappresenta le azioni che l'utente può eseguire su una proposta generata dall'AI.
 */
export enum ProposalActionType {
    ACCEPT = 'ACCEPT',
    REJECT = 'REJECT',
    REGENERATE = 'REGENERATE',
    INTERRUPT = 'INTERRUPT'
}