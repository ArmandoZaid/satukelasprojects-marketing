import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { authenticateUser, hashPassword, type RegisteredUser, type SessionPayload } from "./auth";
import { CrmDataError } from "./crm-data";
import { getDatabase } from "./db/client";
import { activities, opportunities, users } from "./db/schema";
import {
  memberNameToSlug, type CreateMarketingMemberInput,
  type MarketingMember, type UpdateMarketingMemberInput,
} from "./member-store";

type UserRow = typeof users.$inferSelect;
type Transaction = Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0];

function databaseError(error: unknown): never {
  if (error instanceof CrmDataError) throw error;
  let cause = error;
  for (let depth = 0; depth < 5 && cause && typeof cause === "object"; depth++) {
    if ("code" in cause && cause.code === "23505") throw new CrmDataError("Email sudah terdaftar.", 409);
    if ("code" in cause && cause.code === "23503") {
      throw new CrmDataError("Member masih memiliki prospek atau aktivitas; akun belum dapat dihapus atau dinonaktifkan.", 409);
    }
    cause = "cause" in cause ? cause.cause : undefined;
  }
  throw new CrmDataError("Layanan database tidak tersedia. Silakan coba lagi.", 503);
}

async function read<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); } catch (error) { return databaseError(error); }
}

async function write<T>(operation: (tx: Transaction) => Promise<T>): Promise<T> {
  return read(() => getDatabase().transaction(async tx => {
    // Shared with CRM writes to serialize assignment and account deactivation.
    await tx.execute(sql`select pg_advisory_xact_lock(734123)`);
    return operation(tx);
  }));
}

const authColumns = {
  id: users.id, email: users.email, name: users.name, role: users.role, isActive: users.isActive,
  passwordHash: users.passwordHash, sessionVersion: users.sessionVersion,
  phone: users.phone, title: users.title, avatarUrl: users.avatarUrl,
};

function authUser(row: Omit<UserRow, "address" | "createdAt" | "updatedAt">): RegisteredUser {
  return { ...row, phone: row.phone ?? undefined, title: row.title ?? undefined, avatarUrl: row.avatarUrl ?? undefined };
}

function marketingMember(row: UserRow): MarketingMember {
  if (row.role !== "MARKETER") throw new CrmDataError("Member marketing tidak ditemukan.", 404);
  return { ...row, role: "MARKETER", phone: row.phone ?? undefined, address: row.address ?? undefined,
    title: row.title ?? undefined, avatarUrl: row.avatarUrl ?? undefined };
}

export async function getDbUsers(): Promise<RegisteredUser[]> {
  return read(async () => (await getDatabase().select(authColumns).from(users)).map(authUser));
}

export async function getDbUserById(id: string): Promise<RegisteredUser | undefined> {
  return read(async () => {
    const [row] = await getDatabase().select(authColumns).from(users).where(eq(users.id, id)).limit(1);
    return row ? authUser(row) : undefined;
  });
}

export async function getDbUserByEmail(email: string): Promise<RegisteredUser | undefined> {
  return read(async () => {
    const [row] = await getDatabase().select(authColumns).from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    return row ? authUser(row) : undefined;
  });
}

export async function getDbMembers(): Promise<MarketingMember[]> {
  return read(async () => (await getDatabase().select().from(users).where(eq(users.role, "MARKETER")).orderBy(users.createdAt, users.id)).map(marketingMember));
}

export async function getDbMemberById(id: string): Promise<MarketingMember | undefined> {
  return read(async () => {
    const [row] = await getDatabase().select().from(users).where(eq(users.id, id)).limit(1);
    return row?.role === "MARKETER" ? marketingMember(row) : undefined;
  });
}

export const getDbMember = getDbMemberById;

export async function getDbMemberBySlug(slug: string): Promise<MarketingMember | undefined> {
  if (!slug) return undefined;
  const normalized = slug.toLowerCase().trim();
  const members = await getDbMembers();
  return members.find(member => member.id.toLowerCase() === normalized) ??
    members.find(member => memberNameToSlug(member.name) === normalized) ??
    members.find(member => member.email.split("@")[0] === normalized);
}

function cleanName(value: unknown): string {
  if (typeof value !== "string") throw new CrmDataError("Nama lengkap wajib diisi, maksimal 200 karakter.");
  const name = value.trim();
  if (!name || name.length > 200 || /[\u0000-\u001f\u007f]/.test(name)) {
    throw new CrmDataError("Nama lengkap wajib diisi, maksimal 200 karakter.");
  }
  return name;
}

function cleanEmail(value: unknown): string {
  if (typeof value !== "string") throw new CrmDataError("Format email tidak valid.");
  const email = value.toLowerCase().trim();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CrmDataError("Format email tidak valid.");
  }
  return email;
}

function cleanPassword(value: unknown, label = "Kata sandi"): string {
  if (typeof value !== "string" || value.length < 8 || value.length > 128) {
    throw new CrmDataError(`${label} harus berisi 8–128 karakter.`);
  }
  return value;
}

function cleanPhone(value: unknown): string | null {
  if (typeof value !== "string" || (value.trim() !== "" && !/^[+\d][\d ()-]{6,29}$/.test(value.trim()))) {
    throw new CrmDataError("Nomor telepon harus berisi 7–30 karakter angka, spasi, +, -, atau tanda kurung.");
  }
  return value.trim() || null;
}

function cleanAddress(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
    throw new CrmDataError("Alamat tempat tinggal maksimal 500 karakter dan harus berupa teks.");
  }
  return value.trim() || null;
}

function cleanTitle(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length > 100 || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new CrmDataError("Jabatan maksimal 100 karakter.");
  }
  return value.trim() || null;
}

function validateRasterDataUrl(value: string): void {
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new CrmDataError("Format gambar profil harus JPEG, PNG, atau WebP.");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > 2 * 1024 * 1024) throw new CrmDataError("Foto profil maksimal 2 MiB.", 413);
  const valid = bytes.toString("base64") === match[2] && (
    match[1] === "png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    match[1] === "jpeg" && bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ||
    match[1] === "webp" && bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
  );
  if (!valid) throw new CrmDataError("Isi foto tidak sesuai format JPEG, PNG, atau WebP.");
}

function cleanMemberAvatar(value: unknown): string | null {
  if (typeof value !== "string") throw new CrmDataError("Format gambar profil harus JPEG, PNG, atau WebP.");
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) return trimmed;
  validateRasterDataUrl(trimmed);
  return trimmed;
}

async function assertAvailableEmail(tx: Transaction, email: string, exceptId?: string): Promise<void> {
  const [existing] = await tx.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing && existing.id !== exceptId) throw new CrmDataError("Email sudah terdaftar.", 409);
}

async function assertNoMemberRelations(tx: Transaction, id: string): Promise<void> {
  const [opportunity] = await tx.select({ id: opportunities.id }).from(opportunities).where(eq(opportunities.ownerId, id)).limit(1);
  const [activity] = opportunity ? [undefined] : await tx.select({ id: activities.id }).from(activities).where(eq(activities.ownerId, id)).limit(1);
  if (opportunity || activity) {
    throw new CrmDataError("Member masih memiliki prospek atau aktivitas; akun belum dapat dihapus atau dinonaktifkan.", 409);
  }
}

async function requireMemberRow(tx: Transaction, id: string): Promise<UserRow> {
  const [row] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
  if (!row || row.role !== "MARKETER") throw new CrmDataError("Member marketing tidak ditemukan.", 404);
  return row;
}

export async function createDbMember(input: CreateMarketingMemberInput): Promise<MarketingMember> {
  const name = cleanName(input.name);
  const email = cleanEmail(input.email);
  const password = cleanPassword(input.password);
  const phone = input.phone === undefined ? null : cleanPhone(input.phone);
  const address = input.address === undefined ? null : cleanAddress(input.address);
  const title = input.title === undefined ? null : cleanTitle(input.title);
  const avatarUrl = input.avatarUrl === undefined ? null : cleanMemberAvatar(input.avatarUrl);
  if (input.isActive !== undefined && typeof input.isActive !== "boolean") throw new CrmDataError("Status akun tidak valid.");
  return write(async tx => {
    await assertAvailableEmail(tx, email);
    const now = new Date().toISOString();
    const [row] = await tx.insert(users).values({
      id: randomUUID(), name, email, role: "MARKETER", isActive: input.isActive ?? true,
      passwordHash: hashPassword(password), sessionVersion: randomUUID(),
      phone, address, title, avatarUrl, createdAt: now, updatedAt: now,
    }).returning();
    return marketingMember(row);
  });
}

export async function updateDbMember(id: string, input: UpdateMarketingMemberInput, rotateSession = false): Promise<MarketingMember> {
  return write(async tx => {
    const member = await requireMemberRow(tx, id);
    const name = input.name === undefined ? member.name : cleanName(input.name);
    const email = input.email === undefined ? member.email : cleanEmail(input.email);
    const phone = input.phone === undefined ? member.phone : cleanPhone(input.phone);
    const address = input.address === undefined ? member.address : cleanAddress(input.address);
    const title = input.title === undefined ? member.title : cleanTitle(input.title);
    const avatarUrl = input.avatarUrl === undefined ? member.avatarUrl : cleanMemberAvatar(input.avatarUrl);
    if (input.isActive !== undefined && typeof input.isActive !== "boolean") throw new CrmDataError("Status akun tidak valid.");
    const isActive = input.isActive ?? member.isActive;
    if (email !== member.email) await assertAvailableEmail(tx, email, id);
    if (input.isActive === false) await assertNoMemberRelations(tx, id);
    const sessionVersion = rotateSession || email !== member.email || isActive !== member.isActive ? randomUUID() : member.sessionVersion;
    const [row] = await tx.update(users).set({
      name, email, phone, address, title, avatarUrl, isActive, sessionVersion, updatedAt: new Date().toISOString(),
    }).where(eq(users.id, id)).returning();
    return marketingMember(row);
  });
}

export async function resetDbMemberPassword(id: string, newPassword: string): Promise<{ success: true; memberId: string }> {
  const password = cleanPassword(newPassword, "Kata sandi baru");
  return write(async tx => {
    await requireMemberRow(tx, id);
    await tx.update(users).set({
      passwordHash: hashPassword(password), sessionVersion: randomUUID(), updatedAt: new Date().toISOString(),
    }).where(eq(users.id, id));
    return { success: true, memberId: id };
  });
}

export async function deleteDbMember(id: string): Promise<{ success: true; deletedId: string }> {
  if (id === "usr_admin_01") throw new CrmDataError("Akun Administrator tidak dapat dihapus melalui manajemen member marketing.");
  return write(async tx => {
    const [row] = await tx.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, id)).limit(1);
    if (row?.role === "ADMIN") throw new CrmDataError("Akun Administrator tidak dapat dihapus melalui manajemen member marketing.");
    if (!row || row.role !== "MARKETER") throw new CrmDataError("Member marketing tidak ditemukan.", 404);
    await assertNoMemberRelations(tx, id);
    await tx.delete(users).where(eq(users.id, id));
    return { success: true, deletedId: id };
  });
}

async function requireActiveSessionAccount(tx: Transaction, session: SessionPayload): Promise<UserRow> {
  const [row] = await tx.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!row || !row.isActive || row.role !== session.role) throw new CrmDataError("Akun tidak ditemukan atau tidak aktif.", 401);
  return row;
}

export async function updateDbOwnProfile(session: SessionPayload, input: Record<string, unknown>): Promise<RegisteredUser> {
  const allowed = ["name", "email", "phone", "title", "avatarUrl"] as const;
  if (!Object.keys(input).length || Object.keys(input).some(key => !allowed.includes(key as typeof allowed[number]))) {
    throw new CrmDataError("Hanya nama, email, nomor WhatsApp, jabatan, dan foto profil yang dapat diubah.");
  }
  const clean: Partial<Record<typeof allowed[number], string>> = {};
  for (const key of allowed) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== "string") throw new CrmDataError("Isian profil tidak valid.");
    clean[key] = (input[key] as string).trim();
  }
  if (clean.name !== undefined) cleanName(clean.name);
  if (clean.email !== undefined) clean.email = cleanEmail(clean.email);
  if (clean.phone !== undefined) cleanPhone(clean.phone);
  if (clean.title !== undefined) cleanTitle(clean.title);
  if (clean.avatarUrl) validateRasterDataUrl(clean.avatarUrl);
  return write(async tx => {
    const current = await requireActiveSessionAccount(tx, session);
    if (clean.email !== undefined && clean.email !== current.email) await assertAvailableEmail(tx, clean.email, current.id);
    const [row] = await tx.update(users).set({
      name: clean.name ?? current.name, email: clean.email ?? current.email,
      phone: clean.phone === undefined ? current.phone : clean.phone || null,
      title: clean.title === undefined ? current.title : clean.title || null,
      avatarUrl: clean.avatarUrl === undefined ? current.avatarUrl : clean.avatarUrl || null,
      sessionVersion: randomUUID(), updatedAt: new Date().toISOString(),
    }).where(eq(users.id, current.id)).returning(authColumns);
    return authUser(row);
  });
}

export async function changeDbOwnPassword(session: SessionPayload, input: Record<string, unknown>): Promise<RegisteredUser> {
  const fields = ["currentPassword", "newPassword", "confirmPassword"];
  if (Object.keys(input).length !== fields.length || Object.keys(input).some(key => !fields.includes(key)) ||
      fields.some(key => typeof input[key] !== "string")) throw new CrmDataError("Isian kata sandi tidak valid.");
  const { currentPassword, newPassword, confirmPassword } = input as Record<string, string>;
  if (!currentPassword || currentPassword.length > 128) throw new CrmDataError("Kata sandi saat ini wajib diisi, maksimal 128 karakter.");
  cleanPassword(newPassword, "Kata sandi baru");
  if (confirmPassword !== newPassword) throw new CrmDataError("Konfirmasi kata sandi tidak sama.");
  return write(async tx => {
    const current = await requireActiveSessionAccount(tx, session);
    const verified = authenticateUser(current.email, currentPassword, [authUser(current)]);
    if (!verified.ok || verified.user.id !== current.id) throw new CrmDataError("Kata sandi saat ini tidak sesuai.");
    const [row] = await tx.update(users).set({
      passwordHash: hashPassword(newPassword), sessionVersion: randomUUID(), updatedAt: new Date().toISOString(),
    }).where(eq(users.id, current.id)).returning(authColumns);
    return authUser(row);
  });
}
