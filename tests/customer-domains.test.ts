import { describe, expect, it, vi } from "vitest";
import { createAdminPortal } from "../src/admin/portal.js";
import { initialRegistry, type RegistryStore } from "../src/admin/registry.js";
import { VercelCustomerDomainService } from "../src/customer-portal/domains.js";

function store(): RegistryStore {
  let version = 1;
  let data = initialRegistry();
  return {
    read: async () => ({ version, data }),
    write: async (expected, next) => {
      expect(expected).toBe(version);
      version += 1;
      data = next;
      return { version, data };
    },
  };
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

  it("keeps the ensure endpoint admin-only and persists verified status", async () => {
    const registryStore = store();
    const domainService = { ensure: vi.fn(async () => ({ status: "ready" as const, managedDomain: "*.portal.contentonline.se" })) };
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
});
