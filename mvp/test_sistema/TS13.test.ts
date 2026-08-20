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
    listOperations: vi.fn().mockResolvedValue(["summarize", "translate", "rewrite"]),
  };
}

describe("Richiesta riassunto", () => {
  it("acquisisce la richiesta dell'utente e avvia l'elaborazione (stato Processing)", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    expect(model.getAIState()).toBeInstanceOf(IdleState);

    // L'utente richiede la generazione di un riassunto del testo selezionato.
    void model.requestAIOperation("summarize", "testo selezionato", {});

    expect(model.getAIState()).toBeInstanceOf(ProcessingState);
  });
});

describe("Generazione riassunto", () => {
  it("inoltra al servizio LLM la richiesta di riassunto con i parametri corretti", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    void model.requestAIOperation("summarize", "testo selezionato", {});

    expect(aiService.requestOperation).toHaveBeenCalledTimes(1);
    expect(aiService.requestOperation).toHaveBeenCalledWith("summarize", "testo selezionato", {});
  });
});

describe("Visualizzazione elaborazione riassunto", () => {
  it("notifica gli observer e mantiene lo stato Processing mentre la richiesta è in corso", async () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    const requestPromise = model.requestAIOperation("summarize", "testo", {});

    expect(observer.update).toHaveBeenCalledTimes(1);
    expect(model.getAIState()).toBeInstanceOf(ProcessingState);

    deferred.resolve(new Proposal("riassunto", "summarize"));
    await requestPromise;
  });
});

describe("Interruzione elaborazione riassunto", () => {
  it("torna allo stato Idle quando l'utente interrompe l'elaborazione", () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    void model.requestAIOperation("summarize", "testo", {});
    expect(model.getAIState()).toBeInstanceOf(ProcessingState);

    model.interruptAIOperation();

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });

  it("ignora una risposta tardiva della richiesta interrotta ", async () => {
    const aiService = makeMockAIService();
    const deferred = createDeferred<Proposal>();
    (aiService.requestOperation as any).mockReturnValue(deferred.promise);

    const model = new AIRequestModel(aiService);
    const requestPromise = model.requestAIOperation("summarize", "testo", {});

    model.interruptAIOperation();
    expect(model.getAIState()).toBeInstanceOf(IdleState);

    deferred.resolve(new Proposal("riassunto tardivo", "summarize"));
    await requestPromise;

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});

describe("Visualizzazione proposta riassunto", () => {
  it("porta lo stato a ProposalReady con la proposta restituita dall'LLM", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal("Questo è il riassunto generato.", "summarize");
    (aiService.requestOperation as any).mockResolvedValue(proposal);

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    await model.requestAIOperation("summarize", "testo", {});

    const state = model.getAIState();
    expect(state).toBeInstanceOf(ProposalReadyState);
    expect((state as ProposalReadyState).proposal).toBe(proposal);
    expect((state as ProposalReadyState).proposal.content).toBe("Questo è il riassunto generato.");
    expect(observer.update).toHaveBeenCalledTimes(2);
  });
});

describe("Accettazione proposta riassunto", () => {
  it("sostituisce il testo selezionato con il riassunto accettato tramite AIController", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal("RIASSUNTO_GENERATO", "summarize");
    (aiService.requestOperation as any).mockResolvedValue(proposal);

    const noteModel = new NoteModel(
      new MarkdownContentEditor("Questo è il testo originale"),
      new CommandHistory(),
      mockNoteService
    );

    const aiView = {
      attach: vi.fn(),
      getLastRequestedOperation: vi.fn(),
      getLastProposalAction: vi.fn()
    } as unknown as AIPanelView;

    const model = new AIRequestModel(aiService);
    const controller = new AIController(model, aiView, noteModel);

    const selectionRange = new TextRange(12, 27);

    aiView.getLastRequestedOperation = vi.fn().mockReturnValue({
      type: "summarize",
      text: undefined,
      params: {},
      range: selectionRange
    });

    controller.update();
    await Promise.resolve();

    aiView.getLastRequestedOperation = vi.fn().mockReturnValue(undefined);

    aiView.getLastProposalAction = vi.fn().mockReturnValue(ProposalActionType.ACCEPT);

    controller.update();

    expect(noteModel.getContent()).toBe("Questo è il RIASSUNTO_GENERATO");
    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});




describe("Rifiuto proposta riassunto", () => {
  it("elimina la proposta visualizzata e torna allo stato Idle senza alterare la nota", async () => {
    const aiService = makeMockAIService();
    const proposal = new Proposal("riassunto", "summarize");
    (aiService.requestOperation as any).mockResolvedValue(proposal);

    const model = new AIRequestModel(aiService);
    await model.requestAIOperation("summarize", "testo", {});
    expect(model.getAIState()).toBeInstanceOf(ProposalReadyState);

    model.rejectProposal();

    const state = model.getAIState();
    expect(state).toBeInstanceOf(IdleState);
    expect(state).not.toBeInstanceOf(ProposalReadyState);
  });
});

describe("Rigenerazione proposta riassunto", () => {
  it("elimina la proposta corrente e acquisisce una nuova richiesta mantenendo il testo selezionato", async () => {
    const aiService = makeMockAIService();
    const firstProposal = new Proposal("primo riassunto", "summarize");
    const secondProposal = new Proposal("secondo riassunto", "summarize");
    (aiService.requestOperation as any)
      .mockResolvedValueOnce(firstProposal)
      .mockResolvedValueOnce(secondProposal);

    const model = new AIRequestModel(aiService);
    await model.requestAIOperation("summarize", "testo selezionato", {});
    expect((model.getAIState() as ProposalReadyState).proposal).toBe(firstProposal);

    model.rejectProposal();
    expect(model.getAIState()).toBeInstanceOf(IdleState);

    await model.requestAIOperation("summarize", "testo selezionato", {});

    expect(aiService.requestOperation).toHaveBeenCalledTimes(2);
    expect(aiService.requestOperation).toHaveBeenNthCalledWith(2, "summarize", "testo selezionato", {});
    expect((model.getAIState() as ProposalReadyState).proposal).toBe(secondProposal);
  });
});

describe("Visualizzazione errore generazione riassunto", () => {
  it("porta lo stato a Error quando il servizio LLM restituisce un errore", async () => {
    const aiService = makeMockAIService();
    (aiService.requestOperation as any).mockRejectedValue(new Error("Servizio LLM non disponibile"));

    const model = new AIRequestModel(aiService);
    const observer = { update: vi.fn() };
    model.attach(observer);

    await model.requestAIOperation("summarize", "testo", {});

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
    const requestPromise = model.requestAIOperation("summarize", "testo", {});

    model.interruptAIOperation();
    deferred.reject(new Error("Timeout"));

    await requestPromise;

    expect(model.getAIState()).toBeInstanceOf(IdleState);
  });
});