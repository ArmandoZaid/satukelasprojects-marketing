import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";

export default async function AdminIndexPage() {
  if (!await requireAdminSession()) redirect("/dashboard");
  redirect("/dashboard");
}
