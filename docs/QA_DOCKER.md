# QA Docker, PostgreSQL & Dokploy — v0.15

## Kesimpulan

**Integrasi PostgreSQL 16 dan container produksi lokal terverifikasi penuh.** Seluruh data autentikasi, profil akun, member marketing (termasuk nomor WhatsApp & alamat tinggal internal), peluang sekolah (`opportunities`), dan riwayat aktivitas (`activities`) kini disimpan di PostgreSQL dengan transaksi dan advisory lock (`pg_advisory_xact_lock`). Aplikasi diuji bertahan lintas pembuatan ulang container (`--force-recreate`) serta teruji backup (`pg_dump`) dan restore (`psql`).

Akses lokal: `http://127.0.0.1:3100`. Project Compose `satukelas-marketing-local` (`marketing-app` + `marketing-db` PostgreSQL 16 Alpine).

## Hasil eksekusi

| Pemeriksaan | Hasil nyata |
| --- | --- |
| Docker Compose build + `up -d --build --wait` | Exit 0; `marketing-db` dan `marketing-app` healthy; migrasi SQL `0001_initial.sql` dan bootstrap admin berjalan otomatis saat startup |
| `npm test` | 21 file aktif, **217/217 tes unit lulus** |
| `node scripts/postgres-test.mjs` | **21/21 tes integrasi PostgreSQL 16 nyata lulus** (migrasi, checksum, bootstrap idempoten, CRUD akun/member, pencabutan sesi, isolasi RBAC/IDOR, transaksi CRM, konkurensi advisory lock, fail-closed 503) |
| `npm run test:docker` | **16/16 tes lulus**: validasi secret/admin/flags/origin/PostgreSQL config, migrasi ber-checksum, bootstrap scrypt, user/group non-root `nextjs:nodejs`, penyertaan aset migrasi di Dockerfile |
| `npm run typecheck` | Exit 0 (0 error TypeScript) |
| `npm run lint` | Exit 0; 0 error (1 warning lama pada `src/components/member-landing/products-catalog.tsx:8`) |
| Compose lokal dan Dokploy `config --quiet` | Keduanya exit 0 |
| `node scripts/docker-smoke.mjs` | Exit 0; seluruh 8 tahapan lulus (lihat rincian di bawah) |
| Playwright E2E (`npm run test:e2e`) | **51/51 tes lulus** |
| User runtime | `uid=1001(nextjs) gid=1001(nodejs) groups=1001(nodejs)` |
| PostgreSQL (`marketing-db`) | `postgres:16-alpine` healthy, tidak ada host port binding, named volume `satukelas-marketing-local_marketing_pgdata` |

## Rincian Smoke Test Container + PostgreSQL (`node scripts/docker-smoke.mjs`)

1. **Liveness & PostgreSQL Readiness (`/api/health`):** Mengembalikan HTTP 200 `{ "status": "ok", "service": "satukelas-marketing", "database": "ok" }` dengan `Cache-Control: no-store`. Rute publik `/` dan `/login` 200; `/preview/dashboard` 404; akses anonim `/api/auth/me` & `/api/admin/members` ditolak 401; `/dashboard` anonim redirect ke `/login`.
2. **Bootstrap Admin & CRM Operasional Bersih:** Login salah ditolak 401; login admin bootstrap berhasil 200 dengan cookie `HttpOnly` & `SameSite=Lax`. `GET /api/crm` mengembalikan 200 dengan array `opportunities` dan `activities` dari PostgreSQL; `DELETE /api/crm` (reset global) ditolak 403 pada database operasional.
3. **Render Seluruh Rute Workspace CRM di Browser:** Headless Edge memverifikasi `/dashboard`, `/pipeline`, `/opportunities`, `/follow-ups`, `/activities`, `/schools`, `/reports`, `/members`, dan `/settings` semuanya merespons HTTP 200 tanpa page error, tanpa horizontal overflow pada 375px & 1440px, dan menampilkan badge `Penyimpanan database PostgreSQL aktif`.
4. **API Akun & Proteksi Origin (`APP_ORIGIN`):** `GET /api/account` mengembalikan `storage: "postgres"`. Mutasi dengan `Origin` palsu + `X-Forwarded-Host` palsu ditolak 403 tanpa mengubah data; mutasi same-origin berhasil 200 dan dikembalikan ke nilai semula.
5. **CRUD Member & Privasi Landing Publik:** Admin membuat member baru dengan nomor telepon dan `address` internal. Rute publik `/tim/smoke-persist-member` dan `/m/smoke-persist-member` merespons 200 dan terbukti tidak membocorkan `address` internal maupun `passwordHash`.
6. **Persistensi Lintas `--force-recreate` & Guard Relasi 409:** Member login, membuat prospek baru (`POST /api/crm`), dan mencatat aktivitas tindak lanjut (`PATCH /api/crm/opportunities/[id]`). Penghapusan member saat masih memiliki peluang ditolak 409. Container `marketing-app` dibuat ulang dengan `docker compose ... up -d --force-recreate --wait marketing-app`; setelah container baru hidup, seluruh data member, peluang, dan aktivitas terbukti tetap utuh.
7. **Verifikasi Backup `pg_dump` & Restore `psql`:** Backup SQL diambil dari `marketing-db` menggunakan `pg_dump --clean --if-exists`, di-restore ke database sementara `satukelas_restore_check`, dan diverifikasi jumlah barisnya (`users=2`, `opportunities=1`, `activities=1`), lalu database sementara dihapus.
8. **Pembersihan & Logout:** Data uji smoke dibersihkan kembali ke state awal (hanya 1 admin bootstrap) dan logout mencabut sesi (`GET /api/auth/me` kembali 401).

## Langkah selanjutnya untuk pengguna (Deploy VPS Dokploy)

1. Commit dan push perubahan ke repository GitHub (`dev` / `dev-staging` / `main`).
2. Ikuti langkah pada [Panduan Docker & Dokploy](DOCKER_DOKPLOY.md) untuk men-deploy di panel Dokploy VPS dengan variabel environment produksi dan domain HTTPS Traefik.
