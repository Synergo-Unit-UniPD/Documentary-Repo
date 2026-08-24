import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import App from "../frontend/src/App.vue";
import MarkdownEditor from "../frontend/src/components/MarkdownEditor.vue";

// UC157: Apertura di un link dalla nota. Monta l'App.vue reale
// (Model+View+Controller+Proxy, con il solo confine di rete simulato tramite
// fetch) ed esercita il click su un collegamento renderizzato nell'anteprima.

beforeEach(() => {
  (globalThis as any).fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ status: "ok" }) });
});

describe("TS28 - Apertura di un link dalla nota", () => {
  it("un link con schema assoluto (https://) si apre in una nuova scheda, senza navigare via dalla SPA", async () => {
    const windowOpenSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);

    const wrapper = mount(App);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const editor = wrapper.findComponent(MarkdownEditor);
    await editor.vm.$emit(
      "update:modelValue",
      "[esempio](https://example.com)",
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    const link = wrapper.find(".preview-content a");
    expect(link.exists()).toBe(true);

    await link.trigger("click");

    expect(windowOpenSpy).toHaveBeenCalledWith(
      "https://example.com",
      "_blank",
      "noopener,noreferrer",
    );

    windowOpenSpy.mockRestore();
    wrapper.unmount();
  });

  it("un link senza schema (es. [ciao](ciao)) NON naviga da nessuna parte e mostra un avviso neutro, invece di ricaricare la pagina", async () => {
    const windowOpenSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);

    const wrapper = mount(App);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const editor = wrapper.findComponent(MarkdownEditor);
    await editor.vm.$emit("update:modelValue", "[ciao](ciao)");
    await new Promise((resolve) => setTimeout(resolve, 0));

    const link = wrapper.find(".preview-content a");
    expect(link.exists()).toBe(true);
    expect(link.attributes("href")).toBe("ciao");

    await link.trigger("click");

    // Nessuna navigazione, né in una nuova scheda né sulla pagina corrente.
    expect(windowOpenSpy).not.toHaveBeenCalled();
    expect(wrapper.find(".toast").exists()).toBe(true);
    expect(wrapper.find(".toast").classes()).toContain("info");

    windowOpenSpy.mockRestore();
    wrapper.unmount();
  });
});
