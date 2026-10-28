import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as auth from "./auth";
import { createMarketingMember, getMarketingMembers, resetMarketingMembers } from "./member-store";
import { GET, PATCH } from "../app/api/account/route";
import { POST } from "../app/api/account/password/route";

function request(body: unknown, origin = "http://127.0.0.1:3100") {
  return new Request("http://127.0.0.1:3100/api/account", {
    method: "PATCH", headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}

let password: string;
function login(email = "admin@satukelas.com") {
  const result = auth.authenticateUser(email, password);
  if (!result.ok) throw new Error("Fixture login failed");
  const session = auth.verifySessionToken(result.token)!;
  vi.spyOn(auth, "getServerSession").mockResolvedValue(session);
  return result;
}
beforeEach(() => {
  vi.restoreAllMocks();
  password = randomBytes(24).toString("hex");
  vi.stubEnv("MARKETING_ENABLE_DEMO_AUTH", "true");
  vi.stubEnv("ADMIN_EMAIL", "admin@satukelas.com");
  vi.stubEnv("ADMIN_PASSWORD", password);
  vi.stubEnv("MARKETING_USERS_JSON", "[]");
  auth.resetAdminOverride();
  resetMarketingMembers();
});
afterEach(() => { auth.resetAdminOverride(); vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("PATCH /api/account", () => {
  it("updates only the caller and refreshes the session with the new profile", async () => {
    const old = login();
    const response = await PATCH(request({ name: "Admin Updated", email: " UPDATED@EXAMPLE.TEST ", phone: "+62 812-3456-7890", title: "Koordinator", avatarUrl: "" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.account).toMatchObject({ id: old.user.id, name: "Admin Updated", email: "updated@example.test", title: "Koordinator" });
    const cookie = response.cookies.get(auth.SESSION_COOKIE_NAME)!;
    expect(cookie).toBeDefined();
    expect(auth.verifySessionToken(cookie.value)?.email).toBe("updated@example.test");
    expect(auth.verifySessionToken(old.token)).toBeNull();
    expect(auth.authenticateUser("updated@example.test", password).ok).toBe(true);
  });
});

describe("self-service account validation", () => {
  it("updates a marketer profile, revokes its old session and preserves unrelated accounts", async () => {
    const member = createMarketingMember({ name: "Fixture", email: "self@example.test", password });
    const before = getMarketingMembers().filter(item => item.id !== member.id);
    const old = login(member.email);
    const response = await PATCH(request({ name: "New PIC", phone: "08123456789", title: "Marketing" }));
    expect(response.status).toBe(200);
    expect((await response.json()).account).toMatchObject({ id: member.id, name: "New PIC", phone: "08123456789" });
    expect(auth.verifySessionToken(old.token)).toBeNull();
    expect(auth.verifySessionToken(response.cookies.get(auth.SESSION_COOKIE_NAME)!.value)?.name).toBe("New PIC");
    expect(getMarketingMembers().filter(item => item.id !== member.id)).toEqual(before);
  });
  it("supports configured non-demo marketer accounts without mutating environment config", async () => {
    vi.stubEnv("MARKETING_ENABLE_DEMO_AUTH", "false");
    const config = JSON.stringify([{ id: "configured", email: "configured@example.test", name: "Configured", isActive: true, passwordHash: auth.hashPassword(password) }]);
    vi.stubEnv("MARKETING_USERS_JSON", config);
    login("configured@example.test");
    const response = await PATCH(request({ name: "Configured Updated", email: "configured-updated@example.test" }));
    expect(response.status).toBe(200);
    expect(auth.authenticateUser("configured-updated@example.test", password).ok).toBe(true);
    expect(process.env.MARKETING_USERS_JSON === config).toBe(true);
  });
  it.each([
    { userId: "usr_mkt_02" }, { role: "ADMIN" }, { isActive: false }, { passwordHash: "invalid" },
    { name: "" }, { name: [] }, { email: "not-email" }, { phone: "bad phone" },
    { title: "x".repeat(101) }, { avatarUrl: "data:image/svg+xml;base64,PHN2Zz4=" },
  ])("rejects invalid or protected payload %# atomically", async input => {
    const old = login();
    const before = JSON.stringify(auth.getRegisteredUsers());
    expect((await PATCH(request({ name: "Must not persist", ...input }))).status).toBe(400);
    expect(JSON.stringify(auth.getRegisteredUsers()) === before).toBe(true);
    expect(auth.verifySessionToken(old.token)).not.toBeNull();
  });
  it("rejects another account email atomically with 409", async () => {
    login();
    const before = JSON.stringify(auth.getRegisteredUsers());
    expect((await PATCH(request({ name: "Must not persist", email: "marketer@satukelas.com" }))).status).toBe(409);
    expect(JSON.stringify(auth.getRegisteredUsers()) === before).toBe(true);
  });
  it("guards origin, JSON content type, anonymous and unsupported roles", async () => {
    login();
    const before = JSON.stringify(auth.getRegisteredUsers());
    expect((await PATCH(request({ name: "Blocked" }, "https://evil.test"))).status).toBe(403);
    expect((await PATCH(new Request("http://127.0.0.1:3100/api/account", { method: "PATCH", body: "text" }))).status).toBe(415);
    vi.spyOn(auth, "getServerSession").mockResolvedValue(null);
    expect((await PATCH(request({ name: "Blocked" }))).status).toBe(401);
    vi.spyOn(auth, "getServerSession").mockResolvedValue({ userId: "usr_mgr_01", role: "MANAGER" } as auth.SessionPayload);
    expect((await GET()).status).toBe(403);
    expect(JSON.stringify(auth.getRegisteredUsers()) === before).toBe(true);
  });
});

describe("POST /api/account/password", () => {
  it.each(["ADMIN", "MARKETER", "CONFIGURED"])("changes only the %s password, hashes it and refreshes the session", async kind => {
    let email = "admin@satukelas.com";
    if (kind === "MARKETER") email = createMarketingMember({ name: "Password Fixture", email: "self-password@example.test", password }).email;
    if (kind === "CONFIGURED") {
      vi.stubEnv("MARKETING_ENABLE_DEMO_AUTH", "false");
      vi.stubEnv("MARKETING_USERS_JSON", JSON.stringify([{ id: "configured", email: "configured@example.test", name: "Configured", isActive: true, passwordHash: auth.hashPassword(password) }]));
      email = "configured@example.test";
    }
    const old = login(email);
    const others = auth.getRegisteredUsers().filter(account => account.id !== old.user.id);
    const next = randomBytes(24).toString("hex");
    const response = await POST(request({ currentPassword: password, newPassword: next, confirmPassword: next }));
    expect(response.status).toBe(200);
    expect(auth.authenticateUser(email, password).ok).toBe(false);
    expect(auth.authenticateUser(email, next).ok).toBe(true);
    expect(auth.verifySessionToken(old.token)).toBeNull();
    expect(auth.verifySessionToken(response.cookies.get(auth.SESSION_COOKIE_NAME)!.value)?.userId).toBe(old.user.id);
    const stored = auth.getRegisteredUsers().find(account => account.id === old.user.id)!;
    expect(stored.passwordHash?.startsWith("scrypt$")).toBe(true);
    expect(stored.password).toBeUndefined();
    expect(JSON.stringify(await response.json()).includes(next)).toBe(false);
    expect(auth.getRegisteredUsers().filter(account => account.id !== old.user.id)).toEqual(others);
  });
  it("rejects wrong current password without mutating or revoking sessions", async () => {
    const old = login();
    const before = JSON.stringify(auth.getRegisteredUsers());
    const next = randomBytes(24).toString("hex");
    const response = await POST(request({ currentPassword: "incorrect", newPassword: next, confirmPassword: next }));
    expect(response.status).toBe(400);
    expect(JSON.stringify(auth.getRegisteredUsers()) === before).toBe(true);
    expect(auth.verifySessionToken(old.token)).not.toBeNull();
  });
  it.each([{}, { newPassword: "short", confirmPassword: "short" }, { newPassword: "x".repeat(129) },
    { confirmPassword: "different" }, { currentPassword: [] }, { userId: "usr_mkt_02" }, { role: "ADMIN" }
  ])("rejects invalid password payload atomically %#", async changes => {
    const old = login();
    const before = JSON.stringify(auth.getRegisteredUsers());
    const next = randomBytes(24).toString("hex");
    const input = Object.keys(changes).length ? { currentPassword: password, newPassword: next, confirmPassword: next, ...changes } : {};
    expect((await POST(request(input))).status).toBe(400);
    expect(JSON.stringify(auth.getRegisteredUsers()) === before).toBe(true);
    expect(auth.verifySessionToken(old.token)).not.toBeNull();
  });
  it("guards password requests with the same origin and session checks", async () => {
    login();
    const input = { currentPassword: password, newPassword: password, confirmPassword: password };
    expect((await POST(request(input, "https://evil.test"))).status).toBe(403);
    vi.spyOn(auth, "getServerSession").mockResolvedValue(null);
    expect((await POST(request(input))).status).toBe(401);
  });
});

describe("account avatar upload", () => {
  const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  it("accepts a raster photo and returns the saved avatar", async () => {
    login();
    const avatarUrl = `data:image/png;base64,${png}`;
    const response = await PATCH(request({ avatarUrl }));
    expect(response.status).toBe(200);
    expect((await response.json()).account.avatarUrl === avatarUrl).toBe(true);
  });
  it("accepts uploads larger than CRM text inputs up to the 2MiB photo limit", async () => {
    login();
    const bytes = Buffer.alloc(18000);
    Buffer.from(png, "base64").copy(bytes);
    const response = await PATCH(request({ avatarUrl: `data:image/png;base64,${bytes.toString("base64")}` }));
    expect(response.status).toBe(200);
  });
  it.each([
    "data:image/png;base64,PHN2Zz4=", "data:image/jpeg;base64,aGVsbG8=", "https://example.test/photo.png",
    `data:image/png;base64,${Buffer.alloc(2 * 1024 * 1024 + 1).toString("base64")}`,
  ])("rejects unsupported, spoofed or oversized photos atomically %#", async avatarUrl => {
    login();
    const before = JSON.stringify(auth.getRegisteredUsers());
    expect([400, 413]).toContain((await PATCH(request({ name: "Must not persist", avatarUrl }))).status);
    expect(JSON.stringify(auth.getRegisteredUsers()) === before).toBe(true);
  });
});

describe("GET /api/account", () => {
  it("requires an authenticated session", async () => {
    vi.spyOn(auth, "getServerSession").mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });
  it("returns only safe profile fields with private no-store caching", async () => {
    login();
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.account).toMatchObject({ id: "usr_admin_01", role: "ADMIN", email: "admin@satukelas.com" });
    expect(Object.keys(body.account).sort()).toEqual(["avatarUrl", "email", "id", "name", "phone", "role", "title"]);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
