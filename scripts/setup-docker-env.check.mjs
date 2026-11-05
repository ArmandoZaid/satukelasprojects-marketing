import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const script = fileURLToPath(new URL("./setup-docker-env.mjs", import.meta.url));

test("creates local-only random secrets and never overwrites or prints them", () => {
  const directory = mkdtempSync(path.join(process.env.TMPDIR || process.cwd(), "marketing-env-check-"));
  try {
    const target = path.join(directory, ".env.docker");
    const first = spawnSync(process.execPath, [script], { cwd: directory, encoding: "utf8" });
    assert.equal(first.status, 0, first.stderr);
    const content = readFileSync(target, "utf8");
    for (const name of ["AUTH_SECRET", "ADMIN_PASSWORD", "DB_PASSWORD"]) {
      const value = content.match(new RegExp(`^${name}=(.+)$`, "m"))?.[1];
      assert.ok(value && value.length >= 32);
      assert.ok(!(first.stdout + first.stderr).includes(value));
    }
    assert.ok(content.includes("APP_ORIGIN=http://127.0.0.1:3100"));
    assert.ok(content.includes("USE_SECURE_COOKIES=false"));
    assert.ok(content.includes("MARKETING_ENABLE_DEMO_AUTH=false"));
    assert.ok(content.includes("MARKETING_ENABLE_SYNTHETIC_CRM=false"));
    const second = spawnSync(process.execPath, [script], { cwd: directory, encoding: "utf8" });
    assert.notEqual(second.status, 0);
    assert.equal(readFileSync(target, "utf8"), content);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
