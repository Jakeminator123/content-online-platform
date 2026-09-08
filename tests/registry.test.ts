import { describe, it, expect, vi } from "vitest";
import { Script } from "node:vm";
import { applyRegistryCommand, commandSchema, initialRegistry, publicPortal, type Registry, type RegistryStore } from "../src/admin/registry.js";
import { NeonRegistryStore, REGISTRY_SQL, neonQuery } from "../src/admin/registry-store.js";
import { registryClient } from "../src/admin/registry-client.js";
import { createAdminPortal } from "../src/admin/portal.js";

const actor = "admin-test";
function fixtureConnection(host = "ep-test.eu-central-1.aws.neon.tech") { const url = new URL("postgresql://" + host + "/db"); url.username = "fixture"; url.password = crypto.randomUUID(); return url.toString(); }
const cfg = { allowedEmail: "admin@example.test", secretKey: "fixture", publishableKey: "" };
function memoryStore(): RegistryStore {
  let version = 1, data = initialRegistry();
  return { read: async () => ({ version, data }), write: async (expected, next) => {
    expect(expected).toBe(version); version++; data = next; return { version, data };
  } };
}
describe("Persistent registry domain", () => {
  it("creates unpublished empty customer tenants without inheriting KTH data", () => {
    const next = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "Example University", slug: "example-university" }, actor);
    expect(next.customers[1]).toMatchObject({
      status: "draft",
      kind: "customer",
      publisherIds: [],
      site: { domain: "", domainStatus: "not_configured", preset: "insight" },
    });
    expect(publicPortal(next, "example-university")).toBeNull();
    expect(initialRegistry().customers).toHaveLength(1);
  });
  it("publishes only explicit safe metadata and archives without losing relationships", () => {
    let next = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "Example", slug: "example" }, actor);
    const id = next.customers[1]!.id;
    next = applyRegistryCommand(next, { action: "update_customer", id, name: "Example", publisherIds: ["ieee"] }, actor);
    next = applyRegistryCommand(next, { action: "publish_customer", id }, actor);
    expect(publicPortal(next, "example")).toMatchObject({
      name: "Example",
      slug: "example",
      mode: "awaiting_accounts",
      brand: { primaryColor: "#285b70", accentColor: "#338578" },
    });
    next = applyRegistryCommand(next, { action: "archive_customer", id }, actor);
    expect(publicPortal(next, "example")).toBeNull();
    expect(next.customers[1]!.publisherIds).toEqual(["ieee"]);
    expect(() => applyRegistryCommand(next, { action: "publish_customer", id }, actor)).toThrow("restore_before_publishing");
    expect(() => applyRegistryCommand(next, { action: "add_customer", name: "Other", slug: "example" }, actor)).toThrow("slug_reserved");
    next = applyRegistryCommand(next, { action: "restore_customer", id }, actor);
    expect(next.customers[1]!.status).toBe("draft");
  });
  it("permanently deletes an archived customer after exact name confirmation and keeps only a minimal audit event", () => {
    let next = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "Example University", slug: "example-university" }, actor);
    const id = next.customers[1]!.id;
    next = applyRegistryCommand(next, { action: "archive_customer", id }, actor);
    next = applyRegistryCommand(next, { action: "delete_customer", id, confirmation: "Example University" }, actor, new Date("2026-09-09T10:00:00Z"));

    expect(next.customers.find(customer => customer.id === id)).toBeUndefined();
    expect(next.events.at(-1)).toEqual({
      at: "2026-09-09T10:00:00.000Z",
      actor,
      action: "delete_customer",
      entityId: id,
    });
  });
  it("requires an archived non-demo customer and an exact confirmation", () => {
    let draft = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "Example", slug: "example" }, actor);
    const id = draft.customers[1]!.id;
    expect(() => applyRegistryCommand(draft, { action: "delete_customer", id, confirmation: "example" }, actor)).toThrow("delete_requires_archived");

    const published = applyRegistryCommand(draft, { action: "publish_customer", id }, actor);
    expect(() => applyRegistryCommand(published, { action: "delete_customer", id, confirmation: "example" }, actor)).toThrow("delete_requires_archived");

    const archived = applyRegistryCommand(published, { action: "archive_customer", id }, actor);
    expect(() => applyRegistryCommand(archived, { action: "delete_customer", id, confirmation: "EXAMPLE" }, actor)).toThrow("delete_confirmation_mismatch");
    expect(archived.customers.some(customer => customer.id === id)).toBe(true);

    const archivedDemo = applyRegistryCommand(initialRegistry(), { action: "archive_customer", id: "customer-kth-demo" }, actor);
    expect(() => applyRegistryCommand(archivedDemo, { action: "delete_customer", id: "customer-kth-demo", confirmation: "kth" }, actor)).toThrow("demo_customer_protected");
    expect(() => applyRegistryCommand(archived, { action: "delete_customer", id: "missing", confirmation: "missing" }, actor)).toThrow("not_found");
  });
  it("frees a permanently deleted slug for a new customer", () => {
    let next = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "Original", slug: "reusable-slug" }, actor);
    const deletedId = next.customers[1]!.id;
    next = applyRegistryCommand(next, { action: "archive_customer", id: deletedId }, actor);
    next = applyRegistryCommand(next, { action: "delete_customer", id: deletedId, confirmation: "reusable-slug" }, actor);
    next = applyRegistryCommand(next, { action: "add_customer", name: "Replacement", slug: "reusable-slug" }, actor);

    const replacement = next.customers.find(customer => customer.slug === "reusable-slug");
    expect(replacement).toMatchObject({ name: "Replacement", status: "draft", kind: "customer" });
    expect(replacement!.id).not.toBe(deletedId);
  });
  it("validates slugs and leaves tenant kind/URL immutable", () => {
    for (const slug of ["KTH", "../other", "with space", "a".repeat(64), "-bad", "bad-"]) {
      expect(commandSchema.safeParse({ action: "add_customer", name: "Example", slug }).success).toBe(false);
    }
    const cmd = commandSchema.parse({ action: "update_customer", id: "customer-kth-demo", name: "KTH", publisherIds: [], slug: "other", kind: "customer" });
    const next = applyRegistryCommand(initialRegistry(), cmd, actor);
    expect(next.customers[0]).toMatchObject({ slug: "kth", kind: "demo" });
    expect(commandSchema.safeParse({ action: "delete_customer", id: "customer", confirmation: "customer" }).success).toBe(true);
    expect(commandSchema.safeParse({ action: "delete_customer", id: "customer" }).success).toBe(false);
  });
  it("persists brand, domain and constrained D-ID policy without weakening truthfulness", () => {
    let next = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "Example", slug: "example" }, actor);
    const customer = next.customers[1]!;
    next = applyRegistryCommand(next, {
      action: "configure_customer_site",
      id: customer.id,
      site: {
        preset: "library",
        domain: "example.portal.contentonline.se",
        logoUrl: "https://assets.example.test/logo.svg",
        primaryColor: "#123456",
        accentColor: "#abcdef",
        heading: "Example knowledge",
        tagline: "A customer-specific portal.",
        agent: {
          enabled: true,
          agentId: "v2_agt_example",
          clientKey: "ck_domain_scoped_key",
          greeting: "Hej från Example!",
          positivity: 10,
          tools: ["portal_context", "portal_navigation", "usage_summary", "usage_summary"],
        },
      },
    }, actor);
    expect(next.customers[1]!.site).toMatchObject({
      preset: "library",
      domainStatus: "pending",
      primaryColor: "#123456",
      agent: { positivity: 10, tools: ["portal_context", "portal_navigation", "usage_summary"] },
    });
    next = applyRegistryCommand(next, { action: "set_customer_domain_status", id: customer.id, domainStatus: "ready" }, actor);
    expect(next.customers[1]!.site.domainStatus).toBe("ready");
    expect(commandSchema.safeParse({
      action: "configure_customer_site",
      id: customer.id,
      site: { ...next.customers[1]!.site, agent: { ...next.customers[1]!.site.agent, positivity: 11 } },
    }).success).toBe(false);
    expect(commandSchema.safeParse({
      action: "configure_customer_site",
      id: customer.id,
      site: { ...next.customers[1]!.site, agent: { ...next.customers[1]!.site.agent, clientKey: "not-a-browser-client-key" } },
    }).success).toBe(false);
  });
  it("links one Salesforce Account to at most one Content Online customer", () => {
    let next = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "Example", slug: "example" }, actor);
    const accountId = "001000000000001AAA";
    next = applyRegistryCommand(next, {
      action: "link_salesforce_account",
      id: "customer-kth-demo",
      accountId,
      accountName: "Max Tegmark AB",
    }, actor);
    expect(next.customers[0]).toMatchObject({ salesforceAccountId: accountId, salesforceAccountName: "Max Tegmark AB" });
    expect(() => applyRegistryCommand(next, {
      action: "link_salesforce_account",
      id: next.customers[1]!.id,
      accountId,
      accountName: "Duplicate",
    }, actor)).toThrow("salesforce_account_already_linked");
    next = applyRegistryCommand(next, { action: "unlink_salesforce_account", id: "customer-kth-demo" }, actor);
    expect(next.customers[0]).toMatchObject({ salesforceAccountId: null, salesforceAccountName: null });
  });
  it("archives publishers without deleting existing assignments and rejects new archived assignments", () => {
    let next = applyRegistryCommand(initialRegistry(), { action: "archive_publisher", id: "ieee" }, actor);
    expect(next.customers[0]!.publisherIds).toEqual(["ieee"]);
    next = applyRegistryCommand(next, { action: "add_customer", name: "New", slug: "new" }, actor);
    expect(() => applyRegistryCommand(next, { action: "update_customer", id: next.customers[1]!.id, name: "New", publisherIds: ["ieee"] }, actor)).toThrow("publisher_unavailable");
    expect(() => applyRegistryCommand(next, { action: "update_customer", id: next.customers[1]!.id, name: "New", publisherIds: ["unknown"] }, actor)).toThrow("publisher_unavailable");
    next = applyRegistryCommand(next, { action: "restore_publisher", id: "ieee" }, actor);
    expect(next.publishers[0]!.status).toBe("active");
    expect(next.events).toHaveLength(3);
  });
  it("keeps a bounded actor-attributed history and rejects unknown records", () => {
    const data = initialRegistry(); data.events = Array.from({ length: 500 }, () => ({ actor, at: "old", action: "test", entityId: "test" }));
    const next = applyRegistryCommand(data, { action: "add_publisher", name: "Example Publisher" }, actor, new Date("2026-09-08T12:00:00Z"));
    expect(next.events).toHaveLength(500);
    expect(next.events.at(-1)).toMatchObject({ actor, at: "2026-09-08T12:00:00.000Z", action: "add_publisher" });
    expect(() => applyRegistryCommand(data, { action: "archive_customer", id: "missing" }, actor)).toThrow("not_found");
  });
  it("emits syntactically valid client code without secret handling", () => {
    expect(() => new Script(registryClient)).not.toThrow();
    expect(registryClient).not.toContain("DATABASE_URL");
    expect(registryClient).toContain("Granska kundsajt");
    expect(registryClient).toContain("Aktiveringssida");
    expect(registryClient).toContain("Styr kundsajt");
    expect(registryClient).toContain("Arkivera kundsajt");
    expect(registryClient).toContain("Radera permanent");
    expect(registryClient).toContain("delete_customer");
    expect(registryClient).toContain("confirmation.trim()");
    expect(registryClient).toContain("'/portal'");
    expect(registryClient).toContain("slugify");
    expect(registryClient).toContain("availableSlug");
    expect(registryClient).toContain("configure_customer_site");
    expect(registryClient).toContain("D-ID Allowed Domains");
    expect(registryClient).not.toContain("VERCEL_AUTOMATION_TOKEN");
  });
});
describe("Registry API boundary", () => {
  it.each(["unauthenticated", "forbidden", "unconfigured"] as const)("rejects %s before touching storage", async status => {
    const read = vi.fn();
    const app = createAdminPortal({ authenticate: async () => ({ status }) }, cfg, { registryStore: { read, write: vi.fn() } });
    for (const method of ["GET", "POST", "DELETE"]) {
      const result = await app.request("/admin/api/registry", { method });
      expect(result.status).toBe(status === "unauthenticated" ? 401 : status === "forbidden" ? 403 : 503);
    }
    expect(read).not.toHaveBeenCalled();
  });
  it("persists with optimistic concurrency and never changes fixtures", async () => {
    const store = memoryStore();
    const app = createAdminPortal({ authenticate: async () => ({ status: "authenticated", identity: { id: actor, email: cfg.allowedEmail, role: "content_admin" } }) }, cfg, { registryStore: store });
    const result = await app.request("/admin/api/registry", { method: "POST", body: JSON.stringify({ version: 1, command: { action: "add_customer", name: "New org", slug: "new-org" } }) });
    expect(result.status).toBe(200);
    expect(await result.json()).toMatchObject({ version: 2 });
    expect((await store.read()).data.customers).toHaveLength(2);
    const stale = await app.request("/admin/api/registry", { method: "POST", body: JSON.stringify({ version: 1, command: { action: "add_publisher", name: "Stale" } }) });
    expect(stale.status).toBe(409);
    const fixture = await (await app.request("/demo/workspace")).text();
    expect(fixture).not.toContain("New org");
    const unknown = await app.request("/portal-directory/new-org");
    expect(unknown.status).toBe(404);
    expect((await app.request("/portal-directory/kth")).headers.get("cache-control")).toBe("no-store");
    expect(await (await app.request("/portal-directory/kth")).json()).toMatchObject({
      name: "KTH",
      slug: "kth",
      mode: "demo",
      brand: { heading: "Kunskap i användning" },
    });
    expect((await app.request("/admin/api/registry", { method: "POST", body: "{" })).status).toBe(422);
    expect((await app.request("/admin/api/registry", { method: "POST", body: JSON.stringify({ version: 2, command: { action: "delete_everything" } }) })).status).toBe(422);
    expect((await app.request("/admin/api/registry", { method: "POST", headers: { origin: "https://evil.example" }, body: "{}" })).status).toBe(403);
  });
  it("reports runtime agent mode without exposing the fallback client key", async () => {
    const didClientKey = "ck_runtime_status_key";
    const app = createAdminPortal(
      { authenticate: async () => ({ status: "authenticated", identity: { id: actor, email: cfg.allowedEmail, role: "content_admin" } }) },
      cfg,
      { registryStore: memoryStore(), didAgentId: "v2_agt_runtime_status", didClientKey },
    );
    const response = await app.request("/admin/api/registry");
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toContain(didClientKey);
    expect(JSON.parse(text)).toMatchObject({
      runtime: {
        customerSites: { canonicalOrigin: "https://content-online-platform.vercel.app", pathPrefix: "/portal" },
        customerDomains: { rootDomain: "portal.contentonline.se", wildcardReady: false },
      },
    });
    expect(JSON.parse(text)).toMatchObject({
      runtime: { agentModeByCustomer: { "customer-kth-demo": "platform_fallback" } },
    });
  });
  it("fails closed instead of returning fabricated successful empty data", async () => {
    const store = { read: async () => { throw new Error("private-db-credentials"); }, write: vi.fn() };
    const app = createAdminPortal({ authenticate: async () => ({ status: "authenticated", identity: { id: actor, email: cfg.allowedEmail, role: "content_admin" } }) }, cfg, { registryStore: store });
    for (const path of ["/portal-directory/kth", "/admin/api/registry"]) {
      const result = await app.request(path);
      expect(result.status).toBe(503); expect(await result.text()).not.toContain("private-db");
    }
  });
});
describe("Neon persistence adapter", () => {
  it("parameterizes data, initializes once, never overwrites seed and detects competing writes", async () => {
    const query = vi.fn(async (sql: string, params: string[]) => {
      if (sql === REGISTRY_SQL.read) return [["1", JSON.stringify(initialRegistry())]];
      if (sql === REGISTRY_SQL.write && params[1] === "1") return [["2", params[0]!]];
      return [];
    });
    const store = new NeonRegistryStore(query);
    await store.read(); await store.read();
    expect(query.mock.calls.filter(([sql]) => sql === REGISTRY_SQL.schema)).toHaveLength(1);
    expect(REGISTRY_SQL.seed).toContain("ON CONFLICT (id) DO NOTHING");
    const next = initialRegistry(); next.customers[0]!.name = "Robert'); DROP TABLE nope;--";
    expect((await store.write(1, next)).version).toBe(2);
    expect(query.mock.calls.at(-1)![0]).not.toContain(next.customers[0]!.name);
    await expect(store.write(1 + 1, next)).rejects.toThrow("version_conflict");
  });
  it("keeps credentials on approved Neon HTTPS host, disallows redirects and redacts provider failures", async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => Response.json({ rows: [["1"]] }));
    const query = neonQuery(fixtureConnection(), fetcher);
    expect(await query("SELECT $1::text", ["1"])).toEqual([["1"]]);
    expect(fetcher.mock.calls[0]![0]).toBe("https://api.eu-central-1.aws.neon.tech/sql");
    expect(fetcher.mock.calls[0]![1]).toMatchObject({ cache: "no-store", redirect: "error", method: "POST" });
    for (const connection of ["", "http://example.com", fixtureConnection("evil.neon.tech.example"), fixtureConnection("localhost")]) expect(() => neonQuery(connection)).toThrow("storage_unconfigured");
    const broken = neonQuery(fixtureConnection(), async () => new Response("secret provider details", { status: 400 }));
    await expect(broken("SELECT 1", [])).rejects.toThrow("storage_unavailable");
  });
});
