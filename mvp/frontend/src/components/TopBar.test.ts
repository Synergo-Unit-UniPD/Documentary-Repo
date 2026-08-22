import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TopBar from './TopBar.vue'
import { FormatType } from '../model/FormatType'
import { ListOperationType } from '../model/ListOperationType'
import { ListType } from '../model/ListType'
import { TableOperationType } from '../model/TableOperationType'
import { ViewMode } from '../model/ViewMode'

function mountTopBar(props: Record<string, unknown> = {}) {
  return mount(TopBar, {
    props: {
      saveStatus: 'Salvato',
      viewMode: ViewMode.EDITOR_ONLY,
      canUndo: false,
      canRedo: false,
      ...props,
    },
  })
}

describe('TopBar - selettore modalità di visualizzazione (R45-R47-F-O)', () => {
  it('emette view-mode con EDITOR_ONLY, SPLIT e PREVIEW_ONLY sui rispettivi pulsanti', async () => {
    const wrapper = mountTopBar()
    const options = wrapper.findAll('.view-mode-option')

    await options[0]!.trigger('click')
    await options[1]!.trigger('click')
    await options[2]!.trigger('click')

    expect(wrapper.emitted('view-mode')).toEqual([[ViewMode.EDITOR_ONLY], [ViewMode.SPLIT], [ViewMode.PREVIEW_ONLY]])

    wrapper.unmount()
  })

  it('marca come "active" solo il pulsante corrispondente al viewMode corrente', () => {
    const wrapper = mountTopBar({ viewMode: ViewMode.SPLIT })
    const options = wrapper.findAll('.view-mode-option')

    expect(options[0]!.classes()).not.toContain('active')
    expect(options[1]!.classes()).toContain('active')
    expect(options[2]!.classes()).not.toContain('active')

    wrapper.unmount()
  })
})

describe('TopBar - salvataggio e apertura file (R75/R76-F-O)', () => {
  it('emette save quando si preme "Salva"', async () => {
    const wrapper = mountTopBar()
    await wrapper.find('button[title="Salva la nota"]').trigger('click')

    expect(wrapper.emitted('save')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emette open quando si preme "Importa"', async () => {
    const wrapper = mountTopBar()
    await wrapper.find('button[title="Importa un file Markdown"]').trigger('click')

    expect(wrapper.emitted('open')).toHaveLength(1)
    wrapper.unmount()
  })

  it('mostra "Modifiche non salvate" con classe di stato "unsaved"', () => {
    const wrapper = mountTopBar({ saveStatus: 'Modifiche non salvate' })
    expect(wrapper.find('.status').classes()).toContain('unsaved')
    wrapper.unmount()
  })
})

describe('TopBar - menu Esporta (R77-F-O)', () => {
  it('il menu è chiuso di default e si apre al click sul pulsante', async () => {
    const wrapper = mountTopBar()
    expect(wrapper.find('.dropdown-align-right .dropdown-menu').exists()).toBe(false)

    await wrapper.find('button[title="Esporta la nota"]').trigger('click')
    expect(wrapper.find('.dropdown-align-right .dropdown-menu').exists()).toBe(true)

    wrapper.unmount()
  })

  it('selezionare un formato emette export con quel formato e richiude il menu', async () => {
    const wrapper = mountTopBar()
    await wrapper.find('button[title="Esporta la nota"]').trigger('click')

    const [pdfBtn, htmlBtn, jsonBtn] = wrapper.findAll('.dropdown-align-right .dropdown-menu button')
    await pdfBtn!.trigger('click')

    expect(wrapper.emitted('export')).toEqual([['pdf']])
    expect(wrapper.find('.dropdown-align-right .dropdown-menu').exists()).toBe(false)

    await wrapper.find('button[title="Esporta la nota"]').trigger('click')
    await htmlBtn!.trigger('click')
    await wrapper.find('button[title="Esporta la nota"]').trigger('click')
    await jsonBtn!.trigger('click')

    expect(wrapper.emitted('export')).toEqual([['pdf'], ['html'], ['json']])
    wrapper.unmount()
  })
})

describe('TopBar - formattazione inline e di riga (R5-R28-F-O)', () => {
  it.each([
    ['Grassetto', FormatType.BOLD],
    ['Corsivo', FormatType.ITALIC],
    ['Sottolineato', FormatType.UNDERLINE],
    ['Barrato', FormatType.STRIKETHROUGH],
    ['Citazione', FormatType.QUOTE],
    ['Intestazione', FormatType.HEADING],
  ])('il pulsante "%s" emette format con %s', async (title, expected) => {
    const wrapper = mountTopBar()
    await wrapper.find(`button[title="${title}"]`).trigger('click')

    expect(wrapper.emitted('format')).toEqual([[expected]])
    wrapper.unmount()
  })
})

describe('TopBar - elenchi (R32-R35-F-O)', () => {
  it('i pulsanti elenco puntato/numerato emettono CREATE_LIST con il ListType corretto', async () => {
    const wrapper = mountTopBar()

    await wrapper.find('button[title="Elenco puntato (clic di nuovo per rimuovere)"]').trigger('click')
    await wrapper.find('button[title="Elenco numerato (clic di nuovo per rimuovere)"]').trigger('click')

    expect(wrapper.emitted('list')).toEqual([
      [ListOperationType.CREATE_LIST, ListType.UNORDERED],
      [ListOperationType.CREATE_LIST, ListType.ORDERED],
    ])
    wrapper.unmount()
  })

  it('i pulsanti rientro emettono INDENT_ITEM/OUTDENT_ITEM senza ListType', async () => {
    const wrapper = mountTopBar()

    await wrapper.find('button[title="Aumenta rientro"]').trigger('click')
    await wrapper.find('button[title="Riduci rientro"]').trigger('click')

    expect(wrapper.emitted('list')).toEqual([[ListOperationType.INDENT_ITEM], [ListOperationType.OUTDENT_ITEM]])
    wrapper.unmount()
  })
})

describe('TopBar - link, tabelle e menu di modifica tabella (R29-R42-F-O)', () => {
  it('emette insert-link e insert-table', async () => {
    const wrapper = mountTopBar()

    await wrapper.find('button[title="Gestisci link"]').trigger('click')
    await wrapper.find('button[title="Inserisci tabella"]').trigger('click')

    expect(wrapper.emitted('insert-link')).toHaveLength(1)
    expect(wrapper.emitted('insert-table')).toHaveLength(1)
    wrapper.unmount()
  })

  it('il menu "Modifica tabella" espone tutte e cinque le operazioni e richiude dopo la selezione', async () => {
    const wrapper = mountTopBar()
    await wrapper.find('button[title="Modifica tabella"]').trigger('click')

    const buttons = wrapper.findAll('.tool-group:nth-of-type(3) .dropdown-menu button')
    expect(buttons).toHaveLength(5)

    await buttons[0]!.trigger('click')
    expect(wrapper.emitted('table-op')).toEqual([[TableOperationType.INSERT_ROW]])
    expect(wrapper.find('.tool-group:nth-of-type(3) .dropdown-menu').exists()).toBe(false)

    wrapper.unmount()
  })

  it('ciascuna voce del menu tabella emette il TableOperationType corretto', async () => {
    const wrapper = mountTopBar()
    const ops = [
      TableOperationType.INSERT_ROW,
      TableOperationType.DELETE_ROW,
      TableOperationType.INSERT_COLUMN,
      TableOperationType.DELETE_COLUMN,
      TableOperationType.DELETE_TABLE,
    ]

    for (let i = 0; i < ops.length; i++) {
      await wrapper.find('button[title="Modifica tabella"]').trigger('click')
      const buttons = wrapper.findAll('.tool-group:nth-of-type(3) .dropdown-menu button')
      await buttons[i]!.trigger('click')
    }

    expect(wrapper.emitted('table-op')).toEqual(ops.map((op) => [op]))
    wrapper.unmount()
  })
})

describe('TopBar - copia/taglia/incolla e cronologia (R2-R4-F-O, R43-R44-F-O)', () => {
  it('emette copy, cut e paste', async () => {
    const wrapper = mountTopBar()

    await wrapper.find('button[title="Copia"]').trigger('click')
    await wrapper.find('button[title="Taglia"]').trigger('click')
    await wrapper.find('button[title="Incolla"]').trigger('click')

    expect(wrapper.emitted('copy')).toHaveLength(1)
    expect(wrapper.emitted('cut')).toHaveLength(1)
    expect(wrapper.emitted('paste')).toHaveLength(1)
    wrapper.unmount()
  })

  it('undo/redo sono disabilitati quando canUndo/canRedo sono false e non emettono al click', async () => {
    const wrapper = mountTopBar({ canUndo: false, canRedo: false })

    expect(wrapper.find('button[title="Annulla"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button[title="Ripeti"]').attributes('disabled')).toBeDefined()

    await wrapper.find('button[title="Annulla"]').trigger('click')
    await wrapper.find('button[title="Ripeti"]').trigger('click')

    expect(wrapper.emitted('undo')).toBeUndefined()
    expect(wrapper.emitted('redo')).toBeUndefined()
    wrapper.unmount()
  })

  it('undo/redo emettono quando canUndo/canRedo sono true', async () => {
    const wrapper = mountTopBar({ canUndo: true, canRedo: true })

    expect(wrapper.find('button[title="Annulla"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('button[title="Ripeti"]').attributes('disabled')).toBeUndefined()

    await wrapper.find('button[title="Annulla"]').trigger('click')
    await wrapper.find('button[title="Ripeti"]').trigger('click')

    expect(wrapper.emitted('undo')).toHaveLength(1)
    expect(wrapper.emitted('redo')).toHaveLength(1)
    wrapper.unmount()
  })
})

describe('TopBar - chiusura menu (gestione stato locale dei dropdown)', () => {
  it('un click sullo sfondo della toolbar (@click.self) chiude tutti i menu aperti', async () => {
    const wrapper = mountTopBar()
    await wrapper.find('button[title="Esporta la nota"]').trigger('click')
    expect(wrapper.find('.dropdown-align-right .dropdown-menu').exists()).toBe(true)

    await wrapper.find('.topbar').trigger('click')

    expect(wrapper.find('.dropdown-align-right .dropdown-menu').exists()).toBe(false)
    wrapper.unmount()
  })

  it('un click al di fuori della toolbar (documento) chiude i menu aperti', async () => {
    const wrapper = mountTopBar()
    document.body.appendChild(wrapper.element)

    await wrapper.find('button[title="Esporta la nota"]').trigger('click')
    expect(wrapper.find('.dropdown-align-right .dropdown-menu').exists()).toBe(true)

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.dropdown-align-right .dropdown-menu').exists()).toBe(false)
    wrapper.unmount()
  })

  it('rimuove il listener sul documento allo smontaggio (nessun errore su un click successivo)', async () => {
    const wrapper = mountTopBar()
    document.body.appendChild(wrapper.element)
    wrapper.unmount()

    expect(() => document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))).not.toThrow()
  })
})

describe('TopBar - menu Assistente AI e sottomenu Sei Cappelli (R48-R68-F-O)', () => {
  it("selezionare un'operazione AI semplice emette ai-operation e richiude il menu", async () => {
    const wrapper = mountTopBar()
    await wrapper.find('.ai-button').trigger('click')

    const summarizeBtn = wrapper.findAll('.dropdown-menu button').find((b) => b.text() === 'Riassumi')
    await summarizeBtn!.trigger('click')

    expect(wrapper.emitted('ai-operation')).toEqual([['summarize']])
    expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
    wrapper.unmount()
  })

  it('selezionare un cappello emette ai-operation con il tipo "hat_analysis:colore" corretto', async () => {
    const wrapper = mountTopBar()
    await wrapper.find('.ai-button').trigger('click')
    await wrapper.find('.submenu-trigger').trigger('click')

    const redHat = wrapper.findAll('.dropdown-submenu-inline button').find((b) => b.text().includes('Rosso'))
    await redHat!.trigger('click')

    expect(wrapper.emitted('ai-operation')).toEqual([['hat_analysis:red']])
    wrapper.unmount()
  })
})
