import { sql } from "drizzle-orm";
import { bigint, boolean, check, foreignKey, index, pgTable, text, timestamp, unique, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").$type<"ADMIN" | "MANAGER" | "MARKETER">().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  passwordHash: text("password_hash").notNull(),
  sessionVersion: text("session_version").notNull(),
  phone: text("phone"),
  address: text("address"),
  title: text("title"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, table => [
  unique("users_email_unique").on(table.email),
  check("users_role_check", sql`${table.role} IN ('ADMIN', 'MANAGER', 'MARKETER')`),
  check("users_email_normalized_check", sql`${table.email} = lower(btrim(${table.email})) AND length(${table.email}) <= 254 AND ${table.email} ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'`),
]);

export const opportunities = pgTable("opportunities", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  school: text("school").notNull(),
  region: text("region").notNull(),
  service: text("service").notNull(),
  period: text("period").notNull(),
  stage: text("stage").$type<"Cold Lead" | "Contacted" | "Meeting Scheduled" | "Presentation Done" | "Proposal Sent" | "Negotiation" | "Won" | "Lost">().notNull(),
  status: text("status").$type<"OPEN" | "WON" | "LOST">().notNull(),
  estimate: bigint("estimate", { mode: "number" }),
  finalValue: bigint("final_value", { mode: "number" }),
  nextAction: text("next_action").notNull().default(""),
  due: text("due").notNull().default(""),
  legacy: boolean("legacy").notNull().default(false),
  created: bigint("created", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, table => [
  unique("opportunities_id_owner_unique").on(table.id, table.ownerId),
  uniqueIndex("opportunities_school_service_period_unique").on(sql`lower(${table.school})`, table.service, table.period),
  index("opportunities_owner_idx").on(table.ownerId),
  index("opportunities_due_idx").on(table.due),
  index("opportunities_status_idx").on(table.status),
  check("opportunities_stage_check", sql`${table.stage} IN ('Cold Lead', 'Contacted', 'Meeting Scheduled', 'Presentation Done', 'Proposal Sent', 'Negotiation', 'Won', 'Lost')`),
  check("opportunities_status_check", sql`${table.status} IN ('OPEN', 'WON', 'LOST')`),
  check("opportunities_stage_status_check", sql`(${table.stage} = 'Won' AND ${table.status} = 'WON') OR (${table.stage} = 'Lost' AND ${table.status} = 'LOST') OR (${table.stage} NOT IN ('Won', 'Lost') AND ${table.status} = 'OPEN')`),
  check("opportunities_amount_check", sql`(${table.estimate} IS NULL OR ${table.estimate} BETWEEN 0 AND 9007199254740991) AND (${table.finalValue} IS NULL OR ${table.finalValue} BETWEEN 0 AND 9007199254740991)`),
  check("opportunities_due_check", sql`CASE WHEN ${table.due} = '' THEN true ELSE ${table.due} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND to_char(${table.due}::date, 'YYYY-MM-DD') = ${table.due} END`),
]);

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunity_id").notNull().references(() => opportunities.id, { onDelete: "restrict", onUpdate: "restrict" }),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "restrict", onUpdate: "restrict" }),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, table => [
  foreignKey({ name: "activities_opportunity_owner_fk", columns: [table.opportunityId, table.ownerId], foreignColumns: [opportunities.id, opportunities.ownerId] }).onDelete("restrict").onUpdate("restrict"),
  index("activities_owner_idx").on(table.ownerId),
  index("activities_opportunity_idx").on(table.opportunityId),
]);
