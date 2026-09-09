import { Hono, type Context } from "hono";
import { Buffer } from "node:buffer";
import { html } from "hono/html";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { secureHeaders } from "hono/secure-headers";
import { answerAdminQuestion, buildAdminAssistantSnapshot, type AssistantAnswer } from "./assistant.js";
import { assistantClient } from "./assistant-client.js";
import { assistantCss } from "./assistant-style.js";
import { demoWorkspace } from "./demo-data.js";
import { PLATFORM_ORIGIN } from "./identity.js";
import type { AdminAuthenticator, AdminConfig, AdminIdentity } from "./identity.js";
import { z } from "zod";
import { applyRegistryCommand, bindPortalIdentity, commandSchema, initialRegistry, publishedCustomer, resolvePortalEntries, RegistryError, type Registry, type RegistrySnapshot, type RegistryStore } from "./registry.js";
import { registryStoreFromEnvironment } from "./registry-store.js";
import { registryClient } from "./registry-client.js";
import {
  completeSalesforceOAuth,
  createSalesforceOAuthRequest,
  listSalesforceAccounts,
  readSalesforceConfiguration,
  salesforceStoreFromEnvironment,
  verifySalesforceOAuthState,
  type SalesforceConfiguration,
  type SalesforceConnectionStore,
} from "./salesforce.js";
import { workspaceClient } from "./workspace-client.js";
import { workspaceCss } from "./workspace-style.js";
import { didEmbedConfiguration, resolveCustomerAgent } from "../customer-portal/agent.js";
import { customerAccessClient } from "../customer-portal/access-client.js";
import { customerPortalClient } from "../customer-portal/client.js";
import { CustomerDomainError, customerDomainServiceFromEnvironment, type CustomerDomainService } from "../customer-portal/domains.js";
import { ClerkCustomerAuthenticator, type CustomerAuthenticator } from "../customer-portal/identity.js";
import { customerSlugFromHostname, isCustomerSlug, isPlatformHostname, normalizeCustomerHostname } from "../customer-portal/routing.js";
import { customerSessionClient } from "../customer-portal/session-client.js";
import { customerPortalCss } from "../customer-portal/style.js";
import { customerPortalContext, renderCustomerPortal, type CustomerPortalPage } from "../customer-portal/template.js";
import { customerLandingClient } from "../customer-landing/client.js";
import { customerLandingCss } from "../customer-landing/style.js";
import { renderCustomerLanding } from "../customer-landing/template.js";

type AdminPortalOptions = {
  registryStore?: RegistryStore;
  customerAuthenticator?: CustomerAuthenticator;
  salesforceConfig?: SalesforceConfiguration | null;
  salesforceStore?: SalesforceConnectionStore;
  assistantApiKey?: string;
  assistantModel?: string;
  didAgentId?: string;
  didClientKey?: string;
  portalRootDomain?: string;
  portalWildcardReady?: boolean;
  domainService?: CustomerDomainService;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  askAssistant?: (question: string, adminId: string) => Promise<AssistantAnswer>;
  presentationFixtures?: boolean;
};
type AdminPortalEnvironment = { Variables: { adminIdentity: AdminIdentity } };
export function clerkFrontendHost(key: string): string | null {
  if (!/^pk_(test|live)_[A-Za-z0-9+/=]+$/.test(key)) return null;
  const decoded = Buffer.from(key.slice(8), "base64").toString("utf8");
  if (!decoded.endsWith("$")) return null;
  const host = decoded.slice(0, -1);
  return /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])$/.test(host) && host.includes(".") ? host : null;
}
export function createAdminPortal(
  authenticator: AdminAuthenticator,
  config: AdminConfig,
  options: AdminPortalOptions = {},
) {
  const app = new Hono<AdminPortalEnvironment>();
  const host = clerkFrontendHost(config.publishableKey);
  const configured = !!(host && config.secretKey && config.allowedEmail);
  const customerConfigured = !!(host && config.secretKey);
  const presentationFixtures = options.presentationFixtures === true;
  const customerAuthenticator = options.customerAuthenticator ?? new ClerkCustomerAuthenticator(config);
  const portalRootDomain = options.portalRootDomain ?? process.env.CUSTOMER_PORTAL_ROOT_DOMAIN ?? "portal.contentonline.se";
  const portalWildcardReady = options.portalWildcardReady ?? ["1", "true"].includes((process.env.CUSTOMER_PORTAL_WILDCARD_READY ?? "").toLowerCase());
  const fallbackDidAgent = {
    agentId: options.didAgentId ?? process.env.DID_AGENT_ID ?? "",
    clientKey: options.didClientKey ?? process.env.DID_CLIENT_KEY ?? "",
  };
  const salesforceConfig = options.salesforceConfig === undefined
    ? readSalesforceConfiguration(process.env)
    : options.salesforceConfig;
  app.use("*", secureHeaders());
  app.use("*", async (c, next) => {
    await next();
    c.header("cache-control", "no-store");
    c.header("x-robots-tag", "noindex, nofollow");
    c.header("referrer-policy", "no-referrer");
  });

  const registry = () => options.registryStore ?? registryStoreFromEnvironment();
  const askAssistant =
    options.askAssistant ??
    (async (question: string, adminId: string) => {
      const apiKey = options.assistantApiKey ?? process.env.OPENAI_API_KEY;
      const model = options.assistantModel ?? process.env.OPENAI_ASSISTANT_MODEL;
      const snapshot = buildAdminAssistantSnapshot((await registry().read()).data);
      return answerAdminQuestion(question, snapshot, {
        adminId,
        ...(apiKey ? { apiKey } : {}),
        ...(model ? { model } : {}),
        ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
      });
    });
  const domainService = () => options.domainService ?? customerDomainServiceFromEnvironment(options.fetchImpl, portalRootDomain);
  const adminRegistrySnapshot = (snapshot: RegistrySnapshot) => ({
    ...snapshot,
    data: {
      ...snapshot.data,
      portalMembers: snapshot.data.portalMembers.map(({ externalUserId, ...member }) => ({
        ...member,
        identityBound: Boolean(externalUserId),
      })),
      events: snapshot.data.events.map((event) => ({
        at: event.at,
        action: event.action,
        entityId: event.entityId,
      })),
    },
    runtime: {
      customerSites: {
        canonicalOrigin: PLATFORM_ORIGIN,
        pathPrefix: "/portal",
      },
      customerDomains: {
        rootDomain: portalRootDomain,
        wildcardReady: portalWildcardReady,
      },
      agentDefaultConfigured: Boolean(didEmbedConfiguration(fallbackDidAgent.agentId, fallbackDidAgent.clientKey)),
      agentModeByCustomer: Object.fromEntries(snapshot.data.customers.map((customer) => {
        if (!customer.site.agent.enabled) return [customer.id, "disabled"];
        if (didEmbedConfiguration(customer.site.agent.agentId, customer.site.agent.clientKey)) return [customer.id, "customer"];
        return [customer.id, resolveCustomerAgent(customer, fallbackDidAgent) ? "platform_fallback" : "incomplete"];
      })),
    },
  });
  const loadPortal = async (slug: string): Promise<{ registry: Registry; customer: NonNullable<ReturnType<typeof publishedCustomer>> } | null> => {
    if (!isCustomerSlug(slug)) return null;
    const data = (await registry().read()).data;
    const customer = publishedCustomer(data, slug);
    return customer ? { registry: data, customer } : null;
  };
  const loadPortalByExactHostname = async (hostname: string): Promise<{ registry: Registry; customer: NonNullable<ReturnType<typeof publishedCustomer>> } | null> => {
    const requestedHostname = normalizeCustomerHostname(hostname);
    if (!requestedHostname) return null;
    const data = (await registry().read()).data;
    const customer = data.customers.find((candidate) =>
      candidate.status === "published"
      && candidate.site.domainStatus === "ready"
      && normalizeCustomerHostname(candidate.site.domain) === requestedHostname,
    ) ?? null;
    return customer ? { registry: data, customer } : null;
  };
  const renderPortalPageResponse = (
    c: Context<AdminPortalEnvironment>,
    portal: { registry: Registry; customer: NonNullable<ReturnType<typeof publishedCustomer>> },
    page: CustomerPortalPage,
    basePath: string,
  ) => {
    const didAgent = resolveCustomerAgent(portal.customer, fallbackDidAgent);
    const contextUrl = basePath ? `${basePath}/api/agent-context` : "/api/agent-context";
    const customerAuth = page === "portal" && basePath && customerConfigured && host
      ? { host, publishableKey: config.publishableKey }
      : undefined;
    return c.html(renderCustomerPortal(portal.customer, portal.registry, {
      basePath,
      contextUrl,
      page,
      didAgent,
      ...(customerAuth ? { customerAuth } : {}),
    }));
  };
  const portalPageResponse = async (c: Context<AdminPortalEnvironment>, slug: string, page: CustomerPortalPage, basePath: string) => {
    try {
      const portal = await loadPortal(slug);
      if (!portal) return c.text("Kundportalen finns inte eller är inte publicerad.", 404);
      return renderPortalPageResponse(c, portal, page, basePath);
    } catch { return c.text("Kundportalen är tillfälligt otillgänglig.", 503); }
  };

  app.get("/customer-portal/assets/style.css", (c) => c.body(customerPortalCss, 200, { "content-type": "text/css; charset=utf-8" }));
  app.get("/customer-portal/assets/client.js", (c) => c.body(customerPortalClient, 200, { "content-type": "text/javascript; charset=utf-8" }));
  app.get("/customer-portal/assets/access.js", (c) => c.body(customerAccessClient, 200, { "content-type": "text/javascript; charset=utf-8" }));
  app.get("/customer-portal/assets/session.js", (c) => c.body(customerSessionClient, 200, { "content-type": "text/javascript; charset=utf-8" }));
  app.get("/customer-landing/assets/style.css", (c) => c.body(customerLandingCss, 200, { "content-type": "text/css; charset=utf-8" }));
  app.get("/customer-landing/assets/client.js", (c) => c.body(customerLandingClient, 200, { "content-type": "text/javascript; charset=utf-8" }));
  // A verified wildcard maps its first label to a slug. A separately verified
  // customer domain instead resolves through the persisted exact hostname.
  app.use("*", async (c, next) => {
    const requestHostname = normalizeCustomerHostname(new URL(c.req.url).hostname);
    const slug = customerSlugFromHostname(requestHostname, portalRootDomain);
    if (!slug && isPlatformHostname(requestHostname, new URL(PLATFORM_ORIGIN).hostname, portalRootDomain)) return next();
    if (!["/", "/login", "/api/agent-context"].includes(c.req.path)) {
      return c.text("Sidan finns inte i kundportalen.", 404);
    }
    try {
      const portal = slug ? await loadPortal(slug) : await loadPortalByExactHostname(requestHostname);
      if (!portal) {
        return c.req.path === "/api/agent-context"
          ? c.json({ error: "not_found" }, 404)
          : c.text("Kundportalen finns inte eller är inte publicerad.", 404);
      }
      if (c.req.path === "/") return renderPortalPageResponse(c, portal, "portal", "");
      if (c.req.path === "/login") return renderPortalPageResponse(c, portal, "login", "");
      return c.json(customerPortalContext(portal.customer, portal.registry));
    } catch {
      return c.req.path === "/api/agent-context"
        ? c.json({ error: "portal_unavailable" }, 503)
        : c.text("Kundportalen är tillfälligt otillgänglig.", 503);
    }
  });
  app.get("/v1/portal-entries", async (c) => {
    let authentication;
    try {
      authentication = await customerAuthenticator.authenticate(c.req.raw);
    } catch {
      return c.json({ error: "authentication_temporarily_unavailable" }, 503);
    }
    if (authentication.status !== "authenticated") {
      const status = authentication.status === "unconfigured" ? 503 : authentication.status === "forbidden" ? 403 : 401;
      return c.json({ error: authentication.status }, status);
    }
    try {
      const store = registry();
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const snapshot = await store.read();
        const binding = bindPortalIdentity(snapshot.data, authentication.identity, options.now?.() ?? new Date());
        if (!binding.changed) {
          return c.json({ entries: resolvePortalEntries(snapshot.data, authentication.identity) });
        }
        try {
          const saved = await store.write(snapshot.version, binding.data);
          return c.json({ entries: resolvePortalEntries(saved.data, authentication.identity) });
        } catch (error) {
          if (error instanceof RegistryError && error.code === "version_conflict" && attempt === 0) continue;
          throw error;
        }
      }
      return c.json({ error: "portal_directory_unavailable" }, 503);
    } catch {
      return c.json({ error: "portal_directory_unavailable" }, 503);
    }
  });
  // Reserve the former selector path so it cannot be interpreted as a customer slug.
  app.get("/portal/login", (c) => c.text("Sidan finns inte.", 404));
  app.get("/portal/:slug", (c) => portalPageResponse(c, c.req.param("slug"), "portal", `/portal/${c.req.param("slug")}`));
  app.get("/portal/:slug/api/agent-context", async (c) => {
    try {
      const portal = await loadPortal(c.req.param("slug"));
      return portal ? c.json(customerPortalContext(portal.customer, portal.registry)) : c.json({ error: "not_found" }, 404);
    } catch { return c.json({ error: "portal_unavailable" }, 503); }
  });
  const salesforceStore = () => options.salesforceStore ?? salesforceStoreFromEnvironment();
  app.get("/admin/assets/registry.js", (c) => c.body(registryClient, 200, { "content-type": "text/javascript; charset=utf-8" }));
  app.get("/admin/assets/style.css", (c) => c.body(workspaceCss, 200, { "content-type": "text/css; charset=utf-8" }));
  app.get("/admin/assets/workspace.js", (c) => c.body(workspaceClient, 200, { "content-type": "text/javascript; charset=utf-8" }));
  app.get("/admin/assets/assistant.css", (c) => c.body(assistantCss, 200, { "content-type": "text/css; charset=utf-8" }));
  app.get("/admin/assets/assistant.js", (c) => c.body(assistantClient, 200, { "content-type": "text/javascript; charset=utf-8" }));
  // Presentation fixtures are available only to explicit local/CI harnesses.
  // Production never opts into these routes.
  if (presentationFixtures) {
    app.get("/demo/workspace", (c) => c.json(demoWorkspace));
    app.get("/demo/customer/kth", (c) => {
      const data = initialRegistry();
      const customer = publishedCustomer(data, "kth");
      if (!customer) return c.text("Demokundportalen saknas.", 404);
      const didAgent = resolveCustomerAgent(customer, fallbackDidAgent);
      return c.html(renderCustomerPortal(customer, data, {
        basePath: "/demo/customer/kth",
        contextUrl: "/demo/customer/kth/api/agent-context",
        page: "portal",
        didAgent,
      }));
    });
    app.get("/demo/customer/kth/login", (c) => {
      const data = initialRegistry();
      const customer = publishedCustomer(data, "kth");
      if (!customer) return c.text("Demokundportalen saknas.", 404);
      const didAgent = resolveCustomerAgent(customer, fallbackDidAgent);
      return c.html(renderCustomerPortal(customer, data, {
        basePath: "/demo/customer/kth",
        contextUrl: "/demo/customer/kth/api/agent-context",
        page: "login",
        didAgent,
      }));
    });
    app.get("/demo/customer/kth/api/agent-context", (c) => {
      const data = initialRegistry();
      const customer = publishedCustomer(data, "kth");
      return customer ? c.json(customerPortalContext(customer, data)) : c.json({ error: "not_found" }, 404);
    });
  }
  app.get("/", (c) => c.html(renderCustomerLanding({
      configured: customerConfigured,
      host,
      publishableKey: config.publishableKey,
    })));
  app.get("/login", (c) => c.html(customerAccessPage("login", host, config.publishableKey, customerConfigured)));
  app.get("/registrera", (c) => c.html(customerAccessPage("register", host, config.publishableKey, customerConfigured)));
  app.get("/admin/login", (c) => c.html(page("login", host, config.publishableKey, configured)));
  app.get("/admin/registrera", (c) => c.html(page("register", host, config.publishableKey, configured)));
  // Public HTML contains no user/customer data. All identity and admin data comes from guarded APIs.
  app.get("/admin", (c) => c.html(page("admin", host, config.publishableKey, configured)));

  // Salesforce returns here without an Authorization header. The short-lived signed state and
  // HttpOnly PKCE cookie are the authorization boundary; provider payloads are never reflected.
  app.get("/admin/api/salesforce/oauth/callback", async (c) => {
    const code = c.req.query("code") ?? "";
    const state = c.req.query("state") ?? "";
    const verifier = getCookie(c, "co_sf_pkce") ?? "";
    deleteCookie(c, "co_sf_pkce", { path: "/admin/api/salesforce/oauth/callback", secure: true });
    if (!salesforceConfig) return c.redirect("/admin?sf=unconfigured#salesforce", 302);
    const verified = verifySalesforceOAuthState(state, salesforceConfig.stateSecret, options.now?.() ?? new Date());
    if (!verified || !/^[A-Za-z0-9._~+/=-]{8,2048}$/.test(code) || !/^[A-Za-z0-9_-]{43,128}$/.test(verifier)) {
      return c.redirect("/admin?sf=invalid_callback#salesforce", 302);
    }
    try {
      await completeSalesforceOAuth({
        config: salesforceConfig,
        store: salesforceStore(),
        code,
        codeVerifier: verifier,
        adminId: verified.adminId,
        now: options.now?.() ?? new Date(),
        ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
      });
      return c.redirect("/admin?sf=connected#salesforce", 302);
    } catch {
      return c.redirect("/admin?sf=connection_failed#salesforce", 302);
    }
  });

  app.use("/admin/api/*", async (c, next) => {
    if (c.req.path === "/admin/api/salesforce/oauth/callback") return next();
    let auth;
    try {
      auth = await authenticator.authenticate(c.req.raw);
    } catch {
      // Do not log tokens, email addresses or provider error payloads.
      return c.json({ error: "authentication_temporarily_unavailable" }, 503);
    }
    if (auth.status !== "authenticated") {
      const status = auth.status === "unconfigured" ? 503 : auth.status === "forbidden" ? 403 : 401;
      return c.json({ error: auth.status }, status);
    }
    c.set("adminIdentity", auth.identity);
    await next();
  });

  app.get("/admin/api/session", (c) =>
    c.json({
      admin: c.get("adminIdentity"),
      authentication: config.publishableKey.startsWith("pk_live_") ? "production" : "development_instance",
      customerDirectoryUrl: "/admin#customers",
      administration: {
        users: "persistent_registry",
        publishers: "persistent_registry",
        customers: "persistent_registry",
        customerAssignments: "persistent_publisher_links",
        customerSites: "shared_multitenant_runtime",
        customerDomains: "vercel_wildcard_or_custom",
        customerAgents: "per_customer_configuration",
        assistant: "documentation_grounded",
        jobs: "not_connected",
      },
    }),
  );
  app.get("/admin/api/salesforce/status", async (c) => {
    if (!salesforceConfig) return c.json({ configured: false, connected: false, provider: "salesforce" });
    try {
      const connection = await salesforceStore().read();
      return c.json({
        configured: true,
        connected: !!connection,
        provider: "salesforce",
        apiVersion: salesforceConfig.apiVersion,
        ...(connection ? { instanceUrl: connection.instanceUrl, updatedAt: connection.updatedAt } : {}),
      });
    } catch {
      return c.json({ error: "salesforce_storage_unavailable" }, 503);
    }
  });
  app.get("/admin/api/salesforce/oauth/start", (c) => {
    if (!salesforceConfig) return c.json({ error: "salesforce_unconfigured" }, 503);
    const request = createSalesforceOAuthRequest(salesforceConfig, c.get("adminIdentity").id, options.now?.() ?? new Date());
    setCookie(c, "co_sf_pkce", request.codeVerifier, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/admin/api/salesforce/oauth/callback",
      maxAge: 10 * 60,
    });
    return c.json({ authorizationUrl: request.authorizationUrl, expiresAt: request.expiresAt });
  });
  app.get("/admin/api/salesforce/accounts", async (c) => {
    if (!salesforceConfig) return c.json({ error: "salesforce_unconfigured" }, 503);
    const query = c.req.query("q") ?? "";
    if (query.length > 80) return c.json({ error: "invalid_query" }, 422);
    try {
      const accounts = await listSalesforceAccounts({
        config: salesforceConfig,
        store: salesforceStore(),
        query,
        adminId: c.get("adminIdentity").id,
        now: options.now?.() ?? new Date(),
        ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
      });
      return c.json({ accounts, mode: "read_only" });
    } catch {
      return c.json({ error: "salesforce_unavailable" }, 503);
    }
  });
  app.get("/admin/api/registry", async (c) => {
    try { return c.json(adminRegistrySnapshot(await registry().read())); }
    catch { return c.json({ error: "storage_unavailable" }, 503); }
  });
  app.post("/admin/api/registry", async (c) => {
    // Bearer auth is mandatory above; a cookie and a foreign origin never authorize writes.
    const origin = c.req.header("origin");
    if (origin && origin !== PLATFORM_ORIGIN && origin !== new URL(c.req.url).origin) return c.json({ error: "forbidden" }, 403);
    try {
      const raw = await c.req.text();
      if (raw.length > 16000) return c.json({ error: "body_too_large" }, 413);
      const body = z.object({ version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), command: commandSchema }).safeParse(JSON.parse(raw));
      if (!body.success) return c.json({ error: "invalid_command" }, 422);
      const store = registry();
      const current = await store.read();
      if (current.version !== body.data.version) return c.json({ error: "version_conflict" }, 409);
      const command = body.data.command;
      const releasedDomain = command.action === "delete_customer"
        ? current.data.customers.find((customer) => customer.id === command.id)?.site.domain ?? ""
        : "";
      const next = applyRegistryCommand(current.data, command, c.get("adminIdentity").id, options.now?.() ?? new Date());
      // Validation above must succeed before any external side effect. Exact
      // custom domains are then detached before the irreversible registry write.
      if (command.action === "delete_customer") await domainService().release(releasedDomain);
      return c.json(adminRegistrySnapshot(await store.write(current.version, next)));
    } catch (error) {
      if (error instanceof SyntaxError) return c.json({ error: "invalid_json" }, 422);
      if (error instanceof CustomerDomainError) {
        return c.json({ error: error.code === "unconfigured" ? "domain_automation_unconfigured" : "domain_automation_unavailable" }, 503);
      }
      if (error instanceof RegistryError) return c.json({ error: error.code }, error.status);
      return c.json({ error: "storage_unavailable" }, 503);
    }
  });

  app.post("/admin/api/customers/:id/domain/ensure", async (c) => {
    const origin = c.req.header("origin");
    if (origin && origin !== PLATFORM_ORIGIN && origin !== new URL(c.req.url).origin) return c.json({ error: "forbidden" }, 403);
    try {
      const raw = await c.req.text();
      if (raw.length > 1_000) return c.json({ error: "body_too_large" }, 413);
      const body = z.object({ version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) }).safeParse(JSON.parse(raw));
      if (!body.success) return c.json({ error: "invalid_command" }, 422);
      const store = registry();
      const current = await store.read();
      if (current.version !== body.data.version) return c.json({ error: "version_conflict" }, 409);
      const customer = current.data.customers.find((item) => item.id === c.req.param("id"));
      if (!customer) return c.json({ error: "not_found" }, 404);
      if (!customer.site.domain) return c.json({ error: "domain_unconfigured" }, 409);
      const result = await domainService().ensure(customer.site.domain);
      const next = applyRegistryCommand(current.data, {
        action: "set_customer_domain_status",
        id: customer.id,
        domainStatus: result.status,
      }, c.get("adminIdentity").id, options.now?.() ?? new Date());
      const saved = await store.write(current.version, next);
      return c.json({
        version: saved.version,
        domain: customer.site.domain,
        managedDomain: result.managedDomain,
        status: result.status,
        nextStep: result.status === "ready" ? "ready" : "configure_wildcard_dns",
      });
    } catch (error) {
      if (error instanceof SyntaxError) return c.json({ error: "invalid_json" }, 422);
      if (error instanceof CustomerDomainError) {
        return c.json({ error: error.code === "unconfigured" ? "domain_automation_unconfigured" : "domain_automation_unavailable" }, 503);
      }
      if (error instanceof RegistryError) return c.json({ error: error.code }, error.status);
      return c.json({ error: "storage_unavailable" }, 503);
    }
  });

  app.post("/admin/api/assistant/message", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 422);
    }
    if (!body || typeof body !== "object" || !("message" in body) || typeof body.message !== "string") {
      return c.json({ error: "invalid_message" }, 422);
    }
    const question = body.message.trim();
    if (question.length < 2 || question.length > 1_200) {
      return c.json({ error: "message_length" }, 422);
    }
    try {
      return c.json(await askAssistant(question, c.get("adminIdentity").id));
    } catch {
      return c.json({ error: "assistant_context_unavailable" }, 503);
    }
  });

  app.all("/admin/api/*", (c) => c.json({ error: "not_found" }, 404));
  return app;
}

function assistantWidget(mode: "login" | "register" | "admin" | "demo") {
  if (mode !== "admin") return "";
  return html`
    <button class="assistant-launcher" id="assistant-launcher" type="button" aria-label="Öppna Content Online AI" aria-controls="assistant-panel" aria-expanded="false">
      <span class="assistant-launcher-mark" aria-hidden="true">CO</span><span class="sr-only">Fråga CO</span>
    </button>
    <aside class="assistant-panel" id="assistant-panel" role="dialog" aria-labelledby="assistant-title" hidden>
      <div class="assistant-topbar"><div class="assistant-avatar" aria-hidden="true">CO</div><div><h2 id="assistant-title">Fråga CO</h2><p>Intern kunskapsassistent</p></div><button class="assistant-close" id="assistant-close" type="button" aria-label="Stäng assistenten">×</button></div>
      <div class="assistant-locked" id="assistant-locked">
        <p class="assistant-state">Kontrollerar din adminsession…</p>
      </div>
      <div class="assistant-app" id="assistant-app" hidden>
        <div class="assistant-messages" id="assistant-messages" aria-live="polite"><div class="assistant-message bot"><div>Hej! Vad vill du veta om plattformen?</div></div></div>
        <div class="assistant-prompts"><button type="button" data-prompt="Vad kan plattformen göra nu?">Vad fungerar nu?</button><button type="button" data-prompt="Vilka integrationer är inte klara?">Öppna integrationer</button></div>
        <form class="assistant-form" id="assistant-form"><label class="sr-only" for="assistant-input">Skriv en fråga</label><textarea id="assistant-input" maxlength="1200" rows="1" placeholder="Fråga om plattformen…" required></textarea><button type="submit" aria-label="Skicka fråga">↑</button></form><p class="assistant-footnote">Undvik personuppgifter och hemligheter. Frågan skickas till OpenAI när AI är tillgänglig.</p>
      </div>
    </aside>`;
}
function icon(name: string) {
  const paths: Record<string, string> = {
    grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    customers: 'M3 21V7l9-4v18M12 9h9v12M7 9v2m0 3v2m9-3v2m0 3v2M1 21h22',
    users: 'M4 20v-2a6 6 0 0 1 12 0v2M6 8a3 3 0 1 0 6 0 3 3 0 1 0-6 0M17 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 2 4',
    book: 'M12 6c-3-3-8-3-10-2v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2v15',
    link: 'm9 15 6-6m-8 3-2 2a4 4 0 0 0 6 6l2-2m-2-12 2-2a4 4 0 0 1 6 6l-2 2',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    info: 'M12 11v6m0-10v1M21 12a9 9 0 1 0-18 0 9 9 0 1 0 18 0',
    calendar: 'M3 5h18v16H3z M7 3v4m10-4v4M3 10h18',
    search: 'M16 10a6 6 0 1 0-12 0 6 6 0 1 0 12 0m-1 5 6 6',
    cloud: 'M7 18h10a4 4 0 0 0 .7-7.94A6 6 0 0 0 6.2 8.5 4.5 4.5 0 0 0 7 18Z',
    menu: 'M4 6h16M4 12h16M4 18h16',
    close: 'm6 6 12 12M6 18 18 6',
  };
  return html`<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name] || paths.grid}"/></svg>`;
}
function brand() { return html`<a class="brand portal-brand" href="/admin" aria-label="Content Online · intern arbetsyta"><span class="brand-logo"><img src="/admin/assets/co-logo.png" alt="" width="96" height="96"></span><span class="portal-brand-copy"><strong>Content Online</strong><small>INTERN ARBETSYTA</small></span></a>`; }
function customerAccessPage(mode: "login" | "register", host: string | null, key: string, configured: boolean) {
  return html`<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${mode === "register" ? "Aktivera kundkonto" : "Kundinloggning"} · Content Online</title>
  <meta name="description" content="Säker ingång till Content Onlines kundportaler."><meta name="robots" content="noindex,nofollow">
  <link rel="stylesheet" href="/customer-portal/assets/style.css">
  ${configured && host ? html`<script defer crossorigin="anonymous" src="https://${host}/npm/@clerk/ui@1/dist/ui.browser.js"></script><script defer crossorigin="anonymous" data-clerk-publishable-key="${key}" src="https://${host}/npm/@clerk/clerk-js@6/dist/clerk.browser.js"></script><script defer src="/customer-portal/assets/access.js"></script>` : ""}
  </head><body data-preset="academic" data-data-mode="customer-access" data-customer-access-mode="${mode}" style="--portal-primary:#285b70;--portal-accent:#338578;--portal-on-primary:#ffffff">
  <div class="login-shell"><section class="login-brand"><a class="co-brand" href="/" aria-label="Content Online"><span class="co-mark"><img src="/admin/assets/co-logo.png" alt=""></span><span><strong>Content Online</strong><small>KNOWLEDGE. CONNECTED.</small></span></a>
  <div class="login-identity"><span class="section-kicker">KUNDPORTAL</span><h1>Kunskap, samlad för er.</h1><p>En säker ingång till organisationens produkter, analys och rapporter. Vilken portal du får öppna avgörs av ditt verifierade medlemskap.</p></div><small>Content Online · Kundåtkomst</small></section>
  <main class="login-panel" id="customer-access"><section class="login-card"><span class="section-kicker">${mode === "register" ? "AKTIVERA KONTO" : "LOGGA IN"}</span><h2>${mode === "register" ? "Skapa ditt kundkonto." : "Välkommen tillbaka."}</h2><p>${mode === "register" ? "Använd den verifierade e-postadress som Content Online har kopplat till er organisation." : "Logga in med organisationens aktiverade konto."}</p>
  <p class="customer-access-message" id="customer-access-message" role="status">${configured ? "Laddar säker inloggning…" : "Kundinloggningen är inte konfigurerad."}</p>${configured ? html`<div id="customer-auth-widget"></div>` : ""}
  <section class="portal-chooser" id="portal-chooser" aria-labelledby="portal-chooser-title" hidden><h3 id="portal-chooser-title">Era kundportaler</h3><div class="portal-entry-list" id="portal-entry-list"></div></section>
  <div class="customer-account" id="customer-account" hidden><button class="button secondary" id="customer-sign-out" type="button" hidden>Logga ut och byt konto</button></div>
  <div class="customer-access-switch"><a href="${mode === "register" ? "/login" : "/registrera"}">${mode === "register" ? "Har du redan ett konto? Logga in" : "Aktivera ditt kundkonto"}</a><a href="/admin/login">Content Online-personal →</a></div>
  <div class="trust-line"><span>${icon("info")}</span><p>En kundadress eller slug ger aldrig behörighet. Åtkomsten kontrolleras på servern för varje konto.</p></div></section></main></div>
  <noscript><p>Aktivera JavaScript för att logga in.</p></noscript></body></html>`;
}
function page(mode: "login" | "register" | "admin" | "demo", host: string | null, key: string, configured: boolean) {
  const workspace = mode === "admin" || mode === "demo";
  const demo = mode === "demo";
  return html`<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${workspace ? "Arbetsyta" : "Logga in"} · Content Online</title>
  <meta name="description" content="En samlad arbetsyta för forskningsinformation, standarder och kundrelationer.">
  <link rel="stylesheet" href="/admin/assets/style.css">
  ${configured && host ? html`<script defer crossorigin="anonymous" src="https://${host}/npm/@clerk/ui@1/dist/ui.browser.js"></script><script defer crossorigin="anonymous" data-clerk-publishable-key="${key}" src="https://${host}/npm/@clerk/clerk-js@6/dist/clerk.browser.js"></script>` : ""}
  ${workspace ? html`<script defer src="/admin/assets/workspace.js"></script>${!demo ? html`<script defer src="/admin/assets/registry.js"></script>` : ""}` : ""}
  ${mode === "admin" ? html`<link rel="stylesheet" href="/admin/assets/assistant.css"><script defer src="/admin/assets/assistant.js"></script>` : ""}
  </head><body data-mode="${mode}" data-page="${mode}">
  ${workspace ? html`<div class="shell">
    <aside class="sidebar" id="sidebar">${brand()}<div class="nav-label">ARBETSYTA</div><nav class="nav" aria-label="Content Online">
      <button data-action="navigate" data-id="overview" aria-current="page">${icon("grid")}Översikt</button>
      <div class="nav-section" data-nav-group="customers"><button data-action="navigate" data-id="customers" aria-current="false">${icon("customers")}Kundorganisationer</button><div class="nav-sub" role="group" aria-label="Kundorganisationer"><button data-action="navigate" data-id="users" aria-current="false">Användare</button><button data-action="navigate" data-id="cron" aria-current="false">Cronjobb</button><button data-action="navigate" data-id="reports" aria-current="false">Rapportflöde</button></div></div>
      <div class="nav-section" data-nav-group="connections"><button data-action="navigate" data-id="connections" aria-current="false">${icon("link")}Anslutningar</button><div class="nav-sub" role="group" aria-label="Anslutningar"><button data-action="navigate" data-id="salesforce" aria-current="false">Salesforce</button><button data-action="navigate" data-id="publishers" aria-current="false">Publicister</button><button data-action="navigate" data-id="products" aria-current="false">Produkter & tilldelningar</button></div></div>
    </nav></aside>
    <button class="mobile-scrim" id="scrim" aria-label="Stäng navigering"></button>
    <div class="main-column"><header class="topbar"><div class="breadcrumbs"><button class="mobile-menu" id="menu-toggle" aria-label="Öppna navigering" aria-expanded="false" aria-controls="sidebar">${icon("menu")}</button><strong>Administration</strong></div><div class="top-actions">${demo ? html`<span class="pill blue">DEMO</span>` : ""}<span id="account-email"></span>${demo ? html`<a class="button quiet" href="/admin/login">Logga in</a>` : html`<button class="button quiet" id="sign-out">Logga ut</button>`}</div></header>
    <section id="access-message" class="access-message"><h1>Din arbetsyta</h1><p id="message" role="status">${demo ? "Laddar visningsdemon…" : "Kontrollerar din inloggning…"}</p><a class="button secondary" href="/admin/login">Till inloggningen</a></section>
    <main class="page" id="workspace" hidden><div class="page-heading"><div><h1 id="view-title">Översikt</h1><p class="lead" id="view-description"></p></div></div>
    <div class="toolbar" id="toolbar" hidden><label class="search">${icon("search")}<input id="search" type="search" placeholder="Sök i den här vyn…" aria-label="Sök i aktuell vy"></label></div>
    ${!demo ? html`<section id="registry-panel" class="card" hidden aria-label="Sparat register"><div class="card-body" id="registry-body"></div></section>` : ""}<div id="view" aria-live="polite"></div></main></div></div>
    <dialog class="dialog" id="detail-dialog" aria-labelledby="detail-title"><div class="dialog-head"><div><div class="eyebrow" id="detail-subtitle"></div><h2 id="detail-title"></h2></div><button class="close-button" data-action="close" aria-label="Stäng detaljer">${icon("close")}</button></div><div class="dialog-body" id="detail-body"></div></dialog>` : html`
    <div class="auth-shell"><section class="auth-showcase" aria-label="Content Online">
    <video class="auth-showcase-video" id="auth-background-video" autoplay muted loop playsinline preload="metadata" aria-hidden="true"><source src="/admin/assets/home-video.webm" type="video/webm"></video>
    <div class="auth-showcase-inner"><a class="auth-logo-stage" href="/" aria-label="Till Content Online"><span class="auth-logo-reveal"><img class="auth-logo-image" src="/admin/assets/co-logo.png" alt="Content Online" width="1254" height="1254"></span><span class="auth-orbit-cover" aria-hidden="true"></span><span class="auth-orbit" aria-hidden="true"><span class="auth-orbit-dot"></span></span></a><p class="auth-tagline">KNOWLEDGE. CONNECTED.</p></div></section>
    <main class="auth-main"><header class="auth-main-header"><span class="pill">INTERN ÅTKOMST</span></header>
    <section class="auth-card"><div class="eyebrow">CONTENT ONLINE · INTERN ÅTKOMST</div><h1>${mode === "register" ? "Aktivera ditt konto" : "Välkommen tillbaka."}</h1><p class="lead">${mode === "register" ? "Använd den godkända adressen och verifiera den för att aktivera ditt personliga konto." : "Logga in i Content Onlines egen arbetsyta för kundrelationer och informationsprodukter."}</p><p id="message" role="status">${configured ? "Laddar säker inloggning…" : "Intern inloggning är inte konfigurerad."}</p>${configured ? html`<div id="auth-widget"></div>` : ""}<div class="quiet-row"><a href="${mode === "register" ? "/admin/login" : "/admin/registrera"}">${mode === "register" ? "Redan ett konto? Logga in" : "Aktivera ditt konto"}</a></div><p class="footnote">${key.startsWith("pk_live_") ? "Endast godkända konton har intern behörighet." : "Pilot: inloggningen använder Clerks utvecklingsinstans."}</p></section>
    <footer class="auth-footer">Content Online · Intern administration. Kundorganisationer använder sina egna portaladresser.</footer></main></div>`}
    ${assistantWidget(mode)}
    <noscript><p class="banner">Aktivera JavaScript för att använda denna arbetsyta.</p></noscript>
    ${!workspace ? html`<script>
    window.addEventListener('DOMContentLoaded',function(){
      var video=document.getElementById('auth-background-video');
      if(!video)return;
      var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
      var speed=function(){video.playbackRate=.55;};
      var sync=function(){if(reduced.matches){video.pause();return;}speed();video.play().catch(function(){});};
      if(video.readyState>0)speed();else video.addEventListener('loadedmetadata',speed,{once:true});
      if(reduced.addEventListener)reduced.addEventListener('change',sync);
      sync();
    });
    </script>` : ""}
    ${configured && (mode === "login" || mode === "register") ? html`<script>
    window.addEventListener('load', async function () {
      var message=document.getElementById('message');
      try {
        await Clerk.load({ui:{ClerkUI:window.__internal_ClerkUICtor},signInUrl:'/admin/login',signUpUrl:'/admin/registrera',signInForceRedirectUrl:'/admin',signUpForceRedirectUrl:'/admin'});
        if(Clerk.session){
          var response=await fetch('/admin/api/session',{headers:{Authorization:'Bearer '+await Clerk.session.getToken()},cache:'no-store',credentials:'omit'});
          if(response.ok){location.replace('/admin');return;}
          message.textContent='Kontot kunde inte verifieras för intern åtkomst.';
          var logout=document.createElement('button');logout.className='button secondary';logout.textContent='Logga ut och byt konto';logout.addEventListener('click',function(){Clerk.signOut({redirectUrl:'/admin/login'});});message.after(logout);return;
        }
        message.textContent='';
        var options={routing:'hash',signInUrl:'/admin/login',signUpUrl:'/admin/registrera',forceRedirectUrl:'/admin',fallbackRedirectUrl:'/admin'};
        if(document.body.dataset.mode==='register')Clerk.mountSignUp(document.getElementById('auth-widget'),options);
        else Clerk.mountSignIn(document.getElementById('auth-widget'),options);
      }catch(_){message.textContent='Inloggningstjänsten kunde inte laddas. Ladda om sidan och försök igen.';}
    });
    </script>` : ""}</body></html>`;
}
