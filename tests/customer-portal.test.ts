import { Script } from "node:vm";
import { describe, expect, it } from "vitest";
import { createAdminPortal } from "../src/admin/portal.js";
import {
  applyRegistryCommand,
  initialRegistry,
  registrySchema,
  type Registry,
  type RegistryStore,
} from "../src/admin/registry.js";
import { customerAgentPolicy } from "../src/customer-portal/agent.js";
import { customerPortalClient } from "../src/customer-portal/client.js";
import { customerSlugFromHostname } from "../src/customer-portal/routing.js";

const cfg = { allowedEmail: "admin@example.test", secretKey: "fixture", publishableKey: "" };
const admin = { status: "authenticated" as const, identity: { id: "admin", email: cfg.allowedEmail, role: "content_admin" as const } };

function storeFor(data = initialRegistry()): RegistryStore {
  let version = 1;
  let value = data;
  return {
    read: async () => ({ version, data: value }),
    write: async (expected, next) => {
      expect(expected).toBe(version);
      version += 1;
      value = next;
      return { version, data: value };
    },
  };
}

function publishedCustomer(): Registry {
  let data = applyRegistryCommand(initialRegistry(), { action: "add_customer", name: "North University", slug: "north" }, "admin");
  const customer = data.customers[1]!;
  data = applyRegistryCommand(data, {
    action: "configure_customer_site",
    id: customer.id,
    site: {
      preset: "minimal",
      domain: "north.portal.contentonline.se",
      logoUrl: "https://assets.example.test/north.svg",
      primaryColor: "#112233",
      accentColor: "#44aa99",
      heading: "North knowledge",
      tagline: "A configured customer portal without inherited KTH data.",
      agent: {
        enabled: true,
        agentId: "v2_agt_north",
        clientKey: "ck_north_domain_key",
        greeting: "Hej North!",
        positivity: 10,
        tools: ["portal_context", "portal_navigation", "portfolio_summary", "usage_summary"],
      },
    },
  }, "admin");
  return applyRegistryCommand(data, { action: "publish_customer", id: customer.id }, "admin");
}

describe("shared multi-tenant customer portal", () => {
  it("serves the migrated KTH pilot on path and clean-host routing without putting D-ID in admin", async () => {
    const didAgentId = "v2_agt_kth";
    const didClientKey = "ck_kth_domain_key";
    const app = createAdminPortal({ authenticate: async () => admin }, cfg, {
      registryStore: storeFor(),
      portalRootDomain: "portal.contentonline.se",
      didAgentId,
      didClientKey,
    });
    for (const url of ["/portal/kth", "https://kth.portal.contentonline.se/"]) {
      const response = await app.request(url);
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain("Kunskap i användning");
      expect(body).toContain("DEMO · SYNTETISKA EXEMPEL");
      expect(body).toContain('/admin/assets/co-logo.png');
      expect(body).toContain('src="https://agent.d-id.com/v2/index.js"');
      expect(body).toContain(`data-agent-id="${didAgentId}"`);
      expect(body).toContain(`data-client-key="${didClientKey}"`);
    }
    const internal = await (await app.request("/admin")).text();
    expect(internal).not.toContain(didAgentId);
    expect(internal).not.toContain(didClientKey);
    expect(internal).not.toContain("agent.d-id.com/v2/index.js");
  });

  it("offers a database-free synthetic KTH review route for protected previews", async () => {
    const app = createAdminPortal({ authenticate: async () => admin }, cfg, {
      registryStore: { read: async () => { throw new Error("preview database is intentionally unavailable"); }, write: async () => { throw new Error("unreachable"); } },
      didAgentId: "v2_agt_preview",
      didClientKey: "ck_preview_domain_key",
    });
    const portal = await app.request("/demo/customer/kth");
    expect(portal.status).toBe(200);
    const body = await portal.text();
    expect(body).toContain("Kunskap i användning");
    expect(body).toContain("DEMO · SYNTETISKA EXEMPEL");
    expect(body).toContain('data-agent-id="v2_agt_preview"');
    expect((await app.request("/demo/customer/kth/login")).status).toBe(200);
    const context = await (await app.request("/demo/customer/kth/api/agent-context")).json();
    expect(context).toMatchObject({ portal: { customer: "KTH", dataMode: "synthetic_demo" } });
  });

  it("renders a new customer's own brand and keeps protected data behind authentication", async () => {
    const data = publishedCustomer();
    const app = createAdminPortal({ authenticate: async () => admin }, cfg, { registryStore: storeFor(data) });
    const response = await app.request("/portal/north");
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("North knowledge");
    expect(html).toContain("#112233");
    expect(html).toContain("https://assets.example.test/north.svg");
    expect(html).toContain('data-agent-id="v2_agt_north"');
    expect(html).not.toContain("KTH Biblioteket");
    expect(html).not.toContain("412");

    const contextResponse = await app.request("/portal/north/api/agent-context");
    expect(contextResponse.status).toBe(200);
    const context = await contextResponse.json();
    expect(context).toMatchObject({
      portal: { customer: "North University", dataMode: "authentication_required" },
      assistant: { positivity: 10 },
      portfolio: { status: "authentication_required" },
      usage: { status: "authentication_required" },
    });
    expect(JSON.stringify(context)).not.toContain("ck_north_domain_key");
  });

  it("fails closed for unknown or unpublished subdomains and never falls back to KTH", async () => {
    const data = publishedCustomer();
    const draft = data.customers[1]!;
    const unpublished = applyRegistryCommand(data, { action: "unpublish_customer", id: draft.id }, "admin");
    const app = createAdminPortal({ authenticate: async () => admin }, cfg, { registryStore: storeFor(unpublished) });
    for (const url of ["https://north.portal.contentonline.se/", "https://unknown.portal.contentonline.se/", "/portal/unknown"]) {
      const response = await app.request(url);
      expect(response.status).toBe(404);
      expect(await response.text()).not.toContain("Kunskap i användning");
    }
  });

  it("migrates legacy registry JSON by filling safe customer-site defaults", () => {
    const parsed = registrySchema.parse({
      customers: [{ id: "legacy", name: "Legacy Customer", slug: "legacy", status: "draft", kind: "customer", publisherIds: [] }],
      publishers: [],
      events: [],
    });
    expect(parsed.customers[0]!.site).toMatchObject({ preset: "insight", domainStatus: "not_configured", agent: { enabled: false, positivity: 5 } });
  });

  it("migrates only a legacy KTH demo without site settings to the intended agent-enabled pilot", async () => {
    const legacyKth = {
      id: "customer-kth-demo",
      name: "KTH",
      slug: "kth",
      status: "published" as const,
      kind: "demo" as const,
      publisherIds: ["ieee"],
    };
    const data = registrySchema.parse({
      customers: [legacyKth],
      publishers: [{ id: "ieee", name: "IEEE", status: "active" }],
      events: [],
    });
    expect(data.customers[0]!.site).toMatchObject({
      domain: "kth.portal.contentonline.se",
      primaryColor: "#1954a6",
      agent: { enabled: true, positivity: 7 },
    });

    const app = createAdminPortal({ authenticate: async () => admin }, cfg, {
      registryStore: storeFor(data),
      didAgentId: "v2_agt_legacy_kth",
      didClientKey: "ck_legacy_kth_domain_key",
    });
    const body = await (await app.request("/portal/kth")).text();
    expect(body).toContain('data-agent-id="v2_agt_legacy_kth"');
    expect(body).toContain('data-client-key="ck_legacy_kth_domain_key"');

    const explicitOff = registrySchema.parse({
      customers: [{
        ...legacyKth,
        site: { ...data.customers[0]!.site, agent: { ...data.customers[0]!.site.agent, enabled: false } },
      }],
      publishers: data.publishers,
      events: [],
    });
    expect(explicitOff.customers[0]!.site.agent.enabled).toBe(false);
  });

  it("ships allowlisted D-ID client tools and preserves truthfulness at positivity ten", () => {
    expect(() => new Script(customerPortalClient)).not.toThrow();
    for (const name of ["get_portal_context", "navigate_portal", "get_portfolio_summary", "get_usage_summary"]) {
      expect(customerPortalClient).toContain(name);
    }
    expect(customerPortalClient).toContain("const sections=new Set");
    expect(customerPortalClient).not.toContain("eval(");
    const customer = publishedCustomer().customers[1]!;
    const policy = customerAgentPolicy(customer);
    expect(policy.positivity).toBe(10);
    expect(policy.truthfulness.join(" ")).toContain("Dölj aldrig nedgångar, kostnader, osäkerhet");
    expect(policy.truthfulness.join(" ")).toContain("Påstå aldrig ekonomisk nytta");
  });

  it("accepts only a single valid customer slug beneath the configured root domain", () => {
    expect(customerSlugFromHostname("KTH.portal.contentonline.se", "portal.contentonline.se")).toBe("kth");
    for (const host of ["portal.contentonline.se", "a.b.portal.contentonline.se", "evilportal.contentonline.se", "127.0.0.1"]) {
      expect(customerSlugFromHostname(host, "portal.contentonline.se")).toBeNull();
    }
  });
});
