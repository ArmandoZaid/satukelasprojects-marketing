import { redirect } from "next/navigation";
import { requireRuntimeAdminSession } from "@/lib/runtime-auth";

export default async function AdminIndexPage() {
  if (!await requireRuntimeAdminSession()) redirect("/dashboard");
  redirect("/dashboard");
}
