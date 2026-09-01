import { AIService } from './AIService'
import { Proposal } from '../model/Proposal'

/**
 * Messaggi amichevoli per i tipi di errore noti restituiti dal backend (vedi
 * AI_Domain/domain/errors.py - AIDomainError e sottoclassi, esposti come
 * {"error": <nome classe>, "message": <dettaglio>} da error_handlers.py).
 * Un tipo di errore non presente qui ricade sul messaggio del backend, se
 * presente, o su un messaggio generico.
 */
const AI_ERROR_MESSAGES: Record<string, string> = {
  UnknownOperationError: 'Operazione AI non riconosciuta.',
  LLMTimeoutError: 'Il modello AI ha impiegato troppo tempo a rispondere. Riprova.',
  LLMUnavailableError: 'Il servizio AI non è raggiungibile al momento. Controlla la connessione e riprova.',
}

export class AIServiceProxy implements AIService {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  public async requestOperation(type: string, text: string, params: object): Promise<Proposal> {
    const response = await fetch(`${this.baseUrl}/api/ai/operations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, text, params }),
    })

    if (!response.ok) {
      throw new Error(await this.buildFriendlyErrorMessage(response, 'Errore durante la richiesta AI: '))
    }

    const data = await response.json()
    return new Proposal(data.content, data.operation_type, new Date(data.created_at))
  }

  public async listOperations(): Promise<string[]> {
    // Step 2: list_operations(GET api/ai/operations)
    const response = await fetch(`${this.baseUrl}/api/ai/operations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(await this.buildFriendlyErrorMessage(response, 'Errore nel recupero delle operazioni: '))
    }

    // Step 8: operationsList
    return await response.json()
  }

  /**
   * Il backend restituisce sempre {error, message} in caso di errore (vedi
   * presentation_layer/api/error_handlers.py): qui lo traduciamo in un
   * messaggio adatto all'utente finale invece di mostrare il JSON grezzo.
   * Se il corpo non è nel formato atteso (es. un errore di un livello di rete
   * intermedio, non del nostro backend), ricade sul testo grezzo della
   * risposta, preceduto dal prefisso indicato.
   */
  private async buildFriendlyErrorMessage(response: Response, fallbackPrefix: string): Promise<string> {
    const rawBody = await response.text()

    try {
      const parsed = JSON.parse(rawBody)
      if (parsed && typeof parsed.error === 'string') {
        return AI_ERROR_MESSAGES[parsed.error] ?? parsed.message ?? `${fallbackPrefix}${rawBody}`
      }
    } catch {
      // Corpo non in formato JSON: ricade sul testo grezzo sotto.
    }

    return `${fallbackPrefix}${rawBody}`
  }
}
