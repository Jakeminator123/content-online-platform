import type { Registry, RegistryCustomer } from "../admin/registry.js";
import { demoWorkspace } from "../admin/demo-data.js";
import { customerAgentPolicy, type DidAgentConfiguration } from "./agent.js";
import {
  buildPortalInsights,
  renderConfigurationPanel,
  renderInsightsPanel,
  renderOverviewMetrics,
} from "./insights.js";
export type CustomerPortalPage = "portal" | "login";
export type CustomerPortalRenderOptions = {
  basePath: string;
  contextUrl: string;
  page: CustomerPortalPage;
  didAgent: DidAgentConfiguration | null;
  customerAuth?: { host: string; publishableKey: string };
};

const CUSTOMER_LOGIN_URL = "https://content-online-platform.vercel.app/login";
const PORTAL_SECTIONS = [
  { id: "overview", label: "Överblick" },
  { id: "products", label: "Produkter" },
  { id: "usage", label: "Analys" },
  { id: "documents", label: "Rapporter" },
  { id: "configuration", label: "Konfiguration" },
  { id: "service", label: "Support" },
] as const;

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function initials(name: string): string {
  const parts = name.normalize("NFKD").replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts.slice(0, 2).map((part) => part[0]).join("") : parts[0]?.slice(0, 3) || "CO").toUpperCase();
}

function contrastText(hex: string): string {
  const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((value) => Number.parseInt(value, 16) / 255);
  const [red, green, blue] = channels.map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = (red ?? 0) * 0.2126 + (green ?? 0) * 0.7152 + (blue ?? 0) * 0.0722;
  return luminance > 0.179 ? "#000000" : "#ffffff";
}

function formatNumber(value: number): string {
  return value.toLocaleString("sv-SE");
}

function customerMark(customer: RegistryCustomer): string {
  return customer.site.logoUrl
    ? `<span class="customer-mark"><img src="${escapeHtml(customer.site.logoUrl)}" alt="${escapeHtml(customer.name)} logotyp" referrerpolicy="no-referrer"></span>`
    : `<span class="customer-mark" aria-hidden="true">${escapeHtml(initials(customer.name))}</span>`;
}

function icon(name: "overview" | "products" | "usage" | "documents" | "configuration" | "service" | "arrow" | "check"): string {
  const path = {
    overview: '<path d="M4 5h16M4 12h10M4 19h7"/><circle cx="18" cy="12" r="2"/><circle cx="15" cy="19" r="2"/>',
    products: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z"/><path d="M8 4v13a3 3 0 0 0 3 3M9 9h6"/>',
    usage: '<path d="M4 19V9m5 10V5m5 14v-7m5 7V3"/>',
    documents: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6m-6 4h6"/>',
    configuration: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.37a1.7 1.7 0 0 0-1 .63 1.7 1.7 0 0 0-.37 1v.09h-4V21a1.7 1.7 0 0 0-1.1-1.63 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.16 15a1.7 1.7 0 0 0-.63-1 1.7 1.7 0 0 0-1-.37h-.09v-4h.09A1.7 1.7 0 0 0 4.16 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.53 3a1.7 1.7 0 0 0 1-.63 1.7 1.7 0 0 0 .37-1V1.3h4v.09a1.7 1.7 0 0 0 1.1 1.63 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 8a1.7 1.7 0 0 0 .63 1 1.7 1.7 0 0 0 1 .37h.09v4H21a1.7 1.7 0 0 0-1.6 1.1Z"/>',
    service: '<path d="M4 12a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2h-2v-6h4M4 13h4v6H6a2 2 0 0 1-2-2z"/><path d="M14 21h2"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
  }[name];
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function didEmbed(agent: DidAgentConfiguration | null): string {
  if (!agent) return "";
  return `<script type="module" src="https://agent.d-id.com/v2/index.js" data-mode="fabio" data-client-key="${escapeHtml(agent.clientKey)}" data-agent-id="${escapeHtml(agent.agentId)}" data-name="did-agent" data-monitor="true" data-orientation="horizontal" data-position="right" data-open-mode="compact" data-show-agent-name="false" data-show-restart-button="false"></script>`;
}

function demoPortfolio(customer: RegistryCustomer, registry: Registry) {
  if (customer.kind !== "demo") return [];
  const configuredCustomer = demoWorkspace.customers.find((item) => item.id === customer.id);
  const productIds = new Set(configuredCustomer?.productIds ?? []);
  const registryPublishers = new Set(customer.publisherIds);
  return demoWorkspace.products
    .filter((product) => productIds.size > 0 ? productIds.has(product.id) : registryPublishers.has(product.publisherId))
    .map((product) => ({
      id: product.id,
      name: product.name,
      type: product.type,
      publisher: registry.publishers.find((publisher) => publisher.id === product.publisherId)?.name
        ?? demoWorkspace.publishers.find((publisher) => publisher.id === product.publisherId)?.name
        ?? product.publisherId,
      usage: product.usage,
    }));
}

export function customerPortalContext(customer: RegistryCustomer, registry: Registry) {
  const products = demoPortfolio(customer, registry);
  const policy = customerAgentPolicy(customer);
  return {
    schemaVersion: "content-online-agent-context/v1",
    portal: {
      customer: customer.name,
      slug: customer.slug,
      sections: PORTAL_SECTIONS.map(({ id }) => id),
      dataMode: customer.kind === "demo" ? "synthetic_demo" : "authentication_required",
    },
    assistant: policy,
    portfolio: customer.kind === "demo"
      ? { status: "synthetic_demo", items: products.map(({ usage: _usage, ...product }) => product) }
      : { status: "authentication_required", message: "Logga in med ett aktiverat kundkonto för att läsa kundens portfölj." },
    usage: customer.kind === "demo"
      ? {
          status: "synthetic_demo",
          metric: "syntetisk produktanvändning",
          period: demoWorkspace.provenance.period,
          value: products.reduce((sum, product) => sum + product.usage, 0),
          items: products.map(({ id, name, publisher, usage }) => ({ id, name, publisher, value: usage })),
          warning: "Exempelvärdet är inte live-statistik och får inte beskrivas som ett verifierat kundutfall.",
        }
      : { status: "authentication_required", message: "Ingen kundstatistik lämnas från en publik portaladress." },
  };
}

function rankedUsage(customer: RegistryCustomer, registry: Registry, limit = 5): string {
  const products = [...demoPortfolio(customer, registry)].sort((left, right) => right.usage - left.usage).slice(0, limit);
  if (!products.length) return lockedState("Analys öppnas när medlemskap och datakällor är aktiverade.");
  const max = Math.max(...products.map((product) => product.usage), 1);
  return `<div class="ranked-chart" role="list" aria-label="Syntetisk användning per produkt">${products.map((product) => `<div class="ranked-row" role="listitem"><div class="ranked-label"><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.publisher)}</small></span><b>${escapeHtml(formatNumber(product.usage))}</b></div><div class="ranked-track"><span style="--bar-size:${Math.max(4, Math.round(product.usage / max * 100))}%"></span></div></div>`).join("")}</div>`;
}

function productRows(customer: RegistryCustomer, registry: Registry): string {
  const products = demoPortfolio(customer, registry);
  if (!products.length) return lockedState("Produkter visas efter verifierad tilldelning.");
  return `<div class="product-list">${products.map((product) => `<article class="product-row"><span class="resource-mark">${escapeHtml(initials(product.publisher))}</span><div><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.publisher)} · ${escapeHtml(product.type)}</small></div><span class="row-value">${escapeHtml(formatNumber(product.usage))}<small>demo</small></span></article>`).join("")}</div>`;
}

function lockedState(message: string): string {
  return `<div class="locked-state"><span class="lock-mark">${icon("check")}</span><div><strong>Skyddad kundyta</strong><p>${escapeHtml(message)}</p></div></div>`;
}

function customerLoginUrl(customer: RegistryCustomer): string {
  return `${CUSTOMER_LOGIN_URL}?portal=${encodeURIComponent(customer.slug)}`;
}

function activationOverview(customer: RegistryCustomer): string {
  return `<section class="activation-card" aria-label="Aktiveringsstatus" data-locked-only><div><span class="section-kicker">PORTALEN ÄR PUBLICERAD</span><h2>Inga kunduppgifter visas utan ett verifierat medlemskap.</h2><p>Fortsätt via Content Onlines kundinloggning när organisationens identitet är aktiverad.</p></div><a class="button primary" href="${escapeHtml(customerLoginUrl(customer))}">Till kundinloggningen ${icon("arrow")}</a></section><section class="activation-card authenticated-state" aria-label="Verifierad kundåtkomst" data-authenticated-only hidden><div><span class="section-kicker">MEDLEMSKAP VERIFIERAT</span><h2>Ni är inne i kundportalen för ${escapeHtml(customer.name)}.</h2><p>Portalen är aktiverad. Produkter, analys och rapporter fylls på först när respektive källa har verifierats.</p></div><span class="status-chip">Säker åtkomst</span></section>`;
}

function reports(customer: RegistryCustomer, registry: Registry): string {
  if (customer.kind !== "demo") return lockedState("Rapporter blir synliga först efter inloggning och verifierad källa.");
  const products = demoPortfolio(customer, registry);
  const rows = [
    ["Användningsöversikt", "Jan–aug 2026", "Demo"],
    ["Produktportfölj", `${products.length} tilldelade produkter`, "Förhandsvisning"],
    ["Källstatus", "Ingen verifierad import", "Ej ansluten"],
  ];
  return `<div class="report-list">${rows.map(([name, detail, status]) => `<article class="report-row"><span class="report-icon">${icon("documents")}</span><div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(detail)}</small></div><span class="status-label">${escapeHtml(status)}</span></article>`).join("")}</div><p class="source-line"><span data-report-cadence>Månadsvis sammanställning</span> · exempelvy utan genererade rapportfiler.</p>`;
}

function portalPage(customer: RegistryCustomer, registry: Registry, options: CustomerPortalRenderOptions): string {
  const agentPolicy = customerAgentPolicy(customer);
  const products = demoPortfolio(customer, registry);
  const base = options.basePath || "/";
  const login = options.basePath ? `${options.basePath}/login` : "/login";
  const isDemo = customer.kind === "demo";
  const insights = isDemo ? buildPortalInsights(products) : null;
  const config = {
    contextUrl: options.contextUrl,
    sections: PORTAL_SECTIONS,
    tools: options.didAgent ? customer.site.agent.tools : [],
    agentEnabled: Boolean(options.didAgent),
    insights,
  };
  const styles = `--portal-primary:${escapeHtml(customer.site.primaryColor)};--portal-accent:${escapeHtml(customer.site.accentColor)};--portal-on-primary:${contrastText(customer.site.primaryColor)}`;
  const customerAuthScripts = options.customerAuth
    ? `<script defer crossorigin="anonymous" data-clerk-publishable-key="${escapeHtml(options.customerAuth.publishableKey)}" src="https://${escapeHtml(options.customerAuth.host)}/npm/@clerk/clerk-js@6/dist/clerk.browser.js"></script><script defer src="/customer-portal/assets/session.js"></script>`
    : "";
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(customer.name)} · Content Online</title><meta name="description" content="${escapeHtml(customer.site.tagline)}"><meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/customer-portal/assets/style.css">${customerAuthScripts}</head><body data-preset="${escapeHtml(customer.site.preset)}" data-data-mode="${isDemo ? "demo" : "locked"}" data-portal-access="${isDemo ? "demo" : "locked"}" data-customer-slug="${escapeHtml(customer.slug)}" data-agent-enabled="${options.didAgent ? "true" : "false"}" style="${styles}">
  <div class="portal-shell"><aside class="portal-sidebar" id="portal-sidebar"><a class="co-brand" href="${escapeHtml(base)}"><span class="co-mark"><img src="/admin/assets/co-logo.png" alt=""></span><span><strong>Content Online</strong><small>KNOWLEDGE. CONNECTED.</small></span></a><div class="customer-identity">${customerMark(customer)}<span><strong>${escapeHtml(customer.name)}</strong><small>Kundportal</small></span></div><nav class="portal-nav" aria-label="${escapeHtml(customer.name)} kundportal">${PORTAL_SECTIONS.map(({ id, label }, index) => `<button type="button" data-portal-nav="${id}" aria-current="${index === 0 ? "page" : "false"}">${icon(id)}<span>${label}</span></button>`).join("")}</nav><div class="sidebar-footer"><span class="data-dot"></span><span data-portal-access-status>${isDemo ? "Syntetisk demo" : "Inloggning krävs"}</span></div></aside><button class="mobile-scrim" id="portal-scrim" aria-label="Stäng navigering"></button>
  <div class="portal-main"><header class="portal-topbar"><div class="topbar-title"><button class="mobile-menu" id="portal-menu" type="button" aria-label="Öppna navigering" aria-expanded="false">☰</button><span>${escapeHtml(customer.name)}</span><span>/</span><strong id="portal-breadcrumb">Överblick</strong></div><div class="topbar-meta">${isDemo ? `<span class="period-label">Jan–aug 2026</span><span class="status-chip">Demo</span>` : `<a class="text-link" href="${escapeHtml(login)}" data-locked-only>Logga in ${icon("arrow")}</a><span class="status-chip" data-authenticated-only hidden>Verifierad</span>`}</div></header>
  <main class="portal-content"><section class="portal-section is-active" data-portal-section="overview" data-portal-label="Överblick"><header class="section-intro"><div><span class="section-kicker">${isDemo ? "SYNTETISK KUNDBILD" : "KUNDPORTAL"}</span><h1>${escapeHtml(customer.site.heading)}</h1><p>${escapeHtml(customer.site.tagline)}</p></div>${isDemo ? `<a class="button secondary" href="${escapeHtml(login)}">Om demon ${icon("arrow")}</a>` : ""}</header>${isDemo && insights ? `${renderOverviewMetrics(insights)}<div class="briefing-grid"><section class="surface wide"><div class="surface-head"><div><span class="section-kicker">PORTFÖLJENS ANVÄNDNING</span><h2>Produkter i fokus</h2></div><button class="text-button" type="button" data-open-section="usage">Öppna analys ${icon("arrow")}</button></div>${rankedUsage(customer, registry)}</section><aside class="surface evidence-card"><span class="section-kicker">DATASTATUS</span><strong>${products.length} av ${products.length}</strong><p>tilldelade demoprodukter visas</p><dl><div><dt>Källa</dt><dd>Syntetiskt underlag</dd></div><div><dt>Period</dt><dd>Jan–aug 2026</dd></div><div><dt>Liveimport</dt><dd>Inte ansluten</dd></div></dl></aside></div>` : activationOverview(customer)}</section>
  <section class="portal-section" data-portal-section="products" data-portal-label="Produkter" hidden><header class="section-intro compact"><div><span class="section-kicker">PORTFÖLJ</span><h1>Era produkter</h1><p>${isDemo ? `${products.length} tilldelningar i den syntetiska KTH-demon.` : "Tilldelningar visas efter säker inloggning."}</p></div></header><section class="surface"><div class="surface-head"><h2>Informationsprodukter</h2>${isDemo ? `<span class="status-chip">${products.length} produkter</span>` : ""}</div>${productRows(customer, registry)}</section></section>
  <section class="portal-section" data-portal-section="usage" data-portal-label="Analys" hidden><header class="section-intro compact"><div><span class="section-kicker">ANALYS</span><h1>Användning och beteende</h1><p>${isDemo ? "Utforska produktanvändning och en separat, tydligt märkt demo av portaltelemetri." : "Analysen kräver verifierade, tenant-avgränsade källor."}</p></div></header>${insights ? renderInsightsPanel(insights) : lockedState("Analys öppnas när medlemskap och datakällor är aktiverade.")}</section>
  <section class="portal-section" data-portal-section="documents" data-portal-label="Rapporter" hidden><header class="section-intro compact"><div><span class="section-kicker">RAPPORTFLÖDE</span><h1>Rapporter</h1><p>${isDemo ? "En avskalad förhandsvisning av kommande rapportvyer." : "Rapporter publiceras här när källa och åtkomst är verifierade."}</p></div></header><section class="surface"><div class="surface-head"><h2>Rapportöversikt</h2></div>${reports(customer, registry)}</section></section>
  <section class="portal-section" data-portal-section="configuration" data-portal-label="Konfiguration" hidden><header class="section-intro compact"><div><span class="section-kicker">KONFIGURATION</span><h1>Portal och ärenden</h1>${isDemo ? "<p>Anpassa demovyn och förhandsvisa en spårbar begäran till Content Online.</p>" : '<p data-locked-only>Inställningar och ärenden kräver verifierat medlemskap.</p><p data-authenticated-only hidden>Medlemskapet är verifierat. Tillgängliga funktioner öppnas när de har aktiverats för kundportalen.</p>'}</div></header>${renderConfigurationPanel(isDemo)}</section>
  <section class="portal-section" data-portal-section="service" data-portal-label="Support" hidden><header class="section-intro compact"><div><span class="section-kicker">SUPPORT</span><h1>Hjälp i kundportalen</h1><p>Frågor om produkter, användning och rapporter samlas på ett ställe.</p></div></header><div class="support-grid"><section class="surface assistant-brief"><div class="assistant-mark" aria-hidden="true">CO</div><div><span class="section-kicker">CONTENT ONLINE AI</span><h2>${escapeHtml(customer.site.agent.greeting)}</h2><p>${options.didAgent ? "Öppna videochatten nere till höger. Agenten får bara läsa portalens tillåtna kundkontext." : "AI-assistenten aktiveras när kundens domän och agentkonfiguration är klara."}</p><span class="connection-state" id="assistant-status"><span></span>${options.didAgent ? "Redo att ansluta" : "Inte aktiverad"}</span></div></section><section class="surface support-note"><span class="section-kicker">SVARSPOLICY</span><h2>Saklig även när tonen är positiv</h2><p>${escapeHtml(agentPolicy.tone)}. Agenten får aldrig dölja kostnader, nedgångar eller osäkerhet.</p></section></div></section><div id="portal-live-status" class="sr-only" aria-live="polite"></div></main></div></div>
  <script type="application/json" id="portal-config">${safeJson(config)}</script><script defer src="/customer-portal/assets/client.js"></script>${didEmbed(options.didAgent)}</body></html>`;
}

function loginPage(customer: RegistryCustomer, options: CustomerPortalRenderOptions): string {
  const base = options.basePath || "/";
  const isDemo = customer.kind === "demo";
  const config = {
    contextUrl: options.contextUrl,
    sections: PORTAL_SECTIONS,
    tools: [],
    agentEnabled: false,
  };
  const styles = `--portal-primary:${escapeHtml(customer.site.primaryColor)};--portal-accent:${escapeHtml(customer.site.accentColor)};--portal-on-primary:${contrastText(customer.site.primaryColor)}`;
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inloggning · ${escapeHtml(customer.name)}</title><meta name="description" content="Kundinloggning för ${escapeHtml(customer.name)}"><meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/customer-portal/assets/style.css"></head><body data-preset="${escapeHtml(customer.site.preset)}" data-data-mode="${isDemo ? "demo" : "locked"}" data-agent-enabled="false" style="${styles}"><div class="login-shell"><section class="login-brand"><a class="co-brand" href="${escapeHtml(base)}"><span class="co-mark"><img src="/admin/assets/co-logo.png" alt=""></span><span><strong>Content Online</strong><small>KNOWLEDGE. CONNECTED.</small></span></a><div class="login-identity">${customerMark(customer)}<span class="section-kicker">${escapeHtml(customer.name)}</span><h1>${escapeHtml(customer.site.heading)}</h1><p>${escapeHtml(customer.site.tagline)}</p></div><small>Kundportal · ${escapeHtml(customer.name)}</small></section><main class="login-panel"><section class="login-card"><span class="section-kicker">${isDemo ? "SYNTETISK PILOT" : "KUNDINLOGGNING"}</span><h2>${isDemo ? "Utforska demon" : `Fortsätt till ${escapeHtml(customer.name)}`}</h2><p>${isDemo ? "KTH-vyn innehåller enbart tydligt märkt presentationsdata." : "Kunduppgifter blir tillgängliga först när identitet och medlemskap har verifierats på servern."}</p><div class="login-actions">${isDemo ? `<a class="button primary" href="${escapeHtml(base)}">Öppna demon ${icon("arrow")}</a>` : `<a class="button primary" href="${escapeHtml(customerLoginUrl(customer))}">Till kundinloggningen ${icon("arrow")}</a><a class="button secondary" href="${escapeHtml(base)}">Tillbaka till portalen</a>`}</div><div class="trust-line"><span>${icon("check")}</span><p>Content Online-admin ger aldrig kundbehörighet.</p></div></section></main></div><script type="application/json" id="portal-config">${safeJson(config)}</script><script defer src="/customer-portal/assets/client.js"></script></body></html>`;
}

export function renderCustomerPortal(customer: RegistryCustomer, registry: Registry, options: CustomerPortalRenderOptions): string {
  return options.page === "login" ? loginPage(customer, options) : portalPage(customer, registry, options);
}
