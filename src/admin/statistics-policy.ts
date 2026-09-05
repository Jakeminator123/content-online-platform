/** Keep this dependency-free policy identical in the customer and admin repositories. */
export const STATISTICS_POLICY_VERSION = '2026-09-05.2';
export type StatisticsView = 'trend' | 'products' | 'publishers' | 'schools' | 'changes' | 'demand' | 'renewals' | 'budget';
export type StatisticsSignal = 'attention' | 'opportunity' | 'context';
export type StatisticsResource = {
  id: string; title: string; publisher: string;
  requestsYtd: number | null; requestsPrevYtd?: number | null; renewal?: string;
};
export type StatisticsRecommendation = {
  view: StatisticsView; title: string; reason: string; score: number; signal: StatisticsSignal;
};
export type StatisticsFocus = {
  policyVersion: string; organizationId: string; evaluatedAt: string;
  mode: 'rules_based'; recommendations: StatisticsRecommendation[]; warnings: string[];
};
export function selectStatisticsViews(input: {
  organizationId: string; resources: readonly StatisticsResource[]; denials?: number;
  commercial?: boolean; periodEnd: string; now?: Date;
}): StatisticsFocus {
  const now = input.now ?? new Date();
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid evaluation date');
  const valid = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  const rows = input.resources.filter(r => valid(r.requestsYtd));
  const warnings: string[] = [];
  const periodEnd = Date.parse(input.periodEnd + 'T00:00:00Z');
  if (!Number.isFinite(periodEnd) || now.getTime() - periodEnd > 1000 * 60 * 60 * 24 * 62) {
    warnings.push('Statistikperioden är gammal eller okänd. Kontrollera underlaget innan beslut.');
  }
  if (rows.length !== input.resources.length) warnings.push('Statistik saknas för vissa produkter. Saknad data är inte noll användning.');
  const candidates: StatisticsRecommendation[] = [];
  const add = (view: StatisticsView, title: string, reason: string, score: number, signal: StatisticsSignal = 'context') => {
    candidates.push({ view, title, reason, score, signal });
  };
  const declined = rows.filter(r => valid(r.requestsPrevYtd) && r.requestsPrevYtd > 0 && r.requestsYtd! < r.requestsPrevYtd * 0.95);
  if (declined.length) add('changes', 'Följ upp minskad användning', `${declined.length} ${declined.length === 1 ? 'produkt' : 'produkter'} har minskat mer än 5 % jämfört med samma period föregående år.`, 100, 'attention');
  if (valid(input.denials) && input.denials > 0) add('demand', 'Förstå efterfrågan utan tillgång', `${new Intl.NumberFormat('sv-SE').format(input.denials)} nekade åtkomster i perioden. Undersök orsakerna innan en inköpsdialog.`, 95, 'attention');
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const upcoming = input.resources.filter(r => {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(r.renewal ?? '') ? Date.parse(r.renewal + 'T00:00:00Z') : NaN;
    const days = (date - today) / 86400000;
    return Number.isFinite(days) && days >= 0 && days <= 90;
  });
  if (upcoming.length) add('renewals', 'Förbered nästa förnyelse', `${upcoming.length} ${upcoming.length === 1 ? 'produkt' : 'produkter'} har förnyelsedatum inom 90 dagar. Se användning och datum tillsammans.`, 90, 'attention');
  const growing = rows.filter(r => valid(r.requestsPrevYtd) && r.requestsPrevYtd > 0 && r.requestsYtd! >= r.requestsPrevYtd * 1.1);
  if (!declined.length && growing.length) add('changes', 'Se vad som växer', `${growing.length} ${growing.length === 1 ? 'produkt' : 'produkter'} har minst 10 % högre användning än samma period föregående år.`, 75, 'opportunity');
  const total = rows.reduce((sum, r) => sum + r.requestsYtd!, 0);
  const publishers = new Map<string, number>();
  rows.forEach(r => publishers.set(r.publisher, (publishers.get(r.publisher) ?? 0) + r.requestsYtd!));
  const largest = Math.max(0, ...publishers.values());
  if (total > 0 && largest / total >= 0.5) add('publishers', 'Förstå portföljens tyngdpunkt', 'Minst hälften av periodens användning ligger hos samma publicist. Jämför fördelningen i demoportföljen.', 70);
  if (input.commercial && rows.length) add('budget', 'Sätt budgeten i sammanhang', 'Jämför årsbudget och periodens användning. Måttet är inte periodiserad kostnad eller ett mått på kvalitet.', 60);
  if (rows.length) {
    add('trend', 'Följ utvecklingen över tid', 'Se månadsmönstret och skilj variation över året från långsiktig förändring.', 50);
    add('products', 'Se hela produktportföljen', 'Jämför produktanvändning med synliga definitioner och perioder.', 45);
    add('publishers', 'Se fördelningen per publicist', 'Flera produkter kan tillhöra samma publicist. Vyn samlar demoportföljens användning.', 40);
  } else {
    warnings.push('Underlag saknas för automatiska statistikval. Visa portföljen utan att dra slutsatser om användning.');
  }
  const unique = new Map<StatisticsView, StatisticsRecommendation>();
  for (const candidate of candidates.sort((a, b) => b.score - a.score || a.view.localeCompare(b.view))) {
    if (!unique.has(candidate.view)) unique.set(candidate.view, candidate);
  }
  return {
    policyVersion: STATISTICS_POLICY_VERSION, organizationId: input.organizationId,
    evaluatedAt: now.toISOString(), mode: 'rules_based', recommendations: [...unique.values()].slice(0, 3), warnings,
  };
}
