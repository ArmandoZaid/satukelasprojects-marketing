import type { UserRole } from "./auth";

export const MARKETING_SCREENS = [
  "dashboard", "opportunities", "pipeline", "follow-ups", "activities", "reports",
] as const;

export function canAccessCrmScreen(role: UserRole, screen: string): boolean {
  if (role !== "ADMIN" && role !== "MARKETER") return false;
  if (screen === "schools" || MARKETING_SCREENS.some((allowed) => allowed === screen)) return true;
  return role === "ADMIN" && (screen === "settings" || screen === "admin" || screen === "members");
}
