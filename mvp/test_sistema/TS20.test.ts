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

const HAT_ANALYSIS = "hat_analysis";
const HAT_YELLOW = "yellow";

const mockNoteService: NoteService = {
  save: vi.fn(),
  open: vi.fn().mockResolvedValue(new Note("1", "")),
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
    listOperations: vi
      .fn()
      .mockResolvedValue([
        "summarize",
        "translate",
        "rewrite",
        "distant_writing",
        HAT_ANALYSIS,
      ]),
  };
}

function makeMockAIView(): AIPanelView {
  return {
    attach: vi.fn(),
    getLastRequestedOperation: vi.fn(),
    getLastProposalAction: vi.fn(),
  } as unknown as AIPanelView;
}

describe("Richiesta analisi secondo il cappello giallo", () => {
  it("acquisisce la richiesta e avvia l'elaborazione", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);

    expect(model.getAIState()).toBeInstanceOf(IdleState);

    void model.requestAIOperation(HAT_ANALYSIS, "testo selezionato", {
      hat_type: HAT_YELLOW,
    });

    expect(model.getAIState()).toBeInstanceOf(ProcessingState);
  });
});

describe("Generazione analisi secondo il cappello giallo", () => {
  it("inoltra la richiesta con hat_type 'yellow'", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);

    void model.requestAIOperation(HAT_ANALYSIS, "testo selezionato", {
      hat_type: HAT_YELLOW,
    });

    expect(aiService.requestOperation).toHaveBeenCalledTimes(1);
    expect(aiService.requestOperation).toHaveBeenCalledWith(
      HAT_ANALYSIS,
      "testo selezionato",
      {
        hat_type: HAT_YELLOW,
      },
    );
  });
});

describe("Visualizzazione elaborazione analisi secondo il cappello giallo", () => {
  it("notifica gli observer e mantiene lo stato Processing", async () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    const requestPromise = model.requestAIOperation(HAT_ANALYSIS, "testo", {
      hat_type: HAT_YELLOW,
    });

    expect(observer.update).toHaveBeenCalledTimes(1);
    expect(model.getAIState()).toBeInstanceOf(ProcessingState);

    deferred.resolve(new Proposal("analisi cappello giallo", HAT_ANALYSIS));
    await requestPromise;
  });
});

describe("Interruzione elaborazione analisi secondo il cappello giallo", () => {
  it("torna allo stato Idle quando l'utente interrompe", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);

    void model.requestAIOperation(HAT_ANALYSIS, "testo", {
      hat_type: HAT_YELLOW,
    });
    expect(model.getAIState()).toBeInstanceOf(ProcessingState);

    model.interruptAIOperation();

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });

  it("ignora una risposta tardiva dopo l'interruzione", async () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    const requestPromise = model.requestAIOperation(HAT_ANALYSIS, "testo", {
      hat_type: HAT_YELLOW,
    });

    model.interruptAIOperation();
    expect(model.getAIState()).toBeInstanceOf(IdleState);

    deferred.resolve(new Proposal("analisi tardiva", HAT_ANALYSIS));
    await requestPromise;

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});

describe("Visualizzazione proposta analisi secondo il cappello giallo", () => {
  it("porta lo stato a ProposalReady con la proposta generata", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal(
      "Analisi dei vantaggi e opportunità.",
      HAT_ANALYSIS,
    );
    (aiService.requestOperation as any).mockResolvedValue(proposal);

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    await model.requestAIOperation(HAT_ANALYSIS, "testo", {
      hat_type: HAT_YELLOW,
    });

    const state = model.getAIState();
    expect(state).toBeInstanceOf(ProposalReadyState);
    expect((state as ProposalReadyState).proposal).toBe(proposal);
    expect((state as ProposalReadyState).proposal.content).toBe(
      "Analisi dei vantaggi e opportunità.",
    );
    expect(observer.update).toHaveBeenCalledTimes(2);
  });
});

describe("Accettazione proposta analisi secondo il cappello giallo", () => {
  it("sostituisce il testo selezionato con l'analisi proposta", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal("ANALISI_CAPPELLO_GIALLO", HAT_ANALYSIS);
    (aiService.requestOperation as any).mockResolvedValue(proposal);

    const noteModel = new NoteModel(
      new MarkdownContentEditor("Questo è il testo originale"),
      new CommandHistory(),
      mockNoteService,
    );

    const aiView = makeMockAIView();
    const model = new AIRequestModel(aiService);
    const controller = new AIController(model, aiView, noteModel);

    const selectionRange = new TextRange(12, 27);

    aiView.getLastRequestedOperation = vi.fn().mockReturnValue({
      type: HAT_ANALYSIS,
      text: undefined,
      params: { hat_type: HAT_YELLOW },
      range: selectionRange,
    });

    // Vedi nota in TS13: la soglia minima di ~2s di ProcessingState (R2-P-O)
    // richiede di avanzare i fake timer, non un semplice microtask flush.
    vi.useFakeTimers();
    controller.update();
    await vi.advanceTimersByTimeAsync(2100);
    vi.useRealTimers();

    aiView.getLastRequestedOperation = vi.fn().mockReturnValue(undefined);
    aiView.getLastProposalAction = vi
      .fn()
      .mockReturnValue(ProposalActionType.ACCEPT);

    controller.update();

    expect(noteModel.getContent()).toBe("Questo è il ANALISI_CAPPELLO_GIALLO");
    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});

describe("Rifiuto proposta analisi secondo il cappello giallo", () => {
  it("torna allo stato Idle senza alterare la nota", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal("analisi cappello giallo", HAT_ANALYSIS);
    (aiService.requestOperation as any).mockResolvedValue(proposal);

    const model = new AIRequestModel(aiService);

    await model.requestAIOperation(HAT_ANALYSIS, "testo", {
      hat_type: HAT_YELLOW,
    });
    expect(model.getAIState()).toBeInstanceOf(ProposalReadyState);

    model.rejectProposal();

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});

describe("Rigenerazione proposta analisi secondo il cappello giallo", () => {
  it("ripete la richiesta mantenendo il testo selezionato", async () => {
    const aiService = makeMockAIService();
    const first = new Proposal("prima analisi", HAT_ANALYSIS);
    const second = new Proposal("seconda analisi", HAT_ANALYSIS);

    (aiService.requestOperation as any)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);

    const noteModel = new NoteModel(
      new MarkdownContentEditor("Questo è il testo originale"),
      new CommandHistory(),
      mockNoteService,
    );

    const aiView = makeMockAIView();
    const model = new AIRequestModel(aiService);
    const controller = new AIController(model, aiView, noteModel);

    const selectionRange = new TextRange(12, 27);
    const selectedText = "testo originale";

    aiView.getLastRequestedOperation = vi.fn().mockReturnValue({
      type: HAT_ANALYSIS,
      text: selectedText,
      params: { hat_type: HAT_YELLOW },
      range: selectionRange,
    });

    // Vedi nota in TS13: ogni richiesta AI (anche quella di rigenerazione)
    // attraversa ~2s reali di ProcessingState (R2-P-O) prima di ProposalReady.
    vi.useFakeTimers();
    controller.update();
    await vi.advanceTimersByTimeAsync(2100);

    expect((model.getAIState() as ProposalReadyState).proposal).toBe(first);

    aiView.getLastRequestedOperation = vi.fn().mockReturnValue(undefined);
    aiView.getLastProposalAction = vi
      .fn()
      .mockReturnValue(ProposalActionType.REGENERATE);

    controller.update();
    await vi.advanceTimersByTimeAsync(2100);
    vi.useRealTimers();

    expect(aiService.requestOperation).toHaveBeenCalledTimes(2);
    expect(aiService.requestOperation).toHaveBeenNthCalledWith(
      2,
      HAT_ANALYSIS,
      selectedText,
      {
        hat_type: HAT_YELLOW,
      },
    );

    expect((model.getAIState() as ProposalReadyState).proposal).toBe(second);
    expect(noteModel.getContent()).toBe("Questo è il testo originale");
  });
});

describe("Errore generazione analisi secondo il cappello giallo", () => {
  it("porta lo stato a Error quando il servizio LLM fallisce", async () => {
    const aiService = makeMockAIService();
    (aiService.requestOperation as any).mockRejectedValue(
      new Error("Errore LLM"),
    );

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    await model.requestAIOperation(HAT_ANALYSIS, "testo", {
      hat_type: HAT_YELLOW,
    });

    const state = model.getAIState();
    expect(state).toBeInstanceOf(ErrorState);
    expect((state as ErrorState).message).toBe("Errore LLM");
    expect(observer.update).toHaveBeenCalledTimes(2);
  });

  it("ignora errori tardivi dopo interruzione", async () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    const requestPromise = model.requestAIOperation(HAT_ANALYSIS, "testo", {
      hat_type: HAT_YELLOW,
    });

    model.interruptAIOperation();
    deferred.reject(new Error("Timeout"));

    await requestPromise;

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});
