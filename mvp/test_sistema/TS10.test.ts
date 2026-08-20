import { describe, it, expect } from "vitest";

import { TableCommand } from "../frontend/src/model/TableCommand";
import { MarkdownContentEditor } from "../frontend/src/model/MarkdownContentEditor";
import { TextRange } from "../frontend/src/model/TextRange";
import { TableActionRequest } from "../frontend/src/model/TableActionRequest";
import { TableOperationType } from "../frontend/src/model/TableOperationType";
import { InvalidTableDimensionError } from "../frontend/src/model/InvalidTableDimensionError";

describe("TS10 - Gestione Tabelle", () => {

  it("Inserimento tabella", () => {
    const editor = new MarkdownContentEditor("");

    const request = new TableActionRequest(TableOperationType.CREATE_TABLE, 2, 2);
    const command = new TableCommand(request, editor);

    command.execute();

    expect(editor.getContent()).toBe(
      "| Colonna 1 | Colonna 2 |\n" +
      "| --- | --- |\n" +
      "|  |  |\n" +
      "|  |  |\n"
    );
  });

  it("Errore numero righe tabella", () => {
    const editor = new MarkdownContentEditor("");

    const request = new TableActionRequest(TableOperationType.CREATE_TABLE, 0, 2);
    const command = new TableCommand(request, editor);

    expect(() => command.execute()).toThrow(InvalidTableDimensionError);
  });

  it("Errore numero colonne tabella", () => {
    const editor = new MarkdownContentEditor("");

    const request = new TableActionRequest(TableOperationType.CREATE_TABLE, 2, 0);
    const command = new TableCommand(request, editor);

    expect(() => command.execute()).toThrow(InvalidTableDimensionError);
  });

  it("Modifica contenuto cella tabella", () => {
    const editor = new MarkdownContentEditor(
      "| Colonna 1 | Colonna 2 |\n" +
      "| --- | --- |\n" +
      "|  |  |\n"
    );

    const request = new TableActionRequest(
      TableOperationType.EDIT_CELL,
      undefined,
      undefined,
      0, // rowIndex (prima riga dati)
      1, // colIndex
      "Hello"
    );

    const command = new TableCommand(request, editor);

    command.execute();

    expect(editor.getContent()).toBe(
      "| Colonna 1 | Colonna 2 |\n" +
      "| --- | --- |\n" +
      "|  | Hello |\n"
    );
  });

  it("Inserimento riga tabella", () => {
    const editor = new MarkdownContentEditor(
      "| Colonna 1 | Colonna 2 |\n" +
      "| --- | --- |\n" +
      "| A | B |\n"
    );

    const request = new TableActionRequest(TableOperationType.INSERT_ROW);
    const command = new TableCommand(request, editor);

    command.execute();

    expect(editor.getContent()).toBe(
      "| Colonna 1 | Colonna 2 |\n" +
      "| --- | --- |\n" +
      "| A | B |\n" +
      "|  |  |\n"
    );
  });

  it("Eliminazione riga tabella", () => {
    const editor = new MarkdownContentEditor(
      "| Colonna 1 | Colonna 2 |\n" +
      "| --- | --- |\n" +
      "| A | B |\n" +
      "| C | D |\n"
    );

    const request = new TableActionRequest(TableOperationType.DELETE_ROW, undefined, undefined, 0);
    const command = new TableCommand(request, editor);

    command.execute();

    expect(editor.getContent()).toBe(
      "| Colonna 1 | Colonna 2 |\n" +
      "| --- | --- |\n" +
      "| C | D |\n"
    );
  });

  it("Inserimento colonna tabella", () => {
    const editor = new MarkdownContentEditor(
      "| Colonna 1 | Colonna 2 |\n" +
      "| --- | --- |\n" +
      "| A | B |\n"
    );

    const request = new TableActionRequest(TableOperationType.INSERT_COLUMN);
    const command = new TableCommand(request, editor);

    command.execute();

    expect(editor.getContent()).toBe(
      "| Colonna 1 | Colonna 2 | Colonna 3 |\n" +
      "| --- | --- | --- |\n" +
      "| A | B |  |\n"
    );
  });

  it("Eliminazione colonna tabella", () => {
    const editor = new MarkdownContentEditor(
      "| Colonna 1 | Colonna 2 | Colonna 3 |\n" +
      "| --- | --- | --- |\n" +
      "| A | B | C |\n"
    );

    const request = new TableActionRequest(TableOperationType.DELETE_COLUMN, undefined, undefined, undefined, 1);
    const command = new TableCommand(request, editor);

    command.execute();

    expect(editor.getContent()).toBe(
      "| Colonna 1 | Colonna 3 |\n" +
      "| --- | --- |\n" +
      "| A | C |\n"
    );
  });

  it("Eliminazione tabella", () => {
    const editor = new MarkdownContentEditor(
      "| Colonna 1 | Colonna 2 |\n" +
      "| --- | --- |\n" +
      "| A | B |\n"
    );

    const request = new TableActionRequest(TableOperationType.DELETE_TABLE);
    const command = new TableCommand(request, editor);

    command.execute();

    expect(editor.getContent()).toBe("\n");
  });

});
