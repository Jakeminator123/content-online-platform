import { selectStatisticsViews, type StatisticsFocus } from './statistics-policy.js';

type StatisticsWorkspace = {
  customers: Array<{ id: string; name: string; productIds: string[] }>;
  products: Array<{ id: string; name: string; publisherId: string; usage: number; renewal: string }>;
  publishers: Array<{ id: string; name: string }>;
};
// Same synthetic 2025 comparators as the KTH customer presentation, never another customer's usage.
const previousUsage: Record<string, number> = {
  'ieee-xplore': 371900, 'springer-nature': 279100, 'acm-dl': 164300,
  sciencedirect: 498400, 'wiley-online': 151200, 'sis-standarder': 29800,
  oreilly: 71200, knovel: 44900,
};
export type CustomerStatistics = {
  customerId: string; customerName: string; status: 'synthetic' | 'missing_data';
  focus: StatisticsFocus;
  products: Array<{ id: string; title: string; publisher: string; requestsYtd: number; requestsPrevYtd: number | null; renewal: string }>;
};
export function buildWorkspaceStatistics(workspace: StatisticsWorkspace, now = new Date()) {
  return {
    mode: 'synthetic_read_only' as const, persisted: false as const, period: 'Januari–augusti 2026',
    customers: workspace.customers.map((customer): CustomerStatistics => {
      const isKth = customer.id === 'customer-kth-demo';
      const products = isKth ? workspace.products.filter(product => customer.productIds.includes(product.id)).map(product => ({
        id: product.id, title: product.name,
        publisher: workspace.publishers.find(p => p.id === product.publisherId)?.name ?? product.publisherId,
        requestsYtd: product.usage, requestsPrevYtd: previousUsage[product.id] ?? null, renewal: product.renewal,
      })) : [];
      return {
        customerId: customer.id, customerName: customer.name, status: isKth ? 'synthetic' : 'missing_data', products,
        focus: selectStatisticsViews({
          organizationId: customer.id, resources: products, periodEnd: '2026-08-31', now,
          // Existing KTH demand fixtures: 18,420 + 11,870 + 9,340 + 6,210 + 4,780.
          ...(isKth ? { denials: 50620 } : {}),
        }),
      };
    }),
  };
}
