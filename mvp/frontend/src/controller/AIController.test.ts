import { describe, it, expect, vi } from 'vitest'
import { AIController } from './AIController'
import { AIRequestModel } from '../model/AIRequestModel'
import { AIPanelView } from '../view/AIPanelView'
import { NoteModel } from '../model/NoteModel'
import { CommandHistory } from '../model/CommandHistory'
import { MarkdownContentEditor } from '../model/MarkdownContentEditor'
import { NoteService } from '../proxy/NoteService'
import { AIService } from '../proxy/AIService'
import { RequestedOperation } from '../model/RequestedOperation'
import { ProposalActionType } from '../model/ProposalActionType'
import { ProposalReadyState } from '../model/ProposalReadyState'
import { Proposal } from '../model/Proposal'
import { Note } from '../model/Note'
import { InsertTextCommand } from '../model/InsertTextCommand'
import { TextRange } from '../model/TextRange'

// Setup dei Mock
const mockAIService: AIService = {
  requestOperation: vi.fn(),
  listOperations: vi.fn().mockResolvedValue([]),
}

const mockNoteService: NoteService = {
  save: vi.fn().mockResolvedValue(undefined),
  open: vi.fn().mockResolvedValue(new Note('id', 'testo')),
}

describe('AIController', () => {
  it('dovrebbe invocare requestAIOperation sul model alla ricezione di una RequestedOperation', () => {
    const aiModel = new AIRequestModel(mockAIService)
    const requestSpy = vi.spyOn(aiModel, 'requestAIOperation')

    const noteModel = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService)
    vi.spyOn(noteModel, 'getContent').mockReturnValue('testo nota')

    const view = new AIPanelView(aiModel)
    const controller = new AIController(aiModel, view, noteModel)

    const op = new RequestedOperation('distant_writing', { prompt: 'scrivi' })
    view.simulateSubmitRequest(op)

    expect(requestSpy).toHaveBeenCalledWith('distant_writing', 'testo nota', { prompt: 'scrivi' })
  })

  it("dovrebbe invocare acceptProposal sul model se l'utente accetta", () => {
    const aiModel = new AIRequestModel(mockAIService)
    const acceptSpy = vi.spyOn(aiModel, 'acceptProposal')
    const noteModel = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService)
    const view = new AIPanelView(aiModel)

    const controller = new AIController(aiModel, view, noteModel)

    view.simulateProposalAction(ProposalActionType.ACCEPT)

    expect(acceptSpy).toHaveBeenCalledTimes(1)
  })

  it("dovrebbe creare un InsertTextCommand ed eseguirlo sul NoteModel all'accettazione della proposta", () => {
    const aiModel = new AIRequestModel(mockAIService)
    // Forziamo lo stato per simulare la presenza di una proposta (Step 9)
    const proposal = new Proposal('Testo proposto dall AI', 'summary')
    ;(aiModel as any).aiState = new ProposalReadyState(proposal)

    const markdownEditor = new MarkdownContentEditor('Testo iniziale')
    const commandHistory = new CommandHistory()
    const noteModel = new NoteModel(markdownEditor, commandHistory, mockNoteService)

    const executeCommandSpy = vi.spyOn(noteModel, 'executeCommand')

    const view = new AIPanelView(aiModel)
    const controller = new AIController(aiModel, view, noteModel)

    // Simuliamo l'azione di Accept da parte dell'utente (Step 1-6)
    view.simulateProposalAction(ProposalActionType.ACCEPT)

    // Verifichiamo che il NoteModel abbia eseguito il comando corretto (Step 10-15)
    expect(executeCommandSpy).toHaveBeenCalledTimes(1)
    expect(executeCommandSpy).toHaveBeenCalledWith(expect.any(InsertTextCommand))
  })
})

describe('AIController - selezione di testo per le operazioni AI', () => {
  it("usa il testo selezionato (RequestedOperation.text) invece dell'intera nota, quando fornito", () => {
    const aiModel = new AIRequestModel(mockAIService)
    const requestSpy = vi.spyOn(aiModel, 'requestAIOperation')

    const noteModel = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService)
    vi.spyOn(noteModel, 'getContent').mockReturnValue('intera nota, molto più lunga')

    const view = new AIPanelView(aiModel)
    new AIController(aiModel, view, noteModel)

    const op = new RequestedOperation('summarize', {}, 'solo la selezione', new TextRange(3, 10))
    view.simulateSubmitRequest(op)

    expect(requestSpy).toHaveBeenCalledWith('summarize', 'solo la selezione', {})
  })

  it('SOSTITUISCE il testo originariamente selezionato con la proposta accettata', () => {
    const aiModel = new AIRequestModel(mockAIService)
    const proposal = new Proposal('PROPOSTA', 'rewrite')

    const markdownEditor = new MarkdownContentEditor('Testo iniziale molto lungo')
    const noteModel = new NoteModel(markdownEditor, new CommandHistory(), mockNoteService)
    const view = new AIPanelView(aiModel)
    new AIController(aiModel, view, noteModel)

    // La richiesta AI parte da una selezione a metà del testo (range 6-14 = "iniziale")
    view.simulateSubmitRequest(new RequestedOperation('rewrite', {}, 'iniziale', new TextRange(6, 14)))

    // Forziamo il completamento della richiesta con la proposta pronta
    ;(aiModel as any).aiState = new ProposalReadyState(proposal)

    view.simulateProposalAction(ProposalActionType.ACCEPT)

    // "iniziale" deve essere SOSTITUITO dalla proposta, non conservato con la proposta accodata prima
    expect(markdownEditor.getContent()).toBe('Testo PROPOSTA molto lungo')
    expect(markdownEditor.getContent()).not.toContain('iniziale')
  })

  it('con un range collassato (nessuna selezione, es. Distant Writing) la proposta viene semplicemente inserita', () => {
    const aiModel = new AIRequestModel(mockAIService)
    const proposal = new Proposal('testo generato', 'distant_writing')

    const markdownEditor = new MarkdownContentEditor('Nota esistente. ')
    const noteModel = new NoteModel(markdownEditor, new CommandHistory(), mockNoteService)
    const view = new AIPanelView(aiModel)
    new AIController(aiModel, view, noteModel)

    const endOfDoc = markdownEditor.getContent().length
    view.simulateSubmitRequest(new RequestedOperation('distant_writing', {}, '', new TextRange(endOfDoc, endOfDoc)))
    ;(aiModel as any).aiState = new ProposalReadyState(proposal)
    view.simulateProposalAction(ProposalActionType.ACCEPT)

    expect(markdownEditor.getContent()).toBe('Nota esistente. testo generato')
  })

  it('accettare la proposta resta annullabile con Undo (round-trip al testo originale)', () => {
    const aiModel = new AIRequestModel(mockAIService)
    const proposal = new Proposal('PROPOSTA', 'rewrite')

    const markdownEditor = new MarkdownContentEditor('Testo iniziale molto lungo')
    const history = new CommandHistory()
    const noteModel = new NoteModel(markdownEditor, history, mockNoteService)
    const view = new AIPanelView(aiModel)
    new AIController(aiModel, view, noteModel)

    view.simulateSubmitRequest(new RequestedOperation('rewrite', {}, 'iniziale', new TextRange(6, 14)))
    ;(aiModel as any).aiState = new ProposalReadyState(proposal)
    view.simulateProposalAction(ProposalActionType.ACCEPT)

    expect(noteModel.canUndo()).toBe(true)
    noteModel.undo()
    expect(markdownEditor.getContent()).toBe('Testo iniziale molto lungo')
  })
})

describe('AIController - Rigenera', () => {
  it('Rigenera invia di nuovo la STESSA richiesta (stesso testo, stessi parametri), non si limita a tornare a Idle', () => {
    const aiModel = new AIRequestModel(mockAIService)
    const requestSpy = vi.spyOn(aiModel, 'requestAIOperation')

    const noteModel = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService)
    const view = new AIPanelView(aiModel)
    new AIController(aiModel, view, noteModel)

    const op = new RequestedOperation('translate', { target_language: 'en' }, 'ciao come va', new TextRange(0, 13))
    view.simulateSubmitRequest(op)
    expect(requestSpy).toHaveBeenCalledTimes(1)

    // Arriva una proposta e l'utente non è soddisfatto: clicca "Rigenera"
    ;(aiModel as any).aiState = new ProposalReadyState(new Proposal('How are you?', 'translate'))
    view.simulateProposalAction(ProposalActionType.REGENERATE)

    // Deve essere stata inviata una SECONDA richiesta, identica alla prima
    expect(requestSpy).toHaveBeenCalledTimes(2)
    expect(requestSpy).toHaveBeenLastCalledWith('translate', 'ciao come va', { target_language: 'en' })
  })

  it('senza una richiesta precedente memorizzata, Rigenera non lancia eccezioni (rete di sicurezza)', () => {
    const aiModel = new AIRequestModel(mockAIService)
    const noteModel = new NoteModel(new MarkdownContentEditor(), new CommandHistory(), mockNoteService)
    const view = new AIPanelView(aiModel)
    new AIController(aiModel, view, noteModel)

    expect(() => view.simulateProposalAction(ProposalActionType.REGENERATE)).not.toThrow()
  })

  it('dopo Accetta o Rifiuta, Rigenera non ripete più una richiesta ormai conclusa', () => {
    const aiModel = new AIRequestModel(mockAIService)
    const requestSpy = vi.spyOn(aiModel, 'requestAIOperation')

    const noteModel = new NoteModel(new MarkdownContentEditor('testo'), new CommandHistory(), mockNoteService)
    const view = new AIPanelView(aiModel)
    new AIController(aiModel, view, noteModel)

    view.simulateSubmitRequest(new RequestedOperation('rewrite', {}, 'testo', new TextRange(0, 5)))
    ;(aiModel as any).aiState = new ProposalReadyState(new Proposal('proposta', 'rewrite'))
    view.simulateProposalAction(ProposalActionType.ACCEPT)

    requestSpy.mockClear()
    view.simulateProposalAction(ProposalActionType.REGENERATE)

    // Nessuna nuova richiesta AI: la sessione precedente è stata chiusa dall'accettazione
    expect(requestSpy).not.toHaveBeenCalled()
  })
})
