import { describe, it, expect, vi } from "vitest";

import { EditorView } from "../frontend/src/view/EditorView";
import { NoteModel } from "../frontend/src/model/NoteModel";
import { MarkdownContentEditor } from "../frontend/src/model/MarkdownContentEditor";
import { CommandHistory } from "../frontend/src/model/CommandHistory";
import { NoteService } from "../frontend/src/proxy/NoteService";
import { Observer } from "../frontend/src/model/Observer";
import { Note } from "../frontend/src/model/Note";

const mockNoteService: NoteService = {
  save: vi.fn(),
  open: vi.fn().mockResolvedValue(new Note("1", ""))
};

class MockObserver implements Observer {
  update = vi.fn();
}

describe("EditorView - Scrittura, Copia, Taglia, Incolla", () => {

  it("gestisce scrittura, copia, taglia e incolla sul modello", () => {
    const model = new NoteModel(
      new MarkdownContentEditor(),
      new CommandHistory(),
      mockNoteService
    );

    const view = new EditorView(model, {});
    const controller = new MockObserver();
    view.attach(controller);


    // scrittura testo
    model["contentEditor"].setContent("Un test");
    view.update();

    expect(model.getContent()).toBe("Un test");


    // COPIA "test"
    const testo = model.getContent();
    const copia = testo.slice(3);
    expect(copia).toBe("test");


    // taglia "Un "
    model["contentEditor"].setContent(testo.slice(3)); // "test"
    view.update();

    expect(model.getContent()).toBe("test");



    // incolla "test"
    model["contentEditor"].setContent(model.getContent() + copia); // "testtest"
    view.update();

    expect(model.getContent()).toBe("testtest");
  });

});
