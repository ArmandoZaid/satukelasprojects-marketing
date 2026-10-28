import { test, expect } from "@playwright/test";

test.describe("Self-Service Account Settings & Business Card Generator (Neo-Brutalism)", () => {
  test("Admin can edit profile, view business card, and inspect member card in team list", async ({ page }) => {
    // 1. Admin Login
    await page.goto("/login");
    await page.getByLabel("Email akun").fill("admin@satukelas.com");
    await page.getByLabel("Kata Sandi").fill("AdminSatukelas2026!");
    await page.getByRole("button", { name: "Masuk ke workspace" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("ROLE: ADMIN")).toBeVisible();

    // 2. Navigate to Pengaturan
    await page.getByRole("link", { name: "Pengaturan" }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole("heading", { name: "Pengaturan akun", level: 1 })).toBeVisible();

    // Verify Neo-Brutalism Business Card is rendered
    await expect(page.getByRole("heading", { name: "Kartu nama saya" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Unduh PNG" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cetak kartu" })).toBeVisible();

    // Test front/back side switching on business card
    const frontTab = page.getByRole("tab", { name: "Depan" });
    const backTab = page.getByRole("tab", { name: "Belakang" });
    await expect(frontTab).toHaveAttribute("aria-selected", "true");
    await backTab.click();
    await expect(backTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("business-card-back")).toBeVisible();
    await frontTab.click();
    await expect(frontTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("business-card-front")).toBeVisible();

    // 3. Update Admin Profile
    await page.getByLabel("Nomor WhatsApp / telepon").fill("+62 811 9988 7766");
    await page.getByLabel("Jabatan").fill("Lead Administrator");
    await page.getByRole("button", { name: "Simpan perubahan" }).click();

    await expect(page.getByText("Profil berhasil diperbarui.")).toBeVisible();

    // 4. Navigate to Tim Marketing and check Member Business Card dialog
    await page.getByRole("link", { name: "Tim marketing" }).click();
    await expect(page).toHaveURL(/\/members/);

    const yunusCardBtn = page.getByRole("button", { name: "Kartu nama Yunus" });
    await expect(yunusCardBtn).toBeVisible();
    await yunusCardBtn.click();

    // Verify modal dialog opened
    await expect(page.getByRole("heading", { name: "Kartu nama: Yunus" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tutup dialog" })).toBeVisible();
    await page.getByRole("button", { name: "Tutup dialog" }).click();
    await expect(page.getByRole("heading", { name: "Kartu nama: Yunus" })).not.toBeVisible();
  });

  test("Marketer can access self-service settings, update profile & password, but cannot access team management", async ({ page }) => {
    // 1. Marketer Login
    await page.goto("/login");
    await page.getByLabel("Email akun").fill("marketer@satukelas.com");
    await page.getByLabel("Kata Sandi").fill("MarketerSatukelas2026!");
    await page.getByRole("button", { name: "Masuk ke workspace" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("ROLE: MARKETER", { exact: true })).toBeVisible();

    // 2. Marketer has no access to /members or /settings in main marketing menu
    await expect(page.getByRole("link", { name: "Tim marketing" })).not.toBeVisible();
    await expect(page.locator('nav[aria-label="Menu marketing"] a')).toHaveCount(6);

    // If marketer tries direct URL to /members or /settings, access is blocked with 403 Akses ditolak
    const resMembers = await page.goto("/members");
    expect(resMembers?.status()).toBe(403);
    await expect(page.locator("body")).toContainText("Akses ditolak");

    const resSettings = await page.goto("/settings");
    expect(resSettings?.status()).toBe(403);
    await expect(page.locator("body")).toContainText("Akses ditolak");

    // 3. Marketer opens self-service Pengaturan Akun from sidebar profile modal
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Pengaturan akun" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator("#crm-dialog-title")).toHaveText("Pengaturan akun");
    await expect(page.getByLabel("Email akun")).toHaveValue("marketer@satukelas.com");

    // 4. Update Marketer Phone & Title
    await page.getByLabel("Nomor WhatsApp / telepon").fill("+62 812 3344 5566");
    await page.getByLabel("Jabatan").fill("Senior Partnership Specialist");
    await page.getByRole("button", { name: "Simpan perubahan" }).click();
    await expect(page.getByText("Profil berhasil diperbarui.")).toBeVisible();

    // 5. Switch to Keamanan tab and change password
    const securityTab = page.getByRole("tab", { name: "Keamanan" });
    await securityTab.click();
    await expect(securityTab).toHaveAttribute("aria-selected", "true");

    await page.getByLabel("Kata sandi saat ini").fill("MarketerSatukelas2026!");
    await page.getByLabel("Kata sandi baru", { exact: true }).fill("YunusBaru2026!Strong");
    await page.getByLabel("Konfirmasi kata sandi baru").fill("YunusBaru2026!Strong");
    await page.getByRole("button", { name: "Ganti kata sandi" }).click();
    await expect(page.getByText("Kata sandi berhasil diperbarui.")).toBeVisible();

    // 6. Restore password immediately to preserve test isolation across Playwright suites
    await page.getByLabel("Kata sandi saat ini").fill("YunusBaru2026!Strong");
    await page.getByLabel("Kata sandi baru", { exact: true }).fill("MarketerSatukelas2026!");
    await page.getByLabel("Konfirmasi kata sandi baru").fill("MarketerSatukelas2026!");
    await page.getByRole("button", { name: "Ganti kata sandi" }).click();
    await expect(page.getByText("Kata sandi berhasil diperbarui.")).toBeVisible();

    // Close settings dialog
    await page.getByRole("button", { name: "Tutup dialog" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 7. Marketer opens own business card modal from sidebar
    await page.getByRole("button", { name: "Kartu nama saya" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Kartu nama:/i })).toBeVisible();
    await expect(page.getByTestId("business-card-front")).toBeVisible();
    await expect(page.getByText("Senior Partnership Specialist")).toBeVisible();

    // Close card dialog
    await page.getByRole("button", { name: "Tutup dialog" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Session remains active and refreshed!
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("ROLE: MARKETER", { exact: true })).toBeVisible();
  });
});
