import { ExportFormat, ExportService } from './ExportService'

/**
 * Messaggi amichevoli per i tipi di errore noti restituiti dal backend (vedi
 * export/exceptions.py - ExportError e sottoclassi, esposte come
 * {"error": <nome classe>, "message": <dettaglio>} da error_handlers.py).
 * Un tipo di errore non presente qui ricade sul messaggio del backend, se
 * presente, o su un messaggio generico.
 */
const EXPORT_ERROR_MESSAGES: Record<string, string> = {
  ConversionError: 'Non è stato possibile generare il file per questo formato. Riprova.',
}

export class ExportServiceProxy implements ExportService {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  public async exportNote(format: ExportFormat, content: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/export/${format}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      throw new Error(
        await this.buildFriendlyErrorMessage(response, `Errore durante l'esportazione in formato ${format}: `),
      )
    }

    return await response.blob()
  }

  /**
   * Il backend può restituire due forme diverse di errore per l'export:
   * {"error", "message"} per i fallimenti di conversione (ConversionError,
   * vedi error_handlers.py), oppure il formato standard di FastAPI
   * {"detail": "..."} per un formato non supportato (400, vedi
   * export_router.py) - quest'ultimo caso non è raggiungibile dall'interfaccia,
   * dato che ExportFormat è un tipo vincolato, ma viene comunque gestito.
   * Se il corpo non è in nessuno dei due formati, ricade sul testo grezzo,
   * preceduto dal prefisso indicato.
   */
  private async buildFriendlyErrorMessage(response: Response, fallbackPrefix: string): Promise<string> {
    const rawBody = await response.text()

    try {
      const parsed = JSON.parse(rawBody)
      if (parsed && typeof parsed.error === 'string') {
        return EXPORT_ERROR_MESSAGES[parsed.error] ?? parsed.message ?? `${fallbackPrefix}${rawBody}`
      }
      if (parsed && typeof parsed.detail === 'string') {
        return parsed.detail
      }
    } catch {
      // Corpo non in formato JSON: ricade sul testo grezzo sotto.
    }

    return `${fallbackPrefix}${rawBody}`
  }
}
