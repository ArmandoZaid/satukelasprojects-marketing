"use client";

import { useState } from "react";
import { Arrow } from "@/components/public-shell";
import type { MarketingMember } from "@/lib/member-store";

interface LeadFormProps {
  member: Pick<MarketingMember, "id" | "name">;
}

export function LeadForm({ member }: LeadFormProps) {
  const firstName = member.name.split(" ")[0];

  const [schoolName, setSchoolName] = useState("");
  const [contactName, setContactName] = useState("");
  const [role, setRole] = useState("Ketua Panitia BTS");
  const [studentCount, setStudentCount] = useState("100");
  const [selectedService, setSelectedService] = useState("Buku Tahunan Sekolah (BTS) Inovasi AR");
  const [requestSample, setRequestSample] = useState(true);
  const [notes, setNotes] = useState("");

  const compiledMessage = `Halo Kak ${firstName}, saya ${contactName || "[Nama Kamu]"} (${role}) dari ${schoolName || "[Nama Sekolah]"}.

Saya tertarik konsultasi layanan Satukelas Projects:
- Layanan: ${selectedService}
- Estimasi Jumlah Siswa: ${studentCount} orang
- Request Sampel Fisik ke Sekolah: ${requestSample ? "Ya, mohon dibawakan sampel fisik" : "Konsultasi online dulu"}
${notes ? `- Catatan Khusus: ${notes}\n` : ""}
Mohon info estimasi biaya dan jadwal kunjungan tim ya kak.
(Ref: ${member.id} - ${member.name})`;

  const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(compiledMessage)}`;

  return (
    <section
      id="konsultasi"
      style={{
        paddingBlock: "80px",
        background: "#FFFDF9",
      }}
    >
      <div className="wrap">
        <div
          style={{
            border: "3px solid #000",
            background: "#fff",
            boxShadow: "8px 8px 0 #000",
            padding: "clamp(24px, 4vw, 48px)",
          }}
        >
          {/* Header */}
          <div style={{ maxWidth: "700px", marginBottom: "36px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "6px 14px",
                background: "#FD5392",
                color: "#000",
                fontWeight: 800,
                fontSize: "12px",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                border: "2px solid #000",
                boxShadow: "2px 2px 0 #000",
                marginBottom: "12px",
              }}
            >
              FORMULIR ESTIMASI &amp; REQUEST SAMPEL
            </span>
            <h2
              style={{
                fontSize: "clamp(28px, 3.5vw, 42px)",
                fontWeight: 850,
                lineHeight: 1.15,
                letterSpacing: "-.03em",
              }}
            >
              Tanya Biaya &amp; Jadwalkan Kunjungan ke Sekolah
            </h2>
            <p style={{ marginTop: "12px", fontSize: "16px", color: "#444", lineHeight: 1.6 }}>
              Isi data singkat di bawah ini. Pesan akan otomatis terformat rapi dan langsung terkirim ke WhatsApp
              pribadi Kak <strong>{member.name}</strong> untuk direspons cepat.
            </p>
          </div>

          {/* Form + Message Preview Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "36px",
            }}
          >
            {/* Form Inputs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label
                  htmlFor="school-name"
                  style={{ display: "block", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}
                >
                  Nama Sekolah / Institusi *
                </label>
                <input
                  id="school-name"
                  type="text"
                  placeholder="Contoh: SMAN 5 Surabaya / SMP Labschool"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "2px solid #000",
                    background: "#FBFBFA",
                    fontSize: "14px",
                    fontWeight: 600,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label
                    htmlFor="contact-name"
                    style={{ display: "block", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}
                  >
                    Nama Kamu *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Nama panggilanmu"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "2px solid #000",
                      background: "#FBFBFA",
                      fontSize: "14px",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="role-select"
                    style={{ display: "block", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}
                  >
                    Peran di Sekolah
                  </label>
                  <select
                    id="role-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "2px solid #000",
                      background: "#FBFBFA",
                      fontSize: "14px",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  >
                    <option value="Ketua Panitia BTS">Ketua Panitia BTS</option>
                    <option value="Pengurus OSIS">Pengurus OSIS</option>
                    <option value="Siswa Angkatan">Siswa Angkatan</option>
                    <option value="Guru Pembina">Guru Pembina</option>
                    <option value="Wali Murid">Wali Murid / Komite</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label
                    htmlFor="student-count"
                    style={{ display: "block", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}
                  >
                    Estimasi Jumlah Siswa
                  </label>
                  <input
                    id="student-count"
                    type="number"
                    min="10"
                    max="2000"
                    value={studentCount}
                    onChange={(e) => setStudentCount(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "2px solid #000",
                      background: "#FBFBFA",
                      fontSize: "14px",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="service-select"
                    style={{ display: "block", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}
                  >
                    Layanan Diminati
                  </label>
                  <select
                    id="service-select"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: "2px solid #000",
                      background: "#FBFBFA",
                      fontSize: "14px",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  >
                    <option value="Buku Tahunan Sekolah (BTS) Inovasi AR">Buku Tahunan Inovasi AR</option>
                    <option value="Video Profile Sekolah Sinematik">Video Profile Sekolah 4K</option>
                    <option value="Dokumentasi Wisuda & Live Streaming">Wisuda &amp; Live Streaming</option>
                    <option value="Merchandise & Identitas Angkatan">Merchandise Angkatan</option>
                  </select>
                </div>
              </div>

              {/* Sample Request Checkbox */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px",
                  background: "#FFF9E6",
                  border: "2px solid #000",
                  boxShadow: "2px 2px 0 #000",
                }}
              >
                <input
                  type="checkbox"
                  id="request-sample"
                  checked={requestSample}
                  onChange={(e) => setRequestSample(e.target.checked)}
                  style={{
                    width: "20px",
                    height: "20px",
                    accentColor: "#000",
                    marginTop: "2px",
                    cursor: "pointer",
                  }}
                />
                <label htmlFor="request-sample" style={{ fontSize: "13px", fontWeight: 700, cursor: "pointer", lineHeight: 1.4 }}>
                  Ingin Tim Satukelas &amp; Kak {firstName} bawakan sampel buku fisik asli &amp; demo scan AR ke sekolah (FREE tanpa pungutan biaya)
                </label>
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="notes"
                  style={{ display: "block", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}
                >
                  Catatan Tambahan / Konsep Impian (Opsional)
                </label>
                <textarea
                  id="notes"
                  rows={2}
                  placeholder="Misal: Ingin konsep vintage 90s, butuh sesi outdoor di Bromo, atau target selesai Maret."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    border: "2px solid #000",
                    background: "#FBFBFA",
                    fontSize: "14px",
                    fontWeight: 600,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Realtime WhatsApp Message Preview Box */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                border: "2px solid #000",
                background: "#F4F4F0",
                boxShadow: "4px 4px 0 #000",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000", paddingBottom: "12px", marginBottom: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: 850, letterSpacing: ".1em", textTransform: "uppercase", color: "#666" }}>
                  PREVIEW PESAN WHATSAPP
                </span>
                <span style={{ fontSize: "11px", fontWeight: 750, color: "#00E575", background: "#000", padding: "2px 8px" }}>
                  LIVE
                </span>
              </div>

              <pre
                style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                  color: "#222",
                  background: "#fff",
                  border: "2px solid #000",
                  padding: "16px",
                  flexGrow: 1,
                  minHeight: "220px",
                }}
              >
                {compiledMessage}
              </pre>

              <div style={{ marginTop: "20px" }}>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "16px",
                    background: "#00E575",
                    color: "#000",
                    fontWeight: 900,
                    fontSize: "15px",
                    letterSpacing: ".02em",
                    border: "3px solid #000",
                    boxShadow: "4px 4px 0 #000",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  KIRIM KE WHATSAPP KAK {firstName.toUpperCase()} <Arrow />
                </a>
                <div style={{ fontSize: "12px", color: "#666", textAlign: "center", marginTop: "10px" }}>
                  Pesan akan otomatis terbuka di aplikasi WhatsApp ponsel atau desktop milikmu.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
