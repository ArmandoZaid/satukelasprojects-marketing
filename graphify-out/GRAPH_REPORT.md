# Graph Report - satukelas-marketing  (2026-11-05)

## Corpus Check
- 142 files · ~175,382 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .css 4, (none) 3, .example 1)

## Summary
- 884 nodes · 2168 edges · 54 communities (43 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2f4f7fe7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- next
- auth.ts
- CrmDataError
- account.ts
- PRD — Satukelas Marketing CRM
- UI/UX Requirements — Satukelas Marketing CRM
- ERD — Satukelas Marketing CRM
- login/route.ts
- 3. Matriks Hasil Pengujian Fungsional & Keamanan (40 Skenario E2E)
- package.json
- 5. Kebutuhan per screen
- compilerOptions
- components.json
- @playwright/test
- db-migrate.mjs
- MarketingMember
- Satukelas Projects — Marketing Landing & CRM Admin (Multi-Role Auth)
- brand-assets.ts
- business-card.test.ts
- AGENTS.md
- postcss.config.mjs
- PROVENANCE.md
- AccountSettings
- postgres-test.mjs
- runtime-auth.ts
- isDatabaseConfigured
- devDependencies
- members/[id]/route.ts
- runtime-crm.ts
- ref_node_assert
- dependencies
- scripts
- db-bootstrap.mjs
- engines
- QA Docker, PostgreSQL & Dokploy — v0.15
- Docker & Dokploy — Satukelas Marketing (v0.15 PostgreSQL)
- MKT-S13: Landing publik rekrutmen mitra marketing
- 1. Brief dan prinsip pengalaman
- QA frontend admin preview — Satukelas Marketing CRM v0.6
- ref_node_crypto
- ref_node_url
- (admin)/layout.tsx
- security.spec.ts
- 3. Design tokens yang diusulkan
- 7. Screen flows
- 10. QA desain, review, dan handoff
- 8. States dan feedback lintas komponen
- 0001_initial.sql
- postgres-integration.test.ts
- QA Autentikasi Admin & Marketing — Satukelas Marketing CRM v0.11
- eslint.config.mjs

## God Nodes (most connected - your core abstractions)
1. `CrmDataError` - 68 edges
2. `isDatabaseConfigured()` - 46 edges
3. `CrmApp()` - 39 edges
4. `next` - 38 edges
5. `vitest` - 27 edges
6. `PRD — Satukelas Marketing CRM` - 26 edges
7. `ERD — Satukelas Marketing CRM` - 23 edges
8. `UI/UX Requirements — Satukelas Marketing CRM` - 22 edges
9. `getRegisteredUsers()` - 21 edges
10. `updateRuntimeOpportunity()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Status implementasi v0.8 — Relasi Data Pengguna & Isolasi Kepemilikan (QA historis)` --references--> `date()`  [INFERRED]
  docs/ERD.md → src/components/crm/crm-app.tsx
- `Status implementasi lokal v0.5 — historis frontend publik` --references--> `Button()`  [INFERRED]
  docs/ERD.md → src/components/ui/button.tsx
- `Status implementasi lokal v0.5 — historis frontend publik` --references--> `Button()`  [INFERRED]
  docs/PRD.md → src/components/ui/button.tsx
- `Status implementasi lokal v0.5 — historis frontend publik` --references--> `Button()`  [INFERRED]
  docs/UI_UX_REQUIREMENTS.md → src/components/ui/button.tsx
- `3. Skenario fungsional dan batas preview` --references--> `summarize()`  [INFERRED]
  docs/QA_ADMIN_FRONTEND.md → src/lib/crm-demo.ts

## Import Cycles
- None detected.

## Communities (54 total, 11 thin omitted)

### Community 0 - "next"
Cohesion: 0.07
Nodes (9): next, metadata, metadata, metadata, metadata, metadata, metadata, geist (+1 more)

### Community 1 - "auth.ts"
Cohesion: 0.09
Nodes (49): vitest, AccountProfileUpdate, accountSessionVersion(), authenticateUser(), AuthResult, AuthUser, base64UrlDecode(), base64UrlEncode() (+41 more)

### Community 2 - "CrmDataError"
Cohesion: 0.08
Nodes (57): dynamic, GET(), dynamic, generateMetadata(), ShortMemberPageProps, ShortMemberProfilePage(), dynamic, generateMetadata() (+49 more)

### Community 3 - "account.ts"
Cohesion: 0.10
Nodes (42): Batasan yang tetap berlaku, Hasil verifikasi lokal, Kasus yang diuji, Lingkup, QA — Kontak Member Marketing, dynamic, POST(), runtime (+34 more)

### Community 4 - "PRD — Satukelas Marketing CRM"
Cohesion: 0.05
Nodes (43): 10. Non-functional requirements dan release gates, 11. Rencana pengembangan berbasis gate, 12. Traceability dan QA minimum, 13. Decision register — belum disetujui, 14. Definition of Done dokumen dan produk, 1. Ringkasan produk, 2.1 Sumber terverifikasi, 2.2 Temuan kualitas data (+35 more)

### Community 5 - "UI/UX Requirements — Satukelas Marketing CRM"
Cohesion: 0.12
Nodes (16): 2. Information architecture dan route, 4. Shell, pencarian, filter, dan state URL, 6. Field contract UI ↔ ERD, 9. Responsiveness dan accessibility, Batas pengalaman deployment Docker (riwayat v0.14), Kontak member marketing — admin, Kontrak antarmuka profil member & area layanan v0.13 (MKT-S14), Kontrak antarmuka v0.13 — Generator Kartu Nama (MKT-S15) & Pengaturan Akun (MKT-S16) (+8 more)

### Community 6 - "ERD — Satukelas Marketing CRM"
Cohesion: 0.06
Nodes (33): 10. Security, retensi, dan backup, 11. Checklist verifikasi implementasi nanti, 1.1 Batas data landing rekrutmen publik: MKT-FR-019 / MKT-S13, 1. Prinsip dan konvensi, 2. Diagram relasi inti — P0, 3. Referensi, seed, dan kardinalitas, 4.1 Auth dan membership, 4.2 schools (+25 more)

### Community 7 - "login/route.ts"
Cohesion: 0.16
Nodes (14): dynamic, POST(), dynamic, getSafeCrmReturnUrl(), SESSION_COOKIE_NAME, UserRole, canAccessCrmScreen(), MARKETING_SCREENS (+6 more)

### Community 8 - "3. Matriks Hasil Pengujian Fungsional & Keamanan (40 Skenario E2E)"
Cohesion: 0.25
Nodes (8): 3. Matriks Hasil Pengujian Fungsional & Keamanan (40 Skenario E2E), A. Autentikasi & Otorisasi Admin (`e2e/auth.spec.ts`), B. Autentikasi & Pengalaman Marketing (`e2e/demo-marketing.spec.ts` & `e2e/marketing-auth.spec.ts`), C. Isolasi Data Server-Side & Anti-IDOR (`e2e/demo-marketing.spec.ts` & `e2e/marketing-auth.spec.ts`), D. Fungsionalitas Admin CRM (`e2e/admin.spec.ts`), E. Halaman Publik & Rekrutmen Mitra (`e2e/public.spec.ts`), F. Manajemen Member Marketing (`e2e/members.spec.ts`), G. Hardening Keamanan, Sesi & Integritas Relasi (`e2e/security.spec.ts`)

### Community 9 - "package.json"
Cohesion: 0.11
Nodes (18): name, private, version, class-variance-authority, clsx, jsqr, qrcode, @radix-ui/react-slot (+10 more)

### Community 10 - "5. Kebutuhan per screen"
Cohesion: 0.12
Nodes (17): 5. Kebutuhan per screen, MKT-S01 — Login, setup, reset akses, MKT-S02 — Dashboard action-first, MKT-S03 — Sekolah dan kontak, MKT-S04 — Daftar prospek dan intake, MKT-S05 — Detail prospek, MKT-S06 — Pipeline, MKT-S07 — Follow-up dan aktivitas (+9 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "components.json"
Cohesion: 0.12
Nodes (15): aliases, components, hooks, lib, ui, utils, rsc, $schema (+7 more)

### Community 13 - "@playwright/test"
Cohesion: 0.21
Nodes (3): accounts, @axe-core/playwright, @playwright/test

### Community 14 - "db-migrate.mjs"
Cohesion: 0.48
Nodes (4): DEFAULT_MIGRATIONS_DIR, migrateDatabase(), MIGRATION_LOCK_KEY, readMigrations()

### Community 15 - "MarketingMember"
Cohesion: 0.09
Nodes (43): Kontrak model profil pengguna & pengaturan akun v0.13, Kontrak model profil publik & sumber layanan v0.13, react, ErrorPage(), LoginPage(), metadata, NotFound(), dynamic (+35 more)

### Community 16 - "Satukelas Projects — Marketing Landing & CRM Admin (Multi-Role Auth)"
Cohesion: 0.20
Nodes (10): 1. Website Publik (Landing Kemitraan Marketing), 2. Login Web Admin CRM, 3. CRM Operasional (Terproteksi Multi-Role), Akun Demo & Hak Akses, Docker dan Dokploy, Halaman dan Akses, Kontak member marketing (admin), Menjalankan secara lokal (+2 more)

### Community 18 - "business-card.test.ts"
Cohesion: 0.17
Nodes (15): Artwork, BusinessCard(), download(), prepare(), selectedCanvas(), CARD_DIMENSIONS, CardProfile, CardSide (+7 more)

### Community 23 - "AccountSettings"
Cohesion: 0.23
Nodes (9): AccountProfile, AccountSettings(), changePassword(), navigateTabs(), saveProfile(), selectTab(), AccountTab, isAccountProfile() (+1 more)

### Community 24 - "postgres-test.mjs"
Cohesion: 0.20
Nodes (8): pg, authSecret, cleanup(), dbPassword, exec(), root, runId, vitestCli

### Community 25 - "runtime-auth.ts"
Cohesion: 0.21
Nodes (10): AdminMembersRedirectPage(), AdminIndexPage(), AdminMembersPage(), metadata, AdminSettingsPage(), metadata, requireRuntimeAdminSession(), SessionIdentity (+2 more)

### Community 26 - "isDatabaseConfigured"
Cohesion: 0.35
Nodes (12): dynamic, GET(), handleApiError(), parseJsonBody(), POST(), requireAdmin(), sanitizeMember(), dynamic (+4 more)

### Community 27 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, @axe-core/playwright, eslint, eslint-config-next, jsqr, @playwright/test, tailwindcss, @tailwindcss/postcss (+7 more)

### Community 28 - "members/[id]/route.ts"
Cohesion: 0.22
Nodes (15): dynamic, handleApiError(), parseJsonBody(), POST(), requireAdmin(), DELETE(), dynamic, handleApiError() (+7 more)

### Community 29 - "runtime-crm.ts"
Cohesion: 0.05
Nodes (77): Badge(), CrmApp(), activityList(), closeMemberModal(), handleMemberAddSubmit(), handleMemberDeleteSubmit(), handleMemberEditSubmit(), handleMemberResetPwSubmit() (+69 more)

### Community 30 - "ref_node_assert"
Cohesion: 0.19
Nodes (4): load(), env, dockerfile, script

### Community 31 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, class-variance-authority, clsx, drizzle-orm, next, pg, qrcode, @radix-ui/react-slot (+3 more)

### Community 32 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:bootstrap, db:migrate, dev, lint, postbuild, start (+4 more)

### Community 33 - "db-bootstrap.mjs"
Cohesion: 0.23
Nodes (9): Jalankan di Docker Lokal, validateContainerEnvironment(), errors, ACCOUNT_WRITE_LOCK_KEY, bootstrapAdmin(), hashBootstrapPassword(), ../server.js, databasePoolConfig() (+1 more)

### Community 35 - "QA Docker, PostgreSQL & Dokploy — v0.15"
Cohesion: 0.40
Nodes (5): Hasil eksekusi, Kesimpulan, Langkah selanjutnya untuk pengguna (Deploy VPS Dokploy), QA Docker, PostgreSQL & Dokploy — v0.15, Rincian Smoke Test Container + PostgreSQL (`node scripts/docker-smoke.mjs`)

### Community 36 - "Docker & Dokploy — Satukelas Marketing (v0.15 PostgreSQL)"
Cohesion: 0.29
Nodes (7): Berkas, Cakupan dan kesiapan, Deploy ke VPS via Dokploy, Docker & Dokploy — Satukelas Marketing (v0.15 PostgreSQL), Opsi A (Disarankan untuk 1 Paket Aplikasi + Database): Dokploy Compose, Opsi B: Dokploy Application (Dockerfile) + Database PostgreSQL Dokploy, Verifikasi

### Community 37 - "MKT-S13: Landing publik rekrutmen mitra marketing"
Cohesion: 0.33
Nodes (6): Karakter resmi dan alasan visual, MKT-S13: Landing publik rekrutmen mitra marketing, Perilaku, state dan batas publik, Pertanyaan dan jawaban usulan, Responsive, SEO dan handoff, Struktur, copy dan urutan baca usulan

### Community 38 - "1. Brief dan prinsip pengalaman"
Cohesion: 0.40
Nodes (5): 1.1 Otoritas visual, 1.2 Prinsip yang dapat diuji, 1.3 Anti-goals, 1. Brief dan prinsip pengalaman, Kontrak integrasi UI–server v0.4

### Community 39 - "QA frontend admin preview — Satukelas Marketing CRM v0.6"
Cohesion: 0.25
Nodes (8): 1. Objek, lingkungan, dan batas, 2. Pemeriksaan teknis, 3. Skenario fungsional dan batas preview, 4. Responsif, visual, dan aksesibilitas, 5. Temuan dan mitigasi selama pengembangan, 6. Bukti visual (Screenshots), 7. Keputusan akhir QA v0.6, QA frontend admin preview — Satukelas Marketing CRM v0.6

### Community 40 - "ref_node_crypto"
Cohesion: 0.19
Nodes (4): proofDir, nextConfig, content, target

### Community 41 - "ref_node_url"
Cohesion: 0.20
Nodes (3): output, root, server

### Community 42 - "(admin)/layout.tsx"
Cohesion: 0.25
Nodes (6): AdminLayout(), dynamic, dynamic, metadata, PreviewLayout(), requireRuntimeCrmSession()

### Community 45 - "3. Design tokens yang diusulkan"
Cohesion: 0.40
Nodes (5): 3.1 Warna dan makna, 3.2 Tipografi dan angka, 3.3 Struktur dan ukuran, 3.4 Interaksi dan motion, 3. Design tokens yang diusulkan

### Community 46 - "7. Screen flows"
Cohesion: 0.40
Nodes (5): 7.1 Intake dan siklus kerja, 7.2 Perubahan tahap dengan guard, 7.3 Migrasi bertahap dan aman, 7.4 Ajakan publik dan akses privat yang terpisah, 7. Screen flows

### Community 47 - "10. QA desain, review, dan handoff"
Cohesion: 0.50
Nodes (4): 10.1 Fixture uji desain — sintetis, bukan data bisnis, 10.2 Acceptance desain, 10.3 Urutan deliverable desain berikutnya, 10. QA desain, review, dan handoff

### Community 48 - "8. States dan feedback lintas komponen"
Cohesion: 0.67
Nodes (3): 8.1 Komponen inti, 8.2 Microcopy minimum, 8. States dan feedback lintas komponen

### Community 51 - "postgres-integration.test.ts"
Cohesion: 0.67
Nodes (4): drizzle-orm, activities, opportunities, users

### Community 52 - "QA Autentikasi Admin & Marketing — Satukelas Marketing CRM v0.11"
Cohesion: 0.50
Nodes (4): 1. Lingkungan & Konfigurasi Pengujian, 2. Pemeriksaan Teknis & Kualitas Kode, 4. Kesimpulan QA, QA Autentikasi Admin & Marketing — Satukelas Marketing CRM v0.11

## Knowledge Gaps
- **320 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+315 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 388 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `auth.ts`, `CrmDataError`, `account.ts`, `login/route.ts`, `ref_node_crypto`, `package.json`, `(admin)/layout.tsx`, `MarketingMember`, `runtime-auth.ts`, `isDatabaseConfigured`, `members/[id]/route.ts`, `runtime-crm.ts`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Why does `Button()` connect `MarketingMember` to `PRD — Satukelas Marketing CRM`, `UI/UX Requirements — Satukelas Marketing CRM`, `ERD — Satukelas Marketing CRM`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `ERD — Satukelas Marketing CRM` connect `ERD — Satukelas Marketing CRM` to `PRD.md`, `MarketingMember`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _320 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08857808857808858 - nodes in this community are weakly interconnected._
- **Should `CrmDataError` be split into smaller, more focused modules?**
  _Cohesion score 0.0770735524256651 - nodes in this community are weakly interconnected._