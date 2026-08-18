/**
 * Rappresenta una singola nota all'interno del sistema.
 */
export class Note {
  public id: string
  public content: string

  constructor(id: string, content: string) {
    this.id = id
    this.content = content
  }
}
