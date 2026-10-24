import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { canAccessCrmScreen } from "@/lib/crm-access";
export function proxy(request: NextRequest) {
 const path = request.nextUrl.pathname;
 const session = verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value ?? "");
 if (path.startsWith("/preview")) {
  if (process.env.MARKETING_ENABLE_ADMIN_PREVIEW !== "true") return new NextResponse("Tidak ditemukan.", { status: 404 });
  if (session && session.role !== "ADMIN") return denied();
 } else {
  if (!session) return NextResponse.redirect(new URL("/login?unauthorized=true", request.url));
  if (!canAccessCrmScreen(session.role, path.split("/")[1])) return denied();
 }
 const response = NextResponse.next();
 response.headers.set("Cache-Control", "private, no-store");
 return response;
}
function denied() { return new NextResponse("Akses ditolak. Halaman ini hanya untuk Administrator.", { status: 403, headers: { "Cache-Control": "private, no-store", "Content-Type": "text/plain; charset=utf-8" } }); }
export const config = { matcher: ["/dashboard/:path*", "/opportunities/:path*", "/schools/:path*", "/pipeline/:path*", "/follow-ups/:path*", "/activities/:path*", "/reports/:path*", "/settings/:path*", "/admin/:path*", "/members/:path*", "/preview/:path*"] };
