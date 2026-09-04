import type { BackendDependencies } from "../application/ports.js";
import { StaticBearerIdentityProvider } from "../adapters/identity.js";
import { InMemoryPortalRepository } from "../adapters/in-memory-repository.js";
import { normalizeIeeeMpsRows, type RawIeeeMpsUsageRow } from "../domain/usage.js";

export const DEMO_TOKENS = {
  adminA: "demo-admin-a",
  readerA: "demo-reader-a",
  adminB: "demo-admin-b",
  operator: "demo-operator",
} as const;

export async function createDemoDependencies(): Promise<BackendDependencies> {
  const repository = new InMemoryPortalRepository({
    organizations: [
      { id: "org-a", displayName: "Nordic Technical University (synthetic)" },
      { id: "org-b", displayName: "Western Research Institute (synthetic)" },
    ],
    users: [
      {
        id: "user-admin-a",
        externalSubject: "demo|admin-a",
        email: "admin-a@example.invalid",
        displayName: "Synthetic Librarian",
        accountType: "customer",
        status: "active",
      },
      {
        id: "user-reader-a",
        externalSubject: "demo|reader-a",
        email: "reader-a@example.invalid",
        displayName: "Synthetic Reader",
        accountType: "customer",
        status: "active",
      },
      {
        id: "user-admin-b",
        externalSubject: "demo|admin-b",
        email: "admin-b@example.invalid",
        displayName: "Other Synthetic Librarian",
        accountType: "customer",
        status: "active",
      },
      {
        id: "user-operator",
        externalSubject: "demo|operator",
        email: "operator@example.invalid",
        displayName: "Synthetic Content Online Operator",
        accountType: "content_operator",
        status: "active",
      },
    ],
    memberships: [
      {
        id: "membership-admin-a",
        userId: "user-admin-a",
        organizationId: "org-a",
        role: "customer_admin",
        status: "active",
      },
      {
        id: "membership-reader-a",
        userId: "user-reader-a",
        organizationId: "org-a",
        role: "customer_reader",
        status: "active",
      },
      {
        id: "membership-admin-b",
        userId: "user-admin-b",
        organizationId: "org-b",
        role: "customer_admin",
        status: "active",
      },
    ],
    operatorScopes: [{ userId: "user-operator", organizationId: "org-a" }],
    entitlements: [
      {
        id: "entitlement-ieee-a-2026",
        organizationId: "org-a",
        publisherId: "ieee",
        publisherName: "IEEE",
        productId: "ieee-xplore",
        productName: "IEEE Xplore Digital Library (synthetic entitlement)",
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
            sourceReference: "demo-fixed-price-org-a-2026",
          },
        },
      },
      {
        id: "entitlement-other-b-2026",
        organizationId: "org-b",
        publisherId: "publisher-b",
        publisherName: "Synthetic Publisher B",
        productId: "research-b",
        productName: "Synthetic Research Collection B",
        accessStatus: "active",
        periodStart: "2026-01-01",
        periodEndExclusive: "2027-01-01",
      },
    ],
  });

  const rawFixture: RawIeeeMpsUsageRow[] = [
    {
      sourceRecordKey: "org-a:ieee-xplore:2026:approved-downloads",
      productCode: "IEEE_XPLORE",
      periodStart: "2026-01-01",
      periodEndExclusive: "2027-01-01",
      metricCode: "DEMO_APPROVED_DOWNLOADS",
      metricLabel: "Godkända downloads (syntetisk fixture)",
      value: 10_000,
      aggregationLevel: "period_total",
    },
  ];

  const normalized = normalizeIeeeMpsRows(rawFixture, {
    organizationId: "org-a",
    publisherId: "ieee",
    providerId: "mps",
    productIdBySourceCode: { IEEE_XPLORE: "ieee-xplore" },
    entitlementIdByProductId: { "ieee-xplore": "entitlement-ieee-a-2026" },
    syncRunId: "demo-sync-2026-09-04",
    fetchedAt: "2026-09-04T10:00:00.000Z",
  });

  await repository.upsertUsage(normalized.accepted);

  let idCounter = 0;

  return {
    identityProvider: new StaticBearerIdentityProvider({
      [DEMO_TOKENS.adminA]: "demo|admin-a",
      [DEMO_TOKENS.readerA]: "demo|reader-a",
      [DEMO_TOKENS.adminB]: "demo|admin-b",
      [DEMO_TOKENS.operator]: "demo|operator",
    }),
    repository,
    clock: () => new Date("2026-09-04T12:00:00.000Z"),
    createId: () => `generated-${++idCounter}`,
  };
}
