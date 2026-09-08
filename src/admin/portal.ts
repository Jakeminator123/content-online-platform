import { Hono, type Context } from "hono";
import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";
import { html } from "hono/html";
import { secureHeaders } from "hono/secure-headers";
import { answerAdminQuestion, type AssistantAnswer } from "./assistant.js";
import { assistantClient } from "./assistant-client.js";
import { assistantCss } from "./assistant-style.js";
import { demoWorkspace } from "./demo-data.js";
import { PLATFORM_ORIGIN } from "./identity.js";
import type { AdminAuthenticator, AdminConfig, AdminIdentity } from "./identity.js";
import { adminJobs, runAdminJob } from "./jobs.js";
import { z } from "zod";
import { applyRegistryCommand, commandSchema, publicPortal, publishedCustomer, RegistryError, type Registry, type RegistryStore } from "./registry.js";
import { registryStoreFromEnvironment } from "./registry-store.js";
import { registryClient } from "./registry-client.js";
import { workspaceClient } from "./workspace-client.js";
import { workspaceCss } from "./workspace-style.js";
import { resolveCustomerAgent } from "../customer-portal/agent.js";
import { customerPortalClient } from "../customer-portal/client.js";
import { CustomerDomainError, customerDomainServiceFromEnvironment, type CustomerDomainService } from "../customer-portal/domains.js";
import { customerSlugFromHostname, isCustomerSlug } from "../customer-portal/routing.js";
import { customerPortalCss } from "../customer-portal/style.js";
import { customerPortalContext, renderCustomerPortal, type CustomerPortalPage } from "../customer-portal/template.js";

type AdminPortalOptions = {
  registryStore?: RegistryStore;
  assistantApiKey?: string;
  assistantModel?: string;
  didAgentId?: string;
  didClientKey?: string;
  portalRootDomain?: string;
  domainService?: CustomerDomainService;
  cronSecret?: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  askAssistant?: (question: string, adminId: string) => Promise<AssistantAnswer>;
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
  const portalRootDomain = options.portalRootDomain ?? process.env.CUSTOMER_PORTAL_ROOT_DOMAIN ?? "portal.contentonline.se";
  const fallbackDidAgent = {
    agentId: options.didAgentId ?? process.env.DID_AGENT_ID ?? "",
    clientKey: options.didClientKey ?? process.env.DID_CLIENT_KEY ?? "",
  };
  const askAssistant =
    options.askAssistant ??
    ((question: string, adminId: string) => {
      const apiKey = options.assistantApiKey ?? process.env.OPENAI_API_KEY;
      const model = options.assistantModel ?? process.env.OPENAI_ASSISTANT_MODEL;
      return answerAdminQuestion(question, demoWorkspace, {
        adminId,
        ...(apiKey ? { apiKey } : {}),
        ...(model ? { model } : {}),
        ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
      });
    });

  app.use("*", secureHeaders());
  app.use("*", async (c, next) => {
    await next();
    c.header("cache-control", "no-store");
    c.header("x-robots-tag", "noindex, nofollow");
    c.header("referrer-policy", "no-referrer");
  });

  const registry = () => options.registryStore ?? registryStoreFromEnvironment();
  const domainService = () => options.domainService ?? customerDomainServiceFromEnvironment(options.fetchImpl);
  const loadPortal = async (slug: string): Promise<{ registry: Registry; customer: NonNullable<ReturnType<typeof publishedCustomer>> } | null> => {
    if (!isCustomerSlug(slug)) return null;
    const data = (await registry().read()).data;
    const customer = publishedCustomer(data, slug);
    return customer ? { registry: data, customer } : null;
  };
  const portalPageResponse = async (c: Context<AdminPortalEnvironment>, slug: string, page: CustomerPortalPage, basePath: string) => {
    try {
      const portal = await loadPortal(slug);
      if (!portal) return c.text("Kundportalen finns inte eller är inte publicerad.", 404);
      const didAgent = resolveCustomerAgent(portal.customer, fallbackDidAgent);
      const contextUrl = basePath ? `${basePath}/api/agent-context` : "/api/agent-context";
      return c.html(renderCustomerPortal(portal.customer, portal.registry, { basePath, contextUrl, page, didAgent }));
    } catch { return c.text("Kundportalen är tillfälligt otillgänglig.", 503); }
  };

  app.get("/customer-portal/assets/style.css", (c) => c.body(customerPortalCss, 200, { "content-type": "text/css; charset=utf-8" }));
  app.get("/customer-portal/assets/client.js", (c) => c.body(customerPortalClient, 200, { "content-type": "text/javascript; charset=utf-8" }));
  // A verified wildcard domain maps the first host label to one published tenant.
  app.use("*", async (c, next) => {
    const slug = customerSlugFromHostname(new URL(c.req.url).hostname, portalRootDomain);
    if (!slug) return next();
    if (c.req.path === "/") return portalPageResponse(c, slug, "portal", "");
    if (c.req.path === "/login") return portalPageResponse(c, slug, "login", "");
    if (c.req.path === "/api/agent-context") {
      try {
        const portal = await loadPortal(slug);
        return portal ? c.json(customerPortalContext(portal.customer, portal.registry)) : c.json({ error: "not_found" }, 404);
      } catch { return c.json({ error: "portal_unavailable" }, 503); }
    }
    return c.text("Sidan finns inte i kundportalen.", 404);
  });
  app.get("/portal/:slug", (c) => portalPageResponse(c, c.req.param("slug"), "portal", `/portal/${c.req.param("slug")}`));
  app.get("/portal/:slug/login", (c) => portalPageResponse(c, c.req.param("slug"), "login", `/portal/${c.req.param("slug")}`));
  app.get("/portal/:slug/api/agent-context", async (c) => {
    try {
      const portal = await loadPortal(c.req.param("slug"));
      return portal ? c.json(customerPortalContext(portal.customer, portal.registry)) : c.json({ error: "not_found" }, 404);
    } catch { return c.json({ error: "portal_unavailable" }, 503); }
  });
  app.get("/admin/assets/registry.js", (c) => c.body(registryClient, 200, { "content-type": "text/javascript; charset=utf-8" }));
  app.get("/portal-directory/:slug", async (c) => {
    try {
      const slug = c.req.param("slug");
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 63) return c.json({ error: "not_found" }, 404);
      const portal = publicPortal((await registry().read()).data, slug);
      return portal ? c.json(portal) : c.json({ error: "not_found" }, 404);
    } catch { return c.json({ error: "portal_directory_unavailable" }, 503); }
  });
  app.get("/admin/assets/style.css", (c) => c.body(workspaceCss, 200, { "content-type": "text/css; charset=utf-8" }));
  app.get("/admin/assets/workspace.js", (c) => c.body(workspaceClient, 200, { "content-type": "text/javascript; charset=utf-8" }));
  app.get("/admin/assets/assistant.css", (c) => c.body(assistantCss, 200, { "content-type": "text/css; charset=utf-8" }));
  app.get("/admin/assets/assistant.js", (c) => c.body(assistantClient, 200, { "content-type": "text/javascript; charset=utf-8" }));
  // This public route returns only immutable presentation fixtures. It never authenticates or saves.
  app.get("/demo/workspace", (c) => c.json(demoWorkspace));
  app.get("/demo", (c) => c.html(page("demo", null, "", false)));
  app.get("/", (c) => c.html(page("login", host, config.publishableKey, configured)));
  // Staff choose the customer inside their own workspace; never default to KTH.
  app.get("/kundportal", (c) => c.redirect("/admin#customers", 302));
  app.get("/content-online", (c) => c.redirect("/admin", 302));
  app.get("/content-online/login", (c) => c.redirect("/admin/login", 302));
  app.get("/admin/login", (c) => c.html(page("login", host, config.publishableKey, configured)));
  app.get("/admin/registrera", (c) => c.html(page("register", host, config.publishableKey, configured)));
  // Public HTML contains no user/customer data. All identity and admin data comes from guarded APIs.
  app.get("/admin", (c) => c.html(page("admin", host, config.publishableKey, configured)));

  app.get("/api/cron/platform-readiness", (c) => {
    const cronSecret = options.cronSecret ?? process.env.CRON_SECRET ?? "";
    if (!authorizedCronRequest(c.req.header("authorization"), cronSecret)) {
      return c.json({ error: "unauthorized" }, 401);
    }
    const execution = runAdminJob("platform-readiness", demoWorkspace, options.now?.() ?? new Date());
    if (!execution) return c.json({ error: "job_not_found" }, 404);
    console.info("admin_cron_completed", {
      jobId: execution.jobId,
      status: execution.status,
      finishedAt: execution.finishedAt,
    });
    return c.json({ execution });
  });

  app.use("/admin/api/*", async (c, next) => {
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
        users: "read_only_demo",
        publishers: "persistent_registry",
        customers: "persistent_registry",
        customerAssignments: "persistent_publisher_links",
        customerSites: "shared_multitenant_runtime",
        customerDomains: "vercel_wildcard_or_custom",
        customerAgents: "per_customer_configuration",
        assistant: "documentation_grounded",
        jobs: "allowlisted_controls",
      },
    }),
  );
  app.get("/admin/api/workspace", (c) => c.json(demoWorkspace));
  app.get("/admin/api/registry", async (c) => {
    try { return c.json(await registry().read()); }
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
      const next = applyRegistryCommand(current.data, body.data.command, c.get("adminIdentity").id, options.now?.() ?? new Date());
      return c.json(await store.write(current.version, next));
    } catch (error) {
      if (error instanceof SyntaxError) return c.json({ error: "invalid_json" }, 422);
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
    return c.json(await askAssistant(question, c.get("adminIdentity").id));
  });

  app.get("/admin/api/jobs", (c) =>
    c.json({
      jobs: adminJobs.map((job) => ({ ...job, lastRun: null })),
      executionPolicy: "allowlisted_read_only",
      persistence: "disabled",
    }),
  );
  app.post("/admin/api/jobs/:jobId/run", (c) => {
    const execution = runAdminJob(c.req.param("jobId"), demoWorkspace, options.now?.() ?? new Date());
    if (!execution) return c.json({ error: "job_not_found" }, 404);
    return c.json({ execution });
  });

  app.all("/admin/api/*", (c) => c.json({ error: "not_found" }, 404));
  return app;
}

function authorizedCronRequest(authorization: string | undefined, cronSecret: string): boolean {
  if (!cronSecret || !authorization?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(cronSecret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
function assistantWidget(mode: "login" | "register" | "admin" | "demo") {
  const adminMode = mode === "admin";
  return html`
    <button class="assistant-launcher" id="assistant-launcher" type="button" aria-label="Öppna Content Online AI" aria-controls="assistant-panel" aria-expanded="false">
      <span class="assistant-launcher-mark">CO</span><span class="assistant-launcher-copy"><strong>Fråga CO</strong><small>AI-assistent</small></span><span class="assistant-launcher-spark" aria-hidden="true">✦</span>
    </button>
    <aside class="assistant-panel" id="assistant-panel" role="dialog" aria-labelledby="assistant-title" hidden>
      <div class="assistant-topbar"><div class="assistant-avatar">CO</div><div><div class="assistant-presence"><span></span>Content Online AI</div><h2 id="assistant-title">Vad vill du få gjort?</h2></div><button class="assistant-close" id="assistant-close" type="button" aria-label="Stäng assistenten">×</button></div>
      <div class="assistant-locked" id="assistant-locked">
        <div class="assistant-lock-icon" aria-hidden="true">✦</div><h3>Din interna genväg</h3><p>Efter inloggning kan assistenten svara om plattformen, visa den behöriga kundbilden och starta säkra kontrolljobb.</p><div class="assistant-scope"><span>Dokumentbaserad</span><span>Behörighetsstyrd</span><span>Inga fria kommandon</span></div>
        ${adminMode ? html`<p class="assistant-state">Kontrollerar din adminsession…</p>` : html`<p class="assistant-state">Logga in för att aktivera arbetsytan.</p><a class="button teal" href="/admin/login">Logga in – Content Online</a>`}
      </div>
      ${adminMode ? html`
        <div class="assistant-app" id="assistant-app" hidden>
          <div class="assistant-tabs" role="tablist" aria-label="Assistentens arbetsytor"><button class="active" type="button" role="tab" aria-selected="true" data-assistant-tab="chat">Fråga</button><button type="button" role="tab" aria-selected="false" data-assistant-tab="customers">Kundbild</button><button type="button" role="tab" aria-selected="false" data-assistant-tab="jobs">Jobb</button></div>
          <section class="assistant-view active" id="assistant-view-chat" role="tabpanel">
          <div class="assistant-chat-intro"><span>Intern kunskapsassistent</span><p>D-ID-agenten finns i kundportalen. Här stannar Content Onlines skyddade textchatt och adminverktyg.</p></div><div class="assistant-messages" id="assistant-messages" aria-live="polite"><div class="assistant-message bot"><div>Hej! Jag svarar utifrån projektets dokumentation och den skyddade pilotöversikten. Jag skiljer alltid på vad plattformen kan nu och vad som återstår.</div></div></div>
          <div class="assistant-prompts"><button type="button" data-prompt="Vad kan plattformen göra nu och vad ska den kunna senare?">Nu kontra sedan</button><button type="button" data-prompt="Vilken data får respektive användarroll se?">Rollernas data</button><button type="button" data-prompt="Vilka integrationer är inte klara?">Öppna integrationer</button></div>
          <form class="assistant-form" id="assistant-form"><label class="sr-only" for="assistant-input">Skriv en fråga</label><textarea id="assistant-input" maxlength="1200" rows="1" placeholder="Fråga om plattformen…" required></textarea><button type="submit" aria-label="Skicka fråga">↑</button></form><p class="assistant-footnote">När AI är tillgänglig skickas din fråga till OpenAI. Skriv inga personuppgifter, avtal eller hemligheter. Faktasvar utan AI märks separat.</p></section>
          <section class="assistant-view" id="assistant-view-customers" role="tabpanel" hidden><div class="assistant-section-intro"><span class="assistant-kicker">Skyddad pilotvy</span><h3>Kunder och dataåtkomst</h3><p>Visar bara vad den inloggade Content Online-administratören får läsa.</p></div><div id="assistant-customers"></div></section>
          <section class="assistant-view" id="assistant-view-jobs" role="tabpanel" hidden><div class="assistant-section-intro"><span class="assistant-kicker">Säker automation</span><h3>Kontrolljobb</h3><p>Endast fördefinierade läsjobb. Inga fria kommandon eller externa skrivningar.</p></div><div id="assistant-jobs"></div><div class="assistant-job-result" id="assistant-job-result" role="status" hidden></div></section>
        </div>` : ""}
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
    menu: 'M4 6h16M4 12h16M4 18h16',
    close: 'm6 6 12 12M6 18 18 6',
  };
  return html`<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name] || paths.grid}"/></svg>`;
}
function brand() { return html`<a class="brand portal-brand" href="/" aria-label="Content Online · intern arbetsyta"><span class="brand-logo"><img src="/admin/assets/co-logo.png" alt="" width="96" height="96"></span><span class="portal-brand-copy"><strong>Content Online</strong><small>INTERN ARBETSYTA</small></span></a>`; }
function page(mode: "login" | "register" | "admin" | "demo", host: string | null, key: string, configured: boolean) {
  const workspace = mode === "admin" || mode === "demo";
  const demo = mode === "demo";
  const navigation = [["overview","Överblick","grid"],["customers","Kundorganisationer","customers"],["users","Användare","users"],["publishers","Publicister","book"],["products","Produkter & tilldelningar","link"],["connections","Anslutningar","grid"]];
  return html`<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${workspace ? "Arbetsyta" : "Logga in"} · Content Online</title>
  <meta name="description" content="En samlad arbetsyta för forskningsinformation, standarder och kundrelationer.">
  <link rel="stylesheet" href="/admin/assets/style.css">
  ${configured && host ? html`<script defer crossorigin="anonymous" src="https://${host}/npm/@clerk/ui@1/dist/ui.browser.js"></script><script defer crossorigin="anonymous" data-clerk-publishable-key="${key}" src="https://${host}/npm/@clerk/clerk-js@6/dist/clerk.browser.js"></script>` : ""}
  ${workspace ? html`<script defer src="/admin/assets/workspace.js"></script>${!demo ? html`<script defer src="/admin/assets/registry.js"></script>` : ""}` : ""}
  <link rel="stylesheet" href="/admin/assets/assistant.css"><script defer src="/admin/assets/assistant.js"></script>
  </head><body data-mode="${mode}" data-page="${mode}">
  ${workspace ? html`<div class="shell">
    <aside class="sidebar" id="sidebar">${brand()}<div class="nav-label">ARBETSYTA</div><nav class="nav" aria-label="Content Online">
    ${navigation.map(([id,label,symbol])=>html`<button data-action="navigate" data-id="${id}" aria-current="${id === "overview" ? "page" : "false"}">${icon(symbol!)}${label}</button>`)}
    </nav><div class="sidebar-foot"><a href="/admin#customers">${icon("customers")} Kundregister & kundportaler</a><p>${demo ? "Visningsdemo · inga ändringar sparas" : "Intern arbetsyta · pilotversion"}</p></div></aside>
    <button class="mobile-scrim" id="scrim" aria-label="Stäng navigering"></button>
    <div class="main-column"><header class="topbar"><div class="breadcrumbs"><button class="mobile-menu" id="menu-toggle" aria-label="Öppna navigering" aria-expanded="false" aria-controls="sidebar">${icon("menu")}</button><span>Content Online</span><span>/</span><strong id="breadcrumb">Överblick</strong></div><div class="top-actions"><span class="pill dot ${demo ? "blue" : "green"}">${demo ? "VISNINGSDEMO" : "INTERN ADMIN"}</span><span id="account-email"></span>${demo ? html`<a class="avatar" href="/admin/login" aria-label="Till intern inloggning">CO</a>` : html`<button class="button quiet" id="sign-out">Logga ut</button>`}</div></header>
    <section id="access-message" class="access-message"><h1>Din arbetsyta</h1><p id="message" role="status">${demo ? "Laddar visningsdemon…" : "Kontrollerar din inloggning…"}</p><a class="button secondary" href="/admin/login">Till inloggningen</a></section>
    <main class="page" id="workspace" hidden><div class="page-heading"><div><div class="eyebrow" id="view-eyebrow">CONTENT ONLINE / ÖVERBLICK</div><h1 id="view-title">En samlad bild. Bättre kunddialog.</h1><p class="lead" id="view-description"></p></div><span class="date-chip">${icon("calendar")} Pilot · september 2026</span></div>
    <div class="banner">${icon("info")}<span><strong>${demo ? "Interaktiv visningsdemo." : "Intern administration & separat statistikdemo."}</strong> ${demo ? "Inga ändringar sparas och inga externa system är anslutna." : "Kund- och publicistregistret sparas i databasen. Statistik, produkter och portalanvändare nedan är fortsatt syntetiska exempel."}</span></div>
    <div class="toolbar" id="toolbar" hidden><label class="search">${icon("search")}<input id="search" type="search" placeholder="Sök i den här vyn…" aria-label="Sök i aktuell vy"></label><small>Syntetiskt presentationsunderlag</small></div>
    ${!demo ? html`<section id="registry-panel" class="card" hidden aria-label="Sparat register"><div class="card-body" id="registry-body"></div></section>` : ""}<div id="view" aria-live="polite"></div><p class="footnote">Content Online · Forskning, standarder och kunskap i samma arbetsyta.</p></main></div></div>
    <dialog class="dialog" id="detail-dialog" aria-labelledby="detail-title"><div class="dialog-head"><div><div class="eyebrow" id="detail-subtitle"></div><h2 id="detail-title"></h2></div><button class="close-button" data-action="close" aria-label="Stäng detaljer">${icon("close")}</button></div><div class="dialog-body" id="detail-body"></div></dialog>` : html`
    <div class="auth-shell"><section class="auth-showcase" aria-label="Content Online">
    <video class="auth-showcase-video" id="auth-background-video" autoplay muted loop playsinline preload="metadata" aria-hidden="true"><source src="/admin/assets/home-video.webm" type="video/webm"></video>
    <div class="auth-showcase-inner"><a class="auth-logo-stage" href="/" aria-label="Till Content Online"><span class="auth-logo-reveal"><img class="auth-logo-image" src="/admin/assets/co-logo.png" alt="Content Online" width="1254" height="1254"></span><span class="auth-orbit-cover" aria-hidden="true"></span><span class="auth-orbit" aria-hidden="true"><span class="auth-orbit-dot"></span></span></a><p class="auth-tagline">KNOWLEDGE. CONNECTED.</p></div></section>
    <main class="auth-main"><header class="auth-main-header"><span class="pill">INTERN ÅTKOMST</span><a href="/demo">Se visningsdemon →</a></header>
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
