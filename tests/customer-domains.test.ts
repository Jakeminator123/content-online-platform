import { describe, expect, it, vi } from "vitest";
import { createAdminPortal } from "../src/admin/portal.js";
import { applyRegistryCommand, initialRegistry, type Registry, type RegistryStore } from "../src/admin/registry.js";
import { customerDomainServiceFromEnvironment, CustomerDomainError, VercelCustomerDomainService } from "../src/customer-portal/domains.js";

function store(seed: Registry = initialRegistry(), onWrite?: () => void): RegistryStore {
  let version = 1;
  let data = seed;
  return {
    read: async () => ({ version, data }),
    write: async (expected, next) => {
      expect(expected).toBe(version);
      onWrite?.();
      version += 1;
      data = next;
      return { version, data };
    },
  };
}

function customerForDeletion(domain: string, withMember = false) {
  let data = applyRegistryCommand(initialRegistry(), {
    action: "add_customer",
    name: "Example University",
    slug: "example-university",
  }, "fixture-admin");
  const customerId = data.customers.at(-1)!.id;
  data.customers.at(-1)!.site.domain = domain;
  data.customers.at(-1)!.site.domainStatus = domain ? "ready" : "not_configured";
  if (withMember) {
    data = applyRegistryCommand(data, {
      action: "add_portal_member",
      customerId,
      verifiedEmail: "reader@example.test",
      displayName: "Example Reader",
      role: "customer_reader",
    }, "fixture-admin");
  }
  data = applyRegistryCommand(data, { action: "archive_customer", id: customerId }, "fixture-admin");
  return { data, customerId };
}

describe("Vercel customer-domain automation", () => {
  it("adds and verifies one wildcard for all first-level customer domains", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const value = String(url);
      if (value.endsWith("/verify?teamId=team_test")) return Response.json({ verified: true });
      if (init?.method === "GET") return Response.json({ error: { code: "not_found" } }, { status: 404 });
      return Response.json({ verified: false }, { status: 201 });
    });
    const service = new VercelCustomerDomainService({
      token: "secret-vercel-token",
      projectId: "prj_test",
      teamId: "team_test",
      portalRootDomain: "portal.contentonline.se",
    }, fetcher);
    await expect(service.ensure("kth.portal.contentonline.se")).resolves.toEqual({
      status: "ready",
      managedDomain: "*.portal.contentonline.se",
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls[0]![1]).toMatchObject({ method: "GET", redirect: "error", cache: "no-store" });
    expect(String(fetcher.mock.calls[1]![0])).toBe("https://api.vercel.com/v9/projects/prj_test/domains?teamId=team_test");
    expect(fetcher.mock.calls[1]![1]).toMatchObject({ method: "POST", redirect: "error", cache: "no-store" });
    expect(fetcher.mock.calls[1]![1]!.body).toBe(JSON.stringify({ name: "*.portal.contentonline.se" }));
    expect(String(fetcher.mock.calls[2]![0])).toContain("*.portal.contentonline.se/verify");
    expect(String(fetcher.mock.calls[1]![1]!.body)).not.toContain("secret-vercel-token");
  });

  it("fails closed when domain automation is unconfigured", async () => {
    const service = new VercelCustomerDomainService({ token: "", projectId: "", teamId: "", portalRootDomain: "" });
    await expect(service.ensure("kth.portal.contentonline.se")).rejects.toEqual(expect.objectContaining({ code: "unconfigured" }));
  });

  it("accepts a preverified managed wildcard without a long-lived token", async () => {
    const fetcher = vi.fn();
    const service = new VercelCustomerDomainService({
      token: "",
      projectId: "",
      teamId: "",
      portalRootDomain: "portal.contentonline.se",
      managedWildcardReady: true,
    }, fetcher);
    await expect(service.ensure("new-customer.portal.contentonline.se")).resolves.toEqual({
      status: "ready",
      managedDomain: "*.portal.contentonline.se",
    });
    expect(fetcher).not.toHaveBeenCalled();
    await expect(service.ensure("nested.new-customer.portal.contentonline.se")).rejects.toEqual(expect.objectContaining({ code: "unconfigured" }));
  });

  it("releases an exact external custom domain from the Vercel project", async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(null, { status: 204 }));
    const service = new VercelCustomerDomainService({
      token: "secret-vercel-token",
      projectId: "prj_test",
      teamId: "team_test",
      portalRootDomain: "portal.contentonline.se",
    }, fetcher);

    await expect(service.release(" LIBRARY.EXAMPLE.EDU ")).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledOnce();
    expect(String(fetcher.mock.calls[0]![0])).toBe("https://api.vercel.com/v9/projects/prj_test/domains/library.example.edu?teamId=team_test");
    expect(fetcher.mock.calls[0]![1]).toMatchObject({ method: "DELETE", redirect: "error", cache: "no-store" });
  });

  it("never releases empty, shared-root, wildcard-managed or Vercel platform domains", async () => {
    const fetcher = vi.fn();
    const service = new VercelCustomerDomainService({
      token: "secret-vercel-token",
      projectId: "prj_test",
      teamId: "team_test",
      portalRootDomain: "portal.contentonline.se",
    }, fetcher);

    for (const domain of [
      "",
      "portal.contentonline.se",
      "*.portal.contentonline.se",
      "kth.portal.contentonline.se",
      "content-online-platform.vercel.app",
      "content-online-platform-preview.vercel.app",
    ]) await expect(service.release(domain)).resolves.toBeUndefined();

    expect(fetcher).not.toHaveBeenCalled();

    const unconfigured = new VercelCustomerDomainService({
      token: "",
      projectId: "",
      teamId: "",
      portalRootDomain: "",
    }, fetcher);
    await expect(unconfigured.release("content-online-platform.vercel.app")).resolves.toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("uses the runtime portal root for wildcard release decisions without Vercel credentials", async () => {
    const fetcher = vi.fn();
    const service = customerDomainServiceFromEnvironment(fetcher, "customers.example.test");

    await expect(service.release("tenant.customers.example.test")).resolves.toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("treats an already absent exact domain as successfully released", async () => {
    const fetcher = vi.fn(async () => Response.json({ error: { code: "not_found" } }, { status: 404 }));
    const service = new VercelCustomerDomainService({
      token: "secret-vercel-token",
      projectId: "prj_test",
      teamId: "team_test",
      portalRootDomain: "portal.contentonline.se",
    }, fetcher);

    await expect(service.release("library.example.edu")).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("fails closed when Vercel cannot release an exact domain", async () => {
    const fetcher = vi.fn(async () => Response.json({ error: { code: "internal_error" } }, { status: 500 }));
    const service = new VercelCustomerDomainService({
      token: "secret-vercel-token",
      projectId: "prj_test",
      teamId: "team_test",
      portalRootDomain: "portal.contentonline.se",
    }, fetcher);

    await expect(service.release("library.example.edu")).rejects.toEqual(expect.objectContaining({ code: "unavailable" }));
  });

  it("keeps the ensure endpoint admin-only and persists verified status", async () => {
    const registryStore = store();
    const domainService = {
      ensure: vi.fn(async () => ({ status: "ready" as const, managedDomain: "*.portal.contentonline.se" })),
      release: vi.fn(async () => undefined),
    };
    const config = { allowedEmail: "admin@example.test", secretKey: "fixture", publishableKey: "" };
    const denied = createAdminPortal({ authenticate: async () => ({ status: "unauthenticated" }) }, config, { registryStore, domainService });
    expect((await denied.request("/admin/api/customers/customer-kth-demo/domain/ensure", { method: "POST", body: JSON.stringify({ version: 1 }) })).status).toBe(401);
    expect(domainService.ensure).not.toHaveBeenCalled();

    const app = createAdminPortal({ authenticate: async () => ({ status: "authenticated", identity: { id: "admin", email: config.allowedEmail, role: "content_admin" } }) }, config, { registryStore, domainService });
    const response = await app.request("/admin/api/customers/customer-kth-demo/domain/ensure", {
      method: "POST",
      body: JSON.stringify({ version: 1 }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ version: 2, status: "ready", managedDomain: "*.portal.contentonline.se" });
    expect((await registryStore.read()).data.customers[0]!.site.domainStatus).toBe("ready");
  });

  it("validates protected and invalid customer deletions before touching domains", async () => {
    const archived = customerForDeletion("library.example.edu");
    let data = applyRegistryCommand(archived.data, { action: "add_customer", name: "Draft Customer", slug: "draft-customer" }, "fixture-admin");
    const draftId = data.customers.at(-1)!.id;
    data = applyRegistryCommand(data, { action: "add_customer", name: "Published Customer", slug: "published-customer" }, "fixture-admin");
    const publishedId = data.customers.at(-1)!.id;
    data.customers.at(-1)!.site.domain = "published.example.edu";
    data.customers.at(-1)!.site.domainStatus = "ready";
    data = applyRegistryCommand(data, { action: "publish_customer", id: publishedId }, "fixture-admin");
    const registryStore = store(data);
    const domainService = {
      ensure: vi.fn(async () => ({ status: "ready" as const, managedDomain: "unused.example" })),
      release: vi.fn(async () => undefined),
    };
    const config = { allowedEmail: "admin@example.test", secretKey: "fixture", publishableKey: "" };
    const app = createAdminPortal({
      authenticate: async () => ({ status: "authenticated", identity: { id: "admin", email: config.allowedEmail, role: "content_admin" } }),
    }, config, { registryStore, domainService });
    const commands = [
      { action: "delete_customer", id: "missing", confirmation: "missing" },
      { action: "delete_customer", id: "customer-kth-demo", confirmation: "kth" },
      { action: "delete_customer", id: archived.customerId, confirmation: "wrong-confirmation" },
      { action: "delete_customer", id: draftId, confirmation: "draft-customer" },
      { action: "delete_customer", id: publishedId, confirmation: "published-customer" },
    ];

    for (const command of commands) {
      const response = await app.request("/admin/api/registry", {
        method: "POST",
        body: JSON.stringify({ version: 1, command }),
      });
      expect(response.status).toBeGreaterThanOrEqual(400);
    }
    expect(domainService.release).not.toHaveBeenCalled();
    expect((await registryStore.read()).version).toBe(1);
    expect((await registryStore.read()).data).toEqual(data);
  });

  it("keeps the customer and memberships when exact-domain release fails", async () => {
    const fixture = customerForDeletion("library.example.edu", true);
    const registryStore = store(fixture.data);
    const domainService = {
      ensure: vi.fn(async () => ({ status: "ready" as const, managedDomain: "unused.example" })),
      release: vi.fn(async () => { throw new CustomerDomainError("unavailable"); }),
    };
    const config = { allowedEmail: "admin@example.test", secretKey: "fixture", publishableKey: "" };
    const app = createAdminPortal({
      authenticate: async () => ({ status: "authenticated", identity: { id: "admin", email: config.allowedEmail, role: "content_admin" } }),
    }, config, { registryStore, domainService });
    const response = await app.request("/admin/api/registry", {
      method: "POST",
      body: JSON.stringify({
        version: 1,
        command: { action: "delete_customer", id: fixture.customerId, confirmation: "example-university" },
      }),
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "domain_automation_unavailable" });
    expect(domainService.release).toHaveBeenCalledWith("library.example.edu");
    const unchanged = await registryStore.read();
    expect(unchanged.version).toBe(1);
    expect(unchanged.data.customers.some((customer) => customer.id === fixture.customerId)).toBe(true);
    expect(unchanged.data.portalMembers.some((member) => member.customerId === fixture.customerId)).toBe(true);
  });

  it("releases the exact domain before writing the successful deletion cascade", async () => {
    const fixture = customerForDeletion("library.example.edu", true);
    const order: string[] = [];
    const registryStore = store(fixture.data, () => order.push("write"));
    const domainService = {
      ensure: vi.fn(async () => ({ status: "ready" as const, managedDomain: "unused.example" })),
      release: vi.fn(async () => { order.push("release"); }),
    };
    const config = { allowedEmail: "admin@example.test", secretKey: "fixture", publishableKey: "" };
    const app = createAdminPortal({
      authenticate: async () => ({ status: "authenticated", identity: { id: "admin", email: config.allowedEmail, role: "content_admin" } }),
    }, config, { registryStore, domainService });
    const response = await app.request("/admin/api/registry", {
      method: "POST",
      body: JSON.stringify({
        version: 1,
        command: { action: "delete_customer", id: fixture.customerId, confirmation: "Example University" },
      }),
    });

    expect(response.status).toBe(200);
    expect(domainService.release).toHaveBeenCalledWith("library.example.edu");
    expect(order).toEqual(["release", "write"]);
    const saved = await registryStore.read();
    expect(saved.version).toBe(2);
    expect(saved.data.customers.some((customer) => customer.id === fixture.customerId)).toBe(false);
    expect(saved.data.portalMembers.some((member) => member.customerId === fixture.customerId)).toBe(false);
    expect(saved.data.events.at(-1)).toMatchObject({ action: "delete_customer", entityId: fixture.customerId });
  });
});
