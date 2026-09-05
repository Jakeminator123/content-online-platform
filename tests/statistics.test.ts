import { describe, expect, it } from 'vitest';
import { runInNewContext, Script } from 'node:vm';
import { demoWorkspace } from '../src/admin/demo-data.js';
import { selectStatisticsViews, type StatisticsResource } from '../src/admin/statistics-policy.js';
import { buildWorkspaceStatistics } from '../src/admin/statistics.js';
import { runAdminJob } from '../src/admin/jobs.js';
import { answerAdminQuestion } from '../src/admin/assistant.js';
import { statisticsClient } from '../src/admin/statistics-client.js';
import { workspaceClient } from '../src/admin/workspace-client.js';

const now = new Date('2026-09-05T00:00:00Z');
const row: StatisticsResource = { id: 'a', title: 'A', publisher: 'P', requestsYtd: 90, requestsPrevYtd: 100, renewal: '2026-09-30' };
const choose = (resources: StatisticsResource[] = [row], commercial = false) => selectStatisticsViews({ organizationId: 'kth', resources, commercial, periodEnd: '2026-08-31', now });

describe('explainable statistics selection', () => {
  it('prioritizes negative signals and demand before positive framing', () => {
    const focus = selectStatisticsViews({ organizationId: 'kth', resources: [row], denials: 50, commercial: true, periodEnd: '2026-08-31', now });
    expect(focus.recommendations.map(r => r.view)).toEqual(['changes','demand','renewals']);
  });
  it('does not select financial views for readers', () => {
    expect(choose([{ ...row, renewal: '2027-12-31' }]).recommendations.some(r => r.view === 'budget')).toBe(false);
  });
  it('does not fabricate growth or treat missing usage as zero', () => {
    expect(choose([{ ...row, requestsPrevYtd: 0, renewal: '2027-12-31' }]).recommendations.some(r => r.view === 'changes')).toBe(false);
    const focus = choose([{ ...row, requestsYtd: null, renewal: '2027-12-31' }]);
    expect(focus.recommendations).toEqual([]);
    expect(focus.warnings.join(' ')).toContain('Saknad data');
  });
  it('excludes past renewals and includes exactly day 90', () => {
    for (const [days, expected] of [[-1,false],[0,true],[90,true],[91,false]] as const) {
      const renewal = new Date(now.getTime() + days * 86400000).toISOString().slice(0,10);
      expect(choose([{ ...row, renewal }]).recommendations.some(r => r.view === 'renewals')).toBe(expected);
    }
  });
  it('is deterministic, bounded and flags stale periods', () => {
    expect(choose()).toEqual(choose());
    expect(choose().recommendations.length).toBeLessThanOrEqual(3);
    const stale = selectStatisticsViews({ organizationId: 'kth', resources: [row], periodEnd: '2025-08-31', now });
    expect(stale.warnings.join(' ')).toContain('gammal');
  });
  it('rejects invalid evaluation dates', () => {
    expect(() => selectStatisticsViews({ organizationId: 'kth', resources: [], periodEnd: '2026-08-31', now: new Date('invalid') })).toThrow();
  });
});

describe('workspace, chat and existing job integration', () => {
  it('never borrows KTH usage for other customers', () => {
    const result = buildWorkspaceStatistics(demoWorkspace, now);
    const kth = result.customers.find(c => c.customerId === 'customer-kth-demo')!;
    expect(kth.products).toHaveLength(8);
    expect(kth.focus.recommendations.map(r => r.view)).toEqual(['changes','demand','renewals']);
    for (const customer of result.customers.filter(c => c !== kth)) {
      expect(customer.status).toBe('missing_data');
      expect(customer.products).toEqual([]);
      expect(customer.focus.recommendations).toEqual([]);
    }
  });
  it('filters product data to customer assignments before selection', () => {
    const workspace = { ...demoWorkspace, customers: demoWorkspace.customers.map(c => ({ ...c, productIds: c.id === 'customer-kth-demo' ? ['ieee-xplore'] : c.productIds })) };
    const kth = buildWorkspaceStatistics(workspace, now).customers.find(c => c.customerId === 'customer-kth-demo')!;
    expect(kth.products.map(p => p.id)).toEqual(['ieee-xplore']);
  });
  it('returns identical calculation in the existing cron/manual job without writes', () => {
    const execution = runAdminJob('platform-readiness', demoWorkspace, now)!;
    expect(execution.statistics).toEqual(buildWorkspaceStatistics(demoWorkspace, now));
    expect(execution.persisted).toBe(false);
    expect(execution.facts.some(f => f.label.includes('KTH') && f.value.includes('90 dagar'))).toBe(true);
    expect(runAdminJob('arbitrary-command', demoWorkspace, now)).toBeNull();
  });
  it('answers statistical questions without sending customer data to an LLM', async () => {
    const result = await answerAdminQuestion('Vilka KPIer och statistikvyer är bäst för KTH?', demoWorkspace, {
      adminId: 'admin', apiKey: 'unused-test-key', fetchImpl: async () => { throw new Error('Provider must not be called'); },
    });
    expect(result.mode).toBe('local_fallback');
    expect(result.answer).toContain('KTH');
    expect(result.answer).toContain('förklarbara regler');
    expect(result.answer).toContain('inte startat något jobb');
    expect(result.sources).toContain('STATISTICS_VIEWS.md');
  });
  it('explicitly reports missing statistics for another named customer', async () => {
    const result = await answerAdminQuestion('Vilken statistik passar Norrvik Teknik?', demoWorkspace, { adminId: 'admin' });
    expect(result.answer).toContain('Kundspecifik statistik saknas');
    expect(result.answer).not.toContain('50620');
  });
  it('publishes safe fixtures with a stable daily selection', () => {
    const data = JSON.parse(JSON.stringify(demoWorkspace));
    expect(data.statistics.persisted).toBe(false);
    expect(data.statistics.customers).toHaveLength(3);
    expect(JSON.stringify(data.statistics)).not.toMatch(/annualCost|email|Hampus|Bibbi/);
  });
  it('keeps the complete workspace JavaScript parseable', () => {
    expect(() => new Script(workspaceClient)).not.toThrow();
  });
  it('escapes names in the presentation and shows missing-data states', () => {
    const ui = runInNewContext(statisticsClient + '\nstatisticsUI') as { detail: (data: unknown, id: string) => string; overview: (data: unknown) => string };
    const result = buildWorkspaceStatistics(demoWorkspace, now);
    result.customers[0]!.customerName = '<img src=x onerror=alert(1)>';
    const html = ui.overview({ statistics: result });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(ui.detail({ statistics: result }, 'customer-norrvik-demo')).toContain('Saknad data är inte noll');
  });
});
