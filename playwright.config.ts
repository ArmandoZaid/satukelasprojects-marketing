import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3100";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL,
    channel: "msedge",
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/start-demo-server.mjs",
    url: `${baseURL}/login`,
    env: { PORT: new URL(baseURL).port || "3100" },
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
