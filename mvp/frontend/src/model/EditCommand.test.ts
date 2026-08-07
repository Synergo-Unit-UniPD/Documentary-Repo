import { describe, it, expect, vi } from 'vitest';
import { EditCommand } from './EditCommand';

class MockCommand implements EditCommand {
    execute(): void {}
    undo(): void {}
}

describe('EditCommand', () => {
    it('dovrebbe permettere l\'implementazione dei metodi execute e undo', () => {
        const command = new MockCommand();
        const executeSpy = vi.spyOn(command, 'execute');
        const undoSpy = vi.spyOn(command, 'undo');
        
        command.execute();
        command.undo();
        
        expect(executeSpy).toHaveBeenCalledOnce();
        expect(undoSpy).toHaveBeenCalledOnce();
    });
});