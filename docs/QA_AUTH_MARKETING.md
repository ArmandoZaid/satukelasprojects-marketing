# QA Autentikasi Admin & Marketing — Satukelas Marketing CRM v0.8

**Status keseluruhan: LULUS (Autentikasi Multi-Role & Isolasi Server-Side v0.8 terverifikasi)**

Dokumen ini adalah lembar hasil QA resmi implementasi autentikasi multi-role (ADMIN dan MARKETER) serta isolasi data server-side pada aplikasi `apps/marketing`. Seluruh pengujian dijalankan dan diverifikasi secara lokal pada tanggal 24 Oktober 2026.

**Kontrak Pasangan:** [PRD](PRD.md) · [ERD](ERD.md) · [UI/UX Requirements](UI_UX_REQUIREMENTS.md) v0.8.

---

## 1. Lingkungan & Konfigurasi Pengujian

| Komponen | Spesifikasi / Nilai Aktual |
|---|---|
| Repositori & Aplikasi | `satukelasprojects` / `apps/marketing` |
| URL Server Aktif | `http://127.0.0.1:3100` (loopback) |
| Runtime & Server | Node.js `v26.7.0`, Next.js `16.4.3` (Standalone precompiled build via `scripts/start-demo-server.mjs`) |
| Pengujian Unit | Vitest `v5.0.5` |
| Pengujian Browser E2E | Playwright `v1.64.1` (Chromium / headless) |
| Environment Variables Aktif | `PORT=3100`, `MARKETING_HOSTNAME=127.0.0.1`, `MARKETING_ENABLE_DEMO_AUTH=true`, `MARKETING_ENABLE_SYNTHETIC_CRM=true`, `USE_SECURE_COOKIES=false` |
| Tanggal Eksekusi QA | **24 Oktober 2026 WIB** |
| Pelaksana / Reviewer | Si Paling Marketing (Hermes Agent `@bebo`) |

---

## 2. Pemeriksaan Teknis & Kualitas Kode

| ID | Jenis Pemeriksaan | Perintah Eksekusi | Hasil Aktual | Status |
|---|---|---|---|---|
| **TECH-01** | TypeScript Typecheck | `npm run typecheck` (`tsc --noEmit`) | 0 error, exit code 0 | **LULUS** |
| **TECH-02** | ESLint Code Quality | `npm run lint` (`eslint .`) | 0 error, 0 warning, exit code 0 | **LULUS** |
| **TECH-03** | Unit & Logic Tests | `npm run test` (`vitest run`) | 5 test files, 46 tests passed (1.55s) | **LULUS** |
| **TECH-04** | Standalone Production Build | `npm run build` | Next.js standalone bundle compiled successfully | **LULUS** |
| **TECH-05** | Browser E2E Suite | `npx playwright test` | 5 spec files, 34 tests passed (46.8s) | **LULUS** |

---

## 3. Matriks Hasil Pengujian Fungsional & Keamanan (34 Skenario E2E)

### A. Autentikasi & Otorisasi Admin (`e2e/auth.spec.ts`)

| ID | Skenario | Hasil Verifikasi | Status |
|---|---|---|---|
| **AUTH-01** | Akses rute privat tanpa sesi diarahkan ke `/login` | Akses `/dashboard`, `/pipeline`, dll dialihkan dengan HTTP 307 ke `/login` | **LULUS** |
| **AUTH-02** | Aksesibilitas WCAG form login | Kontras warna, label input, dan struktur form memenuhi standar aksesibilitas | **LULUS** |
| **AUTH-03** | Penolakan kredensial salah | Password keliru mengembalikan HTTP 401 dan pesan kesalahan tanpa bocoran data | **LULUS** |
| **AUTH-04** | Login Admin sukses dan logout | Admin masuk, melihat role ADMIN, topbar aktif, dan logout membersihkan cookie | **LULUS** |

### B. Autentikasi & Pengalaman Marketing (`e2e/demo-marketing.spec.ts` & `e2e/marketing-auth.spec.ts`)

| ID | Skenario | Hasil Verifikasi | Status |
|---|---|---|---|
| **MKT-01** | Login Marketing (Yunus) | Berhasil login dengan kredensial Marketer, dialihkan ke `/dashboard` | **LULUS** |
| **MKT-02** | Heading & Role Tag | Menampilkan "Dashboard marketing" dan badge `ROLE: MARKETER` | **LULUS** |
| **MKT-03** | Pembatasan Navigasi Sidebar | Sidebar hanya berisi tepat 6 link (Dashboard, Sekolah & peluang, Pipeline, Tindak lanjut, Aktivitas, Laporan); Pengaturan tidak ada | **LULUS** |
| **MKT-04** | Proteksi Rute Langsung `/settings` | Akses langsung ke `/settings` ditolak server dengan HTTP 403 Forbidden ("Akses ditolak") | **LULUS** |
| **MKT-05** | Proteksi Rute Langsung `/admin` | Akses langsung ke `/admin` ditolak server dengan HTTP 403 Forbidden ("Akses ditolak") | **LULUS** |
| **MKT-06** | Anti-Credential Hint | Halaman login bersih dari saran kredensial atau password bawaan di DOM | **LULUS** |
| **MKT-07** | Logout Marketing | Tombol `.crm-logout-action` menghapus sesi dan mengarahkan kembali ke `/login` | **LULUS** |

### C. Isolasi Data Server-Side & Anti-IDOR (`e2e/demo-marketing.spec.ts` & `e2e/marketing-auth.spec.ts`)

| ID | Skenario | Hasil Verifikasi | Status |
|---|---|---|---|
| **IDOR-01** | Scoping API Server CRM | Permintaan `GET /api/crm` oleh Marketer Yunus hanya mengembalikan data dengan `ownerId: "usr_mkt_01"` | **LULUS** |
| **IDOR-02** | Isolasi Lintas Akun Marketing | Yunus (`usr_mkt_01`) dan Dzaky (`usr_mkt_02`) memiliki dataset peluang yang sepenuhnya terpisah | **LULUS** |
| **IDOR-03** | Penolakan Spoofing OwnerId | Manipulasi parameter query `GET /api/crm?ownerId=usr_mkt_02` oleh Yunus diabaikan server; server tetap memaksakan data `usr_mkt_01` | **LULUS** |
| **IDOR-04** | Mutasi Data Baru Milik Sendiri | Penambahan prospek baru otomatis diikat ke `ownerId: session.id` dan bertahan saat reload | **LULUS** |
| **IDOR-05** | Proteksi CSRF & Origin Cross-Site | Request mutasi dari `https://evil.invalid` ditolak dengan HTTP 403; request loopback `127.0.0.1` diizinkan | **LULUS** |

### D. Fungsionalitas Admin CRM (`e2e/admin.spec.ts`)

| ID | Skenario | Hasil Verifikasi | Status |
|---|---|---|---|
| **ADM-01** | Action-first dashboard | Tiga KPI terpadu, antrean follow-up, dan visualisasi pipeline aktif | **LULUS** |
| **ADM-02** | Filter dan navigasi | Filter wilayah, layanan, dan periode tersimpan di URL | **LULUS** |
| **ADM-03** | Pencatatan hasil & update status | Pembaruan catatan follow-up dan perubahan tahap pipeline berfungsi | **LULUS** |
| **ADM-04** | Validasi input & transisi status | Validasi alasan pembatalan/mundur (3-500 karakter) dan guard status Won/Lost | **LULUS** |
| **ADM-05** | Responsif multi-viewport (320px–1600px) | Seluruh 6 viewport diuji tanpa overflow horizontal atau tata letak patah | **LULUS** |

### E. Halaman Publik & Rekrutmen Mitra (`e2e/public.spec.ts`)

| ID | Skenario | Hasil Verifikasi | Status |
|---|---|---|---|
| **PUB-01** | Tata letak landing & CTA | Tombol CTA Gen Z "Gas Mulai Bareng Kami" dan "Gas Bikin Cerita Bareng" terarah ke WhatsApp kemitraan | **LULUS** |
| **PUB-02** | Navigasi jangkar & FAQ interaktif | Akordeon FAQ dan navigasi halaman beroperasi lancar | **LULUS** |
| **PUB-03** | Keamanan data publik | Halaman publik bebas cookie sesi CRM dan memiliki header pembatas indexing yang tepat | **LULUS** |
| **PUB-04** | Aksesibilitas halaman publik | Lolos audit axe accessibility otomatis di 390px dan 1440px | **LULUS** |

---

## 4. Kesimpulan QA

Implementasi **Autentikasi Multi-Role & Isolasi Server-Side v0.8** telah teruji secara komprehensif dan dinyatakan **LULUS** di seluruh kriteria penerimaan teknis, fungsionalitas, keamanan rute, dan perlindungan isolasi data. Aplikasi siap digunakan untuk peninjauan lokal tim dan demonstrasi alur operasional.
