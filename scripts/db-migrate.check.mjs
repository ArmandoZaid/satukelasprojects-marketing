import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { MIGRATION_LOCK_KEY, migrateDatabase, readMigrations } from "./db-migrate.mjs";

function createFakeMigrationPool(initialRows = []) {
  const calls = [];
  const applied = new Map(initialRows.map(row => [row.version, row.checksum]));
  const client = {
    async query(sql, values = []) {
      calls.push({ sql: String(sql).trim(), values });
      if (/SELECT version, checksum FROM schema_migrations/i.test(sql)) {
        return { rows: [...applied.entries()].map(([version, checksum]) => ({ version, checksum })) };
      }
      if (/INSERT INTO schema_migrations/i.test(sql)) {
        applied.set(values[0], values[1]);
      }
      return { rows: [], rowCount: 1 };
    },
    release() {
      calls.push({ sql: "RELEASE", values: [] });
    },
  };
  return { calls, applied, pool: { connect: async () => client, end: async () => {} } };
}

test("applies 0001_initial.sql once inside an advisory-locked transaction and stays idempotent", async () => {
  const migrations = readMigrations();
  assert.equal(migrations[0]?.version, "0001_initial.sql");
  assert.match(migrations[0].sql, /CREATE TABLE IF NOT EXISTS users/i);
  assert.match(migrations[0].sql, /CREATE UNIQUE INDEX IF NOT EXISTS opportunities_school_service_period_unique/i);
  assert.match(migrations[0].sql, /CONSTRAINT activities_opportunity_owner_fk/i);
  assert.doesNotMatch(migrations[0].sql, /\bDROP\s+TABLE\b|\bTRUNCATE\b/i);

  const state = createFakeMigrationPool();
  const first = await migrateDatabase({ pool: state.pool });
  assert.deepEqual(first.applied, ["0001_initial.sql"]);
  assert.ok(state.calls.some(call => /pg_advisory_xact_lock/.test(call.sql) && call.values[0] === MIGRATION_LOCK_KEY));
  const second = await migrateDatabase({ pool: state.pool });
  assert.deepEqual(second.applied, []);
  assert.deepEqual(second.skipped, ["0001_initial.sql"]);
});

test("rejects modified checksum for an already applied migration and rolls back", async () => {
  const directory = mkdtempSync(path.join(process.env.TMPDIR || process.cwd(), "marketing-migration-check-"));
  try {
    writeFileSync(path.join(directory, "0001_initial.sql"), "SELECT 1;\n", "utf8");
    const state = createFakeMigrationPool([{ version: "0001_initial.sql", checksum: "different-checksum" }]);
    await assert.rejects(() => migrateDatabase({ pool: state.pool, migrationsDir: directory }), /checksum mismatch/i);
    assert.ok(state.calls.some(call => call.sql === "ROLLBACK"));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
