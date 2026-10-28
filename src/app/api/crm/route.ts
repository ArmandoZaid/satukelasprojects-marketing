import { crmIdentity, crmResponse, crmError, crmInput, isAllowedOrigin } from "@/lib/crm-http";
import { readCrmStore, writeCrmStore, resetCrmStore } from "@/lib/crm-store";
import { scopeCrmData, createOwnedProspect, CrmDataError } from "@/lib/crm-data";
export const dynamic = "force-dynamic";
export async function GET() {
 try { const session = await crmIdentity(); return crmResponse(scopeCrmData(readCrmStore(), session)); }
 catch (error) { return crmError(error); }
}
export async function POST(request: Request) {
 try {
  const session = await crmIdentity(); const input = await crmInput(request);
  const next = createOwnedProspect(readCrmStore(), session, input);
  writeCrmStore(next); return crmResponse(scopeCrmData(next, session), 201);
 } catch (error) { return crmError(error); }
}
export async function DELETE(request: Request) {
 try {
  const session = await crmIdentity();
  if (session.role !== "ADMIN") throw new CrmDataError("Akses ditolak. Reset CRM hanya untuk Administrator.", 403);
  const origin = request.headers.get("origin");
  if (!origin || !isAllowedOrigin(origin, request)) throw new CrmDataError("Origin tidak diizinkan.", 403);
  resetCrmStore();
  return crmResponse({ success: true, message: "CRM store reset." });
 } catch (error) { return crmError(error); }
}
