export const customerAccessClient = String.raw`
(() => {
  'use strict';
  const root = document.getElementById('customer-access');
  if (!root) return;
  const message = document.getElementById('customer-access-message');
  const widget = document.getElementById('customer-auth-widget');
  const chooser = document.getElementById('portal-chooser');
  const list = document.getElementById('portal-entry-list');
  const account = document.getElementById('customer-account');
  const signOut = document.getElementById('customer-sign-out');
  const requestedPortal = new URL(location.href).searchParams.get('portal') || '';
  const returnUrl = location.pathname + location.search;

  function setMessage(value) {
    if (message) message.textContent = value;
  }

  function showAccount() {
    if (account) account.hidden = false;
    if (signOut) signOut.hidden = false;
  }

  function portalPath(slug) {
    return '/portal/' + encodeURIComponent(slug);
  }

  function renderEntries(entries) {
    if (widget) widget.hidden = true;
    showAccount();
    if (!Array.isArray(entries) || entries.length === 0) {
      setMessage('Kontot är verifierat men har ännu ingen aktiv kundportal. Kontakta Content Online.');
      return;
    }

    const preferred = entries.find(entry => entry && entry.slug === requestedPortal);
    const automatic = preferred || (!requestedPortal && entries.length === 1 ? entries[0] : null);
    if (automatic && typeof automatic.slug === 'string') {
      setMessage('Öppnar ' + String(automatic.organizationName || 'kundportalen') + '…');
      location.replace(portalPath(automatic.slug));
      return;
    }

    if (!list || !chooser) return;
    list.replaceChildren();
    entries.forEach(entry => {
      if (!entry || typeof entry.slug !== 'string' || typeof entry.organizationName !== 'string') return;
      const link = document.createElement('a');
      link.className = 'portal-entry';
      link.href = portalPath(entry.slug);
      const title = document.createElement('strong');
      title.textContent = entry.organizationName;
      const detail = document.createElement('span');
      detail.textContent = entry.role === 'customer_admin' ? 'Kundadministratör' : 'Läsare';
      link.append(title, detail);
      list.append(link);
    });
    setMessage(requestedPortal ? 'Den efterfrågade portalen ingår inte i kontots åtkomst. Välj en tillgänglig portal.' : 'Välj organisation.');
    chooser.hidden = false;
  }

  async function resolveEntries(session) {
    setMessage('Verifierar medlemskap…');
    const token = await session.getToken();
    const response = await fetch('/v1/portal-entries', {
      headers: { Authorization: 'Bearer ' + token },
      cache: 'no-store',
      credentials: 'omit',
    });
    if (!response.ok) {
      showAccount();
      if (widget) widget.hidden = true;
      if (response.status === 403) setMessage('Kontot kan inte användas för kundåtkomst.');
      else if (response.status === 503) setMessage('Kundinloggningen är tillfälligt otillgänglig.');
      else setMessage('Sessionen kunde inte verifieras. Logga ut och försök igen.');
      return;
    }
    const payload = await response.json();
    renderEntries(payload.entries);
  }

  async function start() {
    try {
      await Clerk.load({
        ui: { ClerkUI: window.__internal_ClerkUICtor },
        signInUrl: '/login',
        signUpUrl: '/registrera',
        signInForceRedirectUrl: returnUrl,
        signUpForceRedirectUrl: returnUrl,
      });
      if (signOut) signOut.addEventListener('click', () => Clerk.signOut({ redirectUrl: '/login' }));
      if (Clerk.session) {
        await resolveEntries(Clerk.session);
        return;
      }
      setMessage('');
      if (!widget) return;
      const options = {
        routing: 'hash',
        signInUrl: '/login',
        signUpUrl: '/registrera',
        forceRedirectUrl: returnUrl,
        fallbackRedirectUrl: returnUrl,
      };
      if (document.body.dataset.customerAccessMode === 'register') Clerk.mountSignUp(widget, options);
      else Clerk.mountSignIn(widget, options);
    } catch (_) {
      setMessage('Inloggningstjänsten kunde inte laddas. Ladda om sidan och försök igen.');
    }
  }

  start();
})();
`;
