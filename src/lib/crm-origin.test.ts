import { afterEach, describe, expect, it, vi } from "vitest";
import { isAllowedOrigin } from "./crm-http";

const origin = "https://marketing.example.invalid";
function internalRequest(headers: Record<string, string> = {}) {
  return new Request("http://0.0.0.0:3000/api/account", { headers });
}

describe("explicit public origin behind container or TLS proxy", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts the configured HTTPS origin even when the internal URL is HTTP", () => {
    vi.stubEnv("APP_ORIGIN", origin);
    expect(isAllowedOrigin(origin, internalRequest())).toBe(true);
  });

  it("accepts the configured loopback mapped port for local Docker HTTP", () => {
    vi.stubEnv("APP_ORIGIN", "http://127.0.0.1:3106");
    expect(isAllowedOrigin("http://127.0.0.1:3106", internalRequest())).toBe(true);
  });

  it.each([
    "https://evil.invalid", "http://marketing.example.invalid", "https://marketing.example.invalid:444",
    "https://marketing.example.invalid/", "https://user@marketing.example.invalid", "null",
    "http://0.0.0.0:3000",
  ])("denies unconfigured or malformed origin %s despite spoofed forwarding headers", (untrusted) => {
    vi.stubEnv("APP_ORIGIN", origin);
    expect(isAllowedOrigin(untrusted, internalRequest({ Host: "evil.invalid", "X-Forwarded-Host": "evil.invalid", "X-Forwarded-Proto": "https" }))).toBe(false);
  });

  it("rejects cross-site fetch metadata even for the configured origin", () => {
    vi.stubEnv("APP_ORIGIN", origin);
    expect(isAllowedOrigin(origin, internalRequest({ "Sec-Fetch-Site": "cross-site" }))).toBe(false);
  });

  it.each(["not-a-url", "https://user@example.invalid", "https://marketing.example.invalid/path", "https://marketing.example.invalid/"])("fails closed on malformed APP_ORIGIN %s", (configured) => {
    vi.stubEnv("APP_ORIGIN", configured);
    expect(isAllowedOrigin(origin, internalRequest())).toBe(false);
  });

  it("preserves direct-server behavior when no public origin is configured", () => {
    vi.stubEnv("APP_ORIGIN", "");
    const request = new Request("http://127.0.0.1:3100/api/account");
    expect(isAllowedOrigin("http://localhost:3100", request)).toBe(true);
    expect(isAllowedOrigin("http://evil.invalid", request)).toBe(false);
  });
});
