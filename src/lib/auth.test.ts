import { createHmac, randomBytes, scryptSync } from "node:crypto";
import { POST } from "../app/api/auth/login/route";
import { resetMarketingMembers, resetMemberPassword } from "./member-store";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { getSafeCrmReturnUrl, LoginForm } from "../components/login-form";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

function configuredMarketer(overrides: Record<string, unknown> = {}) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync("fixture-password", salt, 64).toString("hex");
  return {
    id: "configured_mkt", email: "configured@example.test", name: "Configured Marketer",
    passwordHash: `scrypt$${salt}$${key}`, isActive: true, ...overrides,
  };
}
import {
  getServerSession,
  requireAdminSession,
  requireCrmSession,
  hashPassword,
  authenticateUser,
  signSessionToken,
  verifySessionToken,
  getRegisteredUsers,
} from "./auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const cookieState = vi.hoisted(() => ({ value: undefined as string | undefined, set: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => cookieState.value ? { value: cookieState.value } : undefined, set: cookieState.set }),
}));

describe("Authentication & Session Library", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    cookieState.value = undefined;
    cookieState.set.mockClear();
    process.env = { ...originalEnv };
    for (const key of ["ADMIN_EMAIL", "ADMIN_PASSWORD", "AUTH_SECRET", "MARKETING_AUTH_SECRET", "MARKETING_USERS_JSON", "MARKETING_ENABLE_DEMO_AUTH"]) {
      delete process.env[key];
    }
    process.env.MARKETING_ENABLE_DEMO_AUTH = "true";
    resetMarketingMembers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    process.env = originalEnv;
  });

  it("authenticates default ADMIN credentials successfully", () => {
    const res = authenticateUser("admin@satukelas.com", "AdminSatukelas2026!");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.user.role).toBe("ADMIN");
      expect(res.user.email).toBe("admin@satukelas.com");
      expect(res.user.name).toBe("Administrator Satukelas");
      expect(res.token).toBeDefined();

      const verified = verifySessionToken(res.token);
      expect(verified).not.toBeNull();
      expect(verified?.role).toBe("ADMIN");
      expect(verified?.email).toBe("admin@satukelas.com");
    }
  });

  it("handles case-insensitivity and whitespace in email input", () => {
    const res = authenticateUser("  Admin@SatuKelas.COM  ", "AdminSatukelas2026!");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.user.email).toBe("admin@satukelas.com");
      expect(res.user.role).toBe("ADMIN");
    }
  });

  it("fails when password does not match", () => {
    const res = authenticateUser("admin@satukelas.com", "WrongPassword123!");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("INVALID_CREDENTIALS");
      expect(res.error).toContain("Email atau kata sandi tidak valid");
    }
  });

  it("fails with uniform message when email does not exist (no email enumeration)", () => {
    const res = authenticateUser("nonexistent@domain.com", "SomePassword123!");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe("INVALID_CREDENTIALS");
      expect(res.error).toContain("Email atau kata sandi tidak valid");
    }
  });

  it("fails when fields are empty", () => {
    const res1 = authenticateUser("", "password");
    expect(res1.ok).toBe(false);

    const res2 = authenticateUser("admin@satukelas.com", "");
    expect(res2.ok).toBe(false);
  });

  it("authenticates manager and marketer accounts with their respective roles", () => {
    const mgr = authenticateUser("manager@satukelas.com", "ManagerSatukelas2026!");
    expect(mgr.ok).toBe(true);
    if (mgr.ok) {
      expect(mgr.user.role).toBe("MANAGER");
    }

    const mkt = authenticateUser("marketer@satukelas.com", "MarketerSatukelas2026!");
    expect(mkt.ok).toBe(true);
    if (mkt.ok) {
      expect(mkt.user.role).toBe("MARKETER");
    }
  });

  it("provides four distinct demo marketer identities for ownership", () => {
    const marketers = getRegisteredUsers().filter((user) => user.role === "MARKETER");
    expect(marketers.map(({ id, name }) => ({ id, name }))).toEqual([
      { id: "usr_mkt_01", name: "Yunus" },
      { id: "usr_mkt_02", name: "Dzaky" },
      { id: "usr_mkt_03", name: "Armando" },
      { id: "usr_mkt_04", name: "Yasser" },
    ]);
    expect(new Set(marketers.map((user) => user.email)).size).toBe(4);
    for (const user of marketers) {
      const password = randomBytes(24).toString("hex");
      resetMemberPassword(user.id, password);
      expect(user.password).toBeUndefined();
      const result = authenticateUser(user.email, password);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.user.id).toBe(user.id);
    }
  });

  it("never exposes default accounts outside test or explicit demo mode", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.MARKETING_ENABLE_DEMO_AUTH;
    expect(getRegisteredUsers().length).toBe(0);
    expect(authenticateUser("admin@satukelas.com", "AdminSatukelas2026!").ok).toBe(false);
    process.env.MARKETING_ENABLE_DEMO_AUTH = "true";
    expect(getRegisteredUsers().length).toBe(6);
  });

  it("authenticates configured scrypt accounts only as MARKETER outside demo mode", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.MARKETING_ENABLE_DEMO_AUTH;
    process.env.AUTH_SECRET = randomBytes(32).toString("hex");
    process.env.ADMIN_EMAIL = "owner@example.test";
    process.env.ADMIN_PASSWORD = "configured-admin-password";
    process.env.MARKETING_USERS_JSON = JSON.stringify([configuredMarketer({ role: "ADMIN" })]);
    const result = authenticateUser("configured@example.test", "fixture-password");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.role).toBe("MARKETER");
      expect(result.user.id).toBe("configured_mkt");
      expect("passwordHash" in result.user).toBe(false);
      expect("password" in result.user).toBe(false);
    }
    expect(authenticateUser("configured@example.test", "incorrect").ok).toBe(false);
    expect(authenticateUser("owner@example.test", "configured-admin-password").ok).toBe(true);
    expect(getRegisteredUsers().length).toBe(2);
  });

  it("fails closed for malformed or duplicate configured registry entries", () => {
    const valid = configuredMarketer();
    const invalidRegistries: unknown[] = [
      {}, null, [null], ["not-an-account"],
      [valid, { ...valid, id: "other" }],
      [valid, { ...valid, email: "other@example.test" }],
      [{ ...valid, email: " ADMIN@SATUKELAS.COM " }],
      [{ ...valid, id: "usr_admin_01" }],
      ...[
        { id: "" }, { id: 10 }, { email: "bad-email" }, { email: null },
        { name: " " }, { name: [] }, { isActive: "true" }, { isActive: undefined },
        { passwordHash: "not-scrypt" }, { passwordHash: "scrypt$salt$ff" },
        { passwordHash: undefined, password: "plaintext" },
      ].map((overrides) => [{ ...valid, ...overrides }]),
    ];
    for (const registry of invalidRegistries) {
      process.env.MARKETING_USERS_JSON = JSON.stringify(registry);
      expect(getRegisteredUsers().length).toBe(0);
      expect(authenticateUser("admin@satukelas.com", "AdminSatukelas2026!").ok).toBe(false);
    }
    process.env.MARKETING_USERS_JSON = "invalid-json";
    expect(getRegisteredUsers().length).toBe(0);
  });

  it("hashes passwords with independent random salts and a verifiable scrypt key", () => {
    const first = hashPassword("helper-fixture-password");
    const second = hashPassword("helper-fixture-password");
    expect(first !== second).toBe(true);
    const [algorithm, salt, key] = first.split("$");
    expect(algorithm).toBe("scrypt");
    expect(salt.length).toBe(32);
    expect(scryptSync("helper-fixture-password", salt, 64).toString("hex") === key).toBe(true);
    process.env.MARKETING_USERS_JSON = JSON.stringify([configuredMarketer({ passwordHash: first })]);
    expect(authenticateUser("configured@example.test", "helper-fixture-password").ok).toBe(true);
  });

  it("requires a configured secret of at least 32 characters outside demo", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.MARKETING_ENABLE_DEMO_AUTH;
    process.env.ADMIN_EMAIL = "owner@example.test";
    process.env.ADMIN_PASSWORD = "configured-admin-password";
    const payload = { userId: "usr_admin_01", email: "owner@example.test", name: "Owner", role: "ADMIN" as const };
    expect(() => signSessionToken(payload)).toThrow();
    process.env.AUTH_SECRET = "too-short";
    expect(() => signSessionToken(payload)).toThrow();
    process.env.AUTH_SECRET = randomBytes(32).toString("hex");
    expect(verifySessionToken(signSessionToken(payload))?.userId).toBe("usr_admin_01");
    delete process.env.AUTH_SECRET;
    process.env.MARKETING_AUTH_SECRET = randomBytes(32).toString("hex");
    expect(verifySessionToken(signSessionToken(payload))?.userId).toBe("usr_admin_01");
  });

  it("rejects malformed signed claims and requires exactly two token parts", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-24T00:00:00Z"));
    process.env.AUTH_SECRET = randomBytes(32).toString("hex");
    const now = Math.floor(Date.now() / 1000);
    const baseline = signSessionToken({ userId: "usr_admin_01", email: "admin@satukelas.com", name: "Admin", role: "ADMIN" }, 60);
    const claims = JSON.parse(Buffer.from(baseline.split(".")[0], "base64url").toString("utf8"));
    const encode = (payload: unknown) => {
      const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
      return `${body}.${createHmac("sha256", process.env.AUTH_SECRET!).update(body).digest("base64url")}`;
    };
    expect(verifySessionToken(encode(claims)) !== null).toBe(true);
    const invalid = [
      null, [], "payload", {},
      ...[
        { exp: undefined }, { exp: null }, { exp: "9999999999" }, { exp: now }, { exp: Number.POSITIVE_INFINITY },
        { iat: undefined }, { iat: null }, { iat: "123" }, { iat: now + 1 }, { iat: -1 }, { iat: now + 100, exp: now + 1 },
        { userId: "" }, { userId: [] }, { email: "invalid" }, { name: "" }, { name: {} }, { role: "SUPERADMIN" },
        { sessionVersion: undefined }, { sessionVersion: null }, { sessionVersion: 1 }, { sessionVersion: "obsolete-version" },
      ].map((overrides) => ({ ...claims, ...overrides })),
    ];
    for (const payload of invalid) expect(verifySessionToken(encode(payload)) === null).toBe(true);
    const token = encode(claims);
    expect(verifySessionToken(`${token}.extra`) === null).toBe(true);
    expect(verifySessionToken(`${token}.`) === null).toBe(true);
  });

  it("revalidates sessions against active registry identity, role and email", () => {
    const configured = configuredMarketer();
    process.env.MARKETING_USERS_JSON = JSON.stringify([configured]);
    const auth = authenticateUser(configured.email, "fixture-password");
    expect(auth.ok).toBe(true);
    if (!auth.ok) return;
    expect(verifySessionToken(auth.token) !== null).toBe(true);
    for (const overrides of [{ isActive: false }, { email: "new@example.test" }, { id: "replacement" }]) {
      process.env.MARKETING_USERS_JSON = JSON.stringify([{ ...configured, ...overrides }]);
      expect(verifySessionToken(auth.token) === null).toBe(true);
    }
    process.env.MARKETING_USERS_JSON = JSON.stringify([configured]);
    const forgedAdmin = signSessionToken({ userId: configured.id, email: configured.email, name: configured.name, role: "ADMIN" });
    expect(verifySessionToken(forgedAdmin) === null).toBe(true);
    process.env.MARKETING_USERS_JSON = "[]";
    expect(verifySessionToken(auth.token) === null).toBe(true);
    process.env.MARKETING_USERS_JSON = JSON.stringify([{ ...configured, isActive: false }]);
    const inactive = authenticateUser(configured.email, "fixture-password");
    expect(inactive.ok).toBe(false);
    if (!inactive.ok) expect(inactive.code).toBe("ACCOUNT_INACTIVE");
  });

  it("admits ADMIN and MARKETER sessions to CRM while keeping admin-only strict", async () => {
    expect(await getServerSession()).toBeNull();
    expect(await requireCrmSession()).toBeNull();
    expect(await requireAdminSession()).toBeNull();
    for (const user of getRegisteredUsers()) {
      cookieState.value = signSessionToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
      expect((await requireCrmSession()) !== null).toBe(user.role === "ADMIN" || user.role === "MARKETER");
      expect((await requireAdminSession()) !== null).toBe(user.role === "ADMIN");
    }
    cookieState.value = "invalid-session";
    expect(await requireCrmSession()).toBeNull();
  });

  it("allows admin and marketer login API admission but denies manager with 403", async () => {
    for (const user of getRegisteredUsers()) {
      cookieState.set.mockClear();
      const password = user.role === "MARKETER" ? randomBytes(24).toString("hex") : user.password;
      if (user.role === "MARKETER") resetMemberPassword(user.id, password!);
      const response = await POST(new Request("http://127.0.0.1/api/auth/login", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: user.email, password }),
      }));
      expect(response.status).toBe(user.role === "MANAGER" ? 403 : 200);
      expect(cookieState.set.mock.calls.length).toBe(user.role === "MANAGER" ? 0 : 1);
      const body = await response.json();
      if (user.role === "MANAGER") expect(body.code).toBe("FORBIDDEN_ROLE");
      else {
        expect(body.user.role).toBe(user.role);
        expect(body.redirect).toBe("/dashboard");
        expect("token" in body).toBe(false);
      }
    }
  });

  it("returns 400 for malformed login field types and malformed JSON", async () => {
    const payloads: unknown[] = [null, [], "body", {}, { email: 42, password: "x" }, { email: {}, password: "x" },
      { email: "admin@satukelas.com", password: 42 }, { email: "admin@satukelas.com", password: [] }];
    for (const payload of payloads) {
      const response = await POST(new Request("http://127.0.0.1/api/auth/login", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
      }));
      expect(response.status).toBe(400);
    }
    const malformed = await POST(new Request("http://127.0.0.1/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" }, body: "{",
    }));
    expect(malformed.status).toBe(400);
    const fileForm = new FormData();
    fileForm.set("email", new Blob(["email"]), "email.txt");
    fileForm.set("password", "not-a-valid-password");
    const fileResponse = await POST(new Request("http://127.0.0.1/api/auth/login", { method: "POST", body: fileForm }));
    expect(fileResponse.status).toBe(400);
    expect(cookieState.set.mock.calls.length).toBe(0);
  });

  it("renders account-neutral login without credential hints or password autofill", () => {
    const markup = renderToStaticMarkup(createElement(LoginForm));
    expect(markup.includes("Masuk ke Web Admin")).toBe(true);
    expect(markup.includes("Email akun")).toBe(true);
    expect(markup.includes("Masuk ke workspace")).toBe(true);
    expect(markup.includes("login-hint")).toBe(false);
    expect(markup.includes("Gunakan Akun Ini")).toBe(false);
    expect(markup.includes('type="email"')).toBe(true);
    expect(markup.includes('name="email"')).toBe(true);
    const source = readFileSync(new URL("../components/login-form.tsx", import.meta.url), "utf8");
    expect(source.includes("Satukelas2026")).toBe(false);
    expect(source.includes("fillSampleCredentials")).toBe(false);
    expect(source.includes("admin@satukelas.com")).toBe(false);
  });

  it("allows return URLs only for matching internal routes permitted to the role", () => {
    for (const path of ["/dashboard", "/opportunities?search=example", "/schools", "/pipeline", "/follow-ups", "/activities", "/reports#summary"]) {
      expect(getSafeCrmReturnUrl("MARKETER", path)).toBe(path);
    }
    for (const path of ["https://example.test/dashboard", "//example.test/dashboard", "javascript:alert(1)", "/preview/dashboard", "/settings", "/admin", "/dashboard/../settings", "/%64ashboard", "/dashboard/child", "/dashboard\\evil", "/dashboard\n", "", null, undefined]) {
      expect(getSafeCrmReturnUrl("MARKETER", path)).toBe("/dashboard");
    }
    expect(getSafeCrmReturnUrl("ADMIN", "/settings")).toBe("/settings");
    expect(getSafeCrmReturnUrl("ADMIN", "/admin")).toBe("/admin");
    expect(getSafeCrmReturnUrl("ADMIN", "/preview/dashboard")).toBe("/dashboard");
    expect(getSafeCrmReturnUrl("MANAGER", "/reports")).toBe("/dashboard");
  });

  it("requires an explicit demo flag even in test environments", () => {
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.MARKETING_ENABLE_DEMO_AUTH;
    expect(getRegisteredUsers().length).toBe(0);
    process.env.MARKETING_ENABLE_DEMO_AUTH = "false";
    expect(getRegisteredUsers().length).toBe(0);
    process.env.MARKETING_ENABLE_DEMO_AUTH = "true";
    expect(getRegisteredUsers().length).toBe(6);
  });

  it("admits two provisioned stable marketer IDs with demo auth disabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.MARKETING_ENABLE_DEMO_AUTH = "false";
    process.env.AUTH_SECRET = randomBytes(32).toString("hex");
    process.env.ADMIN_EMAIL = "owner@example.test";
    const password = randomBytes(24).toString("hex");
    process.env.ADMIN_PASSWORD = password;
    process.env.MARKETING_USERS_JSON = JSON.stringify([
      configuredMarketer({ id: "usr_mkt_01", email: "yunus@example.test", name: "Yunus", passwordHash: hashPassword(password) }),
      configuredMarketer({ id: "usr_mkt_02", email: "dzaky@example.test", name: "Dzaky", passwordHash: hashPassword(password) }),
    ]);
    expect(getRegisteredUsers().map(({ id }) => id)).toEqual(["usr_admin_01", "usr_mkt_01", "usr_mkt_02"]);
    for (const user of getRegisteredUsers()) {
      cookieState.set.mockClear();
      const response = await POST(new Request("http://127.0.0.1/api/auth/login", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: user.email, password }),
      }));
      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.user.id).toBe(user.id);
      const cookie = cookieState.set.mock.calls[0]?.[0];
      expect(verifySessionToken(cookie.value)?.userId).toBe(user.id);
    }
  });

  it("rejects tampered session tokens", () => {
    const res = authenticateUser("admin@satukelas.com", "AdminSatukelas2026!");
    expect(res.ok).toBe(true);
    if (res.ok) {
      const [payload, sig] = res.token.split(".");
      // Tamper signature
      const badToken = `${payload}.${sig.slice(0, -4)}abcd`;
      expect(verifySessionToken(badToken)).toBeNull();

      // Tamper payload
      const badPayloadToken = `eyJhbGciOiJIUzI1NiJ9.${sig}`;
      expect(verifySessionToken(badPayloadToken)).toBeNull();
    }
  });

  it("rejects expired session tokens", () => {
    // Generate token with duration -10 seconds (already expired)
    const expiredToken = signSessionToken(
      {
        userId: "usr_admin_01",
        email: "admin@satukelas.com",
        name: "Admin",
        role: "ADMIN",
      },
      -10
    );

    const verified = verifySessionToken(expiredToken);
    expect(verified).toBeNull();
  });

  it("respects custom ADMIN_EMAIL and ADMIN_PASSWORD environment variables", () => {
    process.env.ADMIN_EMAIL = "superadmin@customdomain.id";
    process.env.ADMIN_PASSWORD = "CustomSuperSecret2026!";

    const registered = getRegisteredUsers();
    const adminUser = registered.find((u) => u.role === "ADMIN");
    expect(adminUser?.email).toBe("superadmin@customdomain.id");

    const authRes = authenticateUser("superadmin@customdomain.id", "CustomSuperSecret2026!");
    expect(authRes.ok).toBe(true);
    if (authRes.ok) {
      expect(authRes.user.email).toBe("superadmin@customdomain.id");
      expect(authRes.user.role).toBe("ADMIN");
    }
  });
});
