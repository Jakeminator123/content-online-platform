import { answerAdminQuestion as answerDocumentationQuestion } from './documentation-assistant.js';
import type { AssistantAnswer } from './documentation-assistant.js';
import type { DemoWorkspace } from './demo-data.js';
import { buildWorkspaceStatistics } from './statistics.js';

export { selectSources } from './documentation-assistant.js';
export type { AssistantAnswer } from './documentation-assistant.js';

// Keep existing model, provider privacy and document answers untouched. Statistics
// are answered from the same bounded policy as the existing scheduled/manual job.
export async function answerAdminQuestion(
  question: string,
  workspace: DemoWorkspace,
  options: Parameters<typeof answerDocumentationQuestion>[2],
): Promise<AssistantAnswer> {
  if (!/statistik|statestik|\bkpi(?:er)?\b|nyckeltal|statistikvy|rekommendera.*(?:vy|mått)/iu.test(question)) {
    return answerDocumentationQuestion(question, workspace, options);
  }
  const statistics = buildWorkspaceStatistics(workspace);
  const normalized = question.toLocaleLowerCase('sv-SE');
  const mentioned = statistics.customers.filter(customer => normalized.includes(customer.customerName.toLocaleLowerCase('sv-SE')));
  const selected = mentioned.length ? mentioned : statistics.customers;
  const details = selected.map(customer => {
    if (!customer.products.length) return `${customer.customerName}: Kundspecifik statistik saknas. Produkttilldelning är inte användningsdata; KTH:s värden återanvänds inte för andra kunder.`;
    const recommendations = customer.focus.recommendations.map((item, index) => `${index + 1}. ${item.title}: ${item.reason}`).join('\n');
    return `${customer.customerName} · syntetiskt underlag\n${recommendations}\n${customer.focus.warnings.join('\n')}`.trim();
  }).join('\n\n');
  const sources = ['STATISTICS_VIEWS.md', 'USAGE_KONVERTERING.md', 'AI_ASSISTENT.md'];
  return {
    mode: 'local_fallback', model: null, sources,
    answer: `KAN NU: Följande statistikvyer väljs med förklarbara regler, inte en AI-prognos.\n\n${details}\n\nVälj Användning i kundportalen eller kundens statistik i adminvyn. Det befintliga dagliga kontrolljobbet använder samma urval; under Jobb kan du köra det manuellt. Det här svaret har inte startat något jobb.\n\nINTE KLART: Underlaget är en demo utan liveimport. Urval och cronresultat sparas inte. Budgetvyn är endast för kundadministratörer och årsbudget/användning är inte periodiserad kostnad.\n\nKällor: ${sources.join(', ')}`,
  };
}
