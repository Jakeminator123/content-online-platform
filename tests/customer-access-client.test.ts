import { Script } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { customerAccessClient } from "../src/customer-portal/access-client.js";

type Entry = {
  organizationId: string;
  organizationName: string;
  slug: string;
  displayName: string;
  role: "customer_reader" | "customer_admin";
};

type FakeNode = {
  hidden: boolean;
  textContent: string;
  className: string;
  href: string;
  dataset: Record<string, string>;
  children: FakeNode[];
  addEventListener: ReturnType<typeof vi.fn>;
  append: (...children: FakeNode[]) => void;
  replaceChildren: (...children: FakeNode[]) => void;
};

function fakeNode(): FakeNode {
  const node: FakeNode = {
    hidden: false,
    textContent: "",
    className: "",
    href: "",
    dataset: {},
    children: [],
    addEventListener: vi.fn(),
    append: (...children) => { node.children.push(...children); },
    replaceChildren: (...children) => { node.children = [...children]; },
  };
  return node;
}

async function runClient(
  entries: Entry[],
  search = "",
  authenticated = true,
  overlay = false,
  loadImplementation: () => Promise<void> = async () => undefined,
) {
  const elements = {
    "customer-access": fakeNode(),
    "customer-access-message": fakeNode(),
    "customer-auth-widget": fakeNode(),
    "portal-chooser": fakeNode(),
    "portal-entry-list": fakeNode(),
    "customer-account": fakeNode(),
    "customer-sign-out": fakeNode(),
  };
  elements["portal-chooser"].hidden = true;
  elements["customer-account"].hidden = true;
  elements["customer-sign-out"].hidden = true;
  if (overlay) {
    elements["customer-access"].dataset.customerAccessMode = "login";
    elements["customer-access"].dataset.customerAccessAutostart = "false";
    elements["customer-access"].dataset.customerAccessReturnUrl = "/?login=1";
  }

  const created: FakeNode[] = [];
  const document = {
    body: { dataset: { customerAccessMode: "login" } },
    getElementById: (id: keyof typeof elements) => elements[id] ?? null,
    createElement: () => {
      const node = fakeNode();
      created.push(node);
      return node;
    },
  };
  const replace = vi.fn();
  const location = {
    href: `https://content-online-platform.vercel.app${overlay ? "/" : "/login"}${search}`,
    pathname: overlay ? "/" : "/login",
    search,
    replace,
  };
  const getToken = vi.fn(async () => "customer-session-token");
  const Clerk = {
    load: vi.fn(loadImplementation),
    session: authenticated ? { getToken } : null,
    signOut: vi.fn(),
    mountSignIn: vi.fn(),
    mountSignUp: vi.fn(),
  };
  const fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ entries }),
  }));
  const windowListeners = new Map<string, () => void>();
  const addEventListener = vi.fn((event: string, listener: () => void) => {
    windowListeners.set(event, listener);
  });

  new Script(customerAccessClient).runInNewContext({
    Clerk,
    URL,
    document,
    fetch,
    location,
    window: { __internal_ClerkUICtor: function ClerkUI() {}, addEventListener },
  });
  await new Promise<void>((resolve) => setImmediate(resolve));

  return { Clerk, created, elements, fetch, getToken, replace, windowListeners };
}

const alpha: Entry = {
  organizationId: "customer-alpha",
  organizationName: "Alpha University",
  slug: "alpha",
  displayName: "Alpha User",
  role: "customer_reader",
};
const beta: Entry = {
  organizationId: "customer-beta",
  organizationName: "Beta Institute",
  slug: "beta",
  displayName: "Beta User",
  role: "customer_admin",
};

describe("customer portal access client", () => {
  it("redirects a sole membership only to the slug returned by the server", async () => {
    const result = await runClient([alpha]);

    expect(result.Clerk.load).toHaveBeenCalledWith(expect.objectContaining({
      signInUrl: "/login",
      signUpUrl: "/registrera",
      signInForceRedirectUrl: "/login",
      signUpForceRedirectUrl: "/login",
    }));
    expect(result.replace).toHaveBeenCalledOnce();
    expect(result.replace).toHaveBeenCalledWith("/portal/alpha");
    expect(result.getToken).toHaveBeenCalledOnce();
    expect(result.fetch).toHaveBeenCalledWith("/v1/portal-entries", {
      headers: { Authorization: "Bearer customer-session-token" },
      cache: "no-store",
      credentials: "omit",
    });
  });

  it("does not redirect to an unknown requested slug and offers only server-returned entries", async () => {
    const requested = "private-unlisted-slug";
    const result = await runClient([alpha], `?portal=${requested}`);

    expect(result.replace).not.toHaveBeenCalled();
    expect(result.elements["portal-chooser"].hidden).toBe(false);
    expect(result.elements["customer-access-message"].textContent).toBe(
      "Den efterfrågade portalen ingår inte i kontots åtkomst. Välj en tillgänglig portal.",
    );
    const links = result.elements["portal-entry-list"].children;
    expect(links.map((link) => link.href)).toEqual(["/portal/alpha"]);
    expect(JSON.stringify({ links, message: result.elements["customer-access-message"].textContent }))
      .not.toContain(requested);
  });

  it("shows a chooser for multiple memberships instead of choosing a tenant in the browser", async () => {
    const result = await runClient([alpha, beta]);

    expect(result.replace).not.toHaveBeenCalled();
    expect(result.elements["portal-chooser"].hidden).toBe(false);
    expect(result.elements["customer-access-message"].textContent).toBe("Välj organisation.");
    const links = result.elements["portal-entry-list"].children;
    expect(links.map((link) => link.href)).toEqual(["/portal/alpha", "/portal/beta"]);
    expect(links.map((link) => link.children[0]?.textContent)).toEqual(["Alpha University", "Beta Institute"]);
    expect(links.map((link) => link.children[1]?.textContent)).toEqual(["Läsare", "Kundadministratör"]);
  });

  it("honors a requested portal only when the server includes that exact slug", async () => {
    const result = await runClient([alpha, beta], "?portal=beta");

    expect(result.replace).toHaveBeenCalledOnce();
    expect(result.replace).toHaveBeenCalledWith("/portal/beta");
  });

  it("mounts customer sign-in on the dedicated path and signs out back to it", async () => {
    const result = await runClient([], "", false);

    expect(result.Clerk.mountSignIn).toHaveBeenCalledOnce();
    expect(result.Clerk.mountSignIn.mock.calls[0]?.[1]).toEqual(expect.objectContaining({
      signInUrl: "/login",
      signUpUrl: "/registrera",
      forceRedirectUrl: "/login",
      fallbackRedirectUrl: "/login",
      appearance: {
        elements: {
          headerTitle: { display: "none" },
          headerSubtitle: { display: "none" },
        },
      },
    }));
    const signOutListener = result.elements["customer-sign-out"].addEventListener.mock.calls
      .find(([event]) => event === "click")?.[1] as (() => void) | undefined;
    expect(signOutListener).toBeTypeOf("function");
    signOutListener?.();
    expect(result.Clerk.signOut).toHaveBeenCalledWith({ redirectUrl: "/login" });
  });

  it("defers the root overlay sign-in until it is opened and starts only once", async () => {
    const result = await runClient([], "?login=1", false, true);

    expect(result.Clerk.load).not.toHaveBeenCalled();
    expect(result.Clerk.mountSignIn).not.toHaveBeenCalled();

    const open = result.windowListeners.get("customer-access:open");
    expect(open).toBeTypeOf("function");
    result.elements["customer-access"].dataset.customerAccessRequested = "true";
    open?.();
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(result.Clerk.load).toHaveBeenCalledOnce();
    expect(result.Clerk.load).toHaveBeenCalledWith(expect.objectContaining({
      signInForceRedirectUrl: "/?login=1",
      signUpForceRedirectUrl: "/?login=1",
    }));
    expect(result.Clerk.mountSignIn).toHaveBeenCalledOnce();
    expect(result.Clerk.mountSignIn.mock.calls[0]?.[1]).toEqual(expect.objectContaining({
      forceRedirectUrl: "/?login=1",
      fallbackRedirectUrl: "/?login=1",
    }));

    open?.();
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(result.Clerk.load).toHaveBeenCalledOnce();
    expect(result.Clerk.mountSignIn).toHaveBeenCalledOnce();
  });

  it("preserves a validated portal preference across the overlay authentication return", async () => {
    const result = await runClient([alpha, beta], "?portal=beta", false, true);
    const open = result.windowListeners.get("customer-access:open");
    result.elements["customer-access"].dataset.customerAccessRequested = "true";
    open?.();
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(result.Clerk.load).toHaveBeenCalledWith(expect.objectContaining({
      signInForceRedirectUrl: "/?login=1&portal=beta",
      signUpForceRedirectUrl: "/?login=1&portal=beta",
    }));
    expect(result.Clerk.mountSignIn.mock.calls[0]?.[1]).toEqual(expect.objectContaining({
      forceRedirectUrl: "/?login=1&portal=beta",
      fallbackRedirectUrl: "/?login=1&portal=beta",
    }));
  });

  it("cancels an in-flight overlay login when the dialog closes", async () => {
    let finishLoading: (() => void) | undefined;
    const pendingLoad = new Promise<void>((resolve) => { finishLoading = resolve; });
    const result = await runClient([alpha], "?login=1", true, true, () => pendingLoad);
    const open = result.windowListeners.get("customer-access:open");
    const close = result.windowListeners.get("customer-access:close");

    result.elements["customer-access"].dataset.customerAccessRequested = "true";
    open?.();
    expect(result.Clerk.load).toHaveBeenCalledOnce();

    result.elements["customer-access"].dataset.customerAccessRequested = "false";
    close?.();
    finishLoading?.();
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(result.getToken).not.toHaveBeenCalled();
    expect(result.fetch).not.toHaveBeenCalled();
    expect(result.replace).not.toHaveBeenCalled();
  });
});
