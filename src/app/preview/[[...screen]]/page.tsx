import { notFound, redirect } from "next/navigation";

export default async function PreviewPage({ params }: { params: Promise<{ screen?: string[] }> }) {
  const { screen } = await params;
  if (!screen) redirect("/preview/dashboard");
  if (screen.length !== 1 || !["dashboard", "opportunities", "pipeline", "follow-ups", "activities", "reports", "settings"].includes(screen[0])) notFound();
  return null;
}
