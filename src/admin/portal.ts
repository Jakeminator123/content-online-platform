import { Hono } from "hono";
import { Buffer } from "node:buffer";
import { html } from "hono/html";
import { secureHeaders } from "hono/secure-headers";
import { CUSTOMER_PORTAL, PLATFORM_ORIGIN } from "./identity.js";
import type { AdminAuthenticator, AdminConfig } from "./identity.js";

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
          administration: { users: "not_connected", publishers: "not_connected", customerAssignments: "not_connected" },
        });
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
      :root{font-family:Arial,Helvetica,sans-serif;color:#111827;background:#f3f6fa;color-scheme:light}*{box-sizing:border-box}body{margin:0}a{color:#134a79}a:focus-visible,button:focus-visible{outline:3px solid #d59b00;outline-offset:4px}header{background:#102c46;color:white;padding:22px 6vw;display:flex;justify-content:space-between;align-items:center;gap:20px}header a{color:white;text-decoration:none}.brand{font-size:21px;font-weight:700;letter-spacing:-.5px}.brand span{font-weight:400;color:#b9d5eb}main{max-width:1040px;margin:0 auto;padding:58px 24px}h1{font-size:clamp(28px,4vw,42px);letter-spacing:-1px;margin:12px 0 18px}h2{font-size:22px;margin:0 0 14px}p{font-size:16px;line-height:1.65;margin:0 0 20px}.eyebrow{text-transform:uppercase;letter-spacing:2px;font-size:13px;font-weight:700;color:#305e80}.lead{max-width:680px;color:#4b5563}.grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin:30px 0}.card{border:1px solid #d9e1e9;border-radius:12px;background:white;padding:30px;box-shadow:0 3px 16px #102c4606}.card p{color:#4b5563}.button,button{display:inline-block;border:0;border-radius:6px;background:#174f7c;color:white;padding:13px 18px;font:600 16px Arial;text-decoration:none;cursor:pointer}.secondary{background:#eaf1f8;color:#174f7c}.small{font-size:14px;color:#4b5563}.notice{border-left:4px solid #d39419;background:#fff8e7;padding:16px 20px;margin:24px 0;font-size:14px;line-height:1.6}.auth{max-width:490px;margin:auto}.auth .card{padding:24px}#auth-widget{min-height:160px;display:flex;justify-content:center}#user-button{display:flex;justify-content:flex-end}.actions{display:flex;gap:15px;align-items:center;flex-wrap:wrap}.status{color:#305e80;font-size:14px;font-weight:700}dl{margin:0}dt{font-weight:700;margin-top:14px}dd{margin:6px 0;line-height:1.6;overflow-wrap:anywhere}footer{max-width:1040px;margin:0 auto;padding:18px 24px 35px;border-top:1px solid #d9e1e9;font-size:14px;color:#4b5563}[hidden]{display:none!important}@media(max-width:660px){.grid{grid-template-columns:1fr}main{padding-top:32px}.card{padding:24px}header{padding:20px 24px}.brand{font-size:18px}}
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
      <div id="user-button"></div><div class="eyebrow">Content Online</div><h1>Administration</h1>
      <p id="message" role="status">${configured ? "Kontrollerar din inloggning…" : "Inloggningen är inte konfigurerad ännu."}</p>
      <section id="account" class="card" hidden><h2>Du är inloggad</h2><dl><dt>Konto</dt><dd id="account-email"></dd><dt>Behörighet</dt><dd>Content Online-administratör — inte kundadministratör på KTH.</dd></dl></section>
      <div id="workspace" hidden><div class="grid"><section class="card"><h2>Kunder och användare</h2><p>Kundorganisationer, konton och behörigheter ska hanteras här.</p><span class="status">Inte aktiverat — väntar på databas och administrationsfunktioner</span></section><section class="card"><h2>Publicister och kundåtkomst</h2><p>Content Onlines publicistregister och kopplingen mellan kund, publicist och produkt ska hanteras här.</p><span class="status">Inte aktiverat — väntar på databas och administrationsfunktioner</span></section></div>
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
          Clerk.mountUserButton(document.getElementById('user-button'), { afterSignOutUrl: '/admin/login' });
          document.getElementById('sign-out').addEventListener('click', function () { Clerk.signOut({ redirectUrl: '/admin/login' }); });
          Clerk.addListener(function (state) { if (!state.session) { document.getElementById('account').hidden = true; document.getElementById('workspace').hidden = true; window.location.replace('/admin/login'); } });
        } catch (_) { message.textContent = 'Inloggningstjänsten kunde inte laddas. Ladda om sidan och försök igen.'; }
      });
    </script>` : ""}</body></html>`;
}
