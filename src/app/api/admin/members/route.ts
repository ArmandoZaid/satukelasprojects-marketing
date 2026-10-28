import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { isAllowedOrigin } from "@/lib/crm-http";
import { CrmDataError } from "@/lib/crm-data";
import {
  getMarketingMembers,
  createMarketingMember,
  MarketingMember,
} from "@/lib/member-store";
import { readCrmStore } from "@/lib/crm-store";

export const dynamic = "force-dynamic";

function sanitizeMember(member: MarketingMember, prospectsCount = 0) {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    isActive: member.isActive,
    avatarUrl: member.avatarUrl,
    phone: member.phone,
    address: member.address,
    title: member.title,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    prospectsCount,
  };
}

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

async function parseJsonBody(request: Request, maxBytes = 4 * 1024 * 1024): Promise<Record<string, unknown>> {
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
    throw new CrmDataError("Ukuran payload melebihi batas maksimal 4 MB.", 413);
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
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  try {
    await requireAdmin();
    const members = getMarketingMembers();
    let crmData;
    try {
      crmData = readCrmStore();
    } catch {
      crmData = null;
    }

    const sanitized = members.map((m) => {
      const count = crmData?.opportunities
        ? crmData.opportunities.filter((o) => o.ownerId === m.id || o.owner.toLowerCase() === m.name.toLowerCase()).length
        : 0;
      return sanitizeMember(m, count);
    });

    return NextResponse.json(
      { members: sanitized },
      { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);

    const name = String(body.name || "");
    const email = String(body.email || "");
    const password = String(body.password || "");
    const avatarUrl = body.avatarUrl ? String(body.avatarUrl) : undefined;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    const newMember = createMarketingMember({
      name,
      email,
      password,
      avatarUrl,
      phone: body.phone === undefined ? undefined : body.phone as string,
      address: body.address === undefined ? undefined : body.address as string,
      isActive,
    });

    return NextResponse.json(
      { member: sanitizeMember(newMember, 0) },
      { status: 201, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
