import { TextRange } from './TextRange';
import { FormatType } from './FormatType';
import { TableActionRequest } from './TableActionRequest';
import { ListActionRequest } from './ListActionRequest';
import { LinkActionRequest } from './LinkActionRequest';
import { LinkOperationType } from './LinkOperationType';

export class MarkdownContentEditor {
    private content: string;

    constructor(initialContent: string = "") {
        this.content = initialContent;
    }

    public getContent(): string {
        return this.content;
    }

    public setContent(content: string): void {
        this.content = content;
    }

    public insertText(position: number, text: string): string {
        return this.content;
    }

    public applyFormat(range: TextRange, type: FormatType): string {
        return this.content;
    }

    public removeFormat(range: TextRange, type: FormatType): string {
        return this.content;
    }

    public applyTableOperation(request: TableActionRequest): string {
        return this.content;
    }

    public applyListOperation(range: TextRange, request: ListActionRequest): string {
        return this.content;
    }

    public applyLinkOperation(range: TextRange, request: LinkActionRequest): string {
        return this.content;
    }

    public getLinkAt(range: TextRange): LinkActionRequest {
        return new LinkActionRequest(LinkOperationType.EDIT_LINK);
    }
}