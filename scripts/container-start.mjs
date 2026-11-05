import { isDatabaseConfigured } from "../src/lib/db/config.mjs";
import { validateContainerEnvironment } from "./container-config.mjs";
import { bootstrapAdmin } from "./db-bootstrap.mjs";
import { migrateDatabase } from "./db-migrate.mjs";

const errors = validateContainerEnvironment(process.env);
if (errors.length) {
  console.error("Konfigurasi container tidak valid:\n" + errors.join("\n"));
  process.exit(1);
}
if (isDatabaseConfigured(process.env)) {
  try {
    await migrateDatabase({ env: process.env });
    await bootstrapAdmin({ env: process.env });
  } catch (error) {
    console.error("Inisialisasi database PostgreSQL gagal:", error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }
} else if (process.env.MARKETING_ENABLE_DEMO_AUTH === "true" || process.env.MARKETING_ENABLE_SYNTHETIC_CRM === "true") {
  console.warn("Mode demo/sintetis aktif. Data hanya dalam memori dan hilang saat restart.");
}
await import("../server.js");
