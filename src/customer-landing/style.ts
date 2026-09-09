export const customerLandingCss = String.raw`
@font-face {
  font-family: "Mona Sans";
  src: url("/customer-landing/MonaSans-Variable.woff2") format("woff2");
  font-weight: 200 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Brier";
  src: url("/customer-landing/Brier-Bold.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root {
  --co-navy: #0f1e33;
  --co-navy-deep: #091523;
  --co-cyan: #38b8e0;
  --co-paper: #f5f1e8;
  --co-white: #ffffff;
  --co-ink: #17191b;
  --co-muted: #677078;
  --co-rule-dark: rgba(255, 255, 255, 0.17);
  --co-rule-light: rgba(15, 30, 51, 0.2);
  color: var(--co-white);
  font-family: "Mona Sans", "Helvetica Neue", Arial, sans-serif;
  font-synthesis: none;
  background: var(--co-navy);
}

* { box-sizing: border-box; }
html { min-width: 320px; scroll-behavior: smooth; }
body {
  min-width: 320px;
  min-height: 100svh;
  margin: 0;
  overflow-x: clip;
  background: var(--co-navy);
  color: var(--co-white);
}
body[data-menu-open="true"] { overflow: hidden; }
a { color: inherit; text-decoration: none; }
button, a { touch-action: manipulation; }
button { color: inherit; font: inherit; }
img, svg { display: block; max-width: 100%; }
h1, h2, h3, p, figure { margin-top: 0; }

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
  z-index: 120;
  padding: 11px 16px;
  border-radius: 8px;
  background: var(--co-white);
  color: var(--co-navy);
  font-size: 13px;
  font-weight: 800;
  transform: translateY(-180%);
}
.skip-link:focus { transform: translateY(0); }

.landing-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 60;
  display: flex;
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  padding: 10px clamp(16px, 3.2vw, 48px);
  transition: background-color 180ms ease, border-color 180ms ease;
}
.landing-header[data-scrolled="true"] {
  border-bottom: 1px solid var(--co-rule-dark);
  background: rgba(9, 21, 35, 0.82);
}

.landing-brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}
.landing-brand-mark {
  width: 42px;
  height: 42px;
  overflow: hidden;
  flex: none;
  border-radius: 10px;
  background: var(--co-cyan);
  box-shadow: 0 10px 30px rgba(3, 13, 23, 0.24);
}
.landing-brand-mark img { width: 100%; height: 100%; object-fit: cover; }
.landing-brand-name {
  color: var(--co-white);
  font-size: 15px;
  font-weight: 670;
  letter-spacing: 0.035em;
  text-shadow: 0 1px 16px rgba(0, 0, 0, 0.5);
}
.landing-brand-name strong { font-weight: 860; text-transform: lowercase; letter-spacing: -0.03em; }

.landing-nav {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-left: auto;
  margin-right: 25px;
}
.landing-nav a {
  color: rgba(255, 255, 255, 0.72);
  font-size: 11px;
  font-weight: 790;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}
.landing-nav a:hover, .landing-nav a:focus-visible { color: var(--co-white); }
.landing-nav-login { display: none; }

.landing-header-actions { display: flex; align-items: center; gap: 10px; }
.landing-login {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 17px;
  border-radius: 10px;
  background: var(--co-cyan);
  color: #081723;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.1em;
  box-shadow: 0 10px 25px rgba(3, 15, 24, 0.22);
  transition: transform 180ms ease, background-color 180ms ease;
}
.landing-login:hover, .landing-login:focus-visible { background: var(--co-white); transform: translateY(-2px); }

.landing-menu-button {
  display: none;
  width: 46px;
  height: 46px;
  cursor: pointer;
  place-content: center;
  gap: 5px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 10px;
  background: rgba(8, 23, 36, 0.83);
}
.landing-enhanced .landing-menu-button { display: grid; }
.landing-menu-button > span[aria-hidden] {
  display: block;
  width: 19px;
  height: 1.5px;
  background: currentColor;
  transition: opacity 180ms ease, transform 180ms ease;
}
.landing-menu-button[aria-expanded="true"] > span[aria-hidden]:nth-of-type(2) { transform: translateY(6.5px) rotate(45deg); }
.landing-menu-button[aria-expanded="true"] > span[aria-hidden]:nth-of-type(3) { opacity: 0; }
.landing-menu-button[aria-expanded="true"] > span[aria-hidden]:nth-of-type(4) { transform: translateY(-6.5px) rotate(-45deg); }

.landing-enhanced .landing-nav {
  position: fixed;
  inset: 0;
  z-index: -1;
  display: flex;
  margin: 0;
  padding: 112px clamp(26px, 8vw, 120px) 55px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  background: rgba(9, 21, 35, 0.985);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 220ms ease, visibility 0s linear 220ms;
}
.landing-enhanced .landing-nav[data-open="true"] {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition-delay: 0s;
}
.landing-enhanced .landing-nav a {
  display: block;
  color: var(--co-white);
  font-size: clamp(38px, 6.4vw, 92px);
  font-weight: 850;
  letter-spacing: -0.055em;
  line-height: 0.9;
  text-transform: uppercase;
}
.landing-enhanced .landing-nav a:hover, .landing-enhanced .landing-nav a:focus-visible {
  color: var(--co-cyan);
  transform: translateX(10px);
}
.landing-enhanced .landing-nav-login { color: var(--co-cyan); }

.landing-hero-scroll {
  position: relative;
  height: 240svh;
  background: var(--co-navy);
}
.landing-hero-stage {
  position: sticky;
  top: 0;
  display: grid;
  width: 100%;
  height: 100svh;
  overflow: hidden;
  place-items: center;
  background: var(--co-navy);
  isolation: isolate;
}
.landing-marquee {
  position: absolute;
  inset: 0;
  z-index: -1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(16px, 3vw, 40px);
  overflow: hidden;
  opacity: 0;
  transition: opacity 80ms linear;
  will-change: opacity, transform;
}
.landing-marquee-line {
  display: flex;
  width: max-content;
  white-space: nowrap;
  font-size: clamp(58px, 9vw, 154px);
  font-weight: 900;
  letter-spacing: -0.065em;
  line-height: 0.78;
  text-transform: uppercase;
  animation: landing-marquee-left 22s linear infinite;
}
.landing-marquee-line-a { color: var(--co-cyan); font-family: "Brier", "Mona Sans", sans-serif; }
.landing-marquee-line-b { color: var(--co-white); animation-direction: reverse; animation-duration: 28s; }
.landing-marquee-line span { display: block; }
@keyframes landing-marquee-left { to { transform: translateX(-50%); } }

.landing-portrait {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 0;
  background: var(--co-ink);
  box-shadow: 0 35px 90px rgba(2, 8, 14, 0.46);
  transform-origin: 50% 50%;
  will-change: transform, border-radius, opacity;
}
.landing-hero-image {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 45%;
  filter: grayscale(1) contrast(1.03);
  animation: landing-image-arrive 1.1s cubic-bezier(0.16, 0.82, 0.25, 1) both;
}
.landing-hero-reveal-aura {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: radial-gradient(circle clamp(130px, 19vw, 285px) at var(--reveal-x, 50%) var(--reveal-y, 50%), rgba(56, 184, 224, 0.32), rgba(25, 84, 166, 0.12) 48%, transparent 72%);
  mix-blend-mode: screen;
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease;
}
.landing-portrait[data-reveal-active="true"] .landing-hero-reveal-aura { opacity: 1; }
.landing-hero-reveal {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
@keyframes landing-image-arrive {
  from { opacity: 0; transform: scale(1.035); }
  to { opacity: 1; transform: scale(1); }
}
.landing-hero-vignette {
  position: absolute;
  inset: 0;
  z-index: 3;
  background: linear-gradient(180deg, rgba(5, 12, 19, 0.2), transparent 26%, transparent 62%, rgba(5, 12, 19, 0.52));
  pointer-events: none;
}
.landing-portrait h1 {
  position: absolute;
  left: clamp(18px, 3.2vw, 48px);
  bottom: clamp(22px, 4vw, 50px);
  z-index: 4;
  max-width: 270px;
  margin: 0;
  color: var(--co-white);
  font-size: clamp(15px, 1.45vw, 23px);
  font-weight: 900;
  letter-spacing: 0.055em;
  line-height: 1;
  text-transform: uppercase;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.48);
}
.landing-scroll-cue {
  position: absolute;
  right: clamp(18px, 3.2vw, 48px);
  bottom: clamp(22px, 4vw, 50px);
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: rgba(255, 255, 255, 0.74);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}
.landing-scroll-cue span { color: var(--co-cyan); font-size: 20px; }

.landing-mission {
  display: flex;
  min-height: 100svh;
  align-items: center;
  justify-content: center;
  padding: clamp(90px, 11vw, 170px) clamp(20px, 5vw, 80px);
  flex-direction: column;
  background: var(--co-navy);
  text-align: center;
}
.landing-book-icon { width: 58px; margin-bottom: clamp(45px, 6vw, 90px); color: var(--co-cyan); }
.landing-mission h2 {
  max-width: 1440px;
  margin: 0;
  font-size: clamp(38px, 6.7vw, 108px);
  font-weight: 880;
  letter-spacing: -0.055em;
  line-height: 0.94;
  text-transform: uppercase;
}
.landing-mission h2 span { color: var(--co-cyan); font-family: "Brier", "Mona Sans", sans-serif; }

.landing-gallery {
  padding: clamp(85px, 11vw, 170px) clamp(18px, 4vw, 64px);
  background: var(--co-paper);
  color: var(--co-ink);
}
.landing-section-heading, .landing-resources-heading, .landing-collections-heading, .landing-institutions-heading {
  width: min(100%, 1480px);
  margin: 0 auto;
}
.landing-section-heading > p, .landing-resources-heading > p:first-child, .landing-collections-heading > p, .landing-institutions-heading > p {
  margin-bottom: 34px;
  color: #4b7e90;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.2em;
}
.landing-section-heading h2, .landing-institutions-heading h2 {
  margin-bottom: clamp(60px, 9vw, 125px);
  font-size: clamp(55px, 9vw, 145px);
  font-weight: 880;
  letter-spacing: -0.07em;
  line-height: 0.78;
}
.landing-section-heading h2 span, .landing-institutions-heading h2 span {
  color: #297d96;
  font-family: "Brier", "Mona Sans", sans-serif;
}
.landing-gallery-grid {
  display: grid;
  width: min(100%, 1480px);
  margin: 0 auto;
  grid-template-columns: 0.78fr 1.08fr 0.88fr;
  grid-template-rows: repeat(2, minmax(250px, 33vw));
  gap: clamp(12px, 2vw, 30px);
}
.landing-gallery-card {
  position: relative;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  border-radius: 18px;
  background: #d8d8d2;
  box-shadow: 0 25px 60px rgba(20, 28, 33, 0.12);
}
.landing-gallery-card-tall { grid-row: span 2; }
.landing-gallery-card-wide { grid-column: span 2; }
.landing-gallery-card-offset { transform: translateY(7vw); }
.landing-gallery-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: none;
  transition: filter 450ms ease, transform 700ms cubic-bezier(.2,.72,.2,1);
}
.landing-gallery-card:hover img { transform: scale(1.035); }
.landing-gallery-card figcaption {
  position: absolute;
  left: 15px;
  bottom: 15px;
  padding: 9px 12px;
  border-radius: 7px;
  background: rgba(9, 21, 35, 0.88);
  color: var(--co-white);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.landing-resources {
  padding: clamp(95px, 12vw, 180px) clamp(18px, 5vw, 80px);
  background: var(--co-white);
  color: var(--co-ink);
}
.landing-resources-heading {
  display: grid;
  grid-template-columns: 0.45fr 1.3fr 0.55fr;
  align-items: end;
  gap: 35px;
}
.landing-resources-heading > p:first-child { align-self: start; padding-top: 12px; }
.landing-resources-heading h2 {
  margin: 0;
  font-size: clamp(64px, 9.4vw, 152px);
  font-weight: 900;
  letter-spacing: -0.075em;
  line-height: 0.72;
}
.landing-resources-heading h2 span { font-family: "Brier", "Mona Sans", sans-serif; font-size: 0.73em; }
.landing-resources-intro { margin: 0; color: var(--co-muted); font-size: 16px; line-height: 1.65; }

.landing-resource-explorer {
  display: grid;
  width: min(100%, 1480px);
  margin: clamp(70px, 10vw, 145px) auto 0;
  grid-template-columns: minmax(0, 1.15fr) minmax(380px, .85fr);
  gap: clamp(35px, 6vw, 90px);
  align-items: stretch;
}
.landing-resource-visual {
  position: relative;
  min-height: 620px;
  overflow: hidden;
  border-radius: 24px;
  background: var(--co-paper);
}
.landing-resource-visual img { width: 100%; height: 100%; object-fit: cover; }
.landing-resource-hotspots {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}
.landing-resource-hotspot {
  position: absolute;
  top: var(--spot-y);
  left: var(--spot-x);
  width: 52px;
  height: 52px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--co-cyan);
  cursor: pointer;
  pointer-events: auto;
  transform: translate(-50%, -50%);
  isolation: isolate;
}
.landing-resource-hotspot::before,
.landing-resource-hotspot::after {
  position: absolute;
  inset: 5px;
  border: 1px solid currentColor;
  border-radius: inherit;
  content: "";
  opacity: .42;
}
.landing-resource-hotspot::after { inset: -5px; opacity: .18; }
.landing-resource-hotspot > span {
  position: absolute;
  inset: 21px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 4px rgba(255,255,255,.72), 0 0 22px rgba(56,184,224,.75);
}
.landing-resource-hotspot[aria-pressed="true"] {
  color: #148aae;
  filter: drop-shadow(0 0 12px rgba(56,184,224,.48));
}
.landing-resource-hotspot[aria-pressed="true"]::before {
  inset: -12px;
  border-width: 2px;
  opacity: .72;
}
@keyframes landing-hotspot-pulse {
  from { transform: scale(.72); opacity: .65; }
  to { transform: scale(1.45); opacity: 0; }
}
.landing-resource-content { display: flex; min-width: 0; flex-direction: column; }
.landing-resource-tabs { border-top: 1px solid var(--co-rule-light); }
.landing-resource-tabs button {
  display: grid;
  width: 100%;
  min-height: 70px;
  cursor: pointer;
  grid-template-columns: 56px 1fr;
  align-items: center;
  border: 0;
  border-bottom: 1px solid var(--co-rule-light);
  background: transparent;
  color: #8b9094;
  text-align: left;
  font-size: clamp(22px, 2.4vw, 39px);
  font-weight: 760;
  letter-spacing: -0.045em;
  transition: color 180ms ease, padding-left 180ms ease;
}
.landing-resource-tabs button span { color: #8b9094; font-size: 10px; font-weight: 800; letter-spacing: .08em; }
.landing-resource-tabs button[aria-selected="true"] { padding-left: 12px; color: var(--co-navy); }
.landing-resource-tabs button[aria-selected="true"] span { color: #2d899f; }
.landing-resource-panels {
  position: relative;
  flex: 1;
  min-height: 245px;
  padding-top: 42px;
}
.landing-resource-panels article[hidden] { display: none; }
.landing-resource-number { margin-bottom: 30px; color: #2d899f; font-size: 11px; font-weight: 850; letter-spacing: .13em; }
.landing-resource-panels h3 {
  margin-bottom: 16px;
  color: var(--co-navy);
  font-size: clamp(38px, 4.6vw, 68px);
  letter-spacing: -.055em;
}
.landing-resource-panels article > p:last-child { max-width: 510px; margin: 0; color: var(--co-muted); font-size: 17px; line-height: 1.7; }

.landing-collections {
  padding: clamp(95px, 12vw, 180px) clamp(18px, 5vw, 80px);
  background: #07090a;
}
.landing-collections-heading h2 {
  margin-bottom: clamp(65px, 9vw, 125px);
  font-size: clamp(52px, 8.5vw, 136px);
  font-weight: 880;
  letter-spacing: -.07em;
  line-height: .82;
}
.landing-collections-heading h2 span { color: var(--co-cyan); font-family: "Brier", "Mona Sans", sans-serif; }
.landing-collections-grid {
  display: grid;
  width: min(100%, 1480px);
  margin: 0 auto;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid rgba(255,255,255,.18);
}
.landing-collections-grid article {
  display: flex;
  min-height: 370px;
  padding: 25px clamp(18px, 2.5vw, 36px) 34px;
  flex-direction: column;
  border-right: 1px solid rgba(255,255,255,.18);
  transition: background-color 220ms ease, color 220ms ease;
}
.landing-collections-grid article:first-child { padding-left: 0; }
.landing-collections-grid article:last-child { border-right: 0; }
.landing-collections-grid article:hover { background: var(--co-cyan); color: #081723; }
.landing-collections-grid article > span { color: rgba(255,255,255,.4); font-size: 10px; }
.landing-collections-grid h3 { margin: auto 0 16px; font-size: clamp(25px, 2.4vw, 36px); letter-spacing: -.04em; }
.landing-collections-grid p { margin: 0; color: rgba(255,255,255,.57); line-height: 1.65; }
.landing-collections-grid article:hover p, .landing-collections-grid article:hover > span { color: rgba(8,23,35,.72); }

.landing-clean {
  padding: clamp(95px, 11vw, 170px) clamp(18px, 5vw, 80px);
  background: var(--co-navy-deep);
  color: var(--co-white);
}
.landing-clean-inner {
  display: grid;
  width: min(100%, 1480px);
  margin: 0 auto;
  grid-template-columns: minmax(290px, .72fr) minmax(460px, 1fr);
  gap: clamp(50px, 9vw, 150px);
  align-items: center;
}
.landing-clean-copy > p:first-child {
  margin-bottom: 34px;
  color: var(--co-cyan);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: .2em;
}
.landing-clean-copy h2 {
  margin-bottom: 34px;
  font-size: clamp(52px, 7vw, 112px);
  font-weight: 880;
  letter-spacing: -.07em;
  line-height: .82;
}
.landing-clean-copy h2 span { color: var(--co-cyan); font-family: "Brier", "Mona Sans", sans-serif; }
.landing-clean-copy > p:last-child { max-width: 470px; margin: 0; color: rgba(255,255,255,.63); font-size: 17px; line-height: 1.7; }
.landing-clean-frame {
  position: relative;
  width: min(100%, 700px);
  aspect-ratio: 1;
  margin: 0;
  justify-self: end;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 30px;
  background: #101417;
  box-shadow: 0 35px 100px rgba(0,0,0,.34);
}
.landing-clean-image,
.landing-clean-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.landing-clean-image { transition: filter 260ms ease; }
.landing-clean-canvas { z-index: 1; pointer-events: none; }
.landing-clean-brush {
  position: absolute;
  z-index: 2;
  top: var(--clean-y, 50%);
  left: var(--clean-x, 50%);
  display: grid;
  width: 88px;
  height: 88px;
  place-items: center;
  border: 1px solid rgba(56,184,224,.82);
  border-radius: 50%;
  background: rgba(9,21,35,.22);
  color: var(--co-cyan);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -50%) scale(.86);
  transition: opacity 150ms ease, transform 150ms ease;
}
.landing-clean-brush svg { width: 27px; height: 27px; }
.landing-clean-frame[data-clean-active="true"] .landing-clean-brush { opacity: 1; transform: translate(-50%, -50%) scale(1); }
.landing-clean-toggle {
  position: absolute;
  z-index: 4;
  top: 18px;
  right: 18px;
  display: none;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid rgba(255,255,255,.34);
  border-radius: 999px;
  background: rgba(9,21,35,.82);
  color: var(--co-white);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 760;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.landing-clean-frame[data-clean-enabled="true"] .landing-clean-toggle { display: block; }
.landing-clean-frame[data-clean-unlocked="true"] .landing-clean-image { filter: none !important; }
.landing-clean-frame[data-clean-unlocked="true"] .landing-clean-canvas,
.landing-clean-frame[data-clean-unlocked="true"] .landing-clean-brush { opacity: 0 !important; }
.landing-clean-frame figcaption {
  position: absolute;
  z-index: 3;
  right: 22px;
  bottom: 18px;
  left: 22px;
  margin: 0;
  color: rgba(255,255,255,.74);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  text-shadow: 0 2px 16px rgba(0,0,0,.85);
  pointer-events: none;
}
.landing-clean-pointer-hint { display: none; }

.landing-institutions {
  padding: clamp(95px, 11vw, 165px) clamp(18px, 4vw, 64px) clamp(110px, 14vw, 210px);
  overflow: hidden;
  background: var(--co-paper);
  color: var(--co-ink);
}
.landing-institutions-heading { text-align: center; }
.landing-institutions-heading > p { margin-bottom: 42px; }
.landing-card-fan {
  position: relative;
  width: min(100%, 1140px);
  height: clamp(470px, 55vw, 760px);
  margin: 0 auto;
}
.landing-card-fan figure {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: clamp(200px, 27vw, 390px);
  height: clamp(320px, 42vw, 590px);
  margin: 0;
  overflow: hidden;
  border: 5px solid var(--co-white);
  border-radius: 24px;
  background: #cfd1ce;
  box-shadow: 0 24px 60px rgba(20, 27, 31, .2);
  transform-origin: 50% 110%;
  transition: filter 300ms ease, transform 400ms cubic-bezier(.2,.72,.2,1);
}
.landing-card-fan figure:nth-child(1) { z-index: 1; transform: translateX(-122%) rotate(-15deg); }
.landing-card-fan figure:nth-child(2) { z-index: 2; transform: translateX(-88%) rotate(-7deg) translateY(-18px); }
.landing-card-fan figure:nth-child(3) { z-index: 5; transform: translateX(-50%) translateY(-34px); }
.landing-card-fan figure:nth-child(4) { z-index: 2; transform: translateX(-12%) rotate(7deg) translateY(-18px); }
.landing-card-fan figure:nth-child(5) { z-index: 1; transform: translateX(22%) rotate(15deg); }
.landing-card-fan figure:hover { z-index: 10; filter: saturate(1.08); }
.landing-card-fan figure:nth-child(1):hover { transform: translateX(-122%) rotate(-10deg) translateY(-36px); }
.landing-card-fan figure:nth-child(2):hover { transform: translateX(-88%) rotate(-3deg) translateY(-48px); }
.landing-card-fan figure:nth-child(3):hover { transform: translateX(-50%) translateY(-62px); }
.landing-card-fan figure:nth-child(4):hover { transform: translateX(-12%) rotate(3deg) translateY(-48px); }
.landing-card-fan figure:nth-child(5):hover { transform: translateX(22%) rotate(10deg) translateY(-36px); }
.landing-card-fan img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 450ms ease, transform 700ms cubic-bezier(.2,.72,.2,1);
}
.landing-card-fan figcaption {
  position: absolute;
  inset: auto 0 0;
  padding: 36px 18px 17px;
  background: linear-gradient(transparent, rgba(5, 12, 18, .82));
  color: var(--co-white);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: .13em;
  text-align: center;
  text-transform: uppercase;
}

.landing-access {
  padding: clamp(90px, 12vw, 180px) clamp(20px, 5vw, 80px);
  background: var(--co-cyan);
  color: #081723;
  text-align: center;
}
.landing-access > p { margin-bottom: 45px; font-size: 11px; font-weight: 850; letter-spacing: .2em; }
.landing-access h2 {
  margin-bottom: clamp(48px, 7vw, 90px);
  font-size: clamp(46px, 8.3vw, 132px);
  font-weight: 900;
  letter-spacing: -.07em;
  line-height: .82;
}
.landing-access h2 span { color: var(--co-white); font-family: "Brier", "Mona Sans", sans-serif; }
.landing-access > a {
  display: inline-flex;
  min-height: 58px;
  align-items: center;
  gap: 24px;
  padding: 0 24px;
  border-radius: 10px;
  background: var(--co-navy);
  color: var(--co-white);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .1em;
  text-transform: uppercase;
  transition: background-color 180ms ease, transform 180ms ease;
}
.landing-access > a:hover, .landing-access > a:focus-visible { background: #07090a; transform: translateY(-3px); }

.landing-footer {
  padding: 58px clamp(14px, 2.5vw, 38px) 20px;
  background: var(--co-cyan);
  color: #081723;
}
.landing-footer-card {
  display: grid;
  min-height: min(760px, 86svh);
  padding: clamp(45px, 6vw, 90px);
  grid-template-columns: .6fr 1.5fr .6fr;
  align-items: center;
  gap: 30px;
  overflow: hidden;
  border-radius: 42px 42px 120px 42px;
  background:
    radial-gradient(circle at 72% 40%, rgba(56,184,224,.15), transparent 34%),
    linear-gradient(145deg, #0f1e33, #081421);
  color: var(--co-white);
  box-shadow: 0 32px 80px rgba(9, 24, 38, .2);
}
.landing-footer-nav, .landing-footer-access { display: flex; flex-direction: column; gap: 10px; }
.landing-footer-nav a, .landing-footer-access a {
  font-size: clamp(16px, 1.6vw, 25px);
  font-weight: 780;
  letter-spacing: -.025em;
  text-transform: uppercase;
}
.landing-footer-nav a:hover, .landing-footer-access a:hover,
.landing-footer-nav a:focus-visible, .landing-footer-access a:focus-visible { color: var(--co-cyan); }
.landing-footer-center { position: relative; display: grid; min-height: 580px; place-items: center; }
.landing-footer-center > p {
  position: absolute;
  inset: 0;
  z-index: 0;
  margin: 0;
  color: rgba(255,255,255,.7);
  font-size: clamp(45px, 7vw, 112px);
  font-weight: 900;
  letter-spacing: -.07em;
  line-height: .82;
  text-align: center;
}
.landing-footer-center > p span { color: var(--co-cyan); font-family: "Brier", "Mona Sans", sans-serif; }
.landing-footer-logo {
  position: relative;
  z-index: 1;
  display: block;
  width: clamp(210px, 28vw, 405px);
  overflow: hidden;
  border-radius: clamp(28px, 4vw, 58px);
  background: var(--co-cyan);
  box-shadow: 0 35px 80px rgba(0,0,0,.34);
  transition: transform 400ms cubic-bezier(.2,.72,.2,1);
}
.landing-footer-logo:hover, .landing-footer-logo:focus-visible { transform: translateY(-8px) rotate(-.5deg); }
.landing-footer-logo img { width: 100%; height: auto; }
.landing-footer-access { text-align: right; }
.landing-footer-access a:first-child { color: var(--co-cyan); }
.landing-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 19px 14px 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .11em;
  text-transform: uppercase;
}
.landing-footer-row p { margin: 0; }

.landing-auth-dialog {
  width: min(calc(100vw - 30px), 490px);
  max-width: none;
  max-height: calc(100svh - 30px);
  padding: 0;
  overflow: visible;
  border: 0;
  border-radius: 24px;
  background: transparent;
  color: var(--co-navy);
  box-shadow: 0 38px 110px rgba(2, 10, 18, .48);
}
.landing-auth-dialog::backdrop {
  background: rgba(4, 12, 21, .72);
}
.landing-auth-dialog[open] { animation: landing-auth-enter 240ms cubic-bezier(.2,.72,.2,1); }
@keyframes landing-auth-enter {
  from { opacity: 0; transform: translateY(16px) scale(.975); }
  to { opacity: 1; transform: none; }
}
.landing-auth-shell {
  position: relative;
  max-height: calc(100svh - 30px);
  overflow: auto;
  border: 1px solid rgba(255,255,255,.7);
  border-radius: 24px;
  background:
    radial-gradient(circle at 88% 0, rgba(56,184,224,.14), transparent 32%),
    #fbfbfa;
}
.landing-auth-close-form { position: absolute; top: 14px; right: 14px; z-index: 2; margin: 0; }
.landing-auth-close {
  display: grid;
  width: 39px;
  height: 39px;
  cursor: pointer;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(15,30,51,.14);
  border-radius: 50%;
  background: rgba(255,255,255,.86);
  color: var(--co-navy);
  font-size: 25px;
  font-weight: 350;
  line-height: 1;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}
.landing-auth-close:hover, .landing-auth-close:focus-visible {
  border-color: rgba(15,30,51,.34);
  background: var(--co-white);
  transform: rotate(4deg);
}
.landing-auth-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 16px 60px 14px 20px;
  border-bottom: 1px solid rgba(15,30,51,.1);
}
.landing-auth-brand > span {
  width: 30px;
  height: 30px;
  overflow: hidden;
  border-radius: 9px;
  background: var(--co-cyan);
}
.landing-auth-brand img { width: 100%; height: 100%; object-fit: cover; }
.landing-auth-brand strong { font-size: 13px; font-style: normal; letter-spacing: .035em; }
.landing-auth-brand em { font-style: normal; font-weight: 860; letter-spacing: -.025em; text-transform: lowercase; }
.landing-auth-card { padding: clamp(24px, 5vw, 34px); }
.landing-auth-card h2 {
  margin: 0;
  color: var(--co-navy);
  font-family: "Mona Sans", "Helvetica Neue", Arial, sans-serif;
  font-size: clamp(30px, 7vw, 39px);
  font-weight: 840;
  letter-spacing: -.055em;
  line-height: 1;
}
.landing-auth-intro {
  max-width: 390px;
  margin: 10px 0 0;
  color: #66717a;
  font-size: 14px;
  line-height: 1.6;
}
.landing-auth-card .customer-access-message {
  min-height: 16px;
  margin: 8px 0 0;
  color: #66717a;
  font-size: 12px;
  line-height: 1.5;
}
#customer-auth-widget {
  display: grid;
  width: 100%;
  margin-top: 8px;
  justify-items: stretch;
}
#customer-auth-widget > *,
#customer-auth-widget :where(.cl-rootBox, .cl-cardBox, .cl-card) { width: 100%; max-width: none; }
.landing-auth-card .portal-chooser { margin-top: 24px; }
.landing-auth-card .portal-chooser h3 {
  margin: 0 0 11px;
  color: var(--co-navy);
  font-size: 16px;
}
.landing-auth-card .portal-entry-list { display: grid; gap: 8px; }
.landing-auth-card .portal-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 13px 14px;
  border: 1px solid rgba(15,30,51,.14);
  border-radius: 10px;
  background: #f5f8f8;
  color: var(--co-navy);
}
.landing-auth-card .portal-entry:hover,
.landing-auth-card .portal-entry:focus-visible { border-color: #258bac; background: #edf7fa; }
.landing-auth-card .portal-entry strong { font-size: 13px; }
.landing-auth-card .portal-entry span { color: #66717a; font-size: 11px; }
.landing-auth-card .customer-account { margin-top: 15px; }
.landing-auth-secondary {
  min-height: 42px;
  cursor: pointer;
  padding: 0 15px;
  border: 1px solid rgba(15,30,51,.18);
  border-radius: 9px;
  background: transparent;
  color: var(--co-navy);
  font-size: 12px;
  font-weight: 760;
}
.landing-auth-trust {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 9px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(15,30,51,.1);
  color: #66717a;
}
.landing-auth-trust span { color: #1b8b78; font-weight: 850; }
.landing-auth-trust p { margin: 0; font-size: 11px; line-height: 1.55; }

.landing-enhanced .landing-reveal-section {
  opacity: 0;
  transform: translateY(35px);
  transition: opacity 700ms ease, transform 700ms cubic-bezier(.2,.72,.2,1);
}
.landing-enhanced .landing-reveal-section[data-visible="true"] { opacity: 1; transform: none; }

:focus-visible { outline: 3px solid var(--co-cyan); outline-offset: 4px; }
.landing-login:focus-visible, .landing-access > a:focus-visible { outline-color: var(--co-white); }

@media (hover: hover) and (pointer: fine) {
  .landing-gallery-card img,
  .landing-card-fan img { filter: grayscale(1) contrast(1.03); }
  .landing-gallery-card:hover img,
  .landing-card-fan figure:hover img { filter: grayscale(0) contrast(1) saturate(1.06); }
  .landing-card-fan figure:hover img { transform: scale(1.025); }
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .landing-portrait { cursor: crosshair; }
  .landing-resource-hotspot::before { animation: landing-hotspot-pulse 1.65s ease-out infinite; }
  .landing-resource-hotspot::after { animation: landing-hotspot-pulse 1.65s .34s ease-out infinite; }
  .landing-clean-frame[data-clean-enabled="true"] { cursor: crosshair; }
  .landing-clean-frame[data-clean-enabled="true"] .landing-clean-image { filter: blur(14px) grayscale(1) brightness(.55); }
  .landing-clean-frame[data-clean-enabled="true"] .landing-clean-pointer-hint { display: inline; }
  .landing-clean-frame[data-clean-enabled="true"] .landing-clean-static-hint { display: none; }
}

@media (max-width: 980px) {
  .landing-enhanced .landing-nav { display: flex; }
  html:not(.landing-enhanced) .landing-header { align-items: flex-start; flex-wrap: wrap; background: rgba(9, 21, 35, 0.92); }
  html:not(.landing-enhanced) .landing-nav { width: 100%; margin: 10px 0 0; padding: 12px 0 5px; flex-wrap: wrap; gap: 14px 22px; }
  .landing-resources-heading { grid-template-columns: 1fr; }
  .landing-resources-heading > p:first-child { padding: 0; }
  .landing-resource-explorer { grid-template-columns: 1fr; }
  .landing-resource-visual { min-height: 0; aspect-ratio: 4 / 3; }
  .landing-clean-inner { grid-template-columns: 1fr; }
  .landing-clean-copy { max-width: 720px; }
  .landing-clean-frame { width: min(100%, 760px); justify-self: center; }
  .landing-collections-grid { grid-template-columns: repeat(2, 1fr); }
  .landing-collections-grid article { min-height: 300px; border-bottom: 1px solid rgba(255,255,255,.18); }
  .landing-collections-grid article:nth-child(2) { border-right: 0; }
  .landing-collections-grid article:first-child { padding-left: clamp(18px, 2.5vw, 36px); }
  .landing-footer-card { grid-template-columns: 1fr; }
  .landing-footer-nav, .landing-footer-access { align-items: center; flex-direction: row; justify-content: center; flex-wrap: wrap; text-align: center; }
  .landing-footer-center { min-height: 500px; }
}

@media (max-width: 680px) {
  .landing-header { min-height: 66px; padding: 10px 14px; }
  .landing-brand-name { display: none; }
  .landing-brand-mark { width: 42px; height: 42px; }
  .landing-login { min-height: 44px; padding: 0 14px; }
  .landing-menu-button { width: 44px; height: 44px; }
  html:not(.landing-enhanced) .landing-header-actions { margin-left: auto; }
  .landing-enhanced .landing-nav { padding: 100px 24px 35px; overflow-y: auto; }
  .landing-enhanced .landing-nav a { font-size: clamp(33px, 12vw, 58px); line-height: .93; }
  .landing-hero-scroll { height: 190svh; }
  .landing-hero-image { object-position: 53% center; }
  .landing-portrait h1 { max-width: 190px; font-size: 15px; }
  .landing-scroll-cue { display: none; }
  .landing-marquee { gap: 22px; }
  .landing-marquee-line { font-size: clamp(52px, 17vw, 82px); }
  .landing-mission { min-height: auto; padding-block: 110px; }
  .landing-mission h2 { font-size: clamp(34px, 10.4vw, 58px); line-height: .98; }
  .landing-gallery-grid { display: flex; flex-direction: column; }
  .landing-gallery-card, .landing-gallery-card-tall, .landing-gallery-card-wide { min-height: 0; aspect-ratio: 4 / 5; }
  .landing-gallery-card:nth-child(even) { aspect-ratio: 4 / 3; }
  .landing-gallery-card-offset { transform: none; }
  .landing-resources-heading { min-width: 0; }
  .landing-resources-heading h2 { max-width: 100%; font-size: clamp(50px, 16vw, 80px); }
  .landing-resource-content { display: block; }
  .landing-resource-tabs button { min-height: 64px; }
  .landing-resource-panels { min-height: 270px; }
  .landing-clean-copy h2 { font-size: clamp(48px, 15vw, 78px); }
  .landing-clean-frame { border-radius: 20px; }
  .landing-collections-grid { grid-template-columns: 1fr; }
  .landing-collections-grid article { min-height: 250px; border-right: 0; }
  .landing-card-fan { display: grid; height: auto; grid-template-columns: 1fr 1fr; gap: 12px; }
  .landing-card-fan figure,
  .landing-card-fan figure:nth-child(1),
  .landing-card-fan figure:nth-child(2),
  .landing-card-fan figure:nth-child(3),
  .landing-card-fan figure:nth-child(4),
  .landing-card-fan figure:nth-child(5) {
    position: relative;
    inset: auto;
    width: auto;
    height: auto;
    aspect-ratio: 4 / 5;
    transform: none;
    border-width: 3px;
    border-radius: 16px;
  }
  .landing-card-fan figure:nth-child(3) { grid-row: span 2; }
  .landing-card-fan figure:hover { transform: translateY(-4px); }
  .landing-access h2 { font-size: clamp(42px, 14vw, 72px); line-height: .88; }
  .landing-footer { padding-inline: 10px; }
  .landing-footer-card { min-height: 760px; padding: 48px 22px; border-radius: 28px 28px 70px 28px; }
  .landing-footer-center { min-height: 430px; }
  .landing-footer-center > p { font-size: clamp(42px, 14vw, 76px); }
  .landing-footer-nav, .landing-footer-access { gap: 14px; }
  .landing-footer-nav a, .landing-footer-access a { font-size: 15px; }
  .landing-footer-row { align-items: flex-start; flex-direction: column; }
}

@media (max-width: 360px) {
  .landing-login span { display: none; }
  .landing-login { width: 44px; padding: 0; }
  .landing-mission h2 { font-size: 32px; }
  .landing-card-fan { grid-template-columns: 1fr; }
  .landing-card-fan figure:nth-child(3) { grid-row: auto; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: .01ms !important;
  }
  .landing-hero-scroll { height: 100svh; }
  .landing-marquee { display: none; }
  .landing-portrait { transform: none !important; border-radius: 0 !important; }
  .landing-enhanced .landing-reveal-section { opacity: 1; transform: none; }
}
`;
