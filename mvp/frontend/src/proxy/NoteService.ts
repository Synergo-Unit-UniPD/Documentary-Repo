import { Note } from '../model/Note'

/**
 * Interfaccia per il servizio Proxy di salvataggio e apertura delle note.
 * `save` restituisce l'id definitivo della nota (es. dopo aver scelto un nome
 * al primo salvataggio): il chiamante deve memorizzarlo e riusarlo nelle note
 * successive, così i salvataggi seguenti scrivono direttamente senza
 * richiedere di nuovo un nome/percorso (R75-F-O).
 */
export interface NoteService {
  save(note: Note): Promise<string>
  open(): Promise<Note>
}
