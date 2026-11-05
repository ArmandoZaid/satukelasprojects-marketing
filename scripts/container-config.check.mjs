import assert from "node:assert/strict";
import { test } from "node:test";
import { validateContainerEnvironment } from "./container-config.mjs";

const valid = () => ({
  AUTH_SECRET: "a".repeat(64),
  APP_ORIGIN: "https://marketing.example.invalid",
  ADMIN_EMAIL: "admin@example.invalid",
  ADMIN_PASSWORD: "a".repeat(20),
  USE_SECURE_COOKIES: "true",
  PGHOST: "marketing-db",
  PGPORT: "5432",
  PGDATABASE: "satukelas_marketing",
  PGUSER: "marketing",
  PGPASSWORD: "d".repeat(24),
});

test("accepts explicit runtime admin configuration without enabling demos", () => {
  assert.deepEqual(validateContainerEnvironment(valid()), []);
});

test("rejects missing or short auth secret without echoing its value", () => {
  for (const secret of ["", "private-short-value"]) {
    const errors = validateContainerEnvironment({ ...valid(), AUTH_SECRET: secret });
    assert.ok(errors.some((error) => error.includes("AUTH_SECRET")));
    if (secret) assert.ok(!errors.join(" ").includes(secret));
  }
});

test("requires a valid admin identity outside explicit demo mode", () => {
  for (const fields of [{ ADMIN_EMAIL: "" }, { ADMIN_EMAIL: "invalid" }, { ADMIN_PASSWORD: "" }, { ADMIN_PASSWORD: "short" }]) {
    assert.ok(validateContainerEnvironment({ ...valid(), ...fields }).length > 0);
  }
});

test("rejects misspelled flags rather than silently enabling a wrong mode", () => {
  for (const name of ["MARKETING_ENABLE_DEMO_AUTH", "MARKETING_ENABLE_SYNTHETIC_CRM", "MARKETING_ENABLE_ADMIN_PREVIEW", "USE_SECURE_COOKIES"]) {
    assert.ok(validateContainerEnvironment({ ...valid(), [name]: "yes" }).some((error) => error.includes(name)));
  }
});

test("requires one canonical public origin for mapped ports and proxy TLS", () => {
  for (const APP_ORIGIN of [undefined, "", "invalid", "https://user@example.invalid", "https://example.invalid/", "https://example.invalid/path", "https://example.invalid?query", "ftp://example.invalid"]) {
    assert.ok(validateContainerEnvironment({ ...valid(), APP_ORIGIN }).some(error => error.includes("APP_ORIGIN")));
  }
  assert.deepEqual(validateContainerEnvironment({ ...valid(), APP_ORIGIN: "http://127.0.0.1:3100", USE_SECURE_COOKIES: "false" }), []);
});

test("requires HTTPS public origin when secure cookies are enabled", () => {
  assert.ok(validateContainerEnvironment({ ...valid(), APP_ORIGIN: "http://example.invalid" }).some(error => error.includes("HTTPS")));
});

test("permits explicit local demo mode without bootstrap credentials", () => {
  assert.deepEqual(validateContainerEnvironment({ AUTH_SECRET: "a".repeat(64), APP_ORIGIN: "http://127.0.0.1:3106", MARKETING_ENABLE_DEMO_AUTH: "true" }), []);
});

test("requires valid PostgreSQL configuration outside demo/synthetic mode without echoing secrets", () => {
  const missingDb = validateContainerEnvironment({
    ...valid(),
    PGHOST: "",
    DATABASE_URL: "",
  });
  assert.ok(missingDb.some((error) => error.includes("PostgreSQL") || error.includes("DATABASE_URL") || error.includes("PGHOST")));

  const secretUrl = "postgresql://marketing:super-secret-db-pass@marketing-db:5432/satukelas_marketing?sslmode=invalid-mode";
  const badSsl = validateContainerEnvironment({
    ...valid(),
    PGHOST: "",
    DATABASE_URL: secretUrl,
  });
  assert.ok(badSsl.length > 0);
  assert.ok(!badSsl.join(" ").includes("super-secret-db-pass"));
});
