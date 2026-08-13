import { TextRange } from './TextRange'

/**
 * Value Object che incapsula i dettagli dell'ultima operazione AI richiesta.
 */
export class RequestedOperation {
  public type: string
  public params: object

  /** Testo su cui operare (tipicamente la selezione corrente nell'editor).
   *  Se omesso, l'AIController userà l'intero contenuto della nota. */
  public text?: string // ? --> può mancare --> opzionale

  /** Range di selezione da cui proviene `text`, usato per posizionare l'inserimento
   *  della proposta accettata nello stesso punto della richiesta originale. */
  public range?: TextRange

  constructor(type: string, params: object, text?: string, range?: TextRange) {
    this.type = type
    this.params = params
    this.text = text
    this.range = range
  }
}
