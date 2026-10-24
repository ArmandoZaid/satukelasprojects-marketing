import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  const referer = request.headers.get("referer");
  if (request.headers.get("accept")?.includes("text/html")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.json({ ok: true, redirect: "/login", referer });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.redirect(new URL("/login", request.url));
}
