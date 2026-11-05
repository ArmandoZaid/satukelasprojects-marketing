import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticateUser, hashPassword, signSessionToken, verifySessionToken, type RegisteredUser } from "./auth";

const state = vi.hoisted(() => ({ configured: false, cookie: undefined as string | undefined, byId: vi.fn(), byEmail: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => state.cookie ? { value: state.cookie } : undefined }) }));
vi.mock("./db/client", () => ({ isDatabaseConfigured: () => state.configured }));
vi.mock("./persistent-accounts", () => ({ getDbUserById: state.byId, getDbUserByEmail: state.byEmail }));
import { authenticateRuntimeUser, getRuntimeSession, requireRuntimeAdminSession, requireRuntimeCrmSession, signRuntimeSessionToken, verifyRuntimeSessionToken } from "./runtime-auth";
import { CrmDataError } from "./crm-data";

function databaseUser(overrides: Partial<RegisteredUser> = {}): RegisteredUser {
  return { id: randomUUID(), name: "Database Account", email: "database@example.test", role: "MARKETER", isActive: true, passwordHash: hashPassword("database-password"), sessionVersion: randomUUID(), ...overrides };
}

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test-only-auth-secret-for-persistent-runtime-accounts");
  vi.stubEnv("MARKETING_ENABLE_DEMO_AUTH", "true");
  state.cookie = undefined;
  state.configured = false;
  state.byId.mockReset();
  state.byEmail.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe("runtime authentication source of truth", () => {
  it("uses persistent identity for login, signing, revocation and role gates", async () => {
    state.configured = true;
    const account = databaseUser();
    state.byEmail.mockResolvedValue(account);
    state.byId.mockResolvedValue(account);
    const result = await authenticateRuntimeUser(" DATABASE@EXAMPLE.TEST ", "database-password");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(state.byEmail).toHaveBeenCalledWith("database@example.test");
    expect((await verifyRuntimeSessionToken(result.token))?.userId).toBe(account.id);
    state.cookie = result.token;
    expect((await getRuntimeSession())?.userId).toBe(account.id);
    expect((await requireRuntimeCrmSession())?.userId).toBe(account.id);
    expect(await requireRuntimeAdminSession()).toBeNull();
    const refreshed = await signRuntimeSessionToken({ userId: account.id, name: account.name, email: account.email, role: account.role }, 60);
    expect((await verifyRuntimeSessionToken(refreshed))?.userId).toBe(account.id);
    state.byId.mockResolvedValue({ ...account, sessionVersion: randomUUID() });
    expect(await verifyRuntimeSessionToken(result.token)).toBeNull();
    state.byId.mockResolvedValue({ ...account, isActive: false });
    expect(await verifyRuntimeSessionToken(result.token)).toBeNull();
  });

  it("never falls back to environment accounts when PostgreSQL is configured", async () => {
    state.configured = true;
    state.byEmail.mockResolvedValue(undefined);
    expect((await authenticateRuntimeUser("admin@satukelas.com", "AdminSatukelas2026!")).ok).toBe(false);
    state.byEmail.mockRejectedValue(new CrmDataError("Layanan database tidak tersedia.", 503));
    await expect(authenticateRuntimeUser("admin@satukelas.com", "AdminSatukelas2026!")).rejects.toMatchObject({ status: 503 });
    state.byId.mockRejectedValue(new CrmDataError("Layanan database tidak tersedia.", 503));
    const user = databaseUser();
    state.cookie = signSessionToken({ userId: user.id, email: user.email, name: user.name, role: user.role }, 60, [user]);
    await expect(getRuntimeSession()).rejects.toMatchObject({ status: 503 });
  });

  it("preserves demo fallback only when no database is configured", async () => {
    const result = await authenticateRuntimeUser("admin@satukelas.com", "AdminSatukelas2026!");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    state.cookie = result.token;
    expect((await requireRuntimeAdminSession())?.role).toBe("ADMIN");
    expect(state.byEmail).not.toHaveBeenCalled();
    expect(state.byId).not.toHaveBeenCalled();
  });

  it("denies malformed runtime tokens without looking up arbitrary IDs", async () => {
    state.configured = true;
    for (const token of ["", "invalid", "e30.invalid", `${"a".repeat(20000)}.x`]) expect(await verifyRuntimeSessionToken(token)).toBeNull();
    expect(state.byId).not.toHaveBeenCalled();
  });
});

describe("injected authentication registry", () => {
  it("authenticates and signs against only the supplied registry without changing demo defaults", () => {
    const account = databaseUser();
    const result = authenticateUser(" DATABASE@EXAMPLE.TEST ", "database-password", [account]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(verifySessionToken(result.token, [account])?.userId).toBe(account.id);
    expect(verifySessionToken(result.token)).toBeNull();
    expect(authenticateUser("admin@satukelas.com", "AdminSatukelas2026!", []).ok).toBe(false);
    expect(authenticateUser("admin@satukelas.com", "AdminSatukelas2026!").ok).toBe(true);
    expect(verifySessionToken(signSessionToken({ userId: account.id, name: account.name, email: account.email, role: account.role }, 60, [account]), [account])?.userId).toBe(account.id);
    expect(verifySessionToken(result.token, [{ ...account, sessionVersion: randomUUID() }])).toBeNull();
  });
});
