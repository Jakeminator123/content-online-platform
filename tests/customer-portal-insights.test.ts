import { Script } from "node:vm";
import { describe, expect, it } from "vitest";
import { initialRegistry, registrySchema } from "../src/admin/registry.js";
import { customerPortalClient } from "../src/customer-portal/client.js";
import {
  buildPortalInsights,
  type PortalInsightProduct,
} from "../src/customer-portal/insights.js";
import { customerPortalInsightsClient } from "../src/customer-portal/insights-client.js";
import { customerPortalContext, renderCustomerPortal } from "../src/customer-portal/template.js";

const products: PortalInsightProduct[] = [
  { id: "journal-a", name: "Journal A", type: "Tidskrift", publisher: "Publisher One", usage: 120 },
  { id: "journal-b", name: "Journal B", type: "Tidskrift", publisher: "Publisher One", usage: 80 },
  { id: "book-a", name: "Book A", type: "E-bok", publisher: "Publisher Two", usage: 50 },
];

describe("customer portal insights", () => {
  it("builds deterministic product and publisher summaries without relabelling usage as telemetry", () => {
    const insights = buildPortalInsights(products);
    expect(insights.productUsageTotal).toBe(250);
    expect(insights.productCount).toBe(3);
    expect(insights.publisherCount).toBe(2);
    expect(insights.publisherUsage).toEqual([
      { id: "publisher-one", label: "Publisher One", detail: "Publicist", value: 200 },
      { id: "publisher-two", label: "Publisher Two", detail: "Publicist", value: 50 },
    ]);
    expect(insights.contentMix).toEqual([
      expect.objectContaining({ label: "Tidskrift", value: 200, share: 80 }),
      expect.objectContaining({ label: "E-bok", value: 50, share: 20 }),
    ]);
    expect(insights.provenance.telemetry).toContain("inte härledd från publisher-usage");
    expect(insights.provenance.productUsage).toContain("inte verifierad COUNTER-statistik");
    insights.periods["12m"].series.activeUsers.forEach((value, index) => {
      expect(insights.periods["12m"].series.sessions[index]).toBeGreaterThanOrEqual(value);
    });
    const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
    expect(sum(insights.periods["30d"].series.downloads)).toBe(insights.periods["12m"].series.downloads.at(-1));
    expect(sum(insights.periods["90d"].series.downloads)).toBe(sum(insights.periods["12m"].series.downloads.slice(-3)));
    expect(insights.periods["90d"].kpis.downloads.delta).toBe(14.7);
    expect(insights.periods["90d"].kpis.sessions.delta).toBe(19.7);
    expect(insights.periods["30d"].kpis.sessionMinutes.value).toBe(7.8);
    expect(insights.periods["30d"].kpis.sessionMinutes.value).not.toBe(insights.periods["30d"].series.sessionMinutes.at(-1));
  });

  it("renders five overview fields, controllable charts, configuration, and honest ticket previews for the demo", () => {
    const registry = initialRegistry();
    const customer = registry.customers.find((item) => item.slug === "kth")!;
    const html = renderCustomerPortal(customer, registry, {
      basePath: "/portal/kth",
      contextUrl: "/portal/kth/api/agent-context",
      page: "portal",
      didAgent: { agentId: "v2_agt_test", clientKey: "ck_customer_domain_test" },
    });

    for (const label of ["Produktanvändning", "Förändring", "Produkter", "Publicister", "Nästa förnyelse"]) {
      expect(html).toContain(label);
    }
    for (const control of ["data-insights-period", "data-insights-metric", "data-insights-group"]) {
      expect(html).toContain(control);
    }
    expect(html).toContain('data-portal-section="configuration"');
    expect(html).toContain("Syntetisk telemetri");
    expect(html).toContain("inte härledd från publisher-usage");
    expect(html).toContain('class="wave-chart"');
    expect(html).toContain('class="donut-chart"');
    expect(html).toContain("Visa datapunkter");
    expect(html).toContain('data-report-cadence');
    expect(html).toContain("Förhandsvisa ärende");
    expect(html).toContain("Inget skickas eller sparas");
    expect(html).toContain('data-show-agent-name="false"');
    expect(html).toContain('data-show-restart-button="false"');
  });

  it("keeps telemetry and the ticket form out of a public non-demo customer portal", () => {
    const registry = registrySchema.parse({
      customers: [{ id: "customer-north", name: "North", slug: "north", status: "published", kind: "customer", publisherIds: [] }],
      publishers: [],
      events: [],
    });
    const html = renderCustomerPortal(registry.customers[0]!, registry, {
      basePath: "/portal/north",
      contextUrl: "/portal/north/api/agent-context",
      page: "portal",
      didAgent: null,
    });

    expect(html).toContain('"insights":null');
    expect(html).toContain("Verifierad inloggning krävs");
    expect(html).toContain("Konfigurationen är inte aktiverad ännu");
    expect(html).toContain('<p data-locked-only>Inställningar och ärenden kräver verifierat medlemskap.</p>');
    expect(html).toContain('<p data-authenticated-only hidden>Medlemskapet är verifierat.');
    expect(html).not.toContain("data-demo-ticket-form");
    expect(html).not.toContain("196300");
    expect(html).not.toContain("agent.d-id.com/v2/index.js");
  });

  it("keeps D-ID responsive and ticket previews local to the browser", () => {
    expect(() => new Script(customerPortalClient)).not.toThrow();
    expect(() => new Script(customerPortalInsightsClient)).not.toThrow();
    expect(customerPortalClient).toContain("orientation: compactAgentLayout.matches ? 'vertical' : 'horizontal'");
    expect(customerPortalClient).toContain("openMode: 'compact'");
    expect(customerPortalClient).toContain("if (state === 'connected') registerTools()");
    expect(customerPortalInsightsClient).toContain("event.preventDefault()");
    expect(customerPortalInsightsClient).toContain("Inget har skickats eller sparats");
    expect(customerPortalInsightsClient).toContain("hide-insights-comparison");
    expect(customerPortalInsightsClient).toContain("data-report-cadence");
    expect(customerPortalInsightsClient).toContain("options.announce");
    expect(customerPortalInsightsClient).not.toContain("fetch(");
    expect(customerPortalInsightsClient).not.toContain("localStorage");
  });

  it("exposes configuration to navigation while retaining the same four allowlisted agent tools", () => {
    const registry = initialRegistry();
    const customer = registry.customers.find((item) => item.slug === "kth")!;
    const context = customerPortalContext(customer, registry);
    expect(context.portal.sections).toContain("configuration");
    expect(context.assistant.tools).toEqual([
      "portal_context",
      "portal_navigation",
      "portfolio_summary",
      "usage_summary",
    ]);
    expect(JSON.stringify(context)).not.toContain("clientKey");
  });
});
