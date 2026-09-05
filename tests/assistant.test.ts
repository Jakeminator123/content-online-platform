import { describe, expect, it } from "vitest";
import { answerAdminQuestion, selectSources } from "../src/admin/assistant.js";
import { demoWorkspace } from "../src/admin/demo-data.js";

describe("documentation-grounded admin assistant", () => {
  it("answers locally and distinguishes current from planned capability without an API key", async () => {
    const result = await answerAdminQuestion("Vad kan plattformen göra nu?", demoWorkspace, { adminId: "admin" });
    expect(result.mode).toBe("local_fallback");
    expect(result.answer).toContain("KAN NU");
    expect(result.answer).toContain("SKA KUNNA");
    expect(result.answer).toContain("INTE KLART");
    expect(result.sources).toContain("ADMIN_DRIFT.md");
  });

  it("uses the Responses API without storage and excludes workspace user names from model context", async () => {
    let requestBody: Record<string, unknown> | undefined;
    const fetchImpl: typeof fetch = async (_input, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({ output: [{ type: "message", content: [{ type: "output_text", text: "Ett grundat svar.\n\nKällor: BEHORIGHETSMODELL.md" }] }] }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };

    const result = await answerAdminQuestion("Vilken data får användarna se?", demoWorkspace, {
      adminId: "admin-user-id",
      apiKey: "test-api-key-with-enough-length",
      model: "gpt-5.6-luna",
      fetchImpl,
    });

    expect(result).toMatchObject({ mode: "openai", model: "gpt-5.6-luna" });
    expect(requestBody?.store).toBe(false);
    expect(String(requestBody?.input)).not.toContain("Hampus");
    expect(String(requestBody?.input)).not.toContain("Bibbi");
    expect(String(requestBody?.input)).not.toContain('\"name\":\"KTH\"');
    expect(requestBody?.safety_identifier).toMatch(/^[a-f0-9]{40}$/);
  });

  it("fails safely to a grounded local answer when the provider is unavailable", async () => {
    const fetchImpl: typeof fetch = async () => new Response("provider detail", { status: 500 });
    const result = await answerAdminQuestion("Kan du köra cronjobb?", demoWorkspace, {
      adminId: "admin",
      apiKey: "test-api-key-with-enough-length",
      fetchImpl,
    });
    expect(result.mode).toBe("local_fallback");
    expect(result.answer).toContain("fördefinierade");
    expect(result.answer).not.toContain("provider detail");
  });

  it("selects a small relevant source set", () => {
    expect(selectSources("Hur fungerar IEEE MPS usage och kostnad?")).toEqual([
      "USAGE_KONVERTERING.md",
    ]);
    expect(selectSources("Berätta om cron och jobb")).toContain("AI_ASSISTENT.md");
  });
});
