import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeCrmStore } from "./crm-store";
import { authenticateUser, getRegisteredUsers, verifySessionToken } from "./auth";
import { createMarketingMember, getMarketingMemberById, getMarketingMembers, resetMarketingMembers, resetMemberPassword, updateMarketingMember } from "./member-store";

beforeEach(() => {
  vi.stubEnv("MARKETING_ENABLE_DEMO_AUTH", "true");
  vi.stubEnv("MARKETING_USERS_JSON", "[]");
  resetMarketingMembers();
  vi.stubEnv("MARKETING_ENABLE_SYNTHETIC_CRM", "true");
  writeCrmStore({ opportunities: [], activities: [] });
});
afterEach(() => vi.unstubAllEnvs());

function expectNoPlaintext(value: unknown, password: string) {
  const encoded = JSON.stringify(value);
  expect(encoded.includes(password)).toBe(false);
  expect(encoded.includes('"rawPassword"')).toBe(false);
  expect(encoded.includes('"password":')).toBe(false);
}

describe("member security hardening", () => {
  it.each(["status", "email"])("never revives an old session after a %s round trip", (field) => {
    const password = randomBytes(24).toString("hex");
    const member = createMarketingMember({ name: "Round Trip", email: "roundtrip@example.test", password });
    const auth = authenticateUser(member.email, password);
    if (!auth.ok) throw new Error("Authentication fixture failed");
    const firstChange = field === "status" ? { isActive: false } : { email: "changed@example.test" };
    const restore = field === "status" ? { isActive: true } : { email: member.email };
    updateMarketingMember(member.id, firstChange);
    expect(verifySessionToken(auth.token) === null).toBe(true);
    updateMarketingMember(member.id, restore);
    expect(verifySessionToken(auth.token) === null).toBe(true);
    const fresh = authenticateUser(member.email, password);
    expect(fresh.ok).toBe(true);
    if (fresh.ok) expect(verifySessionToken(fresh.token)?.userId).toBe(member.id);
  });
  it("revokes every existing session after a password reset without retaining plaintext", () => {
    const password = randomBytes(24).toString("hex");
    const member = createMarketingMember({ name: "Reset Member", email: "reset@example.test", password });
    const first = authenticateUser(member.email, password);
    const second = authenticateUser(member.email, password);
    if (!first.ok || !second.ok) throw new Error("Authentication fixture failed");
    expect(verifySessionToken(first.token) !== null).toBe(true);
    const replacement = randomBytes(24).toString("hex");
    resetMemberPassword(member.id, replacement);
    expectNoPlaintext(globalThis.__SATUKELAS_MARKETING_MEMBERS__, replacement);
    expect(verifySessionToken(first.token) === null).toBe(true);
    expect(verifySessionToken(second.token) === null).toBe(true);
    expect(authenticateUser(member.email, password).ok).toBe(false);
    const fresh = authenticateUser(member.email, replacement);
    expect(fresh.ok).toBe(true);
    if (fresh.ok) expect(verifySessionToken(fresh.token)?.userId).toBe(member.id);
  });
  it("never retains a created member password in the internal store or auth registry", () => {
    const password = randomBytes(24).toString("hex");
    const member = createMarketingMember({ name: "Secure Member", email: "secure@example.test", password });
    expectNoPlaintext(member, password);
    expectNoPlaintext(getMarketingMemberById(member.id), password);
    expectNoPlaintext(getMarketingMembers(), password);
    expectNoPlaintext(globalThis.__SATUKELAS_MARKETING_MEMBERS__, password);
    expectNoPlaintext(getRegisteredUsers().filter(user => user.role === "MARKETER"), password);
    expect(authenticateUser(member.email, password).ok).toBe(true);
  });
});
