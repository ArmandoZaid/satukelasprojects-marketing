import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { databasePoolConfig } from "../src/lib/db/config.mjs";

export const ACCOUNT_WRITE_LOCK_KEY = 734123;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashBootstrapPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

/** @param {{ env?: Record<string, string | undefined>; pool?: import('pg').Pool }} [options] */
export async function bootstrapAdmin(options = {}) {
  const env = options.env ?? process.env;
  const ownsPool = !options.pool;
  const pool = options.pool ?? new Pool(databasePoolConfig(env));
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [ACCOUNT_WRITE_LOCK_KEY]);
    const existing = await client.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
    if (existing.rows.length > 0) {
      await client.query("COMMIT");
      return { created: false, id: String(existing.rows[0].id) };
    }
    const email = (env.ADMIN_EMAIL ?? "").trim().toLowerCase();
    const password = env.ADMIN_PASSWORD ?? "";
    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      throw new Error("A valid ADMIN_EMAIL is required to bootstrap the first ADMIN account.");
    }
    if (password.trim().length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters to bootstrap the first ADMIN account.");
    }
    await client.query(
      `INSERT INTO users (id, email, name, role, is_active, password_hash, session_version, phone, title)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ["usr_admin_01", email, "Administrator Satukelas", "ADMIN", true, hashBootstrapPassword(password), randomUUID(), "", "Administrator Sistem"],
    );
    await client.query("COMMIT");
    return { created: true, id: "usr_admin_01" };
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
    const result = await bootstrapAdmin();
    console.log(result.created ? "Bootstrap admin created." : "Bootstrap admin already exists.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Database admin bootstrap failed.");
    process.exit(1);
  }
}
