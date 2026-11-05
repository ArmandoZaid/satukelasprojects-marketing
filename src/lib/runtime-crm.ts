import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import type { SessionPayload } from "./auth";
import { businessTime, businessToday } from "./business-date";
import { createOwnedProspect, CrmDataError, getOwnedOpportunity, scopeCrmData, updateOwnedOpportunity } from "./crm-data";
import { addProspect, moveStage, recordResult, type Activity, type DemoState, type Opportunity } from "./crm-demo";
import { readCrmStore, resetCrmStore, writeCrmStore } from "./crm-store";
import { DATABASE_WRITE_LOCK_KEY, getDatabase, isDatabaseConfigured, type Database, type DatabaseTransaction } from "./db/client";
import { activities, opportunities, users } from "./db/schema";

type Queryable = Database | DatabaseTransaction;

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

function toCrmError(error: unknown): never {
  if (error instanceof CrmDataError) throw error;
  let cause = error;
  for (let depth = 0; depth < 5 && cause && typeof cause === "object"; depth++) {
    if ("code" in cause && cause.code === "23505") {
      throw new CrmDataError("Peluang sekolah, layanan, dan periode ini sudah ada.", 409);
    }
    if ("code" in cause && cause.code === "23503") {
      throw new CrmDataError("Akun pemilik peluang tidak valid atau tidak aktif.", 409);
    }
    cause = "cause" in cause ? cause.cause : undefined;
  }
  if (error instanceof Error && (
    error.message.includes("Isi ") ||
    error.message.includes("Lengkapi ") ||
    error.message.includes("Peluang ") ||
    error.message.includes("Nilai ") ||
    error.message.includes("Hasil ") ||
    error.message.includes("Ringkasan ") ||
    error.message.includes("Pilih ") ||
    error.message.includes("Tanggal ") ||
    error.message.includes("Judul ") ||
    error.message.includes("Alasan ")
  )) {
    throw new CrmDataError(error.message, error.message.includes("sudah ada") ? 409 : 400);
  }
  throw new CrmDataError("Layanan database tidak tersedia. Silakan coba lagi.", 503);
}

async function runRead<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); } catch (error) { return toCrmError(error); }
}

async function runWrite<T>(operation: (tx: DatabaseTransaction) => Promise<T>): Promise<T> {
  return runRead(() => getDatabase().transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(${DATABASE_WRITE_LOCK_KEY})`);
    return operation(tx);
  }));
}

async function assertActiveActor(tx: DatabaseTransaction, session: SessionPayload): Promise<{ id: string; name: string }> {
  const [actor] = await tx.select({ id: users.id, name: users.name, role: users.role, isActive: users.isActive })
    .from(users).where(eq(users.id, session.userId)).limit(1);
  if (!actor || !actor.isActive || actor.role !== session.role) {
    throw new CrmDataError("Akun tidak ditemukan atau tidak aktif.", 401);
  }
  return { id: actor.id, name: actor.name };
}

function mapOpportunity(row: typeof opportunities.$inferSelect, owner: string): Opportunity {
  return {
    id: row.id, school: row.school, owner, ownerId: row.ownerId, region: row.region,
    service: row.service, period: row.period, stage: row.stage, status: row.status,
    estimate: row.estimate, finalValue: row.finalValue ?? undefined,
    nextAction: row.nextAction, due: row.due, legacy: row.legacy || undefined,
    created: row.created,
  };
}

function mapActivity(row: typeof activities.$inferSelect, owner: string): Activity {
  return {
    id: row.id, opportunityId: row.opportunityId, ownerId: row.ownerId,
    title: row.title, summary: row.summary, date: row.date, time: row.time, owner,
  };
}

async function loadScopedState(db: Queryable, session: SessionPayload): Promise<DemoState> {
  allow(session);
  const oppQuery = db.select({ row: opportunities, owner: users.name })
    .from(opportunities).innerJoin(users, eq(opportunities.ownerId, users.id));
  const oppRows = session.role === "ADMIN"
    ? await oppQuery.orderBy(opportunities.created, opportunities.id)
    : await oppQuery.where(eq(opportunities.ownerId, session.userId)).orderBy(opportunities.created, opportunities.id);
  const actQuery = db.select({ row: activities, owner: users.name })
    .from(activities).innerJoin(users, eq(activities.ownerId, users.id));
  const actRows = session.role === "ADMIN"
    ? await actQuery.orderBy(desc(activities.createdAt), desc(activities.id))
    : await actQuery.where(eq(activities.ownerId, session.userId)).orderBy(desc(activities.createdAt), desc(activities.id));
  const allowedIds = new Set(oppRows.map(({ row }) => row.id));
  return {
    opportunities: oppRows.map(({ row, owner }) => mapOpportunity(row, owner)),
    activities: actRows.filter(({ row }) => allowedIds.has(row.opportunityId)).map(({ row, owner }) => mapActivity(row, owner)),
  };
}

export async function readRuntimeCrm(session: SessionPayload): Promise<DemoState> {
  if (!isDatabaseConfigured()) return scopeCrmData(readCrmStore(), session);
  return runRead(() => loadScopedState(getDatabase(), session));
}

export async function getRuntimeOpportunity(session: SessionPayload, id: string): Promise<Opportunity> {
  if (!isDatabaseConfigured()) return getOwnedOpportunity(readCrmStore(), session, id);
  allow(session);
  return runRead(async () => {
    const where = session.role === "ADMIN" ? eq(opportunities.id, id) : and(eq(opportunities.id, id), eq(opportunities.ownerId, session.userId));
    const [found] = await getDatabase().select({ row: opportunities, owner: users.name })
      .from(opportunities).innerJoin(users, eq(opportunities.ownerId, users.id)).where(where).limit(1);
    if (!found) throw new CrmDataError("Peluang tidak ditemukan.", 404);
    return mapOpportunity(found.row, found.owner);
  });
}

export async function createRuntimeProspect(session: SessionPayload, input: Record<string, unknown>): Promise<DemoState> {
  if (!isDatabaseConfigured()) {
    const next = createOwnedProspect(readCrmStore(), session, input);
    writeCrmStore(next);
    return scopeCrmData(next, session);
  }
  allow(session);
  const clean = fields(input, ["school", "region", "service", "period", "estimate"]);
  return runWrite(async tx => {
    const actor = await assertActiveActor(tx, session);
    const validated = addProspect({ opportunities: [], activities: [] }, { ...clean, owner: actor.name } as Parameters<typeof addProspect>[1], [actor.name], true).opportunities[0];
    const [duplicate] = await tx.select({ id: opportunities.id }).from(opportunities)
      .where(and(sql`lower(${opportunities.school}) = ${validated.school.toLowerCase()}`, eq(opportunities.service, validated.service), eq(opportunities.period, validated.period))).limit(1);
    if (duplicate) throw new CrmDataError("Peluang sekolah, layanan, dan periode ini sudah ada.", 409);
    const now = new Date().toISOString();
    await tx.insert(opportunities).values({
      id: `opp-${randomUUID()}`, ownerId: actor.id, school: validated.school, region: validated.region,
      service: validated.service, period: validated.period, stage: validated.stage, status: validated.status,
      estimate: validated.estimate, finalValue: null, nextAction: "", due: "", legacy: false,
      created: Date.now(), createdAt: now, updatedAt: now,
    });
    return loadScopedState(tx, session);
  });
}

export async function updateRuntimeOpportunity(
  session: SessionPayload, id: string, action: "result" | "stage", input: Record<string, unknown>,
): Promise<DemoState> {
  if (!isDatabaseConfigured()) {
    const next = updateOwnedOpportunity(readCrmStore(), session, id, action, input);
    writeCrmStore(next);
    return scopeCrmData(next, session);
  }
  allow(session);
  const names = action === "result" ? ["summary", "kind", "date", "nextAction", "due"] : ["stage", "reason", "finalValue", "closedOn", "reference"];
  const clean = fields(input, names);
  return runWrite(async tx => {
    await assertActiveActor(tx, session);
    const where = session.role === "ADMIN" ? eq(opportunities.id, id) : and(eq(opportunities.id, id), eq(opportunities.ownerId, session.userId));
    const [found] = await tx.select({ row: opportunities, owner: users.name })
      .from(opportunities).innerJoin(users, eq(opportunities.ownerId, users.id)).where(where).limit(1);
    if (!found) throw new CrmDataError("Peluang tidak ditemukan.", 404);
    const current = mapOpportunity(found.row, found.owner);
    const today = businessToday();
    const next = action === "result"
      ? recordResult({ opportunities: [current], activities: [] }, id, clean as Parameters<typeof recordResult>[2], today)
      : moveStage({ opportunities: [current], activities: [] }, id, clean as Parameters<typeof moveStage>[2], today);
    const updated = next.opportunities[0];
    const activity = next.activities[0];
    const now = new Date().toISOString();
    await tx.update(opportunities).set({
      stage: updated.stage, status: updated.status, finalValue: updated.finalValue ?? null,
      nextAction: updated.nextAction, due: updated.due, updatedAt: now,
    }).where(eq(opportunities.id, id));
    await tx.insert(activities).values({
      id: `activity-${randomUUID()}`, opportunityId: id, ownerId: found.row.ownerId,
      title: activity.title, summary: activity.summary, date: activity.date, time: businessTime(), createdAt: now,
    });
    return loadScopedState(tx, session);
  });
}

export async function resetRuntimeCrm(): Promise<void> {
  if (isDatabaseConfigured()) throw new CrmDataError("Reset seluruh CRM dinonaktifkan pada database operasional.", 403);
  resetCrmStore();
}
