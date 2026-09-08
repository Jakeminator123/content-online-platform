import { RegistryError, initialRegistry, registrySchema, type Registry, type RegistrySnapshot, type RegistryStore } from "./registry.js";

// Narrow SQL-over-HTTPS adapter: text parameters/results only, no browser export.
// Protocol: https://github.com/neondatabase/serverless/blob/main/src/httpQuery.ts
export type SqlQuery = (query: string, params: string[]) => Promise<string[][]>;
export function neonQuery(connectionString: string, fetchImpl: typeof fetch = fetch): SqlQuery {
  let url: URL;
  try { url = new URL(connectionString); } catch { throw new RegistryError("storage_unconfigured", 503); }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.username || !url.password ||
      !/^ep-[a-z0-9-]+\.[a-z0-9.-]+\.neon\.tech$/.test(url.hostname) ||
      (url.port && url.port !== "5432") || url.pathname.length < 2) throw new RegistryError("storage_unconfigured", 503);
  const endpoint = "https://" + url.hostname.replace(/^[^.]+\./, "api.") + "/sql";
  return async (query, params) => {
    try {
      const response = await fetchImpl(endpoint, {
        method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15000),
        headers: { "content-type": "application/json", "Neon-Connection-String": connectionString, "Neon-Raw-Text-Output": "true", "Neon-Array-Mode": "true" },
        body: JSON.stringify({ query, params }),
      });
      if (!response.ok) throw new Error("storage");
      const result = await response.json() as { rows?: unknown };
      if (!Array.isArray(result.rows) || !result.rows.every(row => Array.isArray(row) && row.every(v => typeof v === "string"))) throw new Error("storage");
      return result.rows as string[][];
    } catch { throw new RegistryError("storage_unavailable", 503); } // Never expose URL, SQL or database error payload.
  };
}

export const REGISTRY_SQL = {
  schema: "CREATE TABLE IF NOT EXISTS co_registry_v1 (id integer PRIMARY KEY CHECK (id = 1), version bigint NOT NULL DEFAULT 1, data jsonb NOT NULL)",
  seed: "INSERT INTO co_registry_v1 (id, version, data) VALUES (1, 1, $1::jsonb) ON CONFLICT (id) DO NOTHING",
  read: "SELECT version::text, data::text FROM co_registry_v1 WHERE id = 1",
  write: "UPDATE co_registry_v1 SET data = $1::jsonb, version = version + 1 WHERE id = 1 AND version = $2::bigint RETURNING version::text, data::text",
} as const;
export class NeonRegistryStore implements RegistryStore {
  private ready: Promise<void> | undefined;
  constructor(private readonly query: SqlQuery) {}
  private async initialize() {
    if (!this.ready) this.ready = (async () => {
      await this.query(REGISTRY_SQL.schema, []);
      await this.query(REGISTRY_SQL.seed, [JSON.stringify(initialRegistry())]);
    })().catch(error => { this.ready = undefined; throw error; });
    await this.ready;
  }
  private snapshot(rows: string[][]): RegistrySnapshot {
    const row = rows[0];
    if (!row || !Number.isSafeInteger(Number(row[0])) || Number(row[0]) < 1 || !row[1]) throw new RegistryError("storage_unavailable", 503);
    try { return { version: Number(row[0]), data: registrySchema.parse(JSON.parse(row[1])) }; }
    catch { throw new RegistryError("storage_unavailable", 503); }
  }
  async read() {
    await this.initialize();
    return this.snapshot(await this.query(REGISTRY_SQL.read, []));
  }
  async write(expectedVersion: number, data: Registry) {
    await this.initialize();
    const rows = await this.query(REGISTRY_SQL.write, [JSON.stringify(registrySchema.parse(data)), String(expectedVersion)]);
    if (!rows.length) throw new RegistryError("version_conflict", 409);
    return this.snapshot(rows);
  }
}
let productionStore: RegistryStore | undefined;
export function registryStoreFromEnvironment(): RegistryStore {
  if (!productionStore) productionStore = new NeonRegistryStore(neonQuery(process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? ""));
  return productionStore;
}
