import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorModal from './ErrorModal.vue'

describe('ErrorModal - notifica errore operazione AI (R49/R51/R54/R56/R58/R60/R62/R64/R66/R68-F-O)', () => {
  it('mostra il messaggio di errore ricevuto via prop', () => {
    const wrapper = mount(ErrorModal, { props: { message: 'Servizio AI non raggiungibile.' } })

    expect(wrapper.find('.error-box').text()).toBe('Servizio AI non raggiungibile.')
    expect(wrapper.find('h2').text()).toBe("Errore durante l'operazione AI")

    wrapper.unmount()
  })

  it("rassicura l'utente che il documento non è stato modificato", () => {
    const wrapper = mount(ErrorModal, { props: { message: 'Timeout.' } })

    expect(wrapper.find('.modal-subtitle').text()).toBe('Il documento non è stato modificato.')

    wrapper.unmount()
  })

  it('emette close quando si preme il pulsante di chiusura in alto', async () => {
    const wrapper = mount(ErrorModal, { props: { message: 'Errore generico.' } })

    await wrapper.find('.close-button').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })

  it('emette close quando si preme "Chiudi"', async () => {
    const wrapper = mount(ErrorModal, { props: { message: 'Errore generico.' } })

    await wrapper.find('.primary').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })
})
