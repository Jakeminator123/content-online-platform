import type { Registry, RegistryCustomer } from "../admin/registry.js";
import { demoWorkspace } from "../admin/demo-data.js";
import { customerAgentPolicy, type DidAgentConfiguration } from "./agent.js";

export type CustomerPortalPage = "portal" | "login";
export type CustomerPortalRenderOptions = {
  basePath: string;
  contextUrl: string;
  page: CustomerPortalPage;
  didAgent: DidAgentConfiguration | null;
};

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

function customerMark(customer: RegistryCustomer): string {
  return customer.site.logoUrl
    ? `<span class="customer-mark"><img src="${escapeHtml(customer.site.logoUrl)}" alt="${escapeHtml(customer.name)} logotyp" referrerpolicy="no-referrer"></span>`
    : `<span class="customer-mark" aria-hidden="true">${escapeHtml(initials(customer.name))}</span>`;
}

function didEmbed(agent: DidAgentConfiguration | null): string {
  if (!agent) return "";
  return `<script type="module" src="https://agent.d-id.com/v2/index.js" data-mode="fabio" data-client-key="${escapeHtml(agent.clientKey)}" data-agent-id="${escapeHtml(agent.agentId)}" data-name="did-agent" data-monitor="true" data-orientation="horizontal" data-position="right" data-open-mode="compact"></script>`;
}

function demoPortfolio(customer: RegistryCustomer, registry: Registry) {
  if (customer.kind !== "demo") return [];
  const publishers = new Set(customer.publisherIds);
  return demoWorkspace.products.filter((product) => publishers.has(product.publisherId)).slice(0, 4).map((product) => ({
    id: product.id,
    name: product.name,
    type: product.type,
    publisher: registry.publishers.find((publisher) => publisher.id === product.publisherId)?.name ?? product.publisherId,
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
      sections: ["overview", "products", "usage", "documents", "service"],
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
          warning: "Exempelvärdet är inte live-statistik och får inte beskrivas som ett verifierat kundutfall.",
        }
      : { status: "authentication_required", message: "Ingen kundstatistik lämnas från en publik portaladress." },
  };
}

function portalMetrics(customer: RegistryCustomer, registry: Registry): string {
  const products = demoPortfolio(customer, registry);
  const publishers = new Set(products.map((product) => product.publisher));
  const totalUsage = products.reduce((sum, product) => sum + product.usage, 0);
  const values = customer.kind === "demo"
    ? [
        [totalUsage.toLocaleString("sv-SE"), "Användning i år · demo", "Syntetiskt produktmått, inte live-data"],
        [String(products.length), "Informationsprodukter", "Tilldelade i pilotens exempeldata"],
        [String(publishers.size), "Publicister", "Kopplade till demokonfigurationen"],
        ["Ej verifierat", "Ekonomisk nytta", "Ingen effekt eller besparing antas"],
      ]
    : [
        ["Väntar", "Användningsdata", "Kräver kundkonto och verifierad källa"],
        ["0", "Publicerade produkter", "Content Online styr tilldelningen"],
        ["Inte aktiv", "Dokumentyta", "Öppnas efter behörighetskoppling"],
        ["Skyddad", "Kundstatistik", "Visas aldrig på publik portaladress"],
      ];
  return values.map(([value, label, description]) => `<article class="metric"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong><p>${escapeHtml(description)}</p></article>`).join("");
}

function resources(customer: RegistryCustomer, registry: Registry): string {
  const products = demoPortfolio(customer, registry);
  if (!products.length) return `<div class="empty"><div><strong>Inga informationsprodukter är publicerade ännu.</strong><p>Content Online lägger till kundens egna tilldelningar efter verifierad kund- och licenskoppling.</p></div></div>`;
  return `<div class="resource-list">${products.map((product) => `<div class="resource-row"><span class="resource-mark">${escapeHtml(initials(product.publisher))}</span><span><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.publisher)} · ${escapeHtml(product.type)}</small></span><span class="pill">Syntetisk demo</span></div>`).join("")}</div>`;
}

function usage(customer: RegistryCustomer, registry: Registry): string {
  const products = demoPortfolio(customer, registry);
  if (!products.length) return `<div class="empty"><div><strong>Ingen användningsdata är tillgänglig.</strong><p>Diagram och slutsatser visas först när en autentiserad användare har tillgång till verifierade, tenant-avgränsade data.</p></div></div>`;
  const values = [32, 48, 61, 56, 68, 44, 27, 53];
  return `<div class="chart" aria-label="Syntetiskt stapeldiagram">${values.map((value) => `<span class="bar" style="height:${value}%"></span>`).join("")}</div><p class="source">Källa: syntetiskt presentationsunderlag · ${escapeHtml(demoWorkspace.provenance.period)}. Diagrammet är inte live-statistik.</p>`;
}

function portalPage(customer: RegistryCustomer, registry: Registry, options: CustomerPortalRenderOptions): string {
  const agentPolicy = customerAgentPolicy(customer);
  const config = {
    contextUrl: options.contextUrl,
    tools: options.didAgent ? customer.site.agent.tools : [],
    agentEnabled: Boolean(options.didAgent),
  };
  const base = options.basePath || "/";
  const login = options.basePath ? `${options.basePath}/login` : "/login";
  const previewLabel = customer.kind === "demo" ? "Syntetisk pilot" : "Kundportal · aktivering pågår";
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(customer.name)} · Content Online</title><meta name="description" content="${escapeHtml(customer.site.tagline)}"><meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/customer-portal/assets/style.css"></head><body data-preset="${escapeHtml(customer.site.preset)}" style="--portal-primary:${escapeHtml(customer.site.primaryColor)};--portal-accent:${escapeHtml(customer.site.accentColor)}">
  <div class="portal-shell"><aside class="portal-sidebar" id="portal-sidebar"><a class="co-brand" href="${escapeHtml(base)}"><span class="co-mark"><img src="/admin/assets/co-logo.png" alt=""></span><span><strong>Content Online</strong><small>KNOWLEDGE. CONNECTED.</small></span></a><div class="customer-card">${customerMark(customer)}<span><strong>${escapeHtml(customer.name)}</strong><small>Egen kundyta</small></span></div><span class="nav-label">ER ARBETSYTA</span><nav class="portal-nav" aria-label="${escapeHtml(customer.name)} kundportal">${[["overview","Överblick"],["products","Informationsprodukter"],["usage","Användning"],["documents","Dokument"],["service","Kundservice"]].map(([id,label], index) => `<button type="button" data-portal-nav="${id}" aria-current="${index === 0 ? "page" : "false"}"><span class="nav-dot"></span>${label}</button>`).join("")}</nav><div class="sidebar-note"><strong>Content Online AI</strong><p>${options.didAgent ? "D-ID-agenten är kopplad till just denna kundportal. Den får bara använda förberedda, tillåtna verktyg." : "Kundens agent aktiveras när agent-ID, domänbegränsad client key och D-ID-verktyg är klara."}</p></div><span class="sidebar-foot">${escapeHtml(customer.site.domain || `/portal/${customer.slug}`)} · levererad av Content Online</span></aside><button class="mobile-scrim" id="portal-scrim" aria-label="Stäng navigering"></button>
  <div class="portal-main"><header class="portal-topbar"><div style="display:flex;align-items:center;gap:12px"><button class="mobile-menu" id="portal-menu" type="button" aria-label="Öppna navigering" aria-expanded="false">☰</button><span class="breadcrumbs">Kundportal / <strong>${escapeHtml(customer.name)}</strong></span></div><span class="status-chip">${escapeHtml(previewLabel)}</span></header><main class="portal-content"><div class="notice"><strong>${customer.kind === "demo" ? "DEMO · SYNTETISKA EXEMPEL" : "SÄKER AKTIVERING"}</strong> ${customer.kind === "demo" ? "Inga siffror på denna sida är verklig KTH-statistik eller ett verifierat ekonomiskt utfall." : "Den publika adressen visar varumärke och struktur. Kunddata kräver ett aktiverat medlemskap."}</div>
  <section class="hero" data-portal-section="overview" data-portal-label="Överblick"><div><p class="eyebrow">${escapeHtml(customer.name.toUpperCase())} / ER ÖVERBLICK</p><h1>${escapeHtml(customer.site.heading)}</h1><p>${escapeHtml(customer.site.tagline)}</p></div><a class="hero-action" href="${escapeHtml(login)}">${customer.kind === "demo" ? "Om pilotinloggningen" : "Se aktiveringsstatus"} →</a></section><section class="metrics">${portalMetrics(customer, registry)}</section>
  <div class="portal-grid"><section class="panel" data-portal-section="products" data-portal-label="Informationsprodukter"><div class="panel-head"><div><p class="eyebrow">PORTFÖLJ</p><h2>Era informationsprodukter</h2></div><span class="pill">${customer.kind === "demo" ? "Pilotdata" : "Tenant-avgränsad"}</span></div><p>Content Online styr vilka publicister och produkter som syns för organisationen. Tilldelning i portalen ändrar aldrig ett externt avtal automatiskt.</p>${resources(customer, registry)}</section>
  <section class="panel" data-portal-section="usage" data-portal-label="Användning"><div class="panel-head"><div><p class="eyebrow">ANVÄNDNING</p><h2>Insikter utan låtsassiffror</h2></div><span class="pill">Källa & period krävs</span></div><p>Agenten och portalen ska alltid ange källa, period, täckning och om värdet är demo eller verifierat.</p>${usage(customer, registry)}</section>
  <section class="panel" data-portal-section="documents" data-portal-label="Dokument"><div class="panel-head"><div><p class="eyebrow">DOKUMENT</p><h2>Organisationens underlag</h2></div><span class="pill">Inte aktiverat</span></div><div class="resource-list">${["Avtal och licenser","Rapporter och beslutsunderlag","Publicerad kundinformation"].map((label) => `<div class="resource-row"><span class="resource-mark">↗</span><span><strong>${label}</strong><small>Synlighet styrs av kundroll och tenant</small></span></div>`).join("")}</div></section>
  <section class="panel" data-portal-section="service" data-portal-label="Kundservice"><div class="panel-head"><div><p class="eyebrow">KUNDSERVICE</p><h2>Från fråga till uppföljning</h2></div><span class="pill">Content Online</span></div><p>Här samlas ärenden, förnyelser och kontaktvägar när kundkontona har aktiverats. Inga fria agentkommandon eller godtyckliga DOM-klick tillåts.</p><div class="empty"><div><strong>Ärendeflödet väntar på kundinloggning.</strong><p>En portalmedlem får bara läsa och skapa ärenden inom sin egen organisation.</p></div></div></section>
  <section class="panel agent-card"><div><p class="eyebrow" style="color:#8dd5c5">D-ID · KUNDENS AGENT</p><h2>${escapeHtml(customer.site.agent.greeting)}</h2><p>Tonalitet: ${escapeHtml(agentPolicy.tone)}. Positivitetsnivån påverkar formuleringen, aldrig vilka siffror, kostnader, nedgångar eller osäkerheter som redovisas.</p></div><div class="agent-badge" aria-hidden="true">AI</div></section></div></main></div></div>
  <script type="application/json" id="portal-config">${safeJson(config)}</script><script defer src="/customer-portal/assets/client.js"></script>${didEmbed(options.didAgent)}</body></html>`;
}

function loginPage(customer: RegistryCustomer, options: CustomerPortalRenderOptions): string {
  const base = options.basePath || "/";
  const status = customer.kind === "demo" ? "Syntetisk visningsmiljö" : "Kundkonton inväntar aktivering";
  const description = customer.kind === "demo"
    ? "Den här piloten använder endast syntetiska KTH-exempel. Den är inte ansluten till verkliga konton, avtal eller användningsdata."
    : "Portaladressen är skapad. Content Online behöver koppla identitet, medlemskap och datakällor innan riktiga kunduppgifter kan visas.";
  const config = { contextUrl: options.contextUrl, tools: options.didAgent ? customer.site.agent.tools : [], agentEnabled: Boolean(options.didAgent) };
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aktivering · ${escapeHtml(customer.name)}</title><meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/customer-portal/assets/style.css"></head><body data-preset="${escapeHtml(customer.site.preset)}" style="--portal-primary:${escapeHtml(customer.site.primaryColor)};--portal-accent:${escapeHtml(customer.site.accentColor)}"><div class="login-shell"><section class="login-brand"><a class="co-brand" href="${escapeHtml(base)}"><span class="co-mark"><img src="/admin/assets/co-logo.png" alt=""></span><span><strong>Content Online</strong><small>KNOWLEDGE. CONNECTED.</small></span></a><div>${customerMark(customer)}<h1>${escapeHtml(customer.site.heading)}</h1><p>${escapeHtml(customer.site.tagline)}</p></div><small>${escapeHtml(customer.name)} · egen kundportal</small></section><main class="login-panel"><section class="login-card"><p class="eyebrow">CONTENT ONLINE · KUNDPORTAL</p><h2>${escapeHtml(status)}</h2><p>${escapeHtml(description)}</p><div class="login-facts"><span><strong>Separat kundyta:</strong> ${escapeHtml(customer.name)}</span><span><strong>Statistik:</strong> ${customer.kind === "demo" ? "endast uttryckligt märkt demo" : "kräver autentiserad tenant"}</span><span><strong>Content Online-admin:</strong> ger aldrig kundbehörighet</span></div><a class="hero-action" href="${escapeHtml(base)}">${customer.kind === "demo" ? "Öppna syntetisk pilot" : "Förhandsvisa portalens struktur"} →</a><p>Riktig inloggning aktiveras först när kundens identitetsleverantör och medlemskap är serververifierade.</p></section></main></div><script type="application/json" id="portal-config">${safeJson(config)}</script><script defer src="/customer-portal/assets/client.js"></script>${didEmbed(options.didAgent)}</body></html>`;
}

export function renderCustomerPortal(customer: RegistryCustomer, registry: Registry, options: CustomerPortalRenderOptions): string {
  return options.page === "login" ? loginPage(customer, options) : portalPage(customer, registry, options);
}
