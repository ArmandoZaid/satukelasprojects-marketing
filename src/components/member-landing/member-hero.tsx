import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Arrow } from "@/components/public-shell";
import type { MarketingMember } from "@/lib/member-store";

interface MemberHeroProps {
  member: MarketingMember;
  whatsappUrl: string;
}

export function MemberHero({ member, whatsappUrl }: MemberHeroProps) {
  const firstName = member.name.split(" ")[0];

  return (
    <section
      id="profil"
      style={{
        borderBottom: "2px solid #000",
        background: "#FFFDF9",
        paddingBlock: "70px 60px",
      }}
    >
      <div className="wrap" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "48px", alignItems: "center" }}>
        {/* Left Column: Personal Narrative & Value Proposition */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-block",
                padding: "6px 14px",
                background: "#FD5392",
                color: "#000",
                fontWeight: 800,
                fontSize: "12px",
                letterSpacing: ".06em",
                textTransform: "uppercase",
                border: "2px solid #000",
                boxShadow: "2px 2px 0 #000",
              }}
            >
              PIC KONSULTAN SEKOLAH
            </span>
            <span
              style={{
                display: "inline-block",
                padding: "6px 14px",
                background: "#FFE600",
                color: "#000",
                fontWeight: 750,
                fontSize: "12px",
                border: "2px solid #000",
                boxShadow: "2px 2px 0 #000",
              }}
            >
              Surabaya &amp; Sekitarnya
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(34px, 4.5vw, 56px)",
              lineHeight: 1.05,
              fontWeight: 850,
              letterSpacing: "-.035em",
            }}
          >
            Halo! Aku <span style={{ color: "#FD5392", textDecoration: "underline", textUnderlineOffset: "6px", textDecorationThickness: "4px" }}>{member.name}</span>, siap temani proyek buku tahunan sekolahmu.
          </h1>

          <p style={{ fontSize: "18px", lineHeight: 1.6, color: "#222" }}>
            Sebagai tim representatif resmi <strong>Satukelas Projects</strong>, tugasku memastikan panitia buku tahunan sekolahmu tidak merasa bingung atau pusing. Dari curhat konsep, bawakan sampel buku fisik asli ke sekolah, sesi foto seru bareng tim profesional, sampai buku cetak berfitur <strong>Augmented Reality (AR)</strong> sampai tepat waktu sebelum wisuda!
          </p>

          {/* Social Proof / Pillars of Assurance */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
              marginBlock: "8px",
            }}
          >
            <div
              style={{
                padding: "14px",
                border: "2px solid #000",
                background: "#fff",
                boxShadow: "3px 3px 0 #000",
              }}
            >
              <div style={{ fontSize: "20px", fontWeight: 850, color: "#4150B1" }}>100%</div>
              <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "2px" }}>Garansi Tepat Waktu</div>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>Buku jadi sebelum wisuda</div>
            </div>

            <div
              style={{
                padding: "14px",
                border: "2px solid #000",
                background: "#fff",
                boxShadow: "3px 3px 0 #000",
              }}
            >
              <div style={{ fontSize: "20px", fontWeight: 850, color: "#FD5392" }}>AR Scan</div>
              <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "2px" }}>Foto Bisa Bergerak</div>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>Scan via kamera smartphone</div>
            </div>

            <div
              style={{
                padding: "14px",
                border: "2px solid #000",
                background: "#fff",
                boxShadow: "3px 3px 0 #000",
              }}
            >
              <div style={{ fontSize: "20px", fontWeight: 850, color: "#000" }}>FREE Visit</div>
              <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "2px" }}>Bawa Sampel Fisik</div>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>Bisa coba pegang langsung</div>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <Button asChild variant="default" size="default">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "#000",
                  color: "#fff",
                  boxShadow: "4px 4px 0 #000",
                  minHeight: "56px",
                  paddingInline: "26px",
                }}
              >
                Konsultasi Bareng Kak {firstName} <Arrow />
              </a>
            </Button>
            <Button asChild variant="pink" size="default">
              <a
                href="#produk"
                style={{
                  background: "#FFE600",
                  color: "#000",
                  boxShadow: "4px 4px 0 #000",
                  minHeight: "56px",
                  paddingInline: "22px",
                }}
              >
                Lihat Katalog Produk ↓
              </a>
            </Button>
          </div>
        </div>

        {/* Right Column: Member Profile Card / Avatar Showcase */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              border: "3px solid #000",
              background: "#fff",
              boxShadow: "8px 8px 0 #000",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Header Card */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000", paddingBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#666" }}>
                  IDENTITAS RESMI
                </span>
                <div style={{ fontSize: "13px", fontWeight: 750 }}>Satukelas Projects</div>
              </div>
              <div
                style={{
                  padding: "4px 10px",
                  background: "#00E575",
                  border: "2px solid #000",
                  fontSize: "11px",
                  fontWeight: 800,
                  boxShadow: "2px 2px 0 #000",
                }}
              >
                ACTIVE PIC
              </div>
            </div>

            {/* Avatar Image Frame */}
            <div
              style={{
                width: "100%",
                height: "300px",
                border: "2px solid #000",
                background: "#F4F4F0",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {member.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.avatarUrl}
                  alt={`Foto profil resmi ${member.name}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", position: "relative", padding: "16px" }}>
                  <Image
                    src="/images/characters/production-editor.svg"
                    alt={`Ilustrasi representatif ${member.name}`}
                    fill
                    style={{ objectFit: "contain" }}
                    priority
                  />
                </div>
              )}
            </div>

            {/* Profile Meta Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontSize: "22px", fontWeight: 850 }}>{member.name}</div>
              <div style={{ fontSize: "14px", fontWeight: 650, color: "#4150B1" }}>
                Marketing Representative &amp; School Consultant
              </div>
              <div style={{ fontSize: "13px", color: "#555" }}>
                Email: {member.email}
              </div>
            </div>

            {/* Direct Contact Action */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "12px",
                background: "#FD5392",
                color: "#000",
                fontWeight: 800,
                fontSize: "14px",
                border: "2px solid #000",
                boxShadow: "3px 3px 0 #000",
                textDecoration: "none",
              }}
            >
              Chat WhatsApp Kak {firstName} →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
