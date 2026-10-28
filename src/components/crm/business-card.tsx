"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CARD_DIMENSIONS, createCardQr, drawBusinessCard, getCardUrl, type CardProfile, type CardSide } from "@/lib/business-card";
import "./business-card.css";

export type { CardProfile } from "@/lib/business-card";

type Artwork = { profileKey: string; url: string; warning: string; error: string };

export function BusinessCard({ profile }: { profile: CardProfile }) {
  const labelId = useId();
  const frontRef = useRef<HTMLCanvasElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const printRef = useRef<HTMLIFrameElement | null>(null);
  const [side, setSide] = useState<CardSide>("front");
  const [attempt, setAttempt] = useState(0);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [operation, setOperation] = useState<"download" | "print" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState("");
  const profileKey = JSON.stringify(profile);
  const current = artwork?.profileKey === profileKey ? artwork : null;
  const ready = Boolean(current?.url && !current.error);

  useEffect(() => {
    let cancelled = false;
    let cancelAvatar: (() => void) | undefined;
    async function prepare() {
      let warning = "";
      try {
        const url = getCardUrl(profile, window.location.origin);
        const qr = createCardQr(url);
        let avatar: HTMLImageElement | undefined;
        if (profile.avatarUrl) {
          try {
            const source = new URL(profile.avatarUrl, window.location.origin);
            const rasterData = /^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(profile.avatarUrl);
            if (!rasterData && !["https:", "http:"].includes(source.protocol)) throw new Error("Format foto tidak didukung.");
            avatar = await new Promise<HTMLImageElement>((resolve, reject) => {
              const image = new Image();
              image.crossOrigin = "anonymous";
              const timer = window.setTimeout(() => fail(), 5000);
              const clear = () => { window.clearTimeout(timer); image.onload = null; image.onerror = null; };
              const fail = () => { clear(); reject(new Error("Foto tidak dapat dimuat.")); };
              cancelAvatar = () => { fail(); image.src = ""; };
              image.onload = () => { clear(); resolve(image); };
              image.onerror = fail;
              image.src = profile.avatarUrl!;
            });
          } catch {
            warning = "Foto tidak dapat dimuat. Kartu menggunakan inisial agar tetap bisa diunduh dan dicetak.";
          }
        }
        let logo: HTMLImageElement | undefined;
        try {
          logo = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error("Logo tidak dapat dimuat"));
            image.src = "/brand/satukelas-logo-tight.png";
          });
        } catch {
          logo = undefined;
        }
        await document.fonts?.ready;
        if (cancelled) return;
        if (!frontRef.current || !backRef.current) return;
        drawBusinessCard(frontRef.current, profile, "front", url, qr, avatar, logo);
        drawBusinessCard(backRef.current, profile, "back", url, qr, undefined, logo);
        // A CORS-restricted avatar must never leave a preview that cannot be exported.
        try { frontRef.current.toDataURL("image/png"); }
        catch {
          drawBusinessCard(frontRef.current, profile, "front", url, qr, undefined, logo);
          warning = "Foto tidak mengizinkan ekspor. Kartu menggunakan inisial.";
        }
        setArtwork({ profileKey, url, warning, error: "" });
      } catch (error) {
        if (!cancelled) setArtwork({ profileKey, url: "", warning: "", error: error instanceof Error ? error.message : "Kartu belum dapat dibuat. Coba lagi." });
      }
    }
    void prepare();
    return () => { cancelled = true; cancelAvatar?.(); };
  }, [profile, profileKey, attempt]);

  useEffect(() => () => { printRef.current?.remove(); }, []);

  function selectedCanvas() {
    const canvas = side === "front" ? frontRef.current : backRef.current;
    if (!canvas || !ready) throw new Error("Tunggu sampai kartu selesai disiapkan.");
    return canvas;
  }

  async function download() {
    setActionError("");
    setFeedback("");
    setOperation("download");
    try {
      const canvas = selectedCanvas();
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("PNG belum dapat dibuat. Coba lagi.")), "image/png"));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const name = profile.name.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "satukelas";
      anchor.href = url;
      anchor.download = `kartu-nama-${name}-${side === "front" ? "depan" : "belakang"}.png`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFeedback(`PNG sisi ${side === "front" ? "depan" : "belakang"} berhasil dibuat.`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "PNG belum dapat diunduh. Coba lagi.");
    } finally { setOperation(null); }
  }

  async function print() {
    setActionError("");
    setFeedback("");
    setOperation("print");
    try {
      const frontSrc = frontRef.current?.toDataURL("image/png");
      const backSrc = backRef.current?.toDataURL("image/png");
      if (!frontSrc || !backSrc) throw new Error("Kartu belum selesai disiapkan.");
      printRef.current?.remove();
      const frame = document.createElement("iframe");
      frame.className = "business-card-print-frame";
      frame.title = "Cetak kartu nama";
      frame.setAttribute("aria-hidden", "true");
      frame.tabIndex = -1;
      document.body.append(frame);
      printRef.current = frame;
      const doc = frame.contentDocument;
      const target = frame.contentWindow;
      if (!doc || !target) throw new Error("Jendela cetak tidak tersedia. Izinkan pencetakan pada browser.");
      doc.open();
      doc.write('<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Kartu nama Satukelas</title><style>@page{size:90mm 54mm;margin:0}html,body{margin:0;padding:0;background:#fff}img{display:block;width:90mm;height:54mm;max-width:none;page-break-after:always;break-after:page}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@media print{img{break-inside:avoid}}</style></head><body></body></html>');
      doc.close();
      const imageFront = doc.createElement("img");
      imageFront.alt = "Kartu nama sisi depan";
      imageFront.src = frontSrc;
      const imageBack = doc.createElement("img");
      imageBack.alt = "Kartu nama sisi belakang";
      imageBack.src = backSrc;
      doc.body.append(imageFront, imageBack);
      await Promise.all([imageFront.decode?.(), imageBack.decode?.()]);
      target.addEventListener("afterprint", () => { frame.remove(); if (printRef.current === frame) printRef.current = null; }, { once: true });
      target.focus();
      target.print();
      setFeedback("Dialog cetak dibuka. Pilih skala 100% dan nonaktifkan header serta footer.");
    } catch (error) {
      printRef.current?.remove();
      printRef.current = null;
      setActionError(error instanceof Error ? error.message : "Kartu belum dapat dicetak. Coba lagi.");
    } finally { setOperation(null); }
  }

  return (
    <section className="business-card" aria-labelledby={labelId}>
      <div className="business-card-heading">
        <h3 id={labelId}>Kartu nama</h3>
        <p>90 × 54 mm · PNG 300 dpi</p>
      </div>
      <div className="business-card-sides" role="tablist" aria-label="Pilih sisi kartu">
        <button
          type="button"
          role="tab"
          id={`${labelId}-tab-front`}
          aria-selected={side === "front"}
          aria-controls={`${labelId}-front`}
          tabIndex={side === "front" ? 0 : -1}
          onClick={() => { setSide("front"); setFeedback(""); }}
          onKeyDown={(e) => {
            if (e.key === "Home" || e.key === "ArrowLeft") {
              e.preventDefault();
              setSide("front");
              document.getElementById(`${labelId}-tab-front`)?.focus();
            } else if (e.key === "End" || e.key === "ArrowRight") {
              e.preventDefault();
              setSide("back");
              document.getElementById(`${labelId}-tab-back`)?.focus();
            }
          }}
        >
          Depan
        </button>
        <button
          type="button"
          role="tab"
          id={`${labelId}-tab-back`}
          aria-selected={side === "back"}
          aria-controls={`${labelId}-back`}
          tabIndex={side === "back" ? 0 : -1}
          onClick={() => { setSide("back"); setFeedback(""); }}
          onKeyDown={(e) => {
            if (e.key === "Home" || e.key === "ArrowLeft") {
              e.preventDefault();
              setSide("front");
              document.getElementById(`${labelId}-tab-front`)?.focus();
            } else if (e.key === "End" || e.key === "ArrowRight") {
              e.preventDefault();
              setSide("back");
              document.getElementById(`${labelId}-tab-back`)?.focus();
            }
          }}
        >
          Belakang
        </button>
      </div>
      <div className="business-card-stage" aria-busy={!current}>
        <div
          data-testid="business-card-front"
          id={`${labelId}-front`}
          role="tabpanel"
          aria-labelledby={`${labelId}-tab-front`}
          hidden={side !== "front" || !ready}
          style={{ display: side === "front" && ready ? "block" : "none" }}
        >
          <div className="business-card-canvas-box">
            <canvas
              ref={frontRef}
              role="img"
              aria-label="Sisi depan"
              aria-describedby={`${labelId}-identity`}
              width={CARD_DIMENSIONS.width}
              height={CARD_DIMENSIONS.height}
            >
              Kartu nama {profile.name}, {profile.email}.
            </canvas>
          </div>
          <div className="business-card-meta">
            <span className="business-card-meta-name">{profile.name}</span>
            <span className="business-card-meta-email">{profile.email}</span>
          </div>
        </div>
        <div
          data-testid="business-card-back"
          id={`${labelId}-back`}
          role="tabpanel"
          aria-labelledby={`${labelId}-tab-back`}
          hidden={side !== "back" || !ready}
          style={{ display: side === "back" && ready ? "block" : "none" }}
        >
          <div className="business-card-canvas-box">
            <canvas
              ref={backRef}
              role="img"
              aria-label="Sisi belakang"
              aria-describedby={`${labelId}-target`}
              width={CARD_DIMENSIONS.width}
              height={CARD_DIMENSIONS.height}
            >
              Kode QR profil {profile.name}.
            </canvas>
          </div>
        </div>
        {!ready && (
          <div className="business-card-placeholder">
            {current?.error ? "Kartu belum tersedia" : "Menyiapkan kartu…"}
          </div>
        )}
      </div>
      <p className="business-card-sr-only" id={`${labelId}-identity`}>
        {profile.name}. {profile.title || profile.role}. {profile.email}. {profile.phone || ""}. {profile.isActive === false ? "Anggota nonaktif." : ""}
      </p>
      {current?.error && (
        <div className="business-card-error" role="alert">
          <p>{current.error}</p>
          <button type="button" onClick={() => { setArtwork(null); setAttempt(value => value + 1); }}>Coba lagi</button>
        </div>
      )}
      {current?.warning && <p className="business-card-warning" role="status">{current.warning}</p>}
      {current?.url && (
        <p className="business-card-target" id={`${labelId}-target`}>
          Tujuan QR: <a href={current.url} target="_blank" rel="noopener noreferrer">{current.url}</a>
        </p>
      )}
      <div className="business-card-actions">
        <button type="button" disabled={!ready || Boolean(operation)} aria-busy={operation === "download"} onClick={() => void download()}>
          Unduh PNG
        </button>
        <button type="button" disabled={!ready || Boolean(operation)} aria-busy={operation === "print"} onClick={() => void print()}>
          Cetak kartu
        </button>
        {current?.url && (
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="business-card-cta-btn"
            aria-label={`Buka landing page ${profile.name}`}
          >
            Buka landing page ↗
          </a>
        )}
      </div>
      <p className="business-card-note">Unduh atau cetak sisi yang sedang ditampilkan. Untuk dua sisi, ulangi pada sisi lainnya. Cetak pada skala 100%.</p>
      <p className="business-card-feedback" role="status" aria-live="polite">{feedback}</p>
      {actionError && <p className="business-card-error" role="alert">{actionError}</p>}
    </section>
  );
}
