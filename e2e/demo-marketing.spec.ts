import { test, expect } from "@playwright/test";

test("demo marketing account (Yunus) logs in, sees 6 screens and own data, blocked from settings", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email akun").fill("marketer@satukelas.com");
  await page.getByLabel("Kata Sandi").fill("MarketerSatukelas2026!");
  await page.getByRole("button", { name: "Masuk ke workspace" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard marketing" })).toBeVisible();
  await expect(page.getByText("ROLE: MARKETER")).toBeVisible();
  await expect(page.locator(".crm-topbar-user")).toHaveText("marketer@satukelas.com");

  // Verify only 6 marketing screens in sidebar
  const navLinks = page.locator('nav[aria-label="Menu marketing"] a');
  await expect(navLinks).toHaveCount(6);
  await expect(page.getByRole("link", { name: "Pengaturan" })).toHaveCount(0);

  // Marketing user only sees Yunus's data in reports
  await page.goto("/reports");
  await expect(page.locator(".crm-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".crm-table tbody tr")).toContainText("Yunus");

  // Check /api/crm directly via request context - all opportunities belong to usr_mkt_01
  const res = await page.request.get("/api/crm");
  expect(res.status()).toBe(200);
  const data = await res.json();
  expect(data.opportunities.length).toBeGreaterThan(0);
  expect(data.opportunities.every((o: { ownerId: string }) => o.ownerId === "usr_mkt_01")).toBe(true);

  // Directly hitting /settings returns 403 forbidden
  const settingsRes = await page.goto("/settings");
  expect(settingsRes?.status()).toBe(403);
  await expect(page.locator("body")).toContainText("Akses ditolak");

  // Directly hitting /admin returns 403 forbidden
  const adminRes = await page.goto("/admin");
  expect(adminRes?.status()).toBe(403);
  await expect(page.locator("body")).toContainText("Akses ditolak");

  // Re-navigate to dashboard and logout
  await page.goto("/dashboard");
  await page.locator(".crm-logout-action").click();
  await expect(page).toHaveURL(/\/login/);
});

test("two marketing accounts have strictly isolated server datasets", async ({ playwright, baseURL }) => {
  const yunus = await playwright.request.newContext({ baseURL });
  const dzaky = await playwright.request.newContext({ baseURL });

  // Login Yunus
  const res1 = await yunus.post("/api/auth/login", {
    data: { email: "marketer@satukelas.com", password: "MarketerSatukelas2026!" },
  });
  expect(res1.status()).toBe(200);

  // Login Dzaky
  const res2 = await dzaky.post("/api/auth/login", {
    data: { email: "dzaky@satukelas.com", password: "MarketerSatukelas2026!" },
  });
  expect(res2.status()).toBe(200);

  // Fetch CRM data for both
  const dataYunus = await (await yunus.get("/api/crm")).json();
  const dataDzaky = await (await dzaky.get("/api/crm")).json();

  expect(dataYunus.opportunities.length).toBeGreaterThan(0);
  expect(dataDzaky.opportunities.length).toBeGreaterThan(0);

  // Yunus only sees usr_mkt_01
  expect(dataYunus.opportunities.every((o: { ownerId: string }) => o.ownerId === "usr_mkt_01")).toBe(true);

  // Dzaky only sees usr_mkt_02
  expect(dataDzaky.opportunities.every((o: { ownerId: string }) => o.ownerId === "usr_mkt_02")).toBe(true);

  // Cross attempt: Yunus passes ownerId=usr_mkt_02 in query params - server must ignore and enforce usr_mkt_01
  const spoofed = await (await yunus.get("/api/crm?ownerId=usr_mkt_02")).json();
  expect(spoofed.opportunities.every((o: { ownerId: string }) => o.ownerId === "usr_mkt_01")).toBe(true);

  await yunus.dispose();
  await dzaky.dispose();
});
