import { crmIdentity, crmResponse, crmError, crmInput, isAllowedOrigin } from "@/lib/crm-http";
import { CrmDataError } from "@/lib/crm-data";
import { createRuntimeProspect, readRuntimeCrm, resetRuntimeCrm } from "@/lib/runtime-crm";
export const dynamic = "force-dynamic";
export async function GET() {
 try { const session = await crmIdentity(); return crmResponse(await readRuntimeCrm(session)); }
 catch (error) { return crmError(error); }
}
export async function POST(request: Request) {
 try {
  const session = await crmIdentity(); const input = await crmInput(request);
  return crmResponse(await createRuntimeProspect(session, input), 201);
 } catch (error) { return crmError(error); }
}
export async function DELETE(request: Request) {
 try {
  const session = await crmIdentity();
  if (session.role !== "ADMIN") throw new CrmDataError("Akses ditolak. Reset CRM hanya untuk Administrator.", 403);
  const origin = request.headers.get("origin");
  if (!origin || !isAllowedOrigin(origin, request)) throw new CrmDataError("Origin tidak diizinkan.", 403);
  await resetRuntimeCrm();
  return crmResponse({ success: true, message: "CRM store reset." });
 } catch (error) { return crmError(error); }
}
