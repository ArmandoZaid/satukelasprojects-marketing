import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticateUser, verifySessionToken } from "./auth";
import { CrmDataError } from "./crm-data";
import { createDemo } from "./crm-demo";
import { readCrmStore, writeCrmStore } from "./crm-store";
import { createMarketingMember, deleteMarketingMember, getMarketingMembers, resetMarketingMembers, updateMarketingMember } from "./member-store";

beforeEach(() => {
  vi.stubEnv("MARKETING_ENABLE_DEMO_AUTH", "true");
  vi.stubEnv("MARKETING_ENABLE_SYNTHETIC_CRM", "true");
  vi.stubEnv("MARKETING_USERS_JSON", "[]");
  resetMarketingMembers();
  writeCrmStore({ opportunities: [], activities: [] });
});
afterEach(() => vi.unstubAllEnvs());

function fixture() {
  const password = randomBytes(24).toString("hex");
  const member = createMarketingMember({ name: "Integrity Member", email: "integrity@example.test", password });
  const auth = authenticateUser(member.email, password);
  if (!auth.ok) throw new Error("Member fixture authentication failed");
  return { member, password, token: auth.token };
}

function snapshot() {
  return JSON.stringify({ members: getMarketingMembers(), crm: readCrmStore() });
}

function expectConflict(action: () => unknown) {
  let error: unknown;
  try { action(); } catch (caught) { error = caught; }
  expect(error).toBeInstanceOf(CrmDataError);
  expect((error as CrmDataError)?.status).toBe(409);
  expect((error as Error)?.message).toContain("prospek atau aktivitas");
}

describe("member relationship integrity", () => {
  it.each(["delete", "disable"])("fails closed on %s when CRM is unavailable", (action) => {
    const { member, token } = fixture();
    const before = snapshot();
    vi.stubEnv("MARKETING_ENABLE_SYNTHETIC_CRM", "false");
    let error: unknown;
    try {
      if (action === "delete") deleteMarketingMember(member.id);
      else updateMarketingMember(member.id, { name: "Must not persist", isActive: false });
    }
    catch (caught) { error = caught; }
    expect(error).toBeInstanceOf(CrmDataError);
    expect((error as CrmDataError)?.status).toBe(503);
    vi.stubEnv("MARKETING_ENABLE_SYNTHETIC_CRM", "true");
    expect(snapshot() === before).toBe(true);
    expect(verifySessionToken(token)?.userId).toBe(member.id);
  });
  it("allows deleting a relation-free account and revokes all prior sessions", () => {
    const { member, password, token } = fixture();
    const second = authenticateUser(member.email, password);
    if (!second.ok) throw new Error("Second session fixture failed");
    expect(deleteMarketingMember(member.id).success).toBe(true);
    expect(verifySessionToken(token) === null).toBe(true);
    expect(verifySessionToken(second.token) === null).toBe(true);
    expect(authenticateUser(member.email, password).ok).toBe(false);
    expect(readCrmStore()).toEqual({ opportunities: [], activities: [] });
  });
  it("allows a relation-free status round trip without reviving the old session", () => {
    const { member, token, password } = fixture();
    updateMarketingMember(member.id, { isActive: false });
    expect(verifySessionToken(token) === null).toBe(true);
    expect(authenticateUser(member.email, password).ok).toBe(false);
    updateMarketingMember(member.id, { isActive: true });
    expect(verifySessionToken(token) === null).toBe(true);
    expect(authenticateUser(member.email, password).ok).toBe(true);
  });
  it("does not confuse another account with an identical display name", () => {
    const { member } = fixture();
    writeCrmStore({ opportunities: [{ ...createDemo().opportunities[0], ownerId: "different-id", owner: member.name }], activities: [] });
    expect(deleteMarketingMember(member.id).success).toBe(true);
    expect(readCrmStore().opportunities).toHaveLength(1);
  });
  it.each(["delete", "disable"])("rejects %s for an activity-only owner without mutation", (action) => {
    const { member, token } = fixture();
    const activity = { ...createDemo().activities[0], ownerId: member.id, owner: "Previous label", opportunityId: "missing-parent" };
    writeCrmStore({ opportunities: [], activities: [activity] });
    const before = snapshot();
    expectConflict(() => action === "delete" ? deleteMarketingMember(member.id) : updateMarketingMember(member.id, { name: "Must not persist", isActive: false }));
    expect(snapshot() === before).toBe(true);
    expect(verifySessionToken(token)?.userId).toBe(member.id);
  });
  it("rejects deactivation of a terminal opportunity owner atomically", () => {
    const { member, token } = fixture();
    const opportunity = { ...createDemo().opportunities[0], ownerId: member.id, owner: "Old label", status: "WON" as const, stage: "Won" as const };
    writeCrmStore({ opportunities: [opportunity], activities: [] });
    const before = snapshot();
    expectConflict(() => updateMarketingMember(member.id, { name: "Must not persist", email: "changed@example.test", isActive: false }));
    expect(snapshot() === before).toBe(true);
    expect(verifySessionToken(token)?.userId).toBe(member.id);
  });
  it("rejects deletion of an opportunity owner without any store or session mutation", () => {
    const { member, token } = fixture();
    const opportunity = { ...createDemo().opportunities[0], ownerId: member.id, owner: "Previous display name" };
    writeCrmStore({ opportunities: [opportunity], activities: [] });
    const before = snapshot();
    expectConflict(() => deleteMarketingMember(member.id));
    expect(snapshot() === before).toBe(true);
    expect(verifySessionToken(token)?.userId).toBe(member.id);
  });
});
