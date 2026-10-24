import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error: "Sesi tidak ditemukan atau kedaluwarsa.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      userId: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      exp: session.exp,
    },
  });
}
