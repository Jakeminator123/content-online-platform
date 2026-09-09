export const customerLandingClient = String.raw`
(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById('landing-header');
  const menu = document.getElementById('landing-nav');
  const menuButton = document.getElementById('landing-menu-button');
  const menuButtonLabel = menuButton && menuButton.querySelector('.sr-only');
  const main = document.getElementById('main-content');
  const footer = document.getElementById('contact');
  const heroScroll = document.querySelector('.landing-hero-scroll');
  const portrait = document.getElementById('landing-portrait');
  const marquee = document.querySelector('.landing-marquee');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  root.classList.add('landing-enhanced');

  let scheduled = false;
  const updateViewportEffects = () => {
    if (header) header.dataset.scrolled = window.scrollY > 18 ? 'true' : 'false';

    if (heroScroll && portrait && marquee && !reducedMotion.matches) {
      const rect = heroScroll.getBoundingClientRect();
      const travel = Math.max(heroScroll.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(-rect.top / travel, 0), 1);
      const endScale = window.innerWidth <= 680 ? 0.58 : 0.48;
      const scale = 1 - progress * (1 - endScale);
      const radius = Math.round(progress * (window.innerWidth <= 680 ? 18 : 30));
      const marqueeOpacity = Math.min(Math.max((progress - 0.12) / 0.42, 0), 1);
      portrait.style.transform = 'scale(' + scale.toFixed(4) + ')';
      portrait.style.borderRadius = radius + 'px';
      marquee.style.opacity = String(marqueeOpacity);
    } else if (portrait && marquee) {
      portrait.style.transform = '';
      portrait.style.borderRadius = '';
      marquee.style.opacity = '';
    }

    scheduled = false;
  };

  const scheduleViewportUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateViewportEffects);
  };

  updateViewportEffects();
  window.addEventListener('scroll', scheduleViewportUpdate, { passive: true });
  window.addEventListener('resize', scheduleViewportUpdate, { passive: true });
  if (typeof reducedMotion.addEventListener === 'function') {
    reducedMotion.addEventListener('change', scheduleViewportUpdate);
  }

  const revealSections = Array.from(document.querySelectorAll('.landing-reveal-section'));
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.dataset.visible = 'true';
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    revealSections.forEach((section) => observer.observe(section));
  } else {
    revealSections.forEach((section) => { section.dataset.visible = 'true'; });
  }

  const resourceTabs = Array.from(document.querySelectorAll('[data-resource-tab]'));
  const resourcePanels = Array.from(document.querySelectorAll('[data-resource-panel]'));
  const activateResource = (tab, moveFocus) => {
    const resource = tab.dataset.resourceTab;
    resourceTabs.forEach((candidate) => {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', selected ? 'true' : 'false');
      candidate.tabIndex = selected ? 0 : -1;
    });
    resourcePanels.forEach((panel) => {
      panel.hidden = panel.dataset.resourcePanel !== resource;
    });
    if (moveFocus) tab.focus();
  };

  resourceTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateResource(tab, false));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % resourceTabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (index - 1 + resourceTabs.length) % resourceTabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = resourceTabs.length - 1;
      activateResource(resourceTabs[nextIndex], true);
    });
  });

  if (!menu || !menuButton) return;

  const setMenuOpen = (open, moveFocus) => {
    menu.dataset.open = open ? 'true' : 'false';
    menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    body.dataset.menuOpen = open ? 'true' : 'false';
    if (menuButtonLabel) menuButtonLabel.textContent = open ? 'Close menu' : 'Open menu';
    if (main) main.inert = open;
    if (footer) footer.inert = open;

    if (moveFocus) {
      if (open) {
        const firstLink = menu.querySelector('a');
        if (firstLink) window.requestAnimationFrame(() => firstLink.focus());
      } else {
        menuButton.focus();
      }
    }
  };

  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    setMenuOpen(open, open);
  });

  menu.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) setMenuOpen(false, false);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false, true);
      return;
    }
    if (event.key !== 'Tab' || menuButton.getAttribute('aria-expanded') !== 'true' || !header) return;
    const focusable = Array.from(header.querySelectorAll('a[href], button:not([disabled])')).filter((element) => !element.closest('[inert]'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last && last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first && first.focus();
    }
  });
})();
`;
