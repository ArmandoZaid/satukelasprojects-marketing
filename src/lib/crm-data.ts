import type { SessionPayload } from "./auth";
import { randomUUID } from "node:crypto";
import { addProspect, moveStage, recordResult, type DemoState } from "./crm-demo";
export class CrmDataError extends Error { constructor(message: string, public status = 400) { super(message); } }
function allow(session: SessionPayload) {
  if (!["ADMIN", "MARKETER"].includes(session.role)) throw new CrmDataError("Akses ditolak.", 403);
}
function fields(input: Record<string, unknown>, names: readonly string[]) {
  const clean: Record<string, string> = {};
  for (const name of names) {
    const value = input[name] ?? "";
    if (typeof value !== "string" || value.length > 2000) throw new CrmDataError("Isian tidak valid.");
    clean[name] = value;
  }
  return clean;
}
export function getOwnedOpportunity(state: DemoState, session: SessionPayload, id: string) {
  allow(session);
  const item = state.opportunities.find(o => o.id === id && (session.role === "ADMIN" || o.ownerId === session.userId));
  if (!item) throw new CrmDataError("Peluang tidak ditemukan.", 404);
  return structuredClone(item);
}
export function createOwnedProspect(state: DemoState, session: SessionPayload, input: Record<string, unknown>): DemoState {
  allow(session);
  const clean = fields(input, ["school", "region", "service", "period", "estimate"]);
  const scoped = scopeCrmData(state, session);
  const next = addProspect(scoped, { ...clean, owner: session.name } as Parameters<typeof addProspect>[1], [session.name]);
  const item = { ...next.opportunities.at(-1)!, id: `demo-new-${randomUUID()}`, created: state.opportunities.length, ownerId: session.userId };
  return { ...state, opportunities: [...state.opportunities, item] };
}
export function updateOwnedOpportunity(state: DemoState, session: SessionPayload, id: string, action: "result" | "stage", input: Record<string, unknown>): DemoState {
  const item = getOwnedOpportunity(state, session, id);
  const names = action === "result" ? ["summary", "kind", "date", "nextAction", "due"] : ["stage", "reason", "finalValue", "closedOn", "reference"];
  const clean = fields(input, names);
  const next = action === "result" ? recordResult(state, id, clean as Parameters<typeof recordResult>[2]) : moveStage(state, id, clean as Parameters<typeof moveStage>[2]);
  next.activities[0] = { ...next.activities[0], id: `activity-${randomUUID()}`, ownerId: item.ownerId ?? session.userId };
  return next;
}
export function scopeCrmData(state: DemoState, session: SessionPayload): DemoState {
  if (session.role === "ADMIN") return structuredClone(state);
  if (session.role !== "MARKETER") return { opportunities: [], activities: [] };
  const opportunities = state.opportunities.filter(o => o.ownerId === session.userId);
  const ids = new Set(opportunities.map(o => o.id));
  return structuredClone({ opportunities, activities: state.activities.filter(a => a.ownerId === session.userId && ids.has(a.opportunityId)) });
}
