import { crmIdentity, crmResponse, crmError, crmInput } from "@/lib/crm-http";
import { CrmDataError } from "@/lib/crm-data";
import { getRuntimeOpportunity, updateRuntimeOpportunity } from "@/lib/runtime-crm";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
 try { const session = await crmIdentity(); const { id } = await context.params; return crmResponse(await getRuntimeOpportunity(session, id)); }
 catch (error) { return crmError(error); }
}
export async function PATCH(request: Request, context: Context) {
 try {
  const session = await crmIdentity(); const { id } = await context.params; const body = await crmInput(request);
  if (body.action !== "result" && body.action !== "stage") throw new CrmDataError("Aksi tidak valid.");
  if (!body.input || typeof body.input !== "object" || Array.isArray(body.input)) throw new CrmDataError("Isian tidak valid.");
  return crmResponse(await updateRuntimeOpportunity(session, id, body.action, body.input as Record<string, unknown>));
 } catch (error) { return crmError(error); }
}
