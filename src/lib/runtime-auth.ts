import { cookies } from "next/headers";
import {
  authenticateUser, getServerSession, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS,
  signSessionToken, verifySessionToken, type AuthResult, type SessionPayload,
} from "./auth";
import { CrmDataError } from "./crm-data";
import { isDatabaseConfigured } from "./db/client";
import { getDbUserByEmail, getDbUserById } from "./persistent-accounts";

type SessionIdentity = Omit<SessionPayload, "iat" | "exp" | "sessionVersion">;

export async function authenticateRuntimeUser(email: string, password: string): Promise<AuthResult> {
  if (!isDatabaseConfigured()) return authenticateUser(email, password);
  if (typeof email !== "string" || typeof password !== "string" || email.length > 254 || password.length > 128) {
    return { ok: false, error: "Email atau kata sandi tidak valid.", code: "INVALID_CREDENTIALS" };
  }
  const account = await getDbUserByEmail(email.toLowerCase().trim());
  return authenticateUser(email, password, account ? [account] : []);
}

export async function signRuntimeSessionToken(payload: SessionIdentity, durationSeconds = SESSION_DURATION_SECONDS): Promise<string> {
  if (!isDatabaseConfigured()) return signSessionToken(payload, durationSeconds);
  const account = await getDbUserById(payload.userId);
  if (!account?.isActive || account.email !== payload.email || account.role !== payload.role) {
    throw new CrmDataError("Akun tidak ditemukan atau tidak aktif.", 401);
  }
  return signSessionToken({ ...payload, name: account.name }, durationSeconds, [account]);
}

export async function verifyRuntimeSessionToken(token: string): Promise<SessionPayload | null> {
  if (!isDatabaseConfigured()) return verifySessionToken(token);
  if (typeof token !== "string" || token.length > 8192 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)) return null;
  let userId: string;
  try {
    // This untrusted ID is only a bounded lookup hint, never an authorization claim.
    const payload: unknown = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8"));
    if (!payload || typeof payload !== "object" || !("userId" in payload) ||
        typeof payload.userId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(payload.userId)) return null;
    userId = payload.userId;
  } catch {
    return null;
  }
  const account = await getDbUserById(userId);
  return verifySessionToken(token, account ? [account] : []);
}

export async function getRuntimeSession(): Promise<SessionPayload | null> {
  if (!isDatabaseConfigured()) return getServerSession();
  let token: string | undefined;
  try {
    token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  } catch {
    return null;
  }
  return token ? verifyRuntimeSessionToken(token) : null;
}

export async function requireRuntimeCrmSession(): Promise<SessionPayload | null> {
  const session = await getRuntimeSession();
  return session && (session.role === "ADMIN" || session.role === "MARKETER") ? session : null;
}

export async function requireRuntimeAdminSession(): Promise<SessionPayload | null> {
  const session = await getRuntimeSession();
  return session?.role === "ADMIN" ? session : null;
}
