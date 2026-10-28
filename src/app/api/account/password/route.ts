import { accountResponse, changeOwnPassword } from "@/lib/account";
import { crmError, crmIdentity, crmInput } from "@/lib/crm-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await crmIdentity();
    const input = await crmInput(request);
    return accountResponse(changeOwnPassword(session, input), true);
  } catch (error) {
    return crmError(error);
  }
}
