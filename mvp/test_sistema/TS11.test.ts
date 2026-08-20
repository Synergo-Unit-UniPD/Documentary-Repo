import { describe, it, expect, vi } from "vitest";

import { EditorView } from "../frontend/src/view/EditorView";
import { NoteModel } from "../frontend/src/model/NoteModel";
import { MarkdownContentEditor } from "../frontend/src/model/MarkdownContentEditor";
import { CommandHistory } from "../frontend/src/model/CommandHistory";
import { NoteService } from "../frontend/src/proxy/NoteService";
import { Observer } from "../frontend/src/model/Observer";
import { FormatType } from "../frontend/src/model/FormatType";
import { FormatTextCommand } from "../frontend/src/model/FormatTextCommand";
import { TextRange } from "../frontend/src/model/TextRange";
import { Note } from "../frontend/src/model/Note";

const mockNoteService: NoteService = {
  save: vi.fn(),
  open: vi.fn().mockResolvedValue(new Note("1", ""))
};

class MockObserver implements Observer {
  update = vi.fn();
}

describe("TS11 - Gestione Modifiche: Undo e Redo", () => {
  it("Undo e Redo ripristina l'ultima modifica annullata", () => {
    const model = new NoteModel(
      new MarkdownContentEditor("Test"),
      new CommandHistory(),
      mockNoteService
    );

    const view = new EditorView(model, {});
    const controller = new MockObserver();
    view.attach(controller);

    const cmd = new FormatTextCommand(
      new TextRange(0, 4),
      FormatType.BOLD,
      model.getContentEditor()
    );

    model.executeCommand(cmd);
    expect(model.getContent()).toBe("**Test**");

    // Undo
    model.undo();
    expect(model.getContent()).toBe("Test");

    // Redo
    view.simulateAction("redo");
    model.redo();

    expect(model.getContent()).toBe("**Test**");
  });

});