import { describe, it, expect, vi } from "vitest";

import { NoteModel } from "../frontend/src/model/NoteModel";
import { MarkdownContentEditor } from "../frontend/src/model/MarkdownContentEditor";
import { CommandHistory } from "../frontend/src/model/CommandHistory";
import { NoteService } from "../frontend/src/proxy/NoteService";
import {
  ExportService,
  ExportFormat,
} from "../frontend/src/proxy/ExportService";

// UC146 (Importazione di una nota locale) e UC147-149 (Esportazione PDF/HTML/JSON)
// sono requisiti obbligatori. Il download/upload del file Markdown grezzo
// (UC145/UC146) condivide lo stesso confine di sistema (NoteService) già
// esercitato in TS23 (creazione/salvataggio/apertura): non viene quindi
// duplicato qui. Questo test si concentra sul percorso distintivo di
// TS24, l'esportazione in un formato diverso dal Markdown nativo (R77-F-O),
// attraverso NoteModel.exportContent() -> ExportService (il confine reale
// verso il backend, mockato come double).

const mockNoteService: NoteService = {
  save: vi.fn(),
  open: vi.fn(),
};

function makeMockExportService(): ExportService {
  return {
    exportNote: vi.fn(async (format: ExportFormat, content: string) => {
      return new Blob([`[${format.toUpperCase()}] ${content}`], {
        type:
          format === "pdf"
            ? "application/pdf"
            : format === "html"
              ? "text/html"
              : "application/json",
      });
    }),
  };
}

describe("TS24 - Esportazione nota (PDF/HTML/JSON)", () => {
  it("esporta il contenuto corrente in formato PDF tramite ExportService", async () => {
    const exportService = makeMockExportService();
    const model = new NoteModel(
      new MarkdownContentEditor("Nota da esportare"),
      new CommandHistory(),
      mockNoteService,
      exportService,
    );

    const blob = await model.exportContent("pdf");

    expect(exportService.exportNote).toHaveBeenCalledWith(
      "pdf",
      "Nota da esportare",
    );
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/pdf");
  });

  it("esporta il contenuto corrente in formato HTML tramite ExportService", async () => {
    const exportService = makeMockExportService();
    const model = new NoteModel(
      new MarkdownContentEditor("# Titolo\n\nParagrafo."),
      new CommandHistory(),
      mockNoteService,
      exportService,
    );

    const blob = await model.exportContent("html");

    expect(exportService.exportNote).toHaveBeenCalledWith(
      "html",
      "# Titolo\n\nParagrafo.",
    );
    expect(blob.type).toBe("text/html");
  });

  it("esporta il contenuto corrente in formato JSON tramite ExportService", async () => {
    const exportService = makeMockExportService();
    const model = new NoteModel(
      new MarkdownContentEditor("Contenuto strutturato"),
      new CommandHistory(),
      mockNoteService,
      exportService,
    );

    const blob = await model.exportContent("json");

    expect(exportService.exportNote).toHaveBeenCalledWith(
      "json",
      "Contenuto strutturato",
    );
    expect(blob.type).toBe("application/json");
  });

  it("segnala un errore esplicito se l'esportazione viene richiesta senza ExportService configurato", async () => {
    const model = new NoteModel(
      new MarkdownContentEditor("Nota senza servizio di export"),
      new CommandHistory(),
      mockNoteService,
      // ExportService omesso volutamente
    );

    await expect(model.exportContent("pdf")).rejects.toThrow(
      "Servizio di esportazione non configurato",
    );
  });
});
