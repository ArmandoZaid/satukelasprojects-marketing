import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Arrow, Brand } from "@/components/public-shell";
import type { MarketingMember } from "@/lib/member-store";

interface MemberPublicShellProps {
  member: MarketingMember;
  whatsappUrl: string;
}

export function MemberHeader({ member, whatsappUrl }: MemberPublicShellProps) {
  return (
    <>
      <a className="skip-link" href="#konten">
        Lewati ke konten
      </a>
      <div className="review-strip" style={{ background: "#000", color: "#fff" }}>
        <div className="wrap" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                background: "#00E575",
                borderRadius: "50%",
                boxShadow: "0 0 0 2px #000",
              }}
              aria-hidden="true"
            />
            <strong style={{ color: "#FFE600", fontSize: "11px", letterSpacing: ".06em" }}>
              PIC RESMI TERVERIFIKASI
            </strong>
            <span style={{ fontSize: "12px", color: "#ccc" }}>
              Konsultan Resmi Satukelas Projects
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "#ccc" }}>
            Melayani Wilayah Surabaya &amp; Seluruh Indonesia
          </span>
        </div>
      </div>
      <header style={{ borderBottom: "2px solid #000", background: "#fff", position: "sticky", top: 0, zIndex: 30 }}>
        <div className="wrap nav" style={{ minHeight: "84px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <Brand href="/" />
            <div
              style={{
                borderLeft: "2px solid #000",
                paddingLeft: "16px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 750, textTransform: "uppercase", letterSpacing: ".08em", color: "#FD5392" }}>
                Official Marketer
              </span>
              <strong style={{ fontSize: "14px", fontWeight: 800 }}>
                {member.name}
              </strong>
            </div>
          </div>
          <nav className="primary-nav" aria-label="Navigasi Halaman Member" style={{ display: "flex", gap: "24px" }}>
            <a href="#produk">Katalog Produk</a>
            <a href="#alur">Alur Kerja</a>
            <a href="#konsultasi">Tanya Biaya</a>
          </nav>
          <Button asChild variant="pink" size="nav">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              Chat Kak {member.name.split(" ")[0]} <Arrow />
            </a>
          </Button>
        </div>
      </header>
    </>
  );
}

export function MemberFooter({ member, whatsappUrl }: MemberPublicShellProps) {
  return (
    <footer style={{ borderTop: "2px solid #000", background: "#fff", marginTop: "80px" }}>
      <div className="wrap footer-main" style={{ paddingBlock: "50px 30px" }}>
        <div className="footer-brand-col" style={{ maxWidth: "420px" }}>
          <Brand href="/" />
          <p className="footer-tagline" style={{ marginTop: "14px", fontSize: "15px", color: "#333", lineHeight: 1.5 }}>
            Satukelas Projects adalah production house kreatif yang berfokus pada Buku Tahunan Sekolah inovasi AR,
            Video Profil Institusi Sinematik, Dokumentasi Wisuda, dan Identitas Angkatan.
          </p>
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              border: "2px solid #000",
              background: "#FBFBFA",
              boxShadow: "3px 3px 0 #000",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 750, letterSpacing: ".1em", textTransform: "uppercase", color: "#4150B1" }}>
              Representative Marketing Resmi
            </span>
            <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "4px" }}>{member.name}</div>
            <div style={{ fontSize: "13px", color: "#555", marginTop: "2px" }}>{member.email}</div>
            <div style={{ marginTop: "12px" }}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#000",
                  textDecoration: "underline",
                  textUnderlineOffset: "4px",
                }}
              >
                Hubungi langsung via WhatsApp →
              </a>
            </div>
          </div>
        </div>

        <nav className="footer-nav" aria-label="Navigasi Footer Member" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <strong style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "4px" }}>
            Navigasi Halaman
          </strong>
          <a href="#profil">Profil Konsultan</a>
          <a href="#produk">Katalog Buku AR &amp; Media</a>
          <a href="#alur">5 Alur Kerja Transparan</a>
          <a href="#konsultasi">Hitung Estimasi Biaya</a>
          <Link href="/" style={{ color: "#FD5392", fontWeight: 700 }}>
            Tentang Satukelas Projects →
          </Link>
        </nav>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <strong style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: ".08em" }}>
            Studio &amp; Workshop
          </strong>
          <address style={{ fontStyle: "normal", fontSize: "14px", color: "#444", lineHeight: 1.6 }}>
            Satukelas Projects HQ<br />
            Surabaya, Jawa Timur, Indonesia<br />
            WhatsApp: +62 812-3456-7890
          </address>
          <div style={{ marginTop: "8px" }}>
            <Link className="text-link footer-login" href="/login" prefetch={false}>
              Masuk akun tim CRM <Arrow />
            </Link>
          </div>
        </div>
      </div>

      <div className="wrap footer-meta" style={{ borderTop: "1px solid #ddd", paddingBlock: "18px" }}>
        <span>© {new Date().getFullYear()} Satukelas Projects. All Rights Reserved.</span>
        <span>Halaman Profil Resmi · Representative Terverifikasi</span>
      </div>
    </footer>
  );
}
