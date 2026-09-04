import type { FixedPrice, UsageObservation } from "./models.js";

export type RawIeeeMpsUsageRow = {
  sourceRecordKey: string;
  productCode: string;
  periodStart: string;
  periodEndExclusive: string;
  metricCode: string;
  metricLabel: string;
  value: number;
  aggregationLevel: "period_total" | "slice";
};

export type IeeeMpsNormalizationContext = {
  organizationId: string;
  publisherId: string;
  providerId: string;
  productIdBySourceCode: Readonly<Record<string, string>>;
  entitlementIdByProductId: Readonly<Record<string, string>>;
  syncRunId: string;
  fetchedAt: string;
};

export type NormalizationResult = {
  accepted: UsageObservation[];
  rejected: Array<{ sourceRecordKey: string; reason: string }>;
};

export function normalizeIeeeMpsRows(
  rows: readonly RawIeeeMpsUsageRow[],
  context: IeeeMpsNormalizationContext,
): NormalizationResult {
  const accepted: UsageObservation[] = [];
  const rejected: NormalizationResult["rejected"] = [];

  for (const row of rows) {
    const productId = context.productIdBySourceCode[row.productCode];
    const entitlementId = productId ? context.entitlementIdByProductId[productId] : undefined;

    if (!productId) {
      rejected.push({
        sourceRecordKey: row.sourceRecordKey,
        reason: "unknown_product_mapping",
      });
      continue;
    }

    if (!Number.isSafeInteger(row.value) || row.value < 0) {
      rejected.push({
        sourceRecordKey: row.sourceRecordKey,
        reason: "invalid_usage_value",
      });
      continue;
    }

    const isApprovedDownload = row.metricCode === "DEMO_APPROVED_DOWNLOADS";

    accepted.push({
      id: `ieee-mps:${context.organizationId}:${row.sourceRecordKey}`,
      schemaVersion: "usage-observation/v1",
      organizationId: context.organizationId,
      publisherId: context.publisherId,
      providerId: context.providerId,
      productId,
      ...(entitlementId ? { entitlementId } : {}),
      period: {
        start: row.periodStart,
        endExclusive: row.periodEndExclusive,
        granularity: "year",
      },
      metric: {
        sourceCode: row.metricCode,
        sourceLabel: row.metricLabel,
        definitionVersion: "synthetic-demo/v1",
        unit: "count",
        semanticStatus: isApprovedDownload ? "exact" : "source-native",
        ...(isApprovedDownload
          ? {
              canonicalCode: "approved_downloads",
              comparabilityKey: "approved_downloads/v1",
            }
          : {}),
      },
      value: row.value,
      aggregationLevel: row.aggregationLevel,
      dimensions: {},
      provenance: {
        mode: "demo",
        reportType: "synthetic-ieee-mps-like",
        sourceRecordKey: row.sourceRecordKey,
        syncRunId: context.syncRunId,
        fetchedAt: context.fetchedAt,
        adapterId: "ieee-mps",
        adapterVersion: "0.1.0",
        mappingVersion: "demo-mapping/v1",
      },
      quality: {
        coverage: "complete",
        freshness: "fresh",
        warnings: ["Syntetisk demo; inte en livekoppling till IEEE eller MPS."],
      },
    });
  }

  return { accepted, rejected };
}

export type CostPerUsage =
  | {
      status: "calculated";
      basis: "fixed_agreed_price";
      inputStatus: "approved_live" | "demo_or_unapproved";
      numerator: FixedPrice;
      denominator: {
        metricCode: string;
        value: number;
        period: CalculationPeriod;
        coverage: "complete";
        semanticStatus: "exact";
        comparabilityKey: "approved_downloads/v1";
      };
      result: { amount: string; currency: string; unit: "per_usage" };
    }
  | {
      status: "not_calculable";
      reason:
        | "missing_fixed_price"
        | "missing_approved_usage"
        | "unapproved_metric"
        | "zero_usage"
        | "period_mismatch"
        | "incomplete_usage"
        | "dimensioned_usage"
        | "missing_approved_aggregate"
        | "ambiguous_aggregate";
    };

type CalculationPeriod = {
  start: string;
  endExclusive: string;
};

export function calculateCostPerUsage(input: {
  fixedPrice?: FixedPrice;
  usage?: {
    metricCode: string;
    value: number;
    period: CalculationPeriod;
    coverage: "complete" | "partial" | "unknown";
    isAggregate: boolean;
    mode: "live" | "demo";
    semanticStatus: "exact" | "source-native";
    comparabilityKey?: string;
  };
}): CostPerUsage {
  if (!input.fixedPrice) {
    return { status: "not_calculable", reason: "missing_fixed_price" };
  }

  if (!input.usage) {
    return { status: "not_calculable", reason: "missing_approved_usage" };
  }

  if (
    input.usage.metricCode !== "approved_downloads" ||
    input.usage.semanticStatus !== "exact" ||
    input.usage.comparabilityKey !== "approved_downloads/v1"
  ) {
    return { status: "not_calculable", reason: "unapproved_metric" };
  }

  if (
    input.fixedPrice.period.start !== input.usage.period.start ||
    input.fixedPrice.period.endExclusive !== input.usage.period.endExclusive
  ) {
    return { status: "not_calculable", reason: "period_mismatch" };
  }

  if (input.usage.coverage !== "complete") {
    return { status: "not_calculable", reason: "incomplete_usage" };
  }

  if (!input.usage.isAggregate) {
    return { status: "not_calculable", reason: "dimensioned_usage" };
  }

  if (input.usage.value === 0) {
    return { status: "not_calculable", reason: "zero_usage" };
  }

  const amount = (input.fixedPrice.amountMinor / 100 / input.usage.value).toFixed(2);

  return {
    status: "calculated",
    basis: "fixed_agreed_price",
    inputStatus:
      input.fixedPrice.approvalStatus === "approved" &&
      input.fixedPrice.provenance.mode === "live" &&
      input.usage.mode === "live"
        ? "approved_live"
        : "demo_or_unapproved",
    numerator: input.fixedPrice,
    denominator: {
      metricCode: input.usage.metricCode,
      value: input.usage.value,
      period: input.usage.period,
      coverage: "complete",
      semanticStatus: "exact",
      comparabilityKey: "approved_downloads/v1",
    },
    result: {
      amount,
      currency: input.fixedPrice.currency,
      unit: "per_usage",
    },
  };
}
