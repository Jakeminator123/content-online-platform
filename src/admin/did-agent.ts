// Only browser-facing D-ID configuration belongs here, never a provider API key.
// Construct the destination ourselves: no caller-controlled redirect or conversation data.
export function buildDidAgentShareUrl(agentId: string, clientKey: string): string | null {
  const id = agentId.trim();
  const key = clientKey.trim();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id) || !key || key.length > 2048 || /[\u0000-\u0020\u007f]/.test(key)) return null;
  const url = new URL("https://studio.d-id.com/agents/share");
  url.searchParams.set("id", id);
  url.searchParams.set("key", key);
  return url.href;
}
