import { describe, it, expect, vi } from 'vitest'
import { AIPanelView } from './AIPanelView'
import { AIRequestModel } from '../model/AIRequestModel'
import { AIService } from '../proxy/AIService'
import { RequestedOperation } from '../model/RequestedOperation'
import { ProposalActionType } from '../model/ProposalActionType'
import { Observer } from '../model/Observer'
import { ProcessingState } from '../model/ProcessingState'

const mockAIService: AIService = {
  requestOperation: vi.fn(),
  listOperations: vi.fn().mockResolvedValue([]),
}

class MockController implements Observer {
  update = vi.fn()
}

describe('AIPanelView', () => {
  it("dovrebbe agganciarsi al model durante l'inizializzazione", () => {
    const model = new AIRequestModel(mockAIService)
    const attachSpy = vi.spyOn(model, 'attach')

    const view = new AIPanelView(model)
    expect(attachSpy).toHaveBeenCalledWith(view)
  })

  it('dovrebbe notificare gli observer (Controller) quando si simula una richiesta', () => {
    const model = new AIRequestModel(mockAIService)
    const view = new AIPanelView(model)
    const controller = new MockController()

    view.attach(controller)

    const op = new RequestedOperation('red_hat', { param: 1 })
    view.simulateSubmitRequest(op)

    expect(controller.update).toHaveBeenCalledTimes(1)
    expect(view.getLastRequestedOperation()).toBe(op)
  })

  it('dovrebbe chiamare render in risposta a un update dal model', () => {
    const model = new AIRequestModel(mockAIService)
    const view = new AIPanelView(model)
    const renderSpy = vi.spyOn(view, 'render')

    view.update()
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })

  it('dovrebbe gestire il ProcessingState (Step 14) invocando render', () => {
    const model = new AIRequestModel(mockAIService)
    const view = new AIPanelView(model)
    const renderSpy = vi.spyOn(view, 'render')

    // Forziamo lo stato a ProcessingState (Step 9)
    ;(model as any).aiState = new ProcessingState()

    // Simuliamo la notifica dal Model (Step 11)
    view.update()

    expect(renderSpy).toHaveBeenCalledTimes(1)

    const currentState = model.getAIState()
    expect(currentState).toBeInstanceOf(ProcessingState)
  })
})
