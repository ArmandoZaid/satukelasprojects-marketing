"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="wrap login-main" id="konten" tabIndex={-1}><h1>Halaman belum bisa dimuat.</h1><p>Coba muat ulang halaman. Jika masih bermasalah, silakan kembali lagi nanti.</p><Button onClick={reset}>Muat ulang</Button></main>;
}
