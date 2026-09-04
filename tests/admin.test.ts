import { describe, expect, it } from "vitest";
import { authorizeAdmin, ClerkAdminAuthenticator, CUSTOMER_PORTAL, PLATFORM_ORIGIN } from "../src/admin/identity.js";
import type { AdminAuthentication, AdminAuthenticator } from "../src/admin/identity.js";
import { clerkFrontendHost, createAdminPortal } from "../src/admin/portal.js";
import { demoWorkspace } from "../src/admin/demo-data.js";
import { workspaceClient } from "../src/admin/workspace-client.js";
import { Script } from "node:vm";

const email = "admin@example.test";
const profile = {
  id: "user_admin", banned: false, locked: false, primaryEmailAddressId: "email_primary",
  emailAddresses: [{ id: "email_primary", emailAddress: email, verification: { status: "verified" } }],
};
const config = { allowedEmail: email, secretKey: "test-not-a-secret", publishableKey: `pk_test_${Buffer.from("example.clerk.accounts.dev$").toString("base64")}` };
const appFor = (result: AdminAuthentication) => createAdminPortal({ authenticate: async () => result }, config);

describe("Content Online admin identity boundary", () => {
  it("grants only the verified primary allowlisted email a distinct internal admin role", () => {
    expect(authorizeAdmin(profile, email.toUpperCase())).toEqual({ id: profile.id, email, role: "content_admin" });
  });

  it.each([
    { ...profile, banned: true },
    { ...profile, locked: true },
    { ...profile, primaryEmailAddressId: null },
    { ...profile, primaryEmailAddressId: "other" },
    { ...profile, emailAddresses: [{ ...profile.emailAddresses[0]!, verification: null }] },
    { ...profile, emailAddresses: [{ ...profile.emailAddresses[0]!, verification: { status: "unverified" } }] },
    { ...profile, emailAddresses: [{ ...profile.emailAddresses[0]!, emailAddress: "customer@example.test" }] },
  ])("denies disabled, unverified and non-admin identities", (user) => {
    expect(authorizeAdmin(user, email)).toBeNull();
  });

  it("does not accept an allowlisted secondary email or client-supplied customer admin role", () => {
    const user = { ...profile, primaryEmailAddressId: "customer", unsafeMetadata: { role: "content_admin" },
      emailAddresses: [...profile.emailAddresses, { id: "customer", emailAddress: "customer@example.test", verification: { status: "verified" } }] };
    expect(authorizeAdmin(user, email)).toBeNull();
    expect(authorizeAdmin(profile, "")).toBeNull();
  });

  it("does not authorize customer or legacy operator cookies", async () => {
    const auth = new ClerkAdminAuthenticator(config);
    const result = await auth.authenticate(new Request(`${PLATFORM_ORIGIN}/admin/api/session`, {
      headers: { cookie: "session=customer-admin; co_operator_session=demo-operator", "x-role": "content_admin", "x-email": email },
    }));
    expect(result.status).toBe("unauthenticated");
  });

  it("rejects foreign origins before token validation and fails closed when unconfigured", async () => {
    const auth = new ClerkAdminAuthenticator(config);
    expect(await auth.authenticate(new Request(`${PLATFORM_ORIGIN}/admin/api/session`, {
      headers: { origin: CUSTOMER_PORTAL, authorization: "Bearer fabricated" },
    }))).toEqual({ status: "forbidden" });
    expect(await new ClerkAdminAuthenticator({ ...config, allowedEmail: "" }).authenticate(new Request(PLATFORM_ORIGIN)))
      .toEqual({ status: "unconfigured" });
  });
});

describe("Hosted portal entry and guarded admin API", () => {
  it.each(["unauthenticated", "forbidden", "unconfigured"] as const)("denies %s on every admin API path", async (status) => {
    const app = appFor({ status });
    for (const path of ["/admin/api/session", "/admin/api/workspace", "/admin/api/publishers", "/admin/api/users"]) {
      for (const method of ["GET", "POST"]) {
        const response = await app.request(path, { method });
        expect(response.status).toBe(status === "unauthenticated" ? 401 : status === "forbidden" ? 403 : 503);
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(await response.text()).not.toContain(email);
      }
    }
  });

  it("returns verified admin identity without pretending management is connected", async () => {
    const response = await appFor({ status: "authenticated", identity: { id: "admin", email, role: "content_admin" } }).request("/admin/api/session");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ admin: { role: "content_admin" }, authentication: "development_instance",
      administration: { users: "read_only_demo", publishers: "read_only_demo" } });
  });

  it("serves the read-only internal configuration only after admin authorization", async () => {
    const response = await appFor({ status: "authenticated", identity: { id: "admin", email, role: "content_admin" } }).request("/admin/api/workspace");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("synthetic_configuration");
    expect(body.customers[0].name).toBe("KTH");
    expect(body.users.filter((user: { customer: string }) => user.customer === "KTH").map((user: { role: string }) => user.role)).toEqual(["Kundadministratör", "Läsare"]);
    expect(body.publishers[0]).toMatchObject({ name: "IEEE", route: "MPS / MPS Insight", status: "Inte ansluten" });
    expect(body.storage.status).toBe("blocked_by_decision");
  });

  it("fails closed without revealing provider errors", async () => {
    const auth: AdminAuthenticator = { authenticate: async () => { throw new Error("secret-provider-payload"); } };
    const response = await createAdminPortal(auth, config).request("/admin/api/session");
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret-provider-payload");
  });

  it("keeps public HTML free of admin identity, secret key and customer data", async () => {
    const app = appFor({ status: "unauthenticated" });
    for (const path of ["/", "/admin", "/admin/login", "/admin/registrera"]) {
      const response = await app.request(path);
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(body).not.toContain(config.allowedEmail);
      expect(body).not.toContain(config.secretKey);
      expect(body).not.toContain("demo-operator");
      expect(body).not.toContain("127.0.0.1");
      expect(body).toContain("Content Online");
    }
  });

  it("links to the existing hosted customer app without granting admin credentials", async () => {
    const response = await appFor({ status: "unauthenticated" }).request("/kundportal?redirect=https://evil.example");
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(`${CUSTOMER_PORTAL}/login`);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("validates the Clerk frontend host before putting it in HTML", () => {
    expect(clerkFrontendHost(config.publishableKey)).toBe("example.clerk.accounts.dev");
    for (const invalid of ["", "pk_test_bad", `pk_test_${Buffer.from('evil.example/\"><script>$').toString("base64")}`]) {
      expect(clerkFrontendHost(invalid)).toBeNull();
    }
  });
});

describe('public presentation demo', () => {
  it('serves synthetic fixtures without creating an admin session or accepting writes', async () => {
    const app = appFor({ status: 'unauthenticated' });
    const response = await app.request('/demo/workspace');
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect((await response.json()).provenance.status).toBe('Demo – ingen extern import');
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      expect((await app.request('/demo/workspace', { method })).status).toBe(404);
      expect((await app.request('/admin/api/workspace?demo=true', { method })).status).toBe(401);
    }
    expect((await app.request('/admin/api/workspace?demo=true')).status).toBe(401);
  });
  it('has internally consistent customer assignments and no dangling products', () => {
    for (const customer of demoWorkspace.customers) {
      const assignments = demoWorkspace.assignments.filter(a => a.customerId === customer.id);
      expect(assignments.map(a => a.productId)).toEqual(customer.productIds);
      expect(customer.products).toBe(assignments.length);
      expect(customer.users).toBe(demoWorkspace.users.filter(u => u.customerId === customer.id).length);
      for (const id of customer.productIds) expect(demoWorkspace.products.some(p => p.id === id)).toBe(true);
    }
    for (const product of demoWorkspace.products) expect(demoWorkspace.publishers.some(p => p.id === product.publisherId)).toBe(true);
  });
  it('ships parseable browser JavaScript without credentials', () => {
    expect(() => new Script(workspaceClient)).not.toThrow();
    expect(workspaceClient).not.toContain(config.secretKey);
    expect(workspaceClient).not.toContain(config.allowedEmail);
  });
});
