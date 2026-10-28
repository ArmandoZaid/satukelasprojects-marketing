import { test, expect, type APIRequestContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const accounts = [
 { email: "marketer@satukelas.com", password: "MarketerSatukelas2026!", id: "usr_mkt_01", name: "Yunus" },
 { email: "dzaky@satukelas.com", password: "MarketerSatukelas2026!", id: "usr_mkt_02", name: "Dzaky" },
];
async function login(request: APIRequestContext, index = 0) {
 const { email, password } = accounts[index];
 expect((await request.post("/api/auth/login", { data: { email, password } })).status()).toBe(200);
}
test.beforeEach(async ({ playwright, baseURL }) => {
 const req = await playwright.request.newContext({ baseURL });
 expect((await req.post("/api/auth/login", { data: { email: "admin@satukelas.com", password: "AdminSatukelas2026!" } })).status()).toBe(200);
 expect((await req.delete("/api/crm", { headers: { Origin: baseURL! } })).status()).toBe(200);
 await req.dispose();
});
test("marketing login UI shows only six owned screens, no credential hints; logout clears scope", async ({ page }) => {
 await page.goto("/login");
 await expect(page.locator('input[name="password"]')).toHaveValue("");
 await expect(page.getByText(/Gunakan akun default|Isi otomatis/)).toHaveCount(0);
 await page.getByLabel("Email akun", { exact: true }).fill(accounts[0].email);
 await page.getByLabel("Kata Sandi", { exact: true }).fill(accounts[0].password);
 await page.getByRole("button", { name: "Masuk ke workspace" }).click();
 await expect(page).toHaveURL(/\/dashboard$/);
 await expect(page.getByTestId("active-count")).toHaveText("6");
 await expect(page.locator('nav[aria-label="Menu marketing"] a')).toHaveCount(6);
 await expect(page.getByRole("link", { name: "Pengaturan", exact: true })).toHaveCount(0);
 for (const screen of ["dashboard", "opportunities", "pipeline", "follow-ups", "activities", "reports"]) {
  await page.goto(`/${screen}?owner=Dzaky&ownerId=usr_mkt_02`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("main")).not.toContainText("SMP Contoh Mentari");
  await expect(page.locator("main")).not.toContainText("Simulasi percakapan; menunggu konfirmasi jadwal.");
 }
 await page.goto("/reports");
 await expect(page.locator(".crm-table tbody tr")).toHaveCount(1);
 await expect(page.locator(".crm-table tbody tr")).toContainText("Yunus");
 await page.locator(".crm-logout-action").click();
 await expect(page).toHaveURL(/\/login/);
 expect((await page.request.get("/api/crm")).status()).toBe(401);
 await page.goto("/dashboard");
 await expect(page).toHaveURL(/\/login/);
});
test("server scopes HTML/RSC/API to each account and blocks direct forbidden routes and IDOR", async ({ playwright, baseURL }) => {
 const one = await playwright.request.newContext({ baseURL });
 const two = await playwright.request.newContext({ baseURL });
 expect((await one.get("/api/crm")).status()).toBe(401);
 await login(one); await login(two, 1);
 const s1 = await (await one.get("/api/crm?ownerId=usr_mkt_02&owner=Dzaky")).json();
 const s2 = await (await two.get("/api/crm")).json();
 expect(s1.opportunities).toHaveLength(8);
 expect(s2.opportunities).toHaveLength(7);
 expect(s1.opportunities.every((o: { ownerId: string }) => o.ownerId === accounts[0].id)).toBe(true);
 expect(s2.opportunities.every((o: { ownerId: string }) => o.ownerId === accounts[1].id)).toBe(true);
 expect(s1.activities.map((a: { id: string }) => a.id)).toEqual(["activity-1"]);
 for (const path of ["/settings", "/admin", "/preview/dashboard", "/preview/reports", "/preview/settings"]) {
  const r = await one.get(path);
  expect(r.status()).toBe(403);
  expect(await r.text()).not.toContain("SMP Contoh Mentari");
 }
 expect((await one.get("/schools", { maxRedirects: 0 })).headers().location).toBe("/opportunities");
 for (const headers of [{} as Record<string, string>, { RSC: "1" }]) {
  const html = await (await one.get("/dashboard?owner=Dzaky", { headers })).text();
  expect(html).not.toContain("SMP Contoh Mentari");
  expect(html).not.toContain("Simulasi percakapan; menunggu konfirmasi jadwal.");
 }
 expect((await one.get("/api/crm/opportunities/demo-2")).status()).toBe(404);
 for (const action of ["result", "stage"]) {
  expect((await one.patch("/api/crm/opportunities/demo-2", { data: { action, input: {} } })).status()).toBe(404);
 }
 expect((await one.patch("/api/crm/opportunities/demo-1", { data: { action: "result", input: { summary: {} } } })).status()).toBe(400);
 expect((await one.post("/api/crm", { headers: { origin: "https://evil.invalid" }, data: {} })).status()).toBe(403);
 await one.dispose(); await two.dispose();
});
test("owned create/result/stage save to server, survive reload, never cross into second account", async ({ page, playwright, baseURL }) => {
 await login(page.request);
 await page.goto("/opportunities");
 await page.getByRole("button", { name: "Tambah prospek", exact: true }).click();
 let dialog = page.getByRole("dialog");
 await expect(dialog.getByLabel("PIC contoh", { exact: false })).toHaveValue("Yunus");
 await expect(dialog.getByLabel("PIC contoh", { exact: false })).toBeDisabled();
 await dialog.getByLabel("Nama sekolah contoh", { exact: false }).fill("Sekolah Isolasi Browser");
 await dialog.getByRole("button", { name: "Simpan contoh" }).click();
 await expect(dialog).toHaveCount(0);
 await page.getByLabel("Cari sekolah", { exact: true }).fill("Isolasi Browser");
 await page.getByRole("button", { name: "Sekolah Isolasi Browser (Contoh)", exact: true }).click();
 await page.getByRole("button", { name: "Catat hasil", exact: true }).click();
 dialog = page.getByRole("dialog");
 await dialog.getByLabel("Ringkasan hasil", { exact: false }).fill("Catatan pribadi Marketing satu.");
 await dialog.getByRole("button", { name: "Simpan contoh" }).click();
 await expect(dialog).toHaveCount(0);
 await page.reload();
 await page.getByRole("button", { name: "Sekolah Isolasi Browser (Contoh)", exact: true }).click();
 await expect(page.getByRole("dialog")).toContainText("Catatan pribadi Marketing satu.");
 await page.getByRole("button", { name: "Ubah tahap", exact: true }).click();
 await page.getByRole("button", { name: "Simpan contoh" }).click();
 await expect(page.getByRole("dialog")).toHaveCount(0);
 const own = await (await page.request.get("/api/crm")).json();
 expect(own.opportunities.find((o: { school: string }) => o.school === "Sekolah Isolasi Browser (Contoh)")).toMatchObject({ stage: "Contacted", ownerId: "usr_mkt_01" });
 const other = await playwright.request.newContext({ baseURL }); await login(other, 1);
 expect(await (await other.get("/api/crm")).text()).not.toContain("Catatan pribadi Marketing satu.");
 const forged = await other.post("/api/crm", { data: { school: "Sekolah Owner Palsu", owner: "Yunus", ownerId: "usr_mkt_01", region: "Surabaya", service: "Photoshoot", period: "2026/2027", estimate: "" } });
 expect(forged.status()).toBe(201);
 const created = await forged.json();
 expect(created.opportunities.at(-1)).toMatchObject({ owner: "Dzaky", ownerId: "usr_mkt_02" });
 expect(await (await page.request.get("/api/crm")).text()).not.toContain("Sekolah Owner Palsu");
 await other.dispose();
});
for (const width of [390, 1440]) test(`marketing responsive accessible UI at ${width}px`, async ({ page }) => {
 const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
 await login(page.request);
 await page.setViewportSize({ width, height: 1000 });
 for (const screen of ["dashboard", "opportunities", "pipeline", "follow-ups", "activities", "reports"]) {
  await page.goto(`/${screen}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 }
 const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
 expect(audit.violations).toEqual([]);
 await page.screenshot({ path: `test-results/marketing-${width}.png`, fullPage: true });
 expect(errors).toEqual([]);
});
