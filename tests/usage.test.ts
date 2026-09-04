import { describe, expect, it } from "vitest";
import { InMemoryPortalRepository } from "../src/adapters/in-memory-repository.js";
import type { FixedPrice } from "../src/domain/models.js";
import {
  calculateCostPerUsage,
  normalizeIeeeMpsRows,
  type IeeeMpsNormalizationContext,
  type RawIeeeMpsUsageRow,
} from "../src/domain/usage.js";

const context: IeeeMpsNormalizationContext = {
  organizationId: "org-a",
  publisherId: "ieee",
  providerId: "mps",
  productIdBySourceCode: { IEEE_XPLORE: "ieee-xplore" },
  entitlementIdByProductId: { "ieee-xplore": "entitlement-a" },
  syncRunId: "sync-a",
  fetchedAt: "2026-09-04T10:00:00.000Z",
};

const validRow: RawIeeeMpsUsageRow = {
  sourceRecordKey: "source-row-1",
  productCode: "IEEE_XPLORE",
  periodStart: "2026-01-01",
  periodEndExclusive: "2027-01-01",
  metricCode: "DEMO_APPROVED_DOWNLOADS",
  metricLabel: "Godkända downloads (syntetisk fixture)",
  value: 10_000,
  aggregationLevel: "period_total",
};

describe("IEEE/MPS-like normalization", () => {
  it("normalizes deterministically with provenance and no tenant value from the source row", () => {
    const first = normalizeIeeeMpsRows([validRow], context);
    const second = normalizeIeeeMpsRows([validRow], context);

    expect(first).toEqual(second);
    expect(first.rejected).toEqual([]);
    expect(first.accepted[0]).toMatchObject({
      id: "ieee-mps:org-a:source-row-1",
      organizationId: "org-a",
      publisherId: "ieee",
      providerId: "mps",
      metric: {
        canonicalCode: "approved_downloads",
        semanticStatus: "exact",
      },
      provenance: {
        mode: "demo",
        sourceRecordKey: "source-row-1",
        adapterId: "ieee-mps",
      },
    });
  });

  it("quarantines unknown product mappings and invalid values", () => {
    const result = normalizeIeeeMpsRows(
      [
        { ...validRow, sourceRecordKey: "unknown", productCode: "NOT_MAPPED" },
        { ...validRow, sourceRecordKey: "negative", value: -1 },
      ],
      context,
    );

    expect(result.accepted).toEqual([]);
    expect(result.rejected).toEqual([
      { sourceRecordKey: "unknown", reason: "unknown_product_mapping" },
      { sourceRecordKey: "negative", reason: "invalid_usage_value" },
    ]);
  });

  it("upserts the same source record idempotently", async () => {
    const repository = new InMemoryPortalRepository();
    const result = normalizeIeeeMpsRows([validRow], context);

    await repository.upsertUsage(result.accepted);
    await repository.upsertUsage(result.accepted);

    await expect(repository.listUsage("org-a")).resolves.toHaveLength(1);
  });
});

const demoFixedPrice = {
  amountMinor: 10_000_000,
  currency: "SEK",
  basis: "fixed_agreed_price" as const,
  period: { start: "2026-01-01", endExclusive: "2027-01-01" },
  approvalStatus: "demo_assumption" as const,
  provenance: {
    mode: "demo" as const,
    sourceSystem: "synthetic-fixture",
    sourceReference: "demo-price",
  },
};

const completeApprovedUsage = {
  metricCode: "approved_downloads",
  value: 10_000,
  period: { start: "2026-01-01", endExclusive: "2027-01-01" },
  coverage: "complete" as const,
  isAggregate: true,
  mode: "demo" as const,
  semanticStatus: "exact" as const,
  comparabilityKey: "approved_downloads/v1",
};

describe("fixed-price cost per download", () => {
  it("calculates 100 000 SEK / 10 000 approved downloads as 10.00 SEK", () => {
    expect(
      calculateCostPerUsage({
        fixedPrice: demoFixedPrice,
        usage: completeApprovedUsage,
      }),
    ).toEqual({
      status: "calculated",
      basis: "fixed_agreed_price",
      inputStatus: "demo_or_unapproved",
      numerator: demoFixedPrice,
      denominator: {
        metricCode: "approved_downloads",
        value: 10_000,
        period: { start: "2026-01-01", endExclusive: "2027-01-01" },
        coverage: "complete",
        semanticStatus: "exact",
        comparabilityKey: "approved_downloads/v1",
      },
      result: { amount: "10.00", currency: "SEK", unit: "per_usage" },
    });
  });

  it("does not invent a zero-price KPI when usage is zero", () => {
    expect(
      calculateCostPerUsage({
        fixedPrice: demoFixedPrice,
        usage: { ...completeApprovedUsage, value: 0 },
      }),
    ).toEqual({ status: "not_calculable", reason: "zero_usage" });
  });

  it("blocks CPD when the metric is not an approved download measure", () => {
    expect(
      calculateCostPerUsage({
        fixedPrice: demoFixedPrice,
        usage: { ...completeApprovedUsage, metricCode: "searches" },
      }),
    ).toEqual({ status: "not_calculable", reason: "unapproved_metric" });

    expect(
      calculateCostPerUsage({
        fixedPrice: demoFixedPrice,
        usage: { ...completeApprovedUsage, semanticStatus: "source-native" },
      }),
    ).toEqual({ status: "not_calculable", reason: "unapproved_metric" });
  });

  it("blocks CPD when price and usage periods do not match", () => {
    expect(
      calculateCostPerUsage({
        fixedPrice: demoFixedPrice,
        usage: {
          ...completeApprovedUsage,
          value: 900,
          period: { start: "2026-01-01", endExclusive: "2026-02-01" },
        },
      }),
    ).toEqual({ status: "not_calculable", reason: "period_mismatch" });
  });

  it("blocks CPD for partial or dimensioned usage", () => {
    expect(
      calculateCostPerUsage({
        fixedPrice: demoFixedPrice,
        usage: { ...completeApprovedUsage, coverage: "partial" },
      }),
    ).toEqual({ status: "not_calculable", reason: "incomplete_usage" });
    expect(
      calculateCostPerUsage({
        fixedPrice: demoFixedPrice,
        usage: { ...completeApprovedUsage, isAggregate: false },
      }),
    ).toEqual({ status: "not_calculable", reason: "dimensioned_usage" });
  });

  it("never classifies a demo-provenance price as approved live", () => {
    const inconsistentPrice = {
      ...demoFixedPrice,
      approvalStatus: "approved",
      provenance: { ...demoFixedPrice.provenance, mode: "demo" },
    } as unknown as FixedPrice;

    expect(
      calculateCostPerUsage({
        fixedPrice: inconsistentPrice,
        usage: { ...completeApprovedUsage, mode: "live" },
      }),
    ).toMatchObject({ status: "calculated", inputStatus: "demo_or_unapproved" });
  });
});
