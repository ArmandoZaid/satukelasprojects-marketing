import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`public layout, assets and CTA spacing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    const failed: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("requestfailed", r => failed.push(r.url()));
    page.on("response", r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("h1")).toHaveText("Buka relasi.Bawa cerita baru.");
    await expect(page.locator(".primary-nav")).toBeVisible();
    await expect(page.locator("form, input")).toHaveCount(0);
    const images = page.locator("main img");
    await expect(images).toHaveCount(4);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
    }
    const measure = () => page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      const a = box(".join-actions .button"), b = box(".join-actions .text-link");
      const gap = b.top >= a.bottom ? b.top - a.bottom : b.left - a.right;
      return { overflow: document.documentElement.scrollWidth - innerWidth, gap,
        flexGap: getComputedStyle(document.querySelector(".join-actions")!).gap,
        font: getComputedStyle(document.body).fontFamily,
        black: getComputedStyle(document.querySelector(".join-actions .button")!).backgroundColor,
      };
    });
    let m = await measure();
    expect(m.overflow).toBeLessThanOrEqual(1);
    expect(m.gap).toBeGreaterThanOrEqual(23);
    expect(m.flexGap).toBe("24px");
    expect(m.black).toBe("rgb(0, 0, 0)");
    expect(m.font.toLowerCase()).toContain("geist");
    expect(await page.evaluate(() => [...document.fonts].some(font => font.family.toLowerCase().includes("geist") && font.status === "loaded"))).toBe(true);
    await page.locator(".join-actions .button").hover();
    m = await measure();
    expect(m.gap).toBeGreaterThanOrEqual(23);
    expect(errors).toEqual([]);
    expect(failed).toEqual([]);
    if (width === 390 || width === 1440) {
      await page.mouse.move(0, 0);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join("test-results", `landing-${width}.png`), fullPage: true });
      await page.locator("#gabung").screenshot({ path: path.join("test-results", `join-${width}.png`) });
    }
  });
}

test("anchor navigation, all FAQ toggles and keyboard skip link", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.locator(".nav-cta").click();
  await expect(page).toHaveURL(/#gabung$/);
  await page.locator(".join-actions .text-link").click();
  await expect(page).toHaveURL(/#alur$/);
  for (const summary of await page.locator("summary").all()) {
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(summary.locator("..")).toHaveAttribute("open", "");
    await page.keyboard.press("Space");
    await expect(summary.locator("..")).not.toHaveAttribute("open");
  }
});

test("external CTA destination is shared and safe; no chat is sent", async ({ page, context }) => {
  await page.goto("/");
  const ctas = page.locator('a[href^="https://wa.me/"]');
  await expect(ctas).toHaveCount(2);
  const links = await ctas.evaluateAll(items => items.map(a => ({
    href: (a as HTMLAnchorElement).href, target: a.getAttribute("target"), rel: a.getAttribute("rel"),
  })));
  expect(links[0].href).toBe(links[1].href);
  for (const link of links) {
    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener noreferrer");
    expect(new URL(link.href).hostname).toBe("wa.me");
    expect(new URL(link.href).searchParams.get("text")).toContain("mitra marketing");
  }
  await context.route("https://wa.me/**", route => route.fulfill({ status: 200, body: "Intercepted by local QA; nothing sent." }));
  const popupEvent = page.waitForEvent("popup");
  await ctas.first().click();
  const popup = await popupEvent;
  await popup.waitForLoadState();
  expect(popup.url()).toBe(links[0].href);
  await popup.close();
});

for (const width of [390, 1440]) {
  test(`automated accessibility on public pages at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["/", "/login", "/page-not-present"]) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      if (route === "/") await page.locator("details").evaluateAll(items => items.forEach(e => e.setAttribute("open", "")));
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    }
  });
}

test("team access leads to admin login, 404 denies unimplemented private paths", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Masuk akun tim" }).click();
  await expect(page).toHaveURL("/login");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Masuk ke Web Admin");
  await expect(page.getByLabel("Email akun")).toBeVisible();
  await page.getByRole("link", { name: "← Kembali ke Beranda Publik" }).click();
  await expect(page).toHaveURL("/");
  for (const route of ["/api/schools", "/api/export", "/private/file"]) {
    expect((await request.get(route)).status()).toBe(404);
  }
  expect((await request.post("/api/recruitment", { data: {} })).status()).toBe(404);
});

test("anonymous HTML has indexing guard and no session cookie", async ({ request }) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  expect(response.headers()["set-cookie"]).toBeUndefined();
  const html = await response.text();
  expect(html).toContain('name="robots" content="noindex, nofollow"');
  expect(html).not.toMatch(/JobPosting|supabase|postgresql|auth-token|client_secret|service_role/);
  expect((await request.get("/robots.txt")).status()).toBe(200);
});

test("landing works without JavaScript and without font or image responses", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await context.route(/\.(svg|woff2?)($|\?)/, route => route.abort());
  const page = await context.newPage();
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3100/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByRole("link", { name: "Gas Mulai Bareng Kami" })).toBeVisible();
  await page.locator("summary").first().click();
  await expect(page.locator("details").first()).toHaveAttribute("open", "");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await context.close();
});
