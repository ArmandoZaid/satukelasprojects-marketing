import { redirect } from "next/navigation";
import { ownRuntimeAccount } from "@/lib/account";
import { isDatabaseConfigured } from "@/lib/db/client";
import { requireRuntimeCrmSession } from "@/lib/runtime-auth";
import { readRuntimeCrm } from "@/lib/runtime-crm";
import { CrmApp } from "@/components/crm/crm-app";
import "@/app/preview/crm.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRuntimeCrmSession();

  if (!session) {
    redirect("/login?unauthorized=true");
  }

  const profile = await ownRuntimeAccount(session);
  return (
    <CrmApp
      initialAccount={{ id: profile.id, name: profile.name, email: profile.email, role: profile.role, phone: profile.phone, title: profile.title, avatarUrl: profile.avatarUrl }}
      key={session.userId}
      initialState={await readRuntimeCrm(session)}
      persistentStorage={isDatabaseConfigured()}
      currentUser={{
        userId: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
      }}
    >
      {children}
    </CrmApp>
  );
}
