import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticateUser, getRegisteredUsers, hashPassword, verifySessionToken } from "./auth";
import { createMarketingMember, getMarketingMembers, resetMarketingMembers, updateMarketingMember } from "./member-store";

let adminPassword: string;
let newPassword: string;
beforeEach(() => {
  adminPassword = randomBytes(24).toString("hex");
  newPassword = randomBytes(24).toString("hex");
  vi.stubEnv("MARKETING_ENABLE_DEMO_AUTH", "true");
  vi.stubEnv("ADMIN_EMAIL", "admin@satukelas.com");
  vi.stubEnv("ADMIN_PASSWORD", adminPassword);
  vi.stubEnv("MARKETING_USERS_JSON", "[]");
  resetMarketingMembers();
});
afterEach(() => vi.unstubAllEnvs());

function adminToken() {
  const auth = authenticateUser("admin@satukelas.com", adminPassword);
  if (!auth.ok) throw new Error("Admin fixture authentication failed");
  return auth.token;
}
function expectAdminHealthy(token: string) {
  expect(authenticateUser("admin@satukelas.com", adminPassword).ok).toBe(true);
  expect(verifySessionToken(token)?.userId).toBe("usr_admin_01");
  const users = getRegisteredUsers();
  expect(new Set(users.map(u => u.email)).size).toBe(users.length);
}

describe("Cross-registry member identity safety", () => {
  it("allows retaining the current member email after normalization", () => {
    const token = adminToken();
    const member = getMarketingMembers().find(member => member.id === "usr_mkt_01")!;
    expect(updateMarketingMember(member.id, { email: `  ${member.email.toUpperCase()}  ` }).email).toBe(member.email);
    expectAdminHealthy(token);
  });
  it("accepts a unique email and keeps the registry usable", () => {
    const token = adminToken();
    const created = createMarketingMember({ name: "New Member", email: "  NEW@EXAMPLE.TEST  ", password: newPassword });
    expect(created.email).toBe("new@example.test");
    expect(authenticateUser(created.email, newPassword).ok).toBe(true);
    expect(updateMarketingMember(created.id, { email: "  UPDATED@EXAMPLE.TEST  " }).email).toBe("updated@example.test");
    expect(authenticateUser("updated@example.test", newPassword).ok).toBe(true);
    expectAdminHealthy(token);
  });
  it("rejects collisions with inactive local members", () => {
    const token = adminToken();
    const inactive = createMarketingMember({ name: "Inactive", email: "disabled-local@example.test", password: newPassword, isActive: false });
    const before = JSON.stringify(getMarketingMembers());
    expect(() => createMarketingMember({ name: "Duplicate", email: inactive.email, password: newPassword })).toThrow("Email sudah terdaftar");
    expect(() => updateMarketingMember("usr_mkt_01", { email: inactive.email })).toThrow("Email sudah terdaftar");
    expect(JSON.stringify(getMarketingMembers()) === before).toBe(true);
    expectAdminHealthy(token);
  });
  it("checks configured active and inactive accounts with demo auth disabled", () => {
    vi.stubEnv("MARKETING_ENABLE_DEMO_AUTH", "false");
    vi.stubEnv("MARKETING_USERS_JSON", JSON.stringify([
      { id: "configured_mkt", name: "Configured", email: "configured@example.test", passwordHash: hashPassword(newPassword), isActive: true },
      { id: "inactive_mkt", name: "Inactive", email: "inactive@example.test", passwordHash: hashPassword(newPassword), isActive: false },
    ]));
    const token = adminToken();
    const before = JSON.stringify(getMarketingMembers());
    for (const email of ["configured@example.test", "inactive@example.test"]) {
      expect(() => createMarketingMember({ name: "Duplicate", email, password: newPassword })).toThrow("Email sudah terdaftar");
      expect(() => updateMarketingMember("usr_mkt_01", { name: "Must not persist", email })).toThrow("Email sudah terdaftar");
    }
    expect(JSON.stringify(getMarketingMembers()) === before).toBe(true);
    expectAdminHealthy(token);
  });
  it("fails closed before mutation when the configured registry is invalid", () => {
    const before = JSON.stringify(getMarketingMembers());
    vi.stubEnv("MARKETING_USERS_JSON", "not-json");
    expect(() => createMarketingMember({ name: "Rejected", email: "unique@example.test", password: newPassword })).toThrow("Registry autentikasi tidak valid");
    expect(() => updateMarketingMember("usr_mkt_01", { name: "Must not persist", email: "unique@example.test" })).toThrow("Registry autentikasi tidak valid");
    expect(JSON.stringify(getMarketingMembers()) === before).toBe(true);
    expect(getRegisteredUsers()).toEqual([]);
  });
  it.each(["admin@satukelas.com", "manager@satukelas.com", "dzaky@satukelas.com", "configured@example.test", "inactive@example.test"])("rejects PATCH collision with %s atomically", (email) => {
    vi.stubEnv("MARKETING_USERS_JSON", JSON.stringify([
      { id: "configured_mkt", name: "Configured", email: "configured@example.test", passwordHash: hashPassword(newPassword), isActive: true },
      { id: "inactive_mkt", name: "Inactive", email: "inactive@example.test", passwordHash: hashPassword(newPassword), isActive: false },
    ]));
    const token = adminToken();
    const before = JSON.stringify(getMarketingMembers());
    expect(() => updateMarketingMember("usr_mkt_01", { name: "Must not persist", email: `  ${email.toUpperCase()}  `, isActive: false })).toThrow("Email sudah terdaftar");
    expect(JSON.stringify(getMarketingMembers()) === before).toBe(true);
    expectAdminHealthy(token);
  });
  it("rejects an invalid avatar without partially changing the name or email", () => {
    const token = adminToken();
    const before = JSON.stringify(getMarketingMembers());
    expect(() => updateMarketingMember("usr_mkt_01", { name: "Must not persist", email: "valid-new@example.test", avatarUrl: "data:text/html;base64,PHNjcmlwdD4=" })).toThrow("Format gambar profil");
    expect(JSON.stringify(getMarketingMembers()) === before).toBe(true);
    expectAdminHealthy(token);
  });
  it.each(["manager@satukelas.com", "configured@example.test", "inactive@example.test"])("rejects create collision with %s without damaging Admin auth", (email) => {
    vi.stubEnv("MARKETING_USERS_JSON", JSON.stringify([
      { id: "configured_mkt", name: "Configured", email: "configured@example.test", passwordHash: hashPassword(newPassword), isActive: true },
      { id: "inactive_mkt", name: "Inactive", email: "inactive@example.test", passwordHash: hashPassword(newPassword), isActive: false },
    ]));
    const token = adminToken();
    const before = JSON.stringify(getMarketingMembers());
    expect(() => createMarketingMember({ name: "Conflicting", email: `  ${email.toUpperCase()}  `, password: newPassword })).toThrow("Email sudah terdaftar");
    expect(JSON.stringify(getMarketingMembers()) === before).toBe(true);
    expectAdminHealthy(token);
  });
});
