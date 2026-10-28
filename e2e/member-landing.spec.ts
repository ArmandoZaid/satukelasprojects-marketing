import { test, expect } from "@playwright/test";

test.describe("MKT-FR-021: Landing Page Publik Member Marketing & Etalase Produk", () => {
  test("mempertahankan profil dan header produk tanpa grid statis atau bundling pada /tim/yunus", async ({ page }) => {
    await page.goto("/tim/yunus");
    await page.waitForLoadState("networkidle");

    // Header & Badge Verifikasi
    await expect(page.locator("text=PIC RESMI TERVERIFIKASI")).toBeVisible();
    await expect(page.locator("text=Official Marketer")).toBeVisible();
    await expect(page.locator("text=Yunus").first()).toBeVisible();

    // Hero Section
    await expect(page.locator("h1")).toContainText("Yunus");
    await expect(page.locator("#produk h2")).toHaveText("Karya Kenangan & Solusi Media Sekolah");
    await expect(page.locator("text=KATALOG RESMI SATUKELAS PROJECTS")).toBeVisible();
    await expect(page.locator("#produk > div > div:nth-child(2)")).toHaveCount(0);
    await expect(page.locator("#produk h3")).toHaveCount(0);
    await expect(page.locator("#produk")).not.toContainText("Estimasi Biaya:");
    await expect(page.locator("#paket")).toHaveCount(0);
    await expect(page.locator('a[href="#paket"]')).toHaveCount(0);
    await expect(page.getByText("PAKET BUNDLING ANGKATAN", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Paket Starter|Paket Populer|Paket All-in-One/ })).toHaveCount(0);

    // 5 Alur Kerja
    await expect(page.locator("text=5 Langkah Mudah Bikin Buku Tahunan")).toBeVisible();
    await expect(page.locator("text=Ngobrol Santai & Konsultasi")).toBeVisible();
    await expect(page.locator("text=Bawakan Sampel Fisik ke Sekolah")).toBeVisible();

    // Lead Form & WhatsApp Attribution
    const leadForm = page.locator("#konsultasi");
    await expect(leadForm).toBeVisible();
    const previewBox = page.locator("pre");
    await expect(previewBox).toContainText("usr_mkt_01 - Yunus");
  });

  test("mendukung akses via alias rute pendek /m/yunus dan /m/dzaky", async ({ page }) => {
    // Alias /m/yunus
    await page.goto("/m/yunus");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Yunus");

    // Alias /m/dzaky
    await page.goto("/m/dzaky");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Dzaky");
    await expect(page.locator("pre")).toContainText("usr_mkt_02 - Dzaky");
    await expect(page.locator("#produk > div > div:nth-child(2)")).toHaveCount(0);
    await expect(page.locator("#paket")).toHaveCount(0);
    await expect(page.locator('a[href="#paket"]')).toHaveCount(0);
  });

  test("form konsultasi tidak menawarkan bundling All-in-One", async ({ page }) => {
    await page.goto("/tim/yunus");
    await expect(page.locator("#service-select option")).toHaveCount(4);
    await expect(page.locator("#service-select")).not.toContainText("All-in-One");
  });

  test("formulir konsultasi responsif mengupdate live preview pesan WhatsApp", async ({ page }) => {
    await page.goto("/tim/yunus");
    await page.waitForLoadState("networkidle");

    const schoolInput = page.locator("#school-name");
    const contactInput = page.locator("#contact-name");
    const previewBox = page.locator("pre");

    await schoolInput.fill("SMA Negeri 1 Surabaya");
    await contactInput.fill("Rizky");

    await expect(previewBox).toContainText("Rizky");
    await expect(previewBox).toContainText("SMA Negeri 1 Surabaya");
    await expect(previewBox).toContainText("Ref: usr_mkt_01 - Yunus");

    // CTA WhatsApp Button
    const waButton = page.locator("a:has-text('KIRIM KE WHATSAPP KAK YUNUS')");
    await expect(waButton).toBeVisible();
    const href = await waButton.getAttribute("href");
    expect(href).toContain("https://wa.me/6281234567890?text=");
    expect(href).toContain("SMA%20Negeri%201%20Surabaya");
    expect(href).toContain("usr_mkt_01");
  });

  test("mengembalikan 404 jika slug member tidak ditemukan atau status tidak aktif", async ({ page }) => {
    const response = await page.goto("/tim/member-yang-tidak-ada-999");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toContainText("tidak ditemukan");
  });

  test("tampilan ramah mobile pada viewport 390px tanpa horizontal scroll overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tim/yunus");
    await page.waitForLoadState("networkidle");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("#produk")).toBeVisible();
    await expect(page.locator("#produk > div > div:nth-child(2)")).toHaveCount(0);
    await expect(page.locator("#paket")).toHaveCount(0);
    await expect(page.locator("#konsultasi")).toBeVisible();
  });
});
