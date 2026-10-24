import { crmIdentity, crmResponse, crmError, crmInput } from "@/lib/crm-http";
import { readCrmStore, writeCrmStore } from "@/lib/crm-store";
import { scopeCrmData, getOwnedOpportunity, updateOwnedOpportunity, CrmDataError } from "@/lib/crm-data";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
 try { const session = await crmIdentity(); const { id } = await context.params; return crmResponse(getOwnedOpportunity(readCrmStore(), session, id)); }
 catch (error) { return crmError(error); }
}
export async function PATCH(request: Request, context: Context) {
 try {
  const session = await crmIdentity(); const { id } = await context.params; const body = await crmInput(request);
  if (body.action !== "result" && body.action !== "stage") throw new CrmDataError("Aksi tidak valid.");
  if (!body.input || typeof body.input !== "object" || Array.isArray(body.input)) throw new CrmDataError("Isian tidak valid.");
  const next = updateOwnedOpportunity(readCrmStore(), session, id, body.action, body.input as Record<string, unknown>);
  writeCrmStore(next); return crmResponse(scopeCrmData(next, session));
 } catch (error) { return crmError(error); }
}
