import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NeonRegistryStore } from "../src/admin/registry-store.js";
import { applyRegistryCommand } from "../src/admin/registry.js";

if (process.env.CI !== "true" || process.env.VERCEL || process.env.PGHOST !== "127.0.0.1") throw new Error("Only isolated CI Postgres is allowed");
const execute = promisify(execFile);
const query = async (sql: string, params: string[]) => {
  const statement = params.length ? "PREPARE test_query(" + params.map(() => "text").join(",") + ") AS " + sql + "; EXECUTE test_query(" + params.map(p => "'" + p.replaceAll("'", "''") + "'").join(",") + ");" : sql;
  const { stdout } = await execute("psql", ["-X", "-q", "-t", "-A", "-F", "\t", "-v", "ON_ERROR_STOP=1", "-c", statement]);
  return stdout.trim() ? stdout.trim().split("\n").map(row => row.split("\t")) : [];
};
const first = new NeonRegistryStore(query);
const initial = await first.read();
const next = applyRegistryCommand(initial.data, { action: "add_customer", name: "SQL regression 'example'", slug: "sql-regression" }, "ci-regression");
const result = await first.write(initial.version, next);
const reconnected = new NeonRegistryStore(query);
assert.deepEqual(await reconnected.read(), result, "A fresh store reads the same persisted record");
const races = await Promise.allSettled([first.write(result.version, next), reconnected.write(result.version, next)]);
assert.equal(races.filter(r => r.status === "fulfilled").length, 1);
assert.equal(races.filter(r => r.status === "rejected").length, 1);
assert.equal((await reconnected.read()).data.customers.filter(c => c.slug === "sql-regression").length, 1);
console.log("Real isolated PostgreSQL: schema, seed preservation, persistence across connections and optimistic concurrency passed");
