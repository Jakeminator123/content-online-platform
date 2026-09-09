export const customerSessionClient = String.raw`
(() => {
  'use strict';

  const body = document.body;
  const slug = body?.dataset.customerSlug || '';
  const canonicalPath = '/portal/' + encodeURIComponent(slug);

  // The demo and custom-domain routes have separate presentation/auth flows.
  if (
    body?.dataset.dataMode !== 'locked'
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    || slug.length > 63
    || location.pathname !== canonicalPath
  ) return;

  const authenticatedOnly = [...document.querySelectorAll('[data-authenticated-only]')];
  const lockedOnly = [...document.querySelectorAll('[data-locked-only]')];
  const footer = document.querySelector('.sidebar-footer');
  const footerStatus = document.querySelector('[data-portal-access-status]')
    || document.querySelector('.sidebar-footer span:last-child');
  const liveStatus = document.getElementById('portal-live-status');

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(node => { node.textContent = value; });
  }

  function memberInitials(value) {
    const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? parts.slice(0, 2).map(part => part[0]).join('') : parts[0]?.slice(0, 2) || '✓').toUpperCase();
  }

  function markAuthenticated(entry) {
    body.dataset.dataMode = 'authenticated';
    body.dataset.portalAccess = 'authenticated';
    authenticatedOnly.forEach(node => { node.hidden = false; });
    lockedOnly.forEach(node => { node.hidden = true; });
    const displayName = typeof entry?.displayName === 'string' && entry.displayName.trim()
      ? entry.displayName.trim()
      : 'Verifierad medlem';
    const role = entry?.role === 'customer_admin' ? 'Kundadministratör' : 'Läsare';
    setText('[data-portal-member-name]', displayName);
    setText('[data-portal-member-role]', role);
    setText('[data-portal-member-initials]', memberInitials(displayName));
    if (footer) footer.dataset.portalAccess = 'authenticated';
    if (footerStatus) footerStatus.textContent = 'Verifierad åtkomst';
    if (liveStatus) liveStatus.textContent = 'Kundåtkomsten är verifierad.';
  }

  async function verifySession() {
    try {
      await Clerk.load();
      const session = Clerk.session;
      if (!session) return;

      const token = await session.getToken();
      if (typeof token !== 'string' || !token.trim()) return;

      const response = await fetch('/v1/portal-entries', {
        headers: { Authorization: 'Bearer ' + token },
        cache: 'no-store',
        credentials: 'omit',
      });
      if (!response.ok) return;

      const payload = await response.json();
      const entries = payload && Array.isArray(payload.entries) ? payload.entries : [];
      const allowedEntry = entries.find(entry => entry && typeof entry === 'object' && entry.slug === slug);
      if (allowedEntry) markAuthenticated(allowedEntry);
    } catch (_) {
      // Network and identity-provider failures keep the server-rendered locked state.
    }
  }

  verifySession();
})();
`;
