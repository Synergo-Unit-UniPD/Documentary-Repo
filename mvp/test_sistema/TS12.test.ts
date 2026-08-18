import { describe, it, expect, vi } from "vitest";

import { EditorView } from "../frontend/src/view/EditorView";
import { NoteModel } from "../frontend/src/model/NoteModel";
import { MarkdownContentEditor } from "../frontend/src/model/MarkdownContentEditor";
import { CommandHistory } from "../frontend/src/model/CommandHistory";
import { NoteService } from "../frontend/src/proxy/NoteService";
import { ViewMode } from "../frontend/src/model/ViewMode";
import { Note } from "../frontend/src/model/Note";

const mockNoteService: NoteService = {
  save: vi.fn(),
  open: vi.fn().mockResolvedValue(new Note("1", ""))
};

describe("TS12 - Visualizzazione: Editor, Render, Split", () => {

  it("Imposta correttamente la modalità EDITOR_ONLY", () => {
    const model = new NoteModel(
      new MarkdownContentEditor(),
      new CommandHistory(),
      mockNoteService
    );

    const view = new EditorView(model, {});
    const spyRender = vi.spyOn(view, "render");

    view.setViewMode(ViewMode.EDITOR_ONLY);

    expect(spyRender).toHaveBeenCalledTimes(1);
    expect(view["viewMode"]).toBe(ViewMode.EDITOR_ONLY);
  });

  it("Imposta correttamente la modalità PREVIEW_ONLY", () => {
    const model = new NoteModel(
      new MarkdownContentEditor(),
      new CommandHistory(),
      mockNoteService
    );

    const view = new EditorView(model, {});
    const spyRender = vi.spyOn(view, "render");

    view.setViewMode(ViewMode.PREVIEW_ONLY);

    expect(spyRender).toHaveBeenCalledTimes(1);
    expect(view["viewMode"]).toBe(ViewMode.PREVIEW_ONLY);
  });

  it("Imposta correttamente la modalità SPLIT", () => {
    const model = new NoteModel(
      new MarkdownContentEditor(),
      new CommandHistory(),
      mockNoteService
    );

    const view = new EditorView(model, {});
    const spyRender = vi.spyOn(view, "render");

    view.setViewMode(ViewMode.SPLIT);

    expect(spyRender).toHaveBeenCalledTimes(1);
    expect(view["viewMode"]).toBe(ViewMode.SPLIT);
  });

});

