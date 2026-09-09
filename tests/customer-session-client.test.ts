import { Script } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { customerSessionClient } from "../src/customer-portal/session-client.js";

type Entry = {
  slug: string;
  organizationId?: string;
  organizationName?: string;
  displayName?: string;
  role?: string;
};

type FakeNode = {
  hidden: boolean;
  textContent: string;
  dataset: Record<string, string>;
};

function fakeNode(hidden = false): FakeNode {
  return { hidden, textContent: "", dataset: {} };
}

type HarnessOptions = {
  slug?: string;
  dataMode?: string;
  pathname?: string;
  entries?: Entry[];
  responseStatus?: number;
  clerkSession?: boolean;
  clerkFailure?: boolean;
  fetchFailure?: boolean;
};

async function runClient(options: HarnessOptions = {}) {
  const slug = options.slug ?? "alpha";
  const body = fakeNode();
  body.dataset.customerSlug = slug;
  body.dataset.dataMode = options.dataMode ?? "locked";
  body.dataset.portalAccess = "locked";

  const authenticatedOnly = [fakeNode(true), fakeNode(true)];
  const lockedOnly = [fakeNode(false), fakeNode(false)];
  const footer = fakeNode();
  const footerStatus = fakeNode();
  footerStatus.textContent = "Inloggning krävs";
  const liveStatus = fakeNode();
  const memberNames = [fakeNode(), fakeNode()];
  const memberRoles = [fakeNode(), fakeNode()];
  const memberInitials = [fakeNode(), fakeNode()];
  const document = {
    body,
    querySelectorAll: (selector: string) => selector === "[data-authenticated-only]"
      ? authenticatedOnly
      : selector === "[data-locked-only]"
        ? lockedOnly
        : selector === "[data-portal-member-name]"
          ? memberNames
          : selector === "[data-portal-member-role]"
            ? memberRoles
            : selector === "[data-portal-member-initials]"
              ? memberInitials
              : [],
    querySelector: (selector: string) => selector === ".sidebar-footer"
      ? footer
      : selector === "[data-portal-access-status]"
        ? footerStatus
        : null,
    getElementById: (id: string) => id === "portal-live-status" ? liveStatus : null,
  };

  const load = options.clerkFailure
    ? vi.fn(async () => { throw new Error("identity provider unavailable"); })
    : vi.fn(async () => undefined);
  const getToken = vi.fn(async () => "customer-session-token");
  const Clerk = {
    load,
    session: options.clerkSession === false ? null : { getToken },
  };
  const status = options.responseStatus ?? 200;
  const fetch = options.fetchFailure
    ? vi.fn(async () => { throw new Error("portal directory unavailable"); })
    : vi.fn(async () => ({
        ok: status >= 200 && status < 300,
        status,
        json: async () => ({ entries: options.entries ?? [] }),
      }));

  new Script(customerSessionClient).runInNewContext({
    Clerk,
    document,
    fetch,
    location: { pathname: options.pathname ?? `/portal/${slug}` },
  });
  await new Promise<void>((resolve) => setImmediate(resolve));

  return {
    authenticatedOnly,
    body,
    fetch,
    footer,
    footerStatus,
    getToken,
    liveStatus,
    load,
    lockedOnly,
    memberInitials,
    memberNames,
    memberRoles,
  };
}

function expectLocked(result: Awaited<ReturnType<typeof runClient>>) {
  expect(result.body.dataset.portalAccess).toBe("locked");
  expect(result.authenticatedOnly.every((node) => node.hidden)).toBe(true);
  expect(result.lockedOnly.every((node) => !node.hidden)).toBe(true);
  expect(result.footerStatus.textContent).toBe("Inloggning krävs");
  expect(result.liveStatus.textContent).toBe("");
}

describe("canonical customer portal session client", () => {
  it("marks the portal authenticated only for an exact server-returned slug", async () => {
    const result = await runClient({
      entries: [{ slug: "alpha", organizationId: "customer-alpha", displayName: "Anna Andersson", role: "customer_admin" }],
    });

    expect(result.body.dataset.portalAccess).toBe("authenticated");
    expect(result.body.dataset.dataMode).toBe("authenticated");
    expect(result.authenticatedOnly.every((node) => !node.hidden)).toBe(true);
    expect(result.lockedOnly.every((node) => node.hidden)).toBe(true);
    expect(result.footer.dataset.portalAccess).toBe("authenticated");
    expect(result.footerStatus.textContent).toBe("Verifierad åtkomst");
    expect(result.liveStatus.textContent).toBe("Kundåtkomsten är verifierad.");
    expect(result.memberNames.every((node) => node.textContent === "Anna Andersson")).toBe(true);
    expect(result.memberRoles.every((node) => node.textContent === "Kundadministratör")).toBe(true);
    expect(result.memberInitials.every((node) => node.textContent === "AA")).toBe(true);
    expect(result.fetch).toHaveBeenCalledWith("/v1/portal-entries", {
      headers: { Authorization: "Bearer customer-session-token" },
      cache: "no-store",
      credentials: "omit",
    });
  });

  it("keeps a denied customer API response locked", async () => {
    const result = await runClient({ responseStatus: 403, entries: [{ slug: "alpha" }] });
    expectLocked(result);
  });

  it("keeps zero entries and a foreign server-returned slug locked", async () => {
    expectLocked(await runClient({ entries: [] }));
    expectLocked(await runClient({ entries: [{ slug: "beta" }] }));
  });

  it("fails closed when Clerk or the portal directory is unavailable", async () => {
    const clerkFailure = await runClient({ clerkFailure: true, entries: [{ slug: "alpha" }] });
    expectLocked(clerkFailure);
    expect(clerkFailure.fetch).not.toHaveBeenCalled();

    const fetchFailure = await runClient({ fetchFailure: true });
    expectLocked(fetchFailure);
  });

  it("does not run on the demo or outside the exact canonical portal path", async () => {
    const demo = await runClient({ dataMode: "demo", slug: "kth", pathname: "/portal/kth", entries: [{ slug: "kth" }] });
    expectLocked(demo);
    expect(demo.load).not.toHaveBeenCalled();

    const customDomain = await runClient({ pathname: "/", entries: [{ slug: "alpha" }] });
    expectLocked(customDomain);
    expect(customDomain.load).not.toHaveBeenCalled();
  });

  it("never stores or places the session token in navigation state", () => {
    expect(() => new Script(customerSessionClient)).not.toThrow();
    expect(customerSessionClient).not.toContain("localStorage");
    expect(customerSessionClient).not.toContain("sessionStorage");
    expect(customerSessionClient).not.toContain("location.href");
    expect(customerSessionClient).not.toContain("location.replace");
    expect(customerSessionClient).not.toContain("entry.role");
  });
});
