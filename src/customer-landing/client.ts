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
  const loginDialog = document.getElementById('customer-login-dialog');
  const customerAccessRoot = document.getElementById('customer-access');
  const heroScroll = document.querySelector('.landing-hero-scroll');
  const portrait = document.getElementById('landing-portrait');
  const revealCanvas = document.getElementById('landing-hero-reveal');
  const marquee = document.querySelector('.landing-marquee');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  root.classList.add('landing-enhanced');

  let scheduled = false;
  const updateViewportEffects = () => {
    if (header) header.dataset.scrolled = window.scrollY > 18 ? 'true' : 'false';

    if (heroScroll && portrait && marquee && !reducedMotion.matches) {
      const rect = heroScroll.getBoundingClientRect();
      const travel = Math.max(heroScroll.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(-rect.top / travel, 0), 1);
      const shrinkProgress = Math.min(progress / 0.46, 1);
      const exitProgress = Math.min(Math.max((progress - 0.86) / 0.14, 0), 1);
      const endScale = window.innerWidth <= 680 ? 0.58 : 0.48;
      const scale = 1 - shrinkProgress * (1 - endScale);
      const radius = Math.round(shrinkProgress * (window.innerWidth <= 680 ? 18 : 30));
      const marqueeReveal = Math.min(Math.max((progress - 0.1) / 0.3, 0), 1);
      const exitOffset = exitProgress * -100;
      portrait.style.transform = 'translateY(' + exitOffset.toFixed(2) + '%) scale(' + scale.toFixed(4) + ')';
      portrait.style.borderRadius = radius + 'px';
      portrait.style.opacity = String(1 - exitProgress);
      marquee.style.opacity = String(marqueeReveal * (1 - exitProgress));
      marquee.style.transform = 'translateY(' + exitOffset.toFixed(2) + '%)';
    } else if (portrait && marquee) {
      portrait.style.transform = '';
      portrait.style.borderRadius = '';
      portrait.style.opacity = '';
      marquee.style.opacity = '';
      marquee.style.transform = '';
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

  const initPortraitReveal = () => {
    if (!portrait || !(revealCanvas instanceof HTMLCanvasElement)) return;
    const image = portrait.querySelector('.landing-hero-image');
    if (!(image instanceof HTMLImageElement)) return;
    revealCanvas.width = 1;
    revealCanvas.height = 1;
    const context = revealCanvas.getContext('2d', { alpha: true });
    if (!context) return;

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let animationFrame = 0;
    let resizeFrame = 0;
    let lastPaint = 0;
    let lastPoint = null;
    let points = [];
    let revealDisabled = reducedMotion.matches;
    const trailDuration = 1800;
    const maxBackingPixels = 2400000;

    const clearReveal = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      points = [];
      lastPoint = null;
      context.clearRect(0, 0, width, height);
      portrait.dataset.revealActive = 'false';
    };

    const releaseReveal = () => {
      clearReveal();
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = 0;
      width = 0;
      height = 0;
      pixelRatio = 1;
      revealCanvas.width = 1;
      revealCanvas.height = 1;
    };

    const resizeReveal = () => {
      width = Math.max(1, portrait.clientWidth);
      height = Math.max(1, portrait.clientHeight);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(maxBackingPixels / (width * height)));
      revealCanvas.width = Math.round(width * pixelRatio);
      revealCanvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      points = [];
      lastPoint = null;
    };

    const scheduleRevealResize = () => {
      if (resizeFrame || revealDisabled || !finePointer.matches) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        resizeReveal();
      });
    };

    const drawImageCover = () => {
      const imageWidth = image.naturalWidth || image.width;
      const imageHeight = image.naturalHeight || image.height;
      if (!imageWidth || !imageHeight) return;
      const imageAspect = imageWidth / imageHeight;
      const containerAspect = width / height;
      const drawWidth = imageAspect > containerAspect ? height * imageAspect : width;
      const drawHeight = imageAspect > containerAspect ? height : width / imageAspect;
      const position = getComputedStyle(image).objectPosition.split(/\s+/);
      const positionFactor = (value, fallback) => value && value.endsWith('%')
        ? Math.min(Math.max(Number.parseFloat(value) / 100, 0), 1)
        : fallback;
      const drawX = (width - drawWidth) * positionFactor(position[0], 0.5);
      const drawY = (height - drawHeight) * positionFactor(position[1], 0.5);
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    };

    const drawReveal = (now) => {
      animationFrame = 0;
      const rect = portrait.getBoundingClientRect();
      if (revealDisabled || document.hidden || rect.bottom <= 0 || rect.top >= window.innerHeight) {
        clearReveal();
        return;
      }
      points = points.filter((point) => now - point.at < trailDuration);
      if (!points.length) {
        clearReveal();
        return;
      }
      if (now - lastPaint < 1000 / 45) {
        animationFrame = window.requestAnimationFrame(drawReveal);
        return;
      }
      lastPaint = now;
      context.clearRect(0, 0, width, height);

      const brushRadius = Math.max(105, Math.min(width, height) * 0.2);
      context.save();
      context.globalCompositeOperation = 'source-over';
      points.forEach((point) => {
        const life = Math.max(0, 1 - (now - point.at) / trailDuration);
        const radius = brushRadius * (0.72 + (1 - life) * 0.32);
        const gradient = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,' + Math.min(1, life * 1.4) + ')');
        gradient.addColorStop(0.58, 'rgba(0,0,0,' + life + ')');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
      });
      context.globalCompositeOperation = 'source-in';
      drawImageCover();
      context.restore();

      if (points.length) animationFrame = window.requestAnimationFrame(drawReveal);
    };

    const requestRevealFrame = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(drawReveal);
    };

    const addRevealPoint = (x, y, now) => {
      const brushRadius = Math.max(105, Math.min(width, height) * 0.2);
      const spacing = Math.max(16, brushRadius * 0.18);
      if (lastPoint) {
        const distance = Math.hypot(x - lastPoint.x, y - lastPoint.y);
        const steps = Math.max(1, Math.ceil(distance / spacing));
        for (let step = 1; step <= steps; step += 1) {
          const progress = step / steps;
          points.push({
            x: lastPoint.x + (x - lastPoint.x) * progress,
            y: lastPoint.y + (y - lastPoint.y) * progress,
            at: now,
          });
        }
      } else {
        points.push({ x, y, at: now });
      }
      if (points.length > 48) points.splice(0, points.length - 48);
      lastPoint = { x, y };
      requestRevealFrame();
    };

    const moveReveal = (event) => {
      if (revealDisabled || !finePointer.matches || event.pointerType === 'touch') return;
      const rect = portrait.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      if (!width || !height) resizeReveal();
      const x = (event.clientX - rect.left) * (width / rect.width);
      const y = (event.clientY - rect.top) * (height / rect.height);
      portrait.dataset.revealActive = 'true';
      portrait.style.setProperty('--reveal-x', x + 'px');
      portrait.style.setProperty('--reveal-y', y + 'px');
      addRevealPoint(x, y, performance.now());
    };

    const leaveReveal = () => {
      portrait.dataset.revealActive = 'false';
      lastPoint = null;
      requestRevealFrame();
    };

    if (finePointer.matches && !revealDisabled) resizeReveal();
    portrait.addEventListener('pointerenter', moveReveal);
    portrait.addEventListener('pointermove', moveReveal);
    portrait.addEventListener('pointerleave', leaveReveal);
    window.addEventListener('resize', scheduleRevealResize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearReveal();
    });
    if (typeof reducedMotion.addEventListener === 'function') {
      reducedMotion.addEventListener('change', () => {
        revealDisabled = reducedMotion.matches;
        if (revealDisabled) releaseReveal();
        else if (finePointer.matches) scheduleRevealResize();
      });
    }
    if (typeof finePointer.addEventListener === 'function') {
      finePointer.addEventListener('change', () => {
        if (!finePointer.matches) releaseReveal();
        else if (!revealDisabled) scheduleRevealResize();
      });
    }
  };

  initPortraitReveal();

  const initCleanReveal = () => {
    const frame = document.getElementById('landing-clean-frame');
    const canvas = document.getElementById('landing-clean-canvas');
    if (!frame || !(canvas instanceof HTMLCanvasElement)) return;
    const image = frame.querySelector('.landing-clean-image');
    const toggle = frame.querySelector('.landing-clean-toggle');
    if (!(image instanceof HTMLImageElement) || !(toggle instanceof HTMLButtonElement)) return;
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let animationFrame = 0;
    let resizeFrame = 0;
    let lastPaint = 0;
    let lastPoint = null;
    let points = [];
    let enabled = finePointer.matches && !reducedMotion.matches;
    let fullReveal = false;
    const trailDuration = 2800;
    const maxBackingPixels = 1600000;

    const clearCleanReveal = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      points = [];
      lastPoint = null;
      context.clearRect(0, 0, width, height);
      frame.dataset.cleanActive = 'false';
    };

    const setFullReveal = (unlocked) => {
      fullReveal = unlocked;
      frame.dataset.cleanUnlocked = unlocked ? 'true' : 'false';
      toggle.setAttribute('aria-pressed', unlocked ? 'true' : 'false');
      toggle.textContent = unlocked ? 'Restore fog' : 'View clear';
      if (unlocked) clearCleanReveal();
    };

    const releaseCleanReveal = () => {
      clearCleanReveal();
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = 0;
      width = 0;
      height = 0;
      pixelRatio = 1;
      canvas.width = 1;
      canvas.height = 1;
      frame.dataset.cleanEnabled = 'false';
      setFullReveal(false);
    };

    const resizeCleanReveal = () => {
      if (!enabled) return;
      width = Math.max(1, frame.clientWidth);
      height = Math.max(1, frame.clientHeight);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.35, Math.sqrt(maxBackingPixels / (width * height)));
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      points = [];
      lastPoint = null;
      frame.dataset.cleanEnabled = 'true';
    };

    const scheduleCleanResize = () => {
      if (resizeFrame || !enabled) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        resizeCleanReveal();
      });
    };

    const drawCleanImageCover = () => {
      const imageWidth = image.naturalWidth || image.width;
      const imageHeight = image.naturalHeight || image.height;
      if (!imageWidth || !imageHeight) return;
      const imageAspect = imageWidth / imageHeight;
      const containerAspect = width / height;
      const drawWidth = imageAspect > containerAspect ? height * imageAspect : width;
      const drawHeight = imageAspect > containerAspect ? height : width / imageAspect;
      const position = getComputedStyle(image).objectPosition.split(/\s+/);
      const factor = (value, fallback) => value && value.endsWith('%')
        ? Math.min(Math.max(Number.parseFloat(value) / 100, 0), 1)
        : fallback;
      context.drawImage(
        image,
        (width - drawWidth) * factor(position[0], 0.5),
        (height - drawHeight) * factor(position[1], 0.5),
        drawWidth,
        drawHeight,
      );
    };

    const drawCleanReveal = (now) => {
      animationFrame = 0;
      const rect = frame.getBoundingClientRect();
      if (!enabled || document.hidden || rect.bottom <= 0 || rect.top >= window.innerHeight) {
        clearCleanReveal();
        return;
      }
      points = points.filter((point) => now - point.at < trailDuration);
      if (!points.length) {
        clearCleanReveal();
        return;
      }
      if (now - lastPaint < 1000 / 45) {
        animationFrame = window.requestAnimationFrame(drawCleanReveal);
        return;
      }
      lastPaint = now;
      context.clearRect(0, 0, width, height);
      const brushRadius = Math.max(72, Math.min(width, height) * 0.115);
      context.save();
      context.globalCompositeOperation = 'source-over';
      points.forEach((point) => {
        const life = Math.max(0, 1 - (now - point.at) / trailDuration);
        const radius = brushRadius * (0.9 + (1 - life) * 0.18);
        const gradient = context.createRadialGradient(point.x, point.y, radius * 0.16, point.x, point.y, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,' + Math.min(1, life * 1.45) + ')');
        gradient.addColorStop(0.62, 'rgba(0,0,0,' + life * 0.78 + ')');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
      });
      context.globalCompositeOperation = 'source-in';
      drawCleanImageCover();
      context.restore();
      animationFrame = window.requestAnimationFrame(drawCleanReveal);
    };

    const requestCleanFrame = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(drawCleanReveal);
    };

    const addCleanPoint = (x, y, now) => {
      const brushRadius = Math.max(72, Math.min(width, height) * 0.115);
      const spacing = Math.max(13, brushRadius * 0.2);
      if (lastPoint) {
        const distance = Math.hypot(x - lastPoint.x, y - lastPoint.y);
        const steps = Math.max(1, Math.ceil(distance / spacing));
        for (let step = 1; step <= steps; step += 1) {
          const progress = step / steps;
          points.push({
            x: lastPoint.x + (x - lastPoint.x) * progress,
            y: lastPoint.y + (y - lastPoint.y) * progress,
            at: now,
          });
        }
      } else {
        points.push({ x, y, at: now });
      }
      if (points.length > 52) points.splice(0, points.length - 52);
      lastPoint = { x, y };
      requestCleanFrame();
    };

    const moveCleanReveal = (event) => {
      if (!enabled || fullReveal || event.pointerType === 'touch') return;
      if (event.target instanceof Element && event.target.closest('.landing-clean-toggle')) return;
      const rect = frame.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      if (!width || !height) resizeCleanReveal();
      const x = (event.clientX - rect.left) * (width / rect.width);
      const y = (event.clientY - rect.top) * (height / rect.height);
      frame.dataset.cleanActive = 'true';
      frame.style.setProperty('--clean-x', x + 'px');
      frame.style.setProperty('--clean-y', y + 'px');
      addCleanPoint(x, y, performance.now());
    };

    const leaveCleanReveal = () => {
      frame.dataset.cleanActive = 'false';
      lastPoint = null;
      requestCleanFrame();
    };

    const syncCleanCapability = () => {
      enabled = finePointer.matches && !reducedMotion.matches;
      if (enabled) scheduleCleanResize();
      else releaseCleanReveal();
    };

    if (enabled) resizeCleanReveal();
    frame.addEventListener('pointerenter', moveCleanReveal);
    frame.addEventListener('pointermove', moveCleanReveal);
    frame.addEventListener('pointerleave', leaveCleanReveal);
    toggle.addEventListener('click', () => setFullReveal(!fullReveal));
    window.addEventListener('resize', scheduleCleanResize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearCleanReveal();
    });
    if (typeof reducedMotion.addEventListener === 'function') reducedMotion.addEventListener('change', syncCleanCapability);
    if (typeof finePointer.addEventListener === 'function') finePointer.addEventListener('change', syncCleanCapability);
  };

  initCleanReveal();

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
  const resourceHotspots = Array.from(document.querySelectorAll('[data-resource-hotspot]'));
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
    resourceHotspots.forEach((hotspot) => {
      hotspot.setAttribute('aria-pressed', hotspot.dataset.resourceHotspot === resource ? 'true' : 'false');
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

  resourceHotspots.forEach((hotspot) => {
    const activateHotspot = () => {
      const tab = resourceTabs.find((candidate) => candidate.dataset.resourceTab === hotspot.dataset.resourceHotspot);
      if (tab) activateResource(tab, false);
    };
    hotspot.addEventListener('click', activateHotspot);
    hotspot.addEventListener('focus', activateHotspot);
    hotspot.addEventListener('pointerenter', () => {
      if (finePointer.matches) activateHotspot();
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

  let loginTrigger = null;
  const setLoginUrlState = (open) => {
    if (!window.history || typeof window.history.replaceState !== 'function') return;
    const url = new URL(location.href);
    if (open) url.searchParams.set('login', '1');
    else url.searchParams.delete('login');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  };
  const openCustomerLogin = (trigger, updateUrl) => {
    if (!loginDialog || typeof loginDialog.showModal !== 'function') return false;
    loginTrigger = trigger && menu.contains(trigger) ? menuButton : trigger || document.activeElement;
    setMenuOpen(false, false);
    if (customerAccessRoot) customerAccessRoot.dataset.customerAccessRequested = 'true';
    if (!loginDialog.open) loginDialog.showModal();
    if (updateUrl) setLoginUrlState(true);
    window.dispatchEvent(new Event('customer-access:open'));
    return true;
  };

  document.querySelectorAll('[data-customer-login]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (openCustomerLogin(event.currentTarget, true)) event.preventDefault();
    });
  });

  if (loginDialog) {
    loginDialog.addEventListener('click', (event) => {
      if (event.target === loginDialog) loginDialog.close();
    });
    loginDialog.addEventListener('close', () => {
      if (customerAccessRoot) customerAccessRoot.dataset.customerAccessRequested = 'false';
      window.dispatchEvent(new Event('customer-access:close'));
      setLoginUrlState(false);
      if (loginTrigger && typeof loginTrigger.focus === 'function') loginTrigger.focus();
      loginTrigger = null;
    });
    if (new URL(location.href).searchParams.get('login') === '1') {
      window.addEventListener('load', () => openCustomerLogin(null, false), { once: true });
    }
  }

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
