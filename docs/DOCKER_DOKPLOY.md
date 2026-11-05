# Docker & Dokploy — Satukelas Marketing (v0.15 PostgreSQL)

## Cakupan dan kesiapan

Setup ini menyediakan aplikasi Next.js 16 standalone dengan Node.js 24 Alpine, UID/GID non-root `1001:1001`, integrasi **PostgreSQL 16** penuh menggunakan Drizzle ORM + driver `pg`, migrasi SQL ber-checksum (`scripts/db-migrate.mjs`), bootstrap akun admin idempoten (`scripts/db-bootstrap.mjs`), validasi konfigurasi startup, healthcheck yang menguji konektivitas PostgreSQL (`/api/health`), dan dukungan Traefik bawaan Dokploy tanpa Nginx/Caddy tambahan.

**Penyimpanan PostgreSQL aktif untuk seluruh fitur operasional:**
- Akun login (`ADMIN` & `MARKETER`), hash password (`scrypt`), status keaktifan (`is_active`), dan pencabutan sesi seketika (`session_version`) disimpan di tabel `users`.
- Profil kontak member marketing (`phone`, `address` internal, `title`, `avatar_url`) dan resolusi landing publik (`/tim/[slug]` & `/m/[slug]`) dibaca langsung dari PostgreSQL.
- Peluang sekolah (`opportunities`) dan riwayat tindak lanjut (`activities`) disimpan secara transaksional dengan compound foreign key dan advisory lock (`pg_advisory_xact_lock`).
- Seluruh perubahan akun, member, peluang, dan aktivitas bertahan melintasi restart maupun pembuatan ulang container (`--force-recreate`).

## Berkas

- `Dockerfile`: build multi-stage Node 24 Alpine, user non-root `nextjs:nodejs` (1001:1001), menyertakan standalone build, aset statis, `migrations/`, `src/lib/db/config.mjs`, serta script migrasi, bootstrap, startup, dan healthcheck.
- `.dockerignore`: mengecualikan `.env*`, private key, Git, build lokal `.next*`, test report, graph dan dokumentasi agar tidak masuk image.
- `docker-compose.yml`: mendefinisikan `marketing-app` dan `marketing-db` (`postgres:16-alpine`) dengan healthcheck, volume persisten `marketing_pgdata`, dan dependency `service_healthy`. Tidak memublikasikan port database ke host/internet.
- `docker-compose.local.yml`: override lokal untuk mengikat port aplikasi ke `127.0.0.1:3100` dengan HTTP cookie lokal.
- `docker-compose.dokploy.yml`: menghubungkan `marketing-app` ke `dokploy-network` untuk routing domain/HTTPS Traefik Dokploy (sedangkan `marketing-db` tetap terisolasi di jaringan internal).
- `.env.example`: template variabel environment runtime tanpa kredensial bawaan.

## Jalankan di Docker Lokal

Prasyarat: Docker Engine/Desktop aktif, Compose v2+, Node 24+. Jalankan dari root repo:

```bash
node scripts/setup-docker-env.mjs
# Membuat .env.docker dengan credential acak; tidak mencetak nilainya,
# tidak menimpa file lama, dan file diabaikan Git serta build Docker.

docker compose --env-file .env.docker -p satukelas-marketing-local -f docker-compose.yml -f docker-compose.local.yml config --quiet
docker compose --env-file .env.docker -p satukelas-marketing-local -f docker-compose.yml -f docker-compose.local.yml up -d --build --wait
```

Saat container `marketing-app` menyala:
1. `scripts/container-start.mjs` memvalidasi seluruh variabel environment (`APP_ORIGIN`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, dan koneksi PostgreSQL).
2. Menjalankan `migrateDatabase()` (`migrations/0001_initial.sql`) secara transaksional dan idempoten.
3. Menjalankan `bootstrapAdmin()` yang membuat akun `ADMIN` awal hanya jika belum ada baris `ADMIN` di tabel `users` (tidak menimpa perubahan profil/password admin yang sudah ada saat container restart).
4. Menjalankan server Next.js standalone dan melayani `/api/health` dengan status `{ "status": "ok", "service": "satukelas-marketing", "database": "ok" }`.

Buka `http://127.0.0.1:3100` dan `/login`. Seluruh layar CRM (`/dashboard`, `/pipeline`, `/opportunities`, `/follow-ups`, `/activities`, `/schools`, `/reports`, `/members`, `/settings`) langsung siap digunakan di atas PostgreSQL tanpa data contoh sintetis.

```bash
# Status dan log (jangan menyalin credential/cookie ke laporan)
docker compose --env-file .env.docker -p satukelas-marketing-local -f docker-compose.yml -f docker-compose.local.yml ps
docker compose --env-file .env.docker -p satukelas-marketing-local -f docker-compose.yml -f docker-compose.local.yml logs --tail=100 marketing-app

# Backup database PostgreSQL
docker compose --env-file .env.docker -p satukelas-marketing-local -f docker-compose.yml exec -T marketing-db pg_dump -U marketing --clean --if-exists satukelas_marketing > backup.sql

# Stop/remove container tanpa menghapus volume database
docker compose --env-file .env.docker -p satukelas-marketing-local -f docker-compose.yml -f docker-compose.local.yml down
```

Jangan gunakan `down -v` pada data yang ingin dipertahankan.

## Deploy ke VPS via Dokploy

Tersedia dua cara deploy di Dokploy menggunakan Traefik bawaan Dokploy (tanpa Nginx/Caddy tambahan):

### Opsi A (Disarankan untuk 1 Paket Aplikasi + Database): Dokploy Compose
1. Buat layanan **Compose** baru di project Dokploy Anda (terpisah dari service company profile).
2. Hubungkan repository GitHub `ArmandoZaid/satukelasprojects-marketing` (branch `main` atau branch target).
3. Gunakan Compose Path `docker-compose.yml` dan tambahkan jaringan `dokploy-network` pada `marketing-app` (atau gabungkan dengan `docker-compose.dokploy.yml`).
4. Pada tab **Environment**, isi variabel runtime secara privat:
   - `APP_ORIGIN=https://<domain-marketing-anda>` (tanpa trailing slash/path)
   - `AUTH_SECRET=<minimal-32-karakter-acak>`
   - `ADMIN_EMAIL=<email-admin-produksi>`
   - `ADMIN_PASSWORD=<password-kuat-minimal-12-karakter>`
   - `DB_PASSWORD=<password-database-kuat>`
   - `USE_SECURE_COOKIES=true`
   - `MARKETING_ENABLE_DEMO_AUTH=false`
   - `MARKETING_ENABLE_SYNTHETIC_CRM=false`
   - `MARKETING_ENABLE_ADMIN_PREVIEW=false`
5. Pada tab **Domains**, pilih service **`marketing-app`**, Container Port **`3000`**, aktifkan **HTTPS (Let's Encrypt)**, lalu klik **Deploy**.

### Opsi B: Dokploy Application (Dockerfile) + Database PostgreSQL Dokploy
1. Buat database **PostgreSQL 16** di Dokploy (catat internal host, port `5432`, user, password, dan nama database).
2. Buat **Application** baru di project yang sama, pilih **Dockerfile** (`Dockerfile`).
3. Pada tab **Environment**, isi `APP_ORIGIN`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `USE_SECURE_COOKIES=true`, serta variabel koneksi database (`DATABASE_URL=postgresql://...` atau `PGHOST`, `PGPORT=5432`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGSSLMODE=disable`).
4. Pada tab **Domains**, arahkan domain HTTPS ke Container Port **`3000`**, lalu klik **Deploy**. Saat container mulai, migrasi tabel dan bootstrap admin akan otomatis dijalankan.

## Verifikasi

```bash
npm run test:docker
npm test
node scripts/postgres-test.mjs
npm run typecheck
npm run lint
# Setelah container lokal healthy:
node scripts/docker-smoke.mjs
```
