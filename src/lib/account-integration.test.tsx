import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CrmApp } from "../components/crm/crm-app";
import { createDemo } from "./crm-demo";

const navigation = vi.hoisted(() => ({ path: "/settings" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.path,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

describe("account UI integration", () => {
  it("offers self-service settings to marketers without offering team management", () => {
    navigation.path = "/settings";
    const html = renderToStaticMarkup(createElement(CrmApp, {
      initialState: createDemo(),
      currentUser: { userId: "usr_mkt_01", name: "Yunus", email: "yunus@example.test", role: "MARKETER" },
    }));
    expect(html).toContain('aria-label="Pengaturan akun"');
    expect(html).toContain('aria-label="Kartu nama saya"');
    expect(html).not.toContain('href="/members"');
    expect(html).toContain("Pengaturan akun");
    expect(html).toContain("Nama lengkap");
    expect(html).toContain("Keamanan");
    expect(html).toContain("Kartu nama");
  });
  it("offers a business card action for every team member", () => {
    navigation.path = "/preview/members";
    const html = renderToStaticMarkup(createElement(CrmApp));
    expect(html).toContain('aria-label="Kartu nama Yunus"');
    expect(html).toContain('aria-label="Kartu nama Dzaky"');
  });
});
