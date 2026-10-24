import { PublicHeader, Arrow } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function NotFound() {
  return <><PublicHeader compact /><main className="wrap login-main" id="konten" tabIndex={-1}><h1>Halaman tidak ditemukan.</h1><p>Kembali ke halaman kemitraan untuk mengenal peran dan langkah awalnya.</p><Button asChild variant="pink"><Link href="/">Kembali ke landing <Arrow /></Link></Button></main></>;
}
