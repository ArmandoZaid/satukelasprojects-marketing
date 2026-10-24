"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { UserRole } from "@/lib/auth";
import { canAccessCrmScreen } from "@/lib/crm-access";

export function getSafeCrmReturnUrl(role: UserRole, candidate: unknown): string {
  if (typeof candidate !== "string" || /[\u0000-\u0020\u007f\\]/.test(candidate)) return "/dashboard";
  const match = /^\/([a-z-]+)(?:[?#].*)?$/.exec(candidate);
  return match && canAccessCrmScreen(role, match[1]) ? candidate : "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isUnauthorized = searchParams.get("unauthorized") === "true";
  const initialError = isUnauthorized
    ? "Sesi Anda belum aktif atau telah kedaluwarsa. Silakan masuk dengan akun tim Anda."
    : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Gagal masuk. Periksa kembali email dan kata sandi Anda.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      const returnUrl = getSafeCrmReturnUrl(data.user?.role, searchParams.get("returnUrl") ?? data.redirect);
      router.push(returnUrl);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan atau server. Silakan coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="login-card" role="region" aria-label="Formulir Masuk Akun Tim">
      <div className="login-badge-row">
        <span className="login-badge">AKUN TIM INTERNAL</span>
        <span className="login-badge-sub">Marketing CRM</span>
      </div>

      <h1 className="login-title">Masuk ke Web Admin</h1>
      <p className="login-subtitle">
        Workspace untuk akun <strong>ADMIN</strong> dan <strong>MARKETER</strong> yang terdaftar.
      </p>

      {error && (
        <div className="login-alert danger" role="alert" aria-live="assertive">
          <strong>Perhatian:</strong> {error}
        </div>
      )}

      {success && (
        <div className="login-alert success" role="status" aria-live="polite">
          Verifikasi berhasil! Mengalihkan ke workspace…
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-field">
          <label htmlFor="login-email">Email akun</label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@perusahaan.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || success}
          />
        </div>

        <div className="login-field">
          <label htmlFor="login-password">Kata Sandi</label>
          <input
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || success}
          />
        </div>

        <button
          type="submit"
          className="login-submit-btn"
          disabled={loading || success}
        >
          {loading ? (
            "Memverifikasi Kredensial…"
          ) : (
            <>
              Masuk ke workspace
              <svg className="login-btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="login-back-link">
        <Link href="/" prefetch={false}>
          ← Kembali ke Beranda Publik
        </Link>
      </div>
    </div>
  );
}
