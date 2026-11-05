import { afterEach, describe, expect, it, vi } from "vitest";
import { createRuntimeProspect, getRuntimeOpportunity, readRuntimeCrm, resetRuntimeCrm, updateRuntimeOpportunity } from "./runtime-crm";
import type { SessionPayload } from "./auth";

const admin: SessionPayload = { userId: "usr_admin_01", name: "Administrator Satukelas", email: "admin@satukelas.com", role: "ADMIN", iat: 1, exp: 9999999999, sessionVersion: "v1" };
afterEach(() => vi.unstubAllEnvs());

describe("runtime CRM facade", () => {
 it("uses explicit synthetic store when database is not configured", async () => {
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("PGHOST", "");
  vi.stubEnv("MARKETING_ENABLE_SYNTHETIC_CRM", "true");
  const initial = await readRuntimeCrm(admin);
  expect(initial.opportunities.length).toBeGreaterThan(0);
  const created = await createRuntimeProspect(admin, { school: "SMA Runtime Demo", region: "Surabaya", service: "Photoshoot", period: "2026/2027", estimate: "12000000" });
  const item = created.opportunities.at(-1)!;
  expect(item.school).toContain("(Contoh)");
  expect((await getRuntimeOpportunity(admin, item.id)).id).toBe(item.id);
  const updated = await updateRuntimeOpportunity(admin, item.id, "result", { summary: "Tercatat", kind: "Telepon", date: "2026-10-16", nextAction: "", due: "" });
  expect(updated.activities[0].summary).toBe("Tercatat");
  await resetRuntimeCrm();
 });
 it("rejects reset and fails closed when database is configured but unreachable", async () => {
  vi.stubEnv("DATABASE_URL", "postgresql://marketing:secret@127.0.0.1:1/satukelas_marketing");
  vi.stubEnv("MARKETING_ENABLE_SYNTHETIC_CRM", "true");
  await expect(resetRuntimeCrm()).rejects.toThrow("Reset seluruh CRM dinonaktifkan pada database operasional.");
  await expect(readRuntimeCrm(admin)).rejects.toThrow("Layanan database tidak tersedia");
 });
});
