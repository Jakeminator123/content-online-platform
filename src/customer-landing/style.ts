export const customerLandingCss = String.raw`
:root {
  color-scheme: dark;
  --landing-navy: #0b1c2d;
  --landing-navy-deep: #06131f;
  --landing-cyan: #38b8e0;
  --landing-paper: #f3f1ea;
  --landing-ink: #16242d;
  --landing-rule: rgba(255, 255, 255, 0.2);
  font-family: Inter, "Helvetica Neue", Arial, sans-serif;
  background: var(--landing-navy);
  color: #fff;
}

* { box-sizing: border-box; }
html { min-width: 320px; scroll-behavior: smooth; }
body { min-height: 100svh; margin: 0; overflow-x: hidden; background: var(--landing-navy); color: #fff; }
body[data-menu-open="true"] { overflow: hidden; }
a { color: inherit; text-decoration: none; }
button, a { touch-action: manipulation; }
button { color: inherit; font: inherit; }
img, video { display: block; max-width: 100%; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.skip-link {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 100;
  padding: 10px 14px;
  border-radius: 999px;
  background: #fff;
  color: var(--landing-ink);
  transform: translateY(-180%);
}
.skip-link:focus { transform: translateY(0); }

.landing-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 82px;
  padding: 15px clamp(18px, 4vw, 64px);
  border-bottom: 1px solid transparent;
  transition: background-color 180ms ease, border-color 180ms ease, backdrop-filter 180ms ease;
}
.landing-header[data-scrolled="true"] {
  border-color: var(--landing-rule);
  background: rgba(6, 19, 31, 0.84);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
}
.landing-brand { display: inline-flex; align-items: center; gap: 12px; min-width: 0; }
.landing-brand-mark {
  width: 44px;
  height: 44px;
  overflow: hidden;
  flex: none;
  border-radius: 13px;
  background: var(--landing-cyan);
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.28);
}
.landing-brand-mark img { width: 100%; height: 100%; object-fit: cover; }
.landing-brand-name { font-size: 15px; font-weight: 700; letter-spacing: 0.08em; }
.landing-brand-name strong { font-weight: 400; text-transform: lowercase; letter-spacing: -0.03em; }

.landing-nav { display: flex; align-items: center; gap: clamp(18px, 3vw, 44px); margin-left: auto; margin-right: 30px; }
.landing-nav a { color: rgba(255, 255, 255, 0.72); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.landing-nav a:hover, .landing-nav a:focus-visible { color: #fff; }
.landing-nav-login { display: none; }
.landing-header-actions { display: flex; align-items: center; gap: 12px; }
.landing-login {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 0 20px;
  border-radius: 999px;
  background: var(--landing-cyan);
  color: #071824;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.1em;
  box-shadow: 0 12px 30px rgba(3, 15, 24, 0.25);
  transition: transform 180ms ease, background-color 180ms ease;
}
.landing-login:hover, .landing-login:focus-visible { background: #fff; transform: translateY(-2px); }
.landing-menu-button {
  display: grid;
  width: 48px;
  height: 48px;
  cursor: pointer;
  place-content: center;
  gap: 6px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 50%;
  background: rgba(7, 24, 36, 0.66);
}
.landing-menu-button > span[aria-hidden] { display: block; width: 18px; height: 1px; background: currentColor; transition: transform 180ms ease; }
.landing-menu-button[aria-expanded="true"] > span[aria-hidden]:nth-of-type(2) { transform: translateY(3.5px) rotate(45deg); }
.landing-menu-button[aria-expanded="true"] > span[aria-hidden]:nth-of-type(3) { transform: translateY(-3.5px) rotate(-45deg); }

.landing-enhanced .landing-nav {
  position: fixed;
  inset: 0;
  z-index: -1;
  display: flex;
  margin: 0;
  padding: 130px clamp(28px, 7vw, 110px) 60px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  background: rgba(6, 19, 31, .98);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 180ms ease, visibility 180ms ease;
}
.landing-enhanced .landing-nav[data-open="true"] { opacity: 1; visibility: visible; pointer-events: auto; }
.landing-enhanced .landing-nav a,
.landing-enhanced .landing-nav a:not(.landing-nav-login) {
  display: block;
  color: #fff;
  font-size: clamp(34px, 6vw, 82px);
  letter-spacing: -.05em;
  text-transform: uppercase;
}
.landing-enhanced .landing-nav-login { color: var(--landing-cyan) !important; }

.landing-hero {
  position: relative;
  display: grid;
  min-height: 100svh;
  overflow: hidden;
  isolation: isolate;
  background: var(--landing-navy-deep);
}
.landing-hero-image, .landing-hero-shade, .landing-hero-grid { position: absolute; inset: 0; width: 100%; height: 100%; }
.landing-hero-image { z-index: -4; object-fit: cover; object-position: center; filter: grayscale(1) saturate(0.2) contrast(1.08); }
.landing-hero-shade {
  z-index: -3;
  background: linear-gradient(90deg, rgba(5, 17, 28, 0.95) 0%, rgba(7, 25, 39, 0.74) 52%, rgba(8, 28, 44, 0.86) 100%), linear-gradient(0deg, rgba(4, 15, 24, 0.65), transparent 50%);
}
.landing-hero-grid {
  z-index: -2;
  opacity: 0.16;
  background-image: linear-gradient(rgba(255,255,255,.11) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.11) 1px, transparent 1px);
  background-size: clamp(70px, 8vw, 130px) clamp(70px, 8vw, 130px);
  mask-image: linear-gradient(to bottom, rgba(0,0,0,.35), transparent 74%);
}
.landing-hero-content {
  display: flex;
  width: min(100%, 1680px);
  min-height: 100svh;
  margin: 0 auto;
  padding: clamp(130px, 18vh, 190px) clamp(22px, 6vw, 96px) clamp(40px, 7vh, 78px);
  flex-direction: column;
  justify-content: flex-end;
}
.landing-kicker, .landing-eyebrow { margin: 0; color: var(--landing-cyan); font-size: 11px; font-weight: 800; letter-spacing: 0.24em; }
.landing-hero h1 {
  max-width: 1250px;
  margin: 22px 0 0;
  font-size: clamp(58px, 10.6vw, 174px);
  font-weight: 850;
  letter-spacing: -0.065em;
  line-height: 0.76;
  text-transform: uppercase;
}
.landing-hero h1 span { color: var(--landing-cyan); font-weight: 400; font-style: italic; letter-spacing: -0.075em; }
.landing-hero-foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; margin-top: clamp(42px, 8vh, 88px); }
.landing-hero-foot > p { max-width: 480px; margin: 0; color: rgba(255,255,255,.7); font-size: clamp(14px, 1.3vw, 18px); line-height: 1.6; }
.landing-circle-link {
  display: grid;
  width: 92px;
  height: 92px;
  flex: none;
  place-content: center;
  gap: 7px;
  border: 1px solid rgba(255,255,255,.45);
  border-radius: 50%;
  text-align: center;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .12em;
}
.landing-circle-link:hover, .landing-circle-link:focus-visible { border-color: var(--landing-cyan); color: var(--landing-cyan); }

.landing-intro { padding: clamp(80px, 12vw, 180px) clamp(22px, 6vw, 96px); background: var(--landing-paper); color: var(--landing-ink); }
.landing-section-label { display: flex; align-items: center; gap: 15px; color: #66757d; font-size: 10px; font-weight: 800; letter-spacing: .18em; }
.landing-section-label span { display: grid; width: 31px; height: 31px; place-content: center; border: 1px solid #aab2b5; border-radius: 50%; }
.landing-section-label p { margin: 0; }
.landing-intro-copy { display: grid; grid-template-columns: minmax(160px, .65fr) minmax(380px, 1.7fr) minmax(260px, .8fr); align-items: end; gap: 40px; margin-top: clamp(50px, 8vw, 115px); }
.landing-intro-copy .landing-eyebrow { align-self: start; padding-top: 12px; color: #347c91; }
.landing-intro h2 { margin: 0; font-size: clamp(44px, 6vw, 94px); letter-spacing: -.06em; line-height: .96; }
.landing-intro h2 em { color: #2b748a; font-family: Georgia, serif; font-weight: 400; }
.landing-lead { margin: 0; color: #596871; font-size: 16px; line-height: 1.72; }
.landing-offer-grid { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: clamp(70px, 10vw, 140px); border-top: 1px solid #bec5c6; }
.landing-offer-grid article { min-height: 300px; padding: 27px clamp(20px, 3vw, 45px) 35px 0; border-right: 1px solid #bec5c6; }
.landing-offer-grid article + article { padding-left: clamp(20px, 3vw, 45px); }
.landing-offer-grid article:last-child { border-right: 0; }
.landing-offer-grid article > span { color: #78878d; font-size: 11px; }
.landing-offer-grid h3 { margin: 110px 0 15px; font-size: clamp(25px, 3vw, 40px); letter-spacing: -.04em; }
.landing-offer-grid p { max-width: 330px; margin: 0; color: #617078; font-size: 14px; line-height: 1.65; }

.landing-statement { position: relative; padding: clamp(90px, 12vw, 180px) clamp(22px, 6vw, 96px); background: var(--landing-navy); }
.landing-statement-rule { width: 100%; height: 1px; margin-bottom: 38px; background: var(--landing-rule); }
.landing-statement h2 { max-width: 1280px; margin: clamp(45px, 7vw, 100px) 0 0; font-size: clamp(54px, 9vw, 142px); letter-spacing: -.065em; line-height: .84; }
.landing-statement h2 span { color: var(--landing-cyan); font-family: Georgia, serif; font-style: italic; font-weight: 400; }
.landing-statement-copy { display: flex; justify-content: flex-end; align-items: flex-end; gap: clamp(35px, 8vw, 120px); margin-top: clamp(60px, 8vw, 110px); }
.landing-statement-copy p { max-width: 480px; margin: 0; color: rgba(255,255,255,.67); line-height: 1.7; }
.landing-statement-copy a { padding-bottom: 8px; border-bottom: 1px solid var(--landing-cyan); color: var(--landing-cyan); font-size: 12px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }

.landing-band { display: flex; min-height: 160px; align-items: center; justify-content: center; gap: clamp(12px, 2.3vw, 36px); padding: 30px; overflow: hidden; background: var(--landing-cyan); color: #071824; }
.landing-band p { margin: 0; font-size: clamp(20px, 3vw, 48px); font-weight: 900; letter-spacing: -.04em; white-space: nowrap; }
.landing-band span { font-size: 32px; opacity: .45; }

.landing-footer { padding: clamp(70px, 9vw, 130px) clamp(22px, 6vw, 96px) 30px; background: var(--landing-navy-deep); }
.landing-footer-main { display: flex; align-items: flex-start; justify-content: space-between; gap: 50px; min-height: 390px; }
.landing-footer-mark { display: block; width: 82px; height: 82px; margin-bottom: 24px; overflow: hidden; border-radius: 22px; background: var(--landing-cyan); }
.landing-footer-mark img { width: 100%; height: 100%; object-fit: cover; }
.landing-footer-title { margin: 0; text-align: right; font-size: clamp(50px, 9vw, 140px); font-weight: 850; letter-spacing: -.07em; line-height: .8; }
.landing-footer-title span { color: var(--landing-cyan); font-family: Georgia, serif; font-style: italic; font-weight: 400; }
.landing-footer-row { display: flex; align-items: center; justify-content: space-between; gap: 25px; padding-top: 24px; border-top: 1px solid var(--landing-rule); color: rgba(255,255,255,.58); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
.landing-footer-row nav { display: flex; gap: 25px; }
.landing-footer-row a:hover, .landing-footer-row a:focus-visible { color: #fff; }

:focus-visible { outline: 3px solid #fff; outline-offset: 4px; }

@media (max-width: 900px) {
  .landing-nav { gap: 18px; }
  .landing-enhanced .landing-menu-button { display: grid; }
  .landing-enhanced .landing-nav {
    position: fixed;
    inset: 0;
    z-index: -1;
    display: flex;
    margin: 0;
    padding: 130px 28px 50px;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    background: rgba(6, 19, 31, .98);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 180ms ease, visibility 180ms ease;
  }
  .landing-enhanced .landing-nav[data-open="true"] { opacity: 1; visibility: visible; pointer-events: auto; }
  .landing-enhanced .landing-nav a, .landing-enhanced .landing-nav a:not(.landing-nav-login) { display: block; color: #fff; font-size: clamp(30px, 8vw, 52px); letter-spacing: -.04em; text-transform: uppercase; }
  .landing-enhanced .landing-nav-login { color: var(--landing-cyan) !important; }
  .landing-intro-copy { grid-template-columns: 1fr; }
  .landing-intro-copy .landing-eyebrow { padding: 0; }
  .landing-offer-grid { grid-template-columns: 1fr; }
  .landing-offer-grid article, .landing-offer-grid article + article { min-height: 0; padding: 25px 0 34px; border-right: 0; border-bottom: 1px solid #bec5c6; }
  .landing-offer-grid article:last-child { border-bottom: 0; }
  .landing-offer-grid h3 { margin-top: 50px; }
  .landing-statement-copy { align-items: flex-start; flex-direction: column; }
  .landing-footer-main { min-height: 330px; flex-direction: column; }
  .landing-footer-title { align-self: flex-end; }
}

@media (max-width: 600px) {
  .landing-header { min-height: 72px; }
  .landing-brand-name { display: none; }
  .landing-brand-mark { width: 40px; height: 40px; }
  .landing-login { min-height: 43px; padding: 0 15px; }
  .landing-menu-button { width: 43px; height: 43px; }
  .landing-hero-content { justify-content: center; padding-top: 120px; }
  .landing-hero h1 { line-height: .84; }
  .landing-hero-foot { align-items: flex-start; flex-direction: column; }
  .landing-circle-link { width: 76px; height: 76px; }
  .landing-band { justify-content: flex-start; overflow-x: auto; }
  .landing-footer-row { align-items: flex-start; flex-direction: column; }
  .landing-footer-row nav { align-items: flex-start; flex-direction: column; gap: 13px; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
`;
