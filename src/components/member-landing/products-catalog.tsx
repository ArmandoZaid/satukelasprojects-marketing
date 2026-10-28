import type { MarketingMember } from "@/lib/member-store";

interface ProductsCatalogProps {
  member?: MarketingMember;
  onSelectProduct?: (productId: string) => void;
}

export function ProductsCatalog({ member }: ProductsCatalogProps = {}) {
  return (
    <section
      id="produk"
      style={{
        paddingBlock: "80px",
        borderBottom: "2px solid #000",
        background: "#fff",
      }}
    >
      <div className="wrap">
        {/* Section Header */}
        <div style={{ maxWidth: "780px" }}>
          <span
            style={{
              display: "inline-block",
              padding: "6px 14px",
              background: "#000",
              color: "#FFE600",
              fontWeight: 800,
              fontSize: "12px",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              border: "2px solid #000",
              boxShadow: "3px 3px 0 #000",
              marginBottom: "16px",
            }}
          >
            KATALOG RESMI SATUKELAS PROJECTS
          </span>
          <h2
            style={{
              fontSize: "clamp(30px, 4vw, 48px)",
              lineHeight: 1.1,
              fontWeight: 850,
              letterSpacing: "-.03em",
            }}
          >
            Karya Kenangan &amp; Solusi Media Sekolah
          </h2>
          <p style={{ marginTop: "16px", fontSize: "17px", color: "#444", lineHeight: 1.6 }}>
            Dari cetak buku fisik eksklusif berteknologi AR sampai video profil sinematik dan siaran langsung wisuda,
            Satukelas Projects menghadirkan standar pengerjaan profesional untuk mengangkat marwah dan kenangan sekolahmu.
          </p>
        </div>
      </div>
    </section>
  );
}
