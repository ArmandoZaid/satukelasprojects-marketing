import Image from "next/image";
import { PublicHeader, PublicFooter, Arrow } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { marketingChatUrl, marketingContact } from "@/lib/marketing-config";

export function MarketingLanding() {
  return <>
    <PublicHeader />
<main id="konten" tabIndex={-1}>
  <section className="hero" aria-labelledby="hero-title">
    <div className="wrap hero-grid">
      <div className="hero-col-left">
        <div className="hero-tag">Kemitraan Kreatif · Satukelas</div>
        <h1 id="hero-title">Buka relasi.<br />Bawa <span className="underlined">cerita baru.</span></h1>
        <div className="hero-people" aria-hidden="true">
          <Image className="person-welcome" src="/images/characters/06-open-gesture.svg" width={285} height={276} alt="" priority />
          <Image className="person-present" src="/images/characters/04-presenting.svg" width={230} height={271} alt="" priority />
        </div>
      </div>
      <div className="hero-col-right">
        <div className="hero-card">
          <div className="hero-card-head">
            <span className="hero-card-tag">Ajakan Kolaborasi</span>
            <span className="hero-card-status">Mitra Tim</span>
          </div>
          <p className="hero-lead">Jadi mitra marketing <br />Satukelas Projects.</p>
          <p className="hero-card-desc">Perluas relasimu dengan sekolah dan ambil peran dalam proyek kreatif. Jadilah penghubung kebutuhan mereka dengan karya buku tahunan, video profil, dan dokumentasi Satukelas.</p>
          <ul className="hero-points" aria-label="Sorotan peran mitra">
            <li><span className="point-check" aria-hidden="true">✓</span><span>Buka relasi hangat dengan sekolah &amp; panitia angkatan</span></li>
            <li><span className="point-check" aria-hidden="true">✓</span><span>Kenalkan karya buku tahunan dan dokumentasi visual</span></li>
            <li><span className="point-check" aria-hidden="true">✓</span><span>Kolaborasi langsung bersama tim produksi kreatif</span></li>
          </ul>
          <div className="hero-actions">
            <Button asChild><a href={marketingChatUrl} target="_blank" rel="noopener noreferrer">
              Gas Mulai Bareng Kami
              <Arrow />
            </a></Button>
            <a className="text-link" href="#alur">Pelajari alur kemitraan <Arrow /></a>
          </div>
          <div className="hero-card-note">
            <span>Mulai percakapan lewat chat · Akses akun tim khusus internal</span>
          </div>
        </div>
      </div>
    </div>
  </section>
  <div className="mission-line">
    <div className="wrap">
      <p className="mission-title">Relasi yang baik adalah awal cerita yang berarti.</p>
      <span className="mission-sub">Bersama Satukelas Projects</span>
    </div>
  </div>
  <section id="peran" className="section role-section" aria-labelledby="role-title">
    <div className="wrap">
      <div className="section-head role-head">
        <div>
          <span className="section-tag">Peran &amp; Kolaborasi</span>
          <h2 id="role-title">Bukan sekadar<br />mengenalkan jasa.</h2>
        </div>
        <p className="section-lead">Kamu bisa jadi orang pertama yang membuka percakapan. Bantu sekolah menemukan cara untuk merayakan cerita angkatannya.</p>
      </div>
      <div className="role-grid">
        <article className="role-card">
          <div className="card-meta"><span>PILAR 01</span><span className="meta-dot"></span></div>
          <h3>Mulai dari kenalan.</h3>
          <p>Bangun hubungan dengan pihak sekolah dan panitia. Temukan siapa yang tepat untuk diajak berbicara.</p>
          <div className="card-tag">Buka Relasi</div>
        </article>
        <article className="role-card">
          <div className="card-meta"><span>PILAR 02</span><span className="meta-dot"></span></div>
          <h3>Dengarkan kebutuhannya.</h3>
          <p>Setiap angkatan punya cerita berbeda. Pahami rencana, harapan, dan momen yang ingin mereka simpan.</p>
          <div className="card-tag">Dengar Cerita</div>
        </article>
        <article className="role-card">
          <div className="card-meta"><span>PILAR 03</span><span className="meta-dot"></span></div>
          <h3>Hubungkan dengan karya.</h3>
          <p>Kenalkan buku tahunan, video profil, dan dokumentasi wisuda Satukelas yang relevan dengan kebutuhan mereka.</p>
          <div className="card-tag">Solusi Kreatif</div>
        </article>
      </div>
    </div>
  </section>
  <section className="collaboration" aria-labelledby="collaboration-title">
    <div className="wrap collaboration-grid">
      <div className="collaboration-art">
        <Image src="/images/characters/production-editor.svg" width={240} height={324} loading="lazy" alt="" />
        <p>Relasi bertemu kreativitas.</p>
      </div>
      <div className="collaboration-copy">
        <span className="section-tag light-tag">Sinergi Tim</span>
        <h2 id="collaboration-title">Kamu buka percakapannya.<br />Kita bahas kemungkinannya.</h2>
        <p>Tak perlu memulai dengan bahasa penjualan yang rumit. Mulai dari rasa ingin tahu tentang sekolah, lalu bawa kebutuhan mereka ke percakapan bersama tim Satukelas.</p>
        <p className="collaboration-close">Ada karya yang bisa dikenalkan.<br />Ada cerita sekolah yang layak didengarkan.</p>
        <a className="text-link light-link" href="#cocok">Bayangkan peranmu di sini <Arrow /></a>
      </div>
    </div>
  </section>
  <section id="cocok" className="section fit-section" aria-labelledby="fit-title">
    <div className="wrap fit-grid">
      <div className="fit-left">
        <span className="section-tag">Refleksi Kesiapan</span>
        <h2 id="fit-title">Suka kenalan?<br />Peduli sama<br />cerita orang?</h2>
        <div className="fit-char-box">
          <Image src="/images/characters/01-raise-hand.svg" width={280} height={273} loading="lazy" alt="" />
          <div className="char-caption">Refleksi Sikap &amp; Nilai</div>
        </div>
      </div>
      <div className="fit-content">
        <p className="intro-large">Bisa jadi ini ruang kolaborasimu.</p>
        <p className="fit-sub">Kenali sikap yang penting dalam membangun relasi dengan sekolah. Ini gambaran peran, bukan syarat seleksi final.</p>
        <ul className="fit-list">
          <li>
            <div className="fit-text">
              <strong>Nyaman membuka percakapan.</strong>
              <span>Berani menyapa dan tetap menghargai waktu lawan bicara.</span>
            </div>
          </li>
          <li>
            <div className="fit-text">
              <strong>Mau mendengarkan lebih dulu.</strong>
              <span>Memahami kebutuhan, bukan langsung menawarkan semua hal.</span>
            </div>
          </li>
          <li>
            <div className="fit-text">
              <strong>Bisa menjaga komunikasi.</strong>
              <span>Jelas saat menyampaikan informasi dan konsisten menindaklanjuti.</span>
            </div>
          </li>
          <li>
            <div className="fit-text">
              <strong>Terbuka untuk kerja bareng.</strong>
              <span>Menghubungkan informasi dari sekolah dengan tim Satukelas.</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
  <section id="alur" className="section steps-section" aria-labelledby="steps-title">
    <div className="wrap">
      <div className="steps-head">
        <div>
          <span className="section-tag">Tahapan Awal</span>
          <h2 id="steps-title">Mulai dari saling kenal.</h2>
        </div>
        <p className="steps-lead">Gambaran langkah penjajakan mitra. Rincian proses akan dikonfirmasi oleh tim Satukelas.</p>
      </div>
      <ol className="steps">
        <li className="step-card">
          <div className="step-meta">
            <span className="step-number" aria-hidden="true">01</span>
            <span className="step-label">LANGKAH 1</span>
          </div>
          <h3>Kenali perannya</h3>
          <p>Pahami karya Satukelas dan cara membuka obrolan santai bersama pihak sekolah.</p>
          <ul className="step-points">
            <li>Eksplorasi buku tahunan &amp; video profil</li>
            <li>Identifikasi sekolah potensial di sekitarmu</li>
          </ul>
          <div className="step-footer">Tahap Eksplorasi</div>
        </li>
        <li className="step-card">
          <div className="step-meta">
            <span className="step-number" aria-hidden="true">02</span>
            <span className="step-label">LANGKAH 2</span>
          </div>
          <h3>Ceritakan dirimu</h3>
          <p>Siapkan latar belakang komunikasi, lingkungan sekolah yang kamu kenal, dan motivasimu.</p>
          <ul className="step-points">
            <li>Cerita pengalaman jejaring &amp; relasi</li>
            <li>Pemahaman kultur sekolah setempat</li>
          </ul>
          <div className="step-footer">Tahap Persiapan</div>
        </li>
        <li className="step-card">
          <div className="step-meta">
            <span className="step-number" aria-hidden="true">03</span>
            <span className="step-label">LANGKAH 3</span>
          </div>
          <h3>Bahas kecocokannya</h3>
          <p>Diskusikan bentuk kolaborasi lapangan, ritme kerja, dan dukungan materi dari tim inti.</p>
          <ul className="step-points">
            <li>Diskusi santai dua arah bersama tim</li>
            <li>Penyelarasan peran dan ekspektasi</li>
          </ul>
          <div className="step-footer">Tahap Penyelarasan</div>
        </li>
      </ol>
    </div>
  </section>
  <section id="faq" className="section faq-section" aria-labelledby="faq-title">
    <div className="wrap faq-grid">
      <div className="faq-left">
        <span className="section-tag">Tanya Jawab</span>
        <h2 id="faq-title">Sebelum<br />melangkah.</h2>
        <p className="faq-desc">Hal-hal mendasar seputar inisiatif kemitraan marketing bersama tim Satukelas Projects.</p>
      </div>
      <div className="faqs">
        <details>
          <summary>Ini ajakan menjadi mitra atau penawaran buku tahunan?</summary>
          <p>Halaman ini ditujukan untuk calon mitra atau anggota tim marketing Satukelas Projects, bukan formulir pemesanan dari sekolah.</p>
        </details>
        <details>
          <summary>Harus sudah punya pengalaman marketing?</summary>
          <p>Persyaratan pengalaman belum ditetapkan. Sikap pada bagian “Cocok buatmu?” adalah gambaran peran, bukan pengumuman kriteria seleksi.</p>
        </details>
        <details>
          <summary>Bagaimana skema kerja sama dan imbalannya?</summary>
          <p>Skema kerja, tanggung jawab, dan imbalan perlu dikonfirmasi langsung dengan tim. Halaman ini tidak menjanjikan komisi atau penghasilan tertentu.</p>
        </details>
        <details>
          <summary>Apa saja karya Satukelas yang bisa dikenalkan ke sekolah?</summary>
          <p>Karya utama mencakup buku tahunan cetak berkonsep personal, video dokumenter &amp; cinematic angkatan, serta dokumentasi wisuda sekolah.</p>
        </details>
        <details>
          <summary>Bagaimana cara bergabung sebagai mitra marketing?</summary>
          <p>Tinggal klik tombol <strong>&ldquo;Gas Mulai Bareng Kami&rdquo;</strong> untuk langsung terhubung dan mengobrol santai bareng tim Satukelas Projects. Kita diskusiin kecocokan peran dan langkah awalnya tanpa form panjang yang ribet.</p>
        </details>
        <div className="faq-footer-note">
          <p><strong>Pertanyaan lain?</strong> Diskusi detail seputar skema dan aktivitas lapangan akan dibahas langsung saat proses saling kenal bersama tim.</p>
        </div>
      </div>
    </div>
  </section>
  <section id="gabung" className="join-section" aria-labelledby="join-title">
    <div className="wrap join-grid">
      <div className="join-main">
        <span className="join-tag">Pendaftaran Mitra</span>
        <h2 id="join-title">Cerita berikutnya<br />bisa dimulai<br />dari kamu.</h2>
        <p>Ingin jadi penghubung antara sekolah dan karya visual Satukelas? Yuk langsung ngobrol santai bareng tim kami untuk kenalan dan mulai ambil peran.</p>
        <div className="join-actions">
          <Button asChild><a href={marketingChatUrl} target="_blank" rel="noopener noreferrer">
            Gas Bikin Cerita Bareng
            <Arrow />
          </a></Button>
          <a className="text-link" href="#alur">Pelajari kembali alurnya <Arrow /></a>
        </div>
      </div>
      <aside className="review-note" aria-labelledby="note-title">
        <div className="note-pill">KONTUR PENDAFTARAN</div>
        <h3 id="note-title">Informasi Pendaftaran</h3>
        <p>Minat bergabung dibahas lewat percakapan dengan tim Satukelas Projects. Rincian proses dan ketentuannya dikonfirmasi langsung saat saling kenal.</p>
        <p className="note-highlight"><strong>Preview lokal.</strong> Nomor dari mockup ({marketingContact.displayNumber}) belum diverifikasi kepemilikannya. Konfirmasi ke pengelola sebelum mengirim pesan.</p>
      </aside>
    </div>
  </section>
</main>
    <PublicFooter />
  </>;
}
