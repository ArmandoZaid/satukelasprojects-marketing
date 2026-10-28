import { SATUKELAS_WORKFLOW, SATUKELAS_FAQS } from "@/lib/products-data";
import type { MarketingMember } from "@/lib/member-store";

interface WorkflowSectionProps {
  member: MarketingMember;
}

export function WorkflowSection({ member }: WorkflowSectionProps) {
  return (
    <section
      id="alur"
      style={{
        paddingBlock: "80px",
        borderBottom: "2px solid #000",
        background: "#fff",
      }}
    >
      <div className="wrap">
        {/* Section Header */}
        <div style={{ maxWidth: "780px", marginBottom: "50px" }}>
          <span
            style={{
              display: "inline-block",
              padding: "6px 14px",
              background: "#F6BF75",
              color: "#000",
              fontWeight: 800,
              fontSize: "12px",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              border: "2px solid #000",
              boxShadow: "3px 3px 0 #000",
              marginBottom: "16px",
            }}
          >
            TRANSPARAN &amp; TANPA CEMAS
          </span>
          <h2
            style={{
              fontSize: "clamp(30px, 4vw, 48px)",
              lineHeight: 1.1,
              fontWeight: 850,
              letterSpacing: "-.03em",
            }}
          >
            5 Langkah Mudah Bikin Buku Tahunan
          </h2>
          <p style={{ marginTop: "16px", fontSize: "17px", color: "#444", lineHeight: 1.6 }}>
            Bekerja sama dengan Satukelas Projects dan Kak {member.name.split(" ")[0]} sangat jelas tahapannya.
            Tidak ada biaya tersembunyi, jadwal disepakati bersama, dan buku dijamin selesai sebelum wisuda.
          </p>
        </div>

        {/* 5 Steps Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginBottom: "70px",
          }}
        >
          {SATUKELAS_WORKFLOW.map((wf) => (
            <div
              key={wf.step}
              style={{
                border: "2px solid #000",
                background: "#FFFDF9",
                boxShadow: "4px 4px 0 #000",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: "#000",
                  color: "#FFE600",
                  fontWeight: 900,
                  fontSize: "18px",
                  border: "2px solid #000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "2px 2px 0 #000",
                }}
              >
                {wf.step}
              </div>

              <h3 style={{ fontSize: "18px", fontWeight: 850, lineHeight: 1.3 }}>
                {wf.title}
              </h3>

              <p style={{ fontSize: "13px", color: "#333", lineHeight: 1.5 }}>
                {wf.description}
              </p>

              <div
                style={{
                  marginTop: "auto",
                  padding: "8px 10px",
                  background: "#F4F4F0",
                  border: "1px solid #000",
                  fontSize: "11px",
                  color: "#555",
                  lineHeight: 1.4,
                }}
              >
                {wf.detail}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Area */}
        <div
          style={{
            border: "3px solid #000",
            background: "#FFFDF9",
            boxShadow: "6px 6px 0 #000",
            padding: "36px",
          }}
        >
          <div style={{ marginBottom: "28px" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#666" }}>
              PERTANYAAN UMUM
            </span>
            <h3 style={{ fontSize: "24px", fontWeight: 850, marginTop: "4px" }}>
              Hal yang Sering Ditanyakan Panitia &amp; Guru
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            {SATUKELAS_FAQS.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  border: "2px solid #000",
                  background: "#fff",
                  boxShadow: "3px 3px 0 #000",
                  padding: "20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span
                    style={{
                      background: "#FD5392",
                      color: "#000",
                      fontWeight: 900,
                      fontSize: "12px",
                      padding: "2px 6px",
                      border: "1.5px solid #000",
                      flexShrink: 0,
                    }}
                  >
                    Q
                  </span>
                  <strong style={{ fontSize: "15px", fontWeight: 800, lineHeight: 1.3 }}>
                    {faq.q}
                  </strong>
                </div>
                <p style={{ marginTop: "12px", fontSize: "13px", color: "#444", lineHeight: 1.6, paddingLeft: "26px" }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
