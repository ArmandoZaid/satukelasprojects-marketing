import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Arrow() {
  return <svg className="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export function Brand({ href = "/" }: { href?: string }) {
  return <Link className="brand" href={href} aria-label="Satukelas Projects, awal halaman"><span>satukelas<span className="brand-dot">.</span></span><small>PROJECTS</small></Link>;
}

export function PublicHeader({ compact = false }: { compact?: boolean }) {
  return <>
    <a className="skip-link" href="#konten">Lewati ke konten</a>
    <div className="review-strip"><div className="wrap"><strong>PREVIEW LOKAL</strong><span>Frontend publik · Belum dipublikasikan.</span></div></div>
    <header>
      <div className="wrap nav">
        <Brand />
        {!compact && <>
          <nav className="primary-nav" aria-label="Navigasi utama"><a href="#peran">Peranmu</a><a href="#cocok">Cocok buatmu?</a><a href="#alur">Langkah awal</a></nav>
          <Button asChild variant="pink" size="nav"><a href="#gabung">Cara bergabung <Arrow /></a></Button>
        </>}
      </div>
    </header>
  </>;
}

export function PublicFooter() {
  return <footer>
    <div className="wrap footer-main">
      <div className="footer-brand-col"><Brand /><p className="footer-tagline">Kenalan. Kolaborasi. Bikin cerita.</p></div>
      <nav className="footer-nav" aria-label="Navigasi footer"><a href="#peran">Peranmu</a><a href="#cocok">Cocok buatmu?</a><a href="#alur">Langkah awal</a></nav>
      <Link className="text-link footer-login" href="/login" prefetch={false}>Masuk akun tim <Arrow /></Link>
    </div>
    <div className="wrap footer-meta"><span>Satukelas Projects · Mitra Marketing</span><span>Preview lokal · Autentikasi tim belum tersedia</span></div>
  </footer>;
}
