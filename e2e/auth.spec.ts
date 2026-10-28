import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Admin Authentication & Role-Based Route Protection", () => {
  test("unauthenticated access to admin routes redirects to /login", async ({ page }) => {
    // 1. Coba akses /dashboard langsung tanpa session
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?unauthorized=true/);
    await expect(page.getByRole("heading", { name: "Masuk ke Web Admin" })).toBeVisible();
    await expect(page.locator(".login-alert")).toContainText("Sesi Anda belum aktif");

    // 2. Coba akses rute admin lainnya tanpa session
    for (const path of ["/opportunities", "/pipeline", "/follow-ups", "/reports", "/settings"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login\?unauthorized=true/);
    }
  });

  test("login page meets WCAG accessibility guidelines", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Masuk ke Web Admin" })).toBeVisible();
    const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(a11y.violations).toEqual([]);
  });

  test("rejected login with invalid credentials or wrong password", async ({ page }) => {
    await page.goto("/login");

    // Masukkan email salah / password salah
    await page.getByLabel("Email akun").fill("admin@satukelas.com");
    await page.getByLabel("Kata Sandi").fill("PasswordSalah123!");
    await page.getByRole("button", { name: "Masuk ke workspace" }).click();

    // Muncul pesan error kredensial tidak cocok
    await expect(page.locator(".login-alert")).toBeVisible();
    await expect(page.locator(".login-alert")).toContainText("Email atau kata sandi tidak valid");
    expect(page.url()).toContain("/login");
  });

  test("successful admin login opens dashboard with authenticated state and logout clears session", async ({ page }) => {
    await page.goto("/login");

    // Gunakan kredensial default admin resmi
    await page.getByLabel("Email akun").fill("admin@satukelas.com");
    await page.getByLabel("Kata Sandi").fill("AdminSatukelas2026!");
    await page.getByRole("button", { name: "Masuk ke workspace" }).click();

    // Otomatis diarahkan ke /dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: "Dashboard marketing" })).toBeVisible();

    // Cek elemen sesi admin terverifikasi
    await expect(page.getByText("Sesi Admin Terverifikasi")).toBeVisible();
    await expect(page.getByText("ROLE: ADMIN")).toBeVisible();
    await expect(page.locator(".crm-topbar-user")).toHaveText("admin@satukelas.com");
    await expect(page.getByText(/Autentikasi role ADMIN berhasil/)).toBeVisible();

    // Navigasi ke Settings untuk verifikasi status sesi
    await page.getByRole("link", { name: "Pengaturan", exact: true }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole("heading", { name: "Pengaturan akun", level: 1 })).toBeVisible();
    await expect(page.getByLabel("Email akun")).toHaveValue("admin@satukelas.com");

    // Verifikasi API /api/auth/me mengembalikan status sesi aktif
    const meRes = await page.request.get("/api/auth/me");
    expect(meRes.status()).toBe(200);
    const meData = await meRes.json();
    expect(meData.authenticated).toBe(true);
    expect(meData.user.role).toBe("ADMIN");
    expect(meData.user.email).toBe("admin@satukelas.com");

    // Lakukan Logout dari tombol sidebar atau topbar
    await page.locator(".crm-logout-action").click();

    // Diarahkan kembali ke /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Masuk ke Web Admin" })).toBeVisible();

    // Coba akses kembali /dashboard setelah logout -> wajib ditolak ke /login
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?unauthorized=true/);
    await expect(page.locator(".login-alert")).toContainText("Sesi Anda belum aktif");

    // Verifikasi API /api/auth/me mengembalikan 401
    const meLoggedOut = await page.request.get("/api/auth/me");
    expect(meLoggedOut.status()).toBe(401);
  });
});
