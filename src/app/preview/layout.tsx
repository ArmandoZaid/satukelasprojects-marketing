import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CrmApp } from "@/components/crm/crm-app";
import { getServerSession } from "@/lib/auth";
import "./crm.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Preview admin Marketing CRM",
  robots: { index: false, follow: false },
};

export default async function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.MARKETING_ENABLE_ADMIN_PREVIEW !== "true") notFound();
  const session = await getServerSession();
  if (session && session.role !== "ADMIN") notFound();
  const currentUser =
    session && session.role === "ADMIN"
      ? {
          userId: session.userId,
          name: session.name,
          email: session.email,
          role: session.role,
        }
      : null;

  return (
    <Suspense fallback={<p>Menyiapkan preview admin…</p>}>
      <CrmApp currentUser={currentUser}>{children}</CrmApp>
    </Suspense>
  );
}
