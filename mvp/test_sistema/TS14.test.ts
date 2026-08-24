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
      .mockResolvedValue(["summarize", "translate", "rewrite"]),
  };
}

describe("Richiesta traduzione", () => {
  it("acquisisce la richiesta dell'utente e avvia l'elaborazione (stato Processing)", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    expect(model.getAIState()).toBeInstanceOf(IdleState);

    void model.requestAIOperation("translate", "testo selezionato", {});

    expect(model.getAIState()).toBeInstanceOf(ProcessingState);
  });
});

describe("Generazione traduzione", () => {
  it("inoltra al servizio LLM la richiesta di traduzione con i parametri corretti", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    void model.requestAIOperation("translate", "testo selezionato", {});

    expect(aiService.requestOperation).toHaveBeenCalledTimes(1);
    expect(aiService.requestOperation).toHaveBeenCalledWith(
      "translate",
      "testo selezionato",
      {},
    );
  });
});

describe("Visualizzazione elaborazione traduzione", () => {
  it("notifica gli observer e mantiene lo stato Processing mentre la richiesta è in corso", async () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    const requestPromise = model.requestAIOperation("translate", "testo", {});

    expect(observer.update).toHaveBeenCalledTimes(1);
    expect(model.getAIState()).toBeInstanceOf(ProcessingState);

    deferred.resolve(new Proposal("traduzione", "translate"));
    await requestPromise;
  });
});

describe("Interruzione elaborazione traduzione", () => {
  it("torna allo stato Idle quando l'utente interrompe l'elaborazione", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    void model.requestAIOperation("translate", "testo", {});
    expect(model.getAIState()).toBeInstanceOf(ProcessingState);

    model.interruptAIOperation();

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });

  it("ignora una risposta tardiva della richiesta interrotta", async () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    const requestPromise = model.requestAIOperation("translate", "testo", {});

    model.interruptAIOperation();
    expect(model.getAIState()).toBeInstanceOf(IdleState);

    deferred.resolve(new Proposal("traduzione tardiva", "translate"));
    await requestPromise;

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});

describe("Visualizzazione proposta traduzione", () => {
  it("porta lo stato a ProposalReady con la proposta restituita dall'LLM", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal(
      "Questa è la traduzione generata.",
      "translate",
    );
    (aiService.requestOperation as any).mockResolvedValue(proposal);

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    await model.requestAIOperation("translate", "testo", {});

    const state = model.getAIState();
    expect(state).toBeInstanceOf(ProposalReadyState);
    expect((state as ProposalReadyState).proposal).toBe(proposal);
    expect((state as ProposalReadyState).proposal.content).toBe(
      "Questa è la traduzione generata.",
    );
    expect(observer.update).toHaveBeenCalledTimes(2);
  });
});

describe("Accettazione proposta traduzione", () => {
  it("sostituisce il testo selezionato con la traduzione accettata tramite AIController", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal("TRADUZIONE_GENERATA", "translate");
    (aiService.requestOperation as any).mockResolvedValue(proposal);

    const noteModel = new NoteModel(
      new MarkdownContentEditor("Questo è il testo originale"),
      new CommandHistory(),
      mockNoteService,
    );

    const aiView = {
      attach: vi.fn(),
      getLastRequestedOperation: vi.fn(),
      getLastProposalAction: vi.fn(),
    } as unknown as AIPanelView;

    const model = new AIRequestModel(aiService);
    const controller = new AIController(model, aiView, noteModel);

    const selectionRange = new TextRange(12, 27);

    aiView.getLastRequestedOperation = vi.fn().mockReturnValue({
      type: "translate",
      text: undefined,
      params: {},
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

    expect(noteModel.getContent()).toBe("Questo è il TRADUZIONE_GENERATA");
    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});

describe("Rifiuto proposta traduzione", () => {
  it("elimina la proposta visualizzata e torna allo stato Idle senza alterare la nota", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal("traduzione", "translate");
    (aiService.requestOperation as any).mockResolvedValue(proposal);

    const model = new AIRequestModel(aiService);
    await model.requestAIOperation("translate", "testo", {});
    expect(model.getAIState()).toBeInstanceOf(ProposalReadyState);

    model.rejectProposal();

    const state = model.getAIState();
    expect(state).toBeInstanceOf(IdleState);
    expect(state).not.toBeInstanceOf(ProposalReadyState);
  });
});

describe("Rigenerazione proposta traduzione", () => {
  it("acquisisce una nuova richiesta mantenendo il testo selezionato", async () => {
    const aiService = makeMockAIService();
    const firstProposal = new Proposal("prima traduzione", "translate");
    const secondProposal = new Proposal("seconda traduzione", "translate");
    (aiService.requestOperation as any)
      .mockResolvedValueOnce(firstProposal)
      .mockResolvedValueOnce(secondProposal);

    const model = new AIRequestModel(aiService);
    await model.requestAIOperation("translate", "testo selezionato", {});
    expect((model.getAIState() as ProposalReadyState).proposal).toBe(
      firstProposal,
    );

    model.rejectProposal();
    expect(model.getAIState()).toBeInstanceOf(IdleState);

    await model.requestAIOperation("translate", "testo selezionato", {});

    expect(aiService.requestOperation).toHaveBeenCalledTimes(2);
    expect(aiService.requestOperation).toHaveBeenNthCalledWith(
      2,
      "translate",
      "testo selezionato",
      {},
    );
    expect((model.getAIState() as ProposalReadyState).proposal).toBe(
      secondProposal,
    );
  });
});

describe("Visualizzazione errore generazione traduzione", () => {
  it("porta lo stato a Error quando il servizio LLM restituisce un errore", async () => {
    const aiService = makeMockAIService();
    (aiService.requestOperation as any).mockRejectedValue(
      new Error("Servizio LLM non disponibile"),
    );

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    await model.requestAIOperation("translate", "testo", {});

    const state = model.getAIState();
    expect(state).toBeInstanceOf(ErrorState);
    expect((state as ErrorState).message).toBe("Servizio LLM non disponibile");
    expect(observer.update).toHaveBeenCalledTimes(2);
  });

  it("non applica un errore tardivo se la richiesta è già stata interrotta", async () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    const requestPromise = model.requestAIOperation("translate", "testo", {});

    model.interruptAIOperation();
    deferred.reject(new Error("Timeout"));

    await requestPromise;

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});
