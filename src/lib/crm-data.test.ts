import { describe, it, expect } from "vitest";
import { createDemo, summarize } from "./crm-demo";
import { scopeCrmData, createOwnedProspect, updateOwnedOpportunity, getOwnedOpportunity } from "./crm-data";
import type { SessionPayload } from "./auth";
const marketer: SessionPayload = { userId: "usr_mkt_01", name: "Yunus", email: "fixture@example.invalid", role: "MARKETER", iat: 1, exp: 9999999999, sessionVersion: "test-session-version" };
const admin = { ...marketer, userId: "usr_admin_01", role: "ADMIN" as const };
function fixture(): ReturnType<typeof createDemo> {
 const s = createDemo();
 return { opportunities: s.opportunities.map(o => ({ ...o, ownerId: o.owner === "Yunus" ? "usr_mkt_01" : "usr_mkt_02" })), activities: s.activities.map(a => ({ ...a, ownerId: a.owner === "Yunus" ? "usr_mkt_01" : "usr_mkt_02" })) };
}
describe("Server CRM ownership", () => {
 it("scopes opportunities, activities and aggregates by stable account ID, never display name", () => {
  const s = fixture();
  s.opportunities[1].owner = "Yunus";
  const scoped = scopeCrmData(s, marketer);
  expect(scoped.opportunities).toHaveLength(8);
  expect(scoped.opportunities.every(o => o.ownerId === marketer.userId)).toBe(true);
  expect(scoped.activities.map(a => a.id)).toEqual(["activity-1"]);
  expect(summarize(scoped.opportunities).active).toBe(6);
  expect(scopeCrmData(s, admin).opportunities).toHaveLength(29);
  expect(scopeCrmData(s, { ...marketer, userId: "unassigned" })).toEqual({ opportunities: [], activities: [] });
 });
 it("rejects foreign IDs for detail/result/stage and assigns create to session, ignoring forged owner", () => {
  const s = fixture();
  expect(() => getOwnedOpportunity(s, marketer, "demo-2")).toThrow("Peluang tidak ditemukan");
  for (const action of ["result", "stage"] as const) expect(() => updateOwnedOpportunity(s, marketer, "demo-2", action, {})).toThrow("Peluang tidak ditemukan");
  const next = createOwnedProspect(s, marketer, { school: "Sekolah Uji Pemilik", owner: "Dzaky", ownerId: "usr_mkt_02", region: "Surabaya", service: "Photoshoot", period: "2026/2027", estimate: "" });
  expect(next.opportunities.at(-1)).toMatchObject({ ownerId: marketer.userId, owner: marketer.name });
  expect(next.opportunities).toHaveLength(30);
  expect(scopeCrmData(next, { ...marketer, userId: "usr_mkt_02" }).opportunities).toHaveLength(21);
 });
 it("keeps valid result/stage changes inside scope and rejects malformed values and roles", () => {
  let s = fixture();
  s = updateOwnedOpportunity(s, marketer, "demo-1", "result", { summary: "Hasil pribadi", kind: "Telepon", date: "2026-10-16", nextAction: "Telepon ulang", due: "2026-10-20" });
  expect(s.activities[0].ownerId).toBe(marketer.userId);
  expect(scopeCrmData(s, { ...marketer, userId: "usr_mkt_02" }).activities.some(a => a.summary === "Hasil pribadi")).toBe(false);
  s = updateOwnedOpportunity(s, marketer, "demo-1", "stage", { stage: "Meeting Scheduled" });
  expect(getOwnedOpportunity(s, marketer, "demo-1").stage).toBe("Meeting Scheduled");
  expect(() => updateOwnedOpportunity(s, marketer, "demo-1", "result", { summary: {} })).toThrow("Isian tidak valid");
  expect(() => createOwnedProspect(s, { ...marketer, role: "MANAGER" }, {})).toThrow("Akses ditolak");
  expect(scopeCrmData(s, { ...marketer, role: "MANAGER" }).opportunities).toEqual([]);
  expect(() => getOwnedOpportunity(s, marketer, "missing")).toThrow("Peluang tidak ditemukan");
 });
});
