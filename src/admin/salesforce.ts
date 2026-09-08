import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { neonQuery, type SqlQuery } from "./registry-store.js";

const API_VERSION = "v67.0";
const STATE_TTL_SECONDS = 10 * 60;

export type SalesforceConfiguration = {
  loginUrl: "https://login.salesforce.com" | "https://test.salesforce.com";
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  stateSecret: string;
  tokenEncryptionKey: string;
  apiVersion: string;
};

export type SalesforceConnection = {
  encryptedRefreshToken: string;
  instanceUrl: string;
  updatedAt: string;
  updatedBy: string;
};

export interface SalesforceConnectionStore {
  read(): Promise<SalesforceConnection | null>;
  write(connection: SalesforceConnection): Promise<void>;
}

export type SalesforceOAuthRequest = {
  authorizationUrl: string;
  codeVerifier: string;
  expiresAt: string;
};

export type SalesforceAccountSummary = {
  id: string;
  name: string;
  ownerName: string | null;
};

type SalesforceEnvironment = Partial<Record<
  | "SALESFORCE_LOGIN_URL"
  | "SALESFORCE_CLIENT_ID"
  | "SALESFORCE_CLIENT_SECRET"
  | "SALESFORCE_REDIRECT_URI"
  | "SALESFORCE_OAUTH_STATE_SECRET"
  | "SALESFORCE_TOKEN_ENCRYPTION_KEY"
  | "SALESFORCE_API_VERSION",
  string | undefined
>>;

const tokenResponseSchema = z.object({
  access_token: z.string().min(16).max(4096),
  refresh_token: z.string().min(16).max(4096).optional(),
  instance_url: z.string().url(),
});

const accountResponseSchema = z.object({
  records: z.array(z.object({
    Id: z.string().regex(/^001[A-Za-z0-9]{12}(?:[A-Za-z0-9]{3})?$/),
    Name: z.string().min(1).max(255),
    Owner: z.object({ Name: z.string().min(1).max(255) }).nullable().optional(),
  })).max(20),
});

const stateSchema = z.object({
  v: z.literal(1),
  adminId: z.string().min(1).max(80),
  nonce: z.string().regex(/^[A-Za-z0-9_-]{32,}$/),
  exp: z.number().int().positive(),
});

export function readSalesforceConfiguration(env: SalesforceEnvironment): SalesforceConfiguration | null {
  const loginUrl = env.SALESFORCE_LOGIN_URL?.trim();
  const clientId = env.SALESFORCE_CLIENT_ID?.trim() ?? "";
  const clientSecret = env.SALESFORCE_CLIENT_SECRET?.trim() ?? "";
  const redirectUri = env.SALESFORCE_REDIRECT_URI?.trim() ?? "";
  const stateSecret = env.SALESFORCE_OAUTH_STATE_SECRET?.trim() ?? "";
  const tokenEncryptionKey = env.SALESFORCE_TOKEN_ENCRYPTION_KEY?.trim() ?? "";
  const apiVersion = env.SALESFORCE_API_VERSION?.trim() || API_VERSION;
  if (loginUrl !== "https://login.salesforce.com" && loginUrl !== "https://test.salesforce.com") return null;
  if (!/^[A-Za-z0-9._-]{20,200}$/.test(clientId) || clientSecret.length < 16 || clientSecret.length > 512) return null;
  let callback: URL;
  try { callback = new URL(redirectUri); } catch { return null; }
  if (callback.protocol !== "https:" || callback.href !== callback.origin + callback.pathname ||
      callback.pathname !== "/admin/api/salesforce/oauth/callback") return null;
  if (stateSecret.length < 32 || !parseEncryptionKey(tokenEncryptionKey) || !/^v\d{2}\.0$/.test(apiVersion)) return null;
  return { loginUrl, clientId, clientSecret, redirectUri: callback.href, stateSecret, tokenEncryptionKey, apiVersion };
}

export function createSalesforceOAuthRequest(
  config: SalesforceConfiguration,
  adminId: string,
  now = new Date(),
): SalesforceOAuthRequest {
  const expiresAt = new Date(now.getTime() + STATE_TTL_SECONDS * 1000);
  const payload = Buffer.from(JSON.stringify({
    v: 1,
    adminId,
    nonce: randomBytes(24).toString("base64url"),
    exp: Math.floor(expiresAt.getTime() / 1000),
  })).toString("base64url");
  const signature = createHmac("sha256", config.stateSecret).update(payload).digest("base64url");
  const codeVerifier = randomBytes(48).toString("base64url");
  const authorizationUrl = new URL("/services/oauth2/authorize", config.loginUrl);
  authorizationUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: "api refresh_token",
    state: payload + "." + signature,
    code_challenge: createHash("sha256").update(codeVerifier).digest("base64url"),
    code_challenge_method: "S256",
  }).toString();
  return { authorizationUrl: authorizationUrl.href, codeVerifier, expiresAt: expiresAt.toISOString() };
}

export function verifySalesforceOAuthState(state: string, stateSecret: string, now = new Date()) {
  const [payload, suppliedSignature, extra] = state.split(".");
  if (!payload || !suppliedSignature || extra) return null;
  const expectedSignature = createHmac("sha256", stateSecret).update(payload).digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(suppliedSignature, "base64url"); } catch { return null; }
  if (supplied.length !== expectedSignature.length || !timingSafeEqual(supplied, expectedSignature)) return null;
  try {
    const parsed = stateSchema.safeParse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    if (!parsed.success) return null;
    const nowSeconds = Math.floor(now.getTime() / 1000);
    if (parsed.data.exp < nowSeconds || parsed.data.exp > nowSeconds + STATE_TTL_SECONDS) return null;
    return parsed.data;
  } catch { return null; }
}

export function encryptSalesforceRefreshToken(refreshToken: string, configuredKey: string): string {
  const key = parseEncryptionKey(configuredKey);
  if (!key || refreshToken.length < 16 || refreshToken.length > 4096) throw new Error("invalid_salesforce_secret");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(refreshToken, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(value => value.toString("base64url")).join(".");
}

export function decryptSalesforceRefreshToken(encrypted: string, configuredKey: string): string {
  const key = parseEncryptionKey(configuredKey);
  const [ivText, tagText, ciphertextText, extra] = encrypted.split(".");
  if (!key || !ivText || !tagText || !ciphertextText || extra) throw new Error("invalid_salesforce_secret");
  try {
    const iv = Buffer.from(ivText, "base64url");
    const tag = Buffer.from(tagText, "base64url");
    const ciphertext = Buffer.from(ciphertextText, "base64url");
    if (iv.length !== 12 || tag.length !== 16 || !ciphertext.length) throw new Error("invalid");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch { throw new Error("invalid_salesforce_secret"); }
}

export async function completeSalesforceOAuth(input: {
  config: SalesforceConfiguration;
  store: SalesforceConnectionStore;
  code: string;
  codeVerifier: string;
  adminId: string;
  now?: Date;
  fetchImpl?: typeof fetch;
}) {
  const response = await tokenRequest(input.config, {
    grant_type: "authorization_code",
    code: input.code,
    code_verifier: input.codeVerifier,
    redirect_uri: input.config.redirectUri,
  }, input.fetchImpl);
  if (!response.refresh_token) throw new Error("salesforce_refresh_token_missing");
  const instanceUrl = validatedSalesforceInstanceUrl(response.instance_url);
  await input.store.write({
    encryptedRefreshToken: encryptSalesforceRefreshToken(response.refresh_token, input.config.tokenEncryptionKey),
    instanceUrl,
    updatedAt: (input.now ?? new Date()).toISOString(),
    updatedBy: input.adminId,
  });
}

export async function listSalesforceAccounts(input: {
  config: SalesforceConfiguration;
  store: SalesforceConnectionStore;
  query?: string;
  adminId: string;
  now?: Date;
  fetchImpl?: typeof fetch;
}): Promise<SalesforceAccountSummary[]> {
  const connection = await input.store.read();
  if (!connection) throw new Error("salesforce_not_connected");
  const refreshToken = decryptSalesforceRefreshToken(connection.encryptedRefreshToken, input.config.tokenEncryptionKey);
  const token = await tokenRequest(input.config, { grant_type: "refresh_token", refresh_token: refreshToken }, input.fetchImpl);
  const instanceUrl = validatedSalesforceInstanceUrl(token.instance_url);
  if (token.refresh_token) {
    await input.store.write({
      encryptedRefreshToken: encryptSalesforceRefreshToken(token.refresh_token, input.config.tokenEncryptionKey),
      instanceUrl,
      updatedAt: (input.now ?? new Date()).toISOString(),
      updatedBy: input.adminId,
    });
  }
  const filter = input.query?.trim().slice(0, 80);
  const escaped = filter?.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
  const soql = "SELECT Id, Name, Owner.Name FROM Account" + (escaped ? ` WHERE Name LIKE '%${escaped}%'` : "") + " ORDER BY Name LIMIT 20";
  const url = new URL(`/services/data/${input.config.apiVersion}/query`, instanceUrl);
  url.searchParams.set("q", soql);
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(url, {
    method: "GET",
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
    headers: { authorization: "Bearer " + token.access_token, accept: "application/json" },
  });
  if (!response.ok) throw new Error("salesforce_api_unavailable");
  const body = accountResponseSchema.safeParse(await response.json());
  if (!body.success) throw new Error("salesforce_invalid_response");
  return body.data.records.map(record => ({ id: record.Id, name: record.Name, ownerName: record.Owner?.Name ?? null }));
}

async function tokenRequest(
  config: SalesforceConfiguration,
  values: Record<string, string>,
  fetchImpl: typeof fetch = fetch,
) {
  const response = await fetchImpl(new URL("/services/oauth2/token", config.loginUrl), {
    method: "POST",
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, ...values }),
  });
  if (!response.ok) throw new Error("salesforce_oauth_failed");
  const parsed = tokenResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("salesforce_invalid_response");
  return parsed.data;
}

function validatedSalesforceInstanceUrl(raw: string): string {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("salesforce_invalid_instance"); }
  if (url.protocol !== "https:" || url.href !== url.origin + "/" || url.port ||
      !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.salesforce\.com$/.test(url.hostname)) throw new Error("salesforce_invalid_instance");
  return url.origin;
}

function parseEncryptionKey(configuredKey: string): Buffer | null {
  try {
    const key = /^[A-Fa-f0-9]{64}$/.test(configuredKey)
      ? Buffer.from(configuredKey, "hex")
      : Buffer.from(configuredKey, "base64");
    return key.length === 32 ? key : null;
  } catch { return null; }
}

export const SALESFORCE_SQL = {
  schema: "CREATE TABLE IF NOT EXISTS co_salesforce_connection_v1 (id integer PRIMARY KEY CHECK (id = 1), encrypted_refresh_token text NOT NULL, instance_url text NOT NULL, updated_at timestamptz NOT NULL, updated_by text NOT NULL)",
  read: "SELECT encrypted_refresh_token, instance_url, updated_at::text, updated_by FROM co_salesforce_connection_v1 WHERE id = 1",
  write: "INSERT INTO co_salesforce_connection_v1 (id, encrypted_refresh_token, instance_url, updated_at, updated_by) VALUES (1, $1, $2, $3::timestamptz, $4) ON CONFLICT (id) DO UPDATE SET encrypted_refresh_token = EXCLUDED.encrypted_refresh_token, instance_url = EXCLUDED.instance_url, updated_at = EXCLUDED.updated_at, updated_by = EXCLUDED.updated_by",
} as const;

export class NeonSalesforceConnectionStore implements SalesforceConnectionStore {
  private ready: Promise<void> | undefined;
  constructor(private readonly query: SqlQuery) {}
  private async initialize() {
    if (!this.ready) this.ready = this.query(SALESFORCE_SQL.schema, []).then(() => undefined).catch(error => {
      this.ready = undefined;
      throw error;
    });
    await this.ready;
  }
  async read() {
    await this.initialize();
    const row = (await this.query(SALESFORCE_SQL.read, []))[0];
    if (!row) return null;
    if (!row[0] || !row[1] || !row[2] || !row[3]) throw new Error("salesforce_storage_unavailable");
    return { encryptedRefreshToken: row[0], instanceUrl: validatedSalesforceInstanceUrl(row[1]), updatedAt: row[2], updatedBy: row[3] };
  }
  async write(connection: SalesforceConnection) {
    await this.initialize();
    await this.query(SALESFORCE_SQL.write, [
      connection.encryptedRefreshToken,
      validatedSalesforceInstanceUrl(connection.instanceUrl),
      connection.updatedAt,
      connection.updatedBy,
    ]);
  }
}

let productionStore: SalesforceConnectionStore | undefined;
export function salesforceStoreFromEnvironment(): SalesforceConnectionStore {
  if (!productionStore) productionStore = new NeonSalesforceConnectionStore(neonQuery(process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? ""));
  return productionStore;
}
