import { ExportFormat, ExportService } from './ExportService'

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
      const errorMsg = await response.text()
      throw new Error(`Errore durante l'esportazione in formato ${format}: ${errorMsg}`)
    }

    return await response.blob()
  }
}
