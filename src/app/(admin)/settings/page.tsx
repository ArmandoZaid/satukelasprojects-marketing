import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Pengaturan akun · Marketing CRM Satukelas",
  description: "Status Sesi dan Pengaturan Kontrol Marketing CRM Satukelas Projects.",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/login");
  return null;
}
