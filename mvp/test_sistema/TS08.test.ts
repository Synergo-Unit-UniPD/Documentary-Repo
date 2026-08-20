import { describe, it, expect } from "vitest";

import { LinkCommand } from "../frontend/src/model/LinkCommand";
import { MarkdownContentEditor } from "../frontend/src/model/MarkdownContentEditor";
import { TextRange } from "../frontend/src/model/TextRange";
import { LinkActionRequest } from "../frontend/src/model/LinkActionRequest";
import { LinkOperationType } from "../frontend/src/model/LinkOperationType";

describe("TS08 - Gestione Link: Inserimento, Modifica, Rimozione", () => {

  it("Inserimento link", () => {
    const editor = new MarkdownContentEditor("Ciao");

    const range = new TextRange(0, 4);
    const request = new LinkActionRequest(
      LinkOperationType.INSERT_LINK,
      "https://example.com",
      "Visita"
    );

    const command = new LinkCommand(range, request, editor);

    command.execute();

    expect(editor.getContent()).toBe("[Visita](https://example.com)");
  });

  it("Modifica link", () => {
    const editor = new MarkdownContentEditor("[Test](https://old.com)");

    // Range deve coprire l'intero link
    const range = new TextRange(0, "[Test](https://old.com)".length);

    const request = new LinkActionRequest(
      LinkOperationType.EDIT_LINK,
      "https://new.com",
      "Nuovo"
    );

    const command = new LinkCommand(range, request, editor);

    command.execute();

    expect(editor.getContent()).toBe("[Nuovo](https://new.com)");
  });

  it("Rimozione link", () => {
    const editor = new MarkdownContentEditor("[Test](https://example.com)");

    const range = new TextRange(0, "[Test](https://example.com)".length);
    const request = new LinkActionRequest(LinkOperationType.REMOVE_LINK);

    const command = new LinkCommand(range, request, editor);

    command.execute();

    expect(editor.getContent()).toBe("Test");
  });

});