/**
 * Eccezione sollevata in caso di fallimento durante il salvataggio o l'apertura di una nota.
 *
 * `cancelled` distingue il caso in cui l'utente ha semplicemente annullato il
 * selettore di file nativo del browser (showSaveFilePicker/showOpenFilePicker)
 * da un vero errore di I/O: nel primo caso non è successo nulla di sbagliato,
 * quindi il chiamante non deve mostrare un messaggio d'errore allarmante.
 */
export class NoteIOError extends Error {
  public message: string
  public cancelled: boolean

  constructor(message: string, cancelled: boolean = false) {
    super(message)
    this.name = 'NoteIOError'
    this.message = message
    this.cancelled = cancelled
  }
}
