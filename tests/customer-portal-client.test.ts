import { Script } from "node:vm";
import { beforeEach, describe, expect, it } from "vitest";
import { customerPortalClient } from "../src/customer-portal/client.js";

type TestEvent = {
  key?: string;
  shiftKey?: boolean;
  preventDefault: () => void;
  prevented?: boolean;
};

let activeElement: FakeNode | null = null;

class FakeClassList {
  private readonly values = new Set<string>();

  add(name: string) { this.values.add(name); }
  remove(name: string) { this.values.delete(name); }
  contains(name: string) { return this.values.has(name); }
  toggle(name: string, force?: boolean) {
    const enabled = force ?? !this.values.has(name);
    if (enabled) this.values.add(name);
    else this.values.delete(name);
    return enabled;
  }
}

class FakeNode {
  readonly attributes = new Map<string, string>();
  readonly classList = new FakeClassList();
  readonly dataset: Record<string, string> = {};
  readonly listeners = new Map<string, Array<(event: TestEvent) => void>>();
  focusables: FakeNode[] = [];
  currentNavigation: FakeNode | null = null;
  strong: FakeNode | null = null;
  hidden = false;
  disabled = false;
  textContent = "";
  type = "";
  src = "";

  addEventListener(type: string, listener: (event: TestEvent) => void) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type: string, input: Partial<TestEvent> = {}) {
    const event: TestEvent = {
      ...input,
      preventDefault() {
        event.prevented = true;
      },
    };
    for (const listener of this.listeners.get(type) ?? []) listener(event);
    return event;
  }

  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  removeAttribute(name: string) { this.attributes.delete(name); }
  hasAttribute(name: string) { return this.attributes.has(name); }
  toggleAttribute(name: string, force?: boolean) {
    const enabled = force ?? !this.attributes.has(name);
    if (enabled) this.attributes.set(name, "");
    else this.attributes.delete(name);
    return enabled;
  }
  focus() { activeElement = this; }
  animate() { return undefined; }
  remove() { return undefined; }
  contains(node: unknown) { return node === this || this.focusables.includes(node as FakeNode); }
  querySelector(selector: string) {
    if (selector.includes("data-portal-nav")) return this.currentNavigation;
    if (selector === "strong") return this.strong;
    return null;
  }
  querySelectorAll() { return this.focusables; }
}

function browserRuntime(options: { agentEnabled: boolean; mobile: boolean }) {
  const config = new FakeNode();
  config.textContent = JSON.stringify({
    sections: [{ id: "overview", label: "Överblick" }, { id: "products", label: "Produkter" }],
    contextUrl: "/context",
    tools: [],
    agentEnabled: options.agentEnabled,
    insights: null,
  });
  const overview = new FakeNode();
  overview.dataset.portalSection = "overview";
  overview.dataset.portalLabel = "Överblick";
  const products = new FakeNode();
  products.dataset.portalSection = "products";
  products.dataset.portalLabel = "Produkter";
  const overviewNav = new FakeNode();
  overviewNav.dataset.portalNav = "overview";
  overviewNav.setAttribute("aria-current", "page");
  const productsNav = new FakeNode();
  productsNav.dataset.portalNav = "products";
  productsNav.setAttribute("aria-current", "false");
  const brand = new FakeNode();
  const sidebar = new FakeNode();
  sidebar.focusables = [brand, overviewNav, productsNav];
  sidebar.currentNavigation = overviewNav;
  const scrim = new FakeNode();
  const menu = new FakeNode();
  const portalMain = new FakeNode();
  const breadcrumb = new FakeNode();
  const liveStatus = new FakeNode();
  const body = new FakeNode();
  const agentConfig = options.agentEnabled ? new FakeNode() : null;
  const agentLauncher = options.agentEnabled ? new FakeNode() : null;
  const launcherLabel = options.agentEnabled ? new FakeNode() : null;
  if (agentConfig) {
    agentConfig.dataset.agentId = "v2_agt_test";
    agentConfig.dataset.clientKey = "ck_test";
  }
  if (agentLauncher) {
    agentLauncher.strong = launcherLabel;
    if (launcherLabel) launcherLabel.textContent = "Fråga Content Online";
  }
  const didTarget = new FakeNode();
  const appendedScripts: FakeNode[] = [];
  const documentListeners = new Map<string, Array<(event: TestEvent) => void>>();

  const reducedMotion = { matches: true, addEventListener() {} };
  const mobileLayout = {
    matches: options.mobile,
    listeners: [] as Array<() => void>,
    addEventListener(_type: string, listener: () => void) { this.listeners.push(listener); },
  };
  const compactAgentLayout = { matches: false, addEventListener() {} };
  const didApi = {
    configureCalls: [] as unknown[],
    configure(value: unknown) { this.configureCalls.push(value); },
    events: { onCalls: [] as string[], on(name: string) { this.onCalls.push(name); } },
    functions: { registerClientTool() {} },
  };
  const windowObject: Record<string, any> = { scrollTo() {} };

  const nodesById: Record<string, FakeNode | null> = {
    "portal-config": config,
    "portal-sidebar": sidebar,
    "portal-scrim": scrim,
    "portal-menu": menu,
    "portal-main": portalMain,
    "portal-agent-config": agentConfig,
    "portal-agent-launcher": agentLauncher,
    "portal-breadcrumb": breadcrumb,
    "portal-live-status": liveStatus,
    "assistant-status": null,
  };
  const documentObject = {
    body,
    get activeElement() { return activeElement; },
    getElementById(id: string) { return nodesById[id] ?? null; },
    querySelectorAll(selector: string) {
      if (selector === "[data-portal-section]") return [overview, products];
      if (selector === "[data-portal-nav]") return [overviewNav, productsNav];
      return [];
    },
    querySelector(selector: string) {
      if (selector.startsWith(".didagent_target")) return didTarget;
      return null;
    },
    createElement() { return new FakeNode(); },
    addEventListener(type: string, listener: (event: TestEvent) => void) {
      const listeners = documentListeners.get(type) ?? [];
      listeners.push(listener);
      documentListeners.set(type, listeners);
    },
  };
  (body as FakeNode & { append: (node: FakeNode) => void }).append = (node) => {
    appendedScripts.push(node);
    windowObject.DID_AGENTS_API = didApi;
    node.dispatch("load");
  };

  const context = {
    document: documentObject,
    window: windowObject,
    location: { hash: "" },
    history: { replaceState() {} },
    fetch: async () => ({ ok: true, json: async () => ({}) }),
    matchMedia(query: string) {
      if (query.includes("980")) return mobileLayout;
      if (query.includes("640")) return compactAgentLayout;
      return reducedMotion;
    },
    addEventListener() {},
    queueMicrotask(callback: () => void) { callback(); },
    setInterval(callback: () => void) { Promise.resolve().then(callback); return 1; },
    clearInterval() {},
  };

  new Script(customerPortalClient).runInNewContext(context);
  const keydown = (input: Partial<TestEvent>) => {
    const event: TestEvent = { ...input, preventDefault() { event.prevented = true; } };
    for (const listener of documentListeners.get("keydown") ?? []) listener(event);
    return event;
  };
  return {
    agentLauncher,
    appendedScripts,
    brand,
    didApi,
    didTarget,
    keydown,
    menu,
    mobileLayout,
    overviewNav,
    portalMain,
    productsNav,
    sidebar,
  };
}

describe("customer portal client interactions", () => {
  beforeEach(() => { activeElement = null; });

  it("traps mobile navigation focus, blocks the page, and restores focus", () => {
    const runtime = browserRuntime({ agentEnabled: false, mobile: true });
    runtime.menu.dispatch("click");

    expect(runtime.portalMain.hasAttribute("inert")).toBe(true);
    expect(runtime.sidebar.attributes.get("role")).toBe("dialog");
    expect(runtime.sidebar.attributes.get("aria-modal")).toBe("true");
    expect(activeElement).toBe(runtime.overviewNav);

    runtime.productsNav.focus();
    expect(runtime.keydown({ key: "Tab" }).prevented).toBe(true);
    expect(activeElement).toBe(runtime.brand);
    expect(runtime.keydown({ key: "Tab", shiftKey: true }).prevented).toBe(true);
    expect(activeElement).toBe(runtime.productsNav);

    expect(runtime.keydown({ key: "Escape" }).prevented).toBe(true);
    expect(runtime.portalMain.hasAttribute("inert")).toBe(false);
    expect(runtime.sidebar.hasAttribute("inert")).toBe(true);
    expect(activeElement).toBe(runtime.menu);
  });

  it("moves desktop-navigation focus before making the sidebar inert", () => {
    const runtime = browserRuntime({ agentEnabled: false, mobile: false });
    runtime.brand.focus();
    runtime.mobileLayout.matches = true;
    runtime.mobileLayout.listeners.forEach((listener) => listener());

    expect(runtime.sidebar.hasAttribute("inert")).toBe(true);
    expect(activeElement).toBe(runtime.menu);
  });

  it("injects and focuses the D-ID embed only after one deliberate click", async () => {
    const runtime = browserRuntime({ agentEnabled: true, mobile: false });
    expect(runtime.appendedScripts).toHaveLength(0);

    runtime.agentLauncher!.focus();
    runtime.agentLauncher!.dispatch("click");
    await Promise.resolve();
    runtime.agentLauncher!.dispatch("click");

    expect(runtime.appendedScripts).toHaveLength(1);
    expect(runtime.appendedScripts[0]!.src).toBe("https://agent.d-id.com/v2/index.js");
    expect(runtime.appendedScripts[0]!.dataset.openMode).toBe("expanded");
    expect(runtime.didApi.events.onCalls).toEqual(["connection"]);
    expect(activeElement).toBe(runtime.didTarget);
    expect(runtime.agentLauncher!.hidden).toBe(true);
  });
});
