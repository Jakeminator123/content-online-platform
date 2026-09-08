import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NeonRegistryStore } from "../src/admin/registry-store.js";

if (process.env.CI !== "true" || process.env.VERCEL || process.env.PGHOST !== "127.0.0.1") throw new Error("Only isolated CI Postgres is allowed");
const execute = promisify(execFile);
export const query = async (sql: string, params: string[]) => {
  const statement = params.length ? "PREPARE test_query(" + params.map(() => "text").join(",") + ") AS " + sql + "; EXECUTE test_query(" + params.map(p => "'" + p.replaceAll("'", "''") + "'").join(",") + ");" : sql;
  const { stdout } = await execute("psql", ["-X", "-q", "-t", "-A", "-F", "\t", "-v", "ON_ERROR_STOP=1", "-c", statement]);
  return stdout.trim() ? stdout.trim().split("\n").map(row => row.split("\t")) : [];
};
