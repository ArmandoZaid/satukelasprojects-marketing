import { test, expect, type APIRequestContext } from "@playwright/test";
import { randomBytes, scryptSync } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";

// Separate process: no registry edits or destructive resets on the review server.
const fixturePassword = randomBytes(24).toString("hex");
const hash = () => {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(fixturePassword, salt, 64).toString("hex")}`;
};
let server: ChildProcess;
let origin: string;
let admin: APIRequestContext;
let marketer: APIRequestContext;
let anonymous: APIRequestContext;

async function freePort() {
  const socket = createServer();
  await new Promise<void>(resolve => socket.listen(0, "127.0.0.1", resolve));
  const port = (socket.address() as { port: number }).port;
  await new Promise<void>((resolve, reject) => socket.close(error => error ? reject(error) : resolve()));
  return port;
}

test.beforeAll(async ({ playwright }) => {
  const port = await freePort();
  origin = `http://127.0.0.1:${port}`;
  const buildDir = process.env.NEXT_BUILD_DIR || ".next";
  server = spawn(process.execPath, [path.resolve(buildDir, "standalone/server.js")], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOSTNAME: "127.0.0.1", PORT: String(port), VERCEL: "", USE_SECURE_COOKIES: "false",
      MARKETING_ENABLE_DEMO_AUTH: "true", MARKETING_ENABLE_SYNTHETIC_CRM: "true",
      MARKETING_ENABLE_ADMIN_PREVIEW: "false", ADMIN_EMAIL: "admin@example.invalid",
      ADMIN_PASSWORD: fixturePassword, AUTH_SECRET: randomBytes(32).toString("hex"), MARKETING_AUTH_SECRET: "",
      MARKETING_USERS_JSON: JSON.stringify([
        { id: "configured_active", name: "Configured Active", email: "configured@example.invalid", passwordHash: hash(), isActive: true },
        { id: "configured_inactive", name: "Configured Inactive", email: "inactive@example.invalid", passwordHash: hash(), isActive: false },
      ]),
    },
    stdio: "ignore",
  });
  anonymous = await playwright.request.newContext({ baseURL: origin });
  admin = await playwright.request.newContext({ baseURL: origin });
  marketer = await playwright.request.newContext({ baseURL: origin });
  await expect.poll(async () => {
    try { return (await anonymous.get("/login", { timeout: 1000 })).status(); }
    catch { return 0; }
  }, { timeout: 20000 }).toBe(200);
  expect((await admin.post("/api/auth/login", { data: { email: "admin@example.invalid", password: fixturePassword } })).status()).toBe(200);
  expect((await marketer.post("/api/auth/login", { data: { email: "configured@example.invalid", password: fixturePassword } })).status()).toBe(200);
});

test.afterAll(async () => {
  await Promise.all([admin?.dispose(), marketer?.dispose(), anonymous?.dispose()]);
  if (server && server.exitCode === null) {
    await new Promise<void>(resolve => { server.once("exit", () => resolve()); server.kill(); });
  }
});

test("HTTP reset denies anonymous, marketer and forged origins without changing team data", async () => {
  const created = await marketer.post("/api/crm", { data: {
    school: "Sekolah Sentinel Keamanan", region: "Surabaya", service: "Photoshoot", period: "2026/2027", estimate: "",
  } });
  expect(created.status()).toBe(201);
  const before = await (await admin.get("/api/crm")).json();
  expect((await anonymous.delete("/api/crm", { headers: { Origin: origin } })).status()).toBe(401);
  expect((await marketer.delete("/api/crm", { headers: { Origin: origin } })).status()).toBe(403);
  const forbiddenHeaders: Record<string, string>[] = [
    {}, { Origin: "null" }, { Origin: "http://evil.invalid" },
    { Origin: "http://evil.invalid", "X-Forwarded-Host": "evil.invalid" },
    { Origin: "http://evil.invalid", Host: "evil.invalid" },
    { Origin: `${origin}/forged-path` },
    { Origin: origin.replace("http://", "http://user@") },
    { Origin: origin.replace("http:", "https:") },
    { Origin: "http://localhost:1" },
    { Origin: origin, "Sec-Fetch-Site": "cross-site" },
    { "Sec-Fetch-Site": "cross-site" },
  ];
  for (const headers of forbiddenHeaders) {
    expect((await admin.delete("/api/crm", { headers })).status()).toBe(403);
    expect(await (await admin.get("/api/crm")).json()).toEqual(before);
  }
  expect(await (await admin.get("/api/crm")).json()).toEqual(before);
  for (const Origin of [origin, origin.replace("127.0.0.1", "localhost")]) {
    const reset = await admin.delete("/api/crm", { headers: { Origin } });
    expect(reset.status()).toBe(200);
    expect(reset.headers()["cache-control"]).toBe("private, no-store");
    const after = await (await admin.get("/api/crm")).json();
    expect(after.opportunities).toHaveLength(29);
    expect(after.opportunities.some((item: { school: string }) => item.school === "Sekolah Sentinel Keamanan")).toBe(false);
  }
});

test("HTTP create and PATCH reject every registry collision atomically and preserve Admin session", async () => {
  const before = await (await admin.get("/api/admin/members")).json();
  const collisions = ["admin@example.invalid", "manager@satukelas.com", "dzaky@satukelas.com", "configured@example.invalid", "inactive@example.invalid"];
  for (const email of collisions) {
    const normalizedVariant = `  ${email.toUpperCase()}  `;
    const create = await admin.post("/api/admin/members", { data: { name: "Do Not Persist", email: normalizedVariant, password: fixturePassword } });
    expect(create.status()).toBe(400);
    expect((await create.json()).error).toBe("Email sudah terdaftar");
    const update = await admin.patch("/api/admin/members/usr_mkt_01", { data: { name: "Do Not Persist", email: normalizedVariant, isActive: false } });
    expect(update.status()).toBe(400);
    expect((await update.json()).error).toBe("Email sudah terdaftar");
    expect(await (await admin.get("/api/admin/members")).json()).toEqual(before);
    expect((await admin.get("/api/auth/me")).status()).toBe(200);
    expect((await anonymous.post("/api/auth/login", { data: { email: "admin@example.invalid", password: fixturePassword } })).status()).toBe(200);
  }
});

test("browser keeps rejected member edits open, leaves table unchanged and accepts corrected email", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: origin, storageState: await admin.storageState() });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    await page.goto("/members");
    const before = await (await page.request.get("/api/admin/members")).json();
    const row = page.getByTestId("member-row-usr_mkt_01");
    await expect(row).toContainText("Yunus");
    await row.getByRole("button", { name: /Edit/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nama Lengkap PIC *").fill("Do Not Persist");
    await dialog.getByLabel("Alamat Email Aktif *").fill("inactive@example.invalid");
    await dialog.getByLabel("Status Akun *").selectOption("false");
    await dialog.getByRole("button", { name: "Simpan Perubahan" }).click();
    await expect(dialog.getByText("Email sudah terdaftar", { exact: true })).toBeVisible();
    await expect(dialog.getByLabel("Nama Lengkap PIC *")).toHaveValue("Do Not Persist");
    await expect(dialog.getByLabel("Alamat Email Aktif *")).toHaveValue("inactive@example.invalid");
    await expect(row).toContainText("Yunus");
    expect(await (await page.request.get("/api/admin/members")).json()).toEqual(before);
    expect((await page.request.get("/api/auth/me")).status()).toBe(200);
    await dialog.getByLabel("Nama Lengkap PIC *").fill("Yunus");
    await dialog.getByLabel("Alamat Email Aktif *").fill("MARKETER@SATUKELAS.COM");
    await dialog.getByLabel("Status Akun *").selectOption("true");
    await dialog.getByRole("button", { name: "Simpan Perubahan" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(row).toContainText("marketer@satukelas.com");
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});

test("revokes marketer session across HTTP and browser on password reset or profile changes", async ({ playwright, browser }) => {
  const marketerContext = await playwright.request.newContext({ baseURL: origin });
  const loginRes = await marketerContext.post("/api/auth/login", {
    data: { email: "dzaky@satukelas.com", password: "MarketerSatukelas2026!" },
  });
  expect(loginRes.status()).toBe(200);

  // Verifikasi sesi aktif
  const meBefore = await marketerContext.get("/api/auth/me");
  expect(meBefore.status()).toBe(200);
  const meData = await meBefore.json();
  expect(meData.user.email).toBe("dzaky@satukelas.com");

  // Verifikasi sesi aktif di browser
  const browserContext = await browser.newContext({
    baseURL: origin,
    storageState: await marketerContext.storageState(),
  });
  const page = await browserContext.newPage();
  try {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(new RegExp(`/dashboard`));

    // Admin mereset password Dzaky
    const resetRes = await admin.post("/api/admin/members/usr_mkt_02/reset-password", {
      data: { newPassword: "DzakyBrandNewPassword2026!" },
    });
    expect(resetRes.status()).toBe(200);

    // Sesi lama marketer over HTTP seketika ditolak (401)
    const meAfter = await marketerContext.get("/api/auth/me");
    expect(meAfter.status()).toBe(401);

    // Browser yang me-reload langsung terlempar ke login
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/login\\?unauthorized=true`));

    // Marketer dapat login dengan password baru
    const loginNew = await marketerContext.post("/api/auth/login", {
      data: { email: "dzaky@satukelas.com", password: "DzakyBrandNewPassword2026!" },
    });
    expect(loginNew.status()).toBe(200);
    const meNew = await marketerContext.get("/api/auth/me");
    expect(meNew.status()).toBe(200);
  } finally {
    await browserContext.close();
  }
});

test("protects opportunities & activities with 409 conflict and fails closed on delete or deactivation", async () => {
  // 1. Coba nonaktifkan member yang memiliki prospek (usr_mkt_01 / Yunus)
  const deactRes = await admin.patch("/api/admin/members/usr_mkt_01", {
    data: { isActive: false },
  });
  expect(deactRes.status()).toBe(409);
  const deactBody = await deactRes.json();
  expect(deactBody.error).toContain("prospek atau aktivitas");

  // 2. Coba hapus member yang memiliki prospek (usr_mkt_01 / Yunus)
  const delRes = await admin.delete("/api/admin/members/usr_mkt_01", {
    headers: { Origin: origin },
  });
  expect(delRes.status()).toBe(409);
  const delBody = await delRes.json();
  expect(delBody.error).toContain("prospek atau aktivitas");

  // 3. Coba hapus dengan Origin palsu (spoofed origin) ditolak 403
  const spoofDel = await admin.delete("/api/admin/members/usr_mkt_01", {
    headers: { Origin: "http://attacker.example.com" },
  });
  expect(spoofDel.status()).toBe(403);

  // 4. Buat member baru tanpa relasi, hapus berhasil
  const createNew = await admin.post("/api/admin/members", {
    data: {
      name: "Temporary Marketer",
      email: "temp-marketer@example.invalid",
      password: "TemporaryPassword123!",
      role: "MARKETER",
      isActive: true,
    },
  });
  expect(createNew.status()).toBe(201);
  const createdUser = await createNew.json();
  const tempId = createdUser.member.id;

  // Hapus member yang belum punya relasi berhasil 200
  const delTemp = await admin.delete(`/api/admin/members/${tempId}`, {
    headers: { Origin: origin },
  });
  expect(delTemp.status()).toBe(200);
  expect((await delTemp.json()).deletedId).toBe(tempId);
});
