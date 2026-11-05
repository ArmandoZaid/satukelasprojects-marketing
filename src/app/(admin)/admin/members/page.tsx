import { redirect } from "next/navigation";
import { requireRuntimeAdminSession } from "@/lib/runtime-auth";

export default async function AdminMembersRedirectPage() {
  const admin = await requireRuntimeAdminSession();
  if (!admin) redirect("/dashboard");
  redirect("/members");
}
