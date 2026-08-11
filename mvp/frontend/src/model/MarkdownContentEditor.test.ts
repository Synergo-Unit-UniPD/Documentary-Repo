import { describe, it, expect } from 'vitest';
import { MarkdownContentEditor } from './MarkdownContentEditor';
import { TextRange } from './TextRange';

describe('MarkdownContentEditor', () => {
    it('dovrebbe gestire get e set del content', () => {
        const editor = new MarkdownContentEditor('Testo iniziale');
        expect(editor.getContent()).toBe('Testo iniziale');
        
        editor.setContent('Nuovo testo');
        expect(editor.getContent()).toBe('Nuovo testo');
    });

    it('dovrebbe possedere tutte le firme previste da UML', () => {
        const editor = new MarkdownContentEditor();
        const range = new TextRange(0, 5);
        
        expect(typeof editor.insertText).toBe('function');
        expect(typeof editor.removeFormat).toBe('function');
        expect(typeof editor.applyTableOperation).toBe('function');
        expect(typeof editor.applyListOperation).toBe('function');
        expect(typeof editor.applyLinkOperation).toBe('function');
        expect(editor.getLinkAt(range)).toBeDefined();
    });
});