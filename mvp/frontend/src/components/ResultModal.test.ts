import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultModal from './ResultModal.vue'

function mountResultModal(props: Record<string, unknown> = {}) {
  return mount(ResultModal, {
    props: {
      operationType: 'summarize',
      selectedText: 'Testo selezionato originale.',
      proposalContent: 'Proposta generata dal modello.',
      ...props,
    },
  })
}

describe('ResultModal - intestazione per tipo di operazione (R74-F-O)', () => {
  it.each([
    ['summarize', 'Riassunto'],
    ['translate', 'Traduzione'],
    ['rewrite', 'Riscrittura'],
    ['distant_writing', 'Distant Writing'],
    ['hat_analysis', 'Analisi - Sei Cappelli per Pensare'],
  ])('mostra l\'etichetta corretta per operationType="%s"', (operationType, expectedLabel) => {
    const wrapper = mountResultModal({ operationType })
    expect(wrapper.find('h2').text()).toBe(expectedLabel)
    wrapper.unmount()
  })

  it('mostra un titolo generico se operationType non è mappato', () => {
    const wrapper = mountResultModal({ operationType: 'unknown_operation' })
    expect(wrapper.find('h2').text()).toBe('Proposta AI')
    wrapper.unmount()
  })
})

describe('ResultModal - testo di partenza e proposta', () => {
  it('mostra il box "Testo di partenza" quando selectedText è presente', () => {
    const wrapper = mountResultModal({ selectedText: 'Testo originale.' })
    const boxes = wrapper.findAll('.result-box')

    expect(boxes).toHaveLength(2)
    expect(boxes[0]!.text()).toContain('Testo di partenza')
    expect(boxes[0]!.text()).toContain('Testo originale.')
    wrapper.unmount()
  })

  it('nasconde il box "Testo di partenza" quando selectedText è vuoto (es. Distant Writing senza contesto)', () => {
    const wrapper = mountResultModal({ selectedText: '' })
    const boxes = wrapper.findAll('.result-box')

    expect(boxes).toHaveLength(1)
    expect(boxes[0]!.text()).toContain('Proposta')
    wrapper.unmount()
  })

  it('mostra sempre il box "Proposta" con il relativo contenuto', () => {
    const wrapper = mountResultModal({ proposalContent: 'Contenuto proposto dal modello.' })
    const proposalBox = wrapper.findAll('.result-box').at(-1)

    expect(proposalBox!.text()).toContain('Proposta')
    expect(proposalBox!.text()).toContain('Contenuto proposto dal modello.')
    wrapper.unmount()
  })
})

describe('ResultModal - azioni sulla proposta (R69/R70/R71-F-O)', () => {
  it('emette accept quando si preme "Accetta"', async () => {
    const wrapper = mountResultModal()
    await wrapper.find('.primary').trigger('click')

    expect(wrapper.emitted('accept')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emette regenerate quando si preme "Rigenera"', async () => {
    const wrapper = mountResultModal()
    const regenerateButton = wrapper.findAll('button').find((btn) => btn.text() === 'Rigenera')
    await regenerateButton!.trigger('click')

    expect(wrapper.emitted('regenerate')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emette close quando si preme "Rifiuta"', async () => {
    const wrapper = mountResultModal()
    const rejectButton = wrapper.findAll('button').find((btn) => btn.text() === 'Rifiuta')
    await rejectButton!.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emette close dal pulsante di chiusura in alto', async () => {
    const wrapper = mountResultModal()
    await wrapper.find('.close-button').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })
})
