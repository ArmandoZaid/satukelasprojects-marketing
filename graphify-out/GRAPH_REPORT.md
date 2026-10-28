# Graph Report - satukelas-marketing  (2026-10-28)

## Corpus Check
- 106 files · ~159,043 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .css 4, (none) 3, .example 1)

## Summary
- 690 nodes · 1466 edges · 40 communities (30 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dc390e9b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- next
- auth.ts
- crm-app.tsx
- CrmDataError
- PRD — Satukelas Marketing CRM
- UI/UX Requirements — Satukelas Marketing CRM
- ERD — Satukelas Marketing CRM
- packages-section.tsx
- QA frontend admin preview — Satukelas Marketing CRM v0.6
- package.json
- 5. Kebutuhan per screen
- compilerOptions
- components.json
- @playwright/test
- MemberLanding
- Button
- Satukelas Projects — Marketing Landing & CRM Admin (Multi-Role Auth)
- brand-assets.ts
- business-card.test.ts
- AGENTS.md
- postcss.config.mjs
- PROVENANCE.md
- AccountSettings
- member-public-shell.tsx
- MarketingMember
- Arrow
- devDependencies
- members/[id]/route.ts
- CrmApp
- opportunityTable
- dependencies
- scripts
- eslint.config.mjs
- engines
- QA — Kontak Member Marketing
- app/layout.tsx
- preview/layout.tsx
- account-integration.test.tsx
- summarize

## God Nodes (most connected - your core abstractions)
1. `CrmApp()` - 38 edges
2. `next` - 37 edges
3. `CrmDataError` - 35 edges
4. `PRD — Satukelas Marketing CRM` - 24 edges
5. `getRegisteredUsers()` - 21 edges
6. `readCrmStore()` - 21 edges
7. `ERD — Satukelas Marketing CRM` - 21 edges
8. `UI/UX Requirements — Satukelas Marketing CRM` - 20 edges
9. `Button()` - 19 edges
10. `MarketingMember` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Status implementasi lokal v0.5 — historis frontend publik` --references--> `Button()`  [INFERRED]
  docs/ERD.md → src/components/ui/button.tsx
- `Status implementasi lokal v0.5 — historis frontend publik` --references--> `Button()`  [INFERRED]
  docs/PRD.md → src/components/ui/button.tsx
- `Status implementasi lokal v0.5 — historis frontend publik` --references--> `Button()`  [INFERRED]
  docs/UI_UX_REQUIREMENTS.md → src/components/ui/button.tsx
- `5. Temuan dan mitigasi selama pengembangan` --references--> `moveStage()`  [INFERRED]
  docs/QA_ADMIN_FRONTEND.md → src/lib/crm-demo.ts
- `Status implementasi v0.8 — Relasi Data Pengguna & Isolasi Kepemilikan (QA historis)` --references--> `date()`  [INFERRED]
  docs/ERD.md → src/components/crm/crm-app.tsx

## Import Cycles
- None detected.

## Communities (40 total, 10 thin omitted)

### Community 0 - "next"
Cohesion: 0.08
Nodes (7): next, metadata, metadata, metadata, metadata, metadata, metadata

### Community 1 - "auth.ts"
Cohesion: 0.07
Nodes (57): vitest, dynamic, POST(), dynamic, AccountProfileUpdate, accountSessionVersion(), authenticateUser(), AuthResult (+49 more)

### Community 2 - "crm-app.tsx"
Cohesion: 0.12
Nodes (22): CrmUser, DEFAULT_PREVIEW_MEMBERS, Dialog(), FOLLOW, MemberItem, MemberModal, Modal, NAV (+14 more)

### Community 3 - "CrmDataError"
Cohesion: 0.09
Nodes (56): AdminLayout(), dynamic, dynamic, POST(), runtime, dynamic, GET(), PATCH() (+48 more)

### Community 4 - "PRD — Satukelas Marketing CRM"
Cohesion: 0.05
Nodes (41): 10. Non-functional requirements dan release gates, 11. Rencana pengembangan berbasis gate, 12. Traceability dan QA minimum, 13. Decision register — belum disetujui, 14. Definition of Done dokumen dan produk, 1. Ringkasan produk, 2.1 Sumber terverifikasi, 2.2 Temuan kualitas data (+33 more)

### Community 5 - "UI/UX Requirements — Satukelas Marketing CRM"
Cohesion: 0.06
Nodes (36): 10.1 Fixture uji desain — sintetis, bukan data bisnis, 10.2 Acceptance desain, 10.3 Urutan deliverable desain berikutnya, 10. QA desain, review, dan handoff, 1.1 Otoritas visual, 1.2 Prinsip yang dapat diuji, 1.3 Anti-goals, 1. Brief dan prinsip pengalaman (+28 more)

### Community 6 - "ERD — Satukelas Marketing CRM"
Cohesion: 0.07
Nodes (30): 10. Security, retensi, dan backup, 11. Checklist verifikasi implementasi nanti, 1.1 Batas data landing rekrutmen publik: MKT-FR-019 / MKT-S13, 1. Prinsip dan konvensi, 2. Diagram relasi inti — P0, 3. Referensi, seed, dan kardinalitas, 4.1 Auth dan membership, 4.2 schools (+22 more)

### Community 7 - "packages-section.tsx"
Cohesion: 0.18
Nodes (12): Kontrak model profil publik & sumber layanan v0.13, PackagesSection(), PackagesSectionProps, WorkflowSection(), WorkflowSectionProps, ProductPackage, SATUKELAS_FAQS, SATUKELAS_PACKAGES (+4 more)

### Community 8 - "QA frontend admin preview — Satukelas Marketing CRM v0.6"
Cohesion: 0.10
Nodes (19): 1. Objek, lingkungan, dan batas, 2. Pemeriksaan teknis, 4. Responsif, visual, dan aksesibilitas, 5. Temuan dan mitigasi selama pengembangan, 6. Bukti visual (Screenshots), 7. Keputusan akhir QA v0.6, QA frontend admin preview — Satukelas Marketing CRM v0.6, 1. Lingkungan & Konfigurasi Pengujian (+11 more)

### Community 9 - "package.json"
Cohesion: 0.12
Nodes (16): name, private, version, class-variance-authority, clsx, jsqr, qrcode, @radix-ui/react-slot (+8 more)

### Community 10 - "5. Kebutuhan per screen"
Cohesion: 0.07
Nodes (29): 5. Kebutuhan per screen, Karakter resmi dan alasan visual, MKT-S01 — Login, setup, reset akses, MKT-S02 — Dashboard action-first, MKT-S03 — Sekolah dan kontak, MKT-S04 — Daftar prospek dan intake, MKT-S05 — Detail prospek, MKT-S06 — Pipeline (+21 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "components.json"
Cohesion: 0.12
Nodes (15): aliases, components, hooks, lib, ui, utils, rsc, $schema (+7 more)

### Community 13 - "@playwright/test"
Cohesion: 0.07
Nodes (9): accounts, fixturePassword, proofDir, nextConfig, @axe-core/playwright, @playwright/test, output, root (+1 more)

### Community 14 - "MemberLanding"
Cohesion: 0.36
Nodes (8): generateMetadata(), ShortMemberPageProps, ShortMemberProfilePage(), generateMetadata(), MemberPageProps, MemberProfilePage(), MemberLanding(), getMarketingMemberBySlug()

### Community 15 - "Button"
Cohesion: 0.35
Nodes (7): react, ErrorPage(), Button(), buttonVariants, marketingChatUrl, marketingContact, cn()

### Community 16 - "Satukelas Projects — Marketing Landing & CRM Admin (Multi-Role Auth)"
Cohesion: 0.20
Nodes (9): 1. Website Publik (Landing Kemitraan Marketing), 2. Login Web Admin CRM, 3. CRM Operasional (Terproteksi Multi-Role), Akun Demo & Hak Akses, Halaman dan Akses, Kontak member marketing (admin), Menjalankan secara lokal, Satukelas Projects — Marketing Landing & CRM Admin (Multi-Role Auth) (+1 more)

### Community 18 - "business-card.test.ts"
Cohesion: 0.17
Nodes (15): Artwork, BusinessCard(), download(), prepare(), selectedCanvas(), CARD_DIMENSIONS, CardProfile, CardSide (+7 more)

### Community 23 - "AccountSettings"
Cohesion: 0.23
Nodes (9): AccountProfile, AccountSettings(), changePassword(), navigateTabs(), saveProfile(), selectTab(), AccountTab, isAccountProfile() (+1 more)

### Community 24 - "member-public-shell.tsx"
Cohesion: 0.60
Nodes (4): MemberFooter(), MemberHeader(), MemberPublicShellProps, Brand()

### Community 25 - "MarketingMember"
Cohesion: 0.28
Nodes (9): Kontrak model profil pengguna & pengaturan akun v0.13, MemberLandingProps, LeadForm(), LeadFormProps, MemberHero(), MemberHeroProps, ProductsCatalog(), ProductsCatalogProps (+1 more)

### Community 26 - "Arrow"
Cohesion: 0.25
Nodes (12): LoginPage(), metadata, NotFound(), dynamic, HomePage(), getSafeCrmReturnUrl(), LoginForm(), handleSubmit() (+4 more)

### Community 27 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, @axe-core/playwright, eslint, eslint-config-next, jsqr, @playwright/test, tailwindcss, @tailwindcss/postcss (+6 more)

### Community 28 - "members/[id]/route.ts"
Cohesion: 0.15
Nodes (24): dynamic, handleApiError(), parseJsonBody(), POST(), requireAdmin(), DELETE(), dynamic, handleApiError() (+16 more)

### Community 29 - "CrmApp"
Cohesion: 0.17
Nodes (8): CrmApp(), closeMemberModal(), handleMemberAddSubmit(), handleMemberDeleteSubmit(), handleMemberEditSubmit(), handleMemberResetPwSubmit(), Field(), StageFields()

### Community 30 - "opportunityTable"
Cohesion: 0.33
Nodes (6): Status implementasi v0.8 — Relasi Data Pengguna & Isolasi Kepemilikan (QA historis), Badge(), activityList(), opportunityTable(), date(), currency()

### Community 31 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, class-variance-authority, clsx, next, qrcode, @radix-ui/react-slot, react, react-dom (+1 more)

### Community 32 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, postbuild, start, test, test:e2e (+1 more)

### Community 35 - "QA — Kontak Member Marketing"
Cohesion: 0.33
Nodes (5): Batasan yang tetap berlaku, Hasil verifikasi lokal, Kasus yang diuji, Lingkup, QA — Kontak Member Marketing

### Community 37 - "preview/layout.tsx"
Cohesion: 0.40
Nodes (3): dynamic, metadata, PreviewLayout()

## Knowledge Gaps
- **274 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+269 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 332 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `auth.ts`, `crm-app.tsx`, `CrmDataError`, `app/layout.tsx`, `preview/layout.tsx`, `package.json`, `5. Kebutuhan per screen`, `@playwright/test`, `MemberLanding`, `member-public-shell.tsx`, `MarketingMember`, `Arrow`, `members/[id]/route.ts`?**
  _High betweenness centrality (0.230) - this node is a cross-community bridge._
- **Why does `Button()` connect `Button` to `PRD — Satukelas Marketing CRM`, `UI/UX Requirements — Satukelas Marketing CRM`, `ERD — Satukelas Marketing CRM`, `member-public-shell.tsx`, `MarketingMember`, `Arrow`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Why does `UI/UX Requirements — Satukelas Marketing CRM` connect `UI/UX Requirements — Satukelas Marketing CRM` to `QA frontend admin preview — Satukelas Marketing CRM v0.6`, `5. Kebutuhan per screen`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _274 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06744956338452274 - nodes in this community are weakly interconnected._
- **Should `crm-app.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11666666666666667 - nodes in this community are weakly interconnected._