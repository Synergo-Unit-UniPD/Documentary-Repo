import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import App from "../frontend/src/App.vue";
import MarkdownEditor from "../frontend/src/components/MarkdownEditor.vue";

// UC156: Uscita dall'applicazione con modifiche non salvate. Monta l'App.vue
// reale (Model+View+Controller+Proxy, con il solo confine di rete simulato
// tramite fetch) ed esercita l'evento nativo del browser "beforeunload".

beforeEach(() => {
  (globalThis as any).fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ status: "ok" }) });
});

describe("TS27 - Uscita con modifiche non salvate", () => {
  it("NON chiede conferma se non ci sono modifiche non salvate (stato iniziale)", async () => {
    const wrapper = mount(App);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const event = new Event("beforeunload", {
      cancelable: true,
    }) as BeforeUnloadEvent;
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);

    wrapper.unmount();
  });

  it("chiede conferma (previene il default) se ci sono modifiche non salvate", async () => {
    const wrapper = mount(App);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const editor = wrapper.findComponent(MarkdownEditor);
    await editor.vm.$emit(
      "update:modelValue",
      "testo modificato, non ancora salvato",
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.text()).toContain("Modifiche non salvate");

    const event = new Event("beforeunload", {
      cancelable: true,
    }) as BeforeUnloadEvent;
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);

    wrapper.unmount();
  });

  it("rimuove il listener allo smontaggio: dopo unmount, un beforeunload successivo non fa più nulla", async () => {
    const wrapper = mount(App);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const editor = wrapper.findComponent(MarkdownEditor);
    await editor.vm.$emit("update:modelValue", "testo modificato");
    await new Promise((resolve) => setTimeout(resolve, 0));

    wrapper.unmount();

    const event = new Event("beforeunload", {
      cancelable: true,
    }) as BeforeUnloadEvent;
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});
