import { describe, it, expect, vi } from "vitest";

import { EditorView } from "../frontend/src/view/EditorView";
import { NoteModel } from "../frontend/src/model/NoteModel";
import { MarkdownContentEditor } from "../frontend/src/model/MarkdownContentEditor";
import { CommandHistory } from "../frontend/src/model/CommandHistory";
import { NoteService } from "../frontend/src/proxy/NoteService";
import { Observer } from "../frontend/src/model/Observer";
import { Note } from "../frontend/src/model/Note";
import { FormatType } from "../frontend/src/model/FormatType";

const mockNoteService: NoteService = {
  save: vi.fn(),
  open: vi.fn().mockResolvedValue(new Note("1", ""))
};

class MockObserver implements Observer {
  update = vi.fn();
}

describe("Formattazione testo: Barrato", () => {

  it("gestisce correttamente Inserimento, Applicazione e Rimozione del barrato", () => {
    const model = new NoteModel(
      new MarkdownContentEditor(),
      new CommandHistory(),
      mockNoteService
    );

    const view = new EditorView(model, {});
    const controller = new MockObserver();
    view.attach(controller);


    // attivazione barrato
    view.simulateFormatAction(FormatType.STRIKETHROUGH);
    expect(controller.update).toHaveBeenCalledTimes(1);
    expect(view.getLastFormatRequest()).toBeUndefined();


    //applicazzione barrato a testo selezionato
    model["contentEditor"].setContent("Un test");
    view.simulateFormatAction(FormatType.STRIKETHROUGH);
    expect(controller.update).toHaveBeenCalledTimes(2);
    expect(view.getLastFormatRequest()).toBeUndefined();

    // diattivazione barrato
    view.simulateFormatAction(FormatType.STRIKETHROUGH);
    expect(controller.update).toHaveBeenCalledTimes(3);
    expect(view.getLastFormatRequest()).toBeUndefined();


    // rimozione barrato a testo selezionato
    model["contentEditor"].setContent("~~test~~");
    view.simulateFormatAction(FormatType.STRIKETHROUGH);
    expect(controller.update).toHaveBeenCalledTimes(4);
    expect(view.getLastFormatRequest()).toBeUndefined();

  });

});
