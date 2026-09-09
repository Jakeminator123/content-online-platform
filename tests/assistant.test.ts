import { describe, expect, it } from "vitest";
import { answerAdminQuestion, buildAdminAssistantSnapshot, selectSources } from "../src/admin/assistant.js";
import { applyRegistryCommand, initialRegistry } from "../src/admin/registry.js";

function snapshot() {
  let registry = applyRegistryCommand(initialRegistry(), {
    action: "add_customer",
    name: "Exempelorganisation",
    slug: "exempelorganisation",
  }, "admin");
  const customer = registry.customers.at(-1)!;
  registry = applyRegistryCommand(registry, {
    action: "add_portal_member",
    customerId: customer.id,
    verifiedEmail: "member@example.test",
    displayName: "Testperson",
    role: "customer_admin",
  }, "admin");
  return buildAdminAssistantSnapshot(registry);
}

describe("documentation-grounded admin assistant", () => {
  it("answers from aggregate registry facts without an API key", async () => {
    const result = await answerAdminQuestion("Vad kan plattformen göra nu?", snapshot(), { adminId: "admin" });
    expect(result.mode).toBe("local_fallback");
    expect(result.answer).toContain("KAN NU");
    expect(result.answer).toContain("SKA KUNNA");
    expect(result.answer).toContain("INTE KLART");
    expect(result.answer).toContain("2 beständiga kundposter");
    expect(result.answer).not.toContain("Exempelorganisation");
    expect(result.sources).toContain("ADMIN_DRIFT.md");
  });

  it("uses the Responses API without storage or customer identity data", async () => {
    let requestBody: Record<string, unknown> | undefined;
    const fetchImpl: typeof fetch = async (_input, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({ output: [{ type: "message", content: [{ type: "output_text", text: "Ett grundat svar.\n\nKällor: BEHORIGHETSMODELL.md" }] }] }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };

    const result = await answerAdminQuestion("Vilken data får användarna se?", snapshot(), {
      adminId: "admin-user-id",
      apiKey: "test-api-key-with-enough-length",
      model: "gpt-5.6-luna",
      fetchImpl,
    });

    expect(result).toMatchObject({ mode: "openai", model: "gpt-5.6-luna" });
    expect(requestBody?.store).toBe(false);
    expect(String(requestBody?.input)).toContain("SKYDDAD REGISTERÖVERSIKT");
    expect(String(requestBody?.input)).not.toContain("Testperson");
    expect(String(requestBody?.input)).not.toContain("member@example.test");
    expect(String(requestBody?.input)).not.toContain("Exempelorganisation");
    expect(requestBody?.safety_identifier).toMatch(/^[a-f0-9]{40}$/);
  });

  it("fails safely and never pretends that cron jobs are connected", async () => {
    const fetchImpl: typeof fetch = async () => new Response("provider detail", { status: 500 });
    const result = await answerAdminQuestion("Kan du köra cronjobb?", snapshot(), {
      adminId: "admin",
      apiKey: "test-api-key-with-enough-length",
      fetchImpl,
    });
    expect(result.mode).toBe("local_fallback");
    expect(result.answer).toContain("inga kundspecifika cronjobb");
    expect(result.answer).toContain("kan inte starta jobb");
    expect(result.answer).not.toContain("provider detail");
  });

  it("selects a small relevant source set", () => {
    expect(selectSources("Hur fungerar IEEE MPS usage och kostnad?")).toEqual(["USAGE_KONVERTERING.md"]);
    expect(selectSources("Berätta om cron och jobb")).toContain("AI_ASSISTENT.md");
  });
});
