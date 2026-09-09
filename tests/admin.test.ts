import { describe, expect, it, vi } from "vitest";
import { authorizeAdmin, ClerkAdminAuthenticator, PLATFORM_ORIGIN } from "../src/admin/identity.js";
import type { AdminAuthentication, AdminAuthenticator } from "../src/admin/identity.js";
import { clerkFrontendHost, createAdminPortal } from "../src/admin/portal.js";
import { assistantClient } from "../src/admin/assistant-client.js";
import { demoWorkspace } from "../src/admin/demo-data.js";
import { initialRegistry, registrySchema, type Registry, type RegistryStore } from "../src/admin/registry.js";
import { workspaceClient } from "../src/admin/workspace-client.js";
import type { CustomerAuthentication, CustomerAuthenticator } from "../src/customer-portal/identity.js";
import { Script } from "node:vm";

const email = "admin@example.test";
const profile = {
  id: "user_admin", banned: false, locked: false, primaryEmailAddressId: "email_primary",
  emailAddresses: [{ id: "email_primary", emailAddress: email, verification: { status: "verified" } }],
};
const config = { allowedEmail: email, secretKey: "test-not-a-secret", publishableKey: `pk_test_${Buffer.from("example.clerk.accounts.dev$").toString("base64")}` };
const appFor = (result: AdminAuthentication, options: Parameters<typeof createAdminPortal>[2] = {}) =>
  createAdminPortal({ authenticate: async () => result }, config, options);

const customerAuthenticatorFor = (result: CustomerAuthentication): CustomerAuthenticator => ({
  authenticate: async () => result,
});

const readOnlyRegistryStore = (data: Registry): RegistryStore => ({
  read: async () => ({ version: 1, data }),
  write: async () => { throw new Error("read-only test store"); },
});

function portalAccessRegistry(): Registry {
  const base = initialRegistry();
  return registrySchema.parse({
    ...base,
    customers: [
      ...base.customers,
      { id: "customer-alpha", name: "Alpha University", slug: "alpha", status: "published", kind: "customer", publisherIds: [] },
      { id: "customer-beta", name: "Beta Institute", slug: "beta", status: "published", kind: "customer", publisherIds: [] },
      { id: "customer-draft", name: "Draft College", slug: "draft", status: "draft", kind: "customer", publisherIds: [] },
      { id: "customer-archived", name: "Archived Academy", slug: "archived", status: "archived", kind: "customer", publisherIds: [] },
      { id: "customer-inactive", name: "Inactive School", slug: "inactive", status: "published", kind: "customer", publisherIds: [] },
    ],
    portalMembers: [
      { id: "member-one-alpha", customerId: "customer-alpha", verifiedEmail: "one@example.test", externalUserId: "customer-one", displayName: "One Alpha", role: "customer_admin", status: "active" },
      { id: "member-many-alpha", customerId: "customer-alpha", verifiedEmail: "many@example.test", externalUserId: "customer-many", displayName: "Many Alpha", role: "customer_reader", status: "active" },
      { id: "member-many-beta", customerId: "customer-beta", verifiedEmail: "many@example.test", externalUserId: "customer-many", displayName: "Many Beta", role: "customer_admin", status: "active" },
      { id: "member-many-draft", customerId: "customer-draft", verifiedEmail: "many@example.test", externalUserId: "customer-many", displayName: "Many Draft", role: "customer_admin", status: "active" },
      { id: "member-many-archived", customerId: "customer-archived", verifiedEmail: "many@example.test", externalUserId: "customer-many", displayName: "Many Archived", role: "customer_admin", status: "active" },
      { id: "member-many-inactive", customerId: "customer-inactive", verifiedEmail: "many@example.test", externalUserId: "customer-many", displayName: "Many Inactive", role: "customer_admin", status: "inactive" },
    ],
  });
}

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
      headers: { origin: "https://customer.example.test", authorization: "Bearer fabricated" },
    }))).toEqual({ status: "forbidden" });
    expect(await new ClerkAdminAuthenticator({ ...config, allowedEmail: "" }).authenticate(new Request(PLATFORM_ORIGIN)))
      .toEqual({ status: "unconfigured" });
  });
});

describe("Hosted portal entry and guarded admin API", () => {
  it.each([
    ["unauthenticated", 401],
    ["forbidden", 403],
    ["unconfigured", 503],
  ] as const)("maps customer authentication status %s without invoking admin authorization", async (status, expectedStatus) => {
    const adminAuthenticator: AdminAuthenticator = {
      authenticate: vi.fn(async () => ({ status: "forbidden" as const })),
    };
    const app = createAdminPortal(adminAuthenticator, config, {
      customerAuthenticator: customerAuthenticatorFor({ status }),
      registryStore: readOnlyRegistryStore(portalAccessRegistry()),
    });

    const response = await app.request("/v1/portal-entries");
    expect(response.status).toBe(expectedStatus);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ error: status });
    expect(adminAuthenticator.authenticate).not.toHaveBeenCalled();
  });

  it("returns no portal entries for an authenticated identity without active membership", async () => {
    const app = appFor({ status: "unauthenticated" }, {
      customerAuthenticator: customerAuthenticatorFor({
        status: "authenticated",
        identity: { id: "customer-zero", email: "zero@example.test" },
      }),
      registryStore: readOnlyRegistryStore(portalAccessRegistry()),
    });

    const response = await app.request("/v1/portal-entries");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ entries: [] });
  });

  it("claims a pending verified-email invitation once and then requires the bound provider identity", async () => {
    let data = portalAccessRegistry();
    data.portalMembers.find(member => member.id === "member-one-alpha")!.externalUserId = null;
    let version = 1;
    const write = vi.fn(async (expectedVersion: number, next: Registry) => {
      expect(expectedVersion).toBe(version);
      version += 1;
      data = next;
      return { version, data };
    });
    const store: RegistryStore = { read: async () => ({ version, data }), write };
    const app = appFor({ status: "unauthenticated" }, {
      customerAuthenticator: customerAuthenticatorFor({
        status: "authenticated",
        identity: { id: "customer-one", email: "one@example.test" },
      }),
      registryStore: store,
      now: () => new Date("2026-09-09T12:00:00Z"),
    });

    expect((await app.request("/v1/portal-entries")).status).toBe(200);
    expect(write).toHaveBeenCalledOnce();
    expect(data.portalMembers.find(member => member.id === "member-one-alpha")?.externalUserId).toBe("customer-one");
    expect(data.events.at(-1)).toMatchObject({ action: "bind_portal_identity", actor: "customer-one" });
    expect((await app.request("/v1/portal-entries")).status).toBe(200);
    expect(write).toHaveBeenCalledOnce();

    const recreated = appFor({ status: "unauthenticated" }, {
      customerAuthenticator: customerAuthenticatorFor({
        status: "authenticated",
        identity: { id: "replacement-account", email: "one@example.test" },
      }),
      registryStore: store,
    });
    await expect((await recreated.request("/v1/portal-entries")).json()).resolves.toEqual({ entries: [] });
    expect(write).toHaveBeenCalledOnce();
  });

  it("returns one server-owned published portal entry without exposing identity or request input", async () => {
    const requestedSlug = "private-unlisted-slug";
    const app = appFor({ status: "unauthenticated" }, {
      customerAuthenticator: customerAuthenticatorFor({
        status: "authenticated",
        identity: { id: "customer-one", email: "ONE@EXAMPLE.TEST" },
      }),
      registryStore: readOnlyRegistryStore(portalAccessRegistry()),
    });

    const response = await app.request(`/v1/portal-entries?portal=${requestedSlug}&token=browser-secret`);
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(JSON.parse(body)).toEqual({
      entries: [{
        organizationId: "customer-alpha",
        organizationName: "Alpha University",
        slug: "alpha",
        displayName: "One Alpha",
        role: "customer_admin",
      }],
    });
    for (const privateValue of [requestedSlug, "browser-secret", "ONE@EXAMPLE.TEST", config.secretKey]) {
      expect(body).not.toContain(privateValue);
    }
  });

  it("returns all and only active memberships for published non-demo customers", async () => {
    const app = appFor({ status: "unauthenticated" }, {
      customerAuthenticator: customerAuthenticatorFor({
        status: "authenticated",
        identity: { id: "customer-many", email: "many@example.test" },
      }),
      registryStore: readOnlyRegistryStore(portalAccessRegistry()),
    });

    const response = await app.request("/v1/portal-entries");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.entries).toEqual([
      expect.objectContaining({ organizationId: "customer-alpha", slug: "alpha", role: "customer_reader" }),
      expect.objectContaining({ organizationId: "customer-beta", slug: "beta", role: "customer_admin" }),
    ]);
    expect(JSON.stringify(body)).not.toMatch(/draft|archived|inactive|customer-kth-demo/i);
  });

  it("fails closed when customer identity or registry lookup throws and never reflects provider details", async () => {
    const providerSecret = "provider-secret-payload";
    const unavailableAuthenticator: CustomerAuthenticator = {
      authenticate: async () => { throw new Error(providerSecret); },
    };
    const authenticationFailure = await appFor({ status: "unauthenticated" }, {
      customerAuthenticator: unavailableAuthenticator,
      registryStore: readOnlyRegistryStore(portalAccessRegistry()),
    }).request("/v1/portal-entries");
    expect(authenticationFailure.status).toBe(503);
    const authenticationFailureBody = await authenticationFailure.text();
    expect(authenticationFailureBody).toBe('{"error":"authentication_temporarily_unavailable"}');

    const storageFailure = await appFor({ status: "unauthenticated" }, {
      customerAuthenticator: customerAuthenticatorFor({
        status: "authenticated",
        identity: { id: "customer", email: "one@example.test" },
      }),
      registryStore: {
        read: async () => { throw new Error(providerSecret); },
        write: async () => { throw new Error("unreachable"); },
      },
    }).request("/v1/portal-entries");
    expect(storageFailure.status).toBe(503);
    const storageFailureBody = await storageFailure.text();
    expect(storageFailureBody).toBe('{"error":"portal_directory_unavailable"}');
    expect(authenticationFailureBody + storageFailureBody).not.toContain(providerSecret);
  });

  it.each(["unauthenticated", "forbidden", "unconfigured"] as const)("denies %s on every admin API path", async (status) => {
    const app = appFor({ status });
    for (const path of ["/admin/api/session", "/admin/api/workspace", "/admin/api/assistant/message", "/admin/api/jobs", "/admin/api/jobs/platform-readiness/run", "/admin/api/publishers", "/admin/api/users"]) {
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
      administration: { users: "read_only_demo", publishers: "persistent_registry" } });
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

  it("answers through the protected assistant API and validates input", async () => {
    const app = appFor({ status: "authenticated", identity: { id: "admin", email, role: "content_admin" } }, { assistantApiKey: "" });
    const response = await app.request("/admin/api/assistant/message", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Vad kan plattformen göra nu?" }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ mode: "local_fallback" });

    const invalid = await app.request("/admin/api/assistant/message", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "" }),
    });
    expect(invalid.status).toBe(422);
  });

  it("lists and runs only allowlisted jobs after admin authorization", async () => {
    const app = appFor({ status: "authenticated", identity: { id: "admin", email, role: "content_admin" } }, {
      now: () => new Date("2026-09-05T06:10:00.000Z"),
    });
    const list = await app.request("/admin/api/jobs");
    expect(list.status).toBe(200);
    expect((await list.json()).jobs).toHaveLength(3);

    const run = await app.request("/admin/api/jobs/customer-scope-audit/run", { method: "POST" });
    expect(run.status).toBe(200);
    expect(await run.json()).toMatchObject({ execution: { status: "completed", persisted: false } });

    const arbitrary = await app.request("/admin/api/jobs/arbitrary/run", { method: "POST" });
    expect(arbitrary.status).toBe(404);
  });

  it("protects the scheduled readiness job with a server-only secret", async () => {
    const app = appFor({ status: "unauthenticated" }, {
      cronSecret: "test-cron-secret",
      now: () => new Date("2026-09-05T06:10:00.000Z"),
    });
    expect((await app.request("/api/cron/platform-readiness")).status).toBe(401);
    expect((await app.request("/api/cron/platform-readiness", { headers: { authorization: "Bearer wrong" } })).status).toBe(401);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const response = await app.request("/api/cron/platform-readiness", { headers: { authorization: "Bearer test-cron-secret" } });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ execution: { jobId: "platform-readiness", status: "attention_needed" } });
    expect(info).toHaveBeenCalledWith("admin_cron_completed", expect.objectContaining({ jobId: "platform-readiness" }));
    info.mockRestore();
  });

  it("fails closed without revealing provider errors", async () => {
    const auth: AdminAuthenticator = { authenticate: async () => { throw new Error("secret-provider-payload"); } };
    const response = await createAdminPortal(auth, config).request("/admin/api/session");
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret-provider-payload");
  });

  it("keeps public HTML free of admin identity, secret key and customer data", async () => {
    const app = appFor({ status: "unauthenticated" });
    for (const path of ["/", "/login", "/admin", "/admin/login", "/admin/registrera"]) {
      const response = await app.request(path);
      const body = await response.text();
      expect(response.status).toBe(200);
      expect(body).not.toContain(config.allowedEmail);
      expect(body).not.toContain(config.secretKey);
      expect(body).not.toContain("demo-operator");
      expect(body).not.toContain("Hampus");
      expect(body).not.toContain("Bibbi");
      expect(body).not.toContain("127.0.0.1");
      expect(body).toContain("Content Online");
    }
  });

  it("uses the supplied Content Online brand assets without changing the auth boundary", async () => {
    const app = appFor({ status: "unauthenticated" });
    const login = await (await app.request("/admin/login")).text();
    const register = await (await app.request("/admin/registrera")).text();
    const styles = await (await app.request("/admin/assets/style.css")).text();

    for (const body of [login, register]) {
      expect(body).toContain('/admin/assets/co-logo.png');
      expect(body).toContain('/admin/assets/home-video.webm');
      expect(body).toContain('autoplay muted loop playsinline');
      expect(body).not.toContain('href="/demo"');
      expect(body).not.toContain('Se visningsdemon');
      expect(body).not.toContain(config.allowedEmail);
      expect(body).not.toContain(config.secretKey);
    }
    expect(styles).toContain('@media(prefers-reduced-motion:reduce)');
    expect(styles).toContain('logo-draw-in');
    expect(styles).toContain('brand-dock');
    expect(styles).toContain('orbit-dot-lap');
    expect(styles).not.toContain('logo-scan-in');
  });

  it.each(["/", "/login", "/admin/login", "/admin/registrera", "/demo"])("keeps the protected assistant out of %s", async (path) => {
    const response = await appFor({ status: "unauthenticated" }).request(path);
    const body = await response.text();
    expect(body).not.toContain('id="assistant-launcher"');
    expect(body).not.toContain('/admin/assets/assistant.css');
    expect(body).not.toContain('/admin/assets/assistant.js');
  });

  it("uses grouped workspace navigation and keeps the chat exclusive to admin", async () => {
    const app = appFor({ status: "unauthenticated" });
    for (const path of ["/demo", "/admin"]) {
      const body = await (await app.request(path)).text();
      expect(body).toContain("/admin/assets/workspace.js");
      expect(body).toContain('class="brand portal-brand"');
      expect(body).toContain('/admin/assets/co-logo.png');
      expect(body).toContain('INTERN ARBETSYTA');
      expect(body).toContain('data-nav-group="customers"');
      expect(body).toContain('data-nav-group="connections"');
      expect(body).not.toContain('Användare <small>Välj kund</small>');
      expect(body).toContain('Cronjobb <small>Välj kund</small>');
      expect(body).toContain('Rapportflöde <small>Välj kund</small>');
      for (const id of ["overview", "customers", "publishers", "products", "connections", "salesforce"]) {
        expect(body).toContain('data-id="' + id + '"');
      }
      expect(body).not.toContain('data-id="users"');
      expect(body).not.toContain('Kundregister & kundportaler');
    }
    const demo = await (await app.request("/demo")).text();
    expect(demo).not.toContain('id="assistant-launcher"');
    const admin = await (await app.request("/admin")).text();
    expect(admin).toContain('id="assistant-launcher"');
    expect(admin).toContain('id="assistant-app" hidden');
    expect(admin).toContain("Frågan skickas till OpenAI");
    expect(admin).not.toContain('data-assistant-tab');
    expect(admin).not.toContain('id="assistant-customers"');
    expect(admin).not.toContain('id="assistant-jobs"');
    const start = await (await app.request("/")).text();
    expect(start).toContain('data-page="customer-landing"');
    expect(start).toContain('data-customer-login');
    expect(start).toContain('href="/login"');
    expect(start).toContain('src="/customer-landing/hero-wide.jpg"');
    expect(start).toContain('id="landing-hero-reveal"');
    expect(start).toContain('class="landing-hero-reveal-aura"');
    expect(start).toContain('id="mission"');
    expect(start).toContain('id="resources"');
    expect(start).toContain('id="institutions"');
    expect(start).toContain('data-resource-tab="journals"');
    expect(start).toContain('role="tabpanel"');
    expect(start).toContain('src="/customer-landing/platform.jpg"');
    expect(start.match(/data-resource-hotspot=/g)).toHaveLength(4);
    expect(start).toContain('aria-label="Show eBooks"');
    expect(start).toContain('role="group" aria-label="Explore the resource types on the image"');
    expect(start).toContain('id="landing-clean-frame"');
    expect(start).toContain('id="landing-clean-canvas"');
    expect(start).toContain('class="landing-clean-toggle"');
    expect(start).toContain('src="/customer-landing/reveal.jpg"');
    expect(start).toContain('src="/customer-landing/lab.jpg"');
    expect(start).toContain('srcset="/customer-landing/lab-640.jpg 640w');
    expect(start).toContain('aria-label="Customer log in"');
    expect(start.match(/<h1\b/g)).toHaveLength(1);
    expect(start).toContain('id="customer-login-dialog"');
    expect(start).toContain('id="customer-auth-widget"');
    expect(start).toContain('data-customer-access-autostart="false"');
    expect(start).toContain('data-customer-access-return-url="/?login=1"');
    expect(start).toContain('clerk.browser.js');
    expect(start).toContain('src="/customer-portal/assets/access.js"');
    expect(start).not.toContain('content-online-customer-login');
    expect(start).not.toContain("<iframe");
    expect(start).not.toMatch(/6M\+|250K\+|Head Librarian|webinar/i);
    expect(start).not.toContain("INTERN ÅTKOMST");
    expect(start).not.toContain("KTH");
    const customerLogin = await (await app.request("/login")).text();
    expect(customerLogin).toContain('data-customer-access-mode="login"');
    expect(customerLogin).toContain('id="customer-auth-widget"');
    expect(customerLogin).toContain('href="/admin/login"');
    expect(customerLogin).toContain("Kundåtkomst");
    expect(customerLogin).not.toContain("INTERN ÅTKOMST");
    const staffLogin = await (await app.request("/admin/login")).text();
    expect(staffLogin).toContain('data-mode="login"');
    expect(staffLogin).toContain('id="auth-widget"');
    expect(staffLogin).toContain("INTERN ÅTKOMST");
    expect(staffLogin).not.toContain('href="/demo"');
    expect(staffLogin).not.toContain("Se visningsdemon");
    expect(staffLogin).not.toContain('id="customer-auth-widget"');
  });

  it("serves dependency-free, parseable assets for the public customer landing", async () => {
    const app = appFor({ status: "unauthenticated" });
    const clientResponse = await app.request("/customer-landing/assets/client.js");
    const client = await clientResponse.text();
    expect(clientResponse.status).toBe(200);
    expect(clientResponse.headers.get("content-type")).toContain("text/javascript");
    expect(() => new Script(client)).not.toThrow();
    expect(client).not.toContain("content-online-customer-login");
    expect(client).toContain("main.inert = open");
    expect(client).toContain("Close menu");
    expect(client).toContain("requestAnimationFrame(() => firstLink.focus())");
    expect(client).toContain("first && first.focus()");
    expect(client).toContain("IntersectionObserver");
    expect(client).toContain("dataset.resourceTab");
    expect(client).toContain("prefers-reduced-motion: reduce");
    expect(client).toContain("(hover: hover) and (pointer: fine)");
    expect(client).toContain("portrait.addEventListener('pointermove', moveReveal)");
    expect(client).toContain("context.globalCompositeOperation = 'source-in'");
    expect(client).toContain("const maxBackingPixels = 2400000");
    expect(client).toContain("points.length > 48");
    expect(client).toContain("rect.bottom <= 0 || rect.top >= window.innerHeight");
    expect(client).toContain("getComputedStyle(image).objectPosition");
    expect(client).toContain("if (revealDisabled) releaseReveal()");
    expect(client).toContain("if (finePointer.matches && !revealDisabled) resizeReveal()");
    expect(client).toContain("const releaseReveal = () =>");
    expect(client).toContain("revealCanvas.width = 1");
    expect(client).toContain("const shrinkProgress = Math.min(progress / 0.46, 1)");
    expect(client).toContain("const exitProgress = Math.min(Math.max((progress - 0.86) / 0.14, 0), 1)");
    expect(client).toContain("resourceTabs[nextIndex]");
    expect(client).toContain("dataset.resourceHotspot === resource");
    expect(client).toContain("hotspot.addEventListener('pointerenter'");
    expect(client).toContain("loginDialog.showModal()");
    expect(client).toContain("new Event('customer-access:open')");
    expect(client).toContain("url.searchParams.set('login', '1')");
    expect(client).toContain("event.target === loginDialog");
    expect(client).toContain("const initCleanReveal = () =>");
    expect(client).toContain("const maxBackingPixels = 1600000");
    expect(client).toContain("points.length > 52");
    expect(client).toContain("frame.addEventListener('pointermove', moveCleanReveal)");
    expect(client).toContain("finePointer.matches && !reducedMotion.matches");
    expect(client).toContain("toggle.addEventListener('click'");
    expect(client).toContain("setFullReveal(!fullReveal)");

    const styleResponse = await app.request("/customer-landing/assets/style.css");
    const styles = await styleResponse.text();
    expect(styleResponse.status).toBe(200);
    expect(styleResponse.headers.get("content-type")).toContain("text/css");
    expect(styles).toContain("prefers-reduced-motion");
    expect(styles).toContain(".landing-login");
    expect(styles).toContain('url("/customer-landing/MonaSans-Variable.woff2")');
    expect(styles).toContain(".landing-hero-scroll");
    expect(styles).toContain(".landing-card-fan");
    expect(styles).toContain(".landing-hero-reveal");
    expect(styles).toContain("@media (hover: hover) and (pointer: fine)");
    expect(styles).toContain("(prefers-reduced-motion: no-preference)");
    expect(styles).toContain("filter: grayscale(1) contrast(1.03)");
    expect(styles).toContain(".landing-resource-hotspot");
    expect(styles).toContain(".landing-clean-frame");
    expect(styles).toContain("filter: blur(14px) grayscale(1) brightness(.55)");
    expect(styles).not.toContain("backdrop-filter");
  });

  it("does not treat a transient Clerk reconnect as a signed-out session", () => {
    expect(workspaceClient).toContain("if(Clerk.session===null)");
    expect(workspaceClient).toContain("if(state.session===null)");
    expect(workspaceClient).not.toContain("if(!s.session)");
    expect(workspaceClient).not.toContain("adminHeaders");
    expect(workspaceClient).toContain("headers:await freshAdminHeaders()");
    expect(workspaceClient).toContain("Clerk.addListener(handleClerkState)");
    expect(workspaceClient).toContain("if(window.Clerk?.session===undefined)hideProtectedWorkspace");
    expect(workspaceClient).toContain("},15000)");
  });

  it("does not invoke the assistant for a demo visitor or customer cookie", async () => {
    const askAssistant = vi.fn();
    const app = appFor({ status: "unauthenticated" }, { askAssistant });
    await app.request("/demo");
    const response = await app.request("/admin/api/assistant/message?demo=true", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=customer-admin; co_operator_session=demo-operator" },
      body: JSON.stringify({ message: "Visa kunder" }),
    });
    expect(response.status).toBe(401);
    expect(askAssistant).not.toHaveBeenCalled();
  });

  it("opens the compact admin chat without requesting data before workspace authorization", () => {
    const launcher = { setAttribute: vi.fn(), focus: vi.fn(), addEventListener: vi.fn() };
    const panel = { hidden: true };
    const close = { focus: vi.fn(), addEventListener: vi.fn() };
    const elements: Record<string, unknown> = { "assistant-launcher": launcher, "assistant-panel": panel, "assistant-close": close };
    const fetchSpy = vi.fn();
    const document = { body: { dataset: { mode: "admin" } }, getElementById: (id: string) => elements[id], addEventListener: vi.fn() };
    new Script(assistantClient).runInNewContext({ document, fetch: fetchSpy });
    launcher.addEventListener.mock.calls[0]![1]();
    expect(panel.hidden).toBe(false);
    expect(launcher.setAttribute).toHaveBeenLastCalledWith("aria-expanded", "true");
    close.addEventListener.mock.calls[0]![1]();
    expect(panel.hidden).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("serves parseable assistant JavaScript without credentials", async () => {
    expect(() => new Script(assistantClient)).not.toThrow();
    expect(assistantClient).not.toContain(config.secretKey);
    expect(assistantClient).not.toContain(config.allowedEmail);
    expect(assistantClient).not.toContain("DID_AGENTS_API");
    expect(assistantClient).not.toContain("agent.d-id.com");
    expect(assistantClient).not.toContain("assistant-presenter");
    const response = await appFor({ status: "unauthenticated" }).request("/admin/assets/assistant.js");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/javascript");
    const css = await (await appFor({ status: "unauthenticated" }).request("/admin/assets/assistant.css")).text();
    expect(css).toContain("width:min(380px");
    expect(css).toContain("height:min(560px");
    expect(css).not.toContain(".assistant-tabs");
  });

  it("keeps the customer-facing D-ID agent out of the internal admin portal", async () => {
    for (const path of ["/", "/admin", "/demo", "/admin/assets/assistant.js", "/admin/assets/assistant.css"]) {
      const body = await (await appFor({ status: "unauthenticated" }).request(path)).text();
      expect(body).not.toContain("agent.d-id.com");
      expect(body).not.toContain("assistant-presenter");
      expect(body).not.toContain("Starta agenten här");
    }
    const admin = await (await appFor({ status: "unauthenticated" }).request("/admin")).text();
    expect(admin).toContain("Intern kunskapsassistent");
    expect(admin).toContain("Fråga CO");
    expect(admin).not.toContain("D-ID-agenten finns i kundportalen");
  });

  it("routes legacy customer selectors to customer login and preserves only a valid portal slug", async () => {
    const app = appFor({ status: "unauthenticated" });
    for (const path of ["/kundportal?redirect=https://evil.example", "/portal/login?portal=%2F%2Fevil.example"]) {
      const response = await app.request(path);
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe("/login");
      expect(response.headers.get("set-cookie")).toBeNull();
    }
    for (const path of ["/kundportal?portal=alpha", "/portal/login?portal=alpha"]) {
      const response = await app.request(path);
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe("/login?portal=alpha");
      expect(response.headers.get("set-cookie")).toBeNull();
    }

    const preferredPortal = await app.request("/?portal=alpha");
    expect(preferredPortal.status).toBe(302);
    expect(preferredPortal.headers.get("location")).toBe("/login?portal=alpha");
    expect(preferredPortal.headers.get("set-cookie")).toBeNull();

    const invalidPortal = await app.request("/?portal=%2F%2Fevil.example");
    expect(invalidPortal.status).toBe(200);
    expect(invalidPortal.headers.get("set-cookie")).toBeNull();
    const invalidPortalBody = await invalidPortal.text();
    expect(invalidPortalBody).toContain('data-page="customer-landing"');
    expect(invalidPortalBody).not.toContain("evil.example");
    expect(invalidPortalBody).toContain('id="customer-login-dialog"');
    expect(invalidPortalBody).toContain('id="customer-auth-widget"');
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
