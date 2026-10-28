import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const proofDir = path.resolve("test-results/ui-review");

async function expectSidebarFits(page: import("@playwright/test").Page) {
  const bounds = await page.locator(".crm-sidebar").evaluate(sidebar => {
    const rect = sidebar.getBoundingClientRect();
    const selectors = [".crm-workspace", ".crm-profile", ".crm-role-tag", ".crm-sidebar-actions .crm-button", "nav a"];
    const items = Array.from(sidebar.querySelectorAll(selectors.join(","))).map(element => {
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, width: box.width, label: element.textContent?.trim() };
    });
    const nav = sidebar.querySelector("nav")!.getBoundingClientRect();
    const footer = sidebar.querySelector(".crm-sidebar-bottom")!.getBoundingClientRect();
    return { left: rect.left, right: rect.right, items, gap: footer.top - nav.bottom, overflow: sidebar.scrollWidth - sidebar.clientWidth };
  });
  expect(bounds.overflow).toBeLessThanOrEqual(1);
  expect(bounds.gap).toBeGreaterThanOrEqual(12);
  for (const item of bounds.items) {
    expect(item.left, item.label).toBeGreaterThanOrEqual(bounds.left + 10);
    expect(item.right, item.label).toBeLessThanOrEqual(bounds.right - 8);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}

for (const role of ["admin", "marketer"] as const) {
 test(`${role} sidebar stays inside its padded layout across desktop, tablet and phone`, async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email akun").fill(`${role}@satukelas.com`);
  const source = fs.readFileSync(path.resolve("e2e/account.spec.ts"), "utf8");
  const fixturePasswords = [...source.matchAll(/getByLabel\("Kata Sandi"\)\.fill\("([^"]+)"\)/g)];
  const fixturePassword = fixturePasswords[role === "admin" ? 0 : 1][1];
  await page.getByLabel("Kata Sandi").fill(fixturePassword);
  await page.getByRole("button", { name: "Masuk ke workspace" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  fs.mkdirSync(proofDir, { recursive: true });
  for (const [width, height] of [[1440, 1000], [1024, 768], [768, 1024], [375, 900], [320, 800]]) {
    await page.setViewportSize({ width, height });
    if (width <= 700) {
      await page.getByRole("button", { name: "Buka menu marketing" }).click();
    }
    await expectSidebarFits(page);
    await page.screenshot({ path: path.join(proofDir, `sidebar-${role}-${width}.png`), fullPage: true });
    if (width <= 700) {
      await page.getByRole("link", { name: "Dashboard", exact: true }).click();
      await expect(page.locator(".crm-sidebar")).not.toBeVisible();
    }
  }
 });
}

test("member CTA opens the matching public landing and the card uses separated paper and accent colors", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByLabel("Email akun").fill("admin@satukelas.com");
  const source = fs.readFileSync(path.resolve("e2e/account.spec.ts"), "utf8");
  const fixturePassword = source.match(/getByLabel\("Kata Sandi"\)\.fill\("([^"]+)"\)/)![1];
  await page.getByLabel("Kata Sandi").fill(fixturePassword);
  await page.getByRole("button", { name: "Masuk ke workspace" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByRole("link", { name: "Tim marketing" }).click();
  const cta = page.getByRole("link", { name: "Landing page Yunus", exact: true });
  await expect(cta).toHaveAttribute("href", "/tim/usr_mkt_01");
  const popupEvent = context.waitForEvent("page");
  await cta.click();
  const publicPage = await popupEvent;
  await publicPage.waitForLoadState("networkidle");
  await expect(publicPage).toHaveURL(/\/tim\/usr_mkt_01$/);
  await expect(publicPage.getByRole("heading", { level: 1 })).toContainText("Yunus");
  await publicPage.close();
  await page.getByRole("button", { name: "Kartu nama Yunus", exact: true }).click();
  const card = page.getByRole("dialog");
  const cardCta = card.getByRole("link", { name: "Buka landing page Yunus", exact: true });
  await expect(cardCta).toHaveAttribute("href", /\/tim\/usr_mkt_01$/);
  await expect(cardCta).toHaveCSS("background-color", "rgb(65, 80, 177)");
  await expect(card.getByRole("button", { name: "Unduh PNG", exact: true })).toBeEnabled();
  fs.mkdirSync(proofDir, { recursive: true });
  await page.screenshot({ path: path.join(proofDir, "card-front-desktop.png"), fullPage: true });
  const pixel = await card.getByTestId("business-card-front").locator("canvas").evaluate(canvas =>
    Array.from((canvas as HTMLCanvasElement).getContext("2d")!.getImageData(500, 400, 1, 1).data));
  expect(pixel).toEqual([255, 253, 249, 255]);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.screenshot({ path: path.join(proofDir, "card-front-mobile.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await card.getByRole("tab", { name: "Belakang", exact: true }).click();
  await page.screenshot({ path: path.join(proofDir, "card-back-mobile.png"), fullPage: true });
});
