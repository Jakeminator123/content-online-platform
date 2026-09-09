import { Script } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { customerLandingClient } from "../src/customer-landing/client.js";

class FakeElement {
  readonly dataset: Record<string, string> = {};
  readonly style = { transform: "", borderRadius: "", opacity: "", setProperty: vi.fn() };
  readonly classList = { add: vi.fn() };
  readonly listeners = new Map<string, (...args: unknown[]) => void>();
  readonly attributes = new Map<string, string>();
  readonly focus = vi.fn();
  hidden = false;
  inert = false;
  open = false;
  textContent = "";
  firstLink: FakeElement | null = null;
  label: FakeElement | null = null;
  children: FakeElement[] = [];

  addEventListener(event: string, listener: (...args: unknown[]) => void) {
    this.listeners.set(event, listener);
  }

  querySelector(selector: string) {
    if (selector === ".sr-only") return this.label;
    if (selector === "a") return this.firstLink;
    return null;
  }

  querySelectorAll() { return []; }
  contains(element: FakeElement) { return this.children.includes(element); }
  closest() { return null; }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  showModal() { this.open = true; }
  close() { this.open = false; }
}

describe("customer landing login overlay", () => {
  it("restores focus to the menu button when login was opened from the full-screen menu", () => {
    const root = new FakeElement();
    const body = new FakeElement();
    const menu = new FakeElement();
    const menuButton = new FakeElement();
    const menuLabel = new FakeElement();
    const menuLogin = new FakeElement();
    const main = new FakeElement();
    const footer = new FakeElement();
    const dialog = new FakeElement();
    const access = new FakeElement();
    menuButton.label = menuLabel;
    menuButton.setAttribute("aria-expanded", "true");
    menu.firstLink = menuLogin;
    menu.children = [menuLogin];

    const elements: Record<string, FakeElement | null> = {
      "landing-header": null,
      "landing-nav": menu,
      "landing-menu-button": menuButton,
      "main-content": main,
      contact: footer,
      "customer-login-dialog": dialog,
      "customer-access": access,
      "landing-portrait": null,
      "landing-hero-reveal": null,
      "landing-clean-frame": null,
      "landing-clean-canvas": null,
    };
    const document = {
      documentElement: root,
      body,
      activeElement: menuLogin,
      hidden: false,
      getElementById: (id: string) => elements[id] ?? null,
      querySelector: () => null,
      querySelectorAll: (selector: string) => selector === "[data-customer-login]" ? [menuLogin] : [],
      addEventListener: vi.fn(),
    };
    const replaceState = vi.fn();
    const dispatchEvent = vi.fn();
    const windowListeners = new Map<string, (...args: unknown[]) => void>();
    const window = {
      history: { replaceState },
      innerHeight: 844,
      innerWidth: 390,
      scrollY: 0,
      matchMedia: () => ({ matches: false, addEventListener: vi.fn() }),
      requestAnimationFrame: vi.fn(),
      cancelAnimationFrame: vi.fn(),
      addEventListener: (event: string, listener: (...args: unknown[]) => void) => windowListeners.set(event, listener),
      dispatchEvent,
    };

    new Script(customerLandingClient).runInNewContext({
      URL,
      Event: class { constructor(readonly type: string) {} },
      Element: FakeElement,
      HTMLButtonElement: FakeElement,
      HTMLCanvasElement: class {},
      HTMLImageElement: FakeElement,
      IntersectionObserver: undefined,
      document,
      location: { href: "https://content-online-platform.vercel.app/" },
      performance: { now: () => 0 },
      window,
    });

    const click = menuLogin.listeners.get("click");
    const preventDefault = vi.fn();
    click?.({ currentTarget: menuLogin, preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
    expect(menu.dataset.open).toBe("false");

    dialog.listeners.get("close")?.();
    expect(menuButton.focus).toHaveBeenCalledOnce();
    expect(menuLogin.focus).not.toHaveBeenCalled();
    expect(access.dataset.customerAccessRequested).toBe("false");
    expect(dispatchEvent.mock.calls.map(([event]) => event.type)).toContain("customer-access:close");
  });
});
