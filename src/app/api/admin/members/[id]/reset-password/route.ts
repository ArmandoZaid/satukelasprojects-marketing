import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { isAllowedOrigin } from "@/lib/crm-http";
import { CrmDataError } from "@/lib/crm-data";
import {
  resetMemberPassword,
  getMarketingMemberById,
} from "@/lib/member-store";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession();
  if (!session) {
    throw new CrmDataError("Sesi tidak ditemukan atau kedaluwarsa.", 401);
  }
  if (session.role !== "ADMIN") {
    throw new CrmDataError("Akses ditolak. Fitur ini hanya untuk peran Administrator.", 403);
  }
  return session;
}

async function parseJsonBody(request: Request, maxBytes = 64 * 1024): Promise<Record<string, unknown>> {
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin, request)) {
    throw new CrmDataError("Origin tidak diizinkan.", 403);
  }
  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().includes("application/json")) {
    throw new CrmDataError("Format payload harus application/json.", 415);
  }
  const text = await request.text();
  if (text.length > maxBytes) {
    throw new CrmDataError("Ukuran payload melebihi batas.", 413);
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new CrmDataError("Format JSON tidak valid.", 400);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new CrmDataError("Format isian data tidak valid.", 400);
  }
  return data;
}

function handleApiError(error: unknown) {
  if (error instanceof CrmDataError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Terjadi kesalahan internal server.";
  const status = message.toLowerCase().includes("tidak ditemukan") ? 404 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await props.params;

    const existing = getMarketingMemberById(id);
    if (!existing) {
      throw new CrmDataError("Member marketing tidak ditemukan.", 404);
    }

    const body = await parseJsonBody(request);
    const newPassword = String(body.newPassword || body.password || "");
    if (!newPassword || newPassword.length < 8) {
      throw new CrmDataError("Kata sandi baru minimal 8 karakter.", 400);
    }

    const result = resetMemberPassword(id, newPassword);

    return NextResponse.json(
      { success: true, message: "Kata sandi member marketing berhasil diperbarui.", memberId: result.memberId },
      { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
