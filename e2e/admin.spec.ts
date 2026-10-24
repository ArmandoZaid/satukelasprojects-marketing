import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

test("admin preview opens action-first dashboard with computed snapshot", async ({ page }) => {
  await page.goto("/preview/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard marketing" })).toBeVisible();
  await expect(page.getByTestId("active-count")).toHaveText("24");
  await expect(page.getByTestId("pipeline-value")).toHaveText("Rp184.800.000");
  await expect(page.getByRole("button", { name: /^Catat hasil/ })).toHaveCount(4);
});

test("filters survive navigation and an empty period offers recovery", async ({ page }) => {
  await page.goto("/preview/dashboard");
  await page.getByLabel("Filter PIC", { exact: true }).selectOption("Yunus");
  await expect(page).toHaveURL(/owner=Yunus/);
  await expect(page.getByTestId("active-count")).toHaveText("6");
  await page.getByRole("link", { name: "Sekolah & peluang", exact: true }).click();
  await expect(page).toHaveURL(/\/preview\/opportunities/);
  await expect(page.getByRole("heading", { name: "Sekolah & peluang", exact: true })).toBeVisible();
  await expect(page.getByLabel("Filter PIC", { exact: true })).toHaveValue("Yunus");
  await page.getByLabel("Filter Periode", { exact: true }).selectOption("2027/2028");
  await expect(page.getByRole("heading", { name: "Tidak ada peluang yang cocok" })).toBeVisible();
  await page.getByRole("button", { name: "Reset filter" }).first().click();
  await expect(page.getByRole("heading", { name: "Tidak ada peluang yang cocok" })).toHaveCount(0);
});

test("recording results updates queue and history without backend writes", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", r => { if (!["GET", "HEAD"].includes(r.method())) writes.push(r.url()); });
  await page.goto("/preview/dashboard");
  await page.getByRole("button", { name: "Catat hasil SMA Contoh Cakrawala", exact: true }).click();
  const d = page.getByRole("dialog");
  await expect(d).toBeVisible();
  await d.getByLabel("Ringkasan hasil", { exact: false }).fill("Sekolah contoh setuju pertemuan simulasi.");
  await d.getByLabel("Tindak lanjut berikutnya", { exact: false }).fill("Pertemuan contoh");
  await d.getByLabel("Tanggal tindak lanjut", { exact: true }).fill("2026-10-20");
  await d.getByRole("button", { name: "Simpan contoh" }).click();
  await expect(d).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Catat hasil/ })).toHaveCount(3);
  await expect(page.getByRole("status")).toContainText("diperbarui bersama");
  await page.getByRole("link", { name: "Aktivitas", exact: true }).click();
  await expect(page.getByText("Sekolah contoh setuju pertemuan simulasi.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Sekolah contoh setuju pertemuan simulasi.", { exact: true })).toHaveCount(0);
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("intake, stage validation, terminal outcome and reset work locally", async ({ page }) => {
  await page.goto("/preview/opportunities");
  await page.getByRole("button", { name: "Tambah prospek", exact: true }).click();
  let d = page.getByRole("dialog");
  await d.getByLabel("Nama sekolah contoh", { exact: false }).fill("SMA Contoh Pengujian");
  await d.getByLabel("Estimasi Rp", { exact: false }).fill("15000000");
  await d.getByRole("button", { name: "Simpan contoh" }).click();
  await page.getByLabel("Cari sekolah", { exact: true }).fill("Pengujian");
  await page.getByRole("button", { name: "SMA Contoh Pengujian", exact: true }).click();
  await page.getByRole("button", { name: "Ubah tahap", exact: true }).click();
  d = page.getByRole("dialog");
  await d.getByLabel("Tahap baru", { exact: false }).selectOption("Negotiation");
  await d.getByRole("button", { name: "Simpan contoh" }).click();
  await expect(d.getByRole("alert")).toContainText("Alasan wajib");
  await d.getByLabel("Alasan", { exact: false }).fill("Simulasi loncat tahap.");
  await d.getByLabel("Tahap baru", { exact: false }).selectOption("Won");
  await d.getByLabel("Nilai final Rp", { exact: false }).fill("14500000");
  await d.getByLabel("Referensi kesepakatan", { exact: false }).fill("Dokumen fiktif QA");
  await d.getByRole("button", { name: "Simpan contoh" }).click();
  await page.getByRole("button", { name: "SMA Contoh Pengujian", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Status terminal");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Pengaturan", exact: true }).click();
  await page.getByRole("button", { name: "Reset data contoh", exact: true }).click();
  await page.getByRole("button", { name: "Ya, reset contoh" }).click();
  await expect(page.getByRole("status")).toContainText("snapshot awal");
});

for (const width of [320,390,768,1024,1440,1600]) {
  test(`responsive admin and accessible controls at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if(m.type() === "error") errors.push(m.text()); });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/preview/dashboard");
    await expect(page.getByTestId("active-count")).toHaveText("24");
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(a11y.violations).toEqual([]);
    if (width < 700) {
      await page.getByRole("button", { name: "Buka menu marketing" }).click();
      await expect(page.getByRole("link", { name: "Sekolah & peluang", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Buka menu marketing" }).click();
    }
    await mkdir("test-results/admin-evidence", { recursive: true });
    await page.screenshot({ path: `test-results/admin-evidence/dashboard-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "Tambah prospek", exact: true }).click();
    const dialogAudit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(dialogAudit.violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Tambah prospek", exact: true })).toBeFocused();
    expect(errors).toEqual([]);
  });
}

test("every admin screen responds, has no overflow or runtime errors", async ({ page }) => {
  const failures: string[] = [];
  page.on("pageerror", e => failures.push(e.message));
  page.on("requestfailed", r => failures.push(r.url()));
  page.on("response", r => { if(r.status() >= 400) failures.push(`${r.status()} ${r.url()}`); });
  for (const width of [390,1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const screen of ["opportunities","pipeline","follow-ups","activities","reports","settings"]) {
      const response = await page.goto(`/preview/${screen}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(audit.violations).toEqual([]);
    }
  }
  expect(failures).toEqual([]);
});

