import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TableModal from './TableModal.vue'

describe('TableModal - valori di default e validazione (R36-F-O)', () => {
  it('parte con 2 righe e 2 colonne, valide di default, senza messaggio di errore', () => {
    const wrapper = mount(TableModal)

    expect((wrapper.find('#table-rows').element as HTMLInputElement).value).toBe('2')
    expect((wrapper.find('#table-cols').element as HTMLInputElement).value).toBe('2')
    expect(wrapper.find('.field-error').exists()).toBe(false)
    expect(wrapper.find('.primary').attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })

  it('mostra l\'errore e disabilita "Inserisci" se le righe sono impostate a 0', async () => {
    const wrapper = mount(TableModal)

    await wrapper.find('#table-rows').setValue(0)

    expect(wrapper.find('.field-error').text()).toBe('Righe e colonne devono essere numeri maggiori di zero.')
    expect(wrapper.find('.primary').attributes('disabled')).toBeDefined()

    wrapper.unmount()
  })

  it('mostra l\'errore e disabilita "Inserisci" se le colonne sono impostate a 0', async () => {
    const wrapper = mount(TableModal)

    await wrapper.find('#table-cols').setValue(0)

    expect(wrapper.find('.field-error').text()).toBe('Righe e colonne devono essere numeri maggiori di zero.')
    expect(wrapper.find('.primary').attributes('disabled')).toBeDefined()

    wrapper.unmount()
  })

  it('rimuove l\'errore e riabilita "Inserisci" quando i valori tornano validi', async () => {
    const wrapper = mount(TableModal)

    await wrapper.find('#table-rows').setValue(0)
    expect(wrapper.find('.field-error').exists()).toBe(true)

    await wrapper.find('#table-rows').setValue(3)
    expect(wrapper.find('.field-error').exists()).toBe(false)
    expect(wrapper.find('.primary').attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })
})

describe('TableModal - submit (R36-F-O)', () => {
  it('emette submit con righe e colonne correnti quando sono valide', async () => {
    const wrapper = mount(TableModal)

    await wrapper.find('#table-rows').setValue(4)
    await wrapper.find('#table-cols').setValue(3)
    await wrapper.find('.primary').trigger('click')

    expect(wrapper.emitted('submit')).toEqual([[4, 3]])

    wrapper.unmount()
  })

  it('non emette submit se si forza il click mentre i valori non sono validi (guardia difensiva)', async () => {
    const wrapper = mount(TableModal)

    await wrapper.find('#table-rows').setValue(0)
    // Il bottone è disabled, ma si verifica comunque che submit() non emetta
    // nulla se invocato: la guardia in submit() protegge anche da eventuali
    // invii forzati (es. Invio da tastiera) che bypassano l'attributo disabled.
    await wrapper.find('.primary').trigger('click')

    expect(wrapper.emitted('submit')).toBeUndefined()

    wrapper.unmount()
  })
})

describe('TableModal - chiusura', () => {
  it('emette close dal pulsante di chiusura in alto e da "Annulla"', async () => {
    const wrapper = mount(TableModal)

    await wrapper.find('.close-button').trigger('click')
    const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Annulla')
    await cancelButton!.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(2)

    wrapper.unmount()
  })
})
