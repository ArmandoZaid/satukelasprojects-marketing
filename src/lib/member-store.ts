import { hashPassword } from "./auth";

export interface MarketingMember {
  id: string;
  name: string;
  email: string;
  role: "MARKETER";
  isActive: boolean;
  avatarUrl?: string;
  passwordHash: string;
  rawPassword?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketingMemberInput {
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export interface UpdateMarketingMemberInput {
  name?: string;
  email?: string;
  avatarUrl?: string;
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
    rawPassword: "MarketerSatukelas2026!",
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
    rawPassword: "MarketerSatukelas2026!",
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
    rawPassword: "MarketerSatukelas2026!",
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
    rawPassword: "MarketerSatukelas2026!",
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 254;
}

export function getMarketingMembers(): MarketingMember[] {
  return getStore().map((m) => ({ ...m }));
}

export function getMarketingMemberById(id: string): MarketingMember | undefined {
  const member = getStore().find((m) => m.id === id);
  return member ? { ...member } : undefined;
}

export function createMarketingMember(input: CreateMarketingMemberInput): MarketingMember {
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

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@satukelas.com").toLowerCase().trim();
  if (email === adminEmail) {
    throw new Error("Email sudah terdaftar");
  }

  const store = getStore();
  if (store.some((m) => m.email.toLowerCase().trim() === email)) {
    throw new Error("Email sudah terdaftar");
  }

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
    rawPassword: password,
    passwordHash: hashPassword(password),
    createdAt: now,
    updatedAt: now,
  };

  store.push(newMember);
  return { ...newMember };
}

export function updateMarketingMember(id: string, input: UpdateMarketingMemberInput): MarketingMember {
  const store = getStore();
  const member = store.find((m) => m.id === id);
  if (!member) {
    throw new Error("Member marketing tidak ditemukan");
  }

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      throw new Error("Nama lengkap wajib diisi");
    }
    if (name.length > 200) {
      throw new Error("Nama lengkap maksimal 200 karakter");
    }
    member.name = name;
  }

  if (input.email !== undefined) {
    const email = input.email.toLowerCase().trim();
    if (!email || !isValidEmail(email)) {
      throw new Error("Format email tidak valid");
    }
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@satukelas.com").toLowerCase().trim();
    if (email === adminEmail) {
      throw new Error("Email sudah terdaftar");
    }
    if (store.some((m) => m.id !== id && m.email.toLowerCase().trim() === email)) {
      throw new Error("Email sudah terdaftar");
    }
    member.email = email;
  }

  if (input.avatarUrl !== undefined) {
    if (input.avatarUrl && !validateAvatarDataUrl(input.avatarUrl)) {
      throw new Error("Format gambar profil harus JPEG, PNG, atau WebP");
    }
    member.avatarUrl = input.avatarUrl.trim() || undefined;
  }

  if (input.isActive !== undefined) {
    member.isActive = Boolean(input.isActive);
  }

  member.updatedAt = new Date().toISOString();
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
  member.rawPassword = password;
  member.updatedAt = new Date().toISOString();

  return { success: true, memberId: id };
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

  store.splice(index, 1);
  return { success: true, deletedId: id };
}
