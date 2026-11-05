import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";

const target = path.resolve(".env.docker");
const content = [
  "# Local Docker only. Never commit or reuse these credentials on a VPS.",
  `AUTH_SECRET=${randomBytes(32).toString("hex")}`,
  "ADMIN_EMAIL=admin@local.satukelas.invalid",
  `ADMIN_PASSWORD=${randomBytes(24).toString("hex")}`,
  `DB_PASSWORD=${randomBytes(24).toString("hex")}`,
  "LOCAL_PORT=3100",
  "APP_ORIGIN=http://127.0.0.1:3100",
  "USE_SECURE_COOKIES=false",
  "MARKETING_ENABLE_DEMO_AUTH=false",
  "MARKETING_ENABLE_SYNTHETIC_CRM=false",
  "MARKETING_USERS_JSON=[]",
  "",
].join("\n");
try {
  writeFileSync(target, content, { flag: "wx", mode: 0o600 });
  console.log(`Environment lokal dibuat: ${target}`);
  console.log("Nilai rahasia tidak dicetak. Lihat/edit file secara privat; jangan gunakan untuk produksi.");
} catch (error) {
  console.error(error.code === "EEXIST" ? "File .env.docker sudah ada; tidak ditimpa." : "Gagal membuat file environment lokal.");
  process.exit(1);
}
