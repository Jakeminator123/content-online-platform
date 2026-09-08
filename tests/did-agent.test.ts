import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { buildDidAgentShareUrl, didEmbedConfiguration, normalizeDidClientKey } from "../src/admin/did-agent.js";

describe("D-ID browser configuration", () => {
  const rawKey = "ck_synthetic_domain_scoped_key";

  it("accepts both the raw embed key and the encoded key used by Studio share links", () => {
    const encoded = Buffer.from(rawKey, "utf8").toString("base64");
    expect(normalizeDidClientKey(rawKey)).toBe(rawKey);
    expect(normalizeDidClientKey(encoded)).toBe(rawKey);
    expect(normalizeDidClientKey(encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""))).toBe(rawKey);
    expect(didEmbedConfiguration("v2_agt_fixture", encoded)).toEqual({ agentId: "v2_agt_fixture", clientKey: rawKey });
  });

  it("builds only a canonical Studio fallback URL and never accepts arbitrary credentials", () => {
    const url = new URL(buildDidAgentShareUrl("v2_agt_fixture", rawKey)!);
    expect(url.origin + url.pathname).toBe("https://studio.d-id.com/agents/share");
    expect(url.searchParams.get("id")).toBe("v2_agt_fixture");
    expect(Buffer.from(url.searchParams.get("key")!, "base64").toString("utf8")).toBe(rawKey);

    for (const invalid of ["", "not-a-client-key", "Y2tfaW52YWxpZCBzcGFjZQ==", "%%%", "a".repeat(2049)]) {
      expect(normalizeDidClientKey(invalid)).toBeNull();
    }
    expect(buildDidAgentShareUrl("https://evil.example", rawKey)).toBeNull();
  });
});
