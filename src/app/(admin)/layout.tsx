import { redirect } from "next/navigation";
import { requireCrmSession } from "@/lib/auth";
import { readCrmStore } from "@/lib/crm-store";
import { scopeCrmData } from "@/lib/crm-data";
import { ownAccount } from "@/lib/account";
import { CrmApp } from "@/components/crm/crm-app";
import "@/app/preview/crm.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCrmSession();

  if (!session) {
    redirect("/login?unauthorized=true");
  }

  const profile = ownAccount(session);
  return (
    <CrmApp
      initialAccount={{ id: profile.id, name: profile.name, email: profile.email, role: profile.role, phone: profile.phone, title: profile.title, avatarUrl: profile.avatarUrl }}
      key={session.userId}
      initialState={scopeCrmData(readCrmStore(), session)}
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
