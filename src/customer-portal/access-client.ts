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
  const mode = root.dataset.customerAccessMode || document.body.dataset.customerAccessMode || 'login';
  const deferred = root.dataset.customerAccessAutostart === 'false';
  const rawRequestedPortal = new URL(location.href).searchParams.get('portal') || '';
  const requestedPortal = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawRequestedPortal) && rawRequestedPortal.length <= 63 ? rawRequestedPortal : '';
  const configuredReturnUrl = root.dataset.customerAccessReturnUrl || '';
  const portalReturnUrl = deferred && requestedPortal ? '/?login=1&portal=' + encodeURIComponent(requestedPortal) : '';
  const returnUrl = portalReturnUrl || (/^\/(?!\/)/.test(configuredReturnUrl) ? configuredReturnUrl : location.pathname + location.search);
  const customerAppearance = {
    elements: {
      headerTitle: { display: 'none' },
      headerSubtitle: { display: 'none' },
    },
  };

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

  async function resolveEntries(session, isActive = () => true) {
    setMessage('Verifierar medlemskap…');
    const token = await session.getToken();
    if (!isActive()) return false;
    const response = await fetch('/v1/portal-entries', {
      headers: { Authorization: 'Bearer ' + token },
      cache: 'no-store',
      credentials: 'omit',
    });
    if (!isActive()) return false;
    if (!response.ok) {
      showAccount();
      if (widget) widget.hidden = true;
      if (response.status === 403) setMessage('Kontot kan inte användas för kundåtkomst.');
      else if (response.status === 503) setMessage('Kundinloggningen är tillfälligt otillgänglig.');
      else setMessage('Sessionen kunde inte verifieras. Logga ut och försök igen.');
      return true;
    }
    const payload = await response.json();
    if (!isActive()) return false;
    renderEntries(payload.entries);
    return true;
  }

  let starting = false;
  let ready = false;
  let runVersion = 0;
  let signOutBound = false;
  const isRunActive = (run) => run === runVersion && (!deferred || root.dataset.customerAccessRequested === 'true');
  async function start() {
    if (starting || ready) return;
    starting = true;
    const run = ++runVersion;
    try {
      await Clerk.load({
        ui: { ClerkUI: window.__internal_ClerkUICtor },
        signInUrl: '/login',
        signUpUrl: '/registrera',
        signInForceRedirectUrl: returnUrl,
        signUpForceRedirectUrl: returnUrl,
      });
      if (!isRunActive(run)) {
        if (run === runVersion) starting = false;
        return;
      }
      if (signOut && !signOutBound) {
        signOutBound = true;
        signOut.addEventListener('click', () => Clerk.signOut({ redirectUrl: returnUrl }));
      }
      if (Clerk.session) {
        const resolved = await resolveEntries(Clerk.session, () => isRunActive(run));
        if (run !== runVersion) return;
        ready = resolved;
        starting = false;
        return;
      }
      setMessage('');
      if (!widget) {
        ready = true;
        starting = false;
        return;
      }
      const options = {
        routing: 'hash',
        signInUrl: '/login',
        signUpUrl: '/registrera',
        forceRedirectUrl: returnUrl,
        fallbackRedirectUrl: returnUrl,
        appearance: customerAppearance,
      };
      if (mode === 'register') Clerk.mountSignUp(widget, options);
      else Clerk.mountSignIn(widget, options);
      ready = true;
      starting = false;
    } catch (_) {
      if (run !== runVersion) return;
      starting = false;
      if (!isRunActive(run)) return;
      setMessage('Inloggningstjänsten kunde inte laddas. Ladda om sidan och försök igen.');
    }
  }

  if (deferred) {
    window.addEventListener('customer-access:open', start);
    window.addEventListener('customer-access:close', () => {
      if (!starting) return;
      runVersion += 1;
      starting = false;
    });
    if (root.dataset.customerAccessRequested === 'true') start();
  } else start();
})();
`;
