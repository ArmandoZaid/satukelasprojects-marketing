import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";

export default async function AdminMembersRedirectPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");
  redirect("/members");
}
