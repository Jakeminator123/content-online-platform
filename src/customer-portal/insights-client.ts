export const customerPortalInsightsClient = String.raw`
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

  const insights = config.insights;
  if (!insights || insights.dataMode !== 'synthetic_demo') return;

  const periodSelect = document.querySelector('[data-insights-period]');
  const metricSelect = document.querySelector('[data-insights-metric]');
  const groupSelect = document.querySelector('[data-insights-group]');
  const chart = document.querySelector('[data-insights-line]')?.closest('svg');
  const line = document.querySelector('[data-insights-line]');
  const area = document.querySelector('[data-insights-area]');
  const pointsGroup = document.querySelector('[data-insights-points]');
  const axis = document.querySelector('[data-insights-axis]');
  const title = document.querySelector('[data-insights-title]');
  const comparison = document.querySelector('[data-insights-comparison]');
  const total = document.querySelector('[data-insights-total]');
  const description = document.querySelector('[data-insights-description]');
  const tooltip = document.querySelector('[data-insights-tooltip]');
  const dataBody = document.querySelector('[data-insights-data-body]');
  const distributionTitle = document.querySelector('[data-insights-distribution-title]');
  const numberFormat = new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 });
  let pointData = [];
  let includeComparison = true;

  const metricIds = Object.keys(insights.metrics || {});
  const periodIds = Object.keys(insights.periods || {});
  const validMetric = (value) => metricIds.includes(value) ? value : insights.defaultMetric;
  const validPeriod = (value) => periodIds.includes(value) ? value : insights.defaultPeriod;

  const formatValue = (value, metric) => {
    if (!Number.isFinite(value)) return '–';
    if (metric.format === 'percent') return numberFormat.format(value) + ' %';
    if (metric.format === 'decimal') return numberFormat.format(value) + ' min';
    return numberFormat.format(Math.round(value));
  };

  const geometry = (values, width = 688, height = 170, left = 16, top = 34) => {
    const safe = values.filter(Number.isFinite);
    const min = Math.min(...safe);
    const max = Math.max(...safe);
    const range = Math.max(max - min, Math.abs(max) * .08, 1);
    return values.map((value, index) => ({
      x: left + (values.length === 1 ? width / 2 : index / (values.length - 1) * width),
      y: top + (1 - (value - min) / range) * height,
      value,
    }));
  };

  const pathFor = (points) => points.map((point, index) => (index ? 'L' : 'M') + point.x.toFixed(1) + ' ' + point.y.toFixed(1)).join(' ');

  const renderSparkline = (card, values) => {
    const path = card.querySelector('[data-kpi-sparkline] path');
    if (!path) return;
    const points = geometry(values, 88, 20, 4, 5);
    path.setAttribute('d', pathFor(points));
  };

  const updateKpis = (period) => {
    document.querySelectorAll('[data-insights-kpi]').forEach((card) => {
      const id = card.dataset.insightsKpi;
      const metric = insights.metrics[id];
      const kpi = period.kpis[id];
      if (!metric || !kpi) return;
      const valueNode = card.querySelector('[data-kpi-value]');
      const deltaNode = card.querySelector('[data-kpi-delta]');
      if (valueNode) valueNode.textContent = formatValue(kpi.value, metric);
      if (deltaNode) {
        const sign = kpi.delta > 0 ? '+' : '';
        deltaNode.textContent = sign + numberFormat.format(kpi.delta) + (id === 'sessionMinutes' ? ' min' : ' %');
        deltaNode.classList.toggle('is-negative', kpi.delta < 0);
      }
      renderSparkline(card, period.series[id] || []);
    });
  };

  const renderPoints = (points, labels, metric) => {
    if (!pointsGroup) return;
    pointsGroup.replaceChildren();
    pointData = points.map((point, index) => ({ ...point, label: labels[index] || '', formatted: formatValue(point.value, metric) }));
    pointData.forEach((point) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', point.x.toFixed(1));
      circle.setAttribute('cy', point.y.toFixed(1));
      circle.setAttribute('r', '3.6');
      circle.setAttribute('aria-hidden', 'true');
      pointsGroup.append(circle);
    });
  };

  const renderAxis = (labels) => {
    if (!axis) return;
    axis.replaceChildren();
    labels.forEach((label) => {
      const item = document.createElement('li');
      item.textContent = label;
      axis.append(item);
    });
  };

  const renderDataTable = (labels, values, metric) => {
    if (!dataBody) return;
    dataBody.replaceChildren();
    values.forEach((value, index) => {
      const row = document.createElement('tr');
      const interval = document.createElement('th');
      const metricValue = document.createElement('td');
      interval.scope = 'row';
      interval.textContent = labels[index] || '';
      metricValue.textContent = formatValue(value, metric);
      row.append(interval, metricValue);
      dataBody.append(row);
    });
  };

  const updateChart = (options = {}) => {
    const periodId = validPeriod(periodSelect?.value);
    const metricId = validMetric(metricSelect?.value);
    const period = insights.periods[periodId];
    const metric = insights.metrics[metricId];
    const values = period.series[metricId] || [];
    const points = geometry(values);
    const linePath = pathFor(points);
    const areaPath = points.length ? linePath + ' L704 220 L16 220 Z' : '';
    line?.setAttribute('d', linePath);
    area?.setAttribute('d', areaPath);
    renderPoints(points, period.labels, metric);
    renderAxis(period.labels);
    renderDataTable(period.labels, values, metric);
    updateKpis(period);
    if (title) title.textContent = metric.label;
    if (comparison) comparison.textContent = period.label + (includeComparison ? ' · ' + period.comparison : '');
    if (total) total.textContent = formatValue(period.kpis[metricId].value, metric);
    if (description) description.textContent = metric.label + ' över ' + period.label + ': ' + values.map((value, index) => period.labels[index] + ' ' + formatValue(value, metric)).join(', ') + '. Syntetisk portaltelemetri.';
    if (options.announce) {
      const liveStatus = document.getElementById('portal-live-status');
      if (liveStatus) liveStatus.textContent = metric.label + ', ' + period.label + ': ' + formatValue(period.kpis[metricId].value, metric) + '.';
    }
  };

  const showTooltip = (event) => {
    if (!chart || !tooltip || !pointData.length) return;
    const bounds = chart.getBoundingClientRect();
    const relative = Math.max(0, Math.min(1, (event.clientX - bounds.left) / Math.max(bounds.width, 1)));
    const index = Math.round(relative * (pointData.length - 1));
    const point = pointData[index];
    tooltip.textContent = point.label + ': ' + point.formatted;
    tooltip.style.left = Math.max(12, Math.min(bounds.width - 150, relative * bounds.width)) + 'px';
    tooltip.style.top = Math.max(8, point.y / 250 * bounds.height - 28) + 'px';
    tooltip.hidden = false;
  };

  chart?.addEventListener('pointermove', showTooltip);
  chart?.addEventListener('pointerleave', () => { if (tooltip) tooltip.hidden = true; });
  periodSelect?.addEventListener('change', () => updateChart({ announce: true }));
  metricSelect?.addEventListener('change', () => updateChart({ announce: true }));
  groupSelect?.addEventListener('change', () => {
    const group = groupSelect.value === 'publisher' ? 'publisher' : 'product';
    document.querySelectorAll('[data-insights-distribution]').forEach((panel) => {
      panel.hidden = panel.dataset.insightsDistribution !== group;
    });
    if (distributionTitle) distributionTitle.textContent = group === 'publisher' ? 'Användning per publicist' : 'Produktanvändning';
    const liveStatus = document.getElementById('portal-live-status');
    if (liveStatus) liveStatus.textContent = (group === 'publisher' ? 'Publicistfördelning' : 'Produktfördelning') + ' visas.';
  });

  document.querySelector('[data-demo-preference-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const requestedPeriod = validPeriod(String(formData.get('period') || ''));
    const cadence = form.querySelector('[name="cadence"] option:checked')?.textContent || 'Månadsvis sammanställning';
    const periodLabel = form.querySelector('[name="period"] option:checked')?.textContent || insights.periods[requestedPeriod].label;
    includeComparison = formData.get('comparison') === 'on';
    document.body.classList.toggle('hide-insights-comparison', !includeComparison);
    if (periodSelect) {
      periodSelect.value = requestedPeriod;
      updateChart({ announce: true });
    }
    document.querySelectorAll('[data-report-cadence]').forEach((node) => { node.textContent = cadence; });
    const status = form.querySelector('[data-preference-status]');
    if (status) status.textContent = 'Förhandsvisning: ' + periodLabel + ', ' + cadence.toLowerCase() + (includeComparison ? ', med jämförelse.' : ', utan jämförelse.') + ' Inget har sparats.';
  });

  document.querySelector('[data-demo-ticket-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const category = form.querySelector('[name="category"] option:checked')?.textContent || 'Övrigt';
    const ticketTitle = String(formData.get('title') || '').trim();
    const result = document.querySelector('[data-ticket-result]');
    const resultTitle = document.querySelector('[data-ticket-result-title]');
    const resultDetail = document.querySelector('[data-ticket-result-detail]');
    if (resultTitle) resultTitle.textContent = 'Förhandsvisning: ' + ticketTitle;
    if (resultDetail) resultDetail.textContent = 'Kategori: ' + category + '. Inget har skickats eller sparats.';
    if (result) result.hidden = false;
  });

  if (periodSelect) periodSelect.value = validPeriod(insights.defaultPeriod);
  if (metricSelect) metricSelect.value = validMetric(insights.defaultMetric);
  updateChart();
})();
`;
