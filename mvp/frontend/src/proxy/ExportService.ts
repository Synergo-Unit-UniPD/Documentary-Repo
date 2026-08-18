export type ExportFormat = 'pdf' | 'html' | 'json'

/**
 * Interfaccia per il servizio Proxy che comunica con il Backend per l'esportazione
 * della nota nei formati richiesti (R77-F-O).
 */
export interface ExportService {
  exportNote(format: ExportFormat, content: string): Promise<Blob>
}
