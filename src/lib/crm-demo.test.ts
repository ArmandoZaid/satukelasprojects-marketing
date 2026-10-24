import { describe, expect, it } from "vitest";
import { createDemo, selectOpportunities, summarize, followUpState, addProspect, recordResult, moveStage } from "./crm-demo";

describe("local CRM mutations", () => {
  it("rejects invalid intake and prevents duplicate school-service-period combinations", () => {
    const s = createDemo();
    expect(() => addProspect(s, { school: " ", owner: "Yunus", region: "Surabaya", service: "Photoshoot", period: "2026/2027", estimate: "" })).toThrow();
    const input = { school: "SMA Contoh Baru", owner: "Yunus", region: "Surabaya", service: "Photoshoot", period: "2026/2027", estimate: "5000000" };
    const result = addProspect(s, input);
    expect(result.opportunities).toHaveLength(30);
    expect(s.opportunities).toHaveLength(29);
    expect(() => addProspect(result, input)).toThrow(/sudah ada/);
    expect(() => addProspect(s, { ...input, estimate: "-1" })).toThrow();
    const normalized = addProspect(s, { ...input, school: "SMA Fiktif" });
    expect(() => addProspect(normalized, { ...input, school: "SMA Fiktif" })).toThrow(/sudah ada/);
  });
  it("records a result and next action atomically without changing invalid state", () => {
    const s = createDemo();
    expect(() => recordResult(s, "demo-1", { summary: "", kind: "Telepon", date: "2026-10-16", nextAction: "", due: "" })).toThrow();
    const next = recordResult(s, "demo-1", { summary: "Contoh hasil", kind: "Telepon", date: "2026-10-16", nextAction: "Pertemuan contoh", due: "2026-10-20" });
    expect(next.activities).toHaveLength(4);
    expect(next.opportunities[0].due).toBe("2026-10-20");
    expect(s.opportunities[0].due).toBe("2026-10-12");
    expect(() => recordResult(s, "demo-1", { summary: "Hasil", kind: "Telepon", date: "2026-10-17", nextAction: "", due: "" })).toThrow(/masa depan/);
  });
  it("guards skipped stages, final values, legacy and terminal transitions", () => {
    const s = createDemo();
    expect(() => moveStage(s, "demo-1", { stage: "Negotiation", reason: "", finalValue: "", closedOn: "", reference: "" })).toThrow(/alasan/i);
    expect(() => moveStage(s, "demo-1", { stage: "Won", reason: "Sepakat", finalValue: "", closedOn: "2026-10-16", reference: "Contoh" })).toThrow();
    const next = moveStage(s, "demo-1", { stage: "Won", reason: "Sepakat", finalValue: "10000000", closedOn: "2026-10-16", reference: "Referensi contoh" });
    expect(next.opportunities[0].status).toBe("WON");
    expect(next.opportunities[0].due).toBe("");
    expect(summarize(next.opportunities).won).toBe(4);
    expect(() => moveStage(next, "demo-1", { stage: "Lost", reason: "", finalValue: "", closedOn: "", reference: "" })).toThrow(/terminal/i);
  });
});



describe("preview validation boundaries", () => {
  const intake = { school: "SMA Contoh Validasi", owner: "Yunus", region: "Surabaya", service: "Photoshoot", period: "2026/2027", estimate: "" };
  const result = { summary: "Hasil simulasi", kind: "Telepon", date: "2026-10-16", nextAction: "", due: "" };
  const transition = { stage: "Negotiation" as const, reason: "Alasan simulasi", finalValue: "", closedOn: "", reference: "" };
  it("keeps unknown estimates null and accepts only bounded positive integers", () => {
    const s = createDemo();
    expect(addProspect(s, intake).opportunities.at(-1)?.estimate).toBeNull();
    for (const estimate of ["0", "1.2", "1e7", "1000000000001", "NaN"]) expect(() => addProspect(s, { ...intake, estimate })).toThrow();
    expect(addProspect(s, { ...intake, estimate: "1000000000000" }).opportunities.at(-1)?.estimate).toBe(1000000000000);
  });
  it("normalizes whitespace and case for duplicate detection", () => {
    const s = addProspect(createDemo(), { ...intake, school: " SMA  Fiktif " });
    expect(() => addProspect(s, { ...intake, school: "sma fiktif" })).toThrow(/sudah ada/);
  });
  it("rejects invalid enum values without mutating the original", () => {
    const s = createDemo();
    for (const input of [{ owner: "Unknown" }, { service: "Unknown" }, { region: "Unknown" }, { period: "Unknown" }]) expect(() => addProspect(s, { ...intake, ...input })).toThrow();
    expect(s.opportunities).toHaveLength(29);
  });
  it("rejects invalid dates and half-filled next actions atomically", () => {
    const s = createDemo(); const original = structuredClone(s);
    for (const input of [{ date: "2026-02-30" }, { due: "2026-10-20" }, { nextAction: "Hubungi" }, { kind: "Unknown" }]) expect(() => recordResult(s, "demo-1", { ...result, ...input })).toThrow();
    expect(s).toEqual(original);
    expect(recordResult(s, "demo-1", result).opportunities[0].due).toBe("");
  });
  it("requires reasons of 3–500 characters for skips, backward moves and Lost", () => {
    const s = createDemo();
    for (const reason of ["", "ab", "a".repeat(501)]) expect(() => moveStage(s, "demo-1", { ...transition, reason })).toThrow(/alasan/i);
    expect(moveStage(s, "demo-1", { ...transition, stage: "Meeting Scheduled", reason: "" }).opportunities[0].stage).toBe("Meeting Scheduled");
  });
  it("guards Won references and future closing dates, Lost and terminal writes", () => {
    const s = createDemo();
    const won = { ...transition, stage: "Won" as const, finalValue: "12000000", closedOn: "2026-10-16", reference: "Contoh kesepakatan" };
    expect(() => moveStage(s, "demo-1", { ...won, reference: "" })).toThrow();
    expect(() => moveStage(s, "demo-1", { ...won, closedOn: "2026-10-17" })).toThrow();
    expect(() => moveStage(s, "demo-1", { ...won, closedOn: "2026-02-30" })).toThrow();
    const lost = moveStage(s, "demo-1", { ...won, stage: "Lost", reason: "Belum sesuai contoh" });
    expect(lost.opportunities[0].nextAction).toBe("");
    expect(summarize(lost.opportunities).active).toBe(23);
    expect(summarize(lost.opportunities).lost).toBe(2);
    expect(() => recordResult(lost, "demo-1", result)).toThrow(/aktif/);
    expect(() => moveStage(s, "demo-28", transition)).toThrow(/terminal/);
  });
});

describe("synthetic CRM snapshot", () => {
  it("derives the preview metrics from synthetic opportunities, not separate constants", () => {
    const state = createDemo();
    const summary = summarize(state.opportunities);
    expect(summary.active).toBe(24);
    expect(summary.pipeline).toBe(184800000);
    expect(summary.coverage).toBe(18);
    expect(summary.won).toBe(3);
    expect(summary.legacy).toBe(1);
    const active = state.opportunities.filter(o => o.status === "OPEN");
    expect(active.filter(o => followUpState(o) === "overdue")).toHaveLength(4);
    expect(active.filter(o => followUpState(o) === "today")).toHaveLength(3);
    expect(active.filter(o => followUpState(o) === "unscheduled")).toHaveLength(6);
    expect(state.opportunities.every(o => o.school.includes("Contoh"))).toBe(true);
    expect(selectOpportunities(state.opportunities, { owner: "Yunus", q: "cakrawala" })).toHaveLength(1);
    expect(selectOpportunities(state.opportunities, { owner: "Dzaky", q: "cakrawala" })).toHaveLength(0);
  });
});
