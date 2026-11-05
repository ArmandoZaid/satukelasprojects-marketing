import { getPool, isDatabaseConfigured } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json(
      { status: "ok", service: "satukelas-marketing" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    await getPool().query("SELECT 1");
    return Response.json(
      { status: "ok", service: "satukelas-marketing", database: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "error", service: "satukelas-marketing", database: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
