import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE as resetCrm } from "../app/api/crm/route";
import { getRegisteredUsers, signSessionToken } from "./auth";
import { createOwnedProspect } from "./crm-data";
import { readCrmStore, resetCrmStore, writeCrmStore } from "./crm-store";
import { resetMarketingMembers } from "./member-store";

const cookieState = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => cookieState.value ? { value: cookieState.value } : undefined }),
}));
function sessionFor(id: string) {
  const user = getRegisteredUsers().find(user => user.id === id)!;
  return { userId: user.id, email: user.email, name: user.name, role: user.role };
}
function loginAs(id: string) { cookieState.value = signSessionToken(sessionFor(id)); }
function resetRequest(headers: Record<string, string> = { Origin: "http://127.0.0.1:3100" }) {
  return new Request("http://127.0.0.1:3100/api/crm", { method: "DELETE", headers });
}
function addOtherOwnerData() {
  const session = { ...sessionFor("usr_mkt_02"), iat: 1, exp: 9999999999, sessionVersion: "test-session-version" };
  writeCrmStore(createOwnedProspect(readCrmStore(), session, {
    school: "Sekolah Penjaga Reset", region: "Surabaya", service: "Photoshoot", period: "2026/2027", estimate: "",
  }));
}

describe("CRM global reset security", () => {
  beforeEach(() => {
    vi.stubEnv("MARKETING_ENABLE_DEMO_AUTH", "true");
    vi.stubEnv("MARKETING_ENABLE_SYNTHETIC_CRM", "true");
    vi.stubEnv("MARKETING_USERS_JSON", "[]");
    vi.stubEnv("ADMIN_EMAIL", "admin@satukelas.com");
    vi.stubEnv("ADMIN_PASSWORD", randomBytes(24).toString("hex"));
    cookieState.value = undefined;
    resetMarketingMembers();
    resetCrmStore();
    addOtherOwnerData();
  });
  afterEach(() => { vi.unstubAllEnvs(); cookieState.value = undefined; });

  it("denies anonymous reset without changing state", async () => {
    const before = structuredClone(readCrmStore());
    expect((await resetCrm(resetRequest())).status).toBe(401);
    expect(readCrmStore()).toEqual(before);
  });
  it("denies a manager reset without changing state", async () => {
    loginAs("usr_mgr_01");
    const before = structuredClone(readCrmStore());
    expect((await resetCrm(resetRequest())).status).toBe(403);
    expect(readCrmStore()).toEqual(before);
  });
  it.each(["http://127.0.0.1:3100", "http://localhost:3100"])("allows Admin synthetic reset from %s", async (Origin) => {
    loginAs("usr_admin_01");
    const response = await resetCrm(resetRequest({ Origin }));
    expect(response.status).toBe(200);
    expect(readCrmStore().opportunities.some(o => o.school === "Sekolah Penjaga Reset")).toBe(false);
    expect(readCrmStore().opportunities).toHaveLength(29);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
  it("guards direct store reset when synthetic mode is absent", () => {
    const before = structuredClone(readCrmStore());
    vi.stubEnv("MARKETING_ENABLE_SYNTHETIC_CRM", undefined);
    expect(() => resetCrmStore()).toThrow("Reset CRM sintetis dinonaktifkan");
    vi.stubEnv("MARKETING_ENABLE_SYNTHETIC_CRM", "true");
    expect(readCrmStore()).toEqual(before);
  });
  it.each([
    {},
    { Origin: "null" },
    { Origin: "https://evil.invalid" },
    { Origin: "http://evil.invalid", "X-Forwarded-Host": "evil.invalid" },
    { Origin: "http://evil.invalid", Host: "evil.invalid" },
    { Origin: "http://127.0.0.1:3100/forged-path" },
    { Origin: "http://user@127.0.0.1:3100" },
    { Origin: "http://localhost:3101" },
    { Origin: "https://127.0.0.1:3100", Host: "127.0.0.1:3100" },
    { Origin: "http://127.0.0.1:3100", "Sec-Fetch-Site": "cross-site" },
    { "Sec-Fetch-Site": "cross-site" },
  ])("rejects an Admin reset with disallowed origin headers %j", async (headers) => {
    loginAs("usr_admin_01");
    const before = structuredClone(readCrmStore());
    const response = await resetCrm(resetRequest(headers as Record<string, string>));
    expect(response.status).toBe(403);
    expect(readCrmStore()).toEqual(before);
  });

  it("rejects an Admin reset when synthetic mode is off without altering data", async () => {
    loginAs("usr_admin_01");
    const before = structuredClone(readCrmStore());
    vi.stubEnv("MARKETING_ENABLE_SYNTHETIC_CRM", "false");
    const response = await resetCrm(resetRequest());
    expect(response.status).toBe(503);
    vi.stubEnv("MARKETING_ENABLE_SYNTHETIC_CRM", "true");
    expect(readCrmStore()).toEqual(before);
  });

  it("rejects a marketer reset and preserves another marketer's added data", async () => {
    loginAs("usr_mkt_01");
    const before = structuredClone(readCrmStore());
    const response = await resetCrm(resetRequest());
    expect(response.status).toBe(403);
    expect(readCrmStore()).toEqual(before);
  });
});
