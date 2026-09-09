export const customerPortalClient = String.raw`
(() => {
  'use strict';

  const configNode = document.getElementById('portal-config');
  if (!configNode) return;

  let config;
  try {
    config = JSON.parse(configNode.textContent || '{}');
  } catch {
    return;
  }

  const configuredSections = Array.isArray(config.sections) ? config.sections : [];
  const allowedIds = configuredSections
    .map((section) => typeof section === 'string' ? section : section && section.id)
    .filter((id) => typeof id === 'string' && /^[a-z][a-z0-9-]*$/.test(id));
  const panels = [...document.querySelectorAll('[data-portal-section]')];
  const sections = new Map(
    panels
      .filter((panel) => allowedIds.includes(panel.dataset.portalSection))
      .map((panel) => [panel.dataset.portalSection, panel]),
  );
  const navButtons = [...document.querySelectorAll('[data-portal-nav]')];
  const sidebar = document.getElementById('portal-sidebar');
  const scrim = document.getElementById('portal-scrim');
  const menu = document.getElementById('portal-menu');
  const breadcrumb = document.getElementById('portal-breadcrumb');
  const liveStatus = document.getElementById('portal-live-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobileLayout = matchMedia('(max-width: 980px)');

  const setSidebarAccess = (open) => {
    if (!sidebar) return;
    const hidden = mobileLayout.matches && !open;
    sidebar.toggleAttribute('inert', hidden);
    if (hidden) sidebar.setAttribute('aria-hidden', 'true');
    else sidebar.removeAttribute('aria-hidden');
  };

  const closeMenu = () => {
    sidebar?.classList.remove('open');
    scrim?.classList.remove('visible');
    menu?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('portal-nav-open');
    setSidebarAccess(false);
  };

  const activateSection = (section, options = {}) => {
    if (!sections.has(section)) throw new Error('Sektionen är inte tillåten.');
    const target = sections.get(section);

    panels.forEach((panel) => {
      const active = panel === target;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
    navButtons.forEach((button) => {
      button.setAttribute('aria-current', button.dataset.portalNav === section ? 'page' : 'false');
    });

    const label = target.dataset.portalLabel || section;
    if (breadcrumb) breadcrumb.textContent = label;
    if (liveStatus) liveStatus.textContent = label + ' visas.';

    if (options.updateHash !== false && location.hash !== '#' + section) {
      history.replaceState(null, '', '#' + section);
    }
    if (options.scroll !== false) {
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
    if (options.focus) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    if (!reducedMotion.matches) {
      target.animate(
        [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
    }
    closeMenu();
    return { ok: true, section, label };
  };

  navButtons.forEach((button) => {
    button.addEventListener('click', () => activateSection(button.dataset.portalNav, { focus: true }));
  });
  document.querySelectorAll('[data-open-section]').forEach((button) => {
    button.addEventListener('click', () => activateSection(button.dataset.openSection, { focus: true }));
  });

  menu?.addEventListener('click', () => {
    const open = sidebar?.classList.toggle('open');
    scrim?.classList.toggle('visible', Boolean(open));
    menu.setAttribute('aria-expanded', String(Boolean(open)));
    document.body.classList.toggle('portal-nav-open', Boolean(open));
    setSidebarAccess(Boolean(open));
  });
  scrim?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
  mobileLayout.addEventListener('change', () => {
    setSidebarAccess(Boolean(sidebar?.classList.contains('open')));
  });
  setSidebarAccess(false);

  const activateHash = () => {
    if (!sections.size) return;
    const requested = location.hash.slice(1);
    const section = sections.has(requested) ? requested : (sections.has('overview') ? 'overview' : sections.keys().next().value);
    activateSection(section, { updateHash: Boolean(requested), focus: false });
  };
  addEventListener('hashchange', activateHash);
  queueMicrotask(activateHash);

  const readContext = async () => {
    const response = await fetch(config.contextUrl, { cache: 'no-store', credentials: 'omit' });
    if (!response.ok) throw new Error('Portalinformationen är inte tillgänglig.');
    return response.json();
  };

  const registeredTools = new Set();
  const registerTool = (name, handler) => {
    if (registeredTools.has(name)) return;
    window.DID_AGENTS_API.functions.registerClientTool(name, handler);
    registeredTools.add(name);
  };
  const registerTools = () => {
    const api = window.DID_AGENTS_API;
    if (!api?.functions?.registerClientTool) return;
    const enabled = new Set(Array.isArray(config.tools) ? config.tools : []);
    if (enabled.has('portal_context')) registerTool('get_portal_context', async () => JSON.stringify(await readContext()));
    if (enabled.has('portal_navigation')) registerTool('navigate_portal', async (args) => JSON.stringify(activateSection(String(args?.section || ''), { focus: true })));
    if (enabled.has('portfolio_summary')) registerTool('get_portfolio_summary', async () => JSON.stringify((await readContext()).portfolio));
    if (enabled.has('usage_summary')) registerTool('get_usage_summary', async () => JSON.stringify((await readContext()).usage));
  };

  const statusNode = document.getElementById('assistant-status');
  const setAgentStatus = (state) => {
    if (!statusNode) return;
    const normalized = String(state || '').toLowerCase();
    statusNode.dataset.state = normalized;
    statusNode.textContent = normalized === 'connected'
      ? 'Ansluten'
      : normalized === 'connecting'
        ? 'Ansluter'
        : normalized === 'disconnected'
          ? 'Frånkopplad'
          : 'Redo att ansluta';
  };

  let didBound = false;
  const bindDid = () => {
    if (didBound) return true;
    const api = window.DID_AGENTS_API;
    if (!api?.events?.on) return false;
    didBound = true;
    api.events.on('connection', (event) => {
      setAgentStatus(event?.state);
      if (event?.state === 'Connected') registerTools();
    });
    return true;
  };

  if (config.agentEnabled) {
    if (!bindDid()) {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        if (bindDid() || attempts > 80) clearInterval(timer);
      }, 100);
    }
  }
})();
`;
