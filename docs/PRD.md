# PRD — Satukelas Marketing CRM

**Versi:** 0.13: Kartu Nama Otomatis Web Admin, Pengaturan Akun Pengguna, dan Landing Member Tanpa Katalog/Bundling Statis
**Status:** implementasi fitur kartu nama otomatis (`MKT-FR-022`), pengaturan akun profil & password pengguna (`MKT-FR-023`) pada web admin CRM, serta pemeliharaan landing profil member (`/tim/[slug]` & `/m/[slug]`) tanpa grid produk statis dan tanpa bundling. Penegasan: tidak ada fitur atau formulir pendaftaran magang. Hasil uji tercatat pada [QA Member Landing](QA_MEMBER_LANDING.md).
**Bahasa / zona waktu / mata uang:** Indonesia / Asia/Jakarta (WIB) / IDR
**Pemilik produk:** perwakilan Satukelas Projects (nama penanggung jawab perlu ditetapkan)  
**Pembaca:** pemilik bisnis, tim marketing, desainer, developer, QA, dan pengelola VPS

Dokumen pasangan: [ERD](ERD.md) · [UI/UX Requirements](UI_UX_REQUIREMENTS.md). Ketiganya merupakan satu kontrak pengembangan. Dokumen website publik di `../PRD.md`, `../ERD.md`, dan `../UI_UX_REQUIREMENTS.md` tidak digantikan oleh paket ini.

### Penambahan kontak member marketing — admin

Admin dapat menambah, melihat, mengubah dan mengosongkan telepon/WhatsApp serta alamat tempat tinggal di pengelolaan member. Label email menjadi "Alamat Email Aktif", tetap email login yang wajib valid dan unik; belum ada verifikasi kotak masuk. Telepon dan alamat opsional untuk kompatibilitas data lama. Alamat hanya untuk administrasi internal, tidak diterbitkan ke landing/kartu nama. Kriteria penerimaan: create/edit/reload/clear berhasil, payload invalid ditolak tanpa mutasi sebagian, akses tanpa admin ditolak, form mobile tanpa overflow halaman. Penyimpanan lokal saat ini in-memory dan hilang saat restart; persistensi database belum termasuk implementasi ini.

### Kontrak web admin v0.13 — Kartu Nama Otomatis & Pengaturan Akun

1. **Pembuatan Kartu Nama Otomatis (`MKT-FR-022`):**
   - **Sumber Data:** Menghasilkan kartu nama profesional secara otomatis berdasarkan data profil member marketing yang tersimpan di sistem (nama lengkap, jabatan/title, nomor WhatsApp/telepon PIC, email akun, slug URL landing page personal `/tim/[slug]`, dan foto profil/avatar).
   - **Desain & Sisi Kartu:** Mengikuti identitas visual Contra Neo-Brutalisme Satukelas Projects (border hitam 2px, hard drop shadow, tipografi Geist tebal, warna brand pink `#FD5392`, biru `#4150B1`, kuning `#F6BF75`). Menyediakan dua sisi kartu:
     - **Sisi Depan:** Logo & identitas Satukelas Projects, nama lengkap PIC, jabatan, badge terverifikasi, nomor WhatsApp, email, dan URL landing page.
     - **Sisi Belakang:** Tagline brand ("Solusi Buku Tahunan Sekolah & Kenangan Tak Terlupakan"), ringkasan pilar keunggulan (Buku Cetak Eksklusif, Augmented Reality, Video Dokumentasi, Desain Kustom), dan QR Code dinamis beresolusi tinggi yang terhubung langsung ke landing page referral PIC atau nomor WhatsApp.
   - **Opsi Ekspor & Cetak:**
     - **Unduh Kartu (PNG):** Tombol ekspor gambar beresolusi tinggi (rasio 90mm x 54mm, 300 DPI canvas) yang siap dibagikan ke WhatsApp status atau media sosial.
     - **Cetak Kartu (Print):** Tombol cetak langsung browser yang memicu layout cetak `@media print` terisolasi, menyembunyikan elemen UI web admin dan hanya menampilkan kartu nama siap potong.
   - **Hak Akses & Penempatan:**
     - **Role ADMIN:** Tersedia tombol aksi `[Kartu Nama]` pada setiap baris member di halaman Tim Marketing (`/members`). Admin dapat melihat, mengkustomisasi tema, dan mengunduh/mencetak kartu nama untuk seluruh anggota tim marketing.
     - **Role MARKETER & ADMIN:** Tersedia tombol cepat "Kartu Nama Saya" pada profil sidebar web admin, sehingga member yang login dapat langsung mengakses dan mencetak kartu nama identitasnya secara mandiri.

2. **Pengaturan Akun & Keamanan Pengguna (`MKT-FR-023`):**
   - **Pembaruan Data Diri (Profil Akun):**
     - Setiap pengguna yang sedang login (baik ADMIN maupun MARKETER) dapat memperbarui profil diri: nama lengkap, alamat email, nomor WhatsApp/telepon PIC, dan foto profil/avatar (upload file gambar atau URL).
     - Validasi keunikan email: Jika email diubah, server memverifikasi agar tidak bentrok dengan akun lain (member, admin, konfigurasi) secara case-insensitive trim.
   - **Pembaruan Keamanan (Ganti Kata Sandi):**
     - Pengguna dapat mengganti kata sandi dengan memasukkan kata sandi saat ini (current password), kata sandi baru (minimal 8 karakter), dan konfirmasi kata sandi baru.
     - Kata sandi diverifikasi dengan hashing scrypt dan timingSafeEqual. Kata sandi baru di-hash dan disimpan secara aman.
   - **Penyegaran Sesi Tanpa Logout:**
     - Setiap perubahan nama, email, atau kata sandi otomatis memperbarui `sessionVersion` dan merefresh cookie sesi HttpOnly bertanda tangan (`marketing_session`) dengan data terbaru, sehingga pengguna tetap dalam sesi aktif tanpa terputus secara tidak terduga.
   - **Penempatan:**
     - Tombol "Pengaturan Akun" tersedia di panel profil sidebar untuk semua pengguna yang login.
     - Untuk akun ADMIN, form pengaturan akun dan ganti kata sandi juga terintegrasi langsung di dalam halaman Pengaturan (`/settings`).

3. **Penegasan Lingkup (Tanpa Form Magang):**
   - Sistem Satukelas Marketing CRM dan landing page publik **tidak memiliki formulir pendaftaran magang (form magang)** atau jalur penerimaan magang. Fokus sistem murni pada operasional CRM sekolah, rekrutmen mitra tim marketing, landing profil personal marketing, serta identitas digital tim marketing.

### Kontrak landing profil member & area layanan v0.13

- **Rute Publik Personal:** Tersedia rute `/tim/[slug]` dan alias `/m/[slug]` yang dapat diakses publik oleh pihak sekolah, panitia OSIS, dan guru tanpa memerlukan login sesi CRM.
- **Resolusi Slug:** Mendukung pencarian member berdasarkan slug ramah (`toSlug(name)` seperti `yunus`, `dzaky`), identifier unik (`usr_mkt_01`), atau prefix email.
- **Guard Keaktifan & 404:** Hanya menampilkan profil member dengan status `isActive === true`. Member nonaktif atau slug tidak ditemukan mengembalikan tampilan 404 ramah Satukelas Projects dengan opsi kembali ke halaman utama.
- **Personal Branding Member:** Menampilkan foto avatar asli (JPEG/PNG/WebP max 2MB Base64) atau fallback karakter editorial resmi Satukelas, nama lengkap, role konsultasi, badge PIC terverifikasi, dan nomor WhatsApp kontak.
- **Area Layanan Satukelas Projects:** Pertahankan section `#produk`, label katalog dan heading “Karya Kenangan & Solusi Media Sekolah”. Hapus grid pada selector `#produk > div > div:nth-child(2)` beserta kartu, harga dan CTA produk statis. Tidak menambahkan data pengganti atau placeholder kartu.
- **Bundling Dihapus:** Section `#paket`, kartu Starter/Populer/All-in-One, opsi bundling di form, serta tautan paket di header/footer tidak tersedia.
- **Sumber Layanan Berikutnya:** Data layanan direncanakan berasal dari API company profile `satukelasprojects`. Endpoint, payload, autentikasi, cache dan state pemuatan belum disepakati; integrasi bukan cakupan v0.13. Jangan menganggap pilihan minat pada form sebagai katalog API.
- **Generator Pesan WhatsApp Referral (Lead Attribution):** Form interaktif / tombol CTA yang merangkai pesan otomatis terpersonalisasi menuju WhatsApp PIC terkait, menyertakan nama sekolah, estimasi siswa, layanan yang diminati, serta tag `Ref: [member.id] - [member.name]`. Form hanya membuka WhatsApp; tidak otomatis menyimpan lead atau `ownerId` ke CRM.
- **Desain Neo-Brutalisme Satukelas:** Border hitam pekat 2px, hard drop shadow (`box-shadow: 4px 4px 0px #000`), palet putih/hitam, primary pink `#FD5392`, support blue `#4150B1`, yellow `#F6BF75`, font Geist, dan karakter editorial flat 2D resmi.

### Kontrak hardening v0.11 — sesi dan integritas member

- Password member dinamis hanya disimpan sebagai hash `scrypt$<salt>$<key>`; tidak ada `rawPassword` pada store/registry/response.
- Reset password, perubahan email, dan perubahan status merotasi versi sesi acak. Semua cookie lama ditolak pada request berikutnya (API 401, halaman kembali login), termasuk setelah email/status dikembalikan. Hapus akun tanpa relasi membatalkan akses login dan sesi lama.
- Hapus/nonaktifkan member ditolak dengan 409 jika masih memiliki prospek (termasuk Won/Lost) atau aktivitas, berdasarkan `ownerId` stabil dan relasi aktivitas ke peluang. Penolakan tidak mengubah member, versi sesi, timestamp, atau CRM; sesi valid tetap dapat dipakai. Tidak ada transfer PIC otomatis.
- Pemeriksaan relasi dilakukan di store, bukan hanya UI/API. Jika sumber CRM tidak tersedia, hapus/nonaktifkan gagal tertutup dengan 503, bukan menganggap relasi kosong. Akun tanpa relasi tetap dapat dinonaktifkan/diaktifkan/dihapus.
- Revisi lokal ini tidak menambah schema/migration. Database dan transaksi produksi tetap belum diimplementasikan. Verifikasi akhir v0.11 telah selesai dan terbukti melalui pengujian regresi unit (124 tes), API, dan E2E browser Playwright (40 tes) pada build terbaru.

### Kontrak keamanan v0.10 — reset sintetis dan keunikan identitas

- `DELETE /api/crm` hanya untuk sesi ADMIN (tanpa sesi 401, MARKETER/MANAGER 403), dengan `MARKETING_ENABLE_SYNTHETIC_CRM=true`; flag mati menghasilkan 503 tanpa mengubah state. Endpoint ini bukan penghapusan CRM operasional.
- Reset mensyaratkan header Origin yang diizinkan; Origin kosong, invalid, tidak dikenal, atau `Sec-Fetch-Site: cross-site` menghasilkan 403. Origin loopback localhost/127.0.0.1 hanya setara pada protokol dan port sama.
- Create/edit member menolak email yang sama setelah trim/lowercase dengan member lain, Admin terkonfigurasi, Manager demo, dan seluruh `MARKETING_USERS_JSON` termasuk akun nonaktif. Konflik menghasilkan 400 dengan pesan `Email sudah terdaftar`, tanpa perubahan profil/status/timestamp atau memutus sesi Admin.
- Semua validasi PATCH selesai sebelum perubahan diterapkan. Registry konfigurasi yang invalid tetap fail-closed; revisi ini tidak memperbaiki konfigurasi rusak secara otomatis.
- Tidak ada database/migration baru. Store member/CRM masih memori proses; akun registry konfigurasi belum dikelola melalui CRUD ini. Revokasi sesi kini dicakup v0.11; reassignment ownership tetap tidak tersedia.
- Bukti eksekusi dicatat pada laporan QA; angka v0.8 di bawah merupakan hasil historis, bukan kelulusan revisi ini.

### Status implementasi v0.8 — Autentikasi Admin & Marketing (QA historis)

- **Multi-Role RBAC:** Login `/login` mendukung role `ADMIN` dan `MARKETER`. Role `MANAGER` belum diberi izin akses (HTTP 403).
- **Pembatasan Layar Marketing:** Pengguna role `MARKETER` hanya memiliki akses ke 6 layar CRM: `/dashboard`, `/opportunities` (alias `/schools`), `/pipeline`, `/follow-ups`, `/activities`, dan `/reports`. Rute `/settings`, `/admin`, dan namespace `/preview` ditolak di level server dengan status HTTP 403 Forbidden ("Akses ditolak. Halaman ini hanya untuk Administrator.") dan tidak ditampilkan di navigasi sidebar.
- **Identitas & Sesi Terproteksi:** Menggunakan cookie HttpOnly `marketing_session` bertanda tangan HMAC-SHA256 dengan batas kedaluwarsa 8 jam. Password diverifikasi dengan hashing scrypt (salt hex + key) melalui `timingSafeEqual`. Form login tidak menampilkan kredensial atau petunjuk password bawaan (anti-credential hint).
- **Isolasi Data Server-Side (Anti-IDOR):**
  - Setiap peluang (`opportunity`) dan aktivitas (`activity`) memiliki `ownerId` stabil (`usr_mkt_01`, `usr_mkt_02`, dst).
  - Saat role `MARKETER` login, seluruh query API (`/api/crm`), RSC, ringkasan dashboard, antrean follow-up, pipeline, dan laporan secara otomatis disaring di server berdasarkan `ownerId = session.id`.
  - Upaya manipulasi IDOR via query parameter (`?ownerId=...`) atau body payload diabaikan server; server secara mutlak memaksakan `session.id` sebagai pemilik record baru.
  - Dua akun marketing berbeda (misalnya Yunus dan Dzaky) memiliki dataset terisolasi sepenuhnya dan tidak dapat saling melihat atau memodifikasi data satu sama lain.
- **Proteksi Mutasi & Origin (CSRF):** Endpoint mutasi memeriksa kesesuaian header `Origin` dan `Host`, memblokir request cross-site (`sec-fetch-site === "cross-site"` atau origin tidak dikenal) dengan status 403, dan mendukung kesetaraan loopback (`127.0.0.1` dan `localhost`) untuk lingkungan lokal.
- **Store CRM Sintetis & Reset:** Menggunakan store memori server `globalThis.marketingSyntheticCrm` saat flag `MARKETING_ENABLE_SYNTHETIC_CRM=true` aktif. Tersedia endpoint `DELETE /api/crm` untuk mereset data contoh ke kondisi awal secara bersih saat pengujian.
- **Hasil QA v0.8: TERVERIFIKASI LULUS.** Sebanyak 46 unit test Vitest dan 34 pengujian E2E browser Playwright lolos 100%, mencakup skenario isolasi data multi-akun, proteksi rute, dan aksesibilitas lintas viewport. Detail tercatat pada [QA Autentikasi Marketing](QA_AUTH_MARKETING.md).

### Kontrak revisi v0.8 — spesifikasi teknis dan batasan operasional

- Login `/login` menerima role `ADMIN` dan `MARKETER`; role `MANAGER` belum diberi akses. Marketing hanya boleh membuka `/dashboard`, `/opportunities` (alias `/schools`), `/pipeline`, `/follow-ups`, `/activities`, `/reports`. `/settings`, `/admin` dan namespace preview ditolak untuk Marketing pada server, termasuk URL langsung.
- Identitas berasal dari cookie HttpOnly bertanda tangan HMAC-SHA256 dengan batas 8 jam, bukan input role/PIC dari browser. Sesi harus cocok dengan akun aktif pada registry server; token bertanda tangan bukan token terenkripsi.
- Setiap peluang mempunyai `ownerId` stabil yang merujuk ID akun; nama PIC hanya label. Aktivitas terikat ke peluang yang terlihat dan ke pemilik akun. Marketing tidak dapat memilih PIC orang lain; owner pada create ditetapkan server. Read/detail/create/catat hasil/pindah tahap wajib memeriksa sesi dan ownership di server; ID asing menghasilkan 404, tanpa sesi 401, role/area terlarang 403.
- Scope diterapkan sebelum serialisasi ke browser serta sebelum filter, agregasi dashboard, antrean follow-up, pipeline, aktivitas, dan laporan. Query owner/PIC, body ownerId, ID peluang, dan filter URL tidak boleh memperluas scope.
- Mode implementasi lokal memakai **data sintetis berlabel** dengan store memori proses server untuk akun terautentikasi; perubahan bertahan saat reload tetapi hilang ketika proses restart. Preview anonim berflag tetap simulasi memori tab terpisah. Tidak ada fallback diam-diam ke data bisnis, localStorage, database, schema/migration PostgreSQL, atau audit operasional.
- Akun contoh dan secret fallback hanya untuk pengujian eksplisit (`MARKETING_ENABLE_DEMO_AUTH=true`) atau unit test; deployment tanpa konfigurasi tidak boleh membuka akun default. Registry Marketing produksi sementara dikonfigurasi server melalui `MARKETING_USERS_JSON` berisi ID unik, email, nama, passwordHash scrypt dan isActive; account management/Better Auth/database tetap tahapan terpisah.
- UI mempertahankan desain flat yang disetujui. Marketing menampilkan enam menu, identitas role, keterangan data akun sendiri, PIC otomatis/terkunci, loading/error/sukses mutasi server, dan logout yang membersihkan state. Tidak menampilkan kredensial atau autofill password pada login.
- QA wajib menggunakan dua akun Marketing berbeda plus Admin: akses rute langsung, query owner palsu, response HTML/RSC/API, detail/mutasi ID asing, create owner palsu, aktivitas/agregat, sesi invalid/expired/inactive, logout/login lintas akun dan regresi preview. Hasil aktual dicatat terpisah di laporan QA.

### Status implementasi lokal v0.6 — historis admin preview (QA terverifikasi)

- **Batas tahap:** frontend admin preview untuk review lokal di `apps/marketing`, bukan admin produksi, autentikasi atau bukti otorisasi. Spesifikasi produksi di bawah tetap berlaku; pengecualian preview sintetis lokal ini tidak mengubah landing menjadi demo CRM publik atau menyelesaikan gate backend/keamanan.
- **Akses lokal:** aktifkan `MARKETING_ENABLE_ADMIN_PREVIEW=true` pada proses aplikasi yang ditinjau. URL review: **http://127.0.0.1:3100/preview/dashboard**. Tanpa flag aktif, seluruh route `/preview` harus mengembalikan **404**. Flag ini hanya sakelar preview, **bukan authorization**; jangan mengaktifkannya pada deployment publik.
- **Route preview:** `/preview` mengarah ke `/preview/dashboard` hanya saat flag aktif; halaman lain: `/preview/opportunities`, `/preview/pipeline`, `/preview/follow-ups`, `/preview/activities`, `/preview/reports`, `/preview/settings`. Ini namespace review terpisah dari route produksi pada spesifikasi. `/dashboard` dan API privat tetap belum diimplementasikan/**404**; 404 tersebut bukan kelulusan uji RBAC. Landing `/` dan `/login` informasional tidak berubah, tanpa login/sesi aktif.
- **Data dan waktu:** semua nama, PIC, peluang, nilai, tugas dan aktivitas merupakan **data sintetis berlabel**. Tanggal acuan demo tetap **16 Oktober 2026 WIB (Asia/Jakarta)**, bukan waktu live atau tanggal perangkat; status overdue/hari ini/terjadwal serta validasi waktu demo mengacu tanggal tersebut. Jangan menafsirkan angka preview sebagai kondisi bisnis atau pendapatan riil.
- **State:** perubahan hanya di memori React pada tab yang sedang dibuka; hilang saat reload atau **Reset demo**. Filter/pencarian tersimpan di URL, bukan persistence record bisnis. Tidak memakai localStorage, database, API CRM atau auth; tidak mengimpor workbook, PII, pengguna maupun audit nyata. Tidak ada schema atau migration baru. PostgreSQL + Drizzle ORM/Kit + `pg` + Better Auth tetap rencana backend produksi, belum diaktifkan oleh preview.
- **Cakupan frontend yang harus diverifikasi:** filter PIC/wilayah/layanan/periode dan pencarian URL; tambah prospek sintetis; detail; catat hasil dan next action dalam satu pembaruan lokal atomik; perubahan tahap OPEN dengan alasan untuk skip/mundur; guard Won/Lost; pipeline; aktivitas; laporan demo yang metriknya dihitung dari dataset/filter yang sama; pengaturan yang menjelaskan batas preview serta reset memori. Atomik lokal bukan transaksi database, dan histori demo bukan audit produksi.
- **Desain acuan:** `C:/Users/MSI-PC/exports/satukelas-crm-preview/render_preview.py` dan `DESIGN-NOTES.md`; putih/hitam, Geist, pink `#FD5392` untuk CTA/nav aktif, coral `#F86F64` untuk overdue, apricot `#F6BF75` untuk perhatian. Border 1/2px, radius 4px, flat **tanpa hard shadow pada admin**; sidebar desktop 232px, topbar 72px, gutter desktop 32px. Dashboard action-first: tiga KPI dalam satu kelompok menyatu, antrean follow-up sebagai pusat, pipeline dan aktivitas sebagai pendukung.
- **QA v0.6: TERVERIFIKASI LULUS.** Seluruh 9 pemeriksaan teknis (lint, typecheck, 18 unit tests, build Next.js turbopack, 23 browser E2E Playwright, 0 console error/request failure, 0 axe accessibility violations di 6 viewport 320–1600px, 0 vulnerabilities) dan 19 skenario fungsional ADM-01–ADM-19 tercatat lulus di [QA admin frontend](QA_ADMIN_FRONTEND.md). Belum mencakup UAT pemilik, persistence database, RBAC produksi, benchmark VPS atau deployment produksi.

### Status implementasi lokal v0.5 — historis frontend publik

- Frontend publik tersedia sebagai aplikasi terisolasi di `apps/marketing`, tidak mengganti homepage/CMS existing. URL review: **http://localhost:3100/** (alternatif `http://127.0.0.1:3100/`); URL lokal hanya dapat dipakai pada komputer yang menjalankan server.
- Implementasi Next.js App Router + TypeScript + Tailwind memakai komponen `Button` dengan pola shadcn/ui/Radix Slot, SVG resmi Open Peeps dan Geist lokal. `/login` baru penjelasan akses tim, bukan autentikasi aktif. Route CRM/API privat belum diimplementasikan dan mengembalikan 404; ini bukan bukti RBAC atau keamanan backend yang sudah dibangun.
- Kontrak CTA berlaku: **Gas Mulai Bareng Kami** / **Gas Bikin Cerita Bareng** → `wa.me` dengan pesan ter-encode; navigasi `#gabung` / `#alur` terpisah. Klik tidak mengirim pesan otomatis, tidak membuat akun/lead/session/record CRM. Nomor `6281234567890` diwarisi dari mockup dan **kepemilikannya belum terverifikasi**; konfirmasi nomor tujuan sebelum publikasi atau mengirim pesan. Preview menampilkan peringatan ini, tanpa janji bebas biaya atau waktu respons.
- QA lokal 24 Oktober 2026: build, lint aplikasi marketing, typecheck, **8 unit test** dan **12 tes browser Edge/Playwright** lolos; audit dependency aplikasi marketing melaporkan **0 vulnerabilities** saat dijalankan. Lima viewport diuji: 320, 390, 768, 1024, 1440 px. Pemeriksaan axe otomatis pada landing, halaman akses tim dan halaman 404 lolos di 390/1440 px; bukan sertifikasi aksesibilitas penuh atau UAT pengguna.
- Favicon 404 diperbaiki melalui `src/app/favicon.ico`. Starter standalone menyalin `public` dan `.next/static` lalu menjalankan `.next/standalone/server.js`, dengan bind lokal eksplisit `127.0.0.1` agar tidak memakai `HOSTNAME` bawaan Windows/Git Bash. Landing dan favicon terverifikasi HTTP 200; tes landing tidak mendapati console error, request gagal atau aset HTTP >=400.
- Detail hasil/batas pengujian: [QA frontend publik](QA_PUBLIC_FRONTEND.md). Backend PostgreSQL/Drizzle/Better Auth, migration, otorisasi nyata, backup/restore, kapasitas VPS dan deployment **belum dikerjakan/diuji**. Noindex tetap aktif sampai siap publikasi; keputusan domain/deployment dan UAT pemilik tetap terpisah.

## 1. Ringkasan produk

Satukelas Marketing CRM adalah aplikasi internal untuk akuisisi dan pengelolaan peluang kerja sama sekolah. Sistem menggantikan pencatatan operasional spreadsheet dengan database relasional, histori aktivitas, pipeline, tugas follow-up, dan laporan terdefinisi. Landing page publik mengajak calon mitra/anggota tim marketing Satukelas Projects mengenal peran yang membangun relasi sekolah, mengenalkan karya yearbook dan dokumentasi, serta berkolaborasi dengan tim. Landing tidak menjelaskan dashboard, fitur atau pipeline CRM; data dan fungsi operasional CRM tetap privat.

**Pekerjaan utama pengguna:** membuka daftar tindakan, mengetahui siapa yang perlu dihubungi, mencatat hasil komunikasi, lalu menetapkan tindakan berikutnya. Dashboard bukan tujuan akhir; dashboard harus membawa pengguna ke pekerjaan yang perlu dilakukan.

**Prinsip:** sekolah bukan peluang penjualan; nilai estimasi bukan pendapatan; membuka WhatsApp bukan bukti pesan terkirim; data kosong bukan nol; warna bukan satu-satunya penanda status.

## 2. Dasar kebutuhan dan batas bukti

### 2.1 Sumber terverifikasi

- Google Sheets: [DASHBOARD MARKETING](https://docs.google.com/spreadsheets/d/1x9eiFem9myUInOU-GgiRZygCEIYM8oh1jLUb1ONtoOs/edit?usp=sharing).
- Inspeksi menggunakan **salinan lokal** `marketing_dashboard.xlsx` berukuran **86.902 byte**, bukan janji bahwa data live belum berubah.
- SHA-256: `a30f25db7ad2c580b340190cdf2593289929676161597767cfa93b452537b685`.
- Sheet: `DASHBOARD` (29 × 14), `MASTER REFERENSI` (1000 × 20), `MASTER DATA` (1000 × 25), `PROGRESS` (100 × 16). Dimensi mencakup area template, bukan jumlah data bisnis.
- Seluruh sheet terlihat; tidak ditemukan baris/kolom tersembunyi atau proteksi sheet. Formula masing-masing: 152, 35, 0, 490. Validasi dropdown ada di dashboard, master data, dan progress.
- Identitas visual diperiksa pada `../UI_UX_REQUIREMENTS.md`, `../../src/app/globals.css`, dan `../../src/app/layout.tsx`: fondasi putih/hitam, pink `#FD5392`, palet pendukung, Geist, border tegas, radius kecil.

### 2.2 Temuan kualitas data

| Observasi pada snapshot | Dampak dan penanganan |
|---|---|
| 22 baris sekolah bernama, baris 2–23; tidak ada duplikat nomor maupun pasangan nama-wilayah-jenjang setelah normalisasi | Target rekonsiliasi migrasi adalah 22 sumber, bukan 1000 baris template; bukan bukti bebas duplikat semantik |
| 35 nomor di PROGRESS; 13 tidak memiliki pasangan master, tanpa isi manual tahap/tanggal/aktivitas/catatan | Klasifikasikan `TEMPLATE_ORPHAN`, simpan dalam laporan import, jangan menciptakan 13 sekolah fiktif |
| 22 progress cocok dengan master: Proposal Sent 11, Contacted 6, Negotiation 3, Won 1, Meeting Scheduled 1 | Kandidat tahap migrasi; bukan histori lengkap dan bukan bukti kontrak |
| Semua 35 progress bernomor tidak memiliki tanggal kontak, jadwal next action, aktivitas tindak lanjut, maupun catatan perkembangan | Untuk 21 peluang nonterminal yang cocok: tampilkan Belum terjadwal; jangan membuat tanggal/aktivitas historis |
| 17/22 tidak memiliki estimasi siswa; 18/22 tidak memiliki harga yang diinginkan | Hanya 4 baris memiliki dua operand; estimasi lain harus null, bukan 0 |
| 12/22 tidak memiliki nama kontak sekolah dan 12/22 tidak memiliki telepon sekolah | Kontak opsional saat intake, kelengkapan ditampilkan; jangan membuat nomor palsu |
| 22/22 tidak memiliki kontak sumber lead | PIC lead/referrer tidak otomatis kontak sekolah atau akun CRM |
| 12/22 tanpa tanggal input; 12/22 tanpa layanan; masing-masing 1 tanpa jenis sekolah dan jenjang | Pertahankan null; tanggal sumber dipisahkan dari timestamp import |
| Label `Swasta Islam ` memiliki spasi akhir; daftar jenjang dan sumber di area analitik tidak identik dengan daftar referensi input | Trim melalui mapping yang tercatat; referensi input A:G jadi kandidat seed, bukan menyalin semua area analitik |
| Satu baris Won tidak memiliki estimasi, layanan, maupun tanggal input | Impor sebagai riwayat legacy berflag perlu verifikasi; bukan fabricated revenue |
| Dashboard menyebut Won / seluruh master sebagai “Win Rate” dan memakai rentang terbatas | Definisi KPI aplikasi diperbaiki di §8; hasil angka dapat berbeda secara sah dari spreadsheet |

**Bukan fakta terverifikasi:** keabsahan setiap sekolah, angka kontrak, tanggal closing, alasan lost, tahun ajaran, kebijakan berbagi prospek, kapasitas VPS aktual, dan upgrade RAM yang telah dilakukan.

### 2.3 Kebutuhan yang sudah disampaikan pengguna

- Backend mandiri untuk mengurangi ketergantungan subscription Supabase.
- Docker untuk runtime yang tertata.
- Stack acuan: Next.js + TypeScript + Drizzle ORM + Drizzle Kit + PostgreSQL + Better Auth. Driver PostgreSQL menggunakan `pg` dengan connection pool yang dibatasi dan diuji sesuai kapasitas deployment.
- Schema domain didefinisikan dalam TypeScript di sisi server. Drizzle Kit menghasilkan migration SQL version-controlled yang ditinjau dan diuji sebelum diterapkan; jangan melakukan push schema langsung ke production. Better Auth menggunakan adapter Drizzle, dengan schema auth dan versi paket diverifikasi saat implementasi.
- Pergantian ORM tidak mengubah kebutuhan bisnis, model logis ERD, RBAC, atau batas landing statis. Tidak ada klaim penghematan RAM/kelulusan kapasitas VPS tanpa benchmark.
- UI Neo-Brutalisme selaras Satukelas Projects; versi aplikasi dibuat lebih tenang dan berorientasi kerja.
- VPS saat pembahasan: 2 core / 2 GB dengan Hermes; opsi upgrade 8 GB dibahas, **belum terkonfirmasi**.
- Dokumentasi dahulu, pengujian lokal sebelum sinkronisasi hosting.
- Revisi pengguna: landing publik persuasif untuk **calon mitra/anggota tim marketing Satukelas Projects**, bukan pengenalan sistem/dashboard CRM. Narasi berfokus pada relasi sekolah, karya yearbook dan dokumentasi, kolaborasi, peran dan kecocokan. Bukan pengganti website company profile atau pembukaan akses publik ke database CRM.
- CTA primer dengan copywriting persuasif Gen Z (**Gas Mulai Bareng Kami** / **Gas Bikin Cerita Bareng**) berdesain tombol hitam solid Neo-Brutalisme, dengan direct output value menuju obrolan WhatsApp tujuan kemitraan (nomor preview belum terverifikasi) (`https://wa.me/6281234567890?text=...`) untuk pendaftaran marketing; navigasi informasional menuju anchor `#gabung` dan `#alur`; **Masuk akun tim** menuju `/login` adalah akses sekunder untuk pemilik akun undangan internal, bukan cara melamar. Pendaftaran diproses langsung via WhatsApp tanpa form pendaftaran database CRM.
- Karakter memakai SVG resmi Open Peeps dari aset repo sesuai [Character Guidelines](../CHARACTER_GUIDELINES.md), bukan generatif raster. Identitas landing putih/hitam/pink `#FD5392`, Geist dan Neo-Brutalisme. Tidak mengarang komisi, penghasilan, lowongan aktif, testimoni, pelatihan atau benefit faktual.

## 3. Masalah, tujuan, dan metrik penerimaan

### 3.1 Masalah yang diselesaikan

1. Data sekolah, peluang, kontak, dan riwayat tercampur serta bergantung lookup nomor baris.
2. Tidak ada histori perubahan tahap atau akuntabilitas assignment yang kuat.
3. Follow-up mudah terlupakan karena jadwal kosong atau tertimpa.
4. Nilai prospek berpotensi dibaca sebagai pendapatan walaupun datanya tidak lengkap.
5. Ringkasan spreadsheet dibatasi rentang formula dan belum menerapkan scope akses per pengguna.

### 3.2 Sasaran rilis awal

| Sasaran | Cara verifikasi / target usulan, bukan hasil saat ini |
|---|---|
| Tidak kehilangan sumber migrasi | 100% baris sumber punya hasil accepted/rejected/template beserta alasan; rekonsiliasi jumlah per tahap/PIC |
| Tindakan berikutnya mudah ditemukan | Dalam uji tugas, marketing menemukan prospek overdue dan membuka detail ≤30 detik |
| Pencatatan praktis | Catat aktivitas + jadwal berikutnya ≤60 detik; ≥4 dari 5 skenario uji selesai tanpa bantuan |
| Data tidak bocor antar-PIC | Semua uji akses lintas scope UI, API, export, file, dan agregasi ditolak |
| Peluang aktif terkelola | Target adopsi usulan: ≥90% peluang aktif punya tugas berikutnya dalam 14 hari pilot; baseline diukur dahulu |
| Operasional dapat dipulihkan | Restore database + file di lingkungan bersih lolos rekonsiliasi dan login |

Target adopsi tidak menjanjikan kenaikan penjualan. Jadwal kalender dan target omzet ditetapkan pemilik produk, bukan diada-adakan di spesifikasi.

## 4. Batas produk dan arsitektur

### 4.1 In scope P0 — rilis MVP

- Landing publik satu halaman (MKT-FR-019 / MKT-S13): ajakan mengenal peran mitra/tim marketing, relasi sekolah, pengenalan karya yearbook/dokumentasi, kolaborasi, kecocokan, cara bergabung dan FAQ. CTA primer bernada persuasif Gen Z (**Gas Mulai Bareng Kami** / **Gas Bikin Cerita Bareng**) berdesain tombol hitam solid Neo-Brutalisme dengan direct output value menuju obrolan pendaftaran WhatsApp tujuan kemitraan (nomor preview belum terverifikasi) (`https://wa.me/6281234567890?text=...`), didampingi navigasi informasional `#gabung` dan `#alur`; login akun undangan sekunder. Statis, tanpa preview dashboard atau penjelasan fitur/pipeline CRM; tidak memerlukan akun untuk membaca.
- Akun tertutup, sesi, tiga role, assignment dan otorisasi server.
- Referensi, sekolah, banyak kontak sekolah, peluang per sekolah/periode/layanan.
- Tabel prospek, filter, pipeline Kanban dan kontrol pindah tahap non-drag.
- Histori tahap, catatan aktivitas, tugas follow-up, status prioritas.
- Dashboard operasional, laporan definisi KPI yang konsisten, export CSV berscope.
- Import snapshot XLSX/CSV dengan staging, preview, mapping, exceptions, idempotensi.
- Audit metadata, pengarsipan, conflict detection, backup dan uji restore.

### 4.2 P1 — setelah fondasi stabil

- Dokumen proposal PDF privat maksimal 10 MiB per file.
- Inbound website publik melalui endpoint server-to-server terautentikasi dan antrean review.
- Reminder eksternal terjadwal, setelah kanal/penerima/pengiriman disetujui.

P1 tidak boleh diam-diam masuk acceptance MVP. Halaman/fitur belum tersedia tidak diberi navigasi aktif.

### 4.3 Out of scope

CMS/editor konten publik dinamis (landing rekrutmen statis tetap P0), pendaftaran akun publik, form aplikasi/rekrutmen publik, lead intake publik, endpoint rekrutmen, free trial, pricing SaaS, formulir lead/demo, analytics/tracking pihak ketiga, demo CRM interaktif anonim, member/reader yearbook, produksi buku/video, invoicing, pembayaran, akuntansi, komisi, stok, otomatisasi pesan WhatsApp, sinkronisasi dua arah Sheets, peta GIS, prediksi AI, multi-company SaaS, dan mode offline edit. Klik WhatsApp hanya deep link, bukan integrasi WhatsApp Business API.

### 4.4 Batas aplikasi dan deployment

- **Modular monolith:** satu aplikasi Next.js untuk UI dan backend domain; Drizzle ORM mengakses PostgreSQL. Modul: identity/access, references, schools/contacts, opportunities/stages, activities/tasks, reports, migration/audit.
- Database CRM adalah sumber data tunggal. Tidak ada fallback localStorage/JSON untuk data operasional riil. Demo/test memakai fixture sintetis dan database terpisah.
- Nama route dalam dokumen bersifat app-relative (`/`, `/login`, `/dashboard`, `/opportunities`, dll.). Root `/` adalah landing publik dalam namespace CRM, bukan instruksi mengganti homepage company profile existing. Prefix `/marketing` atau subdomain bukan keputusan final (D-01).
- Landing dirender dari konten statis version-controlled dan aset SVG resmi Open Peeps repo yang ditinjau sesuai `docs/CHARACTER_GUIDELINES.md`; tidak memanggil repository/query database CRM atau memerlukan lookup sesi. CTA primer publik **Lihat langkah bergabung** menuju `#gabung`, bagian penjelasan tanpa form/submission. Link sekunder **Masuk akun tim** menuju `/login` hanya untuk pemilik akun undangan. Setelah login valid, pengguna menuju `/dashboard` atau return path internal yang tervalidasi dan diotorisasi. Pengguna yang sudah login tetap boleh membaca landing; tidak otomatis dialihkan dari `/`. Tidak ada tabel, endpoint rekrutmen atau lead intake baru.
- Hanya landing dan asset publik yang boleh dicache secara publik. Login/setup/reset, route/API/RSC/data privat tetap memakai policy dan no-store yang sesuai; menambah landing tidak menjadikan semua GET atau semua asset dapat diakses anonim.
- Folder dokumentasi `docs/marketing/` di repo existing **tidak menetapkan** aplikasi harus satu repo. Hosting/repo CRM terpisah direkomendasikan demi isolasi, perlu keputusan D-01.
- CMS existing tetap pada stack/aksesnya; spesifikasi ini tidak memigrasikan database publik Supabase atau mengganti auth CMS.
- Docker Compose inti: `app`, `db`, dan proxy **hanya jika belum ada reverse proxy existing**. PostgreSQL tidak dipublikasikan ke internet.
- Build image di lokal/CI; production memakai Next.js `standalone`, bukan dev server. Tidak wajib Redis, MinIO, worker permanen, atau panel monitoring berat.
- Persistent volume untuk DB dan, bila P1 aktif, dokumen privat. Backup eksternal wajib; volume bukan backup.
- Hermes tetap deployment existing. Akses root/Docker socket berarti Docker bukan batas keamanan terhadap agent tersebut. Batasi permission, konkurensi browser/build, dan resource setelah pengukuran.

## 5. Pengguna, role, dan ruang akses

**Usulan role membutuhkan persetujuan D-02.** Role tidak diturunkan dari nama PIC spreadsheet.

| Kemampuan | ADMIN | MANAGER | MARKETER |
|---|---|---|---|
| Kelola akun, role, reset akses, import | Ya | Tidak | Tidak |
| Referensi non-pipeline | Kelola | Kelola | Baca |
| Lihat peluang, aktivitas, tugas, KPI | Semua | Semua | Milik sendiri |
| Buat peluang | Pilih owner aktif | Pilih owner aktif | Owner diri sendiri |
| Reassign owner, arsip/restore | Ya | Ya | Tidak |
| Ubah peluang/tahap, catat aktivitas/tugas | Semua | Semua | Milik sendiri |
| Lihat/edit sekolah dan kontak | Semua | Semua | Sekolah yang punya ≥1 peluang nonarsip miliknya |
| Export CSV | Semua | Semua | Hanya peluang miliknya, tanpa audit/import/raw data |
| Audit bisnis | Semua | Semua | Timeline domain yang diizinkan saja |
| Baca kredensial/hash/session token | Tidak melalui produk | Tidak | Tidak |

Pengunjung anonim bukan role CRM atau record `crm_members`. Ia hanya dapat membaca copy rekrutmen statis dan aset publik resmi yang ditinjau serta membuka flow auth akun undangan; tidak dapat membaca sekolah/kontak, nama PIC internal, peluang, aktivitas, nilai, agregasi, export, import, audit, atau dokumen privat. `noindex`/robots bukan pengganti otorisasi.

Ketentuan:
- Otorisasi pada setiap loader, Server Action, Route Handler, download, export, dan agregasi; bukan hanya menyembunyikan menu.
- MARKETER melihat identitas/kontak sekolah bersama bila ia mempunyai peluang di sekolah itu, **tetapi tidak** peluang, nilai, aktivitas, atau tugas milik PIC lain. Ini trade-off kolaborasi yang harus disetujui.
- MARKETER membuat sekolah baru bersama peluang pertama dalam satu transaksi. Sekolah di luar scope tidak bocor melalui autocomplete. Manager menangani kemungkinan duplikat lintas owner.
- Reassignment membuat akses PIC lama berhenti pada request berikutnya dan seluruh tugas pending pindah ke owner baru; histori penulis tetap.
- Akun dinonaktifkan tidak dapat memakai sesi lama. Hanya ADMIN dapat membuat akun; tidak ada public signup. Empat nama PIC tidak otomatis menjadi empat akun aktif tanpa email terverifikasi.
- Penghapusan/deaktivasi admin terakhir dilarang. Penggantian PIC sebelum nonaktif dilakukan atomik untuk semua peluang nonarsip agar tanggung jawab tidak hilang.

## 6. Model domain dan aturan bisnis

### 6.1 Sekolah dan kontak

- `school`: identitas satu unit/cabang + jenjang. Yayasan yang sama bisa mempunyai beberapa unit; jangan otomatis merge nama mirip.
- Sekolah boleh tanpa jenis/jenjang/nomor kontak saat intake. Nama dan wilayah wajib pada pencatatan baru; nama minimum 2, maksimum 200 karakter.
- NPSN opsional, tepat 8 digit bila diisi; unik hanya jika telah diverifikasi. Alamat/URL peta opsional, tidak melakukan fetch URL dari server.
- Banyak `school_contacts` per sekolah. Nama, peran, telepon, email opsional sebagian; minimal nama dan satu informasi peran/kanal. Nomor hanya dinormalisasi jika valid; kontak sumber lead bukan otomatis kontak kepala sekolah.
- Satu kontak utama opsional per sekolah, tidak dipaksa ada jika belum diketahui. Telepon legacy yang tidak valid masuk exceptions, bukan dikoreksi spekulatif.

### 6.2 Peluang dan nilai

- Satu `opportunity` adalah satu upaya penjualan untuk sekolah + periode + layanan, owner tunggal. Sekolah boleh memiliki banyak peluang lintas periode/layanan.
- Periode bisnis adalah label terkontrol, misalnya `2026/2027` (contoh saja). Data migrasi tanpa periode memakai null dan flag perlu review; jangan menurunkan tahun ajaran dari tanggal import.
- Layanan awal: Yearbook Lengkap, Photoshoot, Design + Cetak. MVP menggunakan **satu layanan per peluang**; bundling/itemized quotation di luar MVP (D-03).
- Estimasi siswa = integer ≥0, harga yang diinginkan per siswa = decimal IDR ≥0. **Arti harga per siswa adalah usulan yang perlu validasi D-03**, meskipun formula sumber mengalikan kedua field.
- Estimasi nilai = siswa × harga hanya bila keduanya diketahui. Null × nilai tetap null. Nol yang dimasukkan eksplisit tidak disamakan kosong.
- Nilai deal final disimpan terpisah dari estimasi. Won baru wajib nilai final >0, layanan dan periode; gratis/zero-value perlu kebijakan terpisah.
- Nilai deal bukan invoice, pembayaran, atau revenue terealisasi.
- Duplicate warning untuk sekolah/periode/layanan yang sama; bukan unique constraint keras karena bisa ada peluang paralel sah. Manager meninjau duplikat; MARKETER mendapat pesan generik tanpa membocorkan owner lain.

### 6.3 Tahap dan transisi

| Code stabil | Label | Jenis |
|---|---|---|
| `COLD_LEAD` | Cold Lead | OPEN |
| `CONTACTED` | Contacted | OPEN |
| `MEETING_SCHEDULED` | Meeting Scheduled | OPEN |
| `PRESENTATION_DONE` | Presentation Done | OPEN |
| `PROPOSAL_SENT` | Proposal Sent | OPEN |
| `NEGOTIATION` | Negotiation | OPEN |
| `WON` | Deal Closed / Won | WON |
| `LOST` | Deal Lost / Rejected | LOST |

- Baru dimulai COLD_LEAD. Semua perpindahan OPEN→OPEN diperbolehkan; mundur atau melewati tahap memerlukan alasan 3–500 karakter. Sistem tidak memalsukan tahap yang dilewati.
- OPEN→WON memerlukan final value >0, layanan, periode, tanggal closing bisnis, dan catatan bukti/referensi kesepakatan. OPEN→LOST memerlukan alasan lost, catatan, dan tanggal closing.
- Closing baru tidak boleh tanggal masa depan WIB; timestamp pencatatan server tetap terpisah dari tanggal closing bisnis.
- WON/LOST→OPEN hanya ADMIN/MANAGER, alasan wajib; terminal→terminal langsung dilarang. Harus reopen dahulu. Nilai/closing terminal sebelumnya ada di histori audit, field closing aktif dibersihkan saat reopen.
- Closing membatalkan tugas pending secara atomik dengan alasan `OPPORTUNITY_CLOSED`, tidak membuat aktivitas “kontak berhasil”. Reopen tidak menghidupkan ulang tugas lama.
- Setiap transisi menghasilkan histori immutable: from/to, aktor, timestamp, alasan, snapshot final value/closing. Mutasi + histori + pembatalan tugas harus satu transaksi.
- Legacy terminal bisa diimpor dengan field closing kosong **hanya melalui jalur migrasi**, flag `needs_review=true` dan exception terjelaskan. UI normal tidak boleh memakai pengecualian ini. Verifikasi legacy wajib melengkapi ketentuan terminal.

### 6.4 Aktivitas dan tugas follow-up

- `activity` mencatat kejadian yang telah berlangsung: WA, telepon, kunjungan, meeting, presentasi, proposal, catatan. Waktu kejadian ≠ waktu dicatat.
- Klik tombol WhatsApp tidak otomatis membuat activity atau mengubah tahap. Setelah komunikasi pengguna mencatat hasilnya.
- Aktivitas immutable; salah catat dikoreksi dengan entry baru yang merujuk entry lama, tidak menghapus jejak.
- `follow_up_task` adalah rencana: judul, due date WIB (tanggal, tanpa jam untuk MVP), status PENDING/COMPLETED/CANCELLED; assignee tugas PENDING mengikuti owner peluang saat ini. Assignee tugas COMPLETED/CANCELLED dipertahankan sebagai histori dan tidak diubah oleh reassignment.
- Beberapa tugas pending diperbolehkan. Next action = tugas pending dengan due date paling awal; tie-break created_at lalu id.
- Selesaikan tugas hanya setelah mengisi hasil; server membuat activity dan mengubah tugas atomik. Double-click/retry tidak boleh menciptakan aktivitas ganda.
- Reschedule memerlukan alasan, menyimpan jadwal sebelumnya dalam audit. Status tepat waktu dihitung dari due date saat penyelesaian; perubahan jadwal tetap dapat diaudit.
- Tugas selesai/batal tidak diedit kembali. Perlu tugas baru untuk tindak lanjut berikutnya. Intake tanpa tugas diizinkan, tetapi ditandai Belum terjadwal.
- Last contact membandingkan aktivitas komunikasi efektif terbaru (leaf correction, MAX occurred_at) dengan `legacy_last_contact_on`. Bandingkan tanggal aktivitas setelah konversi ke WIB dengan tanggal legacy; pilih tanggal yang lebih baru, dan utamakan aktivitas bila tanggal sama. Bila aktivitas terpilih, waktu aslinya tetap tersedia; bila legacy terpilih, tampilkan tanggal saja tanpa jam buatan. Jika keduanya kosong, tampilkan belum diketahui. Catatan internal dan event import bukan kontak; tanggal legacy adalah fakta sumber, bukan aktivitas fiktif.

### 6.5 Pengarsipan dan concurrency

- Arsip adalah penyembunyian operasional, bukan hard delete. Arsip peluang hanya ADMIN/MANAGER dan membutuhkan alasan; tugas pending dibatalkan atomik. Peluang arsip read-only: server menolak edit field domain, transisi/reopen, reassignment biasa, aktivitas/koreksi baru, verifikasi legacy dan mutasi tugas, termasuk lewat import. Yang diizinkan hanya baca/export sesuai scope serta restore oleh ADMIN/MANAGER; penggantian PIC nonaktif hanya sebagai bagian transaksi restore. Mutasi biasa wajib restore dahulu.
- Restore peluang mengembalikan stage terakhir, tidak menghidupkan tugas; peluang OPEN kembali Belum terjadwal jika belum ada tugas baru. Server memeriksa owner aktif dalam transaksi restore; jika owner lama nonaktif, ADMIN/MANAGER wajib memilih PIC pengganti aktif dan assignment diubah atomik sebelum restore berhasil. Aktor histori tidak diubah.
- Sekolah hanya dapat diarsip jika semua peluangnya telah diarsip; restore sekolah dahulu sebelum restore peluang.
- Histori/audit tidak diubah oleh arsip. Laporan default mengecualikan peluang arsip dan menampilkan aturan tersebut; admin/manager dapat memilih sertakan arsip.
- Update memakai `version` optimistic locking. Versi stale mendapat conflict 409/setara typed result tanpa menimpa data baru. Retry perlu mengambil versi terbaru dan meminta pengguna meninjau.

## 7. Kebutuhan fungsional dan acceptance criteria

P0 wajib MVP; P1 ditunda. Semua contoh pengujian memakai data sintetis, bukan kontak asli.

| ID | Prioritas | Kebutuhan dan acceptance minimum |
|---|---|---|
| MKT-FR-001 | P0 | Login/logout, akun tertutup, reset akses terkelola, session expiry. Sesi nonaktif/expired ditolak di request berikut; respons login tidak mengungkap keberadaan email; proteksi brute force; admin terakhir tidak bisa dihapus. |
| MKT-FR-002 | P0 | RBAC + scope assignment. MARKETER A tidak bisa membaca/mengubah/export/download/agregasi peluang B dengan ID tebakan; hasil seragam 404 untuk record di luar scope. |
| MKT-FR-003 | P0 | Referensi terkontrol. ADMIN/MANAGER mengelola wilayah, jenis, jenjang, sumber, layanan, periode dan alasan lost; inaktif tidak bisa dipilih baru tetapi histori tetap terbaca; stage codes tidak bisa dihapus/ubah melalui UI. |
| MKT-FR-004 | P0 | Master sekolah. Create/edit, warning duplikat, archive/restore sesuai aturan; penambahan MARKETER atomik dengan peluang pertama. |
| MKT-FR-005 | P0 | Banyak kontak sekolah. Simpan kontak dengan normalisasi, pilih utama, deaktifkan; nomor invalid ditolak input baru dan diparkir saat import; CTA WA hanya untuk nomor valid. |
| MKT-FR-006 | P0 | Peluang + assignment + estimasi null-safe. 200 siswa × Rp250.000 = Rp50.000.000; salah satu operand kosong menghasilkan “Belum diketahui”; reassign memindahkan pending tasks dan akses. |
| MKT-FR-007 | P0 | State machine delapan tahap. Perubahan valid membuat satu histori; Won/Lost ditolak tanpa field wajib; conflict/unauthorized tidak menghasilkan histori parsial. |
| MKT-FR-008 | P0 | Timeline aktivitas. Catat hasil komunikasi, correction append-only, filter jenis; klik WA saja tidak dianggap komunikasi terkirim. |
| MKT-FR-009 | P0 | Tugas, prioritas, next action. Overdue/hari ini/terjadwal berdasarkan WIB; complete + activity atomik dan idempotent; tidak ada task pending setelah terminal/arsip. |
| MKT-FR-010 | P0 | Dashboard action-first. KPI dan drill-down memakai scope/filter sama; unknown values dan legacy unverified eksplisit; kartu bukan angka demo. |
| MKT-FR-011 | P0 | Tabel, pencarian, filter, Kanban. Pagination server, state filter dalam URL, sorting stabil; pindah stage via dialog tersedia tanpa drag di keyboard/mobile. |
| MKT-FR-012 | P0 | Laporan + export CSV. Definisi §8 digunakan konsisten, ID/nilai/tanggal tidak hilang; filter dan scope disertakan, formula injection dinetralisir, PII hanya dalam export yang diizinkan. |
| MKT-FR-013 | P0 | Import XLSX/CSV. Admin preview/mapping/konfirmasi, tidak ada partial silent commit; 22 master direkonsiliasi, 13 orphan template tidak menjadi sekolah, Won legacy berflag; retry tidak menggandakan data. |
| MKT-FR-014 | P0 | Audit dan konflik. Perubahan owner/stage/nilai/tugas/arsip tercatat aktor+waktu; log tidak memuat secret/isi file/telepon mentah; konflik versi tidak menimpa. |
| MKT-FR-015 | P0 | Arsip/restore. Tidak ada delete cascade bisnis; arsip menyisakan histori dan membatalkan pending task; restore butuh sekolah aktif dan menghasilkan no-task warning bila relevan. |
| MKT-FR-016 | P1 | Dokumen PDF privat. Maksimal 10 MiB, signature dan MIME benar, file opaque di luar public; download memeriksa scope terbaru dan tidak bisa path traversal. |
| MKT-FR-017 | P1 | Inbound publik. Autentikasi server-to-server, schema validation, request ID unik, rate limit; masuk inbox review tanpa auto-merge sekolah berdasarkan nama. |
| MKT-FR-018 | P1 | Reminder eksternal. Kanal opt-in disetujui, dedupe, lock job, retry terbatas, audit delivery; tidak mengirim pada tugas terminal/arsip atau PIC yang tidak berhak. |
| MKT-FR-019 | P0 | Landing publik persuasif untuk **calon mitra/anggota tim marketing Satukelas Projects**. Root app-relative `/` terbaca anonim dan saat DB CRM tidak tersedia, tanpa query DB atau lookup sesi. Narasi: relasi sekolah, mengenalkan karya yearbook/dokumentasi, kolaborasi, peran dan kecocokan; bukan penjelasan fitur/pipeline CRM atau preview dashboard. CTA primer dengan copywriting persuasif Gen Z (**Gas Mulai Bareng Kami** / **Gas Bikin Cerita Bareng**) berdesain tombol hitam solid Neo-Brutalisme dengan direct output value menuju obrolan pendaftaran WhatsApp tujuan kemitraan (nomor preview belum terverifikasi) (`https://wa.me/6281234567890?text=Halo%20Satukelas%20Projects%2C%20saya%20tertarik%20mendaftar%20sebagai%20mitra%20marketing.%20Mohon%20informasi%20pendaftaran%20dan%20persyaratannya.`), didampingi navigasi informasional `#gabung` dan `#alur`; **Masuk akun tim** → `/login` hanya sekunder. Pendaftaran diproses langsung via chat WhatsApp tanpa form rekrutmen internal CRM; tanpa klaim komisi/penghasilan/lowongan aktif/testimoni/pelatihan/benefit faktual. Gunakan SVG resmi Open Peeps repo sesuai Character Guidelines; putih/hitam/pink `#FD5392`, Geist, Neo-Brutalisme. Seluruh data operasional/PII dilarang pada HTML, RSC/JSON, metadata dan aset publik. Tanpa form, signup publik, lead intake, endpoint rekrutmen, tabel baru, inbound atau demo interaktif publik; route/API/export/file privat tetap menolak akses anonim. |
| MKT-FR-020 | P0 | CRUD Member Marketing & Reset Password Admin. Khusus role ADMIN: manajemen akun tim marketing (`MARKETER`). Tambah member baru dengan nama, email, password awal (di-hash scrypt), input gambar diri/avatar (JPEG/PNG/WebP, max 2MB) dengan preview interaktif, dan status keaktifan. Edit data profil member dan pembaruan foto profil. Fitur reset password akun marketing (password baru min 8 karakter di-hash scrypt dengan salt acak). Hapus/nonaktifkan akun member dengan proteksi integritas data peluang (`ownerId`). Role MARKETER dilarang mengakses form dan endpoint manajemen akun (HTTP 403 Forbidden). |
| MKT-FR-021 | P0 | Landing Publik Profil Member Marketing & Etalase Produk Satukelas Projects. Rute publik `/tim/[slug]` dan alias `/m/[slug]`. Menyajikan identitas personal branding member marketing (`MARKETER`), foto avatar (atau karakter editorial resmi), badge PIC terverifikasi, area `#produk` dengan header tanpa grid/kartu/harga statis dan tanpa section/tautan/opsi bundling, serta generator pesan WhatsApp referral interaktif dengan tag ID/nama member (tanpa penyimpanan lead otomatis). Data layanan API company profile direncanakan terpisah dan belum diintegrasikan. Resolusi slug ramah nama (`yunus`, `dzaky`), identifier unik (`usr_mkt_01`), dan email prefix. Guard keaktifan: member nonaktif atau slug tidak ditemukan menampilkan 404 ramah Satukelas Projects. Desain Contra Neo-Brutalisme (border 2px solid hitam, hard shadow 4px, `#FD5392`, `#4150B1`, `#F6BF75`, font Geist). |

## 8. Definisi KPI, filter, dan waktu

### 8.1 Scope dan periode laporan

- Semua query mulai dari peluang yang diizinkan pengguna; filter PIC tidak dapat memperluas scope.
- Filter umum: PIC saat ini, wilayah sekolah saat ini, layanan, periode bisnis. Nilai null punya pilihan **Belum diketahui**, bukan tidak terlihat.
- Dashboard operasional memakai snapshot **saat ini**, tidak diberi filter tanggal closing yang menyesatkan. Follow-up selalu dinilai terhadap hari ini WIB.
- Laporan memiliki dua mode eksplisit: **Cohort masuk** (source_entered_on; legacy null tidak masuk rentang dan jumlahnya diberi catatan), dan **Hasil closing** (closed_on). “Semua waktu” mencakup tanggal tidak diketahui dengan label.
- Tanggal rentang inklusif pada UI diterjemahkan half-open `[awal 00:00 WIB, hari sesudah akhir 00:00 WIB)` untuk timestamp UTC. Due date/closed_on/source_entered_on memakai DATE WIB.
- Laporan cohort memakai status terkini, bukan status as-of tanggal lampau. Closed report juga melihat closing cycle aktif terkini; histori reopen tersedia di timeline, tidak dihitung dua kali. Laporan histori siklus/as-of di luar MVP.
- Atribusi PIC menggunakan owner saat ini, bukan owner pada saat closing. Pilihan ini diberi label; laporan atribusi historis perlu keputusan terpisah.

### 8.2 Rumus

| Metrik | Definisi |
|---|---|
| Sekolah terdata | COUNT DISTINCT school_id dalam scope peluang; bukan otomatis “mitra” |
| Total peluang | COUNT peluang dalam scope; satu sekolah boleh dihitung lebih dari sekali |
| Pipeline aktif | COUNT stage kind OPEN; legacy flag tetap terlihat dan dapat difilter |
| Nilai pipeline aktif | SUM estimasi diketahui untuk OPEN; tampilkan `n/m peluang bernilai diketahui`; null tidak dijumlah sebagai 0 tersembunyi |
| Won terverifikasi | COUNT WON dengan needs_review=false; legacy Won ditampilkan terpisah |
| Nilai deal final | SUM final_deal_value WON terverifikasi; bukan revenue dan bukan estimasi |
| Win rate | verified WON / (verified WON + verified LOST) ×100%; denom 0 → “—”, bukan 0% |
| Lead-to-win conversion | verified WON / seluruh peluang dalam cohort yang dipilih ×100%; berbeda dari win rate |
| Kelengkapan jadwal | OPEN yang punya ≥1 task PENDING / seluruh OPEN; terminal bukan denominator |
| Tugas terlambat | COUNT task PENDING due_on < hari ini WIB, peluang OPEN dan nonarsip |
| Peluang overdue | COUNT DISTINCT opportunity_id dari tugas terlambat; berbeda dari jumlah tugas |
| Penyelesaian tepat waktu | task COMPLETED dengan tanggal WIB completed_at ≤ due_on pada saat selesai / seluruh completed task pada rentang completion |

Status follow-up per peluang, urut prioritas: terminal → **Selesai**; OPEN tanpa pending → **Belum terjadwal**; next due < hari ini → **Terlambat**; = hari ini → **Hari ini**; > hari ini → **Terjadwal**. Arsip berada di tampilan arsip, tidak disamarkan sebagai status terminal. Urutan di atas adalah precedence penentuan label, bukan urutan antrean. Prioritas kerja merupakan derivasi, bukan field manual: Terlambat → Hari ini → Belum terjadwal → Terjadwal; Selesai tidak masuk antrean. Dalam kategori bertanggal urut next due ASC, lalu created_at peluang ASC, lalu id ASC; kategori Belum terjadwal memakai created_at peluang ASC lalu id ASC. Dashboard dan sort prioritas memakai aturan yang sama.

**Contoh fixture, bukan data bisnis:** 10 peluang, verified Won=2, verified Lost=1, legacy Won=1, OPEN=6 → win rate 66,67%, conversion 20%, legacy 1 ditampilkan terpisah. OPEN bernilai diketahui 50 juta + 20 juta + 0 dan 3 unknown → pipeline Rp70 juta, coverage 3/6. Jangan menyatakan keenamnya bernilai nol/terisi.

## 9. Migrasi dan seed

1. Ambil ekspor baru menjelang cutover, simpan hash dan file raw privat; snapshot di §2 hanya baseline analisis.
2. Buat akun terkontrol dan mapping nama PIC→user ID; belum ada email berarti mapping pending, bukan akun otomatis. Riwayat menunjukkan 2 PIC terpakai dan 4 nama referensi, bukan 4 akun aktif.
3. Stage per row, simpan raw dan normalized + kode issue. Nomor spreadsheet adalah legacy key, bukan PK aplikasi.
4. Mapping master dan PROGRESS berdasarkan nomor, bukan posisi baris. Referensi trim dan alias disetujui admin; mapping tak dikenal diblokir.
5. Tanggal sumber kosong tetap null. Nilai harga dan jumlah diketahui direkonsiliasi, formula tidak dieksekusi di server.
6. 13 orphan tanpa isi manual ditandai template setelah review. Orphan berisi data bisnis pada ekspor berikutnya wajib exception blocking.
7. Satu candidate opportunity per master untuk snapshot awal; sekolah duplikat semantik ditinjau, tidak digabung otomatis. Layanan/periode unknown diberi flag, bukan nilai tebakan.
8. Legacy Won tanpa nilai/tanggal dipertahankan sebagai unverified, tidak masuk verified Won/win rate/deal final. Import exception tidak dapat diakses oleh form normal.
9. Commit hanya batch tervalidasi setelah exception blocking dituntaskan; satu transaksi untuk snapshot kecil ini. Simpan row→entity mapping untuk audit dan reimport idempotent.
10. Reconcile 22 master, stage counts, assignment, 4 estimasi diketahui (total snapshot Rp72.210.000, seluruh tahap, **bukan revenue**), unknown counts, 13 template orphan. Bila ekspor terbaru berbeda, laporkan delta, jangan memaksa angka lama.
11. Freeze edit spreadsheet saat cutover, backup sebelum commit, UAT, lalu jadikan spreadsheet read-only arsip; rollback mengikuti batch mapping dan backup, bukan hapus data tanpa evaluasi dependensi.

## 10. Non-functional requirements dan release gates

| ID | Kebutuhan / target usulan |
|---|---|
| MKT-NFR-001 | Security: HTTPS, cookie HttpOnly/Secure/SameSite yang sesuai, CSRF/origin validation, validasi server, query parameterized, rate limit auth/export/import, payload privat no-store; secret hanya env/server. |
| MKT-NFR-002 | Accessibility: WCAG 2.2 AA, kontras teks normal ≥4,5:1, kontrol/fokus ≥3:1, target 44px, keyboard dan pembaca layar, non-drag equivalent, reduced motion. |
| MKT-NFR-003 | Responsiveness: 360, 768, 1024, 1440px; baseline reflow 320px tanpa horizontal scroll halaman; tabel/board boleh scroll internal berlabel. |
| MKT-NFR-004 | Performance acceptance awal: dataset sintetis 5.000 sekolah/10.000 peluang/50.000 aktivitas, 10 sesi aktif uji (asumsi kapasitas, bukan jumlah tim terkonfirmasi); p95 list/filter/detail ≤2s dan mutation ≤1,5s pada koneksi/lingkungan uji yang dicatat. |
| MKT-NFR-005 | Reliability: transaksi atomik, optimistic locking, idempotent retry, pagination 25 default maksimum 100, batas import 5 MiB/2.000 master rows per batch untuk MVP; tolak melebihi limit sebelum parsing penuh. |
| MKT-NFR-006 | Backup: baseline usulan harian off-server terenkripsi, retensi 7 harian +4 mingguan, RPO ≤24 jam/RTO ≤4 jam harus diuji; DB dan file termasuk, secret dikelola terpisah. Retensi final D-07. |
| MKT-NFR-007 | Observability: health/liveness dan readiness DB terpisah, log terstruktur berotasi tanpa PII/secret, error ID, pemantauan disk/CPU/RAM/restart; batas log mencegah disk penuh. |
| MKT-NFR-008 | Operasional: uji lokal dahulu, image immutable dari CI/lokal, migrate terkontrol dengan backup, DB internal network, resource budget setelah baseline VPS, jangan build berat di VPS bersama Hermes. |

Belum ada benchmark atau jaminan aman pada 2 core/8 GB. Release production ditahan bila RAM aktual belum cukup, load test bersamaan aktivitas normal Hermes gagal, reverse proxy belum dipetakan, backup belum dapat dipulihkan, atau auth reset belum tersedia.

Reset akun MVP: admin mengeluarkan token setup/reset satu kali, terikat user, kedaluwarsa 1 jam, disimpan hashed, disampaikan melalui kanal privat di luar aplikasi; password hanya di form TLS. Setelah reset, revoke sesi lama. Tidak mencetak token/password ke log. Mekanisme Better Auth diverifikasi dengan versi paket terpilih saat implementasi, tidak membuat tabel password buatan sendiri.

## 11. Rencana pengembangan berbasis gate

| Gate | Hasil yang harus tersedia |
|---|---|
| G0 — keputusan produk | D-01 s.d. D-05 ditinjau; aturan akses, periode, nilai, migrasi dan UI disetujui |
| G1 — fondasi lokal | PostgreSQL Compose, migration SQL Drizzle Kit, auth dan RBAC diuji dengan akun sintetis; root landing publik statis serta batas public/protected diuji; tidak ada Supabase fallback CRM |
| G2 — alur inti | Sekolah/kontak/peluang, transition, timeline, tugas, conflict handling, audit; integration tests transaksi/izin |
| G3 — operasional | Dashboard/tabel/Kanban/laporan konsisten, import dry run dan rekonsiliasi, export aman, landing MKT-S13 dengan copy/asset ditinjau, UI responsive/keyboard |
| G4 — pilot | UAT tim dengan data disetujui; hasil 22 master snapshot atau delta terkini; backup/restore dan load test bersama Hermes |
| G5 — production | D-06/D-07 selesai, proxy/TLS/monitoring/rollback tersedia, cutover disetujui owner |
| G6 — P1 | Dokumen, inbound dan reminder masing-masing punya approval keamanan, QA dan scope tambahan |

Tidak ada estimasi minggu yang mengasumsikan jumlah developer atau jam kerja yang belum diketahui.

## 12. Traceability dan QA minimum

Kode QA berikut adalah spesifikasi uji penerimaan, **belum hasil pengujian aplikasi**. Penanggung jawab implementasi menurut domain, bukan penugasan orang fiktif.

| Requirement | Entitas / backend | Screen | Owner domain | QA dan expected result |
|---|---|---|---|---|
| MKT-FR-001 | auth user/session/account/verification, crm_members | MKT-S01,MKT-S10 | Identity | QA-001: login/logout/reset/disabled/last-admin aman |
| MKT-FR-002 | scoped repository/policy | MKT-S01–MKT-S12 | Access | QA-002: IDOR/filter/export/cached payload lintas owner ditolak |
| MKT-FR-003 | reference tables, pipeline_stages | MKT-S09 | Master | QA-003: inactive history readable, tidak selectable baru |
| MKT-FR-004 | schools | MKT-S02,MKT-S03 | Master | QA-004: warning duplikat tanpa bocor, create atomic |
| MKT-FR-005 | school_contacts | MKT-S03,MKT-S05 | Master | QA-005: primary tunggal, normalisasi dan invalid WA |
| MKT-FR-006 | opportunities, crm_members | MKT-S04,MKT-S05 | Sales | QA-006: null/0/calc/reassign/tasks/version konsisten |
| MKT-FR-007 | stage_history, transaction | MKT-S05,MKT-S06 | Sales | QA-007: seluruh transisi termasuk invalid/rollback/reopen |
| MKT-FR-008 | activities | MKT-S05 | Sales | QA-008: correction append-only; WA click tidak mencatat pesan |
| MKT-FR-009 | follow_up_tasks, activities | MKT-S05,MKT-S07 | Sales | QA-009: WIB boundary, tie-break, double-complete, cancel closing |
| MKT-FR-010 | scoped aggregate | MKT-S02 | Reporting | QA-010: fixture §8 cocok dan drill-down sama |
| MKT-FR-011 | scoped pagination/search | MKT-S03,MKT-S04,MKT-S06 | UI/Query | QA-011: URL restore, pagination stabil, keyboard/mobile stage |
| MKT-FR-012 | export/read aggregate | MKT-S08 | Reporting | QA-012: CSV formula/PII scope, date and denominator |
| MKT-FR-013 | import_batches, import_rows | MKT-S11 | Migration | QA-013: retry, orphan, unknown, rollback, 22-row reconciliation |
| MKT-FR-014 | audit_events, version | MKT-S05,MKT-S12 | Platform | QA-014: dua editor update satu versi → satu sukses, satu conflict |
| MKT-FR-015 | archived_at, transaction | MKT-S03,MKT-S05 | Sales | QA-015: arsip/restore tidak menghidupkan tugas atau menghapus histori |
| MKT-FR-016 | opportunity_documents | MKT-S05 | Files (P1) | QA-016: oversize/spoof/path traversal/access revoked |
| MKT-FR-017 | inbound_submissions | MKT-S11 | Integration (P1) | QA-017: replay request ID, malformed payload, manual review |
| MKT-FR-018 | reminder_deliveries | MKT-S07,MKT-S09 | Jobs (P1) | QA-018: lock, retry, dedupe, reassignment dan cancel sebelum kirim |
| MKT-FR-019 | Copy/aset resmi statis version-controlled, tanpa tabel/endpoint rekrutmen baru; batas auth server | MKT-S13,MKT-S01 (login sekunder akun undangan) | Public UI + Access | QA-019: audiens calon mitra/tim marketing, narasi peran/karya/relasi dan ketidakpastian eksplisit; CTA primer Lihat langkah bergabung → #gabung, login sekunder → /login; SVG resmi Open Peeps, tanpa preview dashboard/penjelasan fitur CRM/klaim tak bersumber/form/signup/lead intake; mobile/keyboard; tanpa PII pada HTML/RSC/JSON/metadata/aset, DB down tidak merusak konten statis, tanpa query DB/sesi; direct private URL/API/export/file tetap ditolak, public cache tidak berisi data sesi |
| MKT-FR-020 | marketing_users, crm_members | MKT-S14 | Identity & Team Management | QA-020: CRUD member marketing (create, read list, update, delete/deactivate), upload gambar profil/avatar (preview interaktif, validasi tipe JPG/PNG/WebP, max 2MB), reset password scrypt (min 8 karakter), proteksi relasi ownerId, otorisasi ADMIN only (MARKETER ditolak 403) |

| MKT-FR-021 | Profil publik member; header layanan tanpa model katalog/bundling lokal atau migration baru | MKT-S14 (landing `/tim/[slug]`, alias `/m/[slug]`) | Public member landing | QA-021: profil/header produk tetap tampil; selector grid, `#paket`, tautan paket, kartu/harga statis dan opsi bundling tidak ada; alias/404, workflow/FAQ, live preview WhatsApp dengan referral, anchor dan responsivitas tetap berfungsi; tanpa request API layanan |

Tambahan wajib QA: PostgreSQL down tidak menghasilkan sukses palsu; disk penuh/backup gagal menghasilkan alert; XSS di nama/catatan ditampilkan sebagai teks; CSV berawalan `=,+,-,@` dinetralisir; zip bomb ditolak; formula sumber terpetakan boleh dibaca tanpa dieksekusi dan hasil dihitung ulang dari operand; formula tak dikenal menjadi blocking issue import sampai ditinjau sesuai ERD; akses file tidak memakai URL public. Uji RPO/RTO bukan sekadar memastikan file backup ada.

## 13. Decision register — belum disetujui

| ID | Keputusan / usulan | Pemilik keputusan | Dampak dan gate |
|---|---|---|---|
| D-01 | Repo/runtime CRM terpisah vs modul; subdomain vs prefix; root landing berlaku dalam namespace CRM, tidak mengganti homepage existing; dokumen memakai route app-relative | Product + tech lead | Sebelum scaffold/routing G0 |
| D-02 | ADMIN/MANAGER/MARKETER, kontak sekolah dibagi antar-owner, export MARKETER own-only | Product + kepala marketing | Sebelum policy dan UAT G0 |
| D-03 | Harga = per siswa, satu layanan per peluang; periode wajib untuk Won baru; final value >0 | Product + kepala marketing | Sebelum schema dan form final G0 |
| D-04 | Import legacy Won tanpa tanggal/nilai ditandai unverified; periode unknown tetap null; mapping empat PIC ke akun | Kepala marketing + admin data | Sebelum commit migrasi G0/G4 |
| D-05 | UI Neo-Brutalisme operasional putih/hitam/pink, Geist; tidak menyalin shadow/off-white admin yang inkonsisten di dokumen existing | Product + design | Sebelum visual implementation G0 |
| D-06 | RAM upgrade aktual, resource Hermes, port proxy, domain/TLS dan batas beban | Pengelola VPS | Sebelum deployment G5 |
| D-07 | Retensi kontak/raw import/audit/dokumen, permintaan hapus PII, backup/RPO/RTO, kanal reset akses | Product + security/ops | Sebelum data riil/production G4/G5 |
| D-08 | Kanal reminder, otorisasi inbound, batas PDF 10 MiB dan biaya layanan eksternal | Product + tech lead | Sebelum P1 G6 |

Revisi pengguna menetapkan arah landing publik sebagai ajakan mengenal peran mitra/anggota tim marketing, bukan pengenalan dashboard CRM. Saluran aplikasi/kontak, skema kerja, seleksi dan syarat final belum ditentukan; jangan menganggap rekrutmen aktif atau menambah form/endpoint/tabel. Ini tidak otomatis menyetujui topology repo/domain D-01, keputusan Docker/deployment, kebijakan bisnis/akses lain, copy final atau mockup landing. Inbound MKT-FR-017 tetap P1 dan bukan fungsi landing P0.

Tidak adanya keputusan tidak menghentikan review dokumen, tetapi developer tidak boleh mengubah usulan tersebut menjadi kebijakan production tanpa sign-off.

## 14. Definition of Done dokumen dan produk

**Paket dokumen:** tiga dokumen saling tertaut, requirement/screen/entitas konsisten, null dan KPI terdefinisi, sumber dan usulan terpisah, keputusan terbuka punya gate. Mermaid adalah model desain, bukan bukti database terdeploy.

### Riwayat revisi

- **0.6, frontend admin preview lokal:** menambahkan kontrak namespace `/preview` yang opt-in melalui env (`MARKETING_ENABLE_ADMIN_PREVIEW=true`), data sintetis dan waktu demo tetap (16 Oktober 2026 WIB), state memori/reset, cakupan interaksi serta visual action-first. QA admin v0.6 terverifikasi lulus di `QA_ADMIN_FRONTEND.md`; tidak mengimplementasikan backend/auth/migration atau menggantikan spesifikasi produksi.

- **0.4, keputusan pengguna:** menetapkan Drizzle ORM + Drizzle Kit menggantikan ORM sebelumnya; PostgreSQL melalui `pg`, Better Auth melalui adapter Drizzle, migration SQL ditinjau dan diuji. Model bisnis dan batas publik/privat tetap; belum implementasi atau bukti uji runtime.

- **0.3, revisi eksplisit pengguna:** mengubah MKT-FR-019/MKT-S13/QA-019 dari pengenalan sistem menjadi landing publik persuasif untuk calon mitra/anggota tim marketing Satukelas Projects. Menghapus kewajiban preview dashboard dan penjelasan fitur/pipeline publik; mengganti CTA primer login dengan **Lihat langkah bergabung** → `#gabung`, login menjadi akses sekunder akun undangan. Menetapkan karakter SVG resmi Open Peeps repo, identitas putih/hitam/pink `#FD5392` dan Geist, batas klaim serta ketidakpastian proses bergabung. Memperbarui flow, traceability dan QA tanpa form/signup publik/lead intake/endpoint rekrutmen/tabel baru.
- **0.2 (historis, arah landing digantikan 0.3):** menambahkan permukaan landing publik statis, MKT-FR-019/MKT-S13 dan QA-019 dengan batas akses anonim. Konsep pengenalan CRM/preview/CTA primer login pada revisi itu tidak lagi menjadi kontrak landing.
- **Baseline CRM 0.1 dipertahankan:** KPI, migrasi legacy, hak akses internal, pemisahan payload privat, status P1, route app-relative, keputusan domain/deployment dan Docker yang tertunda tidak berubah. Pemeriksaan teks dokumen bukan bukti implementasi atau kelulusan QA aplikasi.

**Produk (belum dikerjakan):** migration dapat direproduksi; unit/integration/UI/security tests lulus; lint/typecheck/build lulus; dry run migrasi direkonsiliasi; akses real server diuji; desktop/mobile/keyboard diterima; tidak ada demo pada data riil; backup restore/load test/rollback terbukti. Persetujuan visual dan UAT pemilik tetap diperlukan.
