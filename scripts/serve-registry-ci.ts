import { serve } from "@hono/node-server";
import { createAdminPortal } from "../src/admin/portal.js";
import { NeonRegistryStore } from "../src/admin/registry-store.js";
import { query } from "./registry-ci-store.js";

// Isolated CI-only app. Production imports never reference this file.
if (process.env.CI !== "true" || process.env.VERCEL) throw new Error("CI only");
const app = createAdminPortal({ authenticate: async request =>
  request.headers.get("authorization") === "Bearer ci-registry-browser"
    ? { status: "authenticated", identity: { id: "ci-browser", email: "ci@example.test", role: "content_admin" } }
    : { status: "unauthenticated" }
}, { publishableKey: "", secretKey: "", allowedEmail: "" }, {
  registryStore: new NeonRegistryStore(query),
  didAgentId: "v2_agt_ci_runtime",
  didClientKey: "ck_ci_runtime_domain_key",
  customerLogoUploader: async customerId => `https://ci.public.blob.vercel-storage.com/${customerId}-logo.png`,
});
serve({ fetch: app.fetch, hostname: "127.0.0.1", port: 3002 });
