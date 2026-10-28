import { randomUUID } from "node:crypto";
import { getRegisteredUsers, hashPassword } from "./auth";
import { CrmDataError } from "./crm-data";
import { readCrmStore } from "./crm-store";

export interface MarketingMember {
  id: string;
  name: string;
  email: string;
  role: "MARKETER";
  isActive: boolean;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  title?: string;
  sessionVersion: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketingMemberInput {
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  title?: string;
  isActive?: boolean;
}

export interface UpdateMarketingMemberInput {
  name?: string;
  email?: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  title?: string;
  isActive?: boolean;
}

declare global {
  var __SATUKELAS_MARKETING_MEMBERS__: MarketingMember[] | undefined;
}

const DEFAULT_MEMBERS: MarketingMember[] = [
  {
    id: "usr_mkt_01",
    name: "Yunus",
    email: "marketer@satukelas.com",
    role: "MARKETER",
    isActive: true,
    phone: "081234567890",
    title: "Konsultan Buku Tahunan",
    sessionVersion: randomUUID(),
    passwordHash: hashPassword("MarketerSatukelas2026!"),
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z",
  },
  {
    id: "usr_mkt_02",
    name: "Dzaky",
    email: "dzaky@satukelas.com",
    role: "MARKETER",
    isActive: true,
    phone: "081234567891",
    title: "Konsultan Buku Tahunan",
    sessionVersion: randomUUID(),
    passwordHash: hashPassword("MarketerSatukelas2026!"),
    createdAt: "2026-01-16T08:00:00.000Z",
    updatedAt: "2026-01-16T08:00:00.000Z",
  },
  {
    id: "usr_mkt_03",
    name: "Armando",
    email: "armando@satukelas.com",
    role: "MARKETER",
    isActive: true,
    phone: "081234567892",
    title: "Senior Marketing Strategist",
    sessionVersion: randomUUID(),
    passwordHash: hashPassword("MarketerSatukelas2026!"),
    createdAt: "2026-01-17T08:00:00.000Z",
    updatedAt: "2026-01-17T08:00:00.000Z",
  },
  {
    id: "usr_mkt_04",
    name: "Yasser",
    email: "yasser@satukelas.com",
    role: "MARKETER",
    isActive: true,
    phone: "081234567893",
    title: "Konsultan Buku Tahunan",
    sessionVersion: randomUUID(),
    passwordHash: hashPassword("MarketerSatukelas2026!"),
    createdAt: "2026-01-18T08:00:00.000Z",
    updatedAt: "2026-01-18T08:00:00.000Z",
  },
];

function getStore(): MarketingMember[] {
  if (!globalThis.__SATUKELAS_MARKETING_MEMBERS__) {
    // Clone DEFAULT_MEMBERS
    globalThis.__SATUKELAS_MARKETING_MEMBERS__ = DEFAULT_MEMBERS.map((m) => ({ ...m }));
  }
  return globalThis.__SATUKELAS_MARKETING_MEMBERS__;
}

export function resetMarketingMembers(): void {
  globalThis.__SATUKELAS_MARKETING_MEMBERS__ = DEFAULT_MEMBERS.map((m) => ({ ...m }));
}

export function validateAvatarDataUrl(value?: string): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (trimmed === "") return true;

  // Izinkan URL eksternal http/https yang valid
  if (/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) {
    return true;
  }

  // Cek format data URI gambar (JPEG, PNG, WebP)
  const dataUriRegex = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;
  const match = trimmed.match(dataUriRegex);
  if (!match) {
    return false;
  }

  // Hitung ukuran data base64 (maksimal 2 MB = 2.097.152 byte -> base64 ~ 2.800.000 karakter)
  const base64Data = match[2];
  const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
  if (sizeInBytes > 2 * 1024 * 1024) {
    return false;
  }

  return true;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 254;
}

export function getMarketingMembers(): MarketingMember[] {
  return getStore().map((m) => ({ ...m }));
}

export function getMarketingMemberById(id: string): MarketingMember | undefined {
  const member = getStore().find((m) => m.id === id);
  return member ? { ...member } : undefined;
}

export function memberNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getMarketingMemberBySlug(slug: string): MarketingMember | undefined {
  if (!slug) return undefined;
  const normalized = slug.toLowerCase().trim();
  const members = getStore();

  // 1. Exact match by member id (case-insensitive)
  const byId = members.find((m) => m.id.toLowerCase() === normalized);
  if (byId) return { ...byId };

  // 2. Exact match by slugified member name
  const bySlug = members.find((m) => memberNameToSlug(m.name) === normalized);
  if (bySlug) return { ...bySlug };

  // 3. Match by email prefix (e.g. "marketer" from marketer@satukelas.com)
  const byEmailPrefix = members.find(
    (m) => m.email.split("@")[0].toLowerCase().trim() === normalized
  );
  if (byEmailPrefix) return { ...byEmailPrefix };

  return undefined;
}

export function assertAvailableEmail(email: string, memberId?: string): void {
  const registered = getRegisteredUsers();
  if (!registered.length) throw new Error("Registry autentikasi tidak valid atau belum dikonfigurasi");
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@satukelas.com").toLowerCase().trim();
  const conflictsWithRegistry = registered.some(user =>
    user.email.toLowerCase().trim() === email && user.id !== memberId
  );
  if ((email === adminEmail && memberId !== "usr_admin_01") || conflictsWithRegistry ||
      getStore().some(member => member.id !== memberId && member.email.toLowerCase().trim() === email)) {
    throw new Error("Email sudah terdaftar");
  }
}

function validateMemberContact(input: { phone?: string; address?: string }): void {
  if (input.phone !== undefined && (typeof input.phone !== "string" ||
      (input.phone.trim() !== "" && !/^[+\d][\d ()-]{6,29}$/.test(input.phone.trim())))) {
    throw new Error("Nomor telepon harus berisi 7–30 karakter angka, spasi, +, -, atau tanda kurung.");
  }
  if (input.address !== undefined && (typeof input.address !== "string" || input.address.trim().length > 500 ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(input.address))) {
    throw new Error("Alamat tempat tinggal maksimal 500 karakter dan harus berupa teks.");
  }
}

export function createMarketingMember(input: CreateMarketingMemberInput): MarketingMember {
  validateMemberContact(input);
  const name = (input.name || "").trim();
  if (!name) {
    throw new Error("Nama lengkap wajib diisi");
  }
  if (name.length > 200) {
    throw new Error("Nama lengkap maksimal 200 karakter");
  }

  const email = (input.email || "").toLowerCase().trim();
  if (!email || !isValidEmail(email)) {
    throw new Error("Format email tidak valid");
  }

  assertAvailableEmail(email);
  const store = getStore();

  const password = input.password || "";
  if (password.length < 8) {
    throw new Error("Kata sandi minimal 8 karakter");
  }

  if (input.avatarUrl && !validateAvatarDataUrl(input.avatarUrl)) {
    throw new Error("Format gambar profil harus JPEG, PNG, atau WebP");
  }

  const newId = `usr_mkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newMember: MarketingMember = {
    id: newId,
    name,
    email,
    role: "MARKETER",
    isActive: input.isActive ?? true,
    avatarUrl: input.avatarUrl?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    address: input.address?.trim() || undefined,
    title: input.title?.trim() || undefined,
    passwordHash: hashPassword(password),
    sessionVersion: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  store.push(newMember);
  return { ...newMember };
}

export function updateMarketingMember(id: string, input: UpdateMarketingMemberInput, rotateSession = false): MarketingMember {
  const store = getStore();
  const member = store.find((m) => m.id === id);
  if (!member) {
    throw new Error("Member marketing tidak ditemukan");
  }

  validateMemberContact(input);
  const candidate = { ...member };
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      throw new Error("Nama lengkap wajib diisi");
    }
    if (name.length > 200) {
      throw new Error("Nama lengkap maksimal 200 karakter");
    }
    candidate.name = name;
  }

  if (input.email !== undefined) {
    const email = input.email.toLowerCase().trim();
    if (!email || !isValidEmail(email)) {
      throw new Error("Format email tidak valid");
    }
    assertAvailableEmail(email, id);
    candidate.email = email;
  }

  if (input.avatarUrl !== undefined) {
    if (input.avatarUrl && !validateAvatarDataUrl(input.avatarUrl)) {
      throw new Error("Format gambar profil harus JPEG, PNG, atau WebP");
    }
    candidate.avatarUrl = input.avatarUrl.trim() || undefined;
  }

  if (input.phone !== undefined) {
    candidate.phone = input.phone.trim() || undefined;
  }

  if (input.address !== undefined) {
    candidate.address = input.address.trim() || undefined;
  }

  if (input.title !== undefined) {
    candidate.title = input.title.trim() || undefined;
  }

  if (input.isActive !== undefined) {
    candidate.isActive = Boolean(input.isActive);
  }

  if (input.isActive === false) assertNoMemberRelations(id);

  if (rotateSession || candidate.email !== member.email || candidate.isActive !== member.isActive) {
    candidate.sessionVersion = randomUUID();
  }
  candidate.updatedAt = new Date().toISOString();
  Object.assign(member, candidate);
  return { ...member };
}

export function resetMemberPassword(id: string, newPassword: string): { success: true; memberId: string } {
  const store = getStore();
  const member = store.find((m) => m.id === id);
  if (!member) {
    throw new Error("Member marketing tidak ditemukan");
  }

  const password = newPassword || "";
  if (password.length < 8) {
    throw new Error("Kata sandi baru minimal 8 karakter");
  }

  member.passwordHash = hashPassword(password);
  member.sessionVersion = randomUUID();
  member.updatedAt = new Date().toISOString();

  return { success: true, memberId: id };
}

function assertNoMemberRelations(id: string): void {
  const crm = readCrmStore();
  if (crm.opportunities.some(opportunity => opportunity.ownerId === id) ||
      crm.activities.some(activity => activity.ownerId === id)) {
    throw new CrmDataError("Member masih memiliki prospek atau aktivitas; akun belum dapat dihapus atau dinonaktifkan.", 409);
  }
}

export function deleteMarketingMember(id: string): { success: true; deletedId: string } {
  if (id === "usr_admin_01") {
    throw new Error("Akun Administrator tidak dapat dihapus melalui manajemen member marketing");
  }

  const store = getStore();
  const index = store.findIndex((m) => m.id === id);
  if (index === -1) {
    throw new Error("Member marketing tidak ditemukan");
  }

  assertNoMemberRelations(id);
  store.splice(index, 1);
  return { success: true, deletedId: id };
}
