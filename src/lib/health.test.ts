import { afterEach, expect, it, vi } from "vitest";
import * as dbClient from "./db/client";
import { GET } from "../app/api/health/route";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

it("returns a non-cached, public liveness result when database is not configured", async () => {
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("PGHOST", "");
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).toEqual({ status: "ok", service: "satukelas-marketing" });
});

it("verifies PostgreSQL connectivity when database is configured", async () => {
  vi.stubEnv("PGHOST", "127.0.0.1");
  vi.spyOn(dbClient, "getPool").mockReturnValue({
    query: vi.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] }),
  } as unknown as ReturnType<typeof dbClient.getPool>);
  const response = await GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok", service: "satukelas-marketing", database: "ok" });
});

it("returns 503 without leaking error details when configured PostgreSQL is unreachable", async () => {
  vi.stubEnv("PGHOST", "127.0.0.1");
  vi.spyOn(dbClient, "getPool").mockReturnValue({
    query: vi.fn().mockRejectedValue(new Error("password authentication failed for user secret-db-pass")),
  } as unknown as ReturnType<typeof dbClient.getPool>);
  const response = await GET();
  expect(response.status).toBe(503);
  const body = await response.json();
  expect(body).toEqual({ status: "error", service: "satukelas-marketing", database: "unavailable" });
  expect(JSON.stringify(body)).not.toContain("secret-db-pass");
});
