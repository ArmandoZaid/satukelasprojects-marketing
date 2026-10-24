import { describe, expect, it } from "vitest";
import type { UserRole } from "./auth";
import { canAccessCrmScreen, MARKETING_SCREENS } from "./crm-access";

describe("CRM screen admission", () => {
  it("grants marketers only six CRM screens and the schools alias", () => {
    expect(MARKETING_SCREENS).toEqual(["dashboard", "opportunities", "pipeline", "follow-ups", "activities", "reports"]);
    for (const screen of [...MARKETING_SCREENS, "schools"]) {
      expect(canAccessCrmScreen("MARKETER", screen)).toBe(true);
      expect(canAccessCrmScreen("ADMIN", screen)).toBe(true);
    }
    for (const screen of ["settings", "admin", "members"]) {
      expect(canAccessCrmScreen("MARKETER", screen)).toBe(false);
      expect(canAccessCrmScreen("ADMIN", screen)).toBe(true);
    }
    for (const screen of [...MARKETING_SCREENS, "schools", "settings", "admin", "members", "preview", "unknown", "", "/dashboard"]) {
      expect(canAccessCrmScreen("MANAGER", screen)).toBe(false);
      expect(canAccessCrmScreen("UNRECOGNIZED" as UserRole, screen)).toBe(false);
    }
    expect(canAccessCrmScreen("ADMIN", "preview")).toBe(false);
    expect(canAccessCrmScreen("ADMIN", "unknown")).toBe(false);
  });
});
