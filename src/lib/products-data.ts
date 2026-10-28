export interface SatukelasProduct {
  id: string;
  pillar: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  features: string[];
  specs: { label: string; value: string }[];
  highlight: string;
  startingPrice: string;
}

export interface ProductPackage {
  id: string;
  name: string;
  badge?: string;
  badgeColor?: string;
  popular?: boolean;
  tagline: string;
  target: string;
  priceEstimate: string;
  features: string[];
}

export interface WorkflowStep {
  step: string;
  title: string;
  description: string;
  detail: string;
}

export const SATUKELAS_PRODUCTS: SatukelasProduct[] = [
  {
    id: "bts-ar",
    pillar: "PILAR 01 — UNGGULAN",
    tag: "FITUR AR TERBARU",
    title: "Buku Tahunan Sekolah (BTS) AR",
    subtitle: "Inovasi foto fisik bisa bergerak saat di-scan kamera smartphone!",
    description:
      "Buku tahunan fisik mewah dengan teknologi Augmented Reality interaktif. Siswa dan guru cukup mengarahkan kamera HP ke foto di halaman buku untuk langsung memutar video pesan kenangan, tawa kelas, dan pesan hangat tanpa perlu menginstal aplikasi rumit.",
    accentColor: "#FD5392",
    badgeBg: "#FD5392",
    features: [
      "Teknologi Scan AR Web/Appless — foto fisik langsung bergerak memutar video",
      "Hardcover tebal kokoh dengan laminasi doff / glossy & hot print foil emas/perak",
      "Jilid jahit benang + lem panas khusus (anti rontok / lepas seumur hidup)",
      "Bebas tentukan konsep foto tematik (vintage, editorial studio, cyberpunk, street style)",
      "Bonus buku kenangan khusus guru pembina & box packaging eksklusif",
    ],
    specs: [
      { label: "Bahan Kertas", value: "Art Paper 150 - 210 gsm / Matte Paper Premium" },
      { label: "Cover", value: "Hardcover Greyboard No. 30 / 40 + Finishing Laminasi" },
      { label: "Binding", value: "Jahit Benang Kokoh + Square Spine Binding" },
      { label: "Fitur Khusus", value: "Augmented Reality Video Trigger + QR Cloud Vault" },
    ],
    highlight: "Foto kenangan angkatanmu tidak lagi diam di lemari, tapi hidup kembali kapan saja!",
    startingPrice: "Mulai Rp 185.000 / siswa",
  },
  {
    id: "video-profile",
    pillar: "PILAR 02 — INSTITUSI",
    tag: "PPDB & AKREDITASI",
    title: "Video Profile Sekolah Sinematik",
    subtitle: "Produksi 4K UHD + Drone Aerial untuk akreditasi & promosi PPDB",
    description:
      "Video representasi institusi sekolah berstandar sinema komersial. Mengangkat keunggulan fasilitas, budaya belajar, prestasi siswa, dan visi kepemimpinan sekolah untuk menarik calon murid baru dan memenuhi standar nilai akreditasi unggul.",
    accentColor: "#4150B1",
    badgeBg: "#4150B1",
    features: [
      "Pengambilan gambar sinema 4K UHD + Drone Aerial berizin resmi",
      "Penyusunan naskah kreatif (scriptwriting) & storyboard berorientasi branding",
      "Voice Over narasi profesional dua bahasa (Indonesia & English)",
      "Pewarnaan sinematik (Color Grading) & komposisi audio sound design dinamis",
      "Format siap tayang multi-platform (YouTube 16:9, Reels/TikTok 9:16)",
    ],
    specs: [
      { label: "Resolusi", value: "4K UHD 3840x2160 60fps Sinema" },
      { label: "Audio", value: "Voice Over Studio + Lisensi Musik Komersial" },
      { label: "Peralatan", value: "Cinema Camera, Gimbal Stabilizer, Drone 4K" },
      { label: "Deliverables", value: "Master Full Version (3-5 Menit) + Teaser PPDB (60s)" },
    ],
    highlight: "Menjadikan sekolahmu pilihan utama orang tua dan calon murid baru.",
    startingPrice: "Mulai Rp 5.500.000 / proyek",
  },
  {
    id: "wisuda-event",
    pillar: "PILAR 03 — DOKUMENTASI",
    tag: "LIVE EVENT & WISUDA",
    title: "Dokumentasi Wisuda & Live Streaming",
    subtitle: "Pelepasan siswa khidmat dengan siaran langsung multi-kamera Full HD",
    description:
      "Layanan liputan hari kelulusan dan pelepasan siswa terlengkap. Siaran langsung multi-kamera terhubung ke YouTube secara stabil sehingga wali murid dan kerabat yang berhalangan hadir tetap dapat menyaksikan momen sakral purna widya.",
    accentColor: "#F6BF75",
    badgeBg: "#F6BF75",
    features: [
      "Setup 3 - 4 kamera sinema dengan video switcher broadcast live",
      "Live streaming Full HD 1080p 60fps dengan nama & gelar wisudawan on-screen",
      "Mini photo-booth studio on-site untuk foto wisudawan bareng orang tua",
      "Penyuntingan video highlight seremonial berdurasi 1 menit untuk media sosial",
      "Akses download cepat master video & foto via cloud drive",
    ],
    specs: [
      { label: "Kamera", value: "3-4 Unit Kamera Full Frame + Telephoto Lens" },
      { label: "Streaming", value: "Encoder Hardware + Dedicated Backup Internet" },
      { label: "Grafis", value: "Custom Lower-Third, Bumper In/Out, Running Text" },
      { label: "Output", value: "Arsip Rekaman Full YouTube + Master Cloud Link" },
    ],
    highlight: "Momen pelepasan sekali seumur hidup terdokumentasi tanpa cela.",
    startingPrice: "Mulai Rp 4.200.000 / event",
  },
  {
    id: "merchandise",
    pillar: "PILAR 04 — IDENTITAS",
    tag: "MERCHANDISE & ATTRIBUTE",
    title: "Merchandise & Identitas Angkatan",
    subtitle: "Atribut eksklusif lambang kebersamaan satu almamater",
    description:
      "Merchandise kelas dan angkatan berkualitas retail garment. Dibuat dari material katun dan fleece premium dengan teknik bordir komputer presisi untuk menjaga kekompakan dan kebanggaan angkatan.",
    accentColor: "#8766AC",
    badgeBg: "#8766AC",
    features: [
      "Jaket Varsity angkatan dengan leather sleeve sintetis & bordir tebal",
      "Hoodie & Crewneck Cotton Fleece 280-330 gsm nyaman dipakai harian",
      "Kotak kemasan (Packaging Box) eksklusif custom grafir logo angkatan",
      "Lanyard sablon doff / sublim + kartu tanda pengenal angkatan",
      "Stiker pack vinyl tahan air & tote bag canvas tebal",
    ],
    specs: [
      { label: "Bahan Jaket", value: "Cotton Fleece 300 gsm / Baby Terry / Taslan" },
      { label: "Bordir/Sablon", value: "Bordir Komputer Presisi / Sablon Plastisol Awet" },
      { label: "Minimal Order", value: "Mulai 30 pcs per angkatan/kelas" },
      { label: "Packaging", value: "Plastik Zipper Bag / Hardbox Sablon Eksklusif" },
    ],
    highlight: "Tampil kompak dan bangga dengan atribut resmi angkatanmu.",
    startingPrice: "Mulai Rp 85.000 / pcs",
  },
];

export const SATUKELAS_PACKAGES: ProductPackage[] = [
  {
    id: "pkg-starter",
    name: "Paket Starter (Essential)",
    tagline: "Pilihan esensial untuk angkatan yang mengutamakan kualitas cetak rapi & awet.",
    target: "Cocok untuk kelas / angkatan dengan anggaran terukur",
    priceEstimate: "Rp 185.000 - Rp 230.000 / siswa",
    features: [
      "Buku Tahunan Fisik Hardcover Laminasi Doff/Glossy",
      "Jilid Jahit Benang Kuat (Anti Rontok)",
      "1x Sesi Foto Konsep di Lingkungan Sekolah / Studio",
      "Pengarahan Gaya oleh Fotografer Satukelas",
      "Master File Foto High-Resolution di Cloud Drive",
      "Bonus 2 Buku Kenangan untuk Sekolah & Perpustakaan",
    ],
  },
  {
    id: "pkg-popular",
    name: "Paket Populer (BTS AR + Teaser)",
    badge: "Paling Banyak Dipilih OSIS",
    badgeColor: "#FD5392",
    popular: true,
    tagline: "Paket favorit terlengkap dengan pengalaman AR interaktif dan video teaser sinematik.",
    target: "Pilihan utama panitia buku tahunan sekolah kekinian",
    priceEstimate: "Rp 235.000 - Rp 295.000 / siswa",
    features: [
      "Seluruh fitur Paket Starter",
      "Teknologi Scan AR Interaktif (Foto Cetak Bergerak di Layar HP)",
      "2x Sesi Foto Konsep (1x Sekolah + 1x Outdoor / Lokasi Pilihan)",
      "Video Teaser Sinematik Angkatan Berdurasi 60-90 Detik",
      "Video Dokumentasi Behind The Scenes (BTS) Proses Pembuatan",
      "Kemasan Box Eksklusif per Siswa dengan Grafir Logo Angkatan",
      "Free Buku Kenangan untuk Seluruh Wali Kelas & Guru",
    ],
  },
  {
    id: "pkg-all-in-one",
    name: "Paket All-in-One Sultan",
    badge: "Solusi Lengkap Angkatan & Sekolah",
    badgeColor: "#F6BF75",
    tagline: "Paket pamungkas: Buku AR, Video Profil Sekolah 4K, dan Live Streaming Wisuda.",
    target: "Rekomendasi kolaborasi terpadu OSIS & Pihak Yayasan/Sekolah",
    priceEstimate: "Custom Paket Terintegrasi",
    features: [
      "Seluruh fitur Paket Populer (BTS AR Lengkap + Box Eksklusif)",
      "Produksi Video Profile Sekolah Sinematik 4K UHD + Drone Aerial",
      "Dokumentasi Wisuda & Multi-Camera Live Streaming YouTube",
      "Paket Merchandise Lengkap (Varsity / Hoodie Angkatan)",
      "Prioritas Jadwal Cetak & Garansi Serah Terima H-14 Sebelum Wisuda",
      "Pendampingan PIC Khusus Satukelas dari Awal hingga Wisuda Usai",
    ],
  },
];

export const SATUKELAS_WORKFLOW: WorkflowStep[] = [
  {
    step: "01",
    title: "Ngobrol Santai & Konsultasi",
    description: "Hubungi PIC marketing Satukelas kami untuk curhat konsep dan anggaran angkatanmu.",
    detail: "Bisa chat via WhatsApp atau video call singkat, kami bantu petakan kebutuhan tanpa komitmen.",
  },
  {
    step: "02",
    title: "Bawakan Sampel Fisik ke Sekolah",
    description: "Tim marketing kami datang langsung ke sekolahmu membawa buku-buku fisik asli.",
    detail: "Panitia & guru bisa memegang langsung ketebalan cover, kualitas jilid jahit benang, dan mencoba scan fitur AR.",
  },
  {
    step: "03",
    title: "Sesi Foto Seru & Terarah",
    description: "Fotografer & tim kreatif Satukelas mengarahkan gaya dengan santai dan menyenangkan.",
    detail: "Bebas eksplorasi gaya, pose, dan busana sesuai konsep yang sudah disepakati bareng panitia.",
  },
  {
    step: "04",
    title: "Proofing & Revisi Online",
    description: "Panitia memeriksa preview layout dan isi buku secara digital sebelum naik cetak.",
    detail: "Koreksi nama, gelar, dan tata letak dilakukan bersama secara transparan untuk meminimalisir kesalahan cetak.",
  },
  {
    step: "05",
    title: "Cetak Rapi & Tepat Waktu",
    description: "Buku dicetak di percetakan berstandar industri dengan jaminan serah terima tepat waktu.",
    detail: "Buku sampai di sekolahmu dalam kondisi rapi ber-box sebelum prosesi wisuda/pelepasan dimulai.",
  },
];

export const SATUKELAS_FAQS = [
  {
    q: "Berapa minimal jumlah pesanan untuk Buku Tahunan Satukelas?",
    a: "Minimal pesanan biasanya mulai dari 50 siswa (atau 1 angkatan). Untuk jumlah di bawah 50 siswa tetap bisa dikonsultasikan langsung ke PIC marketing kami untuk skema harga terbaik.",
  },
  {
    q: "Bagaimana cara kerja fitur AR (Augmented Reality) pada buku tahunan?",
    a: "Sangat mudah! Pengguna cukup membuka kamera ponsel atau browser web khusus Satukelas lalu mengarahkan kamera ke foto yang memiliki tanda AR. Foto fisik tersebut akan langsung memutar video pesan kenangan bersuara.",
  },
  {
    q: "Apakah Satukelas bisa melayani sekolah di luar kota Surabaya?",
    a: "Tentu! Satukelas Projects melayani sekolah-sekolah di seluruh wilayah Jawa Timur, Jawa Tengah, Jawa Barat, hingga luar pulau Jawa. Tim fotografer kami siap berangkat ke sekolahmu.",
  },
  {
    q: "Berapa lama estimasi pengerjaan dari sesi foto sampai buku selesai dicetak?",
    a: "Rata-rata pengerjaan berkisar antara 2 hingga 3 bulan tergantung kelengkapan data siswa dan kecepatan sesi foto. Kami memiliki komitmen garansi buku selesai tepat waktu sebelum wisuda.",
  },
];
