// Local E2E fixtures only. Never use this launcher for deployment.
import { randomBytes, scryptSync } from "node:crypto";
const hash = password => {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
};
Object.assign(process.env, {
  MARKETING_HOSTNAME: "127.0.0.1",
  AUTH_SECRET: randomBytes(32).toString("hex"),
  MARKETING_ENABLE_DEMO_AUTH: "false",
  MARKETING_ENABLE_ADMIN_PREVIEW: "true",
  MARKETING_ENABLE_SYNTHETIC_CRM: "true",
  ADMIN_EMAIL: "admin@satukelas.com",
  ADMIN_PASSWORD: "AdminSatukelas2026!",
  MARKETING_USERS_JSON: JSON.stringify([
    { id: "usr_mkt_01", name: "Yunus", email: "mkt-one@example.invalid", passwordHash: hash("Fixture-Marketing-One-Only!"), isActive: true },
    { id: "usr_mkt_02", name: "Dzaky", email: "mkt-two@example.invalid", passwordHash: hash("Fixture-Marketing-Two-Only!"), isActive: true },
  ]),
});
await import("./start.mjs");
