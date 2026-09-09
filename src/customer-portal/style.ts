import { customerPortalInsightsCss } from "./insights-style.js";

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
.sidebar-footer[data-portal-access="authenticated"] .data-dot {
  background: #75c7a7;
  box-shadow: 0 0 0 4px #75c7a724;
}
.mobile-scrim { display: none; }
.portal-nav-open { overflow: hidden; }
.portal-nav-open .didagent_target,
.portal-nav-open .portal-agent-launcher { visibility: hidden !important; pointer-events: none !important; }

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
.demo-status {
  width: min(calc(100% - 92px), 1148px);
  margin: 18px auto -21px;
  padding: 0 15px;
  border: 1px solid #d9d4c7;
  border-radius: 10px;
  background: #f3f0e8;
  color: #6f5a37;
}
.demo-status summary {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  list-style: none;
  font-size: 12px;
}
.demo-status summary::-webkit-details-marker { display: none; }
.demo-status summary::after {
  margin-left: auto;
  color: #8b7651;
  content: "+";
  font-size: 16px;
}
.demo-status[open] summary::after { content: "−"; }
.demo-status .data-dot { background: var(--ochre); box-shadow: 0 0 0 4px #af82431a; }
.demo-status summary > span:not(.data-dot) { color: #88785e; }
.demo-status p {
  max-width: 850px;
  margin: 0;
  padding: 0 0 14px 16px;
  color: #75684f;
  font-size: 12px;
  line-height: 1.55;
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
.next-action-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(150deg, #f0f3f1, #fff);
}
.next-action-card::after {
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: linear-gradient(90deg, var(--portal-primary), var(--portal-accent));
  content: "";
}
.next-action-card > strong {
  display: block;
  margin: 18px 0 8px;
  color: var(--portal-primary);
  font-family: Charter, "Bitstream Charter", Georgia, serif;
  font-size: clamp(37px, 4vw, 50px);
  font-weight: 500;
  letter-spacing: -.045em;
}
.next-action-card h2 { font-size: 21px; }
.next-action-card .text-button { margin-top: 18px; }
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
.authenticated-state { border-color: #b9d6cd; background: linear-gradient(135deg, #fff, #f0f7f4); }
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

/* Real customer workspace: a calm, data-first surface with explicit readiness states. */
body[data-data-mode="locked"],
body[data-data-mode="authenticated"] {
  --paper: #f3f6f8;
  --surface: #ffffff;
  --rule: #dce5e9;
  --ink: #102c3e;
  --muted: #5f7481;
  --quiet: #7e909a;
  background:
    radial-gradient(circle at 82% -12%, color-mix(in srgb, var(--portal-accent) 13%, transparent) 0, transparent 34rem),
    var(--paper);
}
body[data-data-mode="locked"] .portal-sidebar,
body[data-data-mode="authenticated"] .portal-sidebar {
  width: 280px;
  padding: 30px 22px 24px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--portal-primary) 32%, #0d2535) 0%, #102a3b 48%, #0c2231 100%);
  box-shadow: inset -1px 0 #ffffff12, 18px 0 48px #102a3b0d;
}
body[data-data-mode="locked"] .portal-main,
body[data-data-mode="authenticated"] .portal-main { margin-left: 280px; }
body[data-data-mode="locked"] .portal-topbar,
body[data-data-mode="authenticated"] .portal-topbar {
  min-height: 78px;
  padding-inline: clamp(24px, 4vw, 54px);
  background: #f7f9fae8;
  border-bottom-color: #dfe7eb;
}
body[data-data-mode="locked"] .portal-content,
body[data-data-mode="authenticated"] .portal-content {
  width: min(100%, 1360px);
  padding: 46px clamp(24px, 4vw, 56px) 180px;
}
body[data-data-mode="locked"] .section-intro,
body[data-data-mode="authenticated"] .section-intro {
  margin-bottom: 26px;
  padding-bottom: 26px;
}
body[data-data-mode="locked"] .section-intro h1,
body[data-data-mode="authenticated"] .section-intro h1 {
  font-size: clamp(38px, 4.2vw, 60px);
  line-height: 1.01;
}
.topbar-login {
  min-height: 38px;
  padding: 8px 13px;
  border: 1px solid var(--rule);
  border-radius: 999px;
  background: #fff;
}
.topbar-member {
  display: flex;
  align-items: center;
  gap: 10px;
}
.topbar-member > span,
.member-badge > span {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 12px;
  background: color-mix(in srgb, var(--portal-accent) 16%, #fff);
  color: var(--portal-primary);
  font-size: 12px;
  font-weight: 850;
}
.topbar-member strong, .topbar-member small,
.member-badge strong, .member-badge small { display: block; }
.topbar-member strong { max-width: 180px; overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.topbar-member small { margin-top: 3px; color: var(--quiet); font-size: 10px; }

.portal-access-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, .65fr);
  min-height: 390px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--portal-primary) 20%, var(--rule));
  border-radius: 24px;
  background:
    linear-gradient(125deg, color-mix(in srgb, var(--portal-primary) 96%, #0b2232), color-mix(in srgb, var(--portal-primary) 70%, #0d3344));
  box-shadow: 0 26px 70px #15364a1b;
  color: #fff;
}
.portal-access-card::before {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 84% 16%, color-mix(in srgb, var(--portal-accent) 70%, transparent) 0, transparent 16rem),
    linear-gradient(105deg, transparent 45%, #ffffff08 45% 46%, transparent 46%);
  content: "";
  pointer-events: none;
}
.access-card-copy {
  position: relative;
  z-index: 1;
  align-self: center;
  padding: clamp(36px, 6vw, 70px);
}
.access-label {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #c8d9e1;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .14em;
}
.access-label i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #70ddbd;
  box-shadow: 0 0 0 5px #70ddbd1f;
}
.access-card-copy h2 {
  max-width: 680px;
  margin: 20px 0 0;
  font-family: Charter, "Bitstream Charter", Georgia, serif;
  font-size: clamp(37px, 5vw, 62px);
  font-weight: 500;
  line-height: .98;
  letter-spacing: -.045em;
  text-wrap: balance;
}
.access-card-copy p { max-width: 620px; margin: 22px 0 0; color: #c5d3da; font-size: 16px; line-height: 1.7; }
.access-card-copy .button { margin-top: 30px; background: #fff; color: var(--portal-primary); box-shadow: 0 12px 28px #071b2833; }
.access-card-preview {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: center;
  gap: 12px;
  padding: 34px 34px 34px 0;
}
.access-card-preview > div {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 14px;
  align-items: center;
  padding: 18px;
  border: 1px solid #ffffff20;
  border-radius: 16px;
  background: #ffffff10;
  backdrop-filter: blur(8px);
}
.access-card-preview > div > span {
  display: grid;
  grid-row: 1 / 3;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  background: #ffffff13;
  color: #a7e6d5;
  font-size: 18px;
}
.access-card-preview strong { font-size: 15px; }
.access-card-preview small { color: #b6c7cf; font-size: 12px; }

.workspace-welcome {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 22px;
  padding: clamp(26px, 4vw, 42px);
  border: 1px solid color-mix(in srgb, var(--portal-primary) 18%, var(--rule));
  border-radius: 22px;
  background:
    linear-gradient(135deg, #fff 0 62%, color-mix(in srgb, var(--portal-accent) 9%, #fff));
  box-shadow: 0 18px 50px #17394d0c;
}
.workspace-welcome h2 {
  margin: 10px 0 0;
  font-family: Charter, "Bitstream Charter", Georgia, serif;
  font-size: clamp(31px, 4vw, 47px);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -.04em;
}
.workspace-welcome p { max-width: 700px; margin: 14px 0 0; color: var(--muted); font-size: 15px; line-height: 1.7; }
.member-badge { display: flex; flex: none; align-items: center; gap: 11px; padding: 10px 13px; border: 1px solid var(--rule); border-radius: 15px; background: #fff; }
.member-badge strong { max-width: 180px; overflow: hidden; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.member-badge small { margin-top: 3px; color: var(--quiet); font-size: 11px; }
.workspace-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}
.workspace-metrics button {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto auto;
  gap: 2px 14px;
  min-height: 158px;
  padding: 22px;
  border: 1px solid var(--rule);
  border-radius: 18px;
  background: #fff;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  box-shadow: 0 8px 28px #183d5008;
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}
.workspace-metrics button:hover { border-color: color-mix(in srgb, var(--portal-accent) 42%, var(--rule)); box-shadow: 0 16px 38px #183d5012; transform: translateY(-2px); }
.workspace-metrics button > span { display: grid; grid-row: 1 / 4; width: 44px; height: 44px; place-items: center; border-radius: 13px; background: color-mix(in srgb, var(--portal-primary) 8%, #fff); color: var(--portal-primary); font-size: 18px; }
.workspace-metrics small { color: var(--muted); font-size: 13px; font-style: normal; font-weight: 700; }
.workspace-metrics strong { align-self: end; margin-top: 8px; font-family: Charter, "Bitstream Charter", Georgia, serif; font-size: 34px; font-weight: 500; line-height: 1; }
.workspace-metrics em { color: var(--quiet); font-size: 12px; font-style: normal; }
.presentation-preview { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(290px, .65fr); gap: 18px; margin: 0 0 18px; }
.demo-trend-card, .portal-news-card { position: relative; overflow: hidden; border-radius: 20px; box-shadow: 0 18px 46px #17394d0d; }
.demo-trend-card { padding: 30px 30px 22px; background: linear-gradient(150deg, #fff 0 70%, color-mix(in srgb, var(--portal-accent) 8%, #fff)); }
.demo-label, .news-badge { display: inline-flex; align-items: center; gap: 7px; color: #7a5d20; font-size: 10px; font-weight: 850; letter-spacing: .12em; }
.demo-label::before, .news-badge::before { width: 7px; height: 7px; border-radius: 50%; background: #d39a36; box-shadow: 0 0 0 4px #d39a3618; content: ""; }
.demo-trend-card .surface-head h2 { margin-top: 10px; font-size: 27px; }
.trend-pill { padding: 7px 10px; border-radius: 999px; background: #e8f6f0; color: #237259; font-size: 12px; font-weight: 800; white-space: nowrap; }
.demo-kpis { display: flex; gap: 30px; margin: 6px 0 12px; }
.demo-kpis span, .demo-kpis small { display: block; }
.demo-kpis span { font-family: Charter, "Bitstream Charter", Georgia, serif; font-size: 25px; font-weight: 550; letter-spacing: -.025em; }
.demo-kpis small { margin-top: 3px; color: var(--quiet); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
.demo-line-chart { position: relative; min-height: 240px; }
.demo-line-chart svg { display: block; width: 100%; height: 210px; overflow: visible; }
.demo-chart-grid { fill: none; stroke: #dfe7ea; stroke-width: 1; }
.demo-chart-area { fill: url(#demo-preview-fill); opacity: 0; animation: demo-area-in 900ms 220ms ease forwards; }
.demo-chart-line { fill: none; stroke: var(--portal-accent); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: demo-line-in 1.5s 160ms cubic-bezier(.2,.8,.2,1) forwards; }
.demo-chart-points { fill: #fff; stroke: var(--portal-accent); stroke-width: 3; opacity: 0; animation: demo-area-in 480ms 1s ease forwards; }
.demo-line-chart ol { display: flex; justify-content: space-between; margin: -4px 0 0; padding: 0 5px; color: var(--quiet); font-size: 10px; list-style: none; }
@keyframes demo-line-in { to { stroke-dashoffset: 0; } }
@keyframes demo-area-in { to { opacity: 1; } }
.portal-news-card { display: flex; flex-direction: column; min-height: 100%; padding: 30px; background: linear-gradient(155deg, #123448 0%, #0d293a 72%, color-mix(in srgb, var(--portal-accent) 35%, #0d293a)); color: #fff; }
.news-badge { color: #a8dbcf; }
.news-badge::before { background: #71d0b5; box-shadow: 0 0 0 4px #71d0b51a; }
.demo-donut { position: relative; display: grid; width: 126px; height: 126px; margin: 34px 0 30px; place-items: center; border-radius: 50%; background: conic-gradient(#70d2b6 0 62%, #ffffff18 62% 100%); animation: demo-donut-in 900ms cubic-bezier(.2,.8,.2,1) both; }
.demo-donut::before { position: absolute; width: 94px; height: 94px; border-radius: 50%; background: #123448; content: ""; }
.demo-donut > span { position: relative; z-index: 1; text-align: center; }
.demo-donut strong, .demo-donut small { display: block; }
.demo-donut strong { font-family: Charter, "Bitstream Charter", Georgia, serif; font-size: 27px; font-weight: 500; }
.demo-donut small { margin-top: 2px; color: #a8bcc7; font-size: 9px; text-transform: uppercase; letter-spacing: .08em; }
@keyframes demo-donut-in { from { opacity: 0; transform: rotate(-35deg) scale(.78); } to { opacity: 1; transform: none; } }
.portal-news-card .news-date { margin: 0; color: #8eabb8; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
.portal-news-card h2 { margin-top: 10px; color: #fff; font-size: 29px; }
.portal-news-card > p:not(.news-date) { color: #bdd0d8; font-size: 14px; line-height: 1.65; }
.portal-news-card .text-button { margin-top: auto; padding-top: 22px; color: #fff; }
.workspace-grid { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(270px, .7fr); gap: 18px; }
.readiness-card { padding: 30px; border-radius: 18px; }
.readiness-list { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
.readiness-list li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid var(--rule);
}
.readiness-list li > span,
.source-readiness li > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 11px;
  background: #f1f4f5;
  color: var(--quiet);
  font-size: 12px;
  font-weight: 800;
}
.readiness-list li.is-complete > span,
.source-readiness li.is-complete > span { background: #e7f5ef; color: #24745d; }
.readiness-list strong, .readiness-list small { display: block; }
.readiness-list strong { font-size: 14px; }
.readiness-list small { margin-top: 4px; color: var(--muted); font-size: 12px; line-height: 1.5; }
.readiness-list em { padding: 6px 9px; border-radius: 999px; background: #f2f5f6; color: var(--muted); font-size: 11px; font-style: normal; font-weight: 750; white-space: nowrap; }
.readiness-list .is-complete em { background: #e7f5ef; color: #24745d; }
.next-step-card { position: relative; overflow: hidden; padding: 30px; border-radius: 18px; background: linear-gradient(155deg, color-mix(in srgb, var(--portal-primary) 96%, #0c2635), #123a4c); color: #fff; }
.next-step-card::after { position: absolute; right: -70px; bottom: -90px; width: 230px; height: 230px; border: 1px solid #ffffff14; border-radius: 50%; content: ""; }
.next-step-card .section-kicker { color: #9fcfc3; }
.next-step-card h2 { margin-top: 18px; color: #fff; font-size: 30px; }
.next-step-card p { color: #bfd0d8; font-size: 14px; }
.next-step-card .text-button { position: relative; z-index: 1; margin-top: 22px; color: #fff; }
.next-step-number { display: block; margin-bottom: 48px; color: #ffffff27; font-family: Charter, "Bitstream Charter", Georgia, serif; font-size: 68px; line-height: .8; }

.section-login-gate {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
  min-height: 170px;
  padding: 28px;
  border: 1px solid var(--rule);
  border-radius: 18px;
  background: linear-gradient(135deg, #fff, color-mix(in srgb, var(--portal-accent) 5%, #fff));
  box-shadow: 0 12px 34px #17394d0a;
}
.section-login-icon, .workspace-empty-icon {
  display: grid;
  width: 56px;
  height: 56px;
  flex: none;
  place-items: center;
  border-radius: 17px;
  background: color-mix(in srgb, var(--portal-primary) 9%, #fff);
  color: var(--portal-primary);
  font-size: 22px;
}
.section-login-gate h2 { margin: 7px 0 0; font-family: Charter, "Bitstream Charter", Georgia, serif; font-size: 25px; font-weight: 550; }
.section-login-gate p { max-width: 650px; margin: 7px 0 0; color: var(--muted); font-size: 14px; line-height: 1.6; }
.workspace-empty {
  padding: clamp(30px, 6vw, 66px);
  border: 1px solid var(--rule);
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 18px 48px #17394d0a;
}
.workspace-empty .workspace-empty-icon { margin-bottom: 28px; }
.workspace-empty h2 { max-width: 720px; margin: 12px 0 0; font-family: Charter, "Bitstream Charter", Georgia, serif; font-size: clamp(30px, 4vw, 44px); font-weight: 500; letter-spacing: -.035em; }
.workspace-empty > p { max-width: 760px; margin: 15px 0 0; color: var(--muted); font-size: 15px; line-height: 1.7; }
.workspace-empty-columns { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 36px; }
.workspace-empty-columns > div { padding: 18px; border: 1px solid var(--rule); border-radius: 15px; background: #f8fafb; }
.workspace-empty-columns span, .workspace-empty-columns strong, .workspace-empty-columns small { display: block; }
.workspace-empty-columns span { margin-bottom: 22px; color: var(--portal-accent); font-size: 11px; font-weight: 850; }
.workspace-empty-columns strong { font-size: 14px; }
.workspace-empty-columns small { margin-top: 7px; color: var(--muted); font-size: 12px; line-height: 1.5; }
.analysis-readiness { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(290px, .65fr); gap: 18px; }
.analysis-canvas, .source-readiness, .reports-empty { border-radius: 18px; }
.waiting-chip { border-color: #eadbb9; background: #fff7e8; color: #855f1d; }
.waiting-chip::before { background: #c58b2b; }
.empty-chart { position: relative; display: grid; min-height: 290px; place-items: center; overflow: hidden; border: 1px solid #e4eaed; border-radius: 15px; background: linear-gradient(#fafcfd, #f6f9fa); }
.empty-chart > span { position: absolute; right: 0; left: 0; height: 1px; background: #dce5e966; }
.empty-chart > span:nth-child(1) { top: 20%; }
.empty-chart > span:nth-child(2) { top: 40%; }
.empty-chart > span:nth-child(3) { top: 60%; }
.empty-chart > span:nth-child(4) { top: 80%; }
.empty-chart strong { position: relative; z-index: 1; max-width: 260px; padding: 12px 16px; border: 1px solid var(--rule); border-radius: 999px; background: #fff; color: var(--muted); font-size: 12px; text-align: center; box-shadow: 0 8px 24px #15384a0b; }
.source-readiness { padding: 28px; }
.source-readiness h2 { margin-top: 11px; font-size: 25px; }
.source-readiness ol { display: grid; gap: 0; margin: 24px 0 0; padding: 0; list-style: none; }
.source-readiness li { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: center; padding: 16px 0; border-top: 1px solid var(--rule); }
.source-readiness strong, .source-readiness small { display: block; }
.source-readiness strong { font-size: 13px; }
.source-readiness small { margin-top: 4px; color: var(--muted); font-size: 11px; line-height: 1.45; }
.reports-empty { padding: clamp(28px, 5vw, 50px); }
.report-empty-main { display: grid; grid-template-columns: auto 1fr; gap: 24px; align-items: start; }
.report-empty-main h2 { margin-top: 10px; font-size: clamp(29px, 4vw, 42px); }
.report-empty-main p { max-width: 760px; font-size: 15px; line-height: 1.7; }
.report-readiness { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 36px 0 0; }
.report-readiness > div { padding: 17px; border: 1px solid var(--rule); border-radius: 14px; background: #f8fafb; }
.report-readiness dt { color: var(--quiet); font-size: 11px; font-weight: 750; text-transform: uppercase; letter-spacing: .08em; }
.report-readiness dd { margin: 9px 0 0; font-size: 14px; font-weight: 750; }
.report-readiness dd span { display: inline-block; width: 7px; height: 7px; margin-right: 5px; border-radius: 50%; background: #c58b2b; }

@media (max-width: 1120px) {
  .portal-access-card { grid-template-columns: 1fr; }
  .access-card-preview { grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 0 34px 34px; }
  .access-card-preview > div { grid-template-columns: auto 1fr; }
  .workspace-grid, .analysis-readiness, .presentation-preview { grid-template-columns: 1fr; }
  .next-step-number { margin-bottom: 28px; }
}
@media (max-width: 980px) {
  body[data-data-mode="locked"] .portal-main,
  body[data-data-mode="authenticated"] .portal-main { margin-left: 0; }
}
@media (max-width: 760px) {
  .workspace-welcome { flex-direction: column; }
  .workspace-metrics, .workspace-empty-columns, .report-readiness { grid-template-columns: 1fr; }
  .demo-kpis { justify-content: space-between; gap: 14px; }
  .access-card-preview { grid-template-columns: 1fr; }
  .section-login-gate { grid-template-columns: auto 1fr; }
  .section-login-gate .button { grid-column: 1 / -1; width: 100%; }
}
@media (max-width: 540px) {
  .access-card-copy { padding: 34px 24px; }
  .access-card-copy h2 { font-size: 39px; }
  .access-card-preview { padding: 0 24px 24px; }
  .workspace-welcome, .readiness-card, .next-step-card, .source-readiness { padding: 24px; }
  .readiness-list li { grid-template-columns: auto 1fr; }
  .readiness-list em { grid-column: 2; justify-self: start; }
  .report-empty-main { grid-template-columns: 1fr; }
  .topbar-member > div { display: none; }
}

.portal-agent-launcher {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 24;
  display: flex;
  min-height: 58px;
  align-items: center;
  gap: 11px;
  padding: 9px 15px 9px 9px;
  border: 1px solid #ffffff26;
  border-radius: 16px;
  background: #172f42;
  color: #fff;
  box-shadow: 0 15px 40px #172f4238;
  text-align: left;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}
.portal-agent-launcher:hover {
  background: #1d3a50;
  box-shadow: 0 18px 44px #172f4247;
  transform: translateY(-2px);
}
.portal-agent-launcher[aria-busy="true"] { cursor: wait; opacity: .82; }
.portal-agent-launcher:disabled { cursor: not-allowed; opacity: .72; transform: none; }
.portal-agent-launcher > span:last-child,
.portal-agent-launcher strong,
.portal-agent-launcher small { display: block; }
.portal-agent-launcher strong { font-size: 12px; letter-spacing: -.01em; }
.portal-agent-launcher small { margin-top: 3px; color: #9fb2bc; font-size: 10px; }
.agent-launcher-mark {
  display: grid;
  width: 38px;
  height: 38px;
  flex: none;
  place-items: center;
  border-radius: 11px;
  background: var(--portal-accent);
  color: #fff;
  font-family: Charter, "Bitstream Charter", Georgia, serif;
  font-size: 13px;
}

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
.customer-access-message { min-height: 22px; }
.customer-account { margin-top: 18px; }
.customer-access-switch {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px 20px;
  margin-top: 22px;
  font-size: 12px;
  font-weight: 650;
}
.customer-access-switch a { color: var(--teal); text-underline-offset: 3px; }
.portal-chooser { margin-top: 24px; }
.portal-chooser h3 {
  margin: 0 0 11px;
  font-family: Charter, "Bitstream Charter", Georgia, serif;
  font-size: 18px;
  font-weight: 600;
}
.portal-entry-list { display: grid; gap: 8px; }
.portal-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 13px 14px;
  border: 1px solid var(--rule);
  border-radius: 9px;
  background: #f8faf9;
  text-decoration: none;
}
.portal-entry:hover { border-color: var(--teal); background: #f2f7f5; }
.portal-entry strong { font-size: 13px; }
.portal-entry span { color: var(--muted); font-size: 11px; }
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
  .demo-status { width: calc(100% - 48px); }
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
  .demo-status { width: calc(100% - 30px); margin-top: 13px; margin-bottom: -17px; }
  .demo-status summary { align-items: flex-start; flex-wrap: wrap; padding-block: 10px; }
  .demo-status summary > span:not(.data-dot) { width: calc(100% - 18px); margin-left: 16px; }
  .demo-status p { padding-left: 16px; }
  .portal-agent-launcher {
    right: 14px;
    bottom: max(14px, env(safe-area-inset-bottom));
    min-height: 52px;
    border-radius: 14px;
  }
  .agent-launcher-mark { width: 34px; height: 34px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
` + customerPortalInsightsCss;
