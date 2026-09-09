import { Script } from "node:vm";
import { describe, expect, it } from "vitest";
import { demoWorkspace } from "../src/admin/demo-data.js";
import { createAdminPortal } from "../src/admin/portal.js";
import { registryClient } from "../src/admin/registry-client.js";
import {
  completeSalesforceOAuth,
  createSalesforceOAuthRequest,
  decryptSalesforceRefreshToken,
  encryptSalesforceRefreshToken,
  listSalesforceAccounts,
  readSalesforceConfiguration,
  verifySalesforceOAuthState,
  type SalesforceConnection,
  type SalesforceConnectionStore,
} from "../src/admin/salesforce.js";
import { workspaceClient } from "../src/admin/workspace-client.js";

const salesforceConfig = readSalesforceConfiguration({
  SALESFORCE_LOGIN_URL: "https://login.salesforce.com",
  SALESFORCE_CLIENT_ID: "client-id-with-safe-shape-123",
  SALESFORCE_CLIENT_SECRET: "secret-with-enough-entropy-for-tests",
  SALESFORCE_REDIRECT_URI: "https://content-online-platform.vercel.app/admin/api/salesforce/oauth/callback",
  SALESFORCE_OAUTH_STATE_SECRET: "state-secret-at-least-thirty-two-bytes",
  SALESFORCE_TOKEN_ENCRYPTION_KEY: "11".repeat(32),
  SALESFORCE_API_VERSION: "v67.0",
});

if (!salesforceConfig) throw new Error("invalid test configuration");

function memoryStore(initial: SalesforceConnection | null = null): SalesforceConnectionStore & { value: SalesforceConnection | null } {
  return {
    value: initial,
    async read() { return this.value; },
    async write(connection) { this.value = connection; },
  };
}

describe("Salesforce presentation boundary", () => {
  it("links every synthetic Salesforce review to an existing customer", () => {
    const customerIds = new Set(demoWorkspace.customers.map((customer) => customer.id));
    const links = demoWorkspace.salesforce.customerLinks;

    expect(links).toHaveLength(demoWorkspace.customers.length);
    expect(links.every((link) => customerIds.has(link.customerId))).toBe(true);

    const accountRefs = links.flatMap((link) => (link.accountRef ? [link.accountRef] : []));
    expect(new Set(accountRefs).size).toBe(accountRefs.length);
  });

  it("contains no credential-shaped Salesforce fields", () => {
    const serialized = JSON.stringify(demoWorkspace.salesforce).toLowerCase();

    for (const forbidden of [
      "access_token",
      "refresh_token",
      "client_secret",
      "consumersecret",
      "password",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("ships a parseable Salesforce tab and customer review without secrets", () => {
    expect(() => new Script(workspaceClient)).not.toThrow();
    expect(() => new Script(registryClient)).not.toThrow();
    expect(registryClient).toContain("OAuth-status läses från servern");
    expect(registryClient).toContain("Salesforce Account ID");
    expect(registryClient).toContain("credentials:'same-origin'");
    expect(registryClient).toContain("/admin/api/salesforce/status");
    expect(workspaceClient + registryClient).not.toContain("client_secret");
    expect(workspaceClient + registryClient).not.toContain("access_token");
  });
});

describe("Salesforce server boundary", () => {
  it("fails closed for incomplete config and HTTP callbacks", () => {
    expect(readSalesforceConfiguration({})).toBeNull();
    expect(readSalesforceConfiguration({
      SALESFORCE_LOGIN_URL: "https://login.salesforce.com",
      SALESFORCE_CLIENT_ID: salesforceConfig.clientId,
      SALESFORCE_CLIENT_SECRET: salesforceConfig.clientSecret,
      SALESFORCE_REDIRECT_URI: "http://127.0.0.1:3000/admin/api/salesforce/oauth/callback",
      SALESFORCE_OAUTH_STATE_SECRET: salesforceConfig.stateSecret,
      SALESFORCE_TOKEN_ENCRYPTION_KEY: salesforceConfig.tokenEncryptionKey,
    })).toBeNull();
  });

  it("creates short-lived signed state and PKCE without putting a secret in the URL", () => {
    const now = new Date("2026-09-08T08:00:00.000Z");
    const request = createSalesforceOAuthRequest(salesforceConfig, "admin-1", now);
    const url = new URL(request.authorizationUrl);
    const verified = verifySalesforceOAuthState(url.searchParams.get("state") ?? "", salesforceConfig.stateSecret, now);

    expect(url.origin + url.pathname).toBe("https://login.salesforce.com/services/oauth2/authorize");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      response_type: "code",
      client_id: salesforceConfig.clientId,
      redirect_uri: salesforceConfig.redirectUri,
      code_challenge_method: "S256",
    });
    expect(url.search).not.toContain(salesforceConfig.clientSecret);
    expect(request.codeVerifier).toHaveLength(64);
    expect(verified).toMatchObject({ v: 1, adminId: "admin-1" });
    expect(verifySalesforceOAuthState((url.searchParams.get("state") ?? "") + "x", salesforceConfig.stateSecret, now)).toBeNull();
    expect(verifySalesforceOAuthState(url.searchParams.get("state") ?? "", salesforceConfig.stateSecret, new Date("2026-09-08T08:11:00.000Z"))).toBeNull();
  });

  it("encrypts refresh tokens with authenticated encryption", () => {
    const encrypted = encryptSalesforceRefreshToken("refresh-token-value-for-test", salesforceConfig.tokenEncryptionKey);
    expect(encrypted).not.toContain("refresh-token-value-for-test");
    expect(decryptSalesforceRefreshToken(encrypted, salesforceConfig.tokenEncryptionKey)).toBe("refresh-token-value-for-test");
    const parts = encrypted.split(".");
    parts[2] = (parts[2]!.startsWith("A") ? "B" : "A") + parts[2]!.slice(1);
    expect(() => decryptSalesforceRefreshToken(parts.join("."), salesforceConfig.tokenEncryptionKey)).toThrow("invalid_salesforce_secret");
  });

  it("exchanges an authorization code and persists only an encrypted refresh token", async () => {
    const store = memoryStore();
    let requestBody = "";
    const fetchImpl: typeof fetch = async (_input, init) => {
      requestBody = String(init?.body ?? "");
      return new Response(JSON.stringify({
        access_token: "access-token-value-for-test",
        refresh_token: "refresh-token-value-for-test",
        instance_url: "https://orgfarm-example.my.salesforce.com",
      }), { status: 200, headers: { "content-type": "application/json" } });
    };
    await completeSalesforceOAuth({
      config: salesforceConfig,
      store,
      code: "authorization-code",
      codeVerifier: "v".repeat(64),
      adminId: "admin-1",
      now: new Date("2026-09-08T08:00:00.000Z"),
      fetchImpl,
    });
    expect(requestBody).toContain("grant_type=authorization_code");
    expect(requestBody).toContain("code_verifier=");
    expect(store.value).toMatchObject({ instanceUrl: "https://orgfarm-example.my.salesforce.com", updatedBy: "admin-1" });
    expect(store.value?.encryptedRefreshToken).not.toContain("refresh-token-value-for-test");
  });

  it("refreshes server-side and returns an allowlisted Account projection", async () => {
    const store = memoryStore({
      encryptedRefreshToken: encryptSalesforceRefreshToken("refresh-token-value-for-test", salesforceConfig.tokenEncryptionKey),
      instanceUrl: "https://orgfarm-example.my.salesforce.com",
      updatedAt: "2026-09-08T08:00:00.000Z",
      updatedBy: "admin-1",
    });
    const requests: Array<{ url: string; authorization: string | null }> = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      requests.push({ url, authorization: new Headers(init?.headers).get("authorization") });
      if (url.endsWith("/services/oauth2/token")) {
        return new Response(JSON.stringify({
          access_token: "new-access-token-for-test",
          instance_url: "https://orgfarm-example.my.salesforce.com",
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({
        records: [{ Id: "001000000000001AAA", Name: "Max Tegmark AB", Owner: { Name: "Content Online" } }],
      }), { status: 200, headers: { "content-type": "application/json" } });
    };
    const accounts = await listSalesforceAccounts({
      config: salesforceConfig,
      store,
      query: "Max",
      adminId: "admin-1",
      fetchImpl,
    });
    expect(accounts).toEqual([{ id: "001000000000001AAA", name: "Max Tegmark AB", ownerName: "Content Online" }]);
    expect(new URL(requests[1]!.url).searchParams.get("q")).toBe("SELECT Id, Name, Owner.Name FROM Account WHERE Name LIKE '%Max%' ORDER BY Name LIMIT 20");
    expect(requests[1]!.authorization).toBe("Bearer new-access-token-for-test");
  });

  it("guards OAuth start and keeps the PKCE verifier in a secure HttpOnly cookie", async () => {
    const cfg = { allowedEmail: "admin@example.test", secretKey: "fixture", publishableKey: "" };
    const store = memoryStore();
    const denied = createAdminPortal({ authenticate: async () => ({ status: "unauthenticated" }) }, cfg, {
      salesforceConfig,
      salesforceStore: store,
    });
    expect((await denied.request("/admin/api/salesforce/oauth/start")).status).toBe(401);

    const app = createAdminPortal({ authenticate: async () => ({
      status: "authenticated",
      identity: { id: "admin-1", email: cfg.allowedEmail, role: "content_admin" },
    }) }, cfg, { salesforceConfig, salesforceStore: store, now: () => new Date("2026-09-08T08:00:00.000Z") });
    const response = await app.request("/admin/api/salesforce/oauth/start");
    const body = await response.json() as { authorizationUrl: string };
    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie") ?? "";
    for (const attribute of ["co_sf_pkce=", "Max-Age=600", "Path=/admin/api/salesforce/oauth/callback", "HttpOnly", "SameSite=Lax", "Secure"]) {
      expect(cookie).toContain(attribute);
    }
    expect(body.authorizationUrl).not.toContain(salesforceConfig.clientSecret);
  });

  it("accepts the provider callback only with matching signed state and PKCE", async () => {
    const now = new Date("2026-09-08T08:00:00.000Z");
    const oauth = createSalesforceOAuthRequest(salesforceConfig, "admin-1", now);
    const state = new URL(oauth.authorizationUrl).searchParams.get("state") ?? "";
    const store = memoryStore();
    const fetchImpl: typeof fetch = async () => new Response(JSON.stringify({
      access_token: "access-token-value-for-test",
      refresh_token: "refresh-token-value-for-test",
      instance_url: "https://orgfarm-example.my.salesforce.com",
    }), { status: 200, headers: { "content-type": "application/json" } });
    const app = createAdminPortal({ authenticate: async () => ({ status: "unauthenticated" }) }, {
      allowedEmail: "admin@example.test", secretKey: "fixture", publishableKey: "",
    }, { salesforceConfig, salesforceStore: store, fetchImpl, now: () => now });
    const response = await app.request(
      "/admin/api/salesforce/oauth/callback?code=authorization-code&state=" + encodeURIComponent(state),
      { headers: { cookie: "co_sf_pkce=" + oauth.codeVerifier } },
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/admin?sf=connected#salesforce");
    expect(store.value?.updatedBy).toBe("admin-1");

    const invalidStore = memoryStore();
    const invalid = await createAdminPortal({ authenticate: async () => ({ status: "unauthenticated" }) }, {
      allowedEmail: "admin@example.test", secretKey: "fixture", publishableKey: "",
    }, { salesforceConfig, salesforceStore: invalidStore, fetchImpl, now: () => now }).request(
      "/admin/api/salesforce/oauth/callback?code=authorization-code&state=invalid",
      { headers: { cookie: "co_sf_pkce=" + oauth.codeVerifier } },
    );
    expect(invalid.status).toBe(302);
    expect(invalidStore.value).toBeNull();
  });
});
