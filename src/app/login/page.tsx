import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicHeader, PublicFooter } from "@/components/public-shell";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Masuk Tim · Satukelas Marketing CRM",
  description: "Portal autentikasi login untuk Administrator dan Marketing CRM Satukelas Projects.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <>
      <PublicHeader compact />
      <main className="wrap login-page-wrap" id="konten" tabIndex={-1}>
        <Suspense fallback={<div className="login-card"><p>Memuat formulir masuk…</p></div>}>
          <LoginForm />
        </Suspense>
      </main>
      <PublicFooter />
    </>
  );
}
