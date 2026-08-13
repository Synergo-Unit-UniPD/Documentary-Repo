import { Observer } from '../model/Observer'
import { AIRequestModel } from '../model/AIRequestModel'
import { AIPanelView } from '../view/AIPanelView'
import { NoteModel } from '../model/NoteModel'
import { ProposalActionType } from '../model/ProposalActionType'
import { ProposalReadyState } from '../model/ProposalReadyState'
import { InsertTextCommand } from '../model/InsertTextCommand'
import { ReplaceContentCommand } from '../model/ReplaceContentCommand'
import { EditCommand } from '../model/EditCommand'
import { MarkdownContentEditor } from '../model/MarkdownContentEditor'
import { RequestedOperation } from '../model/RequestedOperation'
import { TextRange } from '../model/TextRange'

/**
 * Controller che fa da collante tra le interazioni dell'AIPanelView e l'AIRequestModel.
 */
export class AIController implements Observer {
  private model: AIRequestModel
  private view: AIPanelView
  public noteModel: NoteModel
  private lastRequestRange?: TextRange
  /** Memorizza l'ultima richiesta AI inviata, per poterla ripetere identica
   *  quando l'utente sceglie "Rigenera" sulla proposta ottenuta. */
  private lastRequest?: RequestedOperation

  constructor(model: AIRequestModel, view: AIPanelView, noteModel: NoteModel) {
    this.model = model
    this.view = view
    this.noteModel = noteModel

    this.view.attach(this)
  }

  public update(): void {
    const requestedOp = this.view.getLastRequestedOperation()
    if (requestedOp) {
      this.onAIRequest(requestedOp)
      return
    }

    // Step 5 & 6: getLastProposalAction -> ACCEPT
    const action = this.view.getLastProposalAction()
    if (action) {
      switch (action) {
        case ProposalActionType.ACCEPT:
          this.onAcceptProposal() // Step 7
          break
        case ProposalActionType.REJECT:
          this.onRejectProposal()
          break
        case ProposalActionType.REGENERATE:
          this.onRegenerateProposal()
          break
        case ProposalActionType.INTERRUPT:
          this.onInterrupt()
          break
      }
    }
  }

  private onAIRequest(requestedOp: RequestedOperation): void {
    // Se l'utente ha fornito un testo (tipicamente la selezione corrente), lo si usa;
    // in caso contrario (es. Distant Writing senza selezione) si opera sull'intera nota.
    const text = requestedOp.text ?? this.noteModel.getContent()
    this.lastRequestRange = requestedOp.range
    this.lastRequest = requestedOp
    this.model.requestAIOperation(requestedOp.type, text, requestedOp.params)
  }

  private onAcceptProposal(): void {
    // Step 8: getAIState dal Model
    const currentState = this.model.getAIState()

    if (currentState instanceof ProposalReadyState) {
      const proposal = currentState.proposal
      const editor = (this.noteModel as any).contentEditor as MarkdownContentEditor
      const currentContent = editor.getContent()
      const range = this.lastRequestRange

      let command: EditCommand
      if (range) {
        // SOSTITUISCE il testo originariamente selezionato con la proposta,
        // invece di limitarsi a inserirla prima di esso. Se il range è collassato (nessuna
        // selezione, es. Distant Writing), equivale a un semplice inserimento.
        const start = Math.max(0, Math.min(range.start, currentContent.length))
        const end = Math.max(start, Math.min(range.end, currentContent.length))
        const newContent = currentContent.slice(0, start) + proposal.content + currentContent.slice(end)
        command = new ReplaceContentCommand(editor, newContent)
      } else {
        // Rete di sicurezza: nessun range noto, inserisce in coda al documento.
        command = new InsertTextCommand(this.noteModel, currentContent.length, proposal.content, editor)
      }

      // Step 11 & 12 & 13 & 14 & 15: executeCommand sul NoteModel
      this.noteModel.executeCommand(command)
    }

    this.lastRequestRange = undefined
    this.lastRequest = undefined
    // Step 18: acceptProposal sul model per riportarlo in Idle
    this.model.acceptProposal()
  }

  private onRejectProposal(): void {
    this.lastRequestRange = undefined
    this.lastRequest = undefined
    this.model.rejectProposal()
  }

  private onRegenerateProposal(): void {
    // "Rigenera" deve ripetere la STESSA richiesta (stesso testo/selezione,
    // stessi parametri) per ottenere una nuova proposta, non limitarsi a
    // chiudere quella corrente: per questo si usa requestAIOperation come
    // per una richiesta nuova, invece del semplice reset a Idle.
    if (this.lastRequest) {
      const text = this.lastRequest.text ?? this.noteModel.getContent()
      this.model.requestAIOperation(this.lastRequest.type, text, this.lastRequest.params)
    } else {
      // Rete di sicurezza: se per qualche motivo la richiesta originale non
      // è stata memorizzata, torna semplicemente a Idle invece di restare bloccato.
      this.model.interruptAIOperation()
    }
  }

  private onInterrupt(): void {
    this.lastRequestRange = undefined
    this.lastRequest = undefined
    this.model.interruptAIOperation()
  }
}
