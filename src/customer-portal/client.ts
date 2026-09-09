import { customerPortalInsightsClient } from "./insights-client.js";

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
  const portalMain = document.getElementById('portal-main');
  const agentConfig = document.getElementById('portal-agent-config');
  const agentLauncher = document.getElementById('portal-agent-launcher');
  const breadcrumb = document.getElementById('portal-breadcrumb');
  const liveStatus = document.getElementById('portal-live-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobileLayout = matchMedia('(max-width: 980px)');
  const compactAgentLayout = matchMedia('(max-width: 640px)');

  const setSidebarAccess = (open) => {
    if (!sidebar) return;
    const hidden = mobileLayout.matches && !open;
    sidebar.toggleAttribute('inert', hidden);
    if (hidden) sidebar.setAttribute('aria-hidden', 'true');
    else sidebar.removeAttribute('aria-hidden');
  };

  const menuIsOpen = () => Boolean(mobileLayout.matches && sidebar?.classList.contains('open'));
  const sidebarFocusables = () => sidebar
    ? [...sidebar.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.hidden)
    : [];

  const closeMenu = (options = {}) => {
    const wasOpen = menuIsOpen();
    sidebar?.classList.remove('open');
    scrim?.classList.remove('visible');
    menu?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('portal-nav-open');
    portalMain?.removeAttribute('inert');
    sidebar?.removeAttribute('role');
    sidebar?.removeAttribute('aria-modal');
    agentLauncher?.removeAttribute('inert');
    agentLauncher?.removeAttribute('aria-hidden');
    setSidebarAccess(false);
    if (wasOpen && options.restoreFocus !== false) queueMicrotask(() => menu?.focus());
  };

  const openMenu = () => {
    if (!mobileLayout.matches || !sidebar) return;
    sidebar.classList.add('open');
    scrim?.classList.add('visible');
    menu?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('portal-nav-open');
    setSidebarAccess(true);
    sidebar.setAttribute('role', 'dialog');
    sidebar.setAttribute('aria-modal', 'true');
    portalMain?.setAttribute('inert', '');
    agentLauncher?.setAttribute('inert', '');
    agentLauncher?.setAttribute('aria-hidden', 'true');
    window.DID_AGENTS_API?.configure?.({ openMode: 'compact' });
    const preferred = sidebar.querySelector('[data-portal-nav][aria-current="page"]') || sidebarFocusables()[0];
    queueMicrotask(() => preferred?.focus());
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
    closeMenu({ restoreFocus: false });
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
    return { ok: true, section, label };
  };

  navButtons.forEach((button) => {
    button.addEventListener('click', () => activateSection(button.dataset.portalNav, { focus: true }));
  });
  document.querySelectorAll('[data-open-section]').forEach((button) => {
    button.addEventListener('click', () => activateSection(button.dataset.openSection, { focus: true }));
  });

  menu?.addEventListener('click', () => {
    if (menuIsOpen()) closeMenu();
    else openMenu();
  });
  scrim?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (event) => {
    if (!menuIsOpen()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = sidebarFocusables();
    if (!focusables.length) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && (document.activeElement === first || !sidebar?.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !sidebar?.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });
  mobileLayout.addEventListener('change', () => {
    if (!mobileLayout.matches) closeMenu({ restoreFocus: false });
    else {
      const focusWasInSidebar = Boolean(sidebar?.contains(document.activeElement));
      setSidebarAccess(false);
      if (focusWasInSidebar) queueMicrotask(() => menu?.focus());
    }
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
      : normalized === 'loading'
        ? 'Öppnar assistenten'
      : normalized === 'connecting'
        ? 'Ansluter'
        : normalized === 'disconnected'
          ? 'Frånkopplad'
          : 'Redo att ansluta';
  };

  let didBound = false;
  const configureDidLayout = () => {
    const api = window.DID_AGENTS_API;
    if (!api?.configure) return false;
    api.configure({
      position: 'right',
      orientation: compactAgentLayout.matches ? 'vertical' : 'horizontal',
      showRestartButton: false,
    });
    return true;
  };
  const bindDid = () => {
    if (didBound) return true;
    const api = window.DID_AGENTS_API;
    if (!api?.events?.on) return false;
    try {
      configureDidLayout();
      api.events.on('connection', (event) => {
        const state = String(event?.state || '').toLowerCase();
        setAgentStatus(state);
        if (state === 'connected') registerTools();
      });
    } catch {
      return false;
    }
    didBound = true;
    if (agentLauncher) {
      const focusTarget = document.querySelector('.didagent_target button, .didagent_target [href], .didagent_target [tabindex]:not([tabindex="-1"]), .didagent_target');
      if (document.activeElement === agentLauncher && focusTarget?.focus) {
        if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
        focusTarget.focus({ preventScroll: true });
        agentLauncher.hidden = true;
      } else if (document.activeElement === agentLauncher) {
        agentLauncher.setAttribute('aria-label', 'Content Online AI är öppen');
        const launcherLabel = agentLauncher.querySelector('strong');
        if (launcherLabel) launcherLabel.textContent = 'Assistenten är öppen';
        agentLauncher.addEventListener('blur', () => { agentLauncher.hidden = true; }, { once: true });
      } else {
        agentLauncher.hidden = true;
      }
    }
    return true;
  };

  let agentLoading = false;
  let agentRequested = false;
  const loadAgent = () => {
    if (!config.agentEnabled || agentLoading || agentRequested || didBound || !agentConfig || !agentLauncher) return;
    const agentId = agentConfig.dataset.agentId;
    const clientKey = agentConfig.dataset.clientKey;
    if (!agentId || !clientKey) return;
    agentLoading = true;
    agentRequested = true;
    agentLauncher.setAttribute('aria-busy', 'true');
    const launcherLabel = agentLauncher.querySelector('strong');
    const idleLabel = launcherLabel?.textContent || 'Fråga Content Online';
    if (launcherLabel) launcherLabel.textContent = 'Öppnar assistenten…';
    setAgentStatus('loading');

    const embed = document.createElement('script');
    embed.type = 'module';
    embed.src = 'https://agent.d-id.com/v2/index.js';
    Object.assign(embed.dataset, {
      mode: 'fabio',
      clientKey,
      agentId,
      name: 'did-agent',
      monitor: 'true',
      orientation: compactAgentLayout.matches ? 'vertical' : 'horizontal',
      position: 'right',
      openMode: 'expanded',
      showAgentName: 'false',
      showRestartButton: 'false',
    });
    embed.addEventListener('error', () => {
      agentLoading = false;
      agentRequested = false;
      agentLauncher.removeAttribute('aria-busy');
      if (launcherLabel) launcherLabel.textContent = idleLabel;
      setAgentStatus('disconnected');
      embed.remove();
    }, { once: true });
    embed.addEventListener('load', () => {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        if (bindDid()) {
          clearInterval(timer);
          agentLoading = false;
          agentLauncher.removeAttribute('aria-busy');
        } else if (attempts > 80) {
          clearInterval(timer);
          agentLoading = false;
          agentLauncher.removeAttribute('aria-busy');
          agentLauncher.disabled = true;
          if (launcherLabel) launcherLabel.textContent = 'Assistenten kunde inte öppnas';
          setAgentStatus('disconnected');
        }
      }, 100);
    }, { once: true });
    document.body.append(embed);
  };

  if (config.agentEnabled && agentLauncher) {
    compactAgentLayout.addEventListener('change', configureDidLayout);
    agentLauncher.addEventListener('click', loadAgent);
  }
})();
` + customerPortalInsightsClient;
