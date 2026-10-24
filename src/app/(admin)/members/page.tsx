import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Tim & Member Marketing · Web Admin Satukelas",
  description: "Manajemen Akun dan Tim Member Marketing Satukelas Projects.",
  robots: { index: false, follow: false },
};

export default async function AdminMembersPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");
  return null;
}
