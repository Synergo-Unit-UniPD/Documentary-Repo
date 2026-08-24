import { describe, it, expect, vi } from "vitest";

import { NoteModel } from "../frontend/src/model/NoteModel";
import { MarkdownContentEditor } from "../frontend/src/model/MarkdownContentEditor";
import { CommandHistory } from "../frontend/src/model/CommandHistory";
import { EditorView } from "../frontend/src/view/EditorView";
import { EditorController } from "../frontend/src/controller/EditorController";
import { NoteService } from "../frontend/src/proxy/NoteService";
import { Note } from "../frontend/src/model/Note";

// UC143 (Creazione di una nota) e UC145 (Salvataggio della nota in formato
// Markdown) sono requisiti obbligatori. UC144 (Eliminazione di una nota) è
// invece esplicitamente Opzionale nell'Analisi dei Requisiti e non è ancora
// implementato: non viene quindi esercitato in questo Test di Sistema.

// Flush di tutti i microtask pendenti (le catene await interne a
// NoteModel.save()/openNote() vengono innescate da EditorController in modo
// "fire and forget" dentro update(), che è sincrono per contratto Observer):
// un macrotask garantisce che siano stati tutti risolti prima delle asserzioni.
function flushAsync(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("TS23 - Persistenza: creazione e salvataggio nota", () => {
  it("crea una nuova nota (nessun id) e la salva tramite NoteService", async () => {
    const mockNoteService: NoteService = {
      save: vi.fn().mockResolvedValue("id-generato-dal-backend"),
      open: vi.fn(),
    };

    const model = new NoteModel(
      new MarkdownContentEditor("Prima nota creata dall'utente"),
      new CommandHistory(),
      mockNoteService,
    );
    const view = new EditorView(model, {});
    new EditorController(model, view);

    expect(model.getIsDirty()).toBe(false);

    view.simulateAction("save");
    await flushAsync();

    expect(mockNoteService.save).toHaveBeenCalledTimes(1);
    const savedNote = (mockNoteService.save as any).mock.calls[0][0] as Note;
    // Nessun id noto in precedenza: la nota viene creata con id vuoto (NoteVuota),
    // così come previsto per il primo salvataggio (Step 9/10 del diagramma di sequenza).
    expect(savedNote.id).toBe("");
    expect(savedNote.content).toBe("Prima nota creata dall'utente");
    expect(model.getIsDirty()).toBe(false);
  });

  it("un salvataggio successivo riusa l'id restituito dal primo salvataggio", async () => {
    const mockNoteService: NoteService = {
      save: vi.fn().mockResolvedValue("nota-123"),
      open: vi.fn(),
    };

    const model = new NoteModel(
      new MarkdownContentEditor("Contenuto iniziale"),
      new CommandHistory(),
      mockNoteService,
    );
    const view = new EditorView(model, {});
    new EditorController(model, view);

    view.simulateAction("save");
    await flushAsync();

    model.getContentEditor().setContent("Contenuto modificato");
    model.markDirtyAndNotify();
    expect(model.getIsDirty()).toBe(true);

    view.simulateAction("save");
    await flushAsync();

    expect(mockNoteService.save).toHaveBeenCalledTimes(2);
    const secondSave = (mockNoteService.save as any).mock.calls[1][0] as Note;
    expect(secondSave.id).toBe("nota-123");
    expect(secondSave.content).toBe("Contenuto modificato");
    expect(model.getIsDirty()).toBe(false);
  });

  it("apre una nota Markdown esistente e ne carica contenuto e id, azzerando la cronologia", async () => {
    const mockNoteService: NoteService = {
      save: vi.fn(),
      open: vi
        .fn()
        .mockResolvedValue(
          new Note("nota-remota-7", "Contenuto caricato da file .md"),
        ),
    };

    const model = new NoteModel(
      new MarkdownContentEditor("Contenuto locale non ancora salvato"),
      new CommandHistory(),
      mockNoteService,
    );
    const view = new EditorView(model, {});
    new EditorController(model, view);

    view.simulateAction("open");
    await flushAsync();

    expect(mockNoteService.open).toHaveBeenCalledTimes(1);
    expect(model.getContent()).toBe("Contenuto caricato da file .md");
    expect(model.canUndo()).toBe(false);
    expect(model.getIsDirty()).toBe(false);
  });
});
