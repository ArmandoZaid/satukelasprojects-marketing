#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const root = fileURLToPath(new URL("../", import.meta.url));
const runId = randomBytes(12).toString("hex");
const container = `satukelas-pg-it-${runId}`;
const volume = `satukelas-pg-it-vol-${runId}`;
const database = `satukelas_it_${runId}`;
const user = `satukelas_it_${runId.slice(0, 12)}`;
const dbPassword = randomBytes(24).toString("base64url");
const authSecret = randomBytes(32).toString("base64url");
const adminEmail = `admin-${runId}@example.test`;
const adminPassword = `Adm!${randomBytes(18).toString("base64url")}`;
const vitestCli = fileURLToPath(new URL("../node_modules/vitest/vitest.mjs", import.meta.url));

function exec(command, args, { env = process.env, stdio = "pipe", timeout = 120_000, allowFailure = false } = {}) {
  const result = spawnSync(command, args, { cwd: root, env, encoding: "utf8", stdio, timeout, windowsHide: true });
  if (!allowFailure && (result.error || result.status !== 0)) {
    const details = String(result.stderr || result.stdout || result.error?.message || "").trim();
    throw new Error(`${command} ${args[0] ?? ""} failed with exit code ${result.status ?? "unknown"}${details ? `: ${details}` : ""}.`);
  }
  return result;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForPostgres(env, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const client = new Client({
      host: "127.0.0.1", port: Number(env.PGPORT), database: env.PGDATABASE,
      user: env.PGUSER, password: env.PGPASSWORD, connectionTimeoutMillis: 2_000,
    });
    try {
      await client.connect();
      await client.query("SELECT 1");
      await client.end();
      return;
    } catch {
      await client.end().catch(() => undefined);
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }
  throw new Error("Disposable PostgreSQL 16 test container did not become ready in time.");
}

function cleanup() {
  exec("docker", ["rm", "-f", "-v", container], { allowFailure: true, timeout: 30_000 });
  exec("docker", ["volume", "rm", "-f", volume], { allowFailure: true, timeout: 30_000 });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    cleanup();
    process.exit(130);
  });
}

try {
  for (const required of ["scripts/db-migrate.mjs", "scripts/db-bootstrap.mjs", "src/lib/persistent-accounts.ts", "src/lib/runtime-crm.ts"]) {
    if (!existsSync(new URL(`../${required}`, import.meta.url))) {
      throw new Error(`Required PostgreSQL implementation artifact is not present yet: ${required}`);
    }
  }
  const port = await freePort();
  exec("docker", ["volume", "create", volume]);
  exec("docker", [
    "run", "-d", "--name", container,
    "-p", `127.0.0.1:${port}:5432`,
    "-v", `${volume}:/var/lib/postgresql/data`,
    "-e", `POSTGRES_DB=${database}`,
    "-e", `POSTGRES_USER=${user}`,
    "-e", "POSTGRES_PASSWORD",
    "postgres:16-alpine",
  ], { env: { ...process.env, POSTGRES_PASSWORD: dbPassword }, timeout: 300_000 });

  const testEnv = {
    ...process.env,
    NODE_ENV: "test",
    DATABASE_URL: "",
    PGHOST: "127.0.0.1",
    PGPORT: String(port),
    PGDATABASE: database,
    PGUSER: user,
    PGPASSWORD: dbPassword,
    PGSSLMODE: "disable",
    AUTH_SECRET: authSecret,
    ADMIN_EMAIL: adminEmail,
    ADMIN_PASSWORD: adminPassword,
    ADMIN_NAME: "Integration Administrator",
    MARKETING_ENABLE_DEMO_AUTH: "false",
    MARKETING_ENABLE_DEMO_DATA: "false",
    MARKETING_USERS_JSON: "[]",
    SATUKELAS_POSTGRES_TEST_RUN_ID: runId,
  };

  await waitForPostgres(testEnv);
  exec(process.execPath, ["scripts/db-migrate.mjs"], { env: testEnv });
  exec(process.execPath, ["scripts/db-bootstrap.mjs"], { env: testEnv });
  exec(process.execPath, [vitestCli, "run", "--config", "vitest.postgres.config.mts"], {
    env: testEnv, stdio: "inherit", timeout: 300_000,
  });
} finally {
  cleanup();
}
