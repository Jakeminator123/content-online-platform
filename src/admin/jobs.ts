import type { DemoWorkspace } from "./demo-data.js";

export const adminJobs = [
  {
    id: "platform-readiness",
    title: "Plattformens beredskap",
    description: "Kontrollerar lagring, datakällor och pilotstatus utan att skriva till externa system.",
    schedule: "Dagligen 06:10 UTC",
    trigger: "scheduled_and_manual",
  },
  {
    id: "customer-scope-audit",
    title: "Kund- och rollöversikt",
    description: "Summerar syntetiska kunder och konton. Detta är inte en säkerhetsgranskning av faktisk åtkomst.",
    schedule: "Manuell",
    trigger: "manual",
  },
  {
    id: "renewal-preflight",
    title: "Förnyelseunderlag",
    description: "Kontrollerar om det finns tillräcklig verifierad avtalsdata för ett förnyelseunderlag.",
    schedule: "Manuell",
    trigger: "manual",
  },
] as const;

export type AdminJobId = (typeof adminJobs)[number]["id"];

export type JobExecution = {
  jobId: AdminJobId;
  status: "completed" | "attention_needed";
  mode: "synthetic_read_only";
  startedAt: string;
  finishedAt: string;
  summary: string;
  facts: Array<{ label: string; value: string }>;
  persisted: false;
};

export function runAdminJob(jobId: string, workspace: DemoWorkspace, now = new Date()): JobExecution | null {
  if (!adminJobs.some((job) => job.id === jobId)) return null;
  const timestamp = now.toISOString();
  const connectedSources = workspace.connections.filter((connection) => String(connection.status) === "Ansluten").length;

  if (jobId === "platform-readiness") {
    return {
      jobId,
      status: workspace.storage.status === "blocked_by_decision" || connectedSources === 0 ? "attention_needed" : "completed",
      mode: "synthetic_read_only",
      startedAt: timestamp,
      finishedAt: timestamp,
      summary: `${connectedSources} av ${workspace.connections.length} källor är anslutna. ${workspace.storage.label}.`,
      facts: [
        { label: "Källor anslutna", value: `${connectedSources}/${workspace.connections.length}` },
        { label: "Pilotkunder", value: String(workspace.customers.length) },
        { label: "Datatyp", value: "Syntetisk demo" },
      ],
      persisted: false,
    };
  }

  if (jobId === "customer-scope-audit") {
    return {
      jobId,
      status: "completed",
      mode: "synthetic_read_only",
      startedAt: timestamp,
      finishedAt: timestamp,
      summary: `${workspace.customers.length} demokunder och ${workspace.users.length} demokonton sammanställdes. Faktisk åtkomst och tenantisolering har inte testats av detta jobb.`,
      facts: [
        { label: "Kundorganisationer", value: String(workspace.customers.length) },
        { label: "Demokonton", value: String(workspace.users.length) },
        { label: "Åtkomstkontroll", value: "Inte utförd av detta jobb" },
      ],
      persisted: false,
    };
  }

  return {
    jobId: "renewal-preflight",
    status: "attention_needed",
    mode: "synthetic_read_only",
    startedAt: timestamp,
    finishedAt: timestamp,
    summary: "Verifierade avtalsperioder och live-data saknas. Inget förnyelseunderlag skapades.",
    facts: [
      { label: "Verifierade avtal", value: "0" },
      { label: "Bindande åtgärd", value: "Ingen" },
      { label: "Nästa steg", value: "Besluta datakälla och rättigheter" },
    ],
    persisted: false,
  };
}
