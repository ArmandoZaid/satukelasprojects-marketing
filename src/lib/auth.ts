import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type UserRole = "ADMIN" | "MANAGER" | "MARKETER";

import { getMarketingMembers } from "./member-store";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "MARKETER";
  isActive: boolean;
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number; // Unix timestamp in seconds
  iat: number;
}

export const SESSION_COOKIE_NAME = "sk_mkt_session";
export const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 hours

let demoSecret: string | undefined;

function getSecret(): string {
  const configured = process.env.AUTH_SECRET || process.env.MARKETING_AUTH_SECRET;
  if (configured) {
    if (configured.trim().length < 32) throw new Error("An auth secret of at least 32 characters is required.");
    return configured;
  }
  if (!isDemoAuthEnabled() && process.env.NODE_ENV !== "test") throw new Error("An auth secret of at least 32 characters is required.");
  return demoSecret ??= randomBytes(32).toString("hex");
}

/**
 * Daftar akun terkelola sistem internal.
 * Akun default ADMIN dapat dikonfigurasi melalui environment variable.
 */
function isDemoAuthEnabled(): boolean {
  return process.env.MARKETING_ENABLE_DEMO_AUTH === "true";
}

export type RegisteredUser = AuthUser & { password?: string; passwordHash?: string };

export function getRegisteredUsers(): RegisteredUser[] {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@satukelas.com").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminSatukelas2026!";

  const demoMembers = isDemoAuthEnabled() ? getMarketingMembers() : [];

  const users: RegisteredUser[] = [
    {
      id: "usr_admin_01",
      email: adminEmail,
      name: "Administrator Satukelas",
      role: "ADMIN",
      isActive: true,
      password: adminPassword,
    },
    {
      id: "usr_mgr_01",
      email: "manager@satukelas.com",
      name: "Manager Satukelas",
      role: "MANAGER",
      isActive: true,
      password: "ManagerSatukelas2026!",
    },
    ...demoMembers.map((m) => ({
      id: m.id,
      email: m.email,
      name: m.name,
      role: "MARKETER" as const,
      isActive: m.isActive,
      password: m.rawPassword,
      passwordHash: m.passwordHash,
    })),
  ];
  const enabled = users.filter((user) => isDemoAuthEnabled() || (user.role === "ADMIN" && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD));
  try {
    const entries: unknown = JSON.parse(process.env.MARKETING_USERS_JSON ?? "[]");
    if (!Array.isArray(entries)) return [];
    const configured: RegisteredUser[] = [];
    for (const entry of entries) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
      const { id, email, name, passwordHash, isActive } = entry;
      if (!isValidId(id) || !isValidEmail(email) || !isValidName(name) ||
          typeof isActive !== "boolean" || !isValidPasswordHash(passwordHash)) return [];
      configured.push({
        id, email: email.toLowerCase().trim(), name: name.trim(),
        role: "MARKETER", passwordHash, isActive,
      });
    }
    const registered = [...enabled, ...configured];
    if (registered.some((user) => !isValidEmail(user.email) || !user.password && !user.passwordHash) ||
        new Set(registered.map((user) => user.id)).size !== registered.length ||
        new Set(registered.map((user) => user.email)).size !== registered.length) return [];
    return registered;
  } catch {
    return [];
  }
}

function isValidId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidName(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 200 && !/[\u0000-\u001f\u007f]/.test(value);
}

// Registry format: scrypt$<16–64 byte hex salt>$<64 byte hex key> (Node defaults).
function isValidPasswordHash(value: unknown): value is string {
  return typeof value === "string" && /^scrypt\$(?:[a-fA-F0-9]{2}){16,64}\$[a-fA-F0-9]{128}$/.test(value);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

function matchesPassword(password: string, user: RegisteredUser): boolean {
  try {
    if (user.passwordHash) {
      const [algorithm, salt, key] = user.passwordHash.split("$");
      if (algorithm !== "scrypt" || !salt || !key) return false;
      const expected = Buffer.from(key, "hex");
      const actual = scryptSync(password, salt, expected.length);
      return expected.length > 0 && timingSafeEqual(actual, expected);
    }
    const actual = Buffer.from(password);
    const expected = Buffer.from(user.password || "");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, "utf8").toString("base64url");
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf8");
}

/**
 * Membuat token sesi bertanda tangan HMAC-SHA256 (payload tidak terenkripsi).
 */
export function signSessionToken(payload: Omit<SessionPayload, "iat" | "exp">, durationSeconds = SESSION_DURATION_SECONDS): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + durationSeconds;
  const fullPayload: SessionPayload = { ...payload, iat, exp };

  const payloadString = JSON.stringify(fullPayload);
  const encodedPayload = base64UrlEncode(payloadString);

  const hmac = createHmac("sha256", getSecret());
  hmac.update(encodedPayload);
  const signature = hmac.digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/**
 * Memverifikasi tanda tangan dan klaim token sesi.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const parts = token.split(".");
  const [encodedPayload, signature] = parts;
  if (parts.length !== 2 || !encodedPayload || !signature ||
      !/^[A-Za-z0-9_-]+$/.test(encodedPayload) || !/^[A-Za-z0-9_-]{43}$/.test(signature)) {
    return null;
  }

  try {
    const hmac = createHmac("sha256", getSecret());
    hmac.update(encodedPayload);
    const expectedSignature = hmac.digest("base64url");

    const sigA = Buffer.from(signature);
    const sigB = Buffer.from(expectedSignature);

    if (sigA.length !== sigB.length || !timingSafeEqual(sigA, sigB)) {
      return null;
    }

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson) as SessionPayload | null;
    const now = Math.floor(Date.now() / 1000);
    if (!payload || Array.isArray(payload) || typeof payload !== "object" ||
        !isValidId(payload.userId) || !isValidEmail(payload.email) || !isValidName(payload.name) ||
        !["ADMIN", "MANAGER", "MARKETER"].includes(payload.role) ||
        typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp <= now ||
        typeof payload.iat !== "number" || !Number.isFinite(payload.iat) || payload.iat < 0 ||
        payload.iat > now || payload.exp <= payload.iat) return null;

    const account = getRegisteredUsers().find((user) => user.id === payload.userId);
    if (!account?.isActive || account.role !== payload.role || account.email !== payload.email) return null;
    return { ...payload, name: account.name };
  } catch {
    return null;
  }
}

export type AuthResult =
  | { ok: true; user: AuthUser; token: string }
  | { ok: false; error: string; code: "INVALID_CREDENTIALS" | "ACCOUNT_INACTIVE" | "FORBIDDEN_ROLE" };

/**
 * Autentikasi email dan kata sandi
 */
export function authenticateUser(emailInput: string, passwordInput: string): AuthResult {
  const normalizedEmail = (emailInput || "").toLowerCase().trim();
  const password = passwordInput || "";

  if (!normalizedEmail || !password) {
    return {
      ok: false,
      error: "Email dan kata sandi wajib diisi.",
      code: "INVALID_CREDENTIALS",
    };
  }

  const users = getRegisteredUsers();
  const found = users.find((u) => u.email === normalizedEmail);

  if (!found) {
    return {
      ok: false,
      error: "Email atau kata sandi tidak valid.",
      code: "INVALID_CREDENTIALS",
    };
  }

  const isMatch = matchesPassword(password, found);

  if (!isMatch) {
    return {
      ok: false,
      error: "Email atau kata sandi tidak valid.",
      code: "INVALID_CREDENTIALS",
    };
  }

  if (!found.isActive) {
    return {
      ok: false,
      error: "Akun ini telah dinonaktifkan. Hubungi administrator.",
      code: "ACCOUNT_INACTIVE",
    };
  }

  const user: AuthUser = {
    id: found.id,
    email: found.email,
    name: found.name,
    role: found.role,
    isActive: found.isActive,
  };

  const token = signSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return { ok: true, user, token };
}

/**
 * Opsi standar cookie sesi HTTP-Only
 */
export function getSessionCookieOptions(durationSeconds = SESSION_DURATION_SECONDS) {
  const isHttps = process.env.VERCEL === "1" || process.env.USE_SECURE_COOKIES === "true";
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax" as const,
    path: "/",
    maxAge: durationSeconds,
  };
}

/**
 * Membaca sesi aktif dari cookie server (App Router Server Components / Route Handlers)
 */
export async function getServerSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) {
      return null;
    }
    return verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Memverifikasi akses workspace untuk ADMIN dan MARKETER.
 */
export async function requireCrmSession(): Promise<SessionPayload | null> {
  const session = await getServerSession();
  return session && (session.role === "ADMIN" || session.role === "MARKETER") ? session : null;
}

export async function requireAdminSession(): Promise<SessionPayload | null> {
  const session = await getServerSession();
  if (!session || session.role !== "ADMIN") {
    return null;
  }
  return session;
}
