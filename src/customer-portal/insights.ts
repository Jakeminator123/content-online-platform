export type PortalInsightProduct = {
  id: string;
  name: string;
  type: string;
  publisher: string;
  usage: number;
};

type TelemetryMetricId = "downloads" | "activeUsers" | "sessions" | "sessionMinutes" | "returnRate";
type TelemetryPeriodId = "30d" | "90d" | "12m";

type TelemetryMetric = {
  label: string;
  shortLabel: string;
  unit: string;
  format: "integer" | "decimal" | "percent";
};

type TelemetryPeriod = {
  label: string;
  comparison: string;
  labels: string[];
  series: Record<TelemetryMetricId, number[]>;
  kpis: Record<TelemetryMetricId, { value: number; delta: number }>;
};

export type PortalInsightsConfig = {
  dataMode: "synthetic_demo";
  defaultMetric: TelemetryMetricId;
  defaultPeriod: TelemetryPeriodId;
  metrics: Record<TelemetryMetricId, TelemetryMetric>;
  periods: Record<TelemetryPeriodId, TelemetryPeriod>;
  productUsage: Array<{ id: string; label: string; detail: string; value: number }>;
  publisherUsage: Array<{ id: string; label: string; detail: string; value: number }>;
  contentMix: Array<{ label: string; value: number; share: number; color: string }>;
  productUsageTotal: number;
  productUsageChange: number;
  productCount: number;
  publisherCount: number;
  nextRenewal: string;
  provenance: {
    telemetry: string;
    productUsage: string;
    period: string;
  };
};

const metrics: Record<TelemetryMetricId, TelemetryMetric> = {
  downloads: { label: "Materialnedladdningar", shortLabel: "Nedladdningar", unit: "filer", format: "integer" },
  activeUsers: { label: "Aktiva användare per intervall", shortLabel: "Aktiva · senaste", unit: "personer", format: "integer" },
  sessions: { label: "Sessioner", shortLabel: "Sessioner", unit: "besök", format: "integer" },
  sessionMinutes: { label: "Genomsnittlig sessionstid", shortLabel: "Sessionstid", unit: "min", format: "decimal" },
  returnRate: { label: "Återkommande användare per intervall", shortLabel: "Återkommande · senaste", unit: "%", format: "percent" },
};

// This is a deliberately separate, synthetic portal-telemetry fixture. It must never
// be relabelled as publisher usage, COUNTER data, or real customer behaviour.
type TelemetrySeries = Record<TelemetryMetricId, number[]>;
type TelemetryDeltas = Record<TelemetryMetricId, number>;

const annualSeries: TelemetrySeries = {
  downloads: [12_100, 12_760, 13_980, 11_840, 14_260, 15_380, 17_420, 17_960, 18_640, 19_480, 20_740, 21_740],
  activeUsers: [6_840, 7_090, 7_360, 6_710, 7_680, 8_120, 8_940, 9_380, 9_860, 10_520, 11_340, 12_180],
  sessions: [8_900, 9_200, 9_500, 8_700, 9_800, 10_400, 11_300, 11_900, 12_400, 13_200, 14_100, 15_300],
  sessionMinutes: [6.8, 6.9, 7.0, 6.7, 7.1, 7.2, 7.4, 7.5, 7.6, 7.7, 7.8, 7.8],
  returnRate: [48, 49, 50, 47, 51, 52, 53, 54, 55, 55, 56, 56],
};

const augustFiveDaySeries: TelemetrySeries = {
  downloads: [3_200, 3_300, 3_400, 3_500, 3_800, 4_540],
  activeUsers: [1_900, 2_100, 2_300, 2_500, 2_800, 3_100],
  sessions: [2_200, 2_300, 2_400, 2_500, 2_700, 3_200],
  sessionMinutes: [7.4, 7.5, 7.6, 7.8, 8.0, 8.2],
  returnRate: [52, 53, 54, 55, 55, 56],
};

function sliceSeries(series: TelemetrySeries, start: number, end?: number): TelemetrySeries {
  return Object.fromEntries(
    (Object.keys(metrics) as TelemetryMetricId[]).map((id) => [id, series[id].slice(start, end)]),
  ) as TelemetrySeries;
}

function summarizeMetric(id: TelemetryMetricId, series: TelemetrySeries): number {
  const values = series[id];
  if (id === "downloads" || id === "sessions") return values.reduce((sum, value) => sum + value, 0);
  if (id === "sessionMinutes") {
    const sessions = series.sessions;
    const totalSessions = sessions.reduce((sum, value) => sum + value, 0);
    const weighted = values.reduce((sum, value, index) => sum + value * (sessions[index] ?? 0), 0) / Math.max(totalSessions, 1);
    return Math.round(weighted * 10) / 10;
  }
  return values.at(-1) ?? 0;
}

function createPeriod(
  label: string,
  comparison: string,
  labels: string[],
  series: TelemetrySeries,
  deltas: TelemetryDeltas,
): TelemetryPeriod {
  return {
    label,
    comparison,
    labels,
    series,
    kpis: Object.fromEntries(
      (Object.keys(metrics) as TelemetryMetricId[]).map((id) => [id, { value: summarizeMetric(id, series), delta: deltas[id] }]),
    ) as TelemetryPeriod["kpis"],
  };
}

function comparisonDeltas(current: TelemetrySeries, previous: TelemetrySeries): TelemetryDeltas {
  return Object.fromEntries((Object.keys(metrics) as TelemetryMetricId[]).map((id) => {
    const currentValue = summarizeMetric(id, current);
    const previousValue = summarizeMetric(id, previous);
    const delta = id === "sessionMinutes"
      ? currentValue - previousValue
      : (currentValue - previousValue) / Math.max(previousValue, 1) * 100;
    return [id, Math.round(delta * 10) / 10];
  })) as TelemetryDeltas;
}

const currentQuarter = sliceSeries(annualSeries, -3);
const previousQuarter = sliceSeries(annualSeries, -6, -3);

const periods: Record<TelemetryPeriodId, TelemetryPeriod> = {
  "30d": createPeriod(
    "30 dagar",
    "femdagarsvärden · separat syntetisk jämförelse mot föregående 30 dagar",
    ["2–6 aug", "7–11 aug", "12–16 aug", "17–21 aug", "22–26 aug", "27–31 aug"],
    augustFiveDaySeries,
    { downloads: 11.8, activeUsers: 9.3, sessions: 7.6, sessionMinutes: 0.6, returnRate: 3.0 },
  ),
  "90d": createPeriod(
    "90 dagar",
    "månadsvärden · beräknat mot föregående 90 dagar",
    ["Jun", "Jul", "Aug"],
    currentQuarter,
    comparisonDeltas(currentQuarter, previousQuarter),
  ),
  "12m": createPeriod(
    "12 månader",
    "månadsvärden · separat syntetisk jämförelse mot föregående 12 månader",
    ["Sep", "Okt", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug"],
    annualSeries,
    { downloads: 13.2, activeUsers: 10.6, sessions: 9.1, sessionMinutes: 0.5, returnRate: 5.0 },
  ),
};

const mixColors = ["#285b70", "#397b73", "#af8243", "#708594", "#9b6b62"];

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function formatNumber(value: number): string {
  return value.toLocaleString("sv-SE");
}

function formatTelemetry(value: number, metric: TelemetryMetric): string {
  const formatted = value.toLocaleString("sv-SE", { maximumFractionDigits: 1 });
  if (metric.format === "percent") return `${formatted} %`;
  if (metric.format === "decimal") return `${formatted} min`;
  return formatted;
}

function chartPoints(values: readonly number[], width = 688, height = 170, left = 16, top = 34) {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(maximum - minimum, Math.abs(maximum) * 0.08, 1);
  return values.map((value, index) => ({
    x: left + (values.length === 1 ? width / 2 : index / (values.length - 1) * width),
    y: top + (1 - (value - minimum) / range) * height,
  }));
}

function chartPath(points: ReadonlyArray<{ x: number; y: number }>): string {
  return points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
}

function identifier(value: string, fallback: string): string {
  const normalized = value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return normalized || fallback;
}

export function buildPortalInsights(products: readonly PortalInsightProduct[]): PortalInsightsConfig {
  const productUsage = [...products]
    .sort((left, right) => right.usage - left.usage)
    .map((product, index) => ({
      id: identifier(product.id, `product-${index + 1}`),
      label: product.name,
      detail: product.publisher,
      value: product.usage,
    }));
  const byPublisher = new Map<string, number>();
  const byType = new Map<string, number>();
  for (const product of products) {
    byPublisher.set(product.publisher, (byPublisher.get(product.publisher) ?? 0) + product.usage);
    byType.set(product.type, (byType.get(product.type) ?? 0) + product.usage);
  }
  const publisherUsage = [...byPublisher.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([label, value], index) => ({ id: identifier(label, `publisher-${index + 1}`), label, detail: "Publicist", value }));
  const total = productUsage.reduce((sum, item) => sum + item.value, 0);
  const mixTotal = [...byType.values()].reduce((sum, value) => sum + value, 0) || 1;
  const contentMix = [...byType.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([label, value], index) => ({
      label,
      value,
      share: Math.round(value / mixTotal * 1000) / 10,
      color: mixColors[index % mixColors.length]!,
    }));

  return {
    dataMode: "synthetic_demo",
    defaultMetric: "downloads",
    defaultPeriod: "90d",
    metrics,
    periods,
    productUsage,
    publisherUsage,
    contentMix,
    productUsageTotal: total,
    productUsageChange: 8.0,
    productCount: products.length,
    publisherCount: byPublisher.size,
    nextRenewal: "30 sep",
    provenance: {
      telemetry: "Separat syntetisk portaltelemetri – inte härledd från publisher-usage.",
      productUsage: "Syntetisk produktanvändning – inte verifierad COUNTER-statistik.",
      period: "Jan–aug 2026",
    },
  };
}

export function renderOverviewMetrics(insights: PortalInsightsConfig): string {
  const values = [
    [formatNumber(insights.productUsageTotal), "Produktanvändning", insights.provenance.period],
    [`+${insights.productUsageChange.toLocaleString("sv-SE", { minimumFractionDigits: 1 })} %`, "Förändring", "Mot samma period 2025"],
    [String(insights.productCount), "Produkter", "Tilldelade i demon"],
    [String(insights.publisherCount), "Publicister", "I portföljen"],
    [insights.nextRenewal, "Nästa förnyelse", "Syntetiskt datum"],
  ];
  return `<div class="metric-grid metric-grid-five">${values.map(([value, label, description]) => `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(description)}</small></article>`).join("")}</div>`;
}

function renderDistribution(items: PortalInsightsConfig["productUsage"], group: "product" | "publisher"): string {
  const max = Math.max(...items.map((item) => item.value), 1);
  return `<div class="distribution-list" data-insights-distribution="${group}"${group === "publisher" ? " hidden" : ""}>${items.slice(0, 7).map((item) => `<div class="distribution-row"><div><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.detail)}</small></div><span>${escapeHtml(formatNumber(item.value))}</span><div class="distribution-track"><i style="--distribution-size:${Math.max(4, Math.round(item.value / max * 100))}%"></i></div></div>`).join("")}</div>`;
}

function donutGradient(items: PortalInsightsConfig["contentMix"]): string {
  let start = 0;
  const segments = items.map((item) => {
    const end = Math.min(100, start + item.share);
    const segment = `${item.color} ${start}% ${end}%`;
    start = end;
    return segment;
  });
  if (start < 100) segments.push(`#dfe6e5 ${start}% 100%`);
  return `conic-gradient(${segments.join(",")})`;
}

export function renderInsightsPanel(insights: PortalInsightsConfig): string {
  const initialPeriod = insights.periods[insights.defaultPeriod];
  const initialMetric = insights.metrics[insights.defaultMetric];
  const initialValues = initialPeriod.series[insights.defaultMetric];
  const initialPoints = chartPoints(initialValues);
  const initialPath = chartPath(initialPoints);
  const metricOptions = Object.entries(insights.metrics).map(([id, metric]) => `<option value="${escapeHtml(id)}">${escapeHtml(metric.label)}</option>`).join("");
  const periodOptions = Object.entries(insights.periods).map(([id, period]) => `<option value="${escapeHtml(id)}"${id === insights.defaultPeriod ? " selected" : ""}>${escapeHtml(period.label)}</option>`).join("");
  const kpiCards = (Object.keys(insights.metrics) as TelemetryMetricId[]).map((id) => {
    const metric = insights.metrics[id];
    const kpi = initialPeriod.kpis[id];
    const sparkline = chartPath(chartPoints(initialPeriod.series[id], 88, 20, 4, 5));
    const sign = kpi.delta > 0 ? "+" : "";
    const deltaUnit = id === "sessionMinutes" ? " min" : " %";
    return `<article class="telemetry-kpi" data-insights-kpi="${id}"><div><span>${escapeHtml(metric.shortLabel)}</span><small data-kpi-delta${kpi.delta < 0 ? ' class="is-negative"' : ""}>${escapeHtml(`${sign}${kpi.delta.toLocaleString("sv-SE", { maximumFractionDigits: 1 })}${deltaUnit}`)}</small></div><strong data-kpi-value>${escapeHtml(formatTelemetry(kpi.value, metric))}</strong><svg viewBox="0 0 96 30" aria-hidden="true" data-kpi-sparkline><path d="${sparkline}"></path></svg></article>`;
  }).join("");
  const mixRows = insights.contentMix.map((item) => `<li><span><i style="--mix-color:${item.color}"></i>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.share.toLocaleString("sv-SE"))} %</strong></li>`).join("");
  const initialDescription = `${initialMetric.label} över ${initialPeriod.label}: ${initialValues.map((value, index) => `${initialPeriod.labels[index]} ${formatTelemetry(value, initialMetric)}`).join(", ")}. Syntetisk portaltelemetri.`;
  const initialCircles = initialPoints.map((point) => `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3.6" aria-hidden="true"></circle>`).join("");
  const initialAxis = initialPeriod.labels.map((label) => `<li>${escapeHtml(label)}</li>`).join("");

  return `<fieldset class="analytics-toolbar"><legend class="sr-only">Analysfilter</legend><label><span>Period</span><select data-insights-period>${periodOptions}</select></label><label><span>KPI i trendgraf</span><select data-insights-metric>${metricOptions}</select></label><label><span>Gruppera användning</span><select data-insights-group><option value="product">Produkt</option><option value="publisher">Publicist</option></select></label><span class="data-badge">Syntetisk telemetri</span></fieldset>
  <p class="provenance-note">${escapeHtml(insights.provenance.telemetry)}</p>
  <div class="telemetry-grid">${kpiCards}</div>
  <div class="insight-layout"><section class="surface trend-surface"><div class="surface-head"><div><span class="section-kicker">TREND</span><h2 data-insights-title>${escapeHtml(initialMetric.label)}</h2><p data-insights-comparison>${escapeHtml(`${initialPeriod.label} · ${initialPeriod.comparison}`)}</p></div><strong class="chart-total" data-insights-total>${escapeHtml(formatTelemetry(initialPeriod.kpis[insights.defaultMetric].value, initialMetric))}</strong></div><div class="wave-chart"><svg viewBox="0 0 720 250" preserveAspectRatio="none" role="img" aria-labelledby="insights-chart-title insights-chart-description"><title id="insights-chart-title">Syntetisk portaltelemetri</title><desc id="insights-chart-description" data-insights-description>${escapeHtml(initialDescription)}</desc><defs><linearGradient id="insights-area-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--portal-accent)" stop-opacity=".28"/><stop offset="1" stop-color="var(--portal-accent)" stop-opacity=".02"/></linearGradient></defs><g class="chart-grid" aria-hidden="true"><path d="M16 42H704M16 92H704M16 142H704M16 192H704"/></g><path class="chart-area" data-insights-area d="${initialPath} L704 220 L16 220 Z"></path><path class="chart-line" data-insights-line d="${initialPath}"></path><g data-insights-points>${initialCircles}</g></svg><div class="chart-tooltip" data-insights-tooltip hidden></div></div><ol class="chart-axis" data-insights-axis aria-hidden="true">${initialAxis}</ol><details class="chart-data"><summary>Visa datapunkter</summary><table><thead><tr><th scope="col">Intervall</th><th scope="col">Värde</th></tr></thead><tbody data-insights-data-body>${initialValues.map((value, index) => `<tr><th scope="row">${escapeHtml(initialPeriod.labels[index])}</th><td>${escapeHtml(formatTelemetry(value, initialMetric))}</td></tr>`).join("")}</tbody></table></details></section>
  <aside class="surface donut-surface"><span class="section-kicker">INNEHÅLLSMIX</span><h2>Användning per innehållstyp</h2><div class="donut-wrap"><div class="donut-chart" role="img" aria-label="Syntetisk produktanvändning fördelad per innehållstyp" style="--donut-fill:${escapeHtml(donutGradient(insights.contentMix))}"><span><strong>${insights.contentMix.length}</strong><small>typer</small></span></div><ul>${mixRows}</ul></div><p class="provenance-note">${escapeHtml(insights.provenance.productUsage)}</p></aside></div>
  <section class="surface distribution-surface"><div class="surface-head"><div><span class="section-kicker">FÖRDELNING</span><h2 data-insights-distribution-title>Produktanvändning</h2><p>${escapeHtml(insights.provenance.period)}</p></div><span class="status-chip">Demo</span></div>${renderDistribution(insights.productUsage, "product")}${renderDistribution(insights.publisherUsage, "publisher")}</section>`;
}

export function renderConfigurationPanel(isDemo: boolean): string {
  if (!isDemo) {
    return `<div class="locked-state"><div><strong>Verifierad inloggning krävs</strong><p>Inställningar och ärenden visas först när kundmedlemskapet har verifierats.</p></div></div>`;
  }
  return `<div class="configuration-grid"><section class="surface preference-card"><div class="surface-head"><div><span class="section-kicker">PORTALVY</span><h2>Visningsinställningar</h2><p>Välj hur rapporter och analys ska öppnas i denna demoflik.</p></div></div><form data-demo-preference-form><label><span>Standardperiod</span><select name="period"><option value="90d">90 dagar</option><option value="30d">30 dagar</option><option value="12m">12 månader</option></select></label><label><span>Rapportflöde</span><select name="cadence"><option value="monthly">Månadsvis sammanställning</option><option value="quarterly">Kvartalsvis sammanställning</option><option value="manual">Endast på begäran</option></select></label><label class="check-row"><input type="checkbox" name="comparison" checked><span>Visa jämförelse med föregående period</span></label><button class="button secondary" type="submit">Använd i demofliken</button><p class="form-status" data-preference-status aria-live="polite"></p></form></section>
  <section class="surface ticket-card"><div class="surface-head"><div><span class="section-kicker">ÄRENDEN</span><h2>Förhandsvisa en begäran</h2><p>Access, användningsdata och medlemsändringar hanteras som spårbara ärenden.</p></div><span class="status-chip muted-chip">Demo</span></div><form data-demo-ticket-form><label><span>Ärendetyp</span><select name="category" required><option value="access">Access</option><option value="usage_data">Användningsdata</option><option value="membership_change">Medlemsändring</option><option value="other">Övrigt</option></select></label><label><span>Rubrik</span><input name="title" minlength="3" maxlength="120" required placeholder="Beskriv kort vad som behövs"></label><label><span>Beskrivning</span><textarea name="description" minlength="3" maxlength="2000" required rows="4" placeholder="Ge Content Online det underlag som behövs"></textarea></label><button class="button primary" type="submit">Förhandsvisa ärende</button><p class="form-hint">Demoläge: förhandsvisningen stannar i denna flik. Inget skickas eller sparas.</p></form><div class="ticket-result" data-ticket-result hidden aria-live="polite"><span class="ticket-result-mark">✓</span><div><strong data-ticket-result-title></strong><p data-ticket-result-detail></p></div></div></section></div>
  <section class="surface ticket-history"><div class="surface-head"><div><span class="section-kicker">STATUS</span><h2>Senaste demoärenden</h2></div></div><div class="ticket-table-wrap"><table class="ticket-table"><caption class="sr-only">Senaste syntetiska ärenden</caption><thead><tr><th scope="col">Ärende</th><th scope="col">Typ</th><th scope="col">Status</th><th scope="col">Uppdaterat</th></tr></thead><tbody><tr><th scope="row">Tillgång till IEEE-resurs</th><td>Access</td><td><i class="ticket-status in-progress">Pågår</i></td><td>I går</td></tr><tr><th scope="row">Rapport för augusti</th><td>Användningsdata</td><td><i class="ticket-status received">Mottaget</i></td><td>28 aug</td></tr></tbody></table></div></section>`;
}
