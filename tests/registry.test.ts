import { describe, it, expect, vi } from "vitest";
import { Script } from "node:vm";
import {
  applyRegistryCommand,
  bindPortalIdentity,
  commandSchema,
  customerSiteInputSchema,
  initialRegistry,
  publicPortal,
  registrySchema,
  resolvePortalEntries,
  type Registry,
  type RegistryStore,
} from "../src/admin/registry.js";
import { NeonRegistryStore, REGISTRY_SQL, neonQuery } from "../src/admin/registry-store.js";
import { registryClient } from "../src/admin/registry-client.js";
import { createAdminPortal } from "../src/admin/portal.js";

const actor = "admin-test";
function fixtureConnection(host = "ep-test.eu-central-1.aws.neon.tech") { const url = new URL("postgresql://" + host + "/db"); url.username = "fixture"; url.password = crypto.randomUUID(); return url.toString(); }
const cfg = { allowedEmail: "admin@example.test", secretKey: "fixture", publishableKey: "" };
function memoryStore(seed: Registry = initialRegistry()): RegistryStore {
  let version = 1, data = seed;
  return { read: async () => ({ version, data }), write: async (expected, next) => {
    expect(expected).toBe(version); version++; data = next; return { version, data };
  } };
}
describe("Persistent registry domain", () => {
  it("migrates legacy snapshots to an empty portal-member allowlist", () => {
    const { portalMembers: _legacyMissingField, ...legacy } = initialRegistry();
    const migrated = registrySchema.parse(legacy);

    expect(migrated.portalMembers).toEqual([]);
    expect(migrated.customers[0]).toMatchObject({ id: "customer-kth-demo", slug: "kth" });
  });
  it("preserves portal members through an existing command and storage parse", async () => {
    const member = {
      id: "member-example-reader",
      customerId: "customer-kth-demo",
      verifiedEmail: "Reader@Example.Test ",
      displayName: " Example Reader ",
      role: "customer_reader" as const,
      status: "inactive" as const,
    };
    const data = registrySchema.parse({ ...initialRegistry(), portalMembers: [member] });
    const afterCommand = applyRegistryCommand(data, { action: "rename_publisher", id: "ieee", name: "IEEE Xplore" }, actor);
    const query = vi.fn(async (sql: string, params: string[]) => {
      if (sql === REGISTRY_SQL.write) return [["2", params[0]!]];
      return [];
    });

    const written = await new NeonRegistryStore(query).write(1, afterCommand);

    expect(written.data.portalMembers).toEqual([{
      id: "member-example-reader",
      customerId: "customer-kth-demo",
      verifiedEmail: "reader@example.test",
      externalUserId: null,
      displayName: "Example Reader",
      role: "customer_reader",
      status: "inactive",
    }]);
    expect(written.data.publishers[0]?.name).toBe("IEEE Xplore");
  });
  it("rejects duplicate portal-member emails within one customer after normalization", () => {
    const member = {
      id: "member-one",
      customerId: "customer-kth-demo",
      verifiedEmail: "reader@example.test",
      externalUserId: null,
      displayName: "Reader One",
      role: "customer_reader" as const,
      status: "active" as const,
    };

    expect(() => registrySchema.parse({
      ...initialRegistry(),
      portalMembers: [member, { ...member, id: "member-two", verifiedEmail: " READER@EXAMPLE.TEST " }],
    })).toThrow("duplicate_portal_member_email");
  });
  it("creates unpublished empty customer tenants without inheriting KTH data", () => {
    const next = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "Example University", slug: "example-university" }, actor);
    expect(next.customers[1]).toMatchObject({
      status: "draft",
      kind: "customer",
      publisherIds: [],
      site: {
        domain: "",
        domainStatus: "not_configured",
        preset: "insight",
        agent: { enabled: false, agentId: "", clientKey: "" },
      },
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
  it("cascades only the deleted customer's portal memberships", () => {
    let next = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "First University", slug: "first-university" }, actor);
    next = applyRegistryCommand(next, { action: "add_customer", name: "Second University", slug: "second-university" }, actor);
    const firstId = next.customers[1]!.id;
    const secondId = next.customers[2]!.id;
    next = applyRegistryCommand(next, {
      action: "add_portal_member",
      customerId: firstId,
      verifiedEmail: "member@example.test",
      displayName: "First Member",
      role: "customer_admin",
    }, actor);
    next = applyRegistryCommand(next, {
      action: "add_portal_member",
      customerId: secondId,
      verifiedEmail: "member@example.test",
      displayName: "Second Member",
      role: "customer_reader",
    }, actor);
    next = applyRegistryCommand(next, { action: "archive_customer", id: firstId }, actor);
    next = applyRegistryCommand(next, { action: "delete_customer", id: firstId, confirmation: "first-university" }, actor);

    expect(next.portalMembers).toHaveLength(1);
    expect(next.portalMembers[0]).toMatchObject({ customerId: secondId, displayName: "Second Member" });
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
  it("adds and updates normalized portal-member allowlist entries", () => {
    let next = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "Example University", slug: "example-university" }, actor);
    const customerId = next.customers[1]!.id;
    next = applyRegistryCommand(next, {
      action: "add_portal_member",
      customerId,
      verifiedEmail: "  LIBRARIAN@Example.Test ",
      displayName: "  Ada Librarian  ",
      role: "customer_reader",
    }, actor);
    const member = next.portalMembers[0]!;

    expect(member).toMatchObject({
      customerId,
      verifiedEmail: "librarian@example.test",
      displayName: "Ada Librarian",
      role: "customer_reader",
      status: "active",
    });
    expect(next.events.at(-1)).toMatchObject({ action: "add_portal_member", entityId: member.id });
    next.portalMembers[0]!.externalUserId = "previous-provider-user";

    next = applyRegistryCommand(next, {
      action: "update_portal_member",
      id: member.id,
      verifiedEmail: "  ADA@EXAMPLE.TEST ",
      displayName: "Ada Lovelace",
      role: "customer_admin",
      status: "inactive",
    }, actor);
    expect(next.portalMembers[0]).toMatchObject({
      id: member.id,
      customerId,
      verifiedEmail: "ada@example.test",
      externalUserId: null,
      displayName: "Ada Lovelace",
      role: "customer_admin",
      status: "inactive",
    });
    expect(next.events.at(-1)).toMatchObject({ action: "update_portal_member", entityId: member.id });
  });
  it("rejects demo, missing and duplicate portal-member targets", () => {
    expect(() => applyRegistryCommand(initialRegistry(), {
      action: "add_portal_member",
      customerId: "missing",
      verifiedEmail: "member@example.test",
      displayName: "Missing Member",
      role: "customer_reader",
    }, actor)).toThrow("not_found");
    expect(() => applyRegistryCommand(initialRegistry(), {
      action: "add_portal_member",
      customerId: "customer-kth-demo",
      verifiedEmail: "member@example.test",
      displayName: "Demo Member",
      role: "customer_reader",
    }, actor)).toThrow("demo_customer_protected");

    let next = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "First University", slug: "first-university" }, actor);
    const firstId = next.customers[1]!.id;
    next = applyRegistryCommand(next, {
      action: "add_portal_member",
      customerId: firstId,
      verifiedEmail: "member@example.test",
      displayName: "First Member",
      role: "customer_reader",
    }, actor);
    expect(() => applyRegistryCommand(next, {
      action: "add_portal_member",
      customerId: firstId,
      verifiedEmail: " MEMBER@EXAMPLE.TEST ",
      displayName: "Duplicate Member",
      role: "customer_admin",
    }, actor)).toThrow("portal_member_email_exists");
    next = applyRegistryCommand(next, {
      action: "add_portal_member",
      customerId: firstId,
      verifiedEmail: "other@example.test",
      displayName: "Other Member",
      role: "customer_reader",
    }, actor);
    const otherMember = next.portalMembers.find(member => member.verifiedEmail === "other@example.test")!;
    expect(() => applyRegistryCommand(next, {
      action: "update_portal_member",
      id: otherMember.id,
      verifiedEmail: " MEMBER@EXAMPLE.TEST ",
      displayName: otherMember.displayName,
      role: otherMember.role,
      status: otherMember.status,
    }, actor)).toThrow("portal_member_email_exists");

    next = applyRegistryCommand(next, { action: "add_customer", name: "Second University", slug: "second-university" }, actor);
    const secondId = next.customers[2]!.id;
    expect(() => applyRegistryCommand(next, {
      action: "add_portal_member",
      customerId: secondId,
      verifiedEmail: " MEMBER@EXAMPLE.TEST ",
      displayName: "Other Customer Member",
      role: "customer_admin",
    }, actor)).not.toThrow();
    expect(() => applyRegistryCommand(next, {
      action: "update_portal_member",
      id: "missing",
      verifiedEmail: "member@example.test",
      displayName: "Missing Member",
      role: "customer_reader",
      status: "active",
    }, actor)).toThrow("not_found");
  });
  it("binds pending email invitations to one provider identity before resolving portal entries", () => {
    let next = initialRegistry();
    for (const [name, slug] of [
      ["Alpha University", "alpha-university"],
      ["Beta University", "beta-university"],
      ["Draft University", "draft-university"],
      ["Inactive University", "inactive-university"],
    ] as const) {
      next = applyRegistryCommand(next, { action: "add_customer", name, slug }, actor);
    }
    const [alpha, beta, draft, inactive] = next.customers.slice(1);
    for (const customer of [alpha, beta, inactive]) {
      next = applyRegistryCommand(next, { action: "publish_customer", id: customer!.id }, actor);
    }
    for (const [customer, displayName, status] of [
      [alpha!, "Alpha Member", "active"],
      [beta!, "Beta Member", "active"],
      [draft!, "Draft Member", "active"],
      [inactive!, "Inactive Member", "inactive"],
    ] as const) {
      next = applyRegistryCommand(next, {
        action: "add_portal_member",
        customerId: customer.id,
        verifiedEmail: "member@example.test",
        displayName,
        role: customer.id === beta!.id ? "customer_admin" : "customer_reader",
      }, actor);
      if (status === "inactive") {
        const member = next.portalMembers.find(member => member.customerId === customer.id)!;
        next = applyRegistryCommand(next, {
          action: "update_portal_member",
          id: member.id,
          verifiedEmail: member.verifiedEmail,
          displayName: member.displayName,
          role: member.role,
          status,
        }, actor);
      }
    }
    next = applyRegistryCommand(next, {
      action: "add_portal_member",
      customerId: alpha!.id,
      verifiedEmail: "alpha-only@example.test",
      displayName: "Alpha Only",
      role: "customer_reader",
    }, actor);
    next = registrySchema.parse({
      ...next,
      portalMembers: [...next.portalMembers, {
        id: "legacy-demo-member",
        customerId: "customer-kth-demo",
        verifiedEmail: "member@example.test",
        displayName: "Demo Member",
        role: "customer_admin",
        status: "active",
      }],
    });

    expect(resolvePortalEntries(next, { id: "user-member", email: "member@example.test" })).toEqual([]);
    const memberBinding = bindPortalIdentity(next, { id: "user-member", email: " MEMBER@EXAMPLE.TEST " }, new Date("2026-09-09T12:00:00Z"));
    expect(memberBinding.changed).toBe(true);
    next = memberBinding.data;
    expect(next.portalMembers.filter(member => member.externalUserId === "user-member").map(member => member.customerId))
      .toEqual([alpha!.id, beta!.id]);
    expect(next.events.filter(event => event.action === "bind_portal_identity")).toHaveLength(2);

    const alphaBinding = bindPortalIdentity(next, { id: "user-alpha", email: "alpha-only@example.test" });
    expect(alphaBinding.changed).toBe(true);
    next = alphaBinding.data;
    expect(resolvePortalEntries(next, { id: "unknown", email: "unknown@example.test" })).toEqual([]);
    expect(resolvePortalEntries(next, { id: "invalid id with spaces", email: "not-an-email" })).toEqual([]);
    expect(resolvePortalEntries(next, { id: "user-alpha", email: "alpha-only@example.test" })).toEqual([
      expect.objectContaining({ organizationId: alpha!.id, slug: "alpha-university" }),
    ]);
    expect(resolvePortalEntries(next, { id: "user-member", email: " MEMBER@EXAMPLE.TEST " })).toEqual([
      {
        organizationId: alpha!.id,
        organizationName: "Alpha University",
        slug: "alpha-university",
        displayName: "Alpha Member",
        role: "customer_reader",
      },
      {
        organizationId: beta!.id,
        organizationName: "Beta University",
        slug: "beta-university",
        displayName: "Beta Member",
        role: "customer_admin",
      },
    ]);
    expect(resolvePortalEntries(next, { id: "user-recreated", email: "member@example.test" })).toEqual([]);
    expect(bindPortalIdentity(next, { id: "user-recreated", email: "member@example.test" }).changed).toBe(false);
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
    expect(commandSchema.safeParse({
      action: "configure_customer_site",
      id: customer.id,
      site: { ...next.customers[1]!.site, agent: { ...next.customers[1]!.site.agent, clientKey: "" } },
    }).success).toBe(false);
  });
  it("keeps legacy partial D-ID overrides readable while rejecting them on new writes", () => {
    const persisted = structuredClone(initialRegistry());
    persisted.customers[0]!.site.agent.agentId = "v2_agt_legacy";
    persisted.customers[0]!.site.agent.clientKey = "";

    expect(registrySchema.parse(persisted).customers[0]!.site.agent).toMatchObject({
      agentId: "v2_agt_legacy",
      clientKey: "",
    });
    expect(customerSiteInputSchema.safeParse({
      ...persisted.customers[0]!.site,
      agent: persisted.customers[0]!.site.agent,
    }).success).toBe(false);
  });
  it("links one Salesforce Account only to an eligible Content Online customer", () => {
    let next = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "Example", slug: "example" }, actor);
    const exampleId = next.customers.at(-1)!.id;
    const accountId = "001000000000001AAA";
    next = applyRegistryCommand(next, {
      action: "link_salesforce_account",
      id: exampleId,
      accountId,
      accountName: "Max Tegmark AB",
    }, actor);
    expect(next.customers.at(-1)).toMatchObject({ salesforceAccountId: accountId, salesforceAccountName: "Max Tegmark AB" });
    next = applyRegistryCommand(next, { action: "add_customer", name: "Other", slug: "other" }, actor);
    expect(() => applyRegistryCommand(next, {
      action: "link_salesforce_account",
      id: next.customers.at(-1)!.id,
      accountId,
      accountName: "Duplicate",
    }, actor)).toThrow("salesforce_account_already_linked");
    expect(() => applyRegistryCommand(next, {
      action: "link_salesforce_account",
      id: "customer-kth-demo",
      accountId: "001000000000002AAA",
      accountName: "Protected",
    }, actor)).toThrow("demo_customer_protected");
    next = applyRegistryCommand(next, { action: "archive_customer", id: exampleId }, actor);
    expect(() => applyRegistryCommand(next, {
      action: "link_salesforce_account",
      id: exampleId,
      accountId: "001000000000003AAA",
      accountName: "Archived",
    }, actor)).toThrow("salesforce_customer_unavailable");
    next = applyRegistryCommand(next, { action: "unlink_salesforce_account", id: exampleId }, actor);
    expect(next.customers.find((customer) => customer.id === exampleId)).toMatchObject({ salesforceAccountId: null, salesforceAccountName: null });
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
    expect(registryClient).toContain("Kundinloggning");
    expect(registryClient).toContain("customer.kind==='customer'&&customer.status!=='archived'");
    expect(registryClient).toContain("/login?portal=");
    expect(registryClient).toContain("Slug efter inloggning");
    expect(registryClient).toContain("Aktuell standarddashboard");
    expect(registryClient).toContain("Styr kundsajt");
    expect(registryClient).toContain("Arkivera kundsajt");
    expect(registryClient).toContain("Radera permanent");
    expect(registryClient).toContain("delete_customer");
    expect(registryClient).toContain('data-reg-form="delete_customer"');
    expect(registryClient).toContain("reportValidity()");
    expect(registryClient).toContain("confirmation!==customer.slug");
    expect(registryClient).not.toContain("prompt(");
    expect(registryClient).toContain('data-reg-form="add_portal_member"');
    expect(registryClient).toContain('data-reg-form="update_portal_member"');
    expect(registryClient).toContain("verifiedEmail");
    expect(registryClient).toContain("snapshot.data.portalMembers||[]");
    expect(registryClient).toContain("KTH är en syntetisk visningsdemo");
    expect(registryClient).toContain("Inga riktiga medlemskonton");
    expect(registryClient).toContain("'/portal'");
    expect(registryClient).toContain("slugify");
    expect(registryClient).toContain("availableSlug");
    expect(registryClient).toContain("configure_customer_site");
    expect(registryClient).toContain("D-ID Allowed Domains");
    expect(registryClient).toContain("gemensamma D-ID-agenten är konfigurerad");
    expect(registryClient).toContain("Lämna båda fälten tomma");
    expect(registryClient).toContain("Egen domän (avancerat och valfritt)");
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
  it("persists with optimistic concurrency without exposing legacy public metadata", async () => {
    const store = memoryStore();
    const app = createAdminPortal({ authenticate: async () => ({ status: "authenticated", identity: { id: actor, email: cfg.allowedEmail, role: "content_admin" } }) }, cfg, { registryStore: store });
    const result = await app.request("/admin/api/registry", { method: "POST", body: JSON.stringify({ version: 1, command: { action: "add_customer", name: "New org", slug: "new-org" } }) });
    expect(result.status).toBe(200);
    expect(await result.json()).toMatchObject({ version: 2 });
    expect((await store.read()).data.customers).toHaveLength(2);
    const stale = await app.request("/admin/api/registry", { method: "POST", body: JSON.stringify({ version: 1, command: { action: "add_publisher", name: "Stale" } }) });
    expect(stale.status).toBe(409);
    expect((await app.request("/demo/workspace")).status).toBe(404);
    expect((await app.request("/portal-directory/new-org")).status).toBe(404);
    expect((await app.request("/portal-directory/kth")).status).toBe(404);
    const kthPortal = await app.request("/portal/kth");
    expect(kthPortal.status).toBe(200);
    expect(await kthPortal.text()).toContain("Kunskap i användning");
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
        agentDefaultConfigured: true,
      },
    });
    expect(JSON.parse(text)).toMatchObject({
      runtime: { agentModeByCustomer: { "customer-kth-demo": "platform_fallback" } },
    });
  });
  it("redacts provider identity ids from the admin registry response", async () => {
    let data = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "Example", slug: "example" }, actor);
    const customer = data.customers.at(-1)!;
    data = applyRegistryCommand(data, { action: "publish_customer", id: customer.id }, actor);
    data = applyRegistryCommand(data, {
      action: "add_portal_member",
      customerId: customer.id,
      verifiedEmail: "member@example.test",
      displayName: "Member",
      role: "customer_reader",
    }, actor);
    data = bindPortalIdentity(data, { id: "provider-user-secret-id", email: "member@example.test" }).data;
    const app = createAdminPortal(
      { authenticate: async () => ({ status: "authenticated", identity: { id: actor, email: cfg.allowedEmail, role: "content_admin" } }) },
      cfg,
      { registryStore: memoryStore(data) },
    );
    const response = await app.request("/admin/api/registry");
    const text = await response.text();
    expect(text).not.toContain("provider-user-secret-id");
    expect(JSON.parse(text).data.portalMembers[0]).toMatchObject({ identityBound: true });
    expect(JSON.parse(text).data.portalMembers[0]).not.toHaveProperty("externalUserId");
  });
  it("fails closed instead of returning fabricated successful empty data", async () => {
    const store = { read: async () => { throw new Error("private-db-credentials"); }, write: vi.fn() };
    const app = createAdminPortal({ authenticate: async () => ({ status: "authenticated", identity: { id: actor, email: cfg.allowedEmail, role: "content_admin" } }) }, cfg, { registryStore: store });
    for (const path of ["/portal/kth", "/admin/api/registry"]) {
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
