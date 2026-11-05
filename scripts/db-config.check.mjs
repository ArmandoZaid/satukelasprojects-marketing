import assert from "node:assert/strict";
import { test } from "node:test";

const load = () => import("../src/lib/db/config.mjs");

test("database config is explicit, bounded and does not initialize a connection", async () => {
  const { databasePoolConfig, isDatabaseConfigured } = await load();
  assert.equal(isDatabaseConfigured({}), false);
  assert.equal(isDatabaseConfigured({ DATABASE_URL: "  ", PGHOST: "  " }), false);
  assert.equal(isDatabaseConfigured({ PGHOST: "postgres" }), true);
  assert.throws(() => databasePoolConfig({}), /not configured/i);
  assert.deepEqual(databasePoolConfig({ PGHOST: "postgres", PGPORT: "5433", PGDATABASE: "marketing", PGUSER: "app", PGPASSWORD: "test-only" }), {
    host: "postgres", port: 5433, database: "marketing", user: "app", password: "test-only",
    ssl: false, max: 10, connectionTimeoutMillis: 5000,
  });
  for (const port of ["abc", "0", "65536", "5432oops"]) {
    assert.throws(() => databasePoolConfig({ PGHOST: "postgres", PGPORT: port }), /PGPORT/);
  }
});

test("URL and PGSSLMODE require certificate verification rather than disabling it", async () => {
  const { databasePoolConfig } = await load();
  for (const mode of ["require", "verify-full", "verify-ca"]) {
    const config = databasePoolConfig({ DATABASE_URL: `postgresql://app@postgres/marketing?sslmode=${mode}` });
    assert.equal(config.ssl.rejectUnauthorized, true);
    assert.ok(!config.connectionString.includes("sslmode"));
    assert.equal(databasePoolConfig({ PGHOST: "postgres", PGSSLMODE: mode }).ssl.rejectUnauthorized, true);
  }
  assert.equal(databasePoolConfig({ DATABASE_URL: "postgresql://app@postgres/marketing", PGSSLMODE: "verify-full" }).ssl.rejectUnauthorized, true);
  assert.throws(() => databasePoolConfig({ PGHOST: "postgres", PGSSLMODE: "no-verify" }), /SSL mode/);
  assert.throws(() => databasePoolConfig({ DATABASE_URL: "not-a-valid-database-url" }), /Invalid DATABASE_URL/);
});
