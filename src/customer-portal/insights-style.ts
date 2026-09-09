export const customerPortalInsightsCss = String.raw`
:root { --insight-chart: #285b70; --insight-positive: #397b73; }
.metric-grid-primary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.metric-grid-primary .metric-card {
  position: relative;
  min-height: 150px;
  overflow: hidden;
}
.metric-grid-primary .metric-card::after {
  position: absolute;
  inset: auto 22px 0;
  height: 2px;
  background: color-mix(in srgb, var(--portal-primary) 20%, transparent);
  content: "";
}
.metric-grid-primary .metric-card:first-child {
  border-color: color-mix(in srgb, var(--portal-primary) 24%, var(--rule));
  background: linear-gradient(145deg, #fff, color-mix(in srgb, var(--portal-primary) 5%, #fff));
}

.analytics-toolbar {
  display: flex;
  align-items: end;
  gap: 12px;
  margin-bottom: 10px;
  padding: 16px;
  border: 1px solid var(--rule);
  border-radius: 13px;
  background: #fff;
}
.analytics-toolbar { min-width: 0; margin-inline: 0; }
.analytics-toolbar label { display: grid; min-width: 160px; gap: 6px; }
.analytics-toolbar label span,
.configuration-grid form label > span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}
.analytics-toolbar select,
.configuration-grid select,
.configuration-grid input,
.configuration-grid textarea {
  min-height: 44px;
  padding: 9px 36px 9px 12px;
  border: 1px solid #cbd5d8;
  border-radius: 9px;
  background: #fff;
  color: var(--ink);
  font-size: 14px;
}
.configuration-grid input,
.configuration-grid textarea { width: 100%; padding-right: 12px; }
.configuration-grid textarea { min-height: 116px; resize: vertical; line-height: 1.5; }
.data-badge {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  margin-left: auto;
  padding: 7px 10px;
  border-radius: 7px;
  background: #f2eee5;
  color: #765b2f;
  font-size: 11px;
  font-weight: 750;
}
.provenance-note { color: var(--quiet); font-size: 12px; line-height: 1.5; }
.analytics-toolbar + .provenance-note { margin: 0 0 18px 2px; }

.telemetry-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.telemetry-kpi {
  min-width: 0;
  padding: 17px 17px 13px;
  overflow: hidden;
  border: 1px solid var(--rule);
  border-radius: 12px;
  background: linear-gradient(145deg, #fff, #fbfcfb);
}
.telemetry-kpi > div { display: flex; align-items: start; justify-content: space-between; gap: 8px; }
.telemetry-kpi span { color: var(--muted); font-size: 11px; font-weight: 750; }
.telemetry-kpi small { color: var(--teal); font-size: 10px; font-weight: 800; white-space: nowrap; }
.telemetry-kpi small.is-negative { color: #9b5d56; }
.hide-insights-comparison [data-kpi-delta] { visibility: hidden; }
.telemetry-kpi strong {
  display: block;
  margin-top: 14px;
  font-family: Charter, "Bitstream Charter", Georgia, serif;
  font-size: clamp(23px, 2.4vw, 31px);
  font-weight: 550;
  letter-spacing: -.035em;
  font-variant-numeric: tabular-nums;
}
.telemetry-kpi svg { width: 100%; height: 30px; margin-top: 10px; overflow: visible; }
.telemetry-kpi path { fill: none; stroke: var(--insight-chart); stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; vector-effect: non-scaling-stroke; }

.insight-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(270px, .85fr);
  gap: 18px;
  margin-bottom: 18px;
}
.trend-surface { overflow: hidden; }
.chart-total {
  color: var(--insight-chart);
  font-family: Charter, "Bitstream Charter", Georgia, serif;
  font-size: 30px;
  font-weight: 550;
  letter-spacing: -.035em;
  white-space: nowrap;
}
.wave-chart { position: relative; min-height: 260px; }
.wave-chart svg { display: block; width: 100%; height: 250px; overflow: visible; }
.chart-grid path { fill: none; stroke: #dce4e4; stroke-dasharray: 3 5; stroke-width: 1; vector-effect: non-scaling-stroke; }
.chart-area { fill: url(#insights-area-fill); }
.chart-line {
  fill: none;
  stroke: var(--insight-chart);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
  vector-effect: non-scaling-stroke;
  filter: drop-shadow(0 4px 4px color-mix(in srgb, var(--portal-primary) 12%, transparent));
}
[data-insights-points] circle { fill: #fff; stroke: var(--insight-chart); stroke-width: 2; vector-effect: non-scaling-stroke; }
.chart-tooltip {
  position: absolute;
  z-index: 2;
  min-width: 138px;
  padding: 8px 10px;
  border: 1px solid #c9d5d7;
  border-radius: 8px;
  background: #172f42;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  pointer-events: none;
  box-shadow: 0 8px 24px #172f4230;
}
.chart-axis {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  margin: -4px 0 0;
  padding: 0 4px;
  list-style: none;
  color: var(--quiet);
  font-size: 10px;
}
.chart-axis li { min-width: 0; text-align: center; }
.chart-data { margin-top: 18px; border-top: 1px solid var(--rule); }
.chart-data summary { padding: 13px 0 0; color: var(--insight-chart); font-size: 12px; font-weight: 750; cursor: pointer; }
.chart-data table { width: 100%; margin-top: 10px; border-collapse: collapse; font-size: 12px; }
.chart-data th,
.chart-data td { padding: 8px 2px; border-top: 1px solid var(--rule); text-align: left; }
.chart-data thead th { border-top: 0; color: var(--quiet); font-size: 10px; letter-spacing: .06em; text-transform: uppercase; }
.chart-data td { text-align: right; font-variant-numeric: tabular-nums; }

.donut-surface h2 { margin-top: 9px; }
.donut-wrap { display: grid; justify-items: center; gap: 23px; margin-top: 23px; }
.donut-chart {
  position: relative;
  display: grid;
  width: 166px;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 50%;
  background: var(--donut-fill);
  box-shadow: inset 0 0 0 1px #ffffffa8;
}
.donut-chart::after {
  position: absolute;
  width: 58%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 1px #e2e8e8;
  content: "";
}
.donut-chart > span { position: relative; z-index: 1; text-align: center; }
.donut-chart strong,
.donut-chart small { display: block; }
.donut-chart strong { font-family: Charter, "Bitstream Charter", Georgia, serif; font-size: 28px; }
.donut-chart small { margin-top: 1px; color: var(--quiet); font-size: 10px; }
.donut-wrap ul { display: grid; width: 100%; gap: 10px; margin: 0; padding: 0; list-style: none; }
.donut-wrap li { display: flex; justify-content: space-between; gap: 10px; color: var(--muted); font-size: 11px; }
.donut-wrap li span { display: flex; min-width: 0; align-items: center; gap: 8px; }
.donut-wrap li i { width: 8px; height: 8px; flex: none; border-radius: 2px; background: var(--mix-color); }
.donut-wrap li strong { color: var(--ink); font-variant-numeric: tabular-nums; }
.donut-surface .provenance-note { margin: 22px 0 0; padding-top: 16px; border-top: 1px solid var(--rule); }

.distribution-surface { margin-bottom: 2px; }
.distribution-list { display: grid; gap: 14px; }
.distribution-row {
  display: grid;
  grid-template-columns: minmax(180px, 1.1fr) auto minmax(180px, 1fr);
  align-items: center;
  gap: 18px;
}
.distribution-row strong,
.distribution-row small { display: block; }
.distribution-row strong { overflow: hidden; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.distribution-row small { margin-top: 3px; color: var(--quiet); font-size: 11px; }
.distribution-row > span { color: var(--ink); font-size: 12px; font-weight: 750; font-variant-numeric: tabular-nums; }
.distribution-track { height: 8px; overflow: hidden; border-radius: 99px; background: #e8eeec; }
.distribution-track i {
  display: block;
  width: var(--distribution-size);
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--insight-chart), color-mix(in srgb, var(--insight-positive) 72%, #fff));
}

.configuration-grid {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
  gap: 18px;
  margin-bottom: 18px;
}
.configuration-grid form { display: grid; gap: 15px; }
.configuration-grid form label { display: grid; gap: 7px; }
.configuration-grid .button { justify-self: start; }
.check-row { grid-template-columns: auto 1fr; align-items: center; }
.check-row input { width: 18px; min-height: 18px; margin: 0; padding: 0; accent-color: var(--portal-primary); }
.form-status,
.form-hint { min-height: 18px; margin: 0; color: var(--quiet); font-size: 11px; line-height: 1.5; }
.muted-chip { border-color: #ddd6c7; background: #f5f1e9; color: #765b2f; }
.muted-chip::before { background: var(--ochre); }
.ticket-result {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: start;
  margin-top: 18px;
  padding: 15px;
  border: 1px solid #c9dcd7;
  border-radius: 10px;
  background: #edf5f2;
}
.ticket-result-mark { display: grid; width: 26px; height: 26px; place-items: center; border-radius: 50%; background: var(--teal); color: #fff; font-size: 12px; }
.ticket-result strong { font-size: 13px; }
.ticket-result p { margin: 4px 0 0; color: var(--muted); font-size: 11px; }
.ticket-table-wrap { overflow-x: auto; }
.ticket-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.ticket-table th,
.ticket-table td { min-width: 110px; padding: 15px 10px; border-top: 1px solid var(--rule); text-align: left; }
.ticket-table th:first-child,
.ticket-table td:first-child { min-width: 220px; padding-left: 2px; }
.ticket-table thead th { border-top: 0; color: var(--quiet); font-size: 10px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
.ticket-table tbody th { color: var(--ink); font-weight: 750; }
.ticket-status { display: inline-flex; padding: 5px 8px; border-radius: 99px; font-size: 10px; font-style: normal; font-weight: 750; }
.ticket-status.in-progress { background: #eef1f4; color: #4d6577; }
.ticket-status.received { background: #edf5f2; color: #2f6b63; }
.analytics-toolbar select:focus-visible,
.configuration-grid select:focus-visible,
.configuration-grid input:focus-visible,
.configuration-grid textarea:focus-visible {
  outline: 3px solid var(--insight-chart);
  outline-offset: 2px;
}

@media (max-width: 1120px) {
  .telemetry-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 860px) {
  .metric-grid-primary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .metric-grid-primary .metric-card:first-child { grid-column: 1 / -1; }
  .analytics-toolbar { align-items: stretch; flex-wrap: wrap; }
  .analytics-toolbar label { flex: 1 1 180px; }
  .data-badge { margin-left: 0; align-self: end; }
  .insight-layout,
  .configuration-grid { grid-template-columns: 1fr; }
}
@media (max-width: 620px) {
  .telemetry-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .analytics-toolbar { display: grid; }
  .analytics-toolbar label { min-width: 0; }
  .wave-chart { min-height: 220px; }
  .wave-chart svg { height: 210px; }
  .chart-axis li:nth-child(even) { visibility: hidden; }
  .distribution-row { grid-template-columns: minmax(0, 1fr) auto; gap: 8px 12px; }
  .distribution-track { grid-column: 1 / -1; }
  .ticket-table { min-width: 610px; }
  body[data-agent-enabled="true"] .portal-content { padding-right: 15px; padding-bottom: 190px; }
}
@media (max-width: 390px) {
  .metric-grid-primary,
  .telemetry-grid { grid-template-columns: 1fr; }
  .metric-grid-primary .metric-card:first-child { grid-column: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .chart-line,
  .chart-area,
  .distribution-track i,
  .telemetry-kpi path { transition: none !important; }
}
`;
