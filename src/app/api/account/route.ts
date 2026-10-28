import { accountResponse, changeOwnProfile, ownAccount } from "@/lib/account";
import { crmError, crmIdentity, crmInput } from "@/lib/crm-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const session = await crmIdentity();
    const input = await crmInput(request, 3 * 1024 * 1024);
    return accountResponse(changeOwnProfile(session, input), true);
  } catch (error) {
    return crmError(error);
  }
}

export async function GET() {
  try {
    const session = await crmIdentity();
    return accountResponse(ownAccount(session));
  } catch (error) {
    return crmError(error);
  }
}
