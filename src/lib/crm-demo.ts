export const DEMO_TODAY = "2026-10-16";
export const STAGES = ["Cold Lead", "Contacted", "Meeting Scheduled", "Presentation Done", "Proposal Sent", "Negotiation", "Won", "Lost"] as const;
export const OWNERS = ["Yunus", "Dzaky", "Armando", "Yasser"] as const;
export const SERVICES = ["Yearbook Lengkap", "Photoshoot", "Design + Cetak"] as const;
export type Stage = typeof STAGES[number];
export type FollowUp = "overdue" | "today" | "unscheduled" | "upcoming";
export type Opportunity = {
  id: string; school: string; owner: string; ownerId?: string; region: string; service: string; period: string;
  stage: Stage; status: "OPEN" | "WON" | "LOST"; estimate: number | null;
  nextAction: string; due: string; legacy?: boolean; finalValue?: number; created: number;
};
export type Activity = { id: string; opportunityId: string; title: string; summary: string; date: string; time: string; owner: string; ownerId?: string };
export type DemoState = { opportunities: Opportunity[]; activities: Activity[] };
export type Filters = { q?: string; owner?: string; region?: string; service?: string; businessPeriod?: string; stage?: string; followUp?: string };
export const currency = (value: number) => `Rp${new Intl.NumberFormat("id-ID").format(value)}`;
export function followUpState(o: Opportunity): FollowUp {
  if (!o.due) return "unscheduled";
  return o.due < DEMO_TODAY ? "overdue" : o.due === DEMO_TODAY ? "today" : "upcoming";
}
export function selectOpportunities(items: Opportunity[], f: Filters): Opportunity[] {
  return items.filter(o => (!f.q || `${o.school} ${o.service}`.toLowerCase().includes(f.q.toLowerCase())) &&
    (!f.owner || o.owner === f.owner) && (!f.region || o.region === f.region) && (!f.service || o.service === f.service) &&
    (!f.businessPeriod || o.period === f.businessPeriod) && (!f.stage || o.stage === f.stage) &&
    (!f.followUp || (o.status === "OPEN" && followUpState(o) === f.followUp)));
}
export function summarize(items: Opportunity[]) {
  const active = items.filter(o => o.status === "OPEN");
  return { active: active.length, pipeline: active.reduce((sum, o) => sum + (o.estimate ?? 0), 0), coverage: active.filter(o => o.estimate !== null).length,
    won: items.filter(o => o.status === "WON" && !o.legacy).length, legacy: items.filter(o => o.status === "WON" && o.legacy).length,
    lost: items.filter(o => o.status === "LOST" && !o.legacy).length,
    finalValue: items.filter(o => o.status === "WON" && !o.legacy).reduce((sum, o) => sum + (o.finalValue ?? 0), 0) };
}
function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
function money(value: string, required = false) {
  if (!value.trim() && !required) return null;
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0 || Number(value) > 1000000000000) throw new Error("Nilai harus angka bulat positif, maksimal Rp1 triliun.");
  return Number(value);
}
export function addProspect(s: DemoState, input: { school: string; owner: string; region: string; service: string; period: string; estimate: string }, allowedOwners: readonly string[] = OWNERS): DemoState {
  const school = input.school.trim().replace(/\s+/g, " ");
  const labelledSchool = /contoh/i.test(school) ? school : `${school} (Contoh)`;
  if (school.length < 3 || school.length > 120) throw new Error("Isi nama sekolah contoh, 3–120 karakter.");
  if (!allowedOwners.some(o => o === input.owner) || !SERVICES.some(o => o === input.service) || !["Surabaya", "Sidoarjo"].includes(input.region) || !["2026/2027", "2027/2028"].includes(input.period)) throw new Error("Lengkapi PIC, wilayah, layanan, dan periode.");
  if (s.opportunities.some(o => o.school.toLowerCase() === labelledSchool.toLowerCase() && o.service === input.service && o.period === input.period)) throw new Error("Peluang sekolah, layanan, dan periode ini sudah ada.");
  const estimate = money(input.estimate);
  const item: Opportunity = { ...input, school: labelledSchool, estimate, id: `demo-new-${s.opportunities.length + 1}`, stage: "Cold Lead", status: "OPEN", created: s.opportunities.length, nextAction: "", due: "" };
  return { ...s, opportunities: [...s.opportunities, item] };
}
export function recordResult(s: DemoState, id: string, input: { summary: string; kind: string; date: string; nextAction: string; due: string }): DemoState {
  const o = s.opportunities.find(o => o.id === id);
  if (!o || o.status !== "OPEN") throw new Error("Hasil hanya dapat dicatat pada peluang aktif.");
  if (!input.summary.trim() || input.summary.length > 2000) throw new Error("Ringkasan hasil wajib diisi, maksimal 2.000 karakter.");
  if (!["Telepon", "Pesan", "Pertemuan", "Presentasi", "Proposal"].includes(input.kind)) throw new Error("Pilih jenis aktivitas.");
  if (!validDate(input.date) || input.date > DEMO_TODAY) throw new Error("Tanggal aktivitas tidak boleh di masa depan dari tanggal acuan demo.");
  if ((input.nextAction.trim() && !validDate(input.due)) || (!input.nextAction.trim() && input.due)) throw new Error("Judul dan tanggal tindak lanjut harus diisi bersama.");
  return { opportunities: s.opportunities.map(item => item.id === id ? { ...item, nextAction: input.nextAction.trim(), due: input.due } : item),
    activities: [{ id: `activity-${s.activities.length + 1}`, opportunityId: id, title: `${input.kind} dicatat`, summary: input.summary.trim(), date: input.date, time: "11.00", owner: o.owner }, ...s.activities] };
}
export function moveStage(s: DemoState, id: string, input: { stage: Stage; reason: string; finalValue: string; closedOn: string; reference: string }): DemoState {
  const o = s.opportunities.find(o => o.id === id);
  if (!o || o.status !== "OPEN") throw new Error("Peluang terminal tidak dapat dipindah langsung pada preview ini.");
  if (!STAGES.includes(input.stage) || input.stage === o.stage) throw new Error("Pilih tahap yang berbeda.");
  const reason = input.reason.trim();
  if ((STAGES.indexOf(input.stage) !== STAGES.indexOf(o.stage) + 1 || input.stage === "Lost") && (reason.length < 3 || reason.length > 500)) throw new Error("Alasan wajib 3–500 karakter untuk melewati/memundurkan tahap atau Lost.");
  const terminal = input.stage === "Won" || input.stage === "Lost";
  if (terminal && (!validDate(input.closedOn) || input.closedOn > DEMO_TODAY)) throw new Error("Isi tanggal closing valid, maksimal tanggal acuan demo.");
  if (input.stage === "Won" && !input.reference.trim()) throw new Error("Isi referensi kesepakatan contoh.");
  if (input.stage === "Lost" && !input.reason.trim()) throw new Error("Alasan Lost wajib diisi.");
  const finalValue = input.stage === "Won" ? money(input.finalValue, true)! : undefined;
  return { opportunities: s.opportunities.map(item => item.id === id ? { ...item, stage: input.stage, status: input.stage === "Won" ? "WON" : input.stage === "Lost" ? "LOST" : "OPEN", finalValue, nextAction: terminal ? "" : item.nextAction, due: terminal ? "" : item.due } : item),
    activities: [{ id: `activity-${s.activities.length + 1}`, opportunityId: id, title: `Tahap: ${o.stage} → ${input.stage}`, summary: [reason, input.closedOn, input.reference].filter(Boolean).join(" · ") || "Tahap diperbarui pada simulasi.", date: DEMO_TODAY, time: "11.00", owner: o.owner }, ...s.activities] };
}
export function createDemo(): DemoState {
  const names = ["Cakrawala", "Mentari", "Karya", "Bina", "Pelita", "Reka", "Karsa", "Angkasa", "Cendekia", "Nusantara", "Pertiwi", "Tunas", "Satria", "Puspa", "Lentera", "Samudra", "Bahari", "Kartika", "Bintang", "Harapan", "Ceria", "Purnama", "Surya", "Embun", "Pena", "Arunika", "Harmoni", "Melati", "Damar"];
  const stages: Stage[] = ["Contacted", "Proposal Sent", "Negotiation", "Meeting Scheduled", "Proposal Sent", "Contacted", "Meeting Scheduled", ...Array<Stage>(8).fill("Cold Lead"), ...Array<Stage>(3).fill("Contacted"), "Meeting Scheduled", "Presentation Done", "Presentation Done", "Proposal Sent", "Proposal Sent", "Negotiation", "Won", "Won", "Won", "Won", "Lost"];
  const opportunities = names.map((name, i): Opportunity => ({
    id: `demo-${i + 1}`, school: `${i % 3 === 1 ? "SMP" : i % 3 === 2 ? "SMK" : "SMA"} Contoh ${name}`,
    owner: OWNERS[i % 4], region: i % 2 ? "Sidoarjo" : "Surabaya", service: SERVICES[i % 3], period: "2026/2027", stage: stages[i],
    status: i < 24 ? "OPEN" : i < 28 ? "WON" : "LOST", estimate: i < 17 ? 10000000 : i === 17 ? 14800000 : null,
    nextAction: i < 4 ? ["Konfirmasi jadwal presentasi", "Follow-up revisi proposal", "Diskusikan penawaran akhir", "Konfirmasi PIC pertemuan"][i] : i < 7 ? "Konfirmasi tindak lanjut sekolah" : i < 13 || i >= 24 ? "" : "Hubungi PIC sekolah",
    due: i < 4 ? `2026-10-${12 + i}` : i < 7 ? DEMO_TODAY : i < 13 || i >= 24 ? "" : `2026-10-${19 + i % 5}`,
    legacy: i === 27, finalValue: i >= 24 && i < 27 ? 12000000 : undefined, created: i,
  }));
  return { opportunities, activities: [
    { id: "activity-1", opportunityId: "demo-5", title: "Proposal dikirim", summary: "Proposal contoh disiapkan untuk review.", date: DEMO_TODAY, time: "10.20", owner: "Yunus" },
    { id: "activity-2", opportunityId: "demo-6", title: "Hasil telepon dicatat", summary: "Simulasi percakapan; menunggu konfirmasi jadwal.", date: DEMO_TODAY, time: "09.45", owner: "Dzaky" },
    { id: "activity-3", opportunityId: "demo-7", title: "Pertemuan dijadwalkan", summary: "Jadwal contoh untuk meninjau alur follow-up.", date: DEMO_TODAY, time: "09.10", owner: "Armando" },
  ] };
}
