import { NextResponse } from "next/server";
import { getServerSession } from "./auth";
import { CrmDataError } from "./crm-data";
export async function crmIdentity() {
 const session = await getServerSession();
 if (!session) throw new CrmDataError("Sesi tidak ditemukan atau kedaluwarsa.", 401);
 if (!["ADMIN", "MARKETER"].includes(session.role)) throw new CrmDataError("Akses ditolak.", 403);
 return session;
}
export function crmResponse(data: unknown, status = 200) {
 return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" } });
}
export function crmError(error: unknown) {
 return crmResponse({ error: error instanceof Error ? error.message : "Permintaan gagal." }, error instanceof CrmDataError ? error.status : 400);
}
export function isAllowedOrigin(origin: string | null, request: Request): boolean {
 if (!origin) return true;
 if (request.headers.get("sec-fetch-site") === "cross-site") return false;
 try {
  const originUrl = new URL(origin);
  const reqUrl = new URL(request.url);
  if (originUrl.origin === reqUrl.origin) return true;
  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (hostHeader && originUrl.host === hostHeader) return true;
  const isLoopbackOrigin = originUrl.hostname === "127.0.0.1" || originUrl.hostname === "localhost";
  const isLoopbackReq = reqUrl.hostname === "127.0.0.1" || reqUrl.hostname === "localhost";
  if (isLoopbackOrigin && isLoopbackReq && originUrl.port === reqUrl.port) return true;
  return false;
 } catch {
  return false;
 }
}

export async function crmInput(request: Request): Promise<Record<string, unknown>> {
 const origin = request.headers.get("origin");
 if (!isAllowedOrigin(origin, request)) throw new CrmDataError("Origin tidak diizinkan.", 403);
 if (!request.headers.get("content-type")?.startsWith("application/json")) throw new CrmDataError("Gunakan JSON.", 415);
 const text = await request.text();
 if (text.length > 16384) throw new CrmDataError("Permintaan terlalu besar.", 413);
 let data;
 try { data = JSON.parse(text); } catch { throw new CrmDataError("JSON tidak valid."); }
 if (!data || typeof data !== "object" || Array.isArray(data)) throw new CrmDataError("Isian tidak valid.");
 return data;
}
