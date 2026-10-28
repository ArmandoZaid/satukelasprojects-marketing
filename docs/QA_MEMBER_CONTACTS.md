# QA — Kontak Member Marketing

## Lingkup

CRUD admin `/members` dan `/admin/members`: nomor telepon/WhatsApp, email akun berlabel Alamat Email Aktif, dan alamat tempat tinggal internal. Tidak ada migrasi database dan tidak ada pengiriman email verifikasi.

## Hasil verifikasi lokal

- `npm test`: 184/184 tes lulus (14 file).
- `npm run typecheck`: lulus.
- `npm run lint`: 0 error; 1 warning unused prop `member` pada `products-catalog.tsx`.
- `NEXT_BUILD_DIR=.next-contact-final npm run build`: berhasil.
- `NEXT_BUILD_DIR=.next-contact-final PLAYWRIGHT_BASE_URL=http://127.0.0.1:3104 npm run test:e2e`: 51/51 tes lulus.
- `git diff --check`: lulus.
- `graphify update .`: berhasil, 683 nodes dan 1460 edges.

## Kasus yang diuji

- Kolom tabel member disederhanakan: kolom nomor telepon dan alamat dihapus dari tabel utama; digantikan tombol CTA "Detail" pada setiap baris.
- Tombol CTA "Detail" membuka modal dialog "Detail Akun Member: [Nama]" dengan styling Neo-Brutalism lengkap (avatar profil/fallback, nama, tag role & status akun, ID pengguna, email aktif, nomor telepon/WhatsApp + tombol Chat WA, alamat tempat tinggal internal, status, prospek dikelola, tanggal terdaftar).
- Aksi pintas di modal detail: Edit Akun, Reset Password, Kartu Nama, Landing Page, dan Tutup.
- Form tambah/edit tetap menyimpan nomor telepon dan alamat tempat tinggal (multiline).
- Pengosongan telepon/alamat menampilkan fallback "Belum diisi" di modal detail akun.
- HTML publik `/tim/[id]` dan `/m/[id]` terbukti tidak memuat alamat tempat tinggal atau data sensitif lainnya.
- Form responsive pada viewport 375px dan 768px, modal dialog mendukung scrolling mandiri tanpa terpotong.
- Review visual `vision_analyze` memverifikasi dialog detail akun rapi, kontras tajam, teks terbaca jelas, dan tombol aksi terstruktur.

Screenshot di `test-results/member-detail-modal-desktop.png`, `test-results/member-contact-desktop.png`, `member-contact-form-375.png`, dan `member-contact-form-768.png`.

## Batasan yang tetap berlaku

Registry member masih in-memory, hilang saat server restart dan tidak dibagi antar-instance. Jangan memakai data pribadi asli sebelum penyimpanan produksi tersedia. Label email aktif adalah petunjuk pengisian, bukan bukti verifikasi kotak masuk. Preview lokal berjalan terpisah dari hosting; tidak ada deploy remote pada perubahan ini.
