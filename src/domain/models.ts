export type CustomerRole = "customer_reader" | "customer_admin";
export type EffectiveRole = CustomerRole | "content_operator";

export type PortalUser = {
  id: string;
  externalSubject: string;
  email: string;
  displayName: string;
  accountType: "customer" | "content_operator";
  status: "active" | "inactive";
};

export type Organization = {
  id: string;
  displayName: string;
};

export type Membership = {
  id: string;
  userId: string;
  organizationId: string;
  role: CustomerRole;
  status: "active" | "inactive";
};

export type OperatorOrganizationScope = {
  userId: string;
  organizationId: string;
};

type FixedPriceBase = {
  amountMinor: number;
  currency: string;
  basis: "fixed_agreed_price";
  period: {
    start: string;
    endExclusive: string;
  };
};

export type FixedPrice = FixedPriceBase &
  (
    | {
        approvalStatus: "approved";
        provenance: {
          mode: "live";
          sourceSystem: string;
          sourceReference: string;
        };
      }
    | {
        approvalStatus: "demo_assumption";
        provenance: {
          mode: "demo";
          sourceSystem: string;
          sourceReference: string;
        };
      }
  );

export type Entitlement = {
  id: string;
  organizationId: string;
  publisherId: string;
  publisherName: string;
  productId: string;
  productName: string;
  accessStatus: "active" | "attention_required" | "expired";
  periodStart: string;
  periodEndExclusive: string;
  fixedPrice?: FixedPrice;
};

export type UsageObservation = {
  id: string;
  schemaVersion: "usage-observation/v1";
  organizationId: string;
  publisherId: string;
  providerId: string;
  productId: string;
  entitlementId?: string;
  period: {
    start: string;
    endExclusive: string;
    granularity: "day" | "month" | "year" | "report-period";
  };
  metric: {
    sourceCode: string;
    sourceLabel: string;
    canonicalCode?: string;
    definitionVersion: string;
    unit: "count";
    semanticStatus: "exact" | "source-native";
    comparabilityKey?: string;
  };
  value: number;
  aggregationLevel: "period_total" | "slice";
  dimensions: Record<string, string>;
  provenance: {
    mode: "live" | "demo";
    reportType: string;
    reportVersion?: string;
    sourceRecordKey: string;
    sourceArtifactHash?: string;
    syncRunId: string;
    fetchedAt: string;
    sourceUpdatedAt?: string;
    adapterId: string;
    adapterVersion: string;
    mappingVersion: string;
  };
  quality: {
    coverage: "complete" | "partial" | "unknown";
    freshness: "fresh" | "delayed" | "stale" | "unknown";
    warnings: string[];
  };
};

export type Ticket = {
  id: string;
  organizationId: string;
  createdByUserId: string;
  category: "access" | "usage_data" | "membership_change" | "other";
  title: string;
  description: string;
  status: "open" | "in_progress" | "closed";
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  occurredAt: string;
  requestId: string;
  actorUserId?: string;
  effectiveRole?: EffectiveRole;
  organizationId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  result: "success" | "denied" | "failed";
};
