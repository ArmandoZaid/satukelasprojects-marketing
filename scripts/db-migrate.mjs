import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { databasePoolConfig } from "../src/lib/db/config.mjs";

export const MIGRATION_LOCK_KEY = 734122;
const DEFAULT_MIGRATIONS_DIR = fileURLToPath(new URL("../migrations", import.meta.url));

/** @param {string} [migrationsDir] */
export function readMigrations(migrationsDir = DEFAULT_MIGRATIONS_DIR) {
  return readdirSync(migrationsDir)
    .filter(name => name.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right, "en"))
    .map(version => {
      const sql = readFileSync(path.join(migrationsDir, version), "utf8").replace(/\r\n/g, "\n");
      return { version, sql, checksum: createHash("sha256").update(sql, "utf8").digest("hex") };
    });
}

/** @param {{ env?: Record<string, string | undefined>; pool?: import('pg').Pool; migrationsDir?: string }} [options] */
export async function migrateDatabase(options = {}) {
  const migrations = readMigrations(options.migrationsDir);
  const ownsPool = !options.pool;
  const pool = options.pool ?? new Pool(databasePoolConfig(options.env));
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [MIGRATION_LOCK_KEY]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const existing = await client.query("SELECT version, checksum FROM schema_migrations");
    const recorded = new Map(existing.rows.map(row => [row.version, row.checksum]));
    const applied = [];
    const skipped = [];
    for (const migration of migrations) {
      const checksum = recorded.get(migration.version);
      if (checksum) {
        if (checksum !== migration.checksum) {
          throw new Error(`Migration checksum mismatch for ${migration.version}.`);
        }
        skipped.push(migration.version);
        continue;
      }
      await client.query(migration.sql);
      await client.query("INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)", [migration.version, migration.checksum]);
      applied.push(migration.version);
    }
    await client.query("COMMIT");
    return { applied, skipped };
  } catch (error) {
    await client?.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client?.release();
    if (ownsPool) await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await migrateDatabase();
    console.log(`Migrations applied: ${result.applied.length}, unchanged: ${result.skipped.length}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Database migration failed.");
    process.exit(1);
  }
}
