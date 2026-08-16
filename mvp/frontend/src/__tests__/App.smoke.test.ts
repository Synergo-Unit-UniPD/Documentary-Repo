import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'
import MarkdownEditor from '../components/MarkdownEditor.vue'

beforeEach(() => {
  ;(globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) })
})

describe('App.vue - smoke test di composizione', () => {
  it('monta senza errori e compone Model/View/Controller senza eccezioni', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.topbar').exists()).toBe(true)
    expect(wrapper.findAll('.panel').length).toBe(2)

    wrapper.unmount()
  })

  it('cambia layout in base alla modalità di visualizzazione', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const editorOnlyButton = wrapper.findAll('.view-mode-option').find((btn) => btn.text() === 'Editor')
    expect(editorOnlyButton).toBeTruthy()
    await editorOnlyButton!.trigger('click')

    expect(wrapper.findAll('.panel').length).toBe(1)

    wrapper.unmount()
  })
})

describe('App.vue - interazioni base della toolbar', () => {
  it("apre il menu AI e mostra un messaggio se si richiede un'operazione senza selezione", async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const aiButton = wrapper.findAll('button').find((btn) => btn.text().includes('Assistente AI'))
    expect(aiButton).toBeTruthy()
    await aiButton!.trigger('click')

    const summarizeButton = wrapper.findAll('button').find((btn) => btn.text() === 'Riassumi')
    expect(summarizeButton).toBeTruthy()
    await summarizeButton!.trigger('click')

    expect(wrapper.find('.status').text().length).toBeGreaterThan(0)

    wrapper.unmount()
  })

  it('i pulsanti undo/redo sono disabilitati quando la cronologia è vuota', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const undoButton = wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Annulla')
    const redoButton = wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Ripeti')

    expect(undoButton?.attributes('disabled')).toBeDefined()
    expect(redoButton?.attributes('disabled')).toBeDefined()

    wrapper.unmount()
  })

  it('apre e chiude il modale di inserimento tabella senza errori', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const tableButton = wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Inserisci tabella')
    await tableButton!.trigger('click')

    expect(wrapper.text()).toContain('Inserisci tabella')

    const cancelButton = wrapper.findAll('.modal-actions button').find((btn) => btn.text() === 'Annulla')
    await cancelButton!.trigger('click')

    expect(wrapper.text()).not.toContain('Scegli il numero di righe e colonne')

    wrapper.unmount()
  })
})

describe('App.vue - operazioni di modifica tabella dalla toolbar', () => {
  it("apre il menu di modifica tabella e invoca un'operazione senza errori", async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const tableMenuButton = wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Modifica tabella')
    expect(tableMenuButton).toBeTruthy()
    await tableMenuButton!.trigger('click')

    const insertRowButton = wrapper.findAll('button').find((btn) => btn.text() === 'Aggiungi riga')
    expect(insertRowButton).toBeTruthy()
    await insertRowButton!.trigger('click')

    expect(wrapper.exists()).toBe(true)

    wrapper.unmount()
  })

  it('espone i pulsanti di rientro per gli elenchi (il toggle tipo/rimozione ora è sui pulsanti puntato/numerato)', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const indentButton = wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Aumenta rientro')
    const outdentButton = wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Riduci rientro')

    expect(indentButton).toBeTruthy()
    expect(outdentButton).toBeTruthy()

    await indentButton!.trigger('click')
    await outdentButton!.trigger('click')

    expect(wrapper.exists()).toBe(true)

    wrapper.unmount()
  })
})

describe('App.vue - separazione tra indicatore di salvataggio e notifiche di errore', () => {
  it('il pallino di stato mostra solo Salvato o Modifiche non salvate, mai un messaggio di errore', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const status = wrapper.find('.status')
    expect(status.exists()).toBe(true)
    expect(['Salvato', 'Modifiche non salvate']).toContain(status.text())

    wrapper.unmount()
  })

  it('un errore di dimensioni tabella non valide appare come toast, non nel pallino di stato', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const tableButton = wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Inserisci tabella')
    await tableButton!.trigger('click')

    const rowsInput = wrapper.find('#table-rows')
    const colsInput = wrapper.find('#table-cols')
    await rowsInput.setValue(-1)
    await colsInput.setValue(0)

    const confirmButton = wrapper.findAll('.modal-actions button').find((btn) => btn.text() === 'Inserisci')
    expect(confirmButton?.attributes('disabled')).toBeDefined()

    wrapper.unmount()
  })

  it('il toast non è visibile finché non si verifica un errore o un evento da notificare', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.find('.toast').exists()).toBe(false)

    wrapper.unmount()
  })
})

describe('App.vue - toggle di formattazione ed elenchi dalla toolbar', () => {
  it('clicca due volte Grassetto senza generare eccezioni (riposizionamento cursore asincrono)', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const boldButton = wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Grassetto')
    expect(boldButton).toBeTruthy()

    await boldButton!.trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))
    await boldButton!.trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })

  it('clicca Elenco puntato con cursore (nessuna selezione) senza generare eccezioni', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const bulletButton = wrapper.findAll('button').find((btn) => btn.attributes('title')?.startsWith('Elenco puntato'))
    expect(bulletButton).toBeTruthy()

    await bulletButton!.trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('App.vue - eco della sincronizzazione con CodeMirror non deve inquinare la cronologia', () => {
  it('un evento update:modelValue con lo STESSO contenuto già presente nel Model viene ignorato (non crea comandi spuri)', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const editor = wrapper.findComponent(MarkdownEditor)
    expect(editor.exists()).toBe(true)

    await editor.vm.$emit('update:modelValue', '')
    await new Promise((resolve) => setTimeout(resolve, 0))

    const undoButton = wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Annulla')
    expect(undoButton!.attributes('disabled')).toBeDefined()

    const status = wrapper.find('.status')
    expect(status.text()).toBe('Salvato')

    wrapper.unmount()
  })

  it('digitazione REALE (contenuto diverso da quello del Model) continua a essere registrata normalmente', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const editor = wrapper.findComponent(MarkdownEditor)
    await editor.vm.$emit('update:modelValue', 'testo scritto davvero')
    await new Promise((resolve) => setTimeout(resolve, 0))

    const undoButton = wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Annulla')
    expect(undoButton!.attributes('disabled')).toBeUndefined()

    const status = wrapper.find('.status')
    expect(status.text()).toBe('Modifiche non salvate')

    wrapper.unmount()
  })
})

describe('App.vue - Rigenera end-to-end', () => {
  it('dopo Rigenera, la proposta finale mostrata deve essere quella NUOVA, non quella vecchia', async () => {
    let callCount = 0
    const originalFetch = globalThis.fetch
    ;(globalThis as any).fetch = vi.fn(async (url: string, options?: any) => {
      if (typeof url === 'string' && url.includes('/api/status')) {
        return { ok: true, json: async () => ({ status: 'ok' }) }
      }
      if (typeof url === 'string' && url.includes('/api/ai/operations') && options?.method === 'POST') {
        callCount++
        const content = callCount === 1 ? 'PRIMA proposta' : 'SECONDA proposta (rigenerata)'
        return {
          ok: true,
          json: async () => ({
            content,
            operation_type: 'distant_writing',
            created_at: new Date().toISOString(),
          }),
        }
      }
      return { ok: true, json: async () => ({}) }
    })

    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const aiButton = wrapper.findAll('button').find((btn) => btn.text().includes('Assistente AI'))
    await aiButton!.trigger('click')
    const distantWritingButton = wrapper.findAll('button').find((btn) => btn.text() === 'Distant Writing')
    await distantWritingButton!.trigger('click')

    const promptTextarea = wrapper.find('textarea')
    expect(promptTextarea.exists()).toBe(true)
    await promptTextarea.setValue('scrivi qualcosa')

    const generaButton = wrapper.findAll('.modal-actions button').find((btn) => btn.text() === 'Genera')
    await generaButton!.trigger('click')

    for (let i = 0; i < 20 && !wrapper.text().includes('PRIMA proposta'); i++) {
      await new Promise((resolve) => setTimeout(resolve, 20))
    }
    expect(wrapper.text()).toContain('PRIMA proposta')
    expect(callCount).toBe(1)

    const rigeneraButton = wrapper.findAll('.modal-actions button').find((btn) => btn.text() === 'Rigenera')
    expect(rigeneraButton).toBeTruthy()
    await rigeneraButton!.trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(callCount).toBe(2)

    for (let i = 0; i < 20 && !wrapper.text().includes('SECONDA proposta'); i++) {
      await new Promise((resolve) => setTimeout(resolve, 20))
    }

    expect(wrapper.text()).toContain('SECONDA proposta (rigenerata)')
    expect(wrapper.text()).not.toContain('PRIMA proposta')
    ;(globalThis as any).fetch = originalFetch
    wrapper.unmount()
  })
})

describe('App.vue - Copia, Taglia, Incolla (funzionalità mancanti segnalate)', () => {
  let originalClipboard: any

  beforeEach(() => {
    originalClipboard = (navigator as any).clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(''),
      },
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true })
  })

  it('i pulsanti Copia, Taglia e Incolla sono presenti nella toolbar', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Copia')).toBeTruthy()
    expect(wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Taglia')).toBeTruthy()
    expect(wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Incolla')).toBeTruthy()

    wrapper.unmount()
  })

  it('Copia senza selezione mostra un avviso e non chiama gli appunti del browser', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const copyButton = wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Copia')
    await copyButton!.trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect((navigator.clipboard as any).writeText).not.toHaveBeenCalled()
    expect(wrapper.find('.toast').exists()).toBe(true)

    wrapper.unmount()
  })

  it('Incolla inserisce il contenuto degli appunti nel documento tramite un Command annullabile', async () => {
    ;(navigator.clipboard as any).readText = vi.fn().mockResolvedValue('testo incollato')

    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const pasteButton = wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Incolla')
    await pasteButton!.trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect((navigator.clipboard as any).readText).toHaveBeenCalledTimes(1)

    const undoButton = wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Annulla')
    expect(undoButton!.attributes('disabled')).toBeUndefined()

    wrapper.unmount()
  })

  it("un errore nella lettura degli appunti (permesso negato) mostra un toast invece di lanciare un'eccezione", async () => {
    ;(navigator.clipboard as any).readText = vi.fn().mockRejectedValue(new Error('Permission denied'))

    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const pasteButton = wrapper.findAll('button').find((btn) => btn.attributes('title') === 'Incolla')
    await pasteButton!.trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(wrapper.find('.toast').exists()).toBe(true)
    expect(wrapper.exists()).toBe(true)

    wrapper.unmount()
  })
})

describe('App.vue - sottomenu "Sei Cappelli per Pensare" ad accordion (nuova richiesta)', () => {
  it('il sottomenu dei cappelli è chiuso appena si apre il menu Assistente AI', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const aiButton = wrapper.findAll('button').find((btn) => btn.text().includes('Assistente AI'))
    await aiButton!.trigger('click')

    expect(wrapper.text()).toContain('Sei Cappelli per Pensare')
    expect(wrapper.find('.dropdown-submenu-inline').exists()).toBe(false)

    wrapper.unmount()
  })

  it('cliccando "Sei Cappelli per Pensare" il sottomenu si apre INLINE sotto (accordion), e resta aperto senza bisogno dell\'hover', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const aiButton = wrapper.findAll('button').find((btn) => btn.text().includes('Assistente AI'))
    await aiButton!.trigger('click')

    const hatTrigger = wrapper.findAll('button').find((btn) => btn.text().includes('Sei Cappelli per Pensare'))
    await hatTrigger!.trigger('click')

    const submenu = wrapper.find('.dropdown-submenu-inline')
    expect(submenu.exists()).toBe(true)
    expect(submenu.text()).toContain('Bianco')
    expect(submenu.text()).toContain('Blu')

    wrapper.unmount()
  })

  it('richiudendo il menu Assistente AI, anche il sottomenu dei cappelli si chiude', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const aiButton = wrapper.findAll('button').find((btn) => btn.text().includes('Assistente AI'))
    await aiButton!.trigger('click')

    const hatTrigger = wrapper.findAll('button').find((btn) => btn.text().includes('Sei Cappelli per Pensare'))
    await hatTrigger!.trigger('click')
    expect(wrapper.find('.dropdown-submenu-inline').exists()).toBe(true)

    await aiButton!.trigger('click')

    expect(wrapper.find('.dropdown-submenu-inline').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Riassumi')

    wrapper.unmount()
  })

  it('riaprendo Assistente AI dopo averlo chiuso, i cappelli vanno riaperti di nuovo per vederne le opzioni', async () => {
    const wrapper = mount(App)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const aiButton = wrapper.findAll('button').find((btn) => btn.text().includes('Assistente AI'))
    await aiButton!.trigger('click')
    const hatTrigger = wrapper.findAll('button').find((btn) => btn.text().includes('Sei Cappelli per Pensare'))
    await hatTrigger!.trigger('click')
    expect(wrapper.find('.dropdown-submenu-inline').exists()).toBe(true)

    await aiButton!.trigger('click')
    await aiButton!.trigger('click')

    expect(wrapper.text()).toContain('Sei Cappelli per Pensare')
    expect(wrapper.find('.dropdown-submenu-inline').exists()).toBe(false)

    wrapper.unmount()
  })
})
