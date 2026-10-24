# QA frontend admin preview — Satukelas Marketing CRM v0.6

**Status keseluruhan: LULUS (Frontend Preview v0.6 terverifikasi)**

Dokumen ini adalah lembar hasil QA resmi implementasi frontend admin preview Marketing CRM Satukelas Projects pada `apps/marketing`. Seluruh pengujian dijalankan dan diverifikasi secara lokal pada tanggal 24 Oktober 2026. Hasil frontend publik v0.5 pada [QA frontend publik](QA_PUBLIC_FRONTEND.md) tetap berlaku sebagai bukti historis dan telah diverifikasi bebas regresi.

**Kontrak:** [PRD](PRD.md) · [ERD](ERD.md) · [UI/UX Requirements](UI_UX_REQUIREMENTS.md), bagian status implementasi lokal v0.6. Spesifikasi produksi tetap berlaku untuk pengembangan berikutnya; pengujian preview ini tidak menyelesaikan acceptance backend, keamanan, atau kesiapan rilis produksi.

## 1. Objek, lingkungan, dan batas

| Item | Acuan / isian hasil |
|---|---|
| Aplikasi | `apps/marketing`, frontend preview lokal; bukan admin produksi |
| URL review | `http://127.0.0.1:3100/preview/dashboard` (alternatif `http://localhost:3100/preview/dashboard`) |
| Flag aktif | `MARKETING_ENABLE_ADMIN_PREVIEW=true`; diuji pada runtime dev (`next dev`) dan standalone production build (`node scripts/start.mjs`) |
| Flag default | Tidak disetel / bernilai selain `"true"`: route `/preview` beserta seluruh halaman turunannya mengembalikan **HTTP 404** |
| Tanggal acuan demo | **16 Oktober 2026 WIB / Asia/Jakarta**, tetap dan deterministik, bukan waktu live atau tanggal perangkat |
| Data | Seluruh nama sekolah, PIC, peluang, nilai, tugas, dan riwayat aktivitas merupakan **data sintetis berlabel** (`(Contoh)`); tanpa workbook, data pelanggan, atau PII asli |
| State | Memori React per tab; reload browser atau aksi **Reset data contoh** mengembalikan snapshot awal 29 sekolah; tidak menggunakan localStorage, database, atau cookie sesi |
| Backend | Tidak ada API CRM, database, Better Auth, login aktif, schema, atau migration baru; rencana arsitektur PostgreSQL + Drizzle ORM/Kit + `pg` + Better Auth tetap belum dihubungkan |
| Route produksi | Route `/dashboard` dan API privat `/api/*` tetap mengembalikan **HTTP 404** karena belum diimplementasikan; 404 ini bukan bukti kelulusan uji RBAC produksi |
| Regresi publik | Landing `/` dan `/login` informasional tetap utuh; tidak berubah menjadi demo CRM publik atau form login aktif |
| Referensi visual | `C:/Users/MSI-PC/exports/satukelas-crm-preview/render_preview.py` dan `DESIGN-NOTES.md` |
| Identitas revisi yang diuji | Commit `6702942` pada branch `dev` di `C:/Users/MSI-PC/source/repos/satukelasprojects` |
| Tanggal/jam eksekusi QA | **24 Oktober 2026 WIB** (terpisah secara tegas dari tanggal acuan demo 16 Oktober 2026) |
| OS, runtime, browser/versi | Windows 11; Node.js `v26.7.0`; npm `11.19.0`; Next.js `16.4.3`; Vitest `5.0.5`; Playwright `1.64.1` (channel Microsoft Edge) |
| Pelaksana / reviewer | Si Paling Marketing (Hermes Agent `@bebo`) |

Flag preview **bukan authorization**. Review dijalankan hanya secara lokal dengan bind loopback `127.0.0.1`. Jangan mengaktifkannya pada deployment publik.

## 2. Pemeriksaan teknis

Semua pemeriksaan dijalankan dari folder `apps/marketing` menggunakan script dan runner resmi:

| ID | Pemeriksaan | Perintah dan hasil aktual | Status | Bukti |
|---|---|---|---|---|
| TECH-01 | Lint aplikasi marketing | `npm run lint` (`eslint .`) → Exit 0; 0 error, 0 warning | **Lulus** | Output terminal bersih tanpa peringatan |
| TECH-02 | Typecheck | `npm run typecheck` (`tsc --noEmit`) → Exit 0; 0 diagnostic error | **Lulus** | Output terminal bersih |
| TECH-03 | Unit test derivasi/filter/mutasi lokal/guard/waktu demo | `npm run test` (`vitest run`) → Exit 0; **2 test files passed**, **18 tests passed** (0 failed) dalam 206ms | **Lulus** | `src/lib/crm-demo.test.ts` (13 tests) + `src/lib/marketing-config.test.ts` (5 tests) |
| TECH-04 | Build aplikasi | `npm run build` (`next build`) → Exit 0; compiled turbopack dalam 3.9s, static routes (`/`, `/_not-found`, `/login`, `/robots.txt`) dan dynamic route (`/preview/[[...screen]]`) ter-generate | **Lulus** | `.next/standalone` ter-generate lengkap dengan manifest |
| TECH-05 | Runtime standalone dan aset/font/favicon | `node scripts/start.mjs` → Bind `127.0.0.1:3100`; verifikasi HTTP 200 pada `/`, `/favicon.ico`, `/preview/dashboard`. Font Geist lokal termuat | **Lulus** | Response headers valid, asset preload valid, no 404 |
| TECH-06 | Tes browser alur preview serta regresi landing/login/404 | `npm run test:e2e` (`playwright test`) → Exit 0; **23 tests passed** (11 admin preview + 12 public landing) dalam 53.3s | **Lulus** | `test-results/results.json` |
| TECH-07 | Console error, request gagal, aset HTTP >=400 | Event listener Playwright `pageerror`, `requestfailed`, `response >= 400` mencatat **0 failure** selama seluruh rangkaian 23 tes browser | **Lulus** | Array error kosong pada seluruh test case |
| TECH-08 | Pemeriksaan aksesibilitas otomatis dan keyboard manual | AxeBuilder audit (`wcag2a`, `wcag2aa`, `wcag21aa`) melaporkan **0 violations** di seluruh 6 viewport (320, 390, 768, 1024, 1440, 1600 px) serta modal dialog; keyboard Tab, Enter, Escape, trap & restore focus terverifikasi | **Lulus** | `a11y.violations = []` di seluruh layar preview |
| TECH-09 | Audit dependency aplikasi marketing | `npm audit --audit-level=moderate` → Exit 0; **0 vulnerabilities** | **Lulus** | Output: `found 0 vulnerabilities` |

## 3. Skenario fungsional dan batas preview

| ID | Skenario / expected result | Status | Hasil aktual / bukti |
|---|---|---|---|
| ADM-01 | Flag tidak disetel/tidak aktif: `/preview` dan seluruh sub-halaman 404, tidak menyajikan shell atau data demo | **Lulus** | `src/app/preview/layout.tsx` memanggil `notFound()` saat `process.env.MARKETING_ENABLE_ADMIN_PREVIEW !== "true"`; HTTP 404 terverifikasi |
| ADM-02 | Flag aktif: `/preview` redirect ke `/preview/dashboard`; 7 layar (`dashboard`, `opportunities`, `pipeline`, `follow-ups`, `activities`, `reports`, `settings`) dapat dibuka langsung atau di-refresh | **Lulus** | Redirect 307 ke `/preview/dashboard`, seluruh 7 route merespons HTTP 200, heading h1 spesifik tampil sesuai judul |
| ADM-03 | `/dashboard` dan API privat tetap 404; tidak diklaim sebagai bukti otorisasi/RBAC produksi | **Lulus** | Request ke `/dashboard` dan `/api/crm` mengembalikan HTTP 404 pada server aktif |
| ADM-04 | Landing `/` dan `/login` tetap informasional, CTA WhatsApp tidak auto-send dan tidak membuat record | **Lulus** | 12 tes `e2e/public.spec.ts` lolos; CTA membuka popup `wa.me` dengan intercept QA tanpa chat terkirim |
| ADM-05 | Label data sintetis dan tanggal **16 Oktober 2026 WIB** terlihat jelas. Status follow-up deterministik | **Lulus** | Header/sidebar/footer mencantumkan label simulasi; badge Terlambat (4), Hari ini (3), Tanpa jadwal (6) konsisten terhadap tanggal acuan |
| ADM-06 | Filter PIC/wilayah/layanan/periode dan pencarian tersimpan di URL query params; Back/Forward memulihkan state | **Lulus** | Memilih filter PIC `Yunus` mengubah URL ke `?owner=Yunus`, hitungan aktif menjadi 6; berpindah ke `/preview/opportunities` mempertahankan parameter URL |
| ADM-07 | Reset filter hanya mereset filter, tidak menghapus mutasi demo; empty state menyediakan aksi recovery | **Lulus** | Filter periode `2027/2028` memunculkan heading "Tidak ada peluang yang cocok", klik tombol "Reset filter" memulihkan daftar peluang |
| ADM-08 | Tambah prospek sintetis memvalidasi field wajib, mulai Cold Lead, estimasi null-safe; deteksi duplikat aman | **Lulus** | Prospek baru ditambahkan di Cold Lead (total bertambah dari 29 menjadi 30); duplikat nama+layanan+periode ditolak dengan pesan error; normalisasi spasi & case teruji |
| ADM-09 | Detail menampilkan identitas sintetis, PIC/tahap, next action, estimasi, dan riwayat aktivitas | **Lulus** | Dialog detail menampilkan metadata peluang, riwayat simulasi, dan tombol aksi terfokus |
| ADM-10 | Catat hasil + next action satu submit lokal atomik; tidak ada request HTTP write atau localStorage | **Lulus** | Submit memperbarui due date, mengurangi antrean hari ini, mencatat aktivitas di riwayat; listener request mencatat 0 non-GET/HEAD request; `localStorage.length === 0` |
| ADM-11 | OPEN→OPEN berurutan valid; skip/mundur wajib alasan 3–500 karakter; textarea dibatasi 500 karakter | **Lulus** | Pindah ke Negotiation tanpa alasan memunculkan pesan validasi "Alasan wajib 3–500 karakter"; setelah diisi alasan valid, tahap berhasil diperbarui |
| ADM-12 | Won ditolak tanpa nilai final > 0, tanggal closing valid (<= 16 Okt 2026), dan referensi contoh; Lost wajib alasan | **Lulus** | Validasi model dan UI menolak nilai final kosong, tanggal masa depan, atau referensi kosong; unit test dan E2E mengonfirmasi guard |
| ADM-13 | Closing valid mengeluarkan peluang terminal dari antrean aktif dan membatalkan jadwal; terminal dikunci | **Lulus** | Peluang Won/Lost menampilkan keterangan "Status terminal", tombol ubah tahap dan catat hasil tidak tersedia |
| ADM-14 | Pipeline memakai dataset/filter yang sama; jumlah kartu per kolom cocok daftar; perubahan via modal | **Lulus** | 8 kolom tahap menampilkan kartu peluang dengan nilai estimasi dan badge jadwal; klik kartu membuka dialog detail tanpa drag-and-drop |
| ADM-15 | Follow-up membedakan tab Terlambat, Hari ini, Tanpa jadwal, Mendatang; aksi Catat hasil langsung per baris | **Lulus** | Tab aktif memfilter antrean dengan hitungan badge dinamis; tombol "Catat hasil" langsung membuka modal untuk peluang terkait |
| ADM-16 | Dashboard 3 KPI menyatu (Aktif 24, Pipeline Rp184.800.000, Won 3), antrean follow-up dominan, snapshot pipeline | **Lulus** | Seluruh metrik dihitung langsung dari state peluang terfilter (`summarize()`), bukan konstanta statis terpisah |
| ADM-17 | Laporan membedakan estimasi pipeline, Won valid (Rp12.000.000), Lost (2), dan memisahkan Won legacy (1) | **Lulus** | Tabel per PIC menampilkan hitungan Open, pipeline, Won valid, dan overdue; catatan di bawah tabel merinci pemisahan legacy |
| ADM-18 | Pengaturan menjelaskan batas preview lokal, data sintetis, tanpa backend/auth/DB; aksi reset data contoh | **Lulus** | Penjelasan batas arsitektur tampil jelas; tombol "Reset data contoh" memulihkan state memori tab ke snapshot awal |
| ADM-19 | Mutasi bertahan saat navigasi internal dalam tab; reload browser mengembalikan fixture; tanpa storage leak | **Lulus** | Navigasi antar halaman mempertahankan mutasi; reload halaman menghapus mutasi dan mengembalikan data awal; storage persisten bersih |

## 4. Responsif, visual, dan aksesibilitas

| ID | Pemeriksaan / expected result | Status | Hasil aktual / bukti |
|---|---|---|---|
| UX-01 | Tampilan desktop mengikuti acuan: putih/hitam, Geist, pink `#FD5392`, coral `#F86F64`, apricot `#F6BF75`; flat tanpa hard shadow pada admin | **Lulus** | Styling `.crm-app` pada `src/app/preview/crm.css` menerapkan token warna, border 1/2px, radius 4px, dan bayangan datar tanpa drop shadow neobrutalisme landing |
| UX-02 | Sidebar desktop 232px, topbar 72px, gutter 32px; pada layar sempit shell beradaptasi; 3 KPI menyatu | **Lulus** | Layout CSS menggunakan grid terstruktur; pada mobile sidebar bergeser menjadi overlay drawer yang dapat dibuka-tutup |
| UX-03 | Pengujian di 320, 390, 768, 1024, 1440, 1600 px; tidak ada horizontal overflow halaman | **Lulus** | Evaluasi `document.documentElement.scrollWidth <= innerWidth` bernilai `true` pada seluruh 6 viewport |
| UX-04 | Navigasi keyboard penuh dari sidebar, tabel, dialog modal, hingga tombol aksi; trap focus & Escape berfungsi | **Lulus** | Focus trap pada dialog HTML5 native `<dialog>`, Escape menutup dialog dan mengembalikan fokus ke tombol pemanggil |
| UX-05 | Label input terhubung eksplisit, pesan error dengan `role="alert"`, toast sukses dengan `role="status"` | **Lulus** | Seluruh input memiliki label terkait; validasi menampilkan pesan error yang mudah dibaca |
| UX-06 | Kontras warna lulus WCAG 2.1 AA; target sentuh memadai; reduced motion didukung; AxeBuilder 0 violation | **Lulus** | Audit axe otomatis menghasilkan 0 violation pada seluruh layar preview dan dialog |

## 5. Temuan dan mitigasi selama pengembangan

Dua temuan fungsional ditemukan selama pengujian unit dan E2E awal, dan telah dimitigasi secara tuntas:

1. **Deteksi Duplikat Nama Sekolah Sintetis (BUG-MKT-01):**
   - *Temuan:* Ketika pengguna memasukkan nama sekolah tanpa kata "Contoh", fungsi intake otomatis menambahkan label `" (Contoh)"`. Pengecekan duplikasi sebelumnya membandingkan input mentah dengan nama sekolah tersimpan, sehingga jika pengguna menambahkan ulang nama tanpa kata "Contoh", sistem tidak mendeteksinya sebagai duplikat.
   - *Mitigasi:* Normalisasi whitespace diterapkan (`trim().replace(/\s+/g, " ")`), pelabelan dilakukan sebelum pengecekan, dan pembandingan dilakukan secara case-insensitive terhadap `labelledSchool`. Tes regresi ditambahkan pada `crm-demo.test.ts`.

2. **Validasi Panjang Alasan Perubahan Tahap (BUG-MKT-02):**
   - *Temuan:* Dokumen mensyaratkan alasan 3–500 karakter untuk skip tahap, gerak mundur, atau Lost. Kode awal hanya memeriksa non-kosong, dan form UI mengizinkan teks hingga 2.000 karakter.
   - *Mitigasi:* Model `moveStage` diperketat dengan validasi `reason.length >= 3 && reason.length <= 500`. Form UI pada `crm-app.tsx` disesuaikan dengan atribut `maxLength={500}` dan label penjelasan diperbarui. Tes batas diuji pada `crm-demo.test.ts`.

## 6. Bukti visual (Screenshots)

Screenshot full-page dan komponen kunci tersimpan pada folder `apps/marketing/test-results/admin-evidence/`:
- `dashboard-320.png` (320px mobile viewport)
- `dashboard-390.png` (390px mobile viewport)
- `dashboard-768.png` (768px tablet viewport)
- `dashboard-1024.png` (1024px desktop kecil)
- `dashboard-1440.png` (1440px desktop standar)
- `dashboard-1600.png` (1600px desktop lebar)

## 7. Keputusan akhir QA v0.6

**Status Keputusan: LULUS untuk tahap Frontend Admin Preview Lokal v0.6.**

- 18 unit tests lolos (100%).
- 23 tes browser Playwright lolos (100%).
- Build standalone Next.js turbopack berhasil tanpa error.
- Aksesibilitas WCAG 2.1 AA otomatis bersih dari violation di seluruh viewport.
- Regresi landing publik terverifikasi aman.

**Batas yang tetap berlaku:**
Tahap ini adalah preview frontend lokal dengan data sintetis dalam memori tab untuk meninjau tata letak, alur kerja, dan interaksi. Pengembangan backend nyata (PostgreSQL, Drizzle ORM/Kit, driver `pg`, Better Auth, migration version-controlled), otorisasi RBAC nyata, data riil dari workbook/spreadsheet, kapasitas VPS, dan UAT pemilik bisnis tetap merupakan lingkup pengembangan selanjutnya sesuai spesifikasi PRD/ERD.
