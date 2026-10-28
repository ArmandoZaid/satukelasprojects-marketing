import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import jsQR from "jsqr";
import { chromium } from "@playwright/test";
import { CARD_DIMENSIONS, createCardQr, drawBusinessCard, getCardUrl } from "./business-card";

describe("business card URL", () => {
  it("sends admins to the homepage instead of inventing a member landing", () => {
    expect(getCardUrl({ id: "usr_admin_01", role: "ADMIN" }, "https://crm.example.test/settings"))
      .toBe("https://crm.example.test/");
  });
  it("uses the current origin and a stable encoded marketer ID", () => {
    expect(getCardUrl({ id: "tim / école", role: "MARKETER" }, "https://crm.example.test/settings?q=1"))
      .toBe("https://crm.example.test/tim/tim%20%2F%20%C3%A9cole");
  });
  it("sends managers to the homepage rather than an unsupported profile", () => {
    expect(getCardUrl({ id: "usr_manager_01", role: "MANAGER" }, "https://crm.example.test/settings"))
      .toBe("https://crm.example.test/");
  });
  it("rejects non-web origins instead of creating an unusable QR target", () => {
    expect(() => getCardUrl({ id: "user", role: "MARKETER" }, "javascript:alert(1)"))
      .toThrow("Alamat situs harus menggunakan HTTP atau HTTPS.");
  });
  it("rejects an empty marketer ID instead of encoding the team index", () => {
    expect(() => getCardUrl({ id: "  ", role: "MARKETER" }, "https://crm.example.test"))
      .toThrow("ID anggota diperlukan untuk kartu marketing.");
  });
});

describe("business card production artwork", () => {
  it("exports 90 by 54 mm at 300 DPI", () => {
    expect(CARD_DIMENSIONS).toEqual({ widthMm: 90, heightMm: 54, dpi: 300, width: 1063, height: 638 });
  });
  it("generates a real locally decodable QR for each member URL", () => {
    for (const id of ["usr_marketer_01", "tim / école", "member_02"]) {
      const target = getCardUrl({ id, role: "MARKETER" }, "https://crm.example.test");
      const qr = createCardQr(target);
      const scale = 7;
      const width = (qr.size + qr.quietZone * 2) * scale;
      const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
      for (let row = 0; row < qr.size; row += 1) {
        for (let col = 0; col < qr.size; col += 1) {
          if (!qr.modules[row * qr.size + col]) continue;
          for (let y = 0; y < scale; y += 1) {
            for (let x = 0; x < scale; x += 1) {
              const pixel = (((row + qr.quietZone) * scale + y) * width + (col + qr.quietZone) * scale + x) * 4;
              pixels[pixel] = pixels[pixel + 1] = pixels[pixel + 2] = 0;
            }
          }
        }
      }
      expect(jsQR(pixels, width, width)?.data).toBe(target);
      expect(qr.quietZone).toBeGreaterThanOrEqual(4);
    }
  });
  it("retains long profile details in the front artwork without truncation or overlap", async () => {
    const browser = await chromium.launch({ headless: true, channel: "chromium" });
    try {
      const page = await browser.newPage();
      await page.setContent('<canvas id="card"></canvas>');
      await page.addScriptTag({ content: `const CARD_DIMENSIONS = ${JSON.stringify(CARD_DIMENSIONS)}; window.drawBusinessCard = ${drawBusinessCard.toString()};` });
      const profile = {
        id: "usr_long", role: "MARKETER" as const,
        name: "W".repeat(200),
        email: `${"w".repeat(64)}@${Array(3).fill("w".repeat(60)).join(".")}`,
        phone: "+62 812-3456-7890", title: "W".repeat(100),
      };
      const url = getCardUrl(profile, "https://crm.example.test");
      const lines = await page.evaluate(({ profile, url, qr }) => {
        const canvas = document.querySelector("canvas")!;
        const ctx = canvas.getContext("2d")!;
        const lines: { value: string; x: number; y: number; width: number }[] = [];
        const fillText = ctx.fillText.bind(ctx);
        ctx.fillText = (value, x, y) => {
          lines.push({ value, x, y, width: ctx.measureText(value).width });
          fillText(value, x, y);
        };
        (window as unknown as { drawBusinessCard: typeof drawBusinessCard }).drawBusinessCard(canvas, profile, "front", url, qr);
        return lines;
      }, { profile, url, qr: createCardQr(url) });
      for (const [value, x, top, bottom, width] of [
        [profile.name, 280, 180, 340, 725],
        [profile.title, 280, 340, 410, 725],
        [profile.email, 50, 440, 529, 957],
        [profile.phone, 50, 529, 562, 690],
      ] as const) {
        const section = lines.filter(line => line.x === x && line.y >= top && line.y < bottom);
        expect(section.map(line => line.value).join("")).toBe(value);
        expect(section.every(line => line.width <= width)).toBe(true);
      }
    } finally {
      await browser.close();
    }
  }, 20000);
  it("draws printable PNG artwork with fitted identity text and a scannable QR", async () => {
    expect(drawBusinessCard).toBeTypeOf("function");
    const browser = await chromium.launch({ headless: true, channel: "chromium" });
    try {
      const page = await browser.newPage();
      await page.setContent('<canvas id="card"></canvas>');
      await page.addScriptTag({ content: `const CARD_DIMENSIONS = ${JSON.stringify(CARD_DIMENSIONS)}; window.drawBusinessCard = ${drawBusinessCard.toString()};` });
      const profile = {
        id: "usr_mkt_01", role: "MARKETER" as const,
        name: "Nadia Putri Kartikasari Adiningrum Prameswari",
        email: `${"nama.panjang".repeat(7)}@sekolah.example.test`,
        phone: "+62 812-3456-7890", title: "Konsultan kemitraan sekolah dan pengembangan pendidikan",
      };
      const url = getCardUrl(profile, "https://crm.example.test");
      const result = await page.evaluate(({ profile, url, qr }) => {
        const canvas = document.querySelector("canvas")!;
        const draw = (window as unknown as { drawBusinessCard: typeof drawBusinessCard }).drawBusinessCard;
        draw(canvas, profile, "front", url, qr);
        const png = canvas.toDataURL("image/png");
        draw(canvas, profile, "back", url, qr);
        const ctx = canvas.getContext("2d")!;
        const pixels = ctx.getImageData(650, 125, 350, 350);
        return { width: canvas.width, height: canvas.height, png: png.slice(0, 30), pixels: Array.from(pixels.data) };
      }, { profile, url, qr: createCardQr(url) });
      expect(result.width).toBe(1063);
      expect(result.height).toBe(638);
      expect(result.png).toMatch(/^data:image\/png;base64,iVBOR/);
      expect(jsQR(new Uint8ClampedArray(result.pixels), 350, 350)?.data).toBe(url);
      const roleRight = await page.evaluate(({ profile, url, qr }) => {
        const canvas = document.querySelector("canvas")!;
        const ctx = canvas.getContext("2d")!;
        const fill = ctx.fillText.bind(ctx);
        let right = 0;
        ctx.fillText = (value, x, y) => {
          if (value === "Manajer marketing") right = x + ctx.measureText(value).width;
          fill(value, x, y);
        };
        const draw = (window as unknown as { drawBusinessCard: typeof drawBusinessCard }).drawBusinessCard;
        draw(canvas, { ...profile, role: "MANAGER" }, "front", url, qr);
        return right;
      }, { profile, url, qr: createCardQr(url) });
      expect(roleRight).toBeGreaterThan(838);
      expect(roleRight).toBeLessThanOrEqual(1000);
    } finally {
      await browser.close();
    }
  }, 20000);
});

async function browserCardBundle() {
  const { build } = await import("vite");
  const entry = "C:/virtual/business-card-test.tsx";
  const component = new URL("../components/crm/business-card.tsx", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
  const result = await build({
    configFile: false,
    logLevel: "silent",
    define: { "process.env.NODE_ENV": '"production"' },
    esbuild: { jsxDev: false } as Record<string, unknown>,
    plugins: [{
      name: "business-card-test",
      resolveId: id => id.endsWith("business-card-test.tsx") ? entry : undefined,
      load: id => id === entry ? `
        import { createElement } from "react";
        import { createRoot } from "react-dom/client";
        import { BusinessCard } from ${JSON.stringify(component)};
        const root = createRoot(document.getElementById("root"));
        window.renderCardProfile = profile => root.render(createElement(BusinessCard, { profile }));
      ` : undefined,
    }],
    build: { write: false, minify: false, lib: { entry, name: "CardTest", formats: ["iife"] } },
  });
  const buildResult = result as unknown as { output: Array<{ type: string; fileName: string; code?: string; source?: string | Uint8Array }> } | Array<{ output: Array<{ type: string; fileName: string; code?: string; source?: string | Uint8Array }> }>;
  const outputs = Array.isArray(buildResult) ? buildResult[0].output : buildResult.output;
  const script = outputs.find(output => output.type === "chunk");
  const css = outputs.find(output => output.type === "asset" && output.fileName.endsWith(".css"));
  if (script?.type !== "chunk" || css?.type !== "asset") throw new Error("Card script and stylesheet are required");
  return { script: script.code, css: String(css.source) };
}

it("runs front/back preview, local PNG download and isolated two-sided printing in Chromium", async () => {
  const bundle = await browserCardBundle();
  const browser = await chromium.launch({ headless: true, channel: "chromium" });
  try {
    const page = await browser.newPage({ viewport: { width: 375, height: 900 }, acceptDownloads: true });
    await page.route("https://crm.example.test/**", route => route.fulfill({
      contentType: "text/html", body: '<body style="margin: 0"><header id="crm-chrome">CRM remains intact</header><div id="root"></div></body>',
    }));
    await page.goto("https://crm.example.test/settings");
    await page.addStyleTag({ content: bundle.css });
    await page.addScriptTag({ content: bundle.script });
    const profile = {
      id: "usr_card_01", name: "W".repeat(200), role: "MARKETER" as const,
      email: `${"w".repeat(64)}@${Array(3).fill("w".repeat(60)).join(".")}`,
      phone: "+62 812 3456 7890", title: "Konsultan kemitraan sekolah",
      avatarUrl: await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 40;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#4150B1";
        ctx.fillRect(0, 0, 40, 40);
        return canvas.toDataURL("image/png");
      }),
    };
    await page.evaluate(profile => (window as unknown as { renderCardProfile: (profile: unknown) => void }).renderCardProfile(profile), profile);
    await page.getByRole("button", { name: "Unduh PNG", exact: true }).waitFor();
    await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>(".business-card-actions button")?.disabled);
    expect(await page.getByTestId("business-card-front").isVisible()).toBe(true);
    expect(await page.getByTestId("business-card-back").isVisible()).toBe(false);
    expect(await page.getByText(profile.name, { exact: true }).isVisible()).toBe(true);
    expect(await page.getByText(profile.email, { exact: true }).isVisible()).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const landingCta = page.getByRole("link", { name: `Buka landing page ${profile.name}`, exact: true });
    expect(await landingCta.getAttribute("href")).toBe("https://crm.example.test/tim/usr_card_01");
    expect(await landingCta.evaluate(link => getComputedStyle(link).backgroundColor)).toBe("rgb(65, 80, 177)");
    expect(await landingCta.evaluate(link => getComputedStyle(link).color)).toBe("rgb(255, 255, 255)");
    const paperPixel = await page.getByTestId("business-card-front").locator("canvas").evaluate(canvas =>
      Array.from((canvas as HTMLCanvasElement).getContext("2d")!.getImageData(500, 400, 1, 1).data));
    expect(paperPixel).toEqual([255, 253, 249, 255]);
    const photoPixel = await page.getByTestId("business-card-front").locator("canvas").evaluate(canvas =>
      Array.from((canvas as HTMLCanvasElement).getContext("2d")!.getImageData(100, 200, 1, 1).data));
    expect(photoPixel).toEqual([65, 80, 177, 255]);
    const frontEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Unduh PNG", exact: true }).click();
    const frontDownload = await frontEvent;
    expect(frontDownload.suggestedFilename()).toMatch(/depan\.png$/);
    const stream = await frontDownload.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
    const png = Buffer.concat(chunks);
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1063, 638]);
    await page.getByRole("tab", { name: "Belakang", exact: true }).click();
    expect(await page.getByTestId("business-card-back").isVisible()).toBe(true);
    const pixels = await page.getByTestId("business-card-back").locator("canvas").evaluate(canvas =>
      Array.from((canvas as HTMLCanvasElement).getContext("2d")!.getImageData(650, 125, 350, 350).data));
    expect(jsQR(new Uint8ClampedArray(pixels), 350, 350)?.data).toBe("https://crm.example.test/tim/usr_card_01");
    const backEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Unduh PNG", exact: true }).click();
    expect((await backEvent).suggestedFilename()).toMatch(/belakang\.png$/);
    await page.getByRole("tab", { name: "Belakang", exact: true }).press("Home");
    expect(await page.getByRole("tab", { name: "Depan", exact: true }).getAttribute("aria-selected")).toBe("true");
    expect(await page.getByRole("tab", { name: "Depan", exact: true }).evaluate(tab => document.activeElement === tab)).toBe(true);
    await page.evaluate(() => {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "contentWindow")!;
      Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", { configurable: true, get() {
        const frame = descriptor.get!.call(this) as Window | null;
        if (frame) frame.print = () => {
          (window as unknown as { cardPrint: unknown }).cardPrint = {
            css: frame.document.querySelector("style")?.textContent,
            images: Array.from(frame.document.images).map(image => ({ src: image.src, width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height })),
          };
        };
        return frame;
      } });
    });
    await page.getByRole("button", { name: "Cetak kartu", exact: true }).click();
    await page.waitForFunction(() => Boolean((window as unknown as { cardPrint?: unknown }).cardPrint));
    const print = await page.evaluate(() => (window as unknown as { cardPrint: { css: string; images: { src: string; width: number; height: number }[] } }).cardPrint);
    expect(print.css).toMatch(/@page\s*\{[^}]*size:\s*90mm\s+54mm/);
    expect(print.images).toHaveLength(2);
    expect(print.images.every(image => image.src.startsWith("data:image/png;base64,"))).toBe(true);
    expect(print.images[0].width).toBeCloseTo(90 * 96 / 25.4, 0);
    expect(print.images[0].height).toBeCloseTo(54 * 96 / 25.4, 0);
    expect(await page.locator("#crm-chrome").isVisible()).toBe(true);
    await page.evaluate(profile => (window as unknown as { renderCardProfile: (profile: unknown) => void }).renderCardProfile(profile), { ...profile, id: "usr_card_02", name: "Nama terbaru" });
    await page.getByRole("link", { name: /crm.example.test\/tim\/usr_card_02/ }).waitFor();
    expect(await page.getByText("Nama terbaru", { exact: true }).isVisible()).toBe(true);
  } finally {
    await browser.close();
  }
}, 30000);

describe("business card preview", () => {
  it("renders safely on the server with front/back controls and no guessed origin", async () => {
    const { BusinessCard } = await import("../components/crm/business-card");
    const html = renderToStaticMarkup(createElement(BusinessCard, { profile: {
      id: "user", name: "Nadia Putri", email: "nadia@example.test", role: "MARKETER",
    } }));
    expect(html).toContain('data-testid="business-card-front"');
    expect(html).toContain('data-testid="business-card-back"');
    expect(html).toContain('aria-label="Sisi depan"');
    expect(html).toContain('aria-label="Sisi belakang"');
    expect(html).toContain("Depan");
    expect(html).toContain("Belakang");
    expect(html).toContain("Unduh PNG");
    expect(html).toContain("Cetak kartu");
    expect(html).toContain("Menyiapkan kartu");
    expect(html).not.toContain("localhost");
  });
  it("prints only a physical-size card without modifying the CRM layout", () => {
    const css = readFileSync(new URL("../components/crm/business-card.css", import.meta.url), "utf8");
    expect(css).toContain("@media print");
    expect(css).toContain("90mm");
    expect(css).toContain("54mm");
    expect(css).toContain(".business-card-print-frame");
  });
});
