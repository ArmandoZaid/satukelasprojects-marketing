import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

const memberEmail = `rian.${randomUUID()}@example.invalid`;

// Sample 1x1 transparent PNG data URI for avatar testing
const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

test.describe("Admin Marketing Member Management (CRUD, Avatar, Reset Password, RBAC)", () => {
  let tempAvatarPath: string;

  test.beforeAll(() => {
    // Create a temporary PNG image file for file upload testing
    tempAvatarPath = path.join(process.cwd(), "e2e-temp-avatar.png");
    fs.writeFileSync(tempAvatarPath, Buffer.from(SAMPLE_PNG_BASE64, "base64"));
  });

  test.afterEach(async ({ page }) => {
    const response = await page.request.get("/api/admin/members");
    if (response.ok()) {
      const { members } = await response.json();
      const member = members.find((item: { email: string }) => item.email === memberEmail);
      if (member) await page.request.delete(`/api/admin/members/${member.id}`);
    }
  });

  test.afterAll(() => {
    if (fs.existsSync(tempAvatarPath)) {
      try {
        fs.unlinkSync(tempAvatarPath);
      } catch {
        // ignore cleanup error
      }
    }
  });

  test("full CRUD workflow: create member with avatar, edit, reset password, login verification, delete, and RBAC", async ({
    page,
    browser,
  }) => {
    // 1. Admin login
    await page.goto("/login");
    await page.getByLabel("Email akun").fill("admin@satukelas.com");
    await page.getByLabel("Kata Sandi").fill("AdminSatukelas2026!");
    await page.getByRole("button", { name: "Masuk ke workspace" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("ROLE: ADMIN")).toBeVisible();

    // 2. Navigate to Tim Marketing via sidebar
    const memberLink = page.getByRole("link", { name: "Tim marketing" });
    await expect(memberLink).toBeVisible();
    await memberLink.click();

    await expect(page).toHaveURL(/\/members/);
    await expect(page.getByRole("heading", { name: "Tim & Member Marketing" })).toBeVisible();

    // The member total includes MARKETER accounts, not the administrator.
    const initial = await (await page.request.get("/api/admin/members")).json();
    await expect(page.getByTestId("total-members-count")).toHaveText(String(initial.members.length));
    await expect(page.getByTestId("member-row-usr_mkt_01")).toContainText("Yunus");
    await expect(page.getByTestId("member-row-usr_mkt_02")).toContainText("Dzaky");

    // 3. Tambah Member baru dengan avatar
    await page.getByRole("button", { name: "Tambah member" }).first().click();
    await expect(page.getByRole("heading", { name: "Tambah Member Marketing" })).toBeVisible();

    await page.getByLabel("Nama Lengkap PIC *").fill("Rian Marketing Test");
    await page.getByLabel("Alamat Email Aktif *").fill(memberEmail);
    await page.getByLabel("Nomor Telepon / WhatsApp").fill("081234567899");
    await page.getByLabel("Alamat Tempat Tinggal").fill("Jl. Contoh 10\nSurabaya");
    await page.getByLabel("Kata Sandi Awal *").fill("RianPassword2026!");

    // Upload avatar photo
    const fileChooserInput = page.locator("#member-avatar-upload");
    await fileChooserInput.setInputFiles(tempAvatarPath);

    // Verify avatar preview is displayed
    await expect(page.locator(".crm-avatar-img-preview")).toBeVisible();

    // Submit form
    await page.locator('form').getByRole("button", { name: "Tambah Member", exact: true }).click();

    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Verify member added to table
    const rianRowInitial = page.locator("tr", { hasText: memberEmail });
    await expect(rianRowInitial.getByText("Rian Marketing Test", { exact: true })).toBeVisible();
    await expect(page.getByText(memberEmail)).toBeVisible();
    await expect(rianRowInitial.getByRole("link", { name: /Landing page/i })).toBeVisible();
    await expect(rianRowInitial.getByRole("link", { name: /Landing page/i })).toHaveAttribute("target", "_blank");

    // Verify columns for phone & address are NOT in the table headers or cells
    const tableHeader = page.locator(".crm-table thead");
    await expect(tableHeader).not.toContainText("Nomor telepon");
    await expect(tableHeader).not.toContainText("Alamat tempat tinggal");
    await expect(rianRowInitial).not.toContainText("081234567899");
    await expect(rianRowInitial).not.toContainText("Jl. Contoh 10");

    // Verify Detail CTA button opens modal with complete account information
    const detailBtn = rianRowInitial.getByRole("button", { name: /Detail/i });
    await expect(detailBtn).toBeVisible();
    await detailBtn.click();

    const detailDialog = page.getByRole("dialog");
    await expect(detailDialog).toBeVisible();
    await expect(page.getByRole("heading", { name: /Detail Akun Member: Rian/i })).toBeVisible();
    const detailDl = page.getByTestId("member-detail-dl");
    await expect(detailDl).toContainText("081234567899");
    await expect(detailDl).toContainText("Jl. Contoh 10");
    await expect(detailDl).toContainText(memberEmail);
    await expect(detailDialog.getByRole("button", { name: /Edit Akun/i })).toBeVisible();
    await page.screenshot({ path: "test-results/member-detail-modal-desktop.png" });
    await page.getByRole("button", { name: "Tutup", exact: true }).click();
    await expect(detailDialog).toHaveCount(0);

    await page.reload();

    const { members: contacts } = await (await page.request.get("/api/admin/members")).json();
    const contact = contacts.find((item: { email: string }) => item.email === memberEmail);
    for (const route of ["tim", "m"]) {
      const publicHtml = await (await page.request.get(`/${route}/${contact.id}`)).text();
      expect(publicHtml).not.toContain("Jl. Contoh 10");
      expect(publicHtml).not.toContain('passwordHash');
      expect(publicHtml).not.toContain('sessionVersion');
    }
    await page.getByTestId("member-row-usr_mkt_01").getByRole("button", { name: /Edit/i }).click();
    await expect(page.getByLabel("Alamat Tempat Tinggal")).toHaveValue("");
    await page.getByRole("button", { name: "Tutup dialog" }).click();
    await page.screenshot({ path: "test-results/member-contact-desktop.png", fullPage: true });
    for (const width of [375, 768]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      await page.getByRole("button", { name: "Tambah member" }).first().click();
      await expect(page.getByLabel("Nomor Telepon / WhatsApp")).toBeVisible();
      await expect(page.getByLabel("Alamat Tempat Tinggal")).toBeVisible();
      await page.getByLabel("Nomor Telepon / WhatsApp").fill("bukan nomor");
      expect(await page.getByLabel("Nomor Telepon / WhatsApp").evaluate((el: HTMLInputElement) => el.checkValidity())).toBe(false);
      await page.getByLabel("Nomor Telepon / WhatsApp").fill("+62 (812) 3456-7890");
      expect(await page.getByLabel("Nomor Telepon / WhatsApp").evaluate((el: HTMLInputElement) => el.checkValidity())).toBe(true);
      await page.screenshot({ path: `test-results/member-contact-form-${width}.png` });
      await page.getByRole("button", { name: "Tutup dialog" }).click();
    }
    await page.setViewportSize({ width: 1440, height: 1000 });

    // 4. Verify new member can login
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();

    await memberPage.goto("/login");
    await memberPage.getByLabel("Email akun").fill(memberEmail);
    await memberPage.getByLabel("Kata Sandi").fill("RianPassword2026!");
    await memberPage.getByRole("button", { name: "Masuk ke workspace" }).click();

    await expect(memberPage).toHaveURL(/\/dashboard/);
    await expect(memberPage.getByText("ROLE: MARKETER")).toBeVisible();
    await expect(memberPage.getByRole("link", { name: "Buka landing page saya" })).toBeVisible();

    // Marketer only sees 6 menu items, no Tim marketing or Pengaturan
    const marketerNav = memberPage.locator('nav[aria-label="Menu marketing"] a');
    await expect(marketerNav).toHaveCount(6);
    await expect(memberPage.getByRole("link", { name: "Tim marketing" })).toHaveCount(0);
    await expect(memberPage.getByRole("link", { name: "Pengaturan" })).toHaveCount(0);

    // Marketer directly hitting /members gets 403 Forbidden
    const forbiddenRes = await memberPage.goto("/members");
    expect(forbiddenRes?.status()).toBe(403);
    await expect(memberPage.locator("body")).toContainText("Akses ditolak");

    await memberContext.close();

    // 5. Admin edits member details (change name, set inactive)
    const rianRow = page.locator("tr", { hasText: memberEmail });
    await rianRow.getByRole("button", { name: /Edit/i }).click();

    await expect(page.getByRole("heading", { name: /Edit Member:/i })).toBeVisible();
    await expect(page.getByLabel("Nomor Telepon / WhatsApp")).toHaveValue("081234567899");
    await expect(page.getByLabel("Alamat Tempat Tinggal")).toHaveValue("Jl. Contoh 10\nSurabaya");
    await page.getByLabel("Nomor Telepon / WhatsApp").fill("+62 812 3456 7800");
    await page.getByLabel("Alamat Tempat Tinggal").fill("Jl. Baru 20, Surabaya");
    await page.getByLabel("Nama Lengkap PIC *").fill("Rian Marketing Updated");
    await page.getByLabel("Status Akun *").selectOption("false"); // Nonaktif
    await page.getByRole("button", { name: "Simpan Perubahan" }).click();

    // Verify updated status in table
    await expect(page.locator("tr", { hasText: memberEmail }).getByText("Rian Marketing Updated", { exact: true })).toBeVisible();

    // Verify updated phone & address reflected in Detail modal
    await expect(page.locator("tr", { hasText: memberEmail })).not.toContainText("+62 812 3456 7800");
    await page.locator("tr", { hasText: memberEmail }).getByRole("button", { name: /Detail/i }).click();
    await expect(page.getByTestId("member-detail-dl")).toContainText("+62 812 3456 7800");
    await expect(page.getByTestId("member-detail-dl")).toContainText("Jl. Baru 20, Surabaya");
    await page.getByRole("button", { name: "Tutup", exact: true }).click();

    // 6. Member tries to log in while inactive -> blocked
    const inactiveContext = await browser.newContext();
    const inactivePage = await inactiveContext.newPage();
    await inactivePage.goto("/login");
    await inactivePage.getByLabel("Email akun").fill(memberEmail);
    await inactivePage.getByLabel("Kata Sandi").fill("RianPassword2026!");
    await inactivePage.getByRole("button", { name: "Masuk ke workspace" }).click();

    await expect(inactivePage.locator('.login-alert[role="alert"]')).toContainText("dinonaktifkan");
    await inactiveContext.close();

    // 7. Admin reactivates member and resets password
    const updatedRow = page.locator("tr", { hasText: memberEmail });
    await updatedRow.getByRole("button", { name: /Edit/i }).click();
    await page.getByLabel("Status Akun *").selectOption("true"); // Aktif kembali
    await page.getByLabel("Nomor Telepon / WhatsApp").fill("");
    await page.getByLabel("Alamat Tempat Tinggal").fill("");
    await page.getByRole("button", { name: "Simpan Perubahan" }).click();

    // Verify cleared contacts show "Belum diisi" in Detail modal
    await updatedRow.getByRole("button", { name: /Detail/i }).click();
    await expect(page.getByTestId("member-detail-dl").getByText("Belum diisi", { exact: true })).toHaveCount(2);
    await page.getByRole("button", { name: "Tutup", exact: true }).click();
    await page.reload();
    await updatedRow.getByRole("button", { name: /Edit/i }).click();
    await expect(page.getByLabel("Nomor Telepon / WhatsApp")).toHaveValue("");
    await expect(page.getByLabel("Alamat Tempat Tinggal")).toHaveValue("");
    await page.getByRole("button", { name: "Tutup dialog" }).click();

    // Reset password
    await updatedRow.getByRole("button", { name: /Reset Password/i }).click();
    await expect(page.getByRole("heading", { name: /Reset Kata Sandi:/i })).toBeVisible();

    await page.getByLabel("Kata Sandi Baru *", { exact: true }).fill("NewRianPassword2026!");
    await page.getByLabel("Ulangi Kata Sandi Baru *").fill("NewRianPassword2026!");
    await page.getByRole("button", { name: "Reset Kata Sandi" }).click();

    // 8. Verify login with old password fails, new password succeeds
    const newLoginContext = await browser.newContext();
    const newLoginPage = await newLoginContext.newPage();

    // Old password fails
    await newLoginPage.goto("/login");
    await newLoginPage.getByLabel("Email akun").fill(memberEmail);
    await newLoginPage.getByLabel("Kata Sandi").fill("RianPassword2026!");
    await newLoginPage.getByRole("button", { name: "Masuk ke workspace" }).click();
    await expect(newLoginPage.locator('.login-alert[role="alert"]')).toBeVisible();

    // New password succeeds
    await newLoginPage.getByLabel("Kata Sandi").fill("NewRianPassword2026!");
    await newLoginPage.getByRole("button", { name: "Masuk ke workspace" }).click();
    await expect(newLoginPage).toHaveURL(/\/dashboard/);
    await expect(newLoginPage.getByText("ROLE: MARKETER")).toBeVisible();

    await newLoginContext.close();

    // 9. Admin deletes member
    await page.goto("/members");
    const targetRow = page.locator("tr", { hasText: memberEmail });
    await targetRow.getByRole("button", { name: /Hapus/i }).click();

    await expect(page.getByRole("heading", { name: /Hapus Akun Member:/i })).toBeVisible();
    await page.getByRole("button", { name: "Ya, Hapus Member" }).click();

    // Verify member removed from table
    await expect(page.locator("tr", { hasText: memberEmail })).toHaveCount(0);

    // 10. Deleted member can no longer log in
    const deletedContext = await browser.newContext();
    const deletedPage = await deletedContext.newPage();
    await deletedPage.goto("/login");
    await deletedPage.getByLabel("Email akun").fill(memberEmail);
    await deletedPage.getByLabel("Kata Sandi").fill("NewRianPassword2026!");
    await deletedPage.getByRole("button", { name: "Masuk ke workspace" }).click();
    await expect(deletedPage.locator('.login-alert[role="alert"]')).toBeVisible();

    await deletedContext.close();
  });
});
