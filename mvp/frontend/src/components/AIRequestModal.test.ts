import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AIRequestModal from './AIRequestModal.vue'

describe('AIRequestModal - modalità traduzione (R50-F-O)', () => {
  it('mostra titolo, sottotitolo e selettore lingua, non la textarea', () => {
    const wrapper = mount(AIRequestModal, { props: { mode: 'translate' } })

    expect(wrapper.find('h2').text()).toBe('Traduci il testo selezionato')
    expect(wrapper.find('.modal-subtitle').text()).toBe('Scegli la lingua di destinazione.')
    expect(wrapper.find('.language-select').exists()).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(false)

    wrapper.unmount()
  })

  it('propone tutte e quattro le lingue disponibili (inglese, francese, spagnolo, tedesco - R52-F-D)', () => {
    const wrapper = mount(AIRequestModal, { props: { mode: 'translate' } })
    const options = wrapper.findAll('.language-select option')

    expect(options.map((o) => (o.element as HTMLOptionElement).value)).toEqual(['en', 'fr', 'es', 'de'])

    expect(options.map((o) => o.text())).toEqual(['Inglese', 'Francese', 'Spagnolo', 'Tedesco'])

    wrapper.unmount()
  })

  it('emette submit con target_language, di default "en" se non viene cambiata', async () => {
    const wrapper = mount(AIRequestModal, { props: { mode: 'translate' } })

    await wrapper.find('.primary').trigger('click')

    expect(wrapper.emitted('submit')).toEqual([[{ target_language: 'en' }]])

    wrapper.unmount()
  })

  it("emette submit con la lingua selezionata dall'utente", async () => {
    const wrapper = mount(AIRequestModal, { props: { mode: 'translate' } })

    await wrapper.find('.language-select').setValue('fr')
    await wrapper.find('.primary').trigger('click')

    expect(wrapper.emitted('submit')).toEqual([[{ target_language: 'fr' }]])

    wrapper.unmount()
  })
})

describe('AIRequestModal - modalità Distant Writing (R55-F-O)', () => {
  it('mostra titolo, sottotitolo e textarea, non il selettore lingua', () => {
    const wrapper = mount(AIRequestModal, { props: { mode: 'distant_writing' } })

    expect(wrapper.find('h2').text()).toBe('Distant Writing')
    expect(wrapper.find('.modal-subtitle').text()).toBe('Descrivi il testo che vuoi generare.')
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('.language-select').exists()).toBe(false)

    wrapper.unmount()
  })

  it("emette submit con user_prompt vuoto se l'utente non scrive nulla", async () => {
    const wrapper = mount(AIRequestModal, { props: { mode: 'distant_writing' } })

    await wrapper.find('.primary').trigger('click')

    expect(wrapper.emitted('submit')).toEqual([[{ user_prompt: '' }]])

    wrapper.unmount()
  })

  it("emette submit con il prompt scritto dall'utente", async () => {
    const wrapper = mount(AIRequestModal, { props: { mode: 'distant_writing' } })

    await wrapper.find('textarea').setValue('Scrivi una conclusione breve.')
    await wrapper.find('.primary').trigger('click')

    expect(wrapper.emitted('submit')).toEqual([[{ user_prompt: 'Scrivi una conclusione breve.' }]])

    wrapper.unmount()
  })
})

describe('AIRequestModal - chiusura', () => {
  it('emette close dal pulsante di chiusura in alto e da "Annulla"', async () => {
    const wrapper = mount(AIRequestModal, { props: { mode: 'translate' } })

    await wrapper.find('.close-button').trigger('click')
    const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Annulla')
    await cancelButton!.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(2)

    wrapper.unmount()
  })
})
