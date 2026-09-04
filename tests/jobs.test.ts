import { describe, expect, it } from "vitest";
import { runAdminJob } from "../src/admin/jobs.js";
import { demoWorkspace } from "../src/admin/demo-data.js";

describe("allowlisted admin jobs", () => {
  const now = new Date("2026-09-05T06:10:00.000Z");

  it("reports readiness without pretending disconnected sources are live", () => {
    const result = runAdminJob("platform-readiness", demoWorkspace, now);
    expect(result).toMatchObject({ status: "attention_needed", mode: "synthetic_read_only", persisted: false });
    expect(result?.summary).toContain("0 av 4 källor");
  });

  it("runs the customer scope audit without global customer access", () => {
    const result = runAdminJob("customer-scope-audit", demoWorkspace, now);
    expect(result?.status).toBe("completed");
    expect(result?.facts).toContainEqual({ label: "Global kundåtkomst", value: "Avstängd" });
  });

  it("rejects arbitrary job names", () => {
    expect(runAdminJob("run-any-command", demoWorkspace, now)).toBeNull();
  });
});
