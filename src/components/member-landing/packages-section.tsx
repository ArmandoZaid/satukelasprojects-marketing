import { SATUKELAS_PACKAGES, type ProductPackage } from "@/lib/products-data";
import { Arrow } from "@/components/public-shell";
import type { MarketingMember } from "@/lib/member-store";

interface PackagesSectionProps {
  member: MarketingMember;
}

export function PackagesSection({ member }: PackagesSectionProps) {
  const firstName = member.name.split(" ")[0];

  return (
    <section
      id="paket"
      style={{
        paddingBlock: "80px",
        borderBottom: "2px solid #000",
        background: "#FFFDF9",
      }}
    >
      <div className="wrap">
        {/* Section Header */}
        <div style={{ maxWidth: "780px", marginBottom: "50px" }}>
          <span
            style={{
              display: "inline-block",
              padding: "6px 14px",
              background: "#4150B1",
              color: "#fff",
              fontWeight: 800,
              fontSize: "12px",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              border: "2px solid #000",
              boxShadow: "3px 3px 0 #000",
              marginBottom: "16px",
            }}
          >
            PAKET BUNDLING ANGKATAN
          </span>
          <h2
            style={{
              fontSize: "clamp(30px, 4vw, 48px)",
              lineHeight: 1.1,
              fontWeight: 850,
              letterSpacing: "-.03em",
            }}
          >
            Pilihan Paket Sesuai Rencana Angkatanmu
          </h2>
          <p style={{ marginTop: "16px", fontSize: "17px", color: "#444", lineHeight: 1.6 }}>
            Setiap angkatan memiliki keunikan dan kebutuhan tersendiri. Kami menyusun 3 opsi paket kolaborasi teruji yang paling sering dipilih oleh panitia OSIS dan pihak sekolah.
          </p>
        </div>

        {/* Packages Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "28px",
            alignItems: "stretch",
          }}
        >
          {SATUKELAS_PACKAGES.map((pkg: ProductPackage) => {
            const isPopular = pkg.popular;

            return (
              <div
                key={pkg.id}
                style={{
                  border: isPopular ? "4px solid #000" : "3px solid #000",
                  background: isPopular ? "#FFF0F6" : "#fff",
                  boxShadow: isPopular ? "8px 8px 0 #000" : "5px 5px 0 #000",
                  padding: "32px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  transform: isPopular ? "translateY(-8px)" : "none",
                }}
              >
                {/* Popular Ribbon / Badge */}
                {pkg.badge && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-15px",
                      right: "20px",
                      background: pkg.badgeColor || "#FD5392",
                      color: "#000",
                      fontWeight: 850,
                      fontSize: "12px",
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      padding: "6px 14px",
                      border: "2px solid #000",
                      boxShadow: "2px 2px 0 #000",
                    }}
                  >
                    ★ {pkg.badge}
                  </div>
                )}

                <div>
                  {/* Name & Target */}
                  <h3
                    style={{
                      fontSize: "26px",
                      fontWeight: 850,
                      letterSpacing: "-.02em",
                      lineHeight: 1.2,
                    }}
                  >
                    {pkg.name}
                  </h3>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#666", marginTop: "4px" }}>
                    {pkg.target}
                  </div>

                  {/* Price Estimate */}
                  <div
                    style={{
                      marginBlock: "20px",
                      padding: "16px",
                      background: isPopular ? "#fff" : "#F4F4F0",
                      border: "2px solid #000",
                      boxShadow: "3px 3px 0 #000",
                    }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#666" }}>
                      Estimasi Investasi:
                    </span>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: "#000", marginTop: "2px" }}>
                      {pkg.priceEstimate}
                    </div>
                  </div>

                  <p style={{ fontSize: "14px", color: "#333", lineHeight: 1.5, marginBottom: "20px" }}>
                    {pkg.tagline}
                  </p>

                  {/* Feature Checklist */}
                  <div style={{ borderTop: "2px solid #000", paddingTop: "18px", marginBottom: "20px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "12px" }}>
                      Sudah Termasuk:
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                      {pkg.features.map((feat, idx) => (
                        <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", lineHeight: 1.5 }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "18px",
                              height: "18px",
                              background: isPopular ? "#FD5392" : "#FFE600",
                              color: "#000",
                              border: "1.5px solid #000",
                              fontSize: "11px",
                              fontWeight: 900,
                              flexShrink: 0,
                              marginTop: "2px",
                            }}
                          >
                            ✓
                          </span>
                          <span style={{ fontWeight: 650 }}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Action */}
                <div style={{ borderTop: "2px solid #000", paddingTop: "20px", marginTop: "16px" }}>
                  <a
                    href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                      `Halo kak ${firstName}, saya tertarik menanyakan ${pkg.name} untuk sekolah saya (Ref: ${member.id} - ${member.name}). Bisa tolong kirimkan rincian dan sampelnya?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      padding: "14px",
                      background: isPopular ? "#000" : "#fff",
                      color: isPopular ? "#fff" : "#000",
                      fontWeight: 850,
                      fontSize: "14px",
                      border: "2px solid #000",
                      boxShadow: "3px 3px 0 #000",
                      textDecoration: "none",
                    }}
                  >
                    Pilih {pkg.name.split(" ")[0]} Ini <Arrow />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
