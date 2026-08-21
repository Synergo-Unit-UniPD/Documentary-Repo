import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LinkModal from './LinkModal.vue'

describe('LinkModal - modalità inserimento (R29-F-O)', () => {
  it('mostra il titolo e i campi corretti per un nuovo link, senza il pulsante "Rimuovi link"', () => {
    const wrapper = mount(LinkModal, { props: { isEditing: false } })

    expect(wrapper.find('h2').text()).toBe('Inserisci link')
    expect(wrapper.find('#link-url').exists()).toBe(true)
    expect(wrapper.find('#link-label').exists()).toBe(true)
    expect(wrapper.findAll('button').some((btn) => btn.text() === 'Rimuovi link')).toBe(false)

    wrapper.unmount()
  })

  it("non emette submit se l'URL è vuoto (guardia obbligatorietà URL)", async () => {
    const wrapper = mount(LinkModal, { props: { isEditing: false } })

    await wrapper.find('.primary').trigger('click')

    expect(wrapper.emitted('submit')).toBeUndefined()

    wrapper.unmount()
  })

  it("usa l'URL come label quando la label è lasciata vuota", async () => {
    const wrapper = mount(LinkModal, { props: { isEditing: false } })

    await wrapper.find('#link-url').setValue('https://example.com')
    await wrapper.find('.primary').trigger('click')

    expect(wrapper.emitted('submit')).toEqual([['https://example.com', 'https://example.com']])

    wrapper.unmount()
  })

  it('emette submit con url e label ripuliti da spazi quando entrambi sono valorizzati', async () => {
    const wrapper = mount(LinkModal, { props: { isEditing: false } })

    await wrapper.find('#link-url').setValue('  https://example.com  ')
    await wrapper.find('#link-label').setValue('  Esempio  ')
    await wrapper.find('.primary').trigger('click')

    expect(wrapper.emitted('submit')).toEqual([['https://example.com', 'Esempio']])

    wrapper.unmount()
  })

  it('emette close quando si preme il pulsante di chiusura in alto', async () => {
    const wrapper = mount(LinkModal, { props: { isEditing: false } })

    await wrapper.find('.close-button').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })

  it('emette close quando si preme "Annulla"', async () => {
    const wrapper = mount(LinkModal, { props: { isEditing: false } })

    const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Annulla')
    await cancelButton!.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })
})

describe('LinkModal - modalità modifica (R30-F-O, R31-F-O)', () => {
  it('precompila i campi con initialUrl/initialLabel e mostra "Rimuovi link"', () => {
    const wrapper = mount(LinkModal, {
      props: { isEditing: true, initialUrl: 'https://existing.com', initialLabel: 'Link esistente' },
    })

    expect(wrapper.find('h2').text()).toBe('Modifica link')
    expect((wrapper.find('#link-url').element as HTMLInputElement).value).toBe('https://existing.com')
    expect((wrapper.find('#link-label').element as HTMLInputElement).value).toBe('Link esistente')
    expect(wrapper.findAll('button').some((btn) => btn.text() === 'Rimuovi link')).toBe(true)

    wrapper.unmount()
  })

  it('il pulsante "Salva" invia le modifiche ai campi precompilati', async () => {
    const wrapper = mount(LinkModal, {
      props: { isEditing: true, initialUrl: 'https://existing.com', initialLabel: 'Link esistente' },
    })

    await wrapper.find('#link-url').setValue('https://updated.com')
    const saveButton = wrapper.findAll('button').find((btn) => btn.text() === 'Salva')
    await saveButton!.trigger('click')

    expect(wrapper.emitted('submit')).toEqual([['https://updated.com', 'Link esistente']])

    wrapper.unmount()
  })

  it('emette remove quando si preme "Rimuovi link" (R31-F-O)', async () => {
    const wrapper = mount(LinkModal, { props: { isEditing: true, initialUrl: 'https://existing.com' } })

    const removeButton = wrapper.findAll('button').find((btn) => btn.text() === 'Rimuovi link')
    await removeButton!.trigger('click')

    expect(wrapper.emitted('remove')).toHaveLength(1)

    wrapper.unmount()
  })

  it("gestisce l'assenza di initialUrl/initialLabel senza errori (props opzionali)", () => {
    const wrapper = mount(LinkModal, { props: { isEditing: true } })

    expect((wrapper.find('#link-url').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('#link-label').element as HTMLInputElement).value).toBe('')

    wrapper.unmount()
  })
})
