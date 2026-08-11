/**
 * Interfaccia per il pattern Command, utile per implementare azioni annullabili.
 */
export interface EditCommand {
    execute(): void;
    undo(): void;
}
