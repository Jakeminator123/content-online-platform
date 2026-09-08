import { Script } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { assistantClient } from "../src/admin/assistant-client.js";

class Element {
  dataset: Record<string, string> = {};
  handlers = new Map<string, (event?: any) => unknown>();
  hidden = false;
  disabled = false;
  textContent = "";
  value = "";
  type = "";
  src = "";
  href = "";
  removeAttribute(name: string) { if (name === "href") this.href = ""; }
  childButton: Element | undefined;
  classList = { toggle: () => {} };
  constructor(readonly tag = "div") {}
  addEventListener(name: string, handler: (event?: any) => unknown) { this.handlers.set(name, handler); }
  emit(name: string, event?: any) { return this.handlers.get(name)?.(event); }
  setAttribute() {}
  focus() {}
  append() {}
  appendChild(_node: Element) {}
  prepend() {}
  querySelector() { return this.childButton ??= new Element("button"); }
}

function harness(mode: "delayed" | "no-api" | "script-error" = "delayed", configStatus = 200, agentUrl: string | null = "https://studio.d-id.com/agents/share?id=test-agent&key=test-browser-config") {
  const nodes = new Map<string, Element>();
  const get = (id: string) => { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id)!; };
  const scripts: Element[] = [];
  const doc = new Element();
  const body = new Element("body");
  body.dataset.mode = "admin";
  const configure = vi.fn();
  const speak = vi.fn().mockResolvedValue(undefined);
  const reload = vi.fn();
  const warn = vi.fn();
  const browser: { DID_AGENTS_API?: any; location: { reload: typeof reload } } = { location: { reload } };
  body.appendChild = (script) => {
    scripts.push(script);
    setTimeout(() => {
      if (mode === "script-error") { script.emit("error"); return; }
      // Mirrors D-ID's actual bootstrap selector, not an unconditional successful mock.
      if (mode === "delayed" && script.dataset.name === "did-agent") {
        browser.DID_AGENTS_API = {};
        setTimeout(() => { browser.DID_AGENTS_API = { configure, functions: { speak } }; }, 150);
      }
      script.emit("load");
    }, 0);
  };
  const fetch = vi.fn(async (url: string) => ({
    ok: url.endsWith("/presenter") || url.endsWith("/agent") ? configStatus === 200 : true,
    json: async () => url.endsWith("/agent")
      ? (agentUrl ? { configured: true, url: agentUrl } : { configured: false })
      : url.endsWith("/presenter")
      ? { configured: true, agentId: "test-agent", clientKey: "test-browser-config" }
      : url.endsWith("/message")
        ? { answer: "Ett syntetiskt svar.\nKällor: Pilot", sources: [], mode: "openai" }
        : { jobs: [] },
  }));
  new Script(assistantClient).runInNewContext({
    document: {
      body,
      getElementById: get,
      querySelectorAll: () => [],
      createElement: (tag: string) => new Element(tag),
      addEventListener: doc.addEventListener.bind(doc),
    },
    window: browser,
    Clerk: { session: { getToken: async () => "synthetic-test-session" } },
    fetch, setTimeout, clearTimeout, Date, AbortSignal, URL,
    console: { warn },
  });
  doc.emit("content-online:workspace-ready", { detail: { workspace: { customers: [], users: [] } } });
  return { get, scripts, browser, configure, speak, reload, warn, fetch };
}

afterEach(() => vi.useRealTimers());

describe("D-ID presenter browser lifecycle", () => {
  it("does not load D-ID before explicit activation", async () => {
    vi.useFakeTimers();
    const app = harness();
    await vi.advanceTimersByTimeAsync(200);
    expect(app.scripts).toHaveLength(0);
    expect(app.fetch.mock.calls.some(([url]) => url.endsWith("/presenter"))).toBe(false);
  });

  it("uses the bootstrap selector and waits for asynchronous API registration", async () => {
    vi.useFakeTimers();
    const app = harness();
    app.get("assistant-presenter-enable").emit("click");
    await vi.advanceTimersByTimeAsync(100);
    expect(app.scripts).toHaveLength(1);
    const script = app.scripts[0]!;
    expect(script.dataset).toMatchObject({ name: "did-agent", mode: "full", targetId: "assistant-presenter-stage", track: "false" });
    expect(script.src).toBe("https://agent.d-id.com/v2/index.js");
    expect(app.configure).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(300);
    expect(app.configure).toHaveBeenCalledWith({ showChatToggle: false, showMicToggle: false, showRestartButton: false, autoConnect: true });
    expect(app.get("assistant-presenter-enable").textContent).toBe("Röstavatar aktiv");
    expect(app.get("assistant-presenter-stage").hidden).toBe(false);
    expect(app.speak).not.toHaveBeenCalled();
  });

  it("sends only the completed answer for speech, not the question or source list", async () => {
    vi.useFakeTimers();
    const app = harness();
    app.get("assistant-presenter-enable").emit("click");
    await vi.advanceTimersByTimeAsync(400);
    app.get("assistant-input").value = "Min testfråga";
    app.get("assistant-form").emit("submit", { preventDefault() {} });
    await vi.advanceTimersByTimeAsync(10);
    expect(app.speak).toHaveBeenCalledWith({ type: "text", input: "Ett syntetiskt svar." });
  });

  it("times out safely and reloads instead of adding duplicate cached module scripts", async () => {
    vi.useFakeTimers();
    const app = harness("no-api");
    app.get("assistant-presenter-enable").emit("click");
    await vi.advanceTimersByTimeAsync(16000);
    expect(app.get("assistant-presenter-enable").disabled).toBe(false);
    expect(app.get("assistant-presenter-stage").hidden).toBe(true);
    expect(app.get("assistant-presenter-status").textContent).toContain("kunde inte initieras");
    expect(app.warn).toHaveBeenCalledWith("content_online_presenter_start_failed", { stage: "initialization" });
    app.get("assistant-presenter-enable").emit("click");
    expect(app.reload).toHaveBeenCalledOnce();
    expect(app.scripts).toHaveLength(1);
    app.get("assistant-input").value = "Text utan avatar";
    app.get("assistant-form").emit("submit", { preventDefault() {} });
    await vi.advanceTimersByTimeAsync(10);
    expect(app.fetch.mock.calls.some(([url]) => url.endsWith("/message"))).toBe(true);
    expect(app.speak).not.toHaveBeenCalled();
  });

  it("identifies script loading failures without logging credentials", async () => {
    vi.useFakeTimers();
    const app = harness("script-error");
    app.get("assistant-presenter-enable").emit("click");
    await vi.advanceTimersByTimeAsync(200);
    expect(app.get("assistant-presenter-status").textContent).toContain("skript kunde inte laddas");
    expect(app.warn.mock.calls).toEqual([["content_online_presenter_start_failed", { stage: "script" }]]);
    expect(JSON.stringify(app.warn.mock.calls)).not.toContain("test-browser-config");
  });

  it("never loads D-ID when admin configuration is denied", async () => {
    vi.useFakeTimers();
    const app = harness("delayed", 401);
    app.get("assistant-presenter-enable").emit("click");
    await vi.advanceTimersByTimeAsync(200);
    expect(app.scripts).toHaveLength(0);
    expect(app.warn).toHaveBeenCalledWith("content_online_presenter_start_failed", { stage: "config" });
    expect(app.get("assistant-presenter-enable").disabled).toBe(false);
  });
});

describe("D-ID documentation agent handoff", () => {
  it("prepares only a user-clicked link without loading D-ID or forwarding chat/session data", async () => {
    vi.useFakeTimers();
    const app = harness();
    await vi.advanceTimersByTimeAsync(200);
    expect(app.get("assistant-agent-open").hidden).toBe(false);
    expect(app.get("assistant-agent-open").href).toBe("https://studio.d-id.com/agents/share?id=test-agent&key=test-browser-config");
    expect(app.fetch.mock.calls.some(([url]) => url.endsWith("/agent"))).toBe(true);
    expect(app.fetch.mock.calls.every(([url]) => url.startsWith("/admin/api/"))).toBe(true);
    expect(app.scripts).toHaveLength(0);
    expect(app.speak).not.toHaveBeenCalled();
    expect(app.get("assistant-agent-open").href).not.toContain("synthetic-test-session");
    expect(app.warn).not.toHaveBeenCalled();
  });

  it.each([
    "https://evil.example/agents/share?id=x&key=y",
    "https://studio.d-id.com.evil.example/agents/share?id=x&key=y",
    "https://studio.d-id.com/other?id=x&key=y",
    "https://attacker@studio.d-id.com/agents/share?id=x&key=y",
    "javascript:alert(1)",
    "https://studio.d-id.com/agents/share?id=x",
  ])("rejects an unexpected handoff destination", async (url) => {
    vi.useFakeTimers();
    const app = harness("delayed", 200, url);
    await vi.advanceTimersByTimeAsync(200);
    expect(app.get("assistant-agent-open").hidden).toBe(true);
    expect(app.get("assistant-agent-open").href).toBe("");
    expect(app.get("assistant-agent-retry").hidden).toBe(false);
    expect(app.scripts).toHaveLength(0);
    expect(app.warn).not.toHaveBeenCalled();
  });

  it("keeps the text chat available when the agent link is missing", async () => {
    vi.useFakeTimers();
    const app = harness("delayed", 200, null);
    await vi.advanceTimersByTimeAsync(200);
    expect(app.get("assistant-agent-open").hidden).toBe(true);
    expect(app.get("assistant-agent-status").textContent).toContain("inte konfigurerad");
    app.get("assistant-input").value = "Vanlig dokumentfråga";
    app.get("assistant-form").emit("submit", { preventDefault() {} });
    await vi.advanceTimersByTimeAsync(10);
    expect(app.fetch.mock.calls.some(([url]) => url.endsWith("/message"))).toBe(true);
  });

  it("allows retry after an authentication/configuration failure without exposing a link", async () => {
    vi.useFakeTimers();
    const app = harness("delayed", 401);
    await vi.advanceTimersByTimeAsync(200);
    expect(app.get("assistant-agent-open").hidden).toBe(true);
    expect(app.get("assistant-agent-retry").disabled).toBe(false);
    app.get("assistant-agent-retry").emit("click");
    await vi.advanceTimersByTimeAsync(200);
    expect(app.fetch.mock.calls.filter(([url]) => url.endsWith("/agent"))).toHaveLength(2);
    expect(app.get("assistant-agent-open").href).toBe("");
    expect(app.scripts).toHaveLength(0);
  });
});
