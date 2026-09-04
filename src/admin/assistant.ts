import { createHash } from "node:crypto";
import type { DemoWorkspace } from "./demo-data.js";

const DEFAULT_MODEL = "gpt-5.6-luna";

const knowledgeSources = [
  {
    id: "PROJEKTBRIEF.md",
    keywords: ["plattform", "innehåll", "produkt", "abonnemang", "förny", "ärende", "dokument"],
    facts:
      "Plattformen ska ge varje behörig kund en samlad bild av köpta informationsprodukter, användning, förnyelser, accessinformation, dokument och ärenden. Själva innehållet ligger kvar hos respektive publisher.",
  },
  {
    id: "BEHORIGHETSMODELL.md",
    keywords: ["kund", "använd", "roll", "behör", "data", "kth", "läsare", "admin"],
    facts:
      "Kundadministratör och Läsare ser endast sin egen organisation. Content Online-administratör är en separat intern roll. Backend ska alltid göra den slutliga tenant- och rollkontrollen.",
  },
  {
    id: "ADMIN_DRIFT.md",
    keywords: ["kan", "klart", "nu", "status", "login", "inlogg", "clerk", "lagring", "integration"],
    facts:
      "Intern Clerk-inloggning och en skyddad syntetisk adminöversikt finns. Beständig lagring, skrivande kundadministration, produktionsauth och livekopplingar till publishers, Salesforce och Fortnox återstår.",
  },
  {
    id: "BACKEND_ANSVAR.md",
    keywords: ["api", "backend", "säker", "tenant", "audit", "källa"],
    facts:
      "Backend äger identitet, behörighet, tenantisolering, affärsregler, säkra datakontrakt, audit events och källspecifika adapters. Frontend får aldrig vara den slutliga säkerhetskontrollen.",
  },
  {
    id: "USAGE_KONVERTERING.md",
    keywords: ["usage", "mps", "statistik", "download", "kostnad", "counter"],
    facts:
      "Usage normaliseras källneutralt med synlig källa, period, definition, datatäckning och demo/live-status. IEEE/MPS är första spåret men inte en universell modell för alla publishers.",
  },
  {
    id: "AI_ASSISTENT.md",
    keywords: ["assistent", "ai", "bot", "cron", "jobb", "automat", "schema"],
    facts:
      "Assistenten svarar från projektets dokumenterade kontext och en minimerad adminöversikt. Den kan starta allowlistade kontrolljobb, men får inte köra godtyckliga kommandon eller påstå att ej anslutna system har uppdaterats.",
  },
] as const;

const instructions = `Du är Content Onlines interna assistent. Svara på svenska, konkret och med korta stycken.
Använd endast DOKUMENTERAD KONTEXT och SKYDDAD ÖVERSIKT i frågan. Hitta inte på kunddata, avtal, integrationer eller funktioner.
Skilj alltid tydligt mellan KAN NU, SKA KUNNA och INTE KLART när frågan gäller förmågor eller status.
All kunddata i nuvarande översikt är syntetisk demo. Säg det när du beskriver kunder, användare eller usage.
Du kan inte själv köra jobb i chattsvaret. Hänvisa till fliken Jobb när användaren vill starta ett allowlistat jobb.
Säg aldrig att en extern synk, renewal, accessändring eller affärshändelse har utförts. Ge inte juridiska eller bindande besked.
Avsluta med "Källor:" och namnen på relevanta dokument från kontexten.`;

export type AssistantAnswer = {
  answer: string;
  mode: "openai" | "local_fallback";
  model: string | null;
  sources: string[];
};

type AssistantOptions = {
  apiKey?: string;
  model?: string;
  fetchImpl?: typeof fetch;
  adminId: string;
};

export async function answerAdminQuestion(
  question: string,
  workspace: DemoWorkspace,
  options: AssistantOptions,
): Promise<AssistantAnswer> {
  const sources = selectSources(question);
  const model = options.model?.trim() || DEFAULT_MODEL;
  const apiKey = options.apiKey?.trim();

  if (!apiKey) {
    return { answer: fallbackAnswer(question, workspace, sources), mode: "local_fallback", model: null, sources };
  }

  try {
    const response = await (options.fetchImpl ?? fetch)("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        instructions,
        input: buildGroundedInput(question, workspace, sources),
        max_output_tokens: 550,
        text: { verbosity: "low" },
        safety_identifier: createHash("sha256").update(options.adminId).digest("hex").slice(0, 40),
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) throw new Error("assistant_provider_error");
    const answer = extractResponseText(await response.json());
    if (!answer) throw new Error("assistant_empty_response");
    return { answer, mode: "openai", model, sources };
  } catch {
    return { answer: fallbackAnswer(question, workspace, sources), mode: "local_fallback", model: null, sources };
  }
}

export function selectSources(question: string): string[] {
  const normalized = question.toLocaleLowerCase("sv");
  const ranked = knowledgeSources
    .map((source, index) => ({
      id: source.id,
      index,
      score: source.keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? 1 : 0), 0),
    }))
    .filter((source) => source.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3)
    .map(({ id }) => id);
  return ranked.length > 0 ? ranked : ["PROJEKTBRIEF.md", "ADMIN_DRIFT.md"];
}

function buildGroundedInput(question: string, workspace: DemoWorkspace, sources: readonly string[]): string {
  const documentedContext = knowledgeSources
    .filter((source) => sources.includes(source.id))
    .map((source) => `${source.id}: ${source.facts}`)
    .join("\n");
  const roles = workspace.users.reduce<Record<string, { count: number; dataAccess: string[] }>>((result, user) => {
    const existing = result[user.role] ?? { count: 0, dataAccess: dataAccessForRole(user.role) };
    existing.count += 1;
    result[user.role] = existing;
    return result;
  }, {});
  const safeWorkspace = {
    status: workspace.status,
    customers: workspace.customers.map(({ users, products, status }, index) => ({
      reference: `Syntetisk kund ${index + 1}`,
      users,
      products,
      status,
      dataAreas: ["Produkter", "Användning", "Dokument", "Ärenden"],
    })),
    roles,
    publishers: workspace.publishers.map(({ name, route, status }) => ({ name, route, status })),
    connections: workspace.connections.map(({ name, mode, status, lastImport }) => ({ name, mode, status, lastImport })),
    storage: workspace.storage,
  };

  return `DOKUMENTERAD KONTEXT\n${documentedContext}\n\nSKYDDAD ÖVERSIKT (minimerad, utan e-post eller identitets-ID)\n${JSON.stringify(safeWorkspace)}\n\nFRÅGA\n${question}`;
}

function fallbackAnswer(question: string, workspace: DemoWorkspace, sources: readonly string[]): string {
  const normalized = question.toLocaleLowerCase("sv");
  const sourceLine = `Källor: ${sources.join(", ")}`;

  if (/cron|jobb|automat|schema/.test(normalized)) {
    return `KAN NU: Du kan starta fördefinierade, skrivskyddade kontrolljobb från fliken Jobb. Ett dagligt readiness-jobb är förberett för Vercel Cron.\n\nSKA KUNNA: Fler importer, kvalitetskontroller och förnyelseunderlag kan kopplas in när datakällor och lagring är beslutade.\n\nINTE KLART: Assistenten kör aldrig godtyckliga kommandon och inga externa system är anslutna ännu.\n\n${sourceLine}`;
  }
  if (/kund|använd|roll|behör|data|kth/.test(normalized)) {
    const users = workspace.users.length;
    return `KAN NU: Den skyddade vyn innehåller ${workspace.customers.length} syntetiska kundorganisationer och ${users} demokonton. Kundadministratör ser den kompletta tillåtna organisationsbilden; Läsare ser en begränsad vy.\n\nSKA KUNNA: Samma överblick ska senare bygga på serverfiltrerad live-data per kund och roll.\n\nINTE KLART: Nuvarande kund-, användar- och produktdata är syntetisk och ingen beständig kunddatabas är ansluten.\n\n${sourceLine}`;
  }
  return `KAN NU: Plattformen har en skyddad intern admininloggning, en syntetisk kundöversikt och API-kontrakt för portfölj, usage, medlemmar och ärenden.\n\nSKA KUNNA: Kunder ska få en samlad bild av produkter, användning, förnyelser, access, dokument och ärenden medan innehållet ligger kvar hos publishers.\n\nINTE KLART: Beständig lagring, skrivande administration, produktionsauth och livekopplingar till publishers, Salesforce och Fortnox återstår.\n\n${sourceLine}`;
}

function dataAccessForRole(role: string): string[] {
  return role === "Kundadministratör"
    ? ["Komplett tillåten kundbild", "Kostnad", "Användare och roller"]
    : ["Aktiv portfölj", "Publicerad usage", "Egna ärenden"];
}

function extractResponseText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("output" in payload) || !Array.isArray(payload.output)) return null;
  const parts: string[] = [];
  for (const item of payload.output) {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content && typeof content === "object" && "type" in content && content.type === "output_text" && "text" in content && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }
  const result = parts.join("\n").trim();
  return result || null;
}
