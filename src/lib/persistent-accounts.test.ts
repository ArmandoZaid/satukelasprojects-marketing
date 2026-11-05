import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { getDbMemberById, getDbMemberBySlug, getDbMembers, getDbUserByEmail, getDbUserById, getDbUsers, createDbMember } from "./persistent-accounts";
import { closeDatabase } from "./db/client";

const testUrl = process.env.ACCOUNT_TEST_DATABASE_URL;
const suite = testUrl ? describe : describe.skip;
const schemaName = `account_test_${randomUUID().replaceAll("-", "")}`;
let pool: Pool;

suite("PostgreSQL persistent accounts", () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: testUrl });
    await pool.query(`CREATE SCHEMA ${schemaName}`);
    await pool.query(`CREATE TABLE ${schemaName}.users (
      id text PRIMARY KEY, email text NOT NULL UNIQUE, name text NOT NULL, role text NOT NULL,
      is_active boolean NOT NULL DEFAULT true, password_hash text NOT NULL, session_version text NOT NULL,
      phone text, address text, title text, avatar_url text,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
      CHECK (email = lower(btrim(email)))
    )`);
    await pool.query(`CREATE TABLE ${schemaName}.opportunities (id text PRIMARY KEY, owner_id text NOT NULL REFERENCES ${schemaName}.users(id))`);
    await pool.query(`CREATE TABLE ${schemaName}.activities (id text PRIMARY KEY, opportunity_id text NOT NULL REFERENCES ${schemaName}.opportunities(id), owner_id text NOT NULL REFERENCES ${schemaName}.users(id))`);
    const url = new URL(testUrl!);
    url.searchParams.set("options", `-c search_path=${schemaName}`);
    vi.stubEnv("DATABASE_URL", url.toString());
    vi.stubEnv("AUTH_SECRET", "test-only-auth-secret-for-persistent-runtime-accounts");
  });
  afterAll(async () => {
    await closeDatabase();
    if (pool) {
      await pool.query(`DROP SCHEMA ${schemaName} CASCADE`);
      await pool.end();
    }
    vi.unstubAllEnvs();
  });

  it("creates hashed marketer accounts and reads persistent identity without leaking private address into auth", async () => {
    const member = await createDbMember({ name: "  Persistent Marketer  ", email: "  PERSISTENT@EXAMPLE.TEST  ", password: "persistent-password", address: "Private home address", phone: "+62 812-3456", title: "Consultant" });
    expect(member).toMatchObject({ name: "Persistent Marketer", email: "persistent@example.test", address: "Private home address", role: "MARKETER", isActive: true });
    expect(member.id).toMatch(/^[a-f0-9-]{36}$/);
    expect(member.passwordHash).toMatch(/^scrypt\$/);
    expect(member).not.toHaveProperty("password");
    expect((await getDbMemberById(member.id))?.id).toBe(member.id);
    expect((await getDbMemberBySlug("persistent-marketer"))?.id).toBe(member.id);
    expect((await getDbMemberBySlug("persistent"))?.id).toBe(member.id);
    expect((await getDbMemberBySlug(member.id.toUpperCase()))?.id).toBe(member.id);
    expect((await getDbMembers()).some(item => item.id === member.id)).toBe(true);
    const account = await getDbUserByEmail(" PERSISTENT@EXAMPLE.TEST ");
    expect(account?.id).toBe(member.id);
    expect(account).not.toHaveProperty("address");
    expect(account).not.toHaveProperty("password");
    expect((await getDbUserById(member.id))?.passwordHash).toBe(member.passwordHash);
    expect((await getDbUsers()).some(item => item.id === member.id)).toBe(true);
  });

  it("enforces member validation, unique emails, relation conflicts, role guards and self-service rotation", async () => {
    const { updateDbMember, resetDbMemberPassword, deleteDbMember, updateDbOwnProfile, changeDbOwnPassword } = await import("./persistent-accounts");
    const png = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
    await pool.query(`INSERT INTO ${schemaName}.users (id, email, name, role, is_active, password_hash, session_version)
      VALUES ('usr_admin_db', 'admin@example.test', 'Admin DB', 'ADMIN', true, $1, 'v_admin')`, [(await getDbUsers())[0].passwordHash]);
    await expect(createDbMember({ name: "Conflict", email: "ADMIN@EXAMPLE.TEST", password: "valid-password" })).rejects.toMatchObject({ status: 409 });
    await expect(createDbMember({ name: "Bad Avatar", email: "avatar@example.test", password: "valid-password", avatarUrl: "data:image/png;base64,PHN2Zz4=" })).rejects.toMatchObject({ status: 400 });
    await expect(createDbMember({ name: "Bad Password", email: "pw@example.test", password: "x".repeat(129) })).rejects.toMatchObject({ status: 400 });
    await expect(updateDbMember("usr_admin_db", { name: "Hijack" })).rejects.toMatchObject({ status: 404 });
    await expect(resetDbMemberPassword("usr_admin_db", "valid-password")).rejects.toMatchObject({ status: 404 });
    await expect(deleteDbMember("usr_admin_db")).rejects.toMatchObject({ status: 400 });

    const m = await createDbMember({ name: "Mutable", email: "mutable@example.test", password: "initial-password", avatarUrl: png });
    const v1 = m.sessionVersion;
    const updated = await updateDbMember(m.id, { name: "Mutable Two", phone: "08123456789" }, true);
    expect(updated.name).toBe("Mutable Two");
    expect(updated.sessionVersion).not.toBe(v1);
    await resetDbMemberPassword(m.id, "reset-password-123");
    const afterReset = (await getDbUserById(m.id))!;
    expect(afterReset.sessionVersion).not.toBe(updated.sessionVersion);

    await pool.query(`INSERT INTO ${schemaName}.opportunities (id, owner_id) VALUES ('opp_1', $1)`, [m.id]);
    await expect(updateDbMember(m.id, { isActive: false })).rejects.toMatchObject({ status: 409 });
    await expect(deleteDbMember(m.id)).rejects.toMatchObject({ status: 409 });
    await pool.query(`DELETE FROM ${schemaName}.opportunities WHERE id = 'opp_1'`);

    const session = { userId: m.id, email: m.email, name: updated.name, role: "MARKETER" as const, iat: 1, exp: 9999999999, sessionVersion: "s" };
    const selfProfile = await updateDbOwnProfile(session, { name: "Self Updated", title: "Lead", avatarUrl: "" });
    expect(selfProfile).toMatchObject({ name: "Self Updated", title: "Lead", avatarUrl: undefined });
    expect(selfProfile.sessionVersion).not.toBe(afterReset.sessionVersion);
    await expect(changeDbOwnPassword(session, { currentPassword: "wrong-password", newPassword: "next-password-123", confirmPassword: "next-password-123" })).rejects.toMatchObject({ status: 400 });
    const selfPassword = await changeDbOwnPassword(session, { currentPassword: "reset-password-123", newPassword: "next-password-123", confirmPassword: "next-password-123" });
    expect(selfPassword.sessionVersion).not.toBe(selfProfile.sessionVersion);
    expect((await deleteDbMember(m.id)).deletedId).toBe(m.id);
    expect(await getDbMemberById(m.id)).toBeUndefined();
  });

  it("blocks activity-only owner removal, validates strict types, and sanitizes database failures", async () => {
    const { updateDbMember, deleteDbMember } = await import("./persistent-accounts");
    const owner = await createDbMember({ name: "Activity Owner", email: "activity-owner@example.test", password: "valid-password-1" });
    const other = await createDbMember({ name: "Opportunity Owner", email: "opp-owner@example.test", password: "valid-password-2" });
    await pool.query(`INSERT INTO ${schemaName}.opportunities (id, owner_id) VALUES ('opp_other', $1)`, [other.id]);
    await pool.query(`INSERT INTO ${schemaName}.activities (id, opportunity_id, owner_id) VALUES ('act_owner', 'opp_other', $1)`, [owner.id]);
    await expect(updateDbMember(owner.id, { name: "Must not persist", isActive: false })).rejects.toMatchObject({ status: 409 });
    await expect(deleteDbMember(owner.id)).rejects.toMatchObject({ status: 409 });
    expect((await getDbMemberById(owner.id))?.name).toBe("Activity Owner");
    await expect(updateDbMember(owner.id, { isActive: "false" as unknown as boolean })).rejects.toMatchObject({ status: 400 });
    await expect(createDbMember({ name: "Bad URL", email: "url@example.test", password: "valid-password-3", avatarUrl: "https://example.test/not a url" })).rejects.toMatchObject({ status: 400 });
    await closeDatabase();
    vi.stubEnv("DATABASE_URL", "postgresql://postgres@127.0.0.1:1/unreachable?connect_timeout=1");
    await expect(getDbUsers()).rejects.toSatisfy((error: unknown) =>
      error instanceof Error && "status" in error && error.status === 503 && !/postgres|127\.0\.0\.1|select/i.test(error.message));
  });
});
