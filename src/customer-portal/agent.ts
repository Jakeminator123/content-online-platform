import { Buffer } from "node:buffer";
import type { RegistryCustomer } from "../admin/registry.js";

const AGENT_ID = /^[A-Za-z0-9_-]{1,128}$/;
const RAW_CLIENT_KEY = /^ck_[A-Za-z0-9_-]{8,512}$/;
const ENCODED_CLIENT_KEY = /^[A-Za-z0-9+/_-]+={0,2}$/;

export type DidAgentConfiguration = { agentId: string; clientKey: string };

export function normalizeDidClientKey(input: string): string | null {
  const value = input.trim();
  if (RAW_CLIENT_KEY.test(value)) return value;
  if (!value || value.length > 2048 || !ENCODED_CLIENT_KEY.test(value)) return null;
  const standard = value.replace(/-/g, "+").replace(/_/g, "/");
  if (standard.length % 4 === 1) return null;
  const unpadded = standard.replace(/=+$/, "");
  try {
    const bytes = Buffer.from(standard.padEnd(Math.ceil(standard.length / 4) * 4, "="), "base64");
    if (bytes.toString("base64").replace(/=+$/, "") !== unpadded) return null;
    const decoded = bytes.toString("utf8");
    return RAW_CLIENT_KEY.test(decoded) ? decoded : null;
  } catch { return null; }
}

export function didEmbedConfiguration(agentId: string, clientKey: string): DidAgentConfiguration | null {
  const id = agentId.trim();
  const key = normalizeDidClientKey(clientKey);
  return AGENT_ID.test(id) && key ? { agentId: id, clientKey: key } : null;
}

export function resolveCustomerAgent(
  customer: RegistryCustomer,
  fallback: Partial<DidAgentConfiguration> = {},
): DidAgentConfiguration | null {
  if (!customer.site.agent.enabled) return null;
  return didEmbedConfiguration(
    customer.site.agent.agentId || fallback.agentId || "",
    customer.site.agent.clientKey || fallback.clientKey || "",
  );
}

export function customerAgentPolicy(customer: RegistryCustomer) {
  const positivity = customer.site.agent.positivity;
  const tone = positivity <= 3
    ? "saklig, återhållsam och direkt"
    : positivity <= 7
      ? "varm, lösningsorienterad och balanserad"
      : "tydligt positiv och energisk, utan att tona ned problem eller osäkerhet";
  return {
    customer: customer.name,
    tone,
    positivity,
    greeting: customer.site.agent.greeting,
    tools: customer.site.agent.tools,
    truthfulness: [
      "Ange alltid om statistik är syntetisk, ofullständig eller saknas.",
      "Dölj aldrig nedgångar, kostnader, osäkerhet eller negativa utfall.",
      "Påstå aldrig ekonomisk nytta som inte kan härledas från verifierade underlag.",
      "Be om inloggning när frågan kräver kundskyddad statistik.",
    ],
  };
}
