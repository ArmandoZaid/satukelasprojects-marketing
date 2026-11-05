import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { bootstrapAdmin } from "../../../scripts/db-bootstrap.mjs";
import { migrateDatabase } from "../../../scripts/db-migrate.mjs";
import { closeDatabase, getDatabase, getPool } from "./client";
import { activities, opportunities, users } from "./schema";

const testUrl = process.env.DATABASE_TEST_URL || process.env.CRM_TEST_DATABASE_URL || process.env.ACCOUNT_TEST_DATABASE_URL;
const suite = testUrl ? describe : describe.skip;
const schemaName = `db_foundation_${randomUUID().replaceAll("-", "")}`;
let adminPool: Pool;

suite("PostgreSQL migration, bootstrap and schema constraints", () => {
  beforeAll(async () => {
    adminPool = new Pool({ connectionString: testUrl });
    await adminPool.query(`CREATE SCHEMA ${schemaName}`);
    const url = new URL(testUrl!);
    url.searchParams.set("options", `-c search_path=${schemaName}`);
    vi.stubEnv("DATABASE_URL", url.toString());
  });

  afterAll(async () => {
    await closeDatabase();
    if (adminPool) {
      await adminPool.query(`DROP SCHEMA ${schemaName} CASCADE`);
      await adminPool.end();
    }
    vi.unstubAllEnvs();
  });

  it("applies versioned migration and preserves bootstrap admin across reruns", async () => {
    const firstMigration = await migrateDatabase({ pool: getPool() });
    expect(firstMigration.applied).toEqual(["0001_initial.sql"]);
    const secondMigration = await migrateDatabase({ pool: getPool() });
    expect(secondMigration.applied).toEqual([]);
    expect(secondMigration.skipped).toEqual(["0001_initial.sql"]);

    const firstBootstrap = await bootstrapAdmin({
      pool: getPool(),
      env: { ADMIN_EMAIL: " Admin@Satukelas.com ", ADMIN_PASSWORD: "BootstrapPassword2026!" },
    });
    expect(firstBootstrap).toEqual({ created: true, id: "usr_admin_01" });

    const db = getDatabase();
    await db.update(users).set({ email: "custom.admin@satukelas.com", passwordHash: "scrypt$custom$hash", sessionVersion: "session-updated" }).where(eq(users.id, "usr_admin_01"));
    const secondBootstrap = await bootstrapAdmin({ pool: getPool(), env: {} });
    expect(secondBootstrap).toEqual({ created: false, id: "usr_admin_01" });

    const [stored] = await db.select().from(users).where(eq(users.id, "usr_admin_01"));
    expect(stored.email).toBe("custom.admin@satukelas.com");
    expect(stored.passwordHash).toBe("scrypt$custom$hash");
    expect(stored.sessionVersion).toBe("session-updated");
  });

  it("enforces email normalization, opportunity uniqueness and activity owner consistency", async () => {
    const db = getDatabase();
    await db.insert(users).values([
      { id: "usr_marketer_01", email: "yunus@satukelas.com", name: "Yunus", role: "MARKETER", isActive: true, passwordHash: "scrypt$a$b", sessionVersion: "v1" },
      { id: "usr_marketer_02", email: "dzaky@satukelas.com", name: "Dzaky", role: "MARKETER", isActive: true, passwordHash: "scrypt$a$b", sessionVersion: "v1" },
    ]);
    await expect(db.insert(users).values({
      id: "usr_bad_email", email: "Mixed@Satukelas.com", name: "Mixed", role: "MARKETER", isActive: true, passwordHash: "scrypt$a$b", sessionVersion: "v1",
    })).rejects.toThrow();

    await db.insert(opportunities).values({
      id: "opp_01", ownerId: "usr_marketer_01", school: "SMA Contoh Cakrawala", region: "Surabaya",
      service: "Yearbook Lengkap", period: "2026/2027", stage: "Cold Lead", status: "OPEN",
      estimate: 10000000, created: 1700000000000,
    });
    await expect(db.insert(opportunities).values({
      id: "opp_02", ownerId: "usr_marketer_02", school: "sma contoh cakrawala", region: "Sidoarjo",
      service: "Yearbook Lengkap", period: "2026/2027", stage: "Cold Lead", status: "OPEN", created: 1700000000001,
    })).rejects.toThrow();

    await expect(db.insert(activities).values({
      id: "act_wrong_owner", opportunityId: "opp_01", ownerId: "usr_marketer_02",
      title: "Telepon dicatat", summary: "Bukan pemilik peluang.", date: "2026-10-16", time: "11.00",
    })).rejects.toThrow();
    await db.insert(activities).values({
      id: "act_ok", opportunityId: "opp_01", ownerId: "usr_marketer_01",
      title: "Telepon dicatat", summary: "Pemilik peluang cocok.", date: "2026-10-16", time: "11.00",
    });
  });
});
