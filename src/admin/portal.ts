import { Hono } from "hono";
import { Buffer } from "node:buffer";
import { html } from "hono/html";
import { secureHeaders } from "hono/secure-headers";
import { CUSTOMER_PORTAL, PLATFORM_ORIGIN } from "./identity.js";
import type { AdminAuthenticator, AdminConfig } from "./identity.js";

const adminWorkspace = {
  status: "synthetic_configuration",
  generatedAt: "2026-09-05",
  customers: [
    { id: "customer-kth-demo", name: "KTH", users: 2, products: 4, status: "Pilot · syntetisk data" },
  ],
  publishers: [
    { id: "publisher-ieee", name: "IEEE", route: "MPS / MPS Insight", status: "Inte ansluten" },
    { id: "publisher-springer", name: "Springer Nature", route: "Källspecifik anslutning", status: "Inte kartlagd" },
    { id: "publisher-elsevier", name: "Elsevier", route: "Källspecifik anslutning", status: "Inte kartlagd" },
  ],
  assignments: [
    { customer: "KTH", publisher: "IEEE", product: "IEEE Xplore", status: "Demo-tilldelning" },
    { customer: "KTH", publisher: "Springer Nature", product: "SpringerLink", status: "Demo-tilldelning" },
    { customer: "KTH", publisher: "Elsevier", product: "ScienceDirect", status: "Demo-tilldelning" },
  ],
  connections: [
    { name: "MPS / MPS Insight", owner: "IEEE", mode: "Källspecifik", status: "Inte ansluten", lastImport: null },
    { name: "Övriga publicister", owner: "Flera", mode: "API, fil eller manuell källa", status: "Ej kartlagda", lastImport: null },
    { name: "Salesforce", owner: "Content Online", mode: "Framtida datakälla", status: "Inte ansluten", lastImport: null },
    { name: "Fortnox", owner: "Content Online", mode: "Framtida datakälla", status: "Inte ansluten", lastImport: null },
  ],
  storage: { status: "blocked_by_decision", label: "Beständig lagring saknas – skrivfunktioner är avstängda" },
} as const;

export function clerkFrontendHost(key: string): string | null {
  if (!/^pk_(test|live)_[A-Za-z0-9+/=]+$/.test(key)) return null;
  const decoded = Buffer.from(key.slice(8), "base64").toString("utf8");
  if (!decoded.endsWith("$")) return null;
  const host = decoded.slice(0, -1);
  return /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])$/.test(host) && host.includes(".") ? host : null;
}

export function createAdminPortal(authenticator: AdminAuthenticator, config: AdminConfig) {
  const app = new Hono();
  const host = clerkFrontendHost(config.publishableKey);
  const configured = !!(host && config.secretKey && config.allowedEmail);
  app.use("*", secureHeaders());
  app.use("*", async (c, next) => {
    await next();
    c.header("cache-control", "no-store");
    c.header("x-robots-tag", "noindex, nofollow");
    c.header("referrer-policy", "no-referrer");
  });

  app.get("/", (c) => c.html(page("start", host, config.publishableKey, configured)));
  app.get("/kundportal", (c) => c.redirect(`${CUSTOMER_PORTAL}/login`, 302));
  app.get("/content-online", (c) => c.redirect("/admin", 302));
  app.get("/content-online/login", (c) => c.redirect("/admin/login", 302));
  app.get("/admin/login", (c) => c.html(page("login", host, config.publishableKey, configured)));
  app.get("/admin/registrera", (c) => c.html(page("register", host, config.publishableKey, configured)));
  // Public HTML contains no user/customer data. All identity and admin data comes from guarded APIs.
  app.get("/admin", (c) => c.html(page("admin", host, config.publishableKey, configured)));

  app.use("/admin/api/*", async (c, next) => {
    try {
      const auth = await authenticator.authenticate(c.req.raw);
      if (auth.status !== "authenticated") {
        const status = auth.status === "unconfigured" ? 503 : auth.status === "forbidden" ? 403 : 401;
        return c.json({ error: auth.status }, status);
      }
      if (c.req.path === "/admin/api/session" && c.req.method === "GET") {
        return c.json({
          admin: auth.identity,
          authentication: config.publishableKey.startsWith("pk_live_") ? "production" : "development_instance",
          customerPortalUrl: `${CUSTOMER_PORTAL}/login`,
          administration: { users: "read_only_demo", publishers: "read_only_demo", customerAssignments: "read_only_demo" },
        });
      }
      if (c.req.path === "/admin/api/workspace" && c.req.method === "GET") {
        return c.json(adminWorkspace);
      }
      await next();
    } catch {
      // Do not log tokens, email addresses or provider error payloads.
      return c.json({ error: "authentication_temporarily_unavailable" }, 503);
    }
  });
  app.all("/admin/api/*", (c) => c.json({ error: "not_found" }, 404));
  return app;
}

function page(mode: "start" | "login" | "register" | "admin", host: string | null, key: string, configured: boolean) {
  return html`<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="description" content="Content Onlines plattform med separata ingångar för kunder och intern administration.">
    <title>${mode === "start" ? "Välj portal" : "Administration"} · Content Online</title>
    <style>
      :root{font-family:Inter,Arial,sans-serif;color:#10243a;background:#f4f7fa;color-scheme:light}*{box-sizing:border-box}body{margin:0}a{color:#135b8a}a:focus-visible,button:focus-visible{outline:3px solid #d59b00;outline-offset:4px}header{background:#0c263d;color:white;padding:20px 6vw;display:flex;justify-content:space-between;align-items:center;gap:20px}header a{color:white;text-decoration:none}.brand{font-size:21px;font-weight:750;letter-spacing:-.5px}.brand span{font-weight:400;color:#a9d7ef}main{max-width:1180px;margin:0 auto;padding:48px 24px}h1{font-size:clamp(30px,4vw,46px);letter-spacing:-1.4px;margin:10px 0 14px}h2{font-size:20px;margin:0 0 10px}h3{font-size:15px;margin:0}p{font-size:15px;line-height:1.6;margin:0 0 18px}.eyebrow{text-transform:uppercase;letter-spacing:2px;font-size:12px;font-weight:800;color:#34759e}.lead{max-width:760px;color:#526477}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin:26px 0}.workspace-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:18px;margin:26px 0}.wide{grid-column:span 8}.narrow{grid-column:span 4}.full{grid-column:1/-1}.card{border:1px solid #d9e3ec;border-radius:14px;background:white;padding:25px;box-shadow:0 8px 28px #102c4609}.card p{color:#526477}.button,button{display:inline-block;border:0;border-radius:8px;background:#14608f;color:white;padding:12px 17px;font:700 15px Arial;text-decoration:none;cursor:pointer}.secondary{background:#e8f1f7;color:#174f7c}.small{font-size:13px;color:#607285}.notice{border-left:4px solid #d39419;background:#fff8e7;padding:15px 18px;margin:22px 0;font-size:14px;line-height:1.55}.auth{max-width:490px;margin:auto}.auth .card{padding:24px}#auth-widget{min-height:160px;display:flex;justify-content:center}#user-button{display:flex;justify-content:flex-end}.actions{display:flex;gap:15px;align-items:center;flex-wrap:wrap}.status,.pill{display:inline-block;border-radius:999px;background:#e9f2f7;color:#225a78;padding:5px 9px;font-size:12px;font-weight:750}.warning{background:#fff1cf;color:#76520b}.section-head{display:flex;justify-content:space-between;gap:16px;align-items:start;margin-bottom:18px}.metric{font-size:32px;font-weight:800;letter-spacing:-1px;color:#10243a}.muted{color:#657789}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;color:#657789;font-size:11px;text-transform:uppercase;letter-spacing:.08em}th,td{padding:12px 8px;border-bottom:1px solid #e8eef3;vertical-align:top}tr:last-child td{border-bottom:0}.table-wrap{overflow-x:auto}dl{margin:0}dt{font-weight:700;margin-top:14px}dd{margin:6px 0;line-height:1.6;overflow-wrap:anywhere}footer{max-width:1180px;margin:0 auto;padding:18px 24px 35px;border-top:1px solid #d9e1e9;font-size:13px;color:#607285}[hidden]{display:none!important}@media(max-width:800px){.wide,.narrow{grid-column:1/-1}}@media(max-width:660px){.grid{grid-template-columns:1fr}main{padding-top:30px}.card{padding:21px}header{padding:18px 22px}.brand{font-size:18px}.workspace-grid{display:block}.workspace-grid .card{margin-bottom:16px}}
    </style>
    ${configured && mode !== "start" && host ? html`
      <script defer crossorigin="anonymous" src="https://${host}/npm/@clerk/ui@1/dist/ui.browser.js"></script>
      <script defer crossorigin="anonymous" data-clerk-publishable-key="${key}" src="https://${host}/npm/@clerk/clerk-js@6/dist/clerk.browser.js"></script>` : ""}
    </head><body data-page="${mode}"><header><a class="brand" href="/">Content <span>Online</span></a><span>${mode === "start" ? "Kundplattform" : "Intern administration"}</span></header>
    <main>${mode === "start" ? html`
      <div class="eyebrow">Två separata arbetsytor</div><h1>Välkommen till Content Online</h1>
      <p class="lead">Välj kundportalen för din organisations resurser eller administrationen för Content Onlines personal.</p>
      <div class="grid"><section class="card"><h2>Kundportalen</h2><p>Resurser, användning och dokument för din organisation. KTH är vår testkund.</p><a class="button" href="/kundportal">Öppna kundportalen →</a><p class="small" style="margin-top:18px">Befintlig kundfrontend · separat inloggning · demodata</p></section>
      <section class="card"><h2>Content Online-admin</h2><p>Separat åtkomst för Content Onlines interna administration. Kundkonton ger inte adminbehörighet.</p><a class="button secondary" href="/admin/login">Logga in som Content Online →</a><p class="small" style="margin-top:18px">Hanteringen av kunder och publicister är under uppbyggnad.</p></section></div>` : mode === "admin" ? html`
      <div id="user-button"></div><div class="eyebrow">Content Online · intern arbetsyta</div><h1>Systemadministration</h1>
      <p id="message" role="status">${configured ? "Kontrollerar din inloggning…" : "Inloggningen är inte konfigurerad ännu."}</p>
      <section id="account" class="card" hidden><h2>Du är inloggad</h2><dl><dt>Konto</dt><dd id="account-email"></dd><dt>Behörighet</dt><dd>Content Online-administratör — inte kundadministratör på KTH.</dd></dl></section>
      <div id="workspace" hidden><p class="lead">Överblick över kundorganisationer, publicister, produkter och datakällor. Den här pilotvyn är skrivskyddad tills beständig lagring är beslutad.</p><div class="workspace-grid">
      <section class="card narrow"><div class="section-head"><h2>Kunder</h2><span class="pill">Pilot</span></div><div class="metric" id="customer-count">–</div><p>Kundorganisationer i den interna konfigurationen.</p></section>
      <section class="card narrow"><div class="section-head"><h2>Publicister</h2><span class="pill">Partners</span></div><div class="metric" id="publisher-count">–</div><p>Dataleverantörer – inte kundorganisationer.</p></section>
      <section class="card narrow"><div class="section-head"><h2>Lagring</h2><span class="pill warning">Beslut krävs</span></div><p id="storage-status">Kontrollerar…</p></section>
      <section class="card wide"><div class="section-head"><div><h2>Kundtilldelningar</h2><p>Många-till-många via produkter.</p></div><span class="pill">Syntetisk demo</span></div><div class="table-wrap"><table><thead><tr><th>Kund</th><th>Publicist</th><th>Produkt</th><th>Status</th></tr></thead><tbody id="assignments"></tbody></table></div></section>
      <section class="card narrow"><div class="section-head"><div><h2>Kundorganisationer</h2><p>Egen portal och egna roller.</p></div></div><div id="customers"></div></section>
      <section class="card full"><div class="section-head"><div><h2>Anslutningar och importer</h2><p>Varje källa hanteras efter sina verkliga förutsättningar; ingen gemensam standard antas.</p></div><span class="pill warning">Inga livekopplingar</span></div><div class="table-wrap"><table><thead><tr><th>Källa</th><th>Ägare</th><th>Metod</th><th>Senaste import</th><th>Status</th></tr></thead><tbody id="connections"></tbody></table></div></section></div>
      <div class="actions"><a class="button" href="/kundportal">Öppna kundportalen separat →</a><button class="secondary" id="sign-out">Logga ut</button></div><p class="notice">Kundportalen visar fortfarande demodata. Ingen Salesforce-, Fortnox- eller publicistdata är inkopplad här.</p></div>` : html`
      <div class="auth"><div class="eyebrow">Endast Content Onlines personal</div><h1>${mode === "register" ? "Aktivera ditt adminkonto" : "Logga in som admin"}</h1>
      <p class="lead">${mode === "register" ? "Använd den godkända e-postadressen och verifiera den för att aktivera ditt personliga konto." : "Den här inloggningen är separat från kundportalen. Endast godkända och verifierade konton får adminåtkomst."}</p>
      <p id="message" role="status">${configured ? "Laddar säker inloggning…" : "Inloggningen är inte konfigurerad ännu."}</p>
      ${configured ? html`<div id="auth-widget"></div><div class="actions" style="margin-top:24px"><a href="${mode === "register" ? "/admin/login" : "/admin/registrera"}">${mode === "register" ? "Har du redan ett konto? Logga in" : "Första gången? Aktivera ditt konto"}</a></div>` : ""}
      <p class="small" style="margin-top:24px"><a href="/kundportal">Är du kund? Till kundinloggningen →</a></p></div>`}
    ${mode !== "start" && !key.startsWith("pk_live_") ? html`<p class="notice">Pilotmiljö: inloggningen använder Clerks utvecklingsinstans. Använd inte verkliga kunduppgifter innan produktionsmiljön är färdig.</p>` : ""}
    <noscript><p class="notice">Aktivera JavaScript för att använda den säkra inloggningen.</p></noscript>
    </main><footer>Content Online · Kundadministratör och Content Online-administratör är skilda behörigheter.</footer>
    ${configured && mode !== "start" ? html`<script>
      window.addEventListener('load', async function () {
        var message = document.getElementById('message');
        var mode = document.body.dataset.page;
        try {
          await Clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor }, signInUrl: '/admin/login', signUpUrl: '/admin/registrera', signInForceRedirectUrl: '/admin', signUpForceRedirectUrl: '/admin' });
          if (!Clerk.session) {
            if (mode === 'admin') { window.location.replace('/admin/login'); return; }
            message.textContent = '';
            var opts = { routing: 'hash', signInUrl: '/admin/login', signUpUrl: '/admin/registrera', forceRedirectUrl: '/admin', fallbackRedirectUrl: '/admin' };
            if (mode === 'register') Clerk.mountSignUp(document.getElementById('auth-widget'), opts);
            else Clerk.mountSignIn(document.getElementById('auth-widget'), opts);
            return;
          }
          var token = await Clerk.session.getToken();
          var response = await fetch('/admin/api/session', { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store', credentials: 'omit' });
          if (!response.ok) {
            message.textContent = response.status === 403 ? 'Kontot saknar behörighet till Content Onlines administration.' : 'Inloggningen kunde inte kontrolleras. Försök igen om en stund.';
            var logout = document.createElement('button'); logout.textContent = 'Logga ut och byt konto';
            logout.addEventListener('click', function () { Clerk.signOut({ redirectUrl: '/admin/login' }); });
            message.after(logout); return;
          }
          if (mode !== 'admin') { window.location.replace('/admin'); return; }
          var data = await response.json();
          document.getElementById('account-email').textContent = data.admin.email;
          document.getElementById('account').hidden = false;
          document.getElementById('workspace').hidden = false;
          message.textContent = '';
          var workspaceResponse = await fetch('/admin/api/workspace', { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store', credentials: 'omit' });
          if (!workspaceResponse.ok) throw new Error('workspace_unavailable');
          var workspace = await workspaceResponse.json();
          document.getElementById('customer-count').textContent = String(workspace.customers.length);
          document.getElementById('publisher-count').textContent = String(workspace.publishers.length);
          document.getElementById('storage-status').textContent = workspace.storage.label;
          function appendRow(targetId, values) {
            var row = document.createElement('tr');
            values.forEach(function (value) { var cell = document.createElement('td'); cell.textContent = value; row.appendChild(cell); });
            document.getElementById(targetId).appendChild(row);
          }
          workspace.assignments.forEach(function (item) { appendRow('assignments', [item.customer, item.publisher, item.product, item.status]); });
          workspace.connections.forEach(function (item) { appendRow('connections', [item.name, item.owner, item.mode, item.lastImport || 'Ingen import', item.status]); });
          workspace.customers.forEach(function (item) {
            var block = document.createElement('div'); block.style.marginBottom = '18px';
            var title = document.createElement('h3'); title.textContent = item.name;
            var detail = document.createElement('p'); detail.className = 'small'; detail.textContent = item.users + ' användare · ' + item.products + ' produkter';
            var state = document.createElement('span'); state.className = 'pill'; state.textContent = item.status;
            block.appendChild(title); block.appendChild(detail); block.appendChild(state); document.getElementById('customers').appendChild(block);
          });
          Clerk.mountUserButton(document.getElementById('user-button'), { afterSignOutUrl: '/admin/login' });
          document.getElementById('sign-out').addEventListener('click', function () { Clerk.signOut({ redirectUrl: '/admin/login' }); });
          Clerk.addListener(function (state) { if (!state.session) { document.getElementById('account').hidden = true; document.getElementById('workspace').hidden = true; window.location.replace('/admin/login'); } });
        } catch (_) { message.textContent = 'Inloggningstjänsten kunde inte laddas. Ladda om sidan och försök igen.'; }
      });
    </script>` : ""}</body></html>`;
}
