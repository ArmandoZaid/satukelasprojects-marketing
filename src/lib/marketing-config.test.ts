import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { marketingChatUrl, marketingContact } from "./marketing-config";
import { cn } from "./utils";

describe("public marketing contract", () => {
  it("uses HTTPS WhatsApp and one explicit recipient", () => {
    const url = new URL(marketingChatUrl);
    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe(`/${marketingContact.whatsappNumber}`);
    expect(marketingContact.whatsappNumber).toMatch(/^62\d+$/);
  });
  it("round-trips the message without double encoding", () => {
    expect(new URL(marketingChatUrl).searchParams.get("text")).toBe(marketingContact.message);
  });
  it("does not put user-supplied data or identifiers in the link", () => {
    expect([...new URL(marketingChatUrl).searchParams.keys()]).toEqual(["text"]);
  });
  it("keeps the reviewed black default CTA", () => {
    expect(buttonVariants()).toContain("button-black");
    expect(buttonVariants()).not.toContain("button-pink");
  });
  it("supports the pink navigation variant", () => {
    expect(buttonVariants({ variant: "pink", size: "nav" })).toContain("nav-cta");
    expect(buttonVariants({ variant: "pink" })).toContain("button-pink");
  });
  it("renders an external CTA as an anchor, not nested interactive controls", () => {
    const html = renderToStaticMarkup(createElement(Button, { asChild: true }, createElement("a", {
      href: marketingChatUrl, target: "_blank", rel: "noopener noreferrer",
    }, "Gas Mulai Bareng Kami")));
    expect(html).toContain('<a ');
    expect(html).not.toContain('<button');
    expect(html).toContain('rel="noopener noreferrer"');
  });
  it("preserves native disabled behavior for the retry button", () => {
    const html = renderToStaticMarkup(createElement(Button, { disabled: true }, "Muat ulang"));
    expect(html).toContain("disabled");
  });
  it("resolves Tailwind conflicts", () => {
    expect(cn("px-2", false, "px-4")).toBe("px-4");
  });
});
