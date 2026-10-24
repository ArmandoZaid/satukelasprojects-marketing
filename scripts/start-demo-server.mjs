import { randomBytes } from "node:crypto";

process.env.AUTH_SECRET = randomBytes(32).toString("hex");
process.env.MARKETING_ENABLE_DEMO_AUTH = "true";
process.env.MARKETING_ENABLE_SYNTHETIC_CRM = "true";
process.env.MARKETING_ENABLE_ADMIN_PREVIEW = "true";
process.env.MARKETING_HOSTNAME = "127.0.0.1";
process.env.PORT = "3100";
process.env.USE_SECURE_COOKIES = "false";
delete process.env.VERCEL;
delete process.env.ADMIN_EMAIL;
delete process.env.ADMIN_PASSWORD;
delete process.env.MARKETING_USERS_JSON;

await import("./start.mjs");
