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

  root.classList.add('landing-enhanced');

  if (header) {
    let scheduled = false;
    const updateHeader = () => {
      header.dataset.scrolled = window.scrollY > 18 ? 'true' : 'false';
      scheduled = false;
    };
    const scheduleHeaderUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(updateHeader);
    };
    updateHeader();
    window.addEventListener('scroll', scheduleHeaderUpdate, { passive: true });
  }

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
    const focusable = Array.from(header.querySelectorAll('a[href], button:not([disabled])'));
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
