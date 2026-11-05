import { databasePoolConfig, isDatabaseConfigured } from "../src/lib/db/config.mjs";

export function validateContainerEnvironment(env) {
  const errors = [];
  try {
    const origin = new URL(env.APP_ORIGIN);
    if (!["http:", "https:"].includes(origin.protocol) || env.APP_ORIGIN !== origin.origin) {
      errors.push("APP_ORIGIN wajib berupa origin HTTP/HTTPS tanpa path, userinfo atau trailing slash.");
    } else if (env.USE_SECURE_COOKIES === "true" && origin.protocol !== "https:") {
      errors.push("APP_ORIGIN wajib HTTPS ketika USE_SECURE_COOKIES=true.");
    }
  } catch {
    errors.push("APP_ORIGIN wajib berupa origin publik HTTP/HTTPS yang valid.");
  }
  if (!env.AUTH_SECRET || env.AUTH_SECRET.trim().length < 32) {
    errors.push("AUTH_SECRET wajib berisi minimal 32 karakter.");
  }
  for (const name of ["MARKETING_ENABLE_DEMO_AUTH", "MARKETING_ENABLE_SYNTHETIC_CRM", "MARKETING_ENABLE_ADMIN_PREVIEW", "USE_SECURE_COOKIES"]) {
    if (env[name] !== undefined && !["true", "false"].includes(env[name])) {
      errors.push(`${name} harus true atau false.`);
    }
  }
  if (env.MARKETING_ENABLE_DEMO_AUTH !== "true") {
    if (!env.ADMIN_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.ADMIN_EMAIL.trim())) {
      errors.push("ADMIN_EMAIL wajib berupa alamat email yang valid.");
    }
    if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.trim().length < 12) {
      errors.push("ADMIN_PASSWORD wajib berisi minimal 12 karakter.");
    }
  }
  const demoOrSynthetic = env.MARKETING_ENABLE_DEMO_AUTH === "true" || env.MARKETING_ENABLE_SYNTHETIC_CRM === "true";
  if (!demoOrSynthetic && !isDatabaseConfigured(env)) {
    errors.push("Konfigurasi PostgreSQL (DATABASE_URL atau PGHOST..PGPASSWORD) wajib diatur di luar mode demo/sintetis.");
  } else if (isDatabaseConfigured(env)) {
    try {
      const cfg = databasePoolConfig(env);
      if (!env.DATABASE_URL?.trim()) {
        if (!cfg.database || !cfg.user || !cfg.password) {
          errors.push("PGDATABASE, PGUSER, dan PGPASSWORD wajib diisi saat menggunakan PGHOST.");
        }
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Konfigurasi PostgreSQL tidak valid.");
    }
  }
  return errors;
}
