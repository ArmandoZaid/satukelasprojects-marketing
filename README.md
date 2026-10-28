# Satukelas Projects — Marketing Landing & CRM Admin (Multi-Role Auth)

Aplikasi Next.js terisolasi (`apps/marketing`) untuk landing kemitraan marketing publik dan CRM internal Satukelas Projects dengan otentikasi multi-role (ADMIN & MARKETER) serta isolasi data server-side.

Acuan: `../../docs/marketing/PRD.md`, `ERD.md`, dan `UI_UX_REQUIREMENTS.md`.

## Menjalankan secara lokal

Gunakan Node.js 24/26 LTS. Dari folder `apps/marketing`:

```bash
# 1. Install dependencies
npm ci

# 2. Build aplikasi (Next.js standalone Turbopack)
npm run build

# 3. Jalankan server demo standalone (Admin & Marketing auth aktif di port 3100)
node scripts/start-demo-server.mjs
```

Atau dalam mode development:
```bash
MARKETING_ENABLE_DEMO_AUTH=true MARKETING_ENABLE_SYNTHETIC_CRM=true npm run dev
```

Server akan aktif pada **http://127.0.0.1:3100/** (atau **http://localhost:3100/**).

## Akun Demo & Hak Akses

Saat `MARKETING_ENABLE_DEMO_AUTH=true` aktif, tersedia akun demo lokal:

| Peran | Nama | Email | Akses Layar | Cakupan Data |
|---|---|---|---|---|
| **ADMIN** | Administrator | `admin@satukelas.com` | Semua layar (7 menu) + Pengaturan + Reset | Melihat seluruh data tim & seluruh PIC |
| **MARKETER** | Yunus | `marketer@satukelas.com` | 6 layar (Dashboard, Sekolah & peluang, Pipeline, Tindak lanjut, Aktivitas, Laporan) | Hanya data miliknya (`usr_mkt_01`) |
| **MARKETER** | Dzaky | `dzaky@satukelas.com` | 6 layar kerja CRM | Hanya data miliknya (`usr_mkt_02`) |

> *Catatan keamanan:* Rute `/settings` dan `/admin` terproteksi secara mutlak di tingkat server (HTTP 403 Forbidden) bagi role MARKETER.

## Halaman dan Akses

### 1. Website Publik (Landing Kemitraan Marketing)
- **URL:** `http://127.0.0.1:3100/`
- Menampilkan profil kemitraan, karya buku tahunan, alur kolaborasi, dan FAQ interaktif.
- CTA primer (**"Gas Mulai Bareng Kami"** dan **"Gas Bikin Cerita Bareng"**) mengarahkan langsung ke WhatsApp kemitraan tanpa form registrasi atau penulisan database.

### 2. Login Web Admin CRM
- **URL:** `http://127.0.0.1:3100/login`
- Form autentikasi resmi dengan validasi kredensial scrypt dan cookie sesi HttpOnly HMAC-SHA256.
- Bebas dari petunjuk kredensial otomatis (anti-credential hint).

### 3. CRM Operasional (Terproteksi Multi-Role)
- **Dashboard:** `http://127.0.0.1:3100/dashboard`
- **Sekolah & Peluang:** `http://127.0.0.1:3100/opportunities`
- **Pipeline:** `http://127.0.0.1:3100/pipeline`
- **Tindak Lanjut:** `http://127.0.0.1:3100/follow-ups`
- **Aktivitas:** `http://127.0.0.1:3100/activities`
- **Laporan:** `http://127.0.0.1:3100/reports`
- **Pengaturan (Khusus Admin):** `http://127.0.0.1:3100/settings`
- **Tim Marketing (Khusus Admin):** `http://127.0.0.1:3100/admin/members` (atau `/members`)

## Kontak member marketing (admin)

Pada `/admin/members` atau `/members`, admin dapat menambah/mengedit nomor telepon/WhatsApp dan alamat tempat tinggal. Email aktif memakai email akun yang sama untuk login (wajib, format valid, unik; belum ada verifikasi kotak masuk). Nomor telepon opsional 7–30 karakter, alamat opsional maksimal 500 karakter. Nilai kosong menghapus kontak lama; data lama yang belum punya alamat ditampilkan sebagai "Belum diisi". Alamat hanya terlihat di tabel/form admin, tidak dipublikasikan pada landing atau kartu nama.

**Batas penyimpanan saat ini:** registry member masih in-memory (`globalThis`), bukan database persisten. Data bertahan saat refresh halaman pada proses yang sama, tetapi hilang saat proses server restart dan tidak dibagi antar-instance. Jangan gunakan data pribadi asli sebelum penyimpanan produksi tersedia.

## Verifikasi dan Pengujian Kualitas

```bash
# Linting kode
npm run lint

# Pengecekan tipe TypeScript
npm run typecheck

# Unit testing (Vitest — 124 tests)
npm run test

# End-to-End browser testing (Playwright — 40 tests)
npx playwright test
```

Hasil verifikasi QA v0.11:
- **Lint & Typecheck:** 0 diagnostics error (exit code 0).
- **Unit Tests:** 124 tests lulus (100%) di 11 test files (`auth.test.ts`, `crm-access.test.ts`, `crm-data.test.ts`, `crm-demo.test.ts`, `public-landing.test.ts`, `crm-security.test.ts`, `member-store.test.ts`, `member-identity.test.ts`, `member-hardening.test.ts`, `member-integrity.test.ts`, `admin-members.test.ts`).
- **E2E Browser Tests:** 40 tests lulus (100%) di 7 spec files (`auth.spec.ts`, `demo-marketing.spec.ts`, `marketing-auth.spec.ts`, `public.spec.ts`, `admin.spec.ts`, `members.spec.ts`, `security.spec.ts`).
- **Isolasi Server-Side & Hardening:** Teruji lolos uji IDOR, manipulasi query owner, proteksi CSRF cross-origin/loopback kanonik, pencabutan sesi seketika via `sessionVersion`, proteksi relasi 409 Conflict & 503 Fail-Closed, serta CRUD member dengan live avatar preview.

Laporan pengujian lengkap:
- Autentikasi Multi-Role, Manajemen Member & Hardening (v0.11): `docs/QA_AUTH_MARKETING.md`
- Kontrak Spesifikasi: `docs/PRD.md`, `docs/ERD.md`, `docs/UI_UX_REQUIREMENTS.md`
