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
    expect(next.customers[1]).toMatchObject({ status: "draft", kind: "customer", publisherIds: [] });
    expect(publicPortal(next, "example-university")).toBeNull();
    expect(initialRegistry().customers).toHaveLength(1);
  });
  it("publishes only explicit safe metadata and archives without losing relationships", () => {
    let next = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "Example", slug: "example" }, actor);
    const id = next.customers[1]!.id;
    next = applyRegistryCommand(next, { action: "update_customer", id, name: "Example", publisherIds: ["ieee"] }, actor);
    next = applyRegistryCommand(next, { action: "publish_customer", id }, actor);
    expect(publicPortal(next, "example")).toEqual({ name: "Example", slug: "example", mode: "awaiting_accounts" });
    next = applyRegistryCommand(next, { action: "archive_customer", id }, actor);
    expect(publicPortal(next, "example")).toBeNull();
    expect(next.customers[1]!.publisherIds).toEqual(["ieee"]);
    expect(() => applyRegistryCommand(next, { action: "publish_customer", id }, actor)).toThrow("restore_before_publishing");
    expect(() => applyRegistryCommand(next, { action: "add_customer", name: "Other", slug: "example" }, actor)).toThrow("slug_reserved");
    next = applyRegistryCommand(next, { action: "restore_customer", id }, actor);
    expect(next.customers[1]!.status).toBe("draft");
  });
  it("validates slugs and leaves tenant kind/URL immutable", () => {
    for (const slug of ["KTH", "../other", "with space", "a".repeat(64), "-bad", "bad-"]) {
      expect(commandSchema.safeParse({ action: "add_customer", name: "Example", slug }).success).toBe(false);
    }
    const cmd = commandSchema.parse({ action: "update_customer", id: "customer-kth-demo", name: "KTH", publisherIds: [], slug: "other", kind: "customer" });
    const next = applyRegistryCommand(initialRegistry(), cmd, actor);
    expect(next.customers[0]).toMatchObject({ slug: "kth", kind: "demo" });
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
    expect(registryClient).toContain("Granska kundyta");
    expect(registryClient).toContain("Aktiveringssida");
    expect(registryClient).toContain("Styr kund");
    expect(registryClient).toContain("slugify");
    expect(registryClient).toContain("const activationUrl=c=>url(c)+'/login'");
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
    expect(await (await app.request("/portal-directory/kth")).json()).toEqual({ name: "KTH", slug: "kth", mode: "demo" });
    expect((await app.request("/admin/api/registry", { method: "POST", body: "{" })).status).toBe(422);
    expect((await app.request("/admin/api/registry", { method: "POST", body: JSON.stringify({ version: 2, command: { action: "delete_everything" } }) })).status).toBe(422);
    expect((await app.request("/admin/api/registry", { method: "POST", headers: { origin: "https://evil.example" }, body: "{}" })).status).toBe(403);
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
