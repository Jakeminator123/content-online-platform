import { beforeEach, describe, expect, it } from "vitest";
import productionApp, { createApp } from "../src/app.js";
import {
  StaticBearerIdentityProvider,
  UnconfiguredIdentityProvider,
} from "../src/adapters/identity.js";
import { InMemoryPortalRepository } from "../src/adapters/in-memory-repository.js";
import type { BackendDependencies } from "../src/application/ports.js";
import type { Membership } from "../src/domain/models.js";
import { createDemoDependencies, DEMO_TOKENS } from "../src/testing/demo-system.js";

describe("Content Online backend API", () => {
  let dependencies: BackendDependencies;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    dependencies = await createDemoDependencies();
    app = createApp(dependencies);
  });

  it("exports a Vercel-compatible production app without enabling demo auth", async () => {
    const health = await productionApp.request("/health");
    expect(health.status).toBe(200);

    const protectedRoute = await productionApp.request("/v1/me", {
      headers: { authorization: `Bearer ${DEMO_TOKENS.adminA}` },
    });
    expect(protectedRoute.status).toBe(503);
    await expect(protectedRoute.json()).resolves.toMatchObject({
      error: "identity_provider_not_configured",
    });
  });

  it("keeps health and OpenAPI public but protects every v1 route", async () => {
    const health = await app.request("/health");
    expect(health.status).toBe(200);
    await expect(health.json()).resolves.toMatchObject({ status: "ok" });

    const specification = await app.request("/openapi.json");
    expect(specification.status).toBe(200);
    const openApi = await specification.json();
    expect(openApi).toMatchObject({
      openapi: "3.1.0",
      paths: {
        "/v1/me": expect.any(Object),
        "/v1/organizations/{organizationId}/usage": expect.any(Object),
      },
    });

    const unauthenticated = await app.request("/v1/me");
    expect(unauthenticated.status).toBe(401);
    await expect(unauthenticated.json()).resolves.toMatchObject({ error: "unauthorized" });
  });

  it("maps the librarian to Kundadmin using server-owned membership data", async () => {
    const response = await requestAs(app, DEMO_TOKENS.adminA, "/v1/me");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      user: {
        accountType: "customer",
        displayName: "Synthetic Librarian",
      },
      memberships: [{ organizationId: "org-a", role: "customer_admin" }],
      operatorScopes: [],
    });
  });

  it("gives Kundadmin a synthetic organization overview and fixed-price CPD", async () => {
    const overview = await requestAs(
      app,
      DEMO_TOKENS.adminA,
      "/v1/organizations/org-a/overview",
    );
    expect(overview.status).toBe(200);
    await expect(overview.json()).resolves.toMatchObject({
      organization: { id: "org-a" },
      effectiveRole: "customer_admin",
      summary: {
        activeProducts: 1,
        usageObservations: 1,
        sourcesWithMissingUsage: 0,
      },
    });

    const usage = await requestAs(app, DEMO_TOKENS.adminA, "/v1/organizations/org-a/usage");
    expect(usage.status).toBe(200);
    await expect(usage.json()).resolves.toMatchObject({
      effectiveRole: "customer_admin",
      observations: [
        {
          organizationId: "org-a",
          publisherId: "ieee",
          providerId: "mps",
          value: 10_000,
          provenance: {
            mode: "demo",
            adapterId: "ieee-mps",
          },
        },
      ],
      costAnalyses: [
        {
          entitlementId: "entitlement-ieee-a-2026",
          metricCode: "approved_downloads",
          calculation: {
            status: "calculated",
            basis: "fixed_agreed_price",
            inputStatus: "demo_or_unapproved",
            numerator: {
              amountMinor: 10_000_000,
              currency: "SEK",
              period: { start: "2026-01-01", endExclusive: "2027-01-01" },
              approvalStatus: "demo_assumption",
              provenance: {
                mode: "demo",
                sourceSystem: "synthetic-fixture",
              },
            },
            denominator: {
              metricCode: "approved_downloads",
              value: 10_000,
              period: { start: "2026-01-01", endExclusive: "2027-01-01" },
              coverage: "complete",
              semanticStatus: "exact",
              comparabilityKey: "approved_downloads/v1",
            },
            result: { amount: "10.00", currency: "SEK", unit: "per_usage" },
          },
        },
      ],
    });
  });

  it("blocks CPD when more than one period total exists for the same entitlement", async () => {
    const [original] = await dependencies.repository.listUsage("org-a");
    if (!original) throw new Error("Expected the synthetic usage fixture.");

    await dependencies.repository.upsertUsage([
      { ...original, value: 4_000 },
      {
        ...original,
        id: `${original.id}:duplicate-total`,
        value: 6_000,
        provenance: {
          ...original.provenance,
          sourceRecordKey: `${original.provenance.sourceRecordKey}:duplicate-total`,
        },
      },
    ]);

    const response = await requestAs(
      app,
      DEMO_TOKENS.adminA,
      "/v1/organizations/org-a/usage",
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.observations).toHaveLength(2);
    expect(body.costAnalyses).toEqual([
      {
        entitlementId: "entitlement-ieee-a-2026",
        metricCode: "approved_downloads",
        calculation: { status: "not_calculable", reason: "ambiguous_aggregate" },
      },
    ]);
    expect(body.observations.every((item: Record<string, unknown>) => !("costAnalysis" in item))).toBe(
      true,
    );
  });

  it("never exposes commercial fields or member administration to Läsare", async () => {
    const portfolio = await requestAs(
      app,
      DEMO_TOKENS.readerA,
      "/v1/organizations/org-a/portfolio",
    );
    expect(portfolio.status).toBe(200);
    const portfolioBody = await portfolio.json();
    expect(portfolioBody.effectiveRole).toBe("customer_reader");
    expect(portfolioBody.items[0]).not.toHaveProperty("fixedPrice");

    const usage = await requestAs(app, DEMO_TOKENS.readerA, "/v1/organizations/org-a/usage");
    expect(usage.status).toBe(200);
    const usageBody = await usage.json();
    expect(usageBody).not.toHaveProperty("costAnalyses");

    const members = await requestAs(
      app,
      DEMO_TOKENS.readerA,
      "/v1/organizations/org-a/members",
    );
    expect(members.status).toBe(403);
    await expect(members.json()).resolves.toMatchObject({ error: "insufficient_role" });
  });

  it("returns 404 and writes an audit event for cross-tenant access", async () => {
    const response = await requestAs(
      app,
      DEMO_TOKENS.adminA,
      "/v1/organizations/org-b/overview",
    );
    expect(response.status).toBe(404);

    const auditEvents = await dependencies.repository.listAuditEvents();
    expect(auditEvents).toContainEqual(
      expect.objectContaining({
        actorUserId: "user-admin-a",
        organizationId: "org-b",
        action: "organization.access",
        result: "denied",
      }),
    );
  });

  it("keeps Content Online operator access separate and explicitly scoped", async () => {
    const me = await requestAs(app, DEMO_TOKENS.operator, "/v1/me");
    expect(me.status).toBe(200);
    await expect(me.json()).resolves.toMatchObject({
      user: { accountType: "content_operator" },
      memberships: [],
      operatorScopes: [{ organizationId: "org-a" }],
    });

    const allowed = await requestAs(
      app,
      DEMO_TOKENS.operator,
      "/v1/organizations/org-a/members",
    );
    expect(allowed.status).toBe(200);
    expect(await dependencies.repository.listAuditEvents()).toContainEqual(
      expect.objectContaining({
        actorUserId: "user-operator",
        effectiveRole: "content_operator",
        organizationId: "org-a",
        action: "organization.access",
        result: "success",
      }),
    );

    const denied = await requestAs(
      app,
      DEMO_TOKENS.operator,
      "/v1/organizations/org-b/overview",
    );
    expect(denied.status).toBe(404);
  });

  it("lets a reader create and follow only their own ticket", async () => {
    const createResponse = await requestAs(
      app,
      DEMO_TOKENS.readerA,
      "/v1/organizations/org-a/tickets",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: "access",
          title: "Behöver access",
          description: "Den syntetiska resursen går inte att öppna.",
        }),
      },
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created.ticket).toMatchObject({
      organizationId: "org-a",
      createdByUserId: "user-reader-a",
      status: "open",
    });

    const ownTickets = await requestAs(
      app,
      DEMO_TOKENS.readerA,
      "/v1/organizations/org-a/tickets",
    );
    const ownBody = await ownTickets.json();
    expect(ownBody.tickets).toHaveLength(1);

    const adminTickets = await requestAs(
      app,
      DEMO_TOKENS.adminA,
      "/v1/organizations/org-a/tickets",
    );
    const adminBody = await adminTickets.json();
    expect(adminBody.tickets).toHaveLength(1);

    const auditEvents = await dependencies.repository.listAuditEvents();
    expect(auditEvents).toContainEqual(
      expect.objectContaining({
        actorUserId: "user-reader-a",
        action: "ticket.create",
        resourceId: created.ticket.id,
        result: "success",
      }),
    );
  });

  it("fails closed in the production entrypoint shape until auth is configured", async () => {
    const productionApp = createApp({
      identityProvider: new UnconfiguredIdentityProvider(),
      repository: new InMemoryPortalRepository(),
      clock: () => new Date("2026-09-04T12:00:00.000Z"),
      createId: () => "production-request-id",
    });

    const health = await productionApp.request("/health");
    expect(health.status).toBe(200);

    const protectedResponse = await productionApp.request("/v1/me", {
      headers: { authorization: "Bearer anything" },
    });
    expect(protectedResponse.status).toBe(503);
    await expect(protectedResponse.json()).resolves.toMatchObject({
      error: "identity_provider_not_configured",
    });
  });

  it("denies a corrupted or legacy membership role by default", async () => {
    const invalidMembership = {
      id: "membership-legacy",
      userId: "user-legacy",
      organizationId: "org-a",
      role: "legacy_reader",
      status: "active",
    } as unknown as Membership;
    const repository = new InMemoryPortalRepository({
      users: [
        {
          id: "user-legacy",
          externalSubject: "demo|legacy",
          email: "legacy@example.invalid",
          displayName: "Legacy synthetic user",
          accountType: "customer",
          status: "active",
        },
      ],
      organizations: [{ id: "org-a", displayName: "Synthetic organization" }],
      memberships: [invalidMembership],
      entitlements: [
        {
          id: "priced-entitlement",
          organizationId: "org-a",
          publisherId: "ieee",
          publisherName: "IEEE",
          productId: "product-a",
          productName: "Synthetic product",
          accessStatus: "active",
          periodStart: "2026-01-01",
          periodEndExclusive: "2027-01-01",
          fixedPrice: {
            amountMinor: 10_000_000,
            currency: "SEK",
            basis: "fixed_agreed_price",
            period: { start: "2026-01-01", endExclusive: "2027-01-01" },
            approvalStatus: "demo_assumption",
            provenance: {
              mode: "demo",
              sourceSystem: "synthetic-fixture",
              sourceReference: "legacy-demo-price",
            },
          },
        },
      ],
    });
    const corruptedRoleApp = createApp({
      identityProvider: new StaticBearerIdentityProvider({ legacy: "demo|legacy" }),
      repository,
      clock: () => new Date("2026-09-04T12:00:00.000Z"),
      createId: () => "legacy-request",
    });

    const response = await requestAs(
      corruptedRoleApp,
      "legacy",
      "/v1/organizations/org-a/portfolio",
    );
    expect(response.status).toBe(404);
  });
});

function requestAs(
  app: ReturnType<typeof createApp>,
  token: string,
  path: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  return app.request(path, { ...init, headers });
}
