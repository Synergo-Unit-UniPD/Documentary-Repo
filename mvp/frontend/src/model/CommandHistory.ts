import { EditCommand } from './EditCommand';

/**
 * Gestisce la cronologia dei comandi eseguiti, supportando le operazioni di Undo e Redo.
 */
export class CommandHistory {
    private undoStack: EditCommand[] = [];
    private redoStack: EditCommand[] = [];

    public push(c: EditCommand): void {
        this.undoStack.push(c);

        this.redoStack = []; 
    }

    public undo(): void {
        const command = this.undoStack.pop();
        if (command) {
            command.undo();
            this.redoStack.push(command);
        }
    }

    public redo(): void {
        const command = this.redoStack.pop();
        if (command) {
            command.execute();
            this.undoStack.push(command);
        }
    }

    public clear(): void {
        this.undoStack = [];
        this.redoStack = [];
    }
}