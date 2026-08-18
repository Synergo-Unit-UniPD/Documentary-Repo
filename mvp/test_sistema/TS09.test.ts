import { describe, it, expect } from "vitest";

import { ListCommand } from "../frontend/src/model/ListCommand";
import { MarkdownContentEditor } from "../frontend/src/model/MarkdownContentEditor";
import { TextRange } from "../frontend/src/model/TextRange";
import { ListActionRequest } from "../frontend/src/model/ListActionRequest";
import { ListOperationType } from "../frontend/src/model/ListOperationType";
import { ListType } from "../frontend/src/model/ListType";

describe("TS09 - Gestione Elenchi: Puntato, Numerato, Aggiunta, Indent, Outdent, Conversione, Disattivazione, Rimozione", () => {

  it("Inserimento elenco puntato", () => {
    const editor = new MarkdownContentEditor("Test");
    const range = new TextRange(0, 4);

    const request = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.UNORDERED);
    const command = new ListCommand(range, request, editor);

    command.execute();
    expect(editor.getContent()).toBe("- Test");
  });

  it("Inserimento elenco numerato", () => {
    const editor = new MarkdownContentEditor("Test");
    const range = new TextRange(0, 4);

    const request = new ListActionRequest(ListOperationType.CREATE_LIST, ListType.ORDERED);
    const command = new ListCommand(range, request, editor);

    command.execute();
    expect(editor.getContent()).toBe("1. Test");
  });

  it("Aggiunta elemento elenco", () => {
    const editor = new MarkdownContentEditor("- Test");
    const range = new TextRange(0, 6);

    const request = new ListActionRequest(ListOperationType.ADD_ITEM, ListType.UNORDERED);
    const command = new ListCommand(range, request, editor);

    command.execute();
    expect(editor.getContent()).toBe("- Test\n- ");
  });

  it("Indent elemento elenco", () => {
    const editor = new MarkdownContentEditor("- Test");
    const range = new TextRange(0, 6);

    const request = new ListActionRequest(ListOperationType.INDENT_ITEM);
    const command = new ListCommand(range, request, editor);

    command.execute();
    expect(editor.getContent()).toBe("  - Test");
  });

  it("Outdent elemento elenco", () => {
    const editor = new MarkdownContentEditor("  - Test");
    const range = new TextRange(0, 8);

    const request = new ListActionRequest(ListOperationType.OUTDENT_ITEM);
    const command = new ListCommand(range, request, editor);

    command.execute();
    expect(editor.getContent()).toBe("- Test");
  });

  it("Conversione elenco puntato → numerato", () => {
    const editor = new MarkdownContentEditor("- Test");
    const range = new TextRange(0, 6);

    const request = new ListActionRequest(ListOperationType.TOGGLE_LIST_TYPE);
    const command = new ListCommand(range, request, editor);

    command.execute();
    expect(editor.getContent()).toBe("1. Test");
  });

  it("Disattivazione elenco (toggle off)", () => {
    const editor = new MarkdownContentEditor("- Test");
    const range = new TextRange(0, 6);

    const request = new ListActionRequest(ListOperationType.DEACTIVATE_LIST_MODE);
    const command = new ListCommand(range, request, editor);

    command.execute();
    expect(editor.getContent()).toBe("Test");
  });

  it("Rimozione elenco dal testo selezionato", () => {
    const editor = new MarkdownContentEditor("- Test");
    const range = new TextRange(0, 6);

    const request = new ListActionRequest(ListOperationType.REMOVE_LIST);
    const command = new ListCommand(range, request, editor);

    command.execute();
    expect(editor.getContent()).toBe("Test");
  });

});