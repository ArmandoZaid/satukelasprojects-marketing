import assert from "node:assert/strict";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { test } from "node:test";
import { ACCOUNT_WRITE_LOCK_KEY, bootstrapAdmin } from "./db-bootstrap.mjs";

function createFakeBootstrapPool(initialUsers = []) {
  const users = [...initialUsers];
  const calls = [];
  const client = {
    async query(sql, values = []) {
      calls.push({ sql: String(sql).trim(), values });
      if (/SELECT id FROM users WHERE role = 'ADMIN'/i.test(sql)) {
        const admin = users.find(user => user.role === "ADMIN");
        return { rows: admin ? [{ id: admin.id }] : [] };
      }
      if (/INSERT INTO users/i.test(sql)) {
        const [id, email, name, role, isActive, passwordHash, sessionVersion, phone, title] = values;
        users.push({ id, email, name, role, isActive, passwordHash, sessionVersion, phone, title });
      }
      return { rows: [], rowCount: 1 };
    },
    release() {
      calls.push({ sql: "RELEASE", values: [] });
    },
  };
  return { users, calls, pool: { connect: async () => client, end: async () => {} } };
}

test("validates bootstrap admin credentials only when no ADMIN row exists and hashes with scrypt", async () => {
  const empty = createFakeBootstrapPool();
  await assert.rejects(() => bootstrapAdmin({ pool: empty.pool, env: { ADMIN_EMAIL: "invalid", ADMIN_PASSWORD: "123456789012" } }), /ADMIN_EMAIL/);
  await assert.rejects(() => bootstrapAdmin({ pool: empty.pool, env: { ADMIN_EMAIL: "admin@satukelas.com", ADMIN_PASSWORD: "short" } }), /ADMIN_PASSWORD/);

  const password = " FirstBootstrapAdmin2026! ";
  const created = await bootstrapAdmin({
    pool: empty.pool,
    env: { ADMIN_EMAIL: "  Admin@Satukelas.COM ", ADMIN_PASSWORD: password },
  });
  assert.deepEqual(created, { created: true, id: "usr_admin_01" });
  assert.ok(empty.calls.some(call => /pg_advisory_xact_lock/.test(call.sql) && call.values[0] === ACCOUNT_WRITE_LOCK_KEY));

  const admin = empty.users[0];
  assert.equal(admin.id, "usr_admin_01");
  assert.equal(admin.email, "admin@satukelas.com");
  assert.equal(admin.role, "ADMIN");
  assert.equal(admin.isActive, true);
  assert.match(admin.sessionVersion, /^[0-9a-f-]{36}$/i);
  assert.match(admin.passwordHash, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.ok(!admin.passwordHash.includes(password.trim()));
  const [, salt, key] = admin.passwordHash.split("$");
  assert.ok(timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(key, "hex")));

  const previous = { ...admin, email: "changed-admin@satukelas.com", passwordHash: "scrypt$custom", sessionVersion: "custom-session" };
  const existing = createFakeBootstrapPool([previous]);
  const skipped = await bootstrapAdmin({ pool: existing.pool, env: {} });
  assert.deepEqual(skipped, { created: false, id: "usr_admin_01" });
  assert.deepEqual(existing.users, [previous]);
});
