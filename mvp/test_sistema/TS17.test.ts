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
const HAT_WHITE = "white";

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

describe("Richiesta analisi secondo il cappello bianco", () => {
  it("acquisisce la richiesta dell'utente e avvia l'elaborazione (stato Processing)", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    expect(model.getAIState()).toBeInstanceOf(IdleState);

    void model.requestAIOperation(HAT_ANALYSIS, "testo selezionato", {
      hat_type: HAT_WHITE,
    });

    expect(model.getAIState()).toBeInstanceOf(ProcessingState);
  });
});

describe("Generazione analisi secondo il cappello bianco", () => {
  it("inoltra al servizio LLM la richiesta con hat_type 'white'", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    void model.requestAIOperation(HAT_ANALYSIS, "testo selezionato", {
      hat_type: HAT_WHITE,
    });

    expect(aiService.requestOperation).toHaveBeenCalledTimes(1);
    expect(aiService.requestOperation).toHaveBeenCalledWith(
      HAT_ANALYSIS,
      "testo selezionato",
      {
        hat_type: HAT_WHITE,
      },
    );
  });
});

describe("Visualizzazione elaborazione analisi secondo il cappello bianco", () => {
  it("notifica gli observer e mantiene lo stato Processing mentre la richiesta è in corso", async () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    const requestPromise = model.requestAIOperation(HAT_ANALYSIS, "testo", {
      hat_type: HAT_WHITE,
    });

    expect(observer.update).toHaveBeenCalledTimes(1);
    expect(model.getAIState()).toBeInstanceOf(ProcessingState);

    deferred.resolve(new Proposal("analisi cappello bianco", HAT_ANALYSIS));
    await requestPromise;
  });
});

describe("Interruzione elaborazione analisi secondo il cappello bianco", () => {
  it("torna allo stato Idle quando l'utente interrompe l'elaborazione", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    void model.requestAIOperation(HAT_ANALYSIS, "testo", {
      hat_type: HAT_WHITE,
    });
    expect(model.getAIState()).toBeInstanceOf(ProcessingState);

    model.interruptAIOperation();

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });

  it("ignora una risposta tardiva arrivata dopo l'interruzione (contenuto della nota invariato)", async () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    const requestPromise = model.requestAIOperation(HAT_ANALYSIS, "testo", {
      hat_type: HAT_WHITE,
    });

    model.interruptAIOperation();
    expect(model.getAIState()).toBeInstanceOf(IdleState);

    deferred.resolve(new Proposal("analisi tardiva", HAT_ANALYSIS));
    await requestPromise;

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});

describe(" Visualizzazione proposta analisi secondo il cappello bianco", () => {
  it("porta lo stato a ProposalReady con la proposta restituita dall'LLM", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal(
      "Analisi oggettiva del testo, basata su fatti e dati.",
      HAT_ANALYSIS,
    );
    (aiService.requestOperation as any).mockResolvedValue(proposal);

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    await model.requestAIOperation(HAT_ANALYSIS, "testo", {
      hat_type: HAT_WHITE,
    });

    const state = model.getAIState();
    expect(state).toBeInstanceOf(ProposalReadyState);
    expect((state as ProposalReadyState).proposal).toBe(proposal);
    expect((state as ProposalReadyState).proposal.content).toBe(
      "Analisi oggettiva del testo, basata su fatti e dati.",
    );
    expect(observer.update).toHaveBeenCalledTimes(2);
  });
});

describe(" Accettazione proposta analisi secondo il cappello bianco", () => {
  it("sostituisce il testo selezionato con l'analisi proposta tramite AIController", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal("ANALISI_CAPPELLO_BIANCO", HAT_ANALYSIS);
    (aiService.requestOperation as any).mockResolvedValue(proposal);

    // "testo originale" occupa gli indici [12, 27) in "Questo è il testo originale"
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
      params: { hat_type: HAT_WHITE },
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

    expect(noteModel.getContent()).toBe("Questo è il ANALISI_CAPPELLO_BIANCO");
    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});

describe(" Rifiuto proposta analisi secondo il cappello bianco", () => {
  it("elimina la proposta visualizzata e torna allo stato Idle senza alterare la nota", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal("analisi cappello bianco", HAT_ANALYSIS);
    (aiService.requestOperation as any).mockResolvedValue(proposal);

    const model = new AIRequestModel(aiService);
    await model.requestAIOperation(HAT_ANALYSIS, "testo", {
      hat_type: HAT_WHITE,
    });
    expect(model.getAIState()).toBeInstanceOf(ProposalReadyState);

    model.rejectProposal();

    const state = model.getAIState();
    expect(state).toBeInstanceOf(IdleState);
    expect(state).not.toBeInstanceOf(ProposalReadyState);
  });
});

describe(" Rigenerazione proposta analisi secondo il cappello bianco", () => {
  it("elimina la proposta corrente e acquisisce una nuova richiesta mantenendo il testo selezionato", async () => {
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
      params: { hat_type: HAT_WHITE },
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
        hat_type: HAT_WHITE,
      },
    );
    expect((model.getAIState() as ProposalReadyState).proposal).toBe(second);

    expect(noteModel.getContent()).toBe("Questo è il testo originale");
  });
});

describe(" Visualizzazione errore generazione analisi secondo il cappello bianco", () => {
  it("porta lo stato a Error quando il servizio LLM restituisce un errore", async () => {
    const aiService = makeMockAIService();
    (aiService.requestOperation as any).mockRejectedValue(
      new Error("Servizio LLM non disponibile"),
    );

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    await model.requestAIOperation(HAT_ANALYSIS, "testo", {
      hat_type: HAT_WHITE,
    });

    const state = model.getAIState();
    expect(state).toBeInstanceOf(ErrorState);
    expect((state as ErrorState).message).toBe("Servizio LLM non disponibile");
    expect(observer.update).toHaveBeenCalledTimes(2);
  });

  it("ignora un errore tardivo se la richiesta è già stata interrotta", async () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    const requestPromise = model.requestAIOperation(HAT_ANALYSIS, "testo", {
      hat_type: HAT_WHITE,
    });

    model.interruptAIOperation();
    deferred.reject(new Error("Timeout"));

    await requestPromise;

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});
