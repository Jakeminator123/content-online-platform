export const customerPortalCss = String.raw`
:root {
  color-scheme: light;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --paper: #f6f5f1;
  --surface: #ffffff;
  --ink: #183247;
  --muted: #627682;
  --quiet: #82929b;
  --rule: #d9e0e2;
  --soft: #edf1f0;
  --teal: #397b73;
  --blue: #4d718b;
  --ochre: #af8243;
  --portal-primary: #285b70;
  --portal-accent: #338578;
  --portal-on-primary: #ffffff;
  background: var(--paper);
  color: var(--ink);
}
* { box-sizing: border-box; }
html { min-width: 320px; background: var(--paper); }
body { min-height: 100svh; margin: 0; background: var(--paper); color: var(--ink); }
a { color: inherit; }
button, input, select, textarea { font: inherit; }
button, a { touch-action: manipulation; }
button { color: inherit; }
svg { width: 1.1em; height: 1.1em; flex: none; }
[hidden] { display: none !important; }
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

.portal-shell { min-height: 100svh; }
.portal-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 30;
  display: flex;
  width: 272px;
  flex-direction: column;
  padding: 28px 20px 22px;
  overflow-y: auto;
  background: #172f42;
  color: #cdd8dd;
  box-shadow: inset -1px 0 #ffffff12;
}
.co-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px;
  color: #fff;
  text-decoration: none;
}
.co-mark {
  display: grid;
  width: 40px;
  height: 40px;
  flex: none;
  place-items: center;
  overflow: hidden;
  border: 1px solid #ffffff26;
  border-radius: 10px;
  background: #18acc2;
}
.co-mark img { width: 100%; height: 100%; object-fit: cover; }
.co-brand strong { display: block; font-size: 15px; letter-spacing: -.025em; }
.co-brand small {
  display: block;
  margin-top: 3px;
  color: #8fa3ae;
  font-size: 9px;
  font-weight: 650;
  letter-spacing: .16em;
}
.customer-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 30px 4px 25px;
  padding: 15px 13px;
  border: 1px solid #ffffff17;
  border-radius: 12px;
  background: #ffffff08;
}
.customer-mark {
  display: grid;
  width: 44px;
  height: 44px;
  flex: none;
  place-items: center;
  overflow: hidden;
  border: 1px solid #ffffff2a;
  border-radius: 10px;
  background: var(--portal-primary);
  color: var(--portal-on-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .04em;
}
.customer-mark img { width: 100%; height: 100%; object-fit: contain; background: #fff; }
.customer-identity strong, .customer-identity small { display: block; }
.customer-identity strong {
  overflow: hidden;
  max-width: 160px;
  color: #fff;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.customer-identity small { margin-top: 4px; color: #8fa3ae; font-size: 11px; }
.portal-nav { display: grid; gap: 5px; }
.portal-nav button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 11px 13px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #bccbd1;
  font-size: 13px;
  font-weight: 560;
  text-align: left;
  cursor: pointer;
  transition: color 160ms ease, background 160ms ease, transform 160ms ease;
}
.portal-nav button svg { color: #8da2ad; }
.portal-nav button:hover { color: #fff; background: #ffffff0a; }
.portal-nav button[aria-current="page"] {
  background: #ffffff10;
  color: #fff;
  box-shadow: inset 2px 0 var(--portal-accent);
}
.portal-nav button[aria-current="page"] svg { color: #8dc6bb; }
.portal-nav button:active { transform: translateY(1px); }
.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: auto;
  padding: 20px 10px 0;
  color: #91a4ad;
  font-size: 11px;
}
.data-dot {
  width: 7px;
  height: 7px;
  border-radius: 99px;
  background: #87b8ae;
  box-shadow: 0 0 0 4px #87b8ae16;
}
.mobile-scrim { display: none; }

.portal-main { min-height: 100svh; margin-left: 272px; }
.portal-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 13px 40px;
  border-bottom: 1px solid color-mix(in srgb, var(--rule) 86%, transparent);
  background: #f6f5f1eb;
  backdrop-filter: blur(16px);
}
.topbar-title, .topbar-meta { display: flex; align-items: center; }
.topbar-title { gap: 9px; color: var(--quiet); font-size: 12px; }
.topbar-title strong { color: var(--ink); font-weight: 700; }
.topbar-meta { gap: 12px; }
.period-label { color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.status-chip {
  display: inline-flex;
  min-height: 27px;
  align-items: center;
  gap: 7px;
  padding: 5px 10px;
  border: 1px solid #c9dcd7;
  border-radius: 999px;
  background: #edf5f2;
  color: #2f6b63;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: .025em;
}
.status-chip::before {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: var(--teal);
  content: "";
}
.text-link, .text-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--portal-primary);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}
.text-button {
  padding: 7px 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.mobile-menu {
  display: none;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: #fff;
  color: var(--ink);
  cursor: pointer;
}

.portal-content {
  width: min(100%, 1240px);
  margin: 0 auto;
  padding: 54px 46px 180px;
}
.portal-section { outline: none; }
.portal-section.is-active { animation: section-in 220ms cubic-bezier(.2,.8,.2,1); }
@keyframes section-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.section-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 1px solid var(--rule);
}
.section-intro.compact { align-items: flex-start; margin-bottom: 24px; padding-bottom: 24px; }
.section-intro h1, .login-identity h1 {
  max-width: 780px;
  margin: 8px 0 0;
  font-family: Charter, "Bitstream Charter", Georgia, serif;
  font-size: clamp(37px, 4.5vw, 62px);
  font-weight: 500;
  line-height: 1.02;
  letter-spacing: -.04em;
  text-wrap: balance;
}
.section-intro.compact h1 { font-size: clamp(34px, 4vw, 50px); }
.section-intro p {
  max-width: 680px;
  margin: 14px 0 0;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.65;
}
.section-kicker {
  display: block;
  color: var(--portal-primary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .16em;
}
.button {
  display: inline-flex;
  min-height: 43px;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 10px 16px;
  border: 1px solid transparent;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 750;
  text-decoration: none;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.button:hover { transform: translateY(-1px); }
.button.primary {
  background: var(--portal-primary);
  color: var(--portal-on-primary);
  box-shadow: 0 7px 20px color-mix(in srgb, var(--portal-primary) 18%, transparent);
}
.button.secondary { border-color: var(--rule); background: #fff; color: var(--ink); }
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}
.metric-card {
  min-height: 142px;
  padding: 21px 22px;
  border: 1px solid var(--rule);
  border-radius: 12px;
  background: var(--surface);
}
.metric-card > span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.metric-card strong {
  display: block;
  margin: 19px 0 5px;
  font-family: Charter, "Bitstream Charter", Georgia, serif;
  font-size: 35px;
  font-weight: 500;
  letter-spacing: -.035em;
  font-variant-numeric: tabular-nums;
}
.metric-card small { color: var(--quiet); font-size: 11px; }
.briefing-grid, .analysis-grid, .support-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
  gap: 18px;
}
.surface {
  min-width: 0;
  padding: 26px;
  border: 1px solid var(--rule);
  border-radius: 13px;
  background: var(--surface);
  box-shadow: 0 2px 8px #193b4d08;
}
.surface-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}
.surface-head h2, .surface h2, .activation-card h2 {
  margin: 3px 0 0;
  font-family: Charter, "Bitstream Charter", Georgia, serif;
  font-size: 24px;
  font-weight: 550;
  line-height: 1.2;
  letter-spacing: -.025em;
}
.surface-head p, .surface p {
  margin: 7px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}
.evidence-card { background: #f0f3f1; }
.evidence-card > strong {
  display: block;
  margin-top: 17px;
  font-family: Charter, "Bitstream Charter", Georgia, serif;
  font-size: 38px;
  font-weight: 500;
  letter-spacing: -.035em;
  font-variant-numeric: tabular-nums;
}
.evidence-card > p { margin-top: 2px; }
.evidence-card dl { display: grid; gap: 12px; margin: 24px 0 0; }
.evidence-card dl div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-top: 11px;
  border-top: 1px solid #d5ddda;
  font-size: 11px;
}
.evidence-card dt { color: var(--quiet); }
.evidence-card dd { margin: 0; color: var(--ink); font-weight: 700; text-align: right; }
.ranked-chart { display: grid; gap: 17px; }
.ranked-label {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 7px;
}
.ranked-label span, .ranked-label strong, .ranked-label small { display: block; min-width: 0; }
.ranked-label strong {
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ranked-label small { margin-top: 3px; color: var(--quiet); font-size: 10px; }
.ranked-label b {
  flex: none;
  color: var(--ink);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.ranked-track { height: 7px; overflow: hidden; border-radius: 99px; background: #e8eeec; }
.ranked-track span {
  display: block;
  width: var(--bar-size);
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--portal-primary), color-mix(in srgb, var(--portal-accent) 72%, #fff));
  transform-origin: left;
  animation: bar-in 640ms cubic-bezier(.2,.8,.2,1) both;
}
@keyframes bar-in { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.product-list, .report-list { display: grid; }
.product-row, .report-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  min-height: 68px;
  padding: 11px 2px;
  border-top: 1px solid var(--rule);
}
.product-row:first-child, .report-row:first-child { border-top: 0; }
.resource-mark, .report-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 10px;
  background: var(--soft);
  color: var(--portal-primary);
  font-size: 10px;
  font-weight: 800;
}
.product-row strong, .product-row small, .report-row strong, .report-row small { display: block; }
.product-row strong, .report-row strong { font-size: 13px; }
.product-row small, .report-row small { margin-top: 4px; color: var(--quiet); font-size: 11px; }
.row-value {
  color: var(--ink);
  font-size: 13px;
  font-weight: 750;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.row-value small { margin-top: 2px; color: var(--ochre); font-size: 9px; text-transform: uppercase; }
.status-label {
  padding: 5px 9px;
  border: 1px solid var(--rule);
  border-radius: 999px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
}
.source-line { margin: 16px 0 0; color: var(--quiet); font-size: 11px; }
.locked-state {
  display: flex;
  min-height: 150px;
  align-items: center;
  gap: 16px;
  padding: 28px;
  border: 1px dashed #c6d1d3;
  border-radius: 11px;
  background: #fafaf8;
}
.locked-state strong { font-family: Charter, "Bitstream Charter", Georgia, serif; font-size: 20px; }
.locked-state p { margin: 6px 0 0; }
.lock-mark {
  display: grid;
  width: 44px;
  height: 44px;
  flex: none;
  place-items: center;
  border-radius: 99px;
  background: #e5efec;
  color: var(--teal);
}
.activation-card {
  display: flex;
  min-height: 280px;
  align-items: center;
  justify-content: space-between;
  gap: 34px;
  padding: clamp(30px, 6vw, 62px);
  border: 1px solid var(--rule);
  border-radius: 14px;
  background: var(--surface);
}
.activation-card h2 { max-width: 680px; margin-top: 13px; font-size: clamp(29px, 4vw, 44px); }
.activation-card p { max-width: 630px; margin: 13px 0 0; color: var(--muted); font-size: 14px; line-height: 1.65; }
.assistant-brief {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 21px;
  align-items: start;
}
.assistant-mark {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 16px;
  background: #172f42;
  color: #fff;
  font-family: Charter, "Bitstream Charter", Georgia, serif;
  font-size: 20px;
}
.connection-state {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 17px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
}
.connection-state::before {
  width: 7px;
  height: 7px;
  border-radius: 99px;
  background: var(--ochre);
  content: "";
}
.connection-state[data-state="connected"]::before { background: var(--teal); }
.connection-state[data-state="connecting"]::before { background: var(--blue); }
.connection-state[data-state="disconnected"]::before { background: #9f6262; }
.support-note { background: #f0f3f1; }

.login-shell { min-height: 100svh; display: grid; grid-template-columns: minmax(340px, 1fr) minmax(420px, 620px); }
.login-brand {
  display: flex;
  min-height: 100svh;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(34px, 6vw, 72px);
  background: #172f42;
  color: #fff;
}
.login-brand .co-brand { padding: 0; }
.login-identity { max-width: 720px; }
.login-identity .customer-mark { width: 66px; height: 66px; margin-bottom: 29px; font-size: 17px; }
.login-identity .section-kicker { color: #8fc5bc; }
.login-identity h1 { margin-top: 13px; font-size: clamp(43px, 6vw, 74px); }
.login-identity p { max-width: 600px; margin: 18px 0 0; color: #b9c9d0; font-size: 15px; line-height: 1.7; }
.login-brand > small { color: #8fa3ae; font-size: 11px; }
.login-panel { display: grid; place-items: center; padding: 34px; background: var(--paper); }
.login-card {
  width: min(100%, 460px);
  padding: clamp(28px, 5vw, 46px);
  border: 1px solid var(--rule);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 24px 70px #18324712;
}
.login-card h2 {
  margin: 11px 0 0;
  font-family: Charter, "Bitstream Charter", Georgia, serif;
  font-size: 34px;
  font-weight: 550;
  letter-spacing: -.03em;
}
.login-card > p { margin: 13px 0 0; color: var(--muted); font-size: 14px; line-height: 1.65; }
.login-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 25px; }
.trust-line {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 9px;
  align-items: start;
  margin-top: 27px;
  padding-top: 20px;
  border-top: 1px solid var(--rule);
  color: var(--muted);
}
.trust-line span { color: var(--teal); }
.trust-line p { margin: 0; font-size: 11px; line-height: 1.55; }

body[data-preset="library"] { --soft: #f0f0f5; }
body[data-preset="minimal"] .surface { box-shadow: none; }
button:focus-visible, a:focus-visible, [tabindex="-1"]:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--portal-accent) 70%, #fff);
  outline-offset: 3px;
}

@media (max-width: 980px) {
  .portal-sidebar { transform: translateX(-100%); transition: transform 200ms ease; }
  .portal-sidebar.open { transform: none; }
  .portal-main { margin-left: 0; }
  .mobile-menu { display: grid; }
  .mobile-scrim {
    position: fixed;
    inset: 0;
    z-index: 25;
    border: 0;
    background: #10273566;
  }
  .mobile-scrim.visible { display: block; }
  .portal-topbar { padding-inline: 24px; }
  .portal-content { padding-inline: 24px; }
}
@media (max-width: 760px) {
  .section-intro, .activation-card { align-items: flex-start; flex-direction: column; }
  .metric-grid { grid-template-columns: 1fr; }
  .briefing-grid, .analysis-grid, .support-grid { grid-template-columns: 1fr; }
  .evidence-card { order: 2; }
  .login-shell { grid-template-columns: 1fr; }
  .login-brand { min-height: 48svh; padding: 32px 26px; }
  .login-panel { padding: 22px; }
}
@media (max-width: 540px) {
  .portal-topbar { min-height: 62px; padding: 10px 15px; }
  .topbar-title > span:first-of-type, .period-label { display: none; }
  .portal-content { padding: 34px 15px 170px; }
  .section-intro { margin-bottom: 20px; padding-bottom: 22px; }
  .surface { padding: 20px; }
  .surface-head { align-items: flex-start; flex-direction: column; }
  .product-row, .report-row { grid-template-columns: auto minmax(0, 1fr); }
  .row-value, .status-label { grid-column: 2; justify-self: start; text-align: left; }
  .assistant-brief { grid-template-columns: 1fr; }
  .login-card { padding: 28px 23px; }
  .login-actions { align-items: stretch; flex-direction: column; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
`;
