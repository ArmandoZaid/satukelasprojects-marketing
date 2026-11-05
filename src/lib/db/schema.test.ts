import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { activities, opportunities, users } from "./schema";

describe("PostgreSQL schema contract", () => {
  it("exposes persistent user identity and optional profile columns", () => {
    const config = getTableConfig(users);
    expect(config.name).toBe("users");
    expect(users.id.primary).toBe(true);
    expect(users.passwordHash.notNull).toBe(true);
    expect(users.sessionVersion.notNull).toBe(true);
    expect(users.address.notNull).toBe(false);
    expect(users.createdAt.dataType).toBe("string");
    expect(config.checks.map(check => check.name)).toEqual(expect.arrayContaining(["users_role_check", "users_email_normalized_check"]));
    expect(config.uniqueConstraints.map(item => item.name)).toContain("users_email_unique");
  });

  it("protects global opportunity uniqueness and ownership at database level", () => {
    const config = getTableConfig(opportunities);
    expect(opportunities.estimate.dataType).toBe("number");
    expect(opportunities.created.notNull).toBe(true);
    expect(opportunities.due.default).toBe("");
    expect(config.indexes.map(index => index.config.name)).toEqual(expect.arrayContaining([
      "opportunities_school_service_period_unique", "opportunities_owner_idx", "opportunities_due_idx", "opportunities_status_idx",
    ]));
    expect(config.checks.map(check => check.name)).toEqual(expect.arrayContaining([
      "opportunities_stage_check", "opportunities_status_check", "opportunities_amount_check", "opportunities_due_check",
    ]));
    expect(config.foreignKeys[0].onDelete).toBe("restrict");
  });

  it("prevents activities from referencing another owner's opportunity", () => {
    const config = getTableConfig(activities);
    const ownership = config.foreignKeys.find(fk => fk.getName() === "activities_opportunity_owner_fk")!;
    expect(ownership.reference().columns.map(column => column.name)).toEqual(["opportunity_id", "owner_id"]);
    expect(ownership.onDelete).toBe("restrict");
    expect(config.indexes).toHaveLength(2);
  });
});
