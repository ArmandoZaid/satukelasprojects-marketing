import { afterEach, describe, expect, it, vi } from "vitest";
import { closeDatabase, getDatabase, getPool, isDatabaseConfigured } from "./client";

afterEach(async () => {
  await closeDatabase();
  vi.unstubAllEnvs();
});

describe("lazy PostgreSQL client", () => {
  it("can be imported during build with no database environment", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("PGHOST", "");
    expect(isDatabaseConfigured()).toBe(false);
    expect(() => getPool()).toThrow(/not configured/);
    await expect(closeDatabase()).resolves.toBeUndefined();
  });

  it("shares one bounded pool and typed database without opening network connections", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("PGHOST", "127.0.0.1");
    vi.stubEnv("PGPORT", "1");
    expect(isDatabaseConfigured()).toBe(true);
    const pool = getPool();
    expect(getPool()).toBe(pool);
    expect(pool.options.max).toBe(10);
    expect(pool.options.connectionTimeoutMillis).toBe(5000);
    expect(pool.totalCount).toBe(0);
    expect(getDatabase()).toBe(getDatabase());
    expect(getDatabase().query.users).toBeDefined();
    expect(pool.totalCount).toBe(0);
    await closeDatabase();
    expect(getPool()).not.toBe(pool);
  });
});
