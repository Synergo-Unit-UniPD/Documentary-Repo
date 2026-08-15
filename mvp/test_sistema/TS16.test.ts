import { describe, it, expect, vi } from "vitest";

import { AIController } from "../frontend/src/controller/AIController";
import { AIPanelView } from "../frontend/src/view/AIPanelView";
import { NoteModel } from "../frontend/src/model/NoteModel";
import { Note } from "../frontend/src/model/Note";
import { NoteService } from "../frontend/src/proxy/NoteService";
import { CommandHistory } from "../frontend/src/model/CommandHistory";
import { MarkdownContentEditor } from "../frontend/src/model/MarkdownContentEditor";
import { ProposalActionType } from "../frontend/src/model/ProposalActionType";
import { AIRequestModel } from "../frontend/src/model/AIRequestModel";
import { IdleState } from "../frontend/src/model/IdleState";
import { ProcessingState } from "../frontend/src/model/ProcessingState";
import { ProposalReadyState } from "../frontend/src/model/ProposalReadyState";
import { ErrorState } from "../frontend/src/model/ErrorState";
import { Proposal } from "../frontend/src/model/Proposal";
import { AIService } from "../frontend/src/proxy/AIService";
import { TextRange } from "../frontend/src/model/TextRange";

const DISTANT_WRITING = "distant_writing";

const mockNoteService: NoteService = {
  save: vi.fn(),
  open: vi.fn().mockResolvedValue(new Note("1", ""))
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeMockAIService(): AIService {
  return {
    requestOperation: vi.fn(),
    listOperations: vi.fn().mockResolvedValue(["summarize", "translate", "rewrite", DISTANT_WRITING]),
  };
}

function makeMockAIView(): AIPanelView {
  return {
    attach: vi.fn(),
    getLastRequestedOperation: vi.fn(),
    getLastProposalAction: vi.fn()
  } as unknown as AIPanelView;
}


describe("Richiesta Distant Writing", () => {
  it("acquisisce la richiesta dell'utente e avvia l'elaborazione", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);

    expect(model.getAIState()).toBeInstanceOf(IdleState);

    void model.requestAIOperation(DISTANT_WRITING, "prompt utente", {});

    expect(model.getAIState()).toBeInstanceOf(ProcessingState);
  });
});

describe("Generazione Distant Writing", () => {
  it("inoltra al servizio LLM la richiesta con i parametri corretti", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);

    void model.requestAIOperation(DISTANT_WRITING, "prompt utente", {});

    expect(aiService.requestOperation).toHaveBeenCalledTimes(1);
    expect(aiService.requestOperation).toHaveBeenCalledWith(DISTANT_WRITING, "prompt utente", {});
  });
});

describe("Visualizzazione elaborazione Distant Writing", () => {
  it("notifica gli observer e mantiene lo stato Processing", async () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    const requestPromise = model.requestAIOperation(DISTANT_WRITING, "prompt", {});

    expect(observer.update).toHaveBeenCalledTimes(1);
    expect(model.getAIState()).toBeInstanceOf(ProcessingState);

    deferred.resolve(new Proposal("testo generato", DISTANT_WRITING));
    await requestPromise;
  });
});

describe("Interruzione elaborazione Distant Writing", () => {
  it("torna allo stato Idle quando l'utente interrompe", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);

    void model.requestAIOperation(DISTANT_WRITING, "prompt", {});
    expect(model.getAIState()).toBeInstanceOf(ProcessingState);

    model.interruptAIOperation();

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });

  it("ignora una risposta tardiva arrivata dopo l'interruzione", async () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    const requestPromise = model.requestAIOperation(DISTANT_WRITING, "prompt", {});

    model.interruptAIOperation();
    expect(model.getAIState()).toBeInstanceOf(IdleState);

    deferred.resolve(new Proposal("tardivo", DISTANT_WRITING));
    await requestPromise;

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});

describe("Visualizzazione proposta Distant Writing", () => {
  it("porta lo stato a ProposalReady con la proposta generata", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal("testo generato", DISTANT_WRITING);
    (aiService.requestOperation as any).mockResolvedValue(proposal);

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    await model.requestAIOperation(DISTANT_WRITING, "prompt", {});

    const state = model.getAIState();
    expect(state).toBeInstanceOf(ProposalReadyState);
    expect((state as ProposalReadyState).proposal).toBe(proposal);
    expect(observer.update).toHaveBeenCalledTimes(2);
  });
});

describe("Accettazione proposta Distant Writing", () => {
  it("inserisce il testo generato nella posizione corrente del cursore (non necessariamente a fine nota)", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal("TESTO_GENERATO", DISTANT_WRITING);
    (aiService.requestOperation as any).mockResolvedValue(proposal);
 
    const noteModel = new NoteModel(
      new MarkdownContentEditor("Contenuto iniziale."),
      new CommandHistory(),
      mockNoteService
    );
 
    const aiView = makeMockAIView();
    const model = new AIRequestModel(aiService);
    const controller = new AIController(model, aiView, noteModel);
 
    const cursorPosition = 10; // dopo "Contenuto "
    const cursorRange = new TextRange(cursorPosition, cursorPosition); // range collassato = cursore, nessuna selezione
 
    aiView.getLastRequestedOperation = vi.fn().mockReturnValue({
      type: DISTANT_WRITING,
      text: "prompt utente",
      params: {},
      range: cursorRange
    });
 
    controller.update();
    await Promise.resolve();
 
    aiView.getLastRequestedOperation = vi.fn().mockReturnValue(undefined);
    aiView.getLastProposalAction = vi.fn().mockReturnValue(ProposalActionType.ACCEPT);
 
    controller.update();
 
    expect(noteModel.getContent()).toBe("Contenuto TESTO_GENERATOiniziale.");
    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
 
  it("rete di sicurezza: se non è noto alcun range, inserisce il testo in coda al documento", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal("TESTO_GENERATO", DISTANT_WRITING);
    (aiService.requestOperation as any).mockResolvedValue(proposal);
 
    const noteModel = new NoteModel(
      new MarkdownContentEditor("Contenuto iniziale."),
      new CommandHistory(),
      mockNoteService
    );
 
    const aiView = makeMockAIView();
    const model = new AIRequestModel(aiService);
    const controller = new AIController(model, aiView, noteModel);
 
    aiView.getLastRequestedOperation = vi.fn().mockReturnValue({
      type: DISTANT_WRITING,
      text: "prompt utente",
      params: {},
      range: undefined
    });
 
    controller.update();
    await Promise.resolve();
 
    aiView.getLastRequestedOperation = vi.fn().mockReturnValue(undefined);
    aiView.getLastProposalAction = vi.fn().mockReturnValue(ProposalActionType.ACCEPT);
 
    controller.update();
 
    expect(noteModel.getContent()).toBe("Contenuto iniziale.TESTO_GENERATO");
    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});

describe("Rifiuto proposta Distant Writing", () => {
  it("elimina la proposta e torna allo stato Idle senza alterare la nota", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal("testo generato", DISTANT_WRITING);
    (aiService.requestOperation as any).mockResolvedValue(proposal);

    const model = new AIRequestModel(aiService);

    await model.requestAIOperation(DISTANT_WRITING, "prompt", {});
    expect(model.getAIState()).toBeInstanceOf(ProposalReadyState);

    model.rejectProposal();

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});

describe("Rigenerazione proposta Distant Writing", () => {
  it("ripete automaticamente la stessa richiesta (stesso prompt) tramite AIController", async () => {
    const aiService = makeMockAIService();
    const first = new Proposal("prima generazione", DISTANT_WRITING);
    const second = new Proposal("seconda generazione", DISTANT_WRITING);
    (aiService.requestOperation as any)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);

    const noteModel = new NoteModel(
      new MarkdownContentEditor(""),
      new CommandHistory(),
      mockNoteService
    );
    const aiView = makeMockAIView();
    const model = new AIRequestModel(aiService);
    const controller = new AIController(model, aiView, noteModel);

    const originalPrompt = "scrivi una conclusione";
    aiView.getLastRequestedOperation = vi.fn().mockReturnValue({
      type: DISTANT_WRITING,
      text: originalPrompt,
      params: {},
      range: undefined
    });
    controller.update();
    await Promise.resolve();
    expect((model.getAIState() as ProposalReadyState).proposal).toBe(first);

    aiView.getLastRequestedOperation = vi.fn().mockReturnValue(undefined);
    aiView.getLastProposalAction = vi.fn().mockReturnValue(ProposalActionType.REGENERATE);
    controller.update();
    await Promise.resolve();

    expect(aiService.requestOperation).toHaveBeenCalledTimes(2);
    expect(aiService.requestOperation).toHaveBeenNthCalledWith(2, DISTANT_WRITING, originalPrompt, {});
    expect((model.getAIState() as ProposalReadyState).proposal).toBe(second);
  });
});

describe("Visualizzazione errore generazione Distant Writing", () => {
  it("porta lo stato a Error quando il servizio LLM fallisce", async () => {
    const aiService = makeMockAIService();
    (aiService.requestOperation as any).mockRejectedValue(new Error("Errore LLM"));

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    await model.requestAIOperation(DISTANT_WRITING, "prompt", {});

    const state = model.getAIState();
    expect(state).toBeInstanceOf(ErrorState);
    expect((state as ErrorState).message).toBe("Errore LLM");
    expect(observer.update).toHaveBeenCalledTimes(2);
  });

  it("ignora errori tardivi arrivati dopo l'interruzione", async () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    const requestPromise = model.requestAIOperation(DISTANT_WRITING, "prompt", {});

    model.interruptAIOperation();
    deferred.reject(new Error("Timeout"));

    await requestPromise;

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});