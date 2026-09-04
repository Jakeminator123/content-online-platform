import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import type { BackendDependencies } from "./application/ports.js";
import {
  IdentityProviderNotConfiguredError,
  UnconfiguredIdentityProvider,
} from "./adapters/identity.js";
import { InMemoryPortalRepository } from "./adapters/in-memory-repository.js";
import type { EffectiveRole, Entitlement, PortalUser, UsageObservation } from "./domain/models.js";
import { calculateCostPerUsage } from "./domain/usage.js";
import { ClerkAdminAuthenticator, readAdminConfig } from "./admin/identity.js";
import { createAdminPortal } from "./admin/portal.js";

type Actor = {
  user: PortalUser;
};

type AppEnvironment = {
  Variables: {
    actor: Actor;
    requestId: string;
  };
};

const ErrorSchema = z
  .object({
    error: z.string(),
    message: z.string(),
    requestId: z.string(),
  })
  .openapi("Error");

const OrganizationParameterSchema = z.object({
  organizationId: z.string().min(1).openapi({
    param: { name: "organizationId", in: "path" },
    example: "org-a",
  }),
});

const TicketInputSchema = z
  .object({
    category: z.enum(["access", "usage_data", "membership_change", "other"]),
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(3).max(2_000),
  })
  .openapi("TicketInput");

const EffectiveRoleSchema = z.enum(["customer_reader", "customer_admin", "content_operator"]);
const FixedPriceBaseSchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: z.string(),
  basis: z.literal("fixed_agreed_price"),
  period: z.object({ start: z.string(), endExclusive: z.string() }),
});
const FixedPriceSchema = z.discriminatedUnion("approvalStatus", [
  FixedPriceBaseSchema.extend({
    approvalStatus: z.literal("approved"),
    provenance: z.object({
      mode: z.literal("live"),
      sourceSystem: z.string(),
      sourceReference: z.string(),
    }),
  }),
  FixedPriceBaseSchema.extend({
    approvalStatus: z.literal("demo_assumption"),
    provenance: z.object({
      mode: z.literal("demo"),
      sourceSystem: z.string(),
      sourceReference: z.string(),
    }),
  }),
]);
const OrganizationSchema = z.object({ id: z.string(), displayName: z.string() });
const EntitlementSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  publisherId: z.string(),
  publisherName: z.string(),
  productId: z.string(),
  productName: z.string(),
  accessStatus: z.enum(["active", "attention_required", "expired"]),
  periodStart: z.string(),
  periodEndExclusive: z.string(),
  fixedPrice: FixedPriceSchema.optional(),
});
const CostAnalysisSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("calculated"),
    basis: z.literal("fixed_agreed_price"),
    inputStatus: z.enum(["approved_live", "demo_or_unapproved"]),
    numerator: FixedPriceSchema,
    denominator: z.object({
      metricCode: z.string(),
      value: z.number(),
      period: z.object({ start: z.string(), endExclusive: z.string() }),
      coverage: z.literal("complete"),
      semanticStatus: z.literal("exact"),
      comparabilityKey: z.literal("approved_downloads/v1"),
    }),
    result: z.object({ amount: z.string(), currency: z.string(), unit: z.literal("per_usage") }),
  }),
  z.object({
    status: z.literal("not_calculable"),
    reason: z.enum([
      "missing_fixed_price",
      "missing_approved_usage",
      "unapproved_metric",
      "zero_usage",
      "period_mismatch",
      "incomplete_usage",
      "dimensioned_usage",
      "missing_approved_aggregate",
      "ambiguous_aggregate",
    ]),
  }),
]);
const UsageObservationSchema = z.object({
  id: z.string(),
  schemaVersion: z.literal("usage-observation/v1"),
  organizationId: z.string(),
  publisherId: z.string(),
  providerId: z.string(),
  productId: z.string(),
  entitlementId: z.string().optional(),
  period: z.object({
    start: z.string(),
    endExclusive: z.string(),
    granularity: z.enum(["day", "month", "year", "report-period"]),
  }),
  metric: z.object({
    sourceCode: z.string(),
    sourceLabel: z.string(),
    canonicalCode: z.string().optional(),
    definitionVersion: z.string(),
    unit: z.literal("count"),
    semanticStatus: z.enum(["exact", "source-native"]),
    comparabilityKey: z.string().optional(),
  }),
  value: z.number().int().nonnegative(),
  aggregationLevel: z.enum(["period_total", "slice"]),
  dimensions: z.record(z.string(), z.string()),
  provenance: z.object({
    mode: z.enum(["live", "demo"]),
    reportType: z.string(),
    reportVersion: z.string().optional(),
    sourceRecordKey: z.string(),
    sourceArtifactHash: z.string().optional(),
    syncRunId: z.string(),
    fetchedAt: z.string(),
    sourceUpdatedAt: z.string().optional(),
    adapterId: z.string(),
    adapterVersion: z.string(),
    mappingVersion: z.string(),
  }),
  quality: z.object({
    coverage: z.enum(["complete", "partial", "unknown"]),
    freshness: z.enum(["fresh", "delayed", "stale", "unknown"]),
    warnings: z.array(z.string()),
  }),
});
const TicketSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  createdByUserId: z.string(),
  category: z.enum(["access", "usage_data", "membership_change", "other"]),
  title: z.string(),
  description: z.string(),
  status: z.enum(["open", "in_progress", "closed"]),
  createdAt: z.string(),
});
const MeResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    displayName: z.string(),
    accountType: z.enum(["customer", "content_operator"]),
  }),
  memberships: z.array(
    z.object({ organizationId: z.string(), role: z.enum(["customer_reader", "customer_admin"]) }),
  ),
  operatorScopes: z.array(z.object({ organizationId: z.string() })),
});
const OverviewResponseSchema = z.object({
  organization: OrganizationSchema,
  effectiveRole: EffectiveRoleSchema,
  summary: z.object({
    activeProducts: z.number().int().nonnegative(),
    usageObservations: z.number().int().nonnegative(),
    openTickets: z.number().int().nonnegative(),
    sourcesWithMissingUsage: z.number().int().nonnegative(),
  }),
  dataNotice: z.string(),
});
const PortfolioResponseSchema = z.object({
  effectiveRole: EffectiveRoleSchema,
  items: z.array(EntitlementSchema),
});
const UsageResponseSchema = z.object({
  effectiveRole: EffectiveRoleSchema,
  observations: z.array(UsageObservationSchema),
  costAnalyses: z
    .array(
      z.object({
        entitlementId: z.string(),
        metricCode: z.literal("approved_downloads"),
        calculation: CostAnalysisSchema,
      }),
    )
    .optional(),
});
const TicketsResponseSchema = z.object({
  effectiveRole: EffectiveRoleSchema,
  tickets: z.array(TicketSchema),
});
const TicketCreatedResponseSchema = z.object({ ticket: TicketSchema });
const MembersResponseSchema = z.object({
  effectiveRole: EffectiveRoleSchema,
  members: z.array(
    z.object({
      id: z.string(),
      userId: z.string(),
      displayName: z.string(),
      email: z.string(),
      role: z.enum(["customer_reader", "customer_admin"]),
      status: z.enum(["active", "inactive"]),
    }),
  ),
  mutationPolicy: z.literal("ticket_required"),
});

function jsonResponse<Schema extends z.ZodType>(description: string, statusSchema: Schema) {
  return {
    content: {
      "application/json": {
        schema: statusSchema,
      },
    },
    description,
  };
}

const meRoute = createRoute({
  method: "get",
  path: "/v1/me",
  tags: ["Identity"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: jsonResponse("Authenticated portal identity and server-owned memberships", MeResponseSchema),
    401: jsonResponse("Missing or invalid identity", ErrorSchema),
    503: jsonResponse("Identity provider has not been configured", ErrorSchema),
  },
});

const overviewRoute = createRoute({
  method: "get",
  path: "/v1/organizations/{organizationId}/overview",
  tags: ["Organizations"],
  security: [{ bearerAuth: [] }],
  request: { params: OrganizationParameterSchema },
  responses: {
    200: jsonResponse("Organization overview filtered by the effective role", OverviewResponseSchema),
    404: jsonResponse("Organization is absent or outside the actor's tenant scope", ErrorSchema),
  },
});

const portfolioRoute = createRoute({
  method: "get",
  path: "/v1/organizations/{organizationId}/portfolio",
  tags: ["Portfolio"],
  security: [{ bearerAuth: [] }],
  request: { params: OrganizationParameterSchema },
  responses: {
    200: jsonResponse(
      "Organization portfolio; commercial fields require admin/operator access",
      PortfolioResponseSchema,
    ),
    404: jsonResponse("Organization is absent or outside the actor's tenant scope", ErrorSchema),
  },
});

const usageRoute = createRoute({
  method: "get",
  path: "/v1/organizations/{organizationId}/usage",
  tags: ["Usage"],
  security: [{ bearerAuth: [] }],
  request: { params: OrganizationParameterSchema },
  responses: {
    200: jsonResponse(
      "Source-labelled usage; cost analysis requires admin/operator access",
      UsageResponseSchema,
    ),
    404: jsonResponse("Organization is absent or outside the actor's tenant scope", ErrorSchema),
  },
});

const ticketsRoute = createRoute({
  method: "get",
  path: "/v1/organizations/{organizationId}/tickets",
  tags: ["Tickets"],
  security: [{ bearerAuth: [] }],
  request: { params: OrganizationParameterSchema },
  responses: {
    200: jsonResponse("Tickets visible to the effective role", TicketsResponseSchema),
    404: jsonResponse("Organization is absent or outside the actor's tenant scope", ErrorSchema),
  },
});

const createTicketRoute = createRoute({
  method: "post",
  path: "/v1/organizations/{organizationId}/tickets",
  tags: ["Tickets"],
  security: [{ bearerAuth: [] }],
  request: {
    params: OrganizationParameterSchema,
    body: {
      required: true,
      content: { "application/json": { schema: TicketInputSchema } },
    },
  },
  responses: {
    201: jsonResponse("Ticket created", TicketCreatedResponseSchema),
    404: jsonResponse("Organization is absent or outside the actor's tenant scope", ErrorSchema),
    422: jsonResponse("Invalid ticket input", ErrorSchema),
  },
});

const membersRoute = createRoute({
  method: "get",
  path: "/v1/organizations/{organizationId}/members",
  tags: ["Members"],
  security: [{ bearerAuth: [] }],
  request: { params: OrganizationParameterSchema },
  responses: {
    200: jsonResponse(
      "Members; customer admin or scoped Content Online operator only",
      MembersResponseSchema,
    ),
    403: jsonResponse("The actor has tenant access but lacks the required role", ErrorSchema),
    404: jsonResponse("Organization is absent or outside the actor's tenant scope", ErrorSchema),
  },
});

export function createApp(dependencies: BackendDependencies) {
  const app = new OpenAPIHono<AppEnvironment>({
    defaultHook: (result, c) => {
      if (result.success) {
        return;
      }

      return c.json(
        {
          error: "validation_failed",
          message: "Requesten matchar inte API-kontraktet.",
          requestId: c.get("requestId") ?? "unavailable",
        },
        422,
      );
    },
  });

  app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "OIDC access token",
    description: "A real provider is required in production. Demo bearer tokens exist only in src/dev.ts.",
  });

  app.use("*", secureHeaders());
  app.use("*", async (c, next) => {
    c.set("requestId", dependencies.createId());
    await next();
    c.header("x-request-id", c.get("requestId"));
    c.header("cache-control", "no-store");
  });
  app.use(
    "/v1/*",
    bodyLimit({
      maxSize: 64 * 1024,
      onError: (c) => error(c, 422, "request_too_large", "Requesten är för stor."),
    }),
  );

  app.use("/v1/*", async (c, next) => {
    try {
      const identity = await dependencies.identityProvider.authenticate(c.req.raw);

      if (!identity) {
        return error(c, 401, "unauthorized", "Inloggning saknas eller är ogiltig.");
      }

      const user = await dependencies.repository.findUserByExternalSubject(identity.subject);

      if (!user || user.status !== "active") {
        return error(c, 403, "portal_access_denied", "Kontot saknar aktiv portalåtkomst.");
      }

      c.set("actor", { user });
      await next();
    } catch (caught) {
      if (caught instanceof IdentityProviderNotConfiguredError) {
        return error(
          c,
          503,
          "identity_provider_not_configured",
          "Produktionsinloggningen är inte konfigurerad.",
        );
      }

      throw caught;
    }
  });

  app.get("/health", (c) =>
    c.json({
      status: "ok",
      service: "content-online-platform-backend",
      authentication: "required_for_v1",
    }),
  );

  app.openapi(meRoute, async (c) => {
    const { user } = c.get("actor");
    const memberships =
      user.accountType === "customer"
        ? (await dependencies.repository.listMembershipsForUser(user.id)).filter(
            (membership) => membership.status === "active" && isCustomerRole(membership.role),
          )
        : [];
    const operatorScopes =
      user.accountType === "content_operator"
        ? await dependencies.repository.listOperatorScopes(user.id)
        : [];

    return c.json(
      {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          accountType: user.accountType,
        },
        memberships: memberships.map(({ organizationId, role }) => ({ organizationId, role })),
        operatorScopes: operatorScopes.map(({ organizationId }) => ({ organizationId })),
      },
      200,
    );
  });

  app.openapi(overviewRoute, async (c) => {
    const organizationId = c.req.valid("param").organizationId;
    const access = await requireOrganizationAccess(c, dependencies, organizationId);
    if (!access) return notFound(c);

    const [organization, entitlements, usage, tickets] = await Promise.all([
      dependencies.repository.findOrganization(organizationId),
      dependencies.repository.listEntitlements(organizationId),
      dependencies.repository.listUsage(organizationId),
      dependencies.repository.listTickets(organizationId),
    ]);
    if (!organization) return notFound(c);

    const visibleTickets =
      access.role === "customer_admin" || access.role === "content_operator"
        ? tickets
        : tickets.filter((ticket) => ticket.createdByUserId === access.user.id);

    return c.json(
      {
        organization,
        effectiveRole: access.role,
        summary: {
          activeProducts: entitlements.filter((item) => item.accessStatus === "active").length,
          usageObservations: usage.length,
          openTickets: visibleTickets.filter((ticket) => ticket.status !== "closed").length,
          sourcesWithMissingUsage: entitlements.filter(
            (entitlement) => !usage.some((item) => item.entitlementId === entitlement.id),
          ).length,
        },
        dataNotice: "All current records are synthetic demo data, not live customer data.",
      },
      200,
    );
  });

  app.openapi(portfolioRoute, async (c) => {
    const organizationId = c.req.valid("param").organizationId;
    const access = await requireOrganizationAccess(c, dependencies, organizationId);
    if (!access) return notFound(c);

    const entitlements = await dependencies.repository.listEntitlements(organizationId);
    const canViewCommercial = canViewCommercialFields(access.role);

    return c.json(
      {
        effectiveRole: access.role,
        items: entitlements.map((entitlement) => serializeEntitlement(entitlement, canViewCommercial)),
      },
      200,
    );
  });

  app.openapi(usageRoute, async (c) => {
    const organizationId = c.req.valid("param").organizationId;
    const access = await requireOrganizationAccess(c, dependencies, organizationId);
    if (!access) return notFound(c);

    const [observations, entitlements] = await Promise.all([
      dependencies.repository.listUsage(organizationId),
      dependencies.repository.listEntitlements(organizationId),
    ]);
    const canViewCommercial = canViewCommercialFields(access.role);

    return c.json(
      {
        effectiveRole: access.role,
        observations,
        ...(canViewCommercial ? { costAnalyses: buildCostAnalyses(entitlements, observations) } : {}),
      },
      200,
    );
  });

  app.openapi(ticketsRoute, async (c) => {
    const organizationId = c.req.valid("param").organizationId;
    const access = await requireOrganizationAccess(c, dependencies, organizationId);
    if (!access) return notFound(c);

    const tickets = await dependencies.repository.listTickets(organizationId);
    const visibleTickets =
      access.role === "customer_admin" || access.role === "content_operator"
        ? tickets
        : tickets.filter((ticket) => ticket.createdByUserId === access.user.id);

    return c.json({ effectiveRole: access.role, tickets: visibleTickets }, 200);
  });

  app.openapi(createTicketRoute, async (c) => {
    const organizationId = c.req.valid("param").organizationId;
    const access = await requireOrganizationAccess(c, dependencies, organizationId);
    if (!access) return notFound(c);

    const input = c.req.valid("json");
    const ticketId = dependencies.createId();
    const ticket = await dependencies.repository.createTicketWithAudit(
      {
        id: ticketId,
        organizationId,
        createdByUserId: access.user.id,
        category: input.category,
        title: input.title,
        description: input.description,
        status: "open",
        createdAt: dependencies.clock().toISOString(),
      },
      {
        id: dependencies.createId(),
        occurredAt: dependencies.clock().toISOString(),
        requestId: c.get("requestId"),
        actorUserId: access.user.id,
        effectiveRole: access.role,
        organizationId,
        action: "ticket.create",
        resourceType: "ticket",
        resourceId: ticketId,
        result: "success",
      },
    );

    return c.json({ ticket }, 201);
  });

  app.openapi(membersRoute, async (c) => {
    const organizationId = c.req.valid("param").organizationId;
    const access = await requireOrganizationAccess(c, dependencies, organizationId);
    if (!access) return notFound(c);

    if (access.role !== "customer_admin" && access.role !== "content_operator") {
      return error(c, 403, "insufficient_role", "Kundadmin krävs för att se medlemmar.");
    }

    const members = await dependencies.repository.listMembers(organizationId);
    return c.json(
      {
        effectiveRole: access.role,
        members: members.flatMap(({ user, membership }) =>
          isCustomerRole(membership.role)
            ? [
                {
                  id: membership.id,
                  userId: user.id,
                  displayName: user.displayName,
                  email: user.email,
                  role: membership.role,
                  status: membership.status,
                },
              ]
            : [],
        ),
        mutationPolicy: "ticket_required" as const,
      },
      200,
    );
  });

  app.doc("/openapi.json", {
    openapi: "3.1.0",
    info: {
      title: "Content Online Platform Backend",
      version: "0.1.0",
      description:
        "Backend-only contract. All bundled records are synthetic; production identity is intentionally unconfigured.",
    },
  });

  app.onError((caught, c) => {
    console.error("Unhandled backend error", {
      requestId: c.get("requestId"),
      errorName: caught instanceof Error ? caught.name : "UnknownError",
    });
    return error(c, 500, "internal_error", "Ett oväntat serverfel inträffade.");
  });

  app.notFound((c) => notFound(c));

  return app;
}

async function requireOrganizationAccess(
  c: Context<AppEnvironment>,
  dependencies: BackendDependencies,
  organizationId: string,
): Promise<{ user: PortalUser; role: EffectiveRole } | undefined> {
  const { user } = c.get("actor") as Actor;

  if (user.accountType === "content_operator") {
    const scopes = await dependencies.repository.listOperatorScopes(user.id);
    const allowed = scopes.some((scope) => scope.organizationId === organizationId);
    if (allowed) {
      await dependencies.repository.appendAuditEvent({
        id: dependencies.createId(),
        occurredAt: dependencies.clock().toISOString(),
        requestId: c.get("requestId"),
        actorUserId: user.id,
        effectiveRole: "content_operator",
        organizationId,
        action: "organization.access",
        resourceType: "organization",
        resourceId: organizationId,
        result: "success",
      });
      return { user, role: "content_operator" };
    }
  } else {
    const membership = await dependencies.repository.findMembership(user.id, organizationId);
    if (membership?.status === "active" && isCustomerRole(membership.role)) {
      return { user, role: membership.role };
    }
  }

  await dependencies.repository.appendAuditEvent({
    id: dependencies.createId(),
    occurredAt: dependencies.clock().toISOString(),
    requestId: c.get("requestId") as string,
    actorUserId: user.id,
    organizationId,
    action: "organization.access",
    resourceType: "organization",
    resourceId: organizationId,
    result: "denied",
  });

  return undefined;
}

function serializeEntitlement(entitlement: Entitlement, canViewCommercial: boolean) {
  const { fixedPrice, ...publicFields } = entitlement;
  return canViewCommercial && fixedPrice ? { ...publicFields, fixedPrice } : publicFields;
}

function canViewCommercialFields(role: EffectiveRole): boolean {
  return role === "customer_admin" || role === "content_operator";
}

function isCustomerRole(role: unknown): role is "customer_reader" | "customer_admin" {
  return role === "customer_reader" || role === "customer_admin";
}

function buildCostAnalyses(
  entitlements: readonly Entitlement[],
  observations: readonly UsageObservation[],
) {
  return entitlements.map((entitlement) => {
    const approvedTotals = observations.filter(
      (observation) =>
        observation.entitlementId === entitlement.id &&
        observation.metric.canonicalCode === "approved_downloads" &&
        observation.metric.semanticStatus === "exact" &&
        observation.metric.comparabilityKey === "approved_downloads/v1" &&
        observation.aggregationLevel === "period_total",
    );

    if (approvedTotals.length > 1) {
      return {
        entitlementId: entitlement.id,
        metricCode: "approved_downloads" as const,
        calculation: {
          status: "not_calculable" as const,
          reason: "ambiguous_aggregate" as const,
        },
      };
    }

    const observation = approvedTotals[0];
    const hasApprovedSlices = observations.some(
      (item) =>
        item.entitlementId === entitlement.id && item.metric.canonicalCode === "approved_downloads",
    );
    const fixedPrice = entitlement.fixedPrice;
    const usage = observation
      ? {
          metricCode: "approved_downloads",
          value: observation.value,
          period: {
            start: observation.period.start,
            endExclusive: observation.period.endExclusive,
          },
          coverage: observation.quality.coverage,
          isAggregate: Object.keys(observation.dimensions).length === 0,
          mode: observation.provenance.mode,
          semanticStatus: "exact" as const,
          comparabilityKey: "approved_downloads/v1" as const,
        }
      : undefined;
    const calculation =
      !observation && hasApprovedSlices
        ? ({
            status: "not_calculable",
            reason: "missing_approved_aggregate",
          } as const)
        : calculateCostPerUsage({
            ...(fixedPrice ? { fixedPrice } : {}),
            ...(usage ? { usage } : {}),
          });

    return {
      entitlementId: entitlement.id,
      metricCode: "approved_downloads" as const,
      calculation,
    };
  });
}

function error<const Status extends 401 | 403 | 404 | 422 | 500 | 503>(
  c: Context<AppEnvironment>,
  status: Status,
  code: string,
  message: string,
) {
  return c.json(
    {
      error: code,
      message,
      requestId: c.get("requestId") ?? "unavailable",
    },
    status,
  );
}

function notFound(c: Context<AppEnvironment>) {
  return error(c, 404, "not_found", "Resursen hittades inte.");
}

const productionApp = createApp({
  identityProvider: new UnconfiguredIdentityProvider(),
  repository: new InMemoryPortalRepository(),
  clock: () => new Date(),
  createId: () => crypto.randomUUID(),
});

const adminConfig = readAdminConfig();
productionApp.route("/", createAdminPortal(new ClerkAdminAuthenticator(adminConfig), adminConfig));

export default productionApp;
