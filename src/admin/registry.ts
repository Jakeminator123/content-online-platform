import { randomUUID } from "node:crypto";
import { z } from "zod";
import { normalizeDidClientKey } from "../customer-portal/agent.js";

const slug = z.string().min(2).max(63).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const name = z.string().trim().min(2).max(120);
const displayName = z.string().trim().min(1).max(120);
const id = z.string().min(1).max(80);
const verifiedEmail = z.string().trim().toLowerCase().max(254).email();
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).transform((value) => value.toLowerCase());
const hostname = z.string().trim().toLowerCase().max(253).refine((value) => {
  if (!value) return true;
  if (value === "localhost" || /^\d+(?:\.\d+){3}$/.test(value)) return false;
  return value.split(".").length >= 2 && value.split(".").every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
  );
}, "invalid_hostname");
const httpsUrl = z.string().trim().max(500).refine((value) => {
  if (!value) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}, "invalid_https_url");

export const customerPortalTools = ["portal_context", "portal_navigation", "portfolio_summary", "usage_summary"] as const;
const customerPortalToolSchema = z.enum(customerPortalTools);
const customerAgentSchema = z.object({
  enabled: z.boolean(),
  agentId: z.string().trim().max(128).regex(/^(?:[A-Za-z0-9_-]+)?$/),
  clientKey: z.string().trim().max(2048).refine((value) => !value || normalizeDidClientKey(value) !== null, "invalid_did_client_key"),
  greeting: z.string().trim().min(2).max(240),
  positivity: z.number().int().min(1).max(10),
  tools: z.array(customerPortalToolSchema).max(customerPortalTools.length)
    .transform((tools) => [...new Set(tools)]),
});
const customerSiteSchema = z.object({
  preset: z.enum(["insight", "library", "minimal"]),
  domain: hostname,
  domainStatus: z.enum(["not_configured", "pending", "ready"]),
  logoUrl: httpsUrl,
  primaryColor: hexColor,
  accentColor: hexColor,
  heading: z.string().trim().min(2).max(120),
  tagline: z.string().trim().min(2).max(240),
  agent: customerAgentSchema,
});
export const customerSiteInputSchema = customerSiteSchema.omit({ domainStatus: true });
export type CustomerSite = z.infer<typeof customerSiteSchema>;

export function defaultCustomerSite(overrides: Partial<CustomerSite> = {}): CustomerSite {
  const base: CustomerSite = {
    preset: "insight",
    domain: "",
    domainStatus: "not_configured",
    logoUrl: "",
    primaryColor: "#285b70",
    accentColor: "#338578",
    heading: "Välkommen till er kundportal",
    tagline: "Informationsprodukter, användning och kundservice i en samlad yta.",
    agent: {
      enabled: false,
      agentId: "",
      clientKey: "",
      greeting: "Hej! Hur kan jag hjälpa er i kundportalen?",
      positivity: 5,
      tools: ["portal_context", "portal_navigation", "portfolio_summary", "usage_summary"],
    },
  };
  return customerSiteSchema.parse({ ...base, ...overrides, agent: { ...base.agent, ...overrides.agent } });
}

export function kthDemoCustomerSite(): CustomerSite {
  return defaultCustomerSite({
    domain: "kth.portal.contentonline.se",
    domainStatus: "pending",
    primaryColor: "#1954a6",
    accentColor: "#2f8f83",
    heading: "Kunskap i användning",
    tagline: "En syntetisk KTH-pilot för informationsresurser, statistik och kundservice.",
    agent: {
      enabled: true,
      agentId: "",
      clientKey: "",
      greeting: "Hej! Jag hjälper er att hitta i KTH:s syntetiska kundportal.",
      positivity: 7,
      tools: ["portal_context", "portal_navigation", "portfolio_summary", "usage_summary"],
    },
  });
}

const customerSchema = z.object({
  id,
  name,
  slug,
  status: z.enum(["draft", "published", "archived"]),
  kind: z.enum(["demo", "customer"]),
  publisherIds: z.array(id).max(100),
  site: customerSiteSchema.optional(),
  salesforceAccountId: z.string().regex(/^001[A-Za-z0-9]{12}(?:[A-Za-z0-9]{3})?$/).nullable().default(null),
  salesforceAccountName: z.string().trim().min(1).max(255).nullable().default(null),
}).transform((customer) => ({
  ...customer,
  // Existing KTH demo rows predate site configuration. Migrate only a missing
  // site; an explicitly saved disabled agent must remain disabled.
  site: customer.site ?? (customer.kind === "demo" && customer.slug === "kth"
    ? kthDemoCustomerSite()
    : defaultCustomerSite()),
}));
const publisherSchema = z.object({ id, name, status: z.enum(["active", "archived"]) });
const portalMemberSchema = z.object({
  id,
  customerId: id,
  verifiedEmail,
  externalUserId: id.nullable().default(null),
  displayName,
  role: z.enum(["customer_reader", "customer_admin"]),
  status: z.enum(["active", "inactive"]),
});
const eventSchema = z.object({ at: z.string(), actor: id, action: z.string(), entityId: id });
export const registrySchema = z.object({
  customers: z.array(customerSchema).max(1000),
  publishers: z.array(publisherSchema).max(100),
  portalMembers: z.array(portalMemberSchema).max(10000).default([]),
  events: z.array(eventSchema).max(500),
}).superRefine((registry, context) => {
  const memberships = new Set<string>();
  registry.portalMembers.forEach((member, index) => {
    const key = `${member.customerId}\u0000${member.verifiedEmail}`;
    if (memberships.has(key)) {
      context.addIssue({
        code: "custom",
        message: "duplicate_portal_member_email",
        path: ["portalMembers", index, "verifiedEmail"],
      });
    }
    memberships.add(key);
  });
});
export type Registry = z.infer<typeof registrySchema>;
export type RegistryCustomer = Registry["customers"][number];
export type PortalMember = Registry["portalMembers"][number];
export type RegistrySnapshot = { version: number; data: Registry };
export const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add_customer"), name, slug }),
  z.object({ action: z.literal("update_customer"), id, name, publisherIds: z.array(id).max(100) }),
  z.object({ action: z.literal("configure_customer_site"), id, site: customerSiteInputSchema }),
  z.object({ action: z.literal("set_customer_domain_status"), id, domainStatus: z.enum(["pending", "ready"]) }),
  z.object({ action: z.literal("publish_customer"), id }),
  z.object({ action: z.literal("unpublish_customer"), id }),
  z.object({ action: z.literal("archive_customer"), id }),
  z.object({ action: z.literal("delete_customer"), id, confirmation: z.string().trim().min(2).max(120) }),
  z.object({ action: z.literal("restore_customer"), id }),
  z.object({
    action: z.literal("link_salesforce_account"),
    id,
    accountId: z.string().regex(/^001[A-Za-z0-9]{12}(?:[A-Za-z0-9]{3})?$/),
    accountName: z.string().trim().min(1).max(255),
  }),
  z.object({ action: z.literal("unlink_salesforce_account"), id }),
  z.object({ action: z.literal("add_publisher"), name }),
  z.object({ action: z.literal("rename_publisher"), id, name }),
  z.object({ action: z.literal("archive_publisher"), id }),
  z.object({ action: z.literal("restore_publisher"), id }),
]);
export type RegistryCommand = z.infer<typeof commandSchema>;
export class RegistryError extends Error {
  constructor(public code: string, public status: 404 | 409 | 422 | 503 = 422) { super(code); }
}
export function initialRegistry(): Registry {
  return registrySchema.parse({
    customers: [{
      id: "customer-kth-demo",
      name: "KTH",
      slug: "kth",
      status: "published",
      kind: "demo",
      publisherIds: ["ieee"],
      site: kthDemoCustomerSite(),
      salesforceAccountId: null,
      salesforceAccountName: null,
    }],
    publishers: [
      { id: "ieee", name: "IEEE", status: "active" },
      { id: "sae", name: "SAE", status: "active" },
      { id: "astm", name: "ASTM", status: "active" },
    ],
    portalMembers: [],
    events: [],
  });
}

export function applyRegistryCommand(data: Registry, command: RegistryCommand, actor: string, now = new Date()): Registry {
  const next = registrySchema.parse(structuredClone(data));
  let entityId: string = "registry";
  if (command.action === "add_customer") {
    if (next.customers.some(c => c.slug === command.slug)) throw new RegistryError("slug_reserved", 409);
    if (next.customers.length >= 1000) throw new RegistryError("customer_limit");
    entityId = randomUUID();
    next.customers.push({
      id: entityId,
      name: command.name,
      slug: command.slug,
      status: "draft",
      kind: "customer",
      publisherIds: [],
      // The shared Vercel runtime publishes this tenant at /portal/{slug}.
      // A dedicated hostname is optional and must be configured explicitly.
      site: defaultCustomerSite(),
      salesforceAccountId: null,
      salesforceAccountName: null,
    });
  } else if (command.action === "add_publisher") {
    if (next.publishers.some(p => p.name.toLocaleLowerCase() === command.name.toLocaleLowerCase())) throw new RegistryError("publisher_exists", 409);
    if (next.publishers.length >= 100) throw new RegistryError("publisher_limit");
    entityId = randomUUID();
    next.publishers.push({ id: entityId, name: command.name, status: "active" });
  } else {
    entityId = command.id;
    if (["rename_publisher", "archive_publisher", "restore_publisher"].includes(command.action)) {
      const p = next.publishers.find(p => p.id === command.id);
      if (!p) throw new RegistryError("not_found", 404);
      if (command.action === "rename_publisher") {
        if (next.publishers.some(other => other.id !== p.id && other.name.toLocaleLowerCase() === command.name.toLocaleLowerCase())) throw new RegistryError("publisher_exists", 409);
        p.name = command.name;
      } else p.status = command.action === "archive_publisher" ? "archived" : "active";
    } else {
      const customerIndex = next.customers.findIndex(c => c.id === command.id);
      if (customerIndex < 0) throw new RegistryError("not_found", 404);
      const c = next.customers[customerIndex]!;
      if (command.action === "delete_customer") {
        if (c.kind !== "customer") throw new RegistryError("demo_customer_protected", 409);
        if (c.status !== "archived") throw new RegistryError("delete_requires_archived", 409);
        if (command.confirmation !== c.name && command.confirmation !== c.slug) {
          throw new RegistryError("delete_confirmation_mismatch", 422);
        }
        next.customers.splice(customerIndex, 1);
      } else if (command.action === "update_customer") {
        const unique = [...new Set(command.publisherIds)];
        if (unique.some(id => !next.publishers.some(p => p.id === id && (p.status === "active" || c.publisherIds.includes(id))))) throw new RegistryError("publisher_unavailable");
        c.name = command.name;
        c.publisherIds = unique;
      } else if (command.action === "configure_customer_site") {
        if (command.site.domain && next.customers.some(other => other.id !== c.id && other.site.domain === command.site.domain)) {
          throw new RegistryError("domain_reserved", 409);
        }
        const domainChanged = c.site.domain !== command.site.domain;
        c.site = customerSiteSchema.parse({
          ...command.site,
          domainStatus: !command.site.domain ? "not_configured" : domainChanged ? "pending" : c.site.domainStatus,
        });
      } else if (command.action === "set_customer_domain_status") {
        if (!c.site.domain) throw new RegistryError("domain_unconfigured", 409);
        c.site.domainStatus = command.domainStatus;
      } else if (command.action === "link_salesforce_account") {
        if (next.customers.some(other => other.id !== c.id && other.salesforceAccountId === command.accountId)) {
          throw new RegistryError("salesforce_account_already_linked", 409);
        }
        c.salesforceAccountId = command.accountId;
        c.salesforceAccountName = command.accountName;
      } else if (command.action === "unlink_salesforce_account") {
        c.salesforceAccountId = null;
        c.salesforceAccountName = null;
      } else if (command.action === "publish_customer") {
        if (c.status === "archived") throw new RegistryError("restore_before_publishing", 409);
        c.status = "published";
      } else if (command.action === "archive_customer") c.status = "archived";
      else c.status = "draft"; // Restore never silently re-publishes.
    }
  }
  next.events = [...next.events, { at: now.toISOString(), actor, action: command.action, entityId }].slice(-500);
  return registrySchema.parse(next);
}

export function publicPortal(data: Registry, requestedSlug: string) {
  const c = data.customers.find(c => c.slug === requestedSlug && c.status === "published");
  // Explicit publication discloses only presentation metadata, never users, assignments or agent credentials.
  return c ? {
    name: c.name,
    slug: c.slug,
    mode: c.kind === "demo" ? "demo" as const : "awaiting_accounts" as const,
    brand: {
      logoUrl: c.site.logoUrl,
      primaryColor: c.site.primaryColor,
      accentColor: c.site.accentColor,
      heading: c.site.heading,
      tagline: c.site.tagline,
    },
  } : null;
}

export function publishedCustomer(data: Registry, requestedSlug: string): RegistryCustomer | null {
  return data.customers.find(c => c.slug === requestedSlug && c.status === "published") ?? null;
}

export interface RegistryStore {
  read(): Promise<RegistrySnapshot>;
  write(expectedVersion: number, data: Registry): Promise<RegistrySnapshot>;
}
