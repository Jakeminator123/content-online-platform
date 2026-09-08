import { Buffer } from "node:buffer";

// Only browser-facing D-ID configuration belongs here, never a provider API key.
const AGENT_ID = /^[A-Za-z0-9_-]{1,128}$/;
const RAW_CLIENT_KEY = /^ck_[A-Za-z0-9_-]{8,512}$/;
const ENCODED_CLIENT_KEY = /^[A-Za-z0-9+/_-]+={0,2}$/;

export function normalizeDidClientKey(clientKey: string): string | null {
  const value = clientKey.trim();
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
  } catch {
    return null;
  }
}

export function didEmbedConfiguration(agentId: string, clientKey: string): { agentId: string; clientKey: string } | null {
  const id = agentId.trim();
  const key = normalizeDidClientKey(clientKey);
  return AGENT_ID.test(id) && key ? { agentId: id, clientKey: key } : null;
}

// Construct the fallback destination ourselves: no caller-controlled redirect or conversation data.
export function buildDidAgentShareUrl(agentId: string, clientKey: string): string | null {
  const config = didEmbedConfiguration(agentId, clientKey);
  if (!config) return null;
  const url = new URL("https://studio.d-id.com/agents/share");
  url.searchParams.set("id", config.agentId);
  url.searchParams.set("key", Buffer.from(config.clientKey, "utf8").toString("base64"));
  return url.href;
}
