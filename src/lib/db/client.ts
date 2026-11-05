import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { databasePoolConfig, isDatabaseConfigured as hasDatabaseConfiguration } from "./config.mjs";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;
export type DatabaseTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export const DATABASE_WRITE_LOCK_KEY = 734123;

let pool: Pool | undefined;
let database: Database | undefined;

export function isDatabaseConfigured(): boolean {
  return hasDatabaseConfiguration();
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(databasePoolConfig());
    // An idle connection failure must not emit credentials or become unhandled.
    pool.on("error", () => console.error("PostgreSQL idle connection failed."));
  }
  return pool;
}

export function getDatabase(): Database {
  return database ??= drizzle(getPool(), { schema });
}

export async function closeDatabase(): Promise<void> {
  const closing = pool;
  database = undefined;
  pool = undefined;
  if (closing) await closing.end();
}
