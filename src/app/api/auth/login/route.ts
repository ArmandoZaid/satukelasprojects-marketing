import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  authenticateUser,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

import { canAccessCrmScreen } from "@/lib/crm-access";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let email: unknown;
    let password: unknown;
    try {
      const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      if (contentType === "application/json") {
        const body: unknown = await request.json();
        if (body && typeof body === "object" && !Array.isArray(body)) {
          ({ email, password } = body as Record<string, unknown>);
        }
      } else if (contentType === "application/x-www-form-urlencoded" || contentType === "multipart/form-data") {
        const formData = await request.formData();
        if (formData.getAll("email").length === 1 && formData.getAll("password").length === 1) {
          email = formData.get("email");
          password = formData.get("password");
        }
      }
    } catch {
      return NextResponse.json({ ok: false, error: "Format request tidak valid." }, { status: 400 });
    }
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ ok: false, error: "Email dan kata sandi harus berupa teks." }, { status: 400 });
    }

    const auth = authenticateUser(email, password);
    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: auth.error, code: auth.code },
        { status: 401 }
      );
    }

    if (!canAccessCrmScreen(auth.user.role, "dashboard")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Akses ditolak. Workspace hanya tersedia untuk akun ADMIN dan MARKETER.",
          code: "FORBIDDEN_ROLE",
        },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    const cookieOpts = getSessionCookieOptions();

    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: auth.token,
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.name,
        role: auth.user.role,
      },
      redirect: "/dashboard",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Terjadi kesalahan internal pada server autentikasi." },
      { status: 500 }
    );
  }
}
