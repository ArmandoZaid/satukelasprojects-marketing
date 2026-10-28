import { authenticateUser, getRegisteredUsers, getSessionCookieOptions, hashPassword, signSessionToken, updateAdminPassword, updateAdminProfile, updateConfiguredAccount, type RegisteredUser, type SessionPayload } from "./auth";
import { CrmDataError } from "./crm-data";
import { getMarketingMemberById, resetMemberPassword, updateMarketingMember } from "./member-store";
import { crmResponse } from "./crm-http";

function validateAccountAvatar(value: string): void {
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new CrmDataError("Foto profil harus berupa unggahan JPEG, PNG, atau WebP.");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > 2 * 1024 * 1024) throw new CrmDataError("Foto profil maksimal 2 MiB.", 413);
  const valid = bytes.toString("base64") === match[2] && (
    match[1] === "png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    match[1] === "jpeg" && bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ||
    match[1] === "webp" && bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
  );
  if (!valid) throw new CrmDataError("Isi foto tidak sesuai format JPEG, PNG, atau WebP.");
}

export function ownAccount(session: SessionPayload): RegisteredUser {
  const user = getRegisteredUsers().find(user => user.id === session.userId && user.isActive && user.role === session.role);
  if (!user) throw new CrmDataError("Akun tidak ditemukan atau tidak aktif.", 401);
  return user;
}

export function accountResponse(user: RegisteredUser, refreshSession = false) {
  const response = crmResponse({ account: {
    id: user.id, name: user.name, email: user.email, role: user.role,
    phone: user.phone ?? "", title: user.title ?? "", avatarUrl: user.avatarUrl ?? "",
  }, storage: "runtime" });
  if (refreshSession) {
    const token = signSessionToken({ userId: user.id, name: user.name, email: user.email, role: user.role });
    response.cookies.set({ ...getSessionCookieOptions(), value: token });
  }
  return response;
}

export function changeOwnPassword(session: SessionPayload, input: Record<string, unknown>): RegisteredUser {
  const user = ownAccount(session);
  const fields = ["currentPassword", "newPassword", "confirmPassword"];
  if (Object.keys(input).length !== fields.length || Object.keys(input).some(key => !fields.includes(key)) ||
      fields.some(key => typeof input[key] !== "string")) throw new CrmDataError("Isian kata sandi tidak valid.");
  const { currentPassword, newPassword, confirmPassword } = input as Record<string, string>;
  if (!currentPassword || currentPassword.length > 128) throw new CrmDataError("Kata sandi saat ini wajib diisi, maksimal 128 karakter.");
  if (newPassword.length < 8 || newPassword.length > 128) throw new CrmDataError("Kata sandi baru harus berisi 8–128 karakter.");
  if (confirmPassword !== newPassword) throw new CrmDataError("Konfirmasi kata sandi tidak sama.");
  const verified = authenticateUser(user.email, currentPassword);
  if (!verified.ok || verified.user.id !== user.id) throw new CrmDataError("Kata sandi saat ini tidak sesuai.");
  if (user.role === "ADMIN") updateAdminPassword(newPassword);
  else if (process.env.MARKETING_ENABLE_DEMO_AUTH === "true" && getMarketingMemberById(user.id)) resetMemberPassword(user.id, newPassword);
  else updateConfiguredAccount(user.id, { passwordHash: hashPassword(newPassword) });
  return ownAccount(session);
}

export function changeOwnProfile(session: SessionPayload, input: Record<string, unknown>): RegisteredUser {
  const user = ownAccount(session);
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
  if (clean.name !== undefined && (!clean.name || clean.name.length > 200 || /[\u0000-\u001f\u007f]/.test(clean.name))) throw new CrmDataError("Nama lengkap wajib diisi, maksimal 200 karakter.");
  if (clean.email !== undefined) {
    clean.email = clean.email.toLowerCase();
    if (clean.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) throw new CrmDataError("Format email tidak valid.");
    if (getRegisteredUsers().some(account => account.id !== user.id && account.email === clean.email)) throw new CrmDataError("Email sudah terdaftar.", 409);
  }
  if (clean.phone !== undefined && clean.phone && (!/^[+\d][\d ()-]{6,29}$/.test(clean.phone))) throw new CrmDataError("Nomor WhatsApp harus berisi 7–30 karakter angka, spasi, +, -, atau tanda kurung.");
  if (clean.title !== undefined && (clean.title.length > 100 || /[\u0000-\u001f\u007f]/.test(clean.title))) throw new CrmDataError("Jabatan maksimal 100 karakter.");
  if (clean.avatarUrl) validateAccountAvatar(clean.avatarUrl);
  if (user.role === "ADMIN") updateAdminProfile(clean);
  else if (process.env.MARKETING_ENABLE_DEMO_AUTH === "true" && getMarketingMemberById(user.id)) updateMarketingMember(user.id, clean, true);
  else updateConfiguredAccount(user.id, clean);
  return ownAccount(session);
}
