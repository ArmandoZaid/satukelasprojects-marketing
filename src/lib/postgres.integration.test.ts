import { spawnSync } from "node:child_process";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionPayload } from "./auth";
import { businessToday } from "./business-date";
import { closeDatabase, getPool, isDatabaseConfigured } from "./db/client";
import {
  changeDbOwnPassword, createDbMember, deleteDbMember, getDbMemberById,
  getDbMemberBySlug, getDbMembers, getDbUserByEmail, getDbUserById, getDbUsers,
  resetDbMemberPassword, updateDbMember, updateDbOwnProfile,
} from "./persistent-accounts";
import {
  authenticateRuntimeUser, signRuntimeSessionToken, verifyRuntimeSessionToken,
} from "./runtime-auth";
import {
  createRuntimeProspect, getRuntimeOpportunity, readRuntimeCrm,
  resetRuntimeCrm, updateRuntimeOpportunity,
} from "./runtime-crm";

const root = fileURLToPath(new URL("../../", import.meta.url));
const runId = process.env.SATUKELAS_POSTGRES_TEST_RUN_ID;
const databaseName = process.env.PGDATABASE ?? "";
const adminEmail = process.env.ADMIN_EMAIL ?? "";
const adminPassword = process.env.ADMIN_PASSWORD ?? "";

// Never allow TRUNCATE, connection denial, or bootstrap against an operator's DB.
if (!runId || !/^[a-f0-9]{24}$/.test(runId) || databaseName !== `satukelas_it_${runId}` ||
    process.env.PGHOST !== "127.0.0.1" || !/^\d+$/.test(process.env.PGPORT ?? "") ||
    process.env.DATABASE_URL || adminPassword.length < 12 || !adminEmail.endsWith("@example.test")) {
  throw new Error("Run PostgreSQL integration tests only with node scripts/postgres-test.mjs.");
}

const password = () => `It!${randomBytes(24).toString("base64url")}`;
const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const uuid = /^(?:opp-)?[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
type Identity = Pick<SessionPayload, "userId" | "name" | "email" | "role">;

function identity(user: { id: string; name: string; email: string; role: SessionPayload["role"] }): Identity {
  return { userId: user.id, name: user.name, email: user.email, role: user.role };
}

function script(name: "db-bootstrap.mjs" | "db-migrate.mjs") {
  const result = spawnSync(process.execPath, [`scripts/${name}`], {
    cwd: root, env: { ...process.env }, encoding: "utf8", timeout: 30_000, windowsHide: true,
  });
  // Child errors may include query arguments. Do not forward their output.
  expect(result.status === 0, `${name} completed successfully`).toBe(true);
}

async function login(email = adminEmail, secret = adminPassword) {
  const result = await authenticateRuntimeUser(email, secret);
  expect(result.ok, "database login succeeds").toBe(true);
  if (!result.ok) throw new Error("Database login did not succeed.");
  const session = await verifyRuntimeSessionToken(result.token);
  expect(Boolean(session), "database session verifies").toBe(true);
  if (!session) throw new Error("Database session did not verify.");
  return { session, token: result.token, user: result.user };
}

async function member(overrides: Partial<Parameters<typeof createDbMember>[0]> = {}) {
  const secret = password();
  const account = await createDbMember({
    name: "Identical Display Name", email: `member-${randomUUID()}@example.test`, password: secret,
    phone: "081234567890", address: "Private test address", title: "Konsultan", ...overrides,
  });
  return { account, secret: overrides.password ?? secret };
}

function prospect(school = `SMA Integration ${randomUUID()}`) {
  return { school, region: "Surabaya", service: "Photoshoot", period: "2026/2027", estimate: "12500000" };
}

function resultInput(summary = "Sekolah telah dihubungi") {
  return { summary, kind: "Telepon", date: businessToday(), nextAction: "", due: "" };
}

async function failure(operation: () => unknown | Promise<unknown>, status?: number) {
  let rejected = false;
  let actualStatus: unknown;
  try { await operation(); }
  catch (error) {
    rejected = true;
    actualStatus = error && typeof error === "object" && "status" in error ? error.status : undefined;
  }
  expect(rejected, "operation must reject").toBe(true);
  if (status !== undefined) expect(actualStatus === status, `rejection status is ${status}`).toBe(true);
}

function containsPrivateFields(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, item]) =>
    /^(password|passwordHash|password_hash|sessionVersion|session_version|address)$/i.test(key) ||
    containsPrivateFields(item));
}

// Unexpected database exceptions can contain SQL bind arguments (including hashes).
// All assertions below compare only booleans, counts, and non-sensitive CRM fields.
function integration(name: string, body: () => Promise<void>) {
  it(name, async () => {
    try { await body(); }
    catch (error) {
      if (error instanceof Error && error.name === "AssertionError") throw error;
      const status = error && typeof error === "object" && "status" in error ? error.status : undefined;
      throw new Error(`Integration operation failed${typeof status === "number" ? ` (status ${status})` : ""}; database error details withheld.`);
    }
  });
}

beforeEach(async () => {
  vi.unstubAllEnvs();
  await closeDatabase();
  await getPool().query("TRUNCATE TABLE activities, opportunities, users CASCADE");
  script("db-bootstrap.mjs");
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await closeDatabase();
});

describe("real PostgreSQL persistence and authorization", () => {
  integration("boots an empty operational CRM with only the configured administrator", async () => {
    expect(isDatabaseConfigured()).toBe(true);
    const users = await getDbUsers();
    expect(users.length).toBe(1);
    expect(users[0].email === adminEmail && users[0].role === "ADMIN").toBe(true);
    expect((await getDbMembers()).length).toBe(0);
    const admin = await login();
    const state = await readRuntimeCrm(admin.session);
    expect(state.opportunities.length).toBe(0);
    expect(state.activities.length).toBe(0);
    expect((await authenticateRuntimeUser("marketer@satukelas.com", "MarketerSatukelas2026!")).ok).toBe(false);
    expect((await authenticateRuntimeUser(adminEmail, password())).ok).toBe(false);
    expect(containsPrivateFields(admin.user)).toBe(false);
  });

  integration("persists members and CRM across pool reconnects and repeated migrations", async () => {
    const fixture = await member();
    const owner = await login(fixture.account.email, fixture.secret);
    const input = prospect();
    const created = await createRuntimeProspect(owner.session, input);
    expect(created.opportunities.length).toBe(1);
    const id = created.opportunities[0].id;
    expect(uuid.test(id)).toBe(true);
    expect(created.opportunities[0].school).toBe(input.school);
    expect(created.opportunities[0].school.includes("(Contoh)")).toBe(false);
    await updateRuntimeOpportunity(owner.session, id, "result", resultInput());
    await closeDatabase();
    script("db-migrate.mjs");
    script("db-migrate.mjs");
    expect(Boolean(await getDbUserById(fixture.account.id))).toBe(true);
    expect((await getDbUserByEmail(fixture.account.email))?.id === fixture.account.id).toBe(true);
    expect((await getDbMemberById(fixture.account.id))?.id === fixture.account.id).toBe(true);
    expect((await getDbMemberBySlug(fixture.account.id))?.id === fixture.account.id).toBe(true);
    expect((await verifyRuntimeSessionToken(owner.token))?.userId === fixture.account.id).toBe(true);
    const reloaded = await readRuntimeCrm(owner.session);
    expect(reloaded.opportunities.length).toBe(1);
    expect(reloaded.activities.length).toBe(1);
    expect(reloaded.activities[0].date).toBe(businessToday());
  });

  integration("scopes same-name owners by immutable ID and ignores forged owner input", async () => {
    const [a, b] = await Promise.all([member(), member()]);
    expect(a.account.name === b.account.name && a.account.id !== b.account.id).toBe(true);
    const ownerA = await login(a.account.email, a.secret);
    const ownerB = await login(b.account.email, b.secret);
    const admin = await login();
    const inputA = prospect();
    const stateA = await createRuntimeProspect(ownerA.session, {
      ...inputA, owner: "Forged owner", ownerId: b.account.id,
    });
    const idA = stateA.opportunities[0].id;
    const stateB = await createRuntimeProspect(ownerB.session, prospect());
    expect(stateA.opportunities[0].ownerId === a.account.id).toBe(true);
    expect(stateB.opportunities.length).toBe(1);
    expect(stateB.opportunities.every(item => item.ownerId === b.account.id)).toBe(true);
    await updateRuntimeOpportunity(ownerA.session, idA, "result", resultInput("A private activity"));
    const before = fingerprint(await readRuntimeCrm(admin.session));
    await failure(() => getRuntimeOpportunity(ownerB.session, idA), 404);
    await failure(() => updateRuntimeOpportunity(ownerB.session, idA, "result", resultInput("Intrusion")), 404);
    await failure(() => updateRuntimeOpportunity(ownerB.session, idA, "stage", {
      stage: "Contacted", reason: "", finalValue: "", closedOn: "", reference: "",
    }), 404);
    expect(fingerprint(await readRuntimeCrm(admin.session)) === before).toBe(true);
    const own = await readRuntimeCrm(ownerA.session);
    expect(own.opportunities.length).toBe(1);
    expect(own.activities.length).toBe(1);
    expect(own.activities.every(item => item.ownerId === a.account.id)).toBe(true);
    expect((await readRuntimeCrm(ownerB.session)).activities.length).toBe(0);
    const all = await readRuntimeCrm(admin.session);
    expect(all.opportunities.length).toBe(2);
    expect((await getRuntimeOpportunity(admin.session, idA)).id === idA).toBe(true);
    expect(containsPrivateFields(all)).toBe(false);
    expect(containsPrivateFields(await getRuntimeOpportunity(ownerA.session, idA))).toBe(false);
    expect(JSON.stringify(all).includes("Private test address")).toBe(false);
  });

  integration("denies unsupported database roles before every CRM operation", async () => {
    const fixture = await member();
    await getPool().query("UPDATE users SET role = 'MANAGER' WHERE id = $1", [fixture.account.id]);
    const manager = await login(fixture.account.email, fixture.secret);
    const admin = await login();
    const created = await createRuntimeProspect(admin.session, prospect());
    const id = created.opportunities[0].id;
    const before = fingerprint(await readRuntimeCrm(admin.session));
    await failure(() => readRuntimeCrm(manager.session), 403);
    await failure(() => createRuntimeProspect(manager.session, prospect()), 403);
    await failure(() => getRuntimeOpportunity(manager.session, id), 403);
    await failure(() => updateRuntimeOpportunity(manager.session, id, "result", resultInput()), 403);
    expect(fingerprint(await readRuntimeCrm(admin.session)) === before).toBe(true);
  });

  integration("reserves inactive emails across create, member edit and own profile atomically", async () => {
    const inactive = await member({ isActive: false });
    const active = await member();
    const owner = await login(active.account.email, active.secret);
    const before = fingerprint(await getDbUserById(active.account.id));
    const count = (await getDbUsers()).length;
    await failure(() => createDbMember({ name: "Collision", email: ` ${inactive.account.email.toUpperCase()} `, password: password() }), 409);
    await failure(() => updateDbMember(active.account.id, { name: "Must not persist", email: inactive.account.email, isActive: false }), 409);
    await failure(() => updateDbOwnProfile(owner.session, { name: "Must not persist", email: inactive.account.email }), 409);
    expect((await getDbUsers()).length).toBe(count);
    expect(fingerprint(await getDbUserById(active.account.id)) === before).toBe(true);
    expect((await authenticateRuntimeUser(inactive.account.email, inactive.secret)).ok).toBe(false);
    expect((await authenticateRuntimeUser(active.account.email, active.secret)).ok).toBe(true);
    expect((await authenticateRuntimeUser(adminEmail, adminPassword)).ok).toBe(true);
  });

  for (const [label, invalid] of [
    ["phone", { phone: "not-a-phone" }],
    ["address", { address: "x".repeat(501) }],
    ["avatar", { avatarUrl: "javascript:alert(1)" }],
  ] as const) {
    integration(`rejects invalid member ${label} without partially writing another field`, async () => {
      const fixture = await member();
      const before = fingerprint(await getDbUserById(fixture.account.id));
      const count = (await getDbUsers()).length;
      await failure(() => createDbMember({ name: "Rejected create", email: `bad-${randomUUID()}@example.test`, password: password(), ...invalid }));
      await failure(() => updateDbMember(fixture.account.id, { name: "Must not persist", isActive: false, ...invalid }));
      expect((await getDbUsers()).length).toBe(count);
      expect(fingerprint(await getDbUserById(fixture.account.id)) === before).toBe(true);
      expect((await authenticateRuntimeUser(fixture.account.email, fixture.secret)).ok).toBe(true);
    });
  }

  integration("validates complete own profile before writing fields or revoking sessions", async () => {
    const fixture = await member();
    const owner = await login(fixture.account.email, fixture.secret);
    const before = fingerprint(await getDbUserById(fixture.account.id));
    for (const invalid of [
      { phone: "not-a-phone" }, { avatarUrl: "data:image/png;base64,aGVsbG8=" },
      { name: "bad\u0000name" }, { title: "x".repeat(101) }, { email: "invalid-email" },
    ]) {
      await failure(() => updateDbOwnProfile(owner.session, { name: "Must not persist", ...invalid }));
      expect(fingerprint(await getDbUserById(fixture.account.id)) === before).toBe(true);
      expect(Boolean(await verifyRuntimeSessionToken(owner.token))).toBe(true);
    }
  });

  integration("protects members with linked opportunities from deletion and deactivation", async () => {
    const fixture = await member();
    const owner = await login(fixture.account.email, fixture.secret);
    await createRuntimeProspect(owner.session, prospect());
    const before = fingerprint(await getDbUserById(fixture.account.id));
    const crmBefore = fingerprint(await readRuntimeCrm(owner.session));
    await failure(() => updateDbMember(fixture.account.id, { name: "Must not persist", isActive: false }), 409);
    await failure(() => deleteDbMember(fixture.account.id), 409);
    expect(fingerprint(await getDbUserById(fixture.account.id)) === before).toBe(true);
    expect(fingerprint(await readRuntimeCrm(owner.session)) === crmBefore).toBe(true);
    expect(Boolean(await verifyRuntimeSessionToken(owner.token))).toBe(true);
    const unrelated = await member();
    await deleteDbMember(unrelated.account.id);
    expect(Boolean(await getDbMemberById(unrelated.account.id))).toBe(false);
    expect((await authenticateRuntimeUser(unrelated.account.email, unrelated.secret)).ok).toBe(false);
  });

  integration("revokes sessions when an unlinked member is deactivated", async () => {
    const fixture = await member();
    const owner = await login(fixture.account.email, fixture.secret);
    await updateDbMember(fixture.account.id, { isActive: false });
    expect(await verifyRuntimeSessionToken(owner.token)).toBeNull();
    expect((await authenticateRuntimeUser(fixture.account.email, fixture.secret)).ok).toBe(false);
    await updateDbMember(fixture.account.id, { isActive: true });
    expect(await verifyRuntimeSessionToken(owner.token)).toBeNull();
    expect((await authenticateRuntimeUser(fixture.account.email, fixture.secret)).ok).toBe(true);
  });

  integration("allows exactly one global duplicate prospect under concurrent owners", async () => {
    const [a, b] = await Promise.all([member(), member()]);
    const ownerA = await login(a.account.email, a.secret);
    const ownerB = await login(b.account.email, b.secret);
    const input = prospect();
    const outcomes = await Promise.allSettled([
      createRuntimeProspect(ownerA.session, input),
      createRuntimeProspect(ownerB.session, { ...input, school: input.school.toUpperCase() }),
    ]);
    expect(outcomes.filter(item => item.status === "fulfilled").length).toBe(1);
    expect(outcomes.filter(item => item.status === "rejected").length).toBe(1);
    const conflict = outcomes.find(item => item.status === "rejected");
    expect(conflict?.status === "rejected" && conflict.reason?.status === 409).toBe(true);
    const admin = await login();
    expect((await readRuntimeCrm(admin.session)).opportunities.length).toBe(1);
  });

  integration("retains every concurrent activity without lost updates or cross-owner leakage", async () => {
    const fixture = await member();
    const other = await member();
    const owner = await login(fixture.account.email, fixture.secret);
    const otherOwner = await login(other.account.email, other.secret);
    const created = await createRuntimeProspect(owner.session, prospect());
    const id = created.opportunities[0].id;
    await createRuntimeProspect(otherOwner.session, prospect());
    const count = 12;
    await Promise.all(Array.from({ length: count }, (_, index) =>
      updateRuntimeOpportunity(owner.session, id, "result", resultInput(`Concurrent activity ${index}`))));
    const state = await readRuntimeCrm(owner.session);
    expect(state.activities.length).toBe(count);
    expect(new Set(state.activities.map(item => item.id)).size).toBe(count);
    expect(new Set(state.activities.map(item => item.summary)).size).toBe(count);
    expect(state.activities.every(item => item.ownerId === fixture.account.id && item.opportunityId === id)).toBe(true);
    expect((await readRuntimeCrm(otherOwner.session)).activities.length).toBe(0);
    await closeDatabase();
    expect((await readRuntimeCrm(owner.session)).activities.length).toBe(count);
  });

  integration("rolls back a stage update when its activity insert fails inside PostgreSQL", async () => {
    const admin = await login();
    const created = await createRuntimeProspect(admin.session, prospect());
    const id = created.opportunities[0].id;
    const before = fingerprint(await readRuntimeCrm(admin.session));
    await getPool().query("ALTER TABLE activities ADD CONSTRAINT postgres_test_reject_stage CHECK (title NOT LIKE 'Tahap:%')");
    try {
      await failure(() => updateRuntimeOpportunity(admin.session, id, "stage", {
        stage: "Contacted", reason: "Transaction rollback probe", finalValue: "", closedOn: "", reference: "",
      }));
      expect(fingerprint(await readRuntimeCrm(admin.session)) === before).toBe(true);
    } finally {
      await getPool().query("ALTER TABLE activities DROP CONSTRAINT postgres_test_reject_stage");
    }
    const updated = await updateRuntimeOpportunity(admin.session, id, "stage", {
      stage: "Contacted", reason: "", finalValue: "", closedOn: "", reference: "",
    });
    expect(updated.opportunities[0].stage).toBe("Contacted");
    expect(updated.activities.length).toBe(1);
  });

  integration("uses actual WIB dates and preserves state on invalid future closing", async () => {
    expect(businessToday(new Date("2026-11-05T18:00:00Z"))).toBe("2026-11-06");
    const admin = await login();
    const created = await createRuntimeProspect(admin.session, prospect());
    const id = created.opportunities[0].id;
    const tomorrow = new Date(`${businessToday()}T00:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const future = tomorrow.toISOString().slice(0, 10);
    const before = fingerprint(await readRuntimeCrm(admin.session));
    await failure(() => updateRuntimeOpportunity(admin.session, id, "result", { ...resultInput(), date: future }));
    await failure(() => updateRuntimeOpportunity(admin.session, id, "stage", {
      stage: "Won", reason: "Kesepakatan sekolah", finalValue: "15000000", closedOn: future, reference: "SPK-IT",
    }));
    expect(fingerprint(await readRuntimeCrm(admin.session)) === before).toBe(true);
    const won = await updateRuntimeOpportunity(admin.session, id, "stage", {
      stage: "Won", reason: "Kesepakatan sekolah", finalValue: "15000000", closedOn: businessToday(), reference: "SPK-IT",
    });
    expect(won.opportunities[0].status).toBe("WON");
    expect(won.opportunities[0].finalValue).toBe(15000000);
    expect(won.activities[0].date).toBe(businessToday());
  });

  integration("revokes an old token and password after an administrator password reset", async () => {
    const fixture = await member();
    const owner = await login(fixture.account.email, fixture.secret);
    const replacement = password();
    await resetDbMemberPassword(fixture.account.id, replacement);
    expect(await verifyRuntimeSessionToken(owner.token)).toBeNull();
    expect((await authenticateRuntimeUser(fixture.account.email, fixture.secret)).ok).toBe(false);
    const refreshed = await login(fixture.account.email, replacement);
    expect(refreshed.session.userId === fixture.account.id).toBe(true);
  });

  integration("changes own password atomically and signs a valid refreshed caller session", async () => {
    const fixture = await member();
    const owner = await login(fixture.account.email, fixture.secret);
    const replacement = password();
    const before = fingerprint(await getDbUserById(fixture.account.id));
    await failure(() => changeDbOwnPassword(owner.session, { currentPassword: password(), newPassword: replacement, confirmPassword: replacement }));
    await failure(() => changeDbOwnPassword(owner.session, { currentPassword: fixture.secret, newPassword: replacement, confirmPassword: password() }));
    expect(fingerprint(await getDbUserById(fixture.account.id)) === before).toBe(true);
    expect(Boolean(await verifyRuntimeSessionToken(owner.token))).toBe(true);
    const changed = await changeDbOwnPassword(owner.session, { currentPassword: fixture.secret, newPassword: replacement, confirmPassword: replacement });
    expect(await verifyRuntimeSessionToken(owner.token)).toBeNull();
    const refresh = await signRuntimeSessionToken(identity(changed));
    expect((await verifyRuntimeSessionToken(refresh))?.userId === fixture.account.id).toBe(true);
    expect((await authenticateRuntimeUser(fixture.account.email, fixture.secret)).ok).toBe(false);
    expect((await authenticateRuntimeUser(fixture.account.email, replacement)).ok).toBe(true);
  });

  integration("rotates own profile identity while retaining a newly signed caller session", async () => {
    const fixture = await member();
    const owner = await login(fixture.account.email, fixture.secret);
    const nextEmail = `renamed-${randomUUID()}@example.test`;
    const changed = await updateDbOwnProfile(owner.session, { name: "Renamed Member", email: nextEmail, phone: "081234567899", title: "Konsultan baru" });
    expect(await verifyRuntimeSessionToken(owner.token)).toBeNull();
    const refresh = await signRuntimeSessionToken(identity(changed));
    const verified = await verifyRuntimeSessionToken(refresh);
    expect(verified?.email === nextEmail && verified.name === "Renamed Member").toBe(true);
    expect((await authenticateRuntimeUser(fixture.account.email, fixture.secret)).ok).toBe(false);
    expect((await authenticateRuntimeUser(nextEmail, fixture.secret)).ok).toBe(true);
    await closeDatabase();
    expect((await getDbUserById(fixture.account.id))?.email === nextEmail).toBe(true);
  });

  integration("never overwrites renamed administrator credentials on bootstrap restart", async () => {
    const admin = await login();
    const nextEmail = `admin-renamed-${randomUUID()}@example.test`;
    const replacement = password();
    const renamed = await updateDbOwnProfile(admin.session, { name: "Renamed Administrator", email: nextEmail });
    const refreshed = await signRuntimeSessionToken(identity(renamed));
    const current = await verifyRuntimeSessionToken(refreshed);
    expect(Boolean(current)).toBe(true);
    if (!current) throw new Error("Refreshed administrator session was not valid.");
    const changed = await changeDbOwnPassword(current, { currentPassword: adminPassword, newPassword: replacement, confirmPassword: replacement });
    const token = await signRuntimeSessionToken(identity(changed));
    await closeDatabase();
    script("db-migrate.mjs");
    script("db-bootstrap.mjs");
    script("db-bootstrap.mjs");
    expect((await getDbUsers()).length).toBe(1);
    expect((await getDbUserById(admin.session.userId))?.email === nextEmail).toBe(true);
    expect((await authenticateRuntimeUser(adminEmail, adminPassword)).ok).toBe(false);
    expect((await authenticateRuntimeUser(nextEmail, replacement)).ok).toBe(true);
    expect(Boolean(await verifyRuntimeSessionToken(token))).toBe(true);
  });

  integration("rejects production resets even when demo flags are enabled", async () => {
    const admin = await login();
    await createRuntimeProspect(admin.session, prospect());
    const before = fingerprint(await readRuntimeCrm(admin.session));
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MARKETING_ENABLE_DEMO_AUTH", "true");
    vi.stubEnv("MARKETING_ENABLE_DEMO_DATA", "true");
    await failure(() => resetRuntimeCrm());
    expect(fingerprint(await readRuntimeCrm(admin.session)) === before).toBe(true);
  });

  integration("returns 503 during a real database outage without synthetic auth or CRM fallback", async () => {
    const admin = await login();
    await createRuntimeProspect(admin.session, prospect());
    const before = fingerprint(await readRuntimeCrm(admin.session));
    const control = new Pool({
      host: "127.0.0.1", port: Number(process.env.PGPORT), user: process.env.PGUSER,
      password: process.env.PGPASSWORD, database: "postgres", max: 1, connectionTimeoutMillis: 5000,
    });
    try {
      await closeDatabase();
      await control.query(`ALTER DATABASE "${databaseName}" ALLOW_CONNECTIONS false`);
      vi.stubEnv("MARKETING_ENABLE_DEMO_AUTH", "true");
      vi.stubEnv("MARKETING_ENABLE_DEMO_DATA", "true");
      await failure(() => readRuntimeCrm(admin.session), 503);
      await failure(() => authenticateRuntimeUser(adminEmail, adminPassword), 503);
      await failure(() => verifyRuntimeSessionToken(admin.token), 503);
      await failure(() => createRuntimeProspect(admin.session, prospect()), 503);
    } finally {
      await closeDatabase();
      await control.query(`ALTER DATABASE "${databaseName}" ALLOW_CONNECTIONS true`);
      await control.end();
    }
    expect(fingerprint(await readRuntimeCrm(admin.session)) === before).toBe(true);
    expect((await authenticateRuntimeUser(adminEmail, adminPassword)).ok).toBe(true);
  });
});
