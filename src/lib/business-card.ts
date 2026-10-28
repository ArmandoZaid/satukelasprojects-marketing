import QRCode from "qrcode";

export const CARD_DIMENSIONS = { widthMm: 90, heightMm: 54, dpi: 300, width: 1063, height: 638 } as const;

export interface CardProfile {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "MARKETER";
  phone?: string;
  title?: string;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export type CardSide = "front" | "back";

export function getCardUrl(profile: Pick<CardProfile, "id" | "role">, origin: string): string {
  const address = new URL(origin);
  if (address.protocol !== "http:" && address.protocol !== "https:") {
    throw new Error("Alamat situs harus menggunakan HTTP atau HTTPS.");
  }
  if (profile.role === "MARKETER" && !profile.id.trim()) {
    throw new Error("ID anggota diperlukan untuk kartu marketing.");
  }
  const base = address.origin;
  return profile.role === "MARKETER" ? `${base}/tim/${encodeURIComponent(profile.id)}` : `${base}/`;
}

export function createCardQr(url: string) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  return { size: qr.modules.size, modules: qr.modules.data, quietZone: 4 };
}

/** One raster source for the screen, downloaded PNG, and physical print. */
export function drawBusinessCard(
  canvas: HTMLCanvasElement,
  profile: CardProfile,
  side: CardSide,
  url: string,
  qr: ReturnType<typeof createCardQr>,
  avatar?: CanvasImageSource,
  logo?: CanvasImageSource,
): void {
  canvas.width = CARD_DIMENSIONS.width;
  canvas.height = CARD_DIMENSIONS.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser ini tidak mendukung gambar kartu. Gunakan browser terbaru.");
  const ink = "#1A1D20", paper = "#FFFDF9", white = "#FFFFFF", pink = "#FD5392", blue = "#4150B1";
  const role = { ADMIN: "Administrator", MANAGER: "Manajer marketing", MARKETER: "Mitra marketing" }[profile.role];
  const family = 'Arial, sans-serif';

  function box(x: number, y: number, width: number, height: number, color: string, border = 0) {
    ctx!.fillStyle = color;
    ctx!.fillRect(x, y, width, height);
    if (border) {
      ctx!.strokeStyle = ink;
      ctx!.lineWidth = border;
      ctx!.strokeRect(x, y, width, height);
    }
  }

  function text(value: string, x: number, y: number, size: number, weight = 700, color = ink) {
    ctx!.font = `${weight} ${size}px ${family}`;
    ctx!.fillStyle = color;
    ctx!.fillText(value, x, y);
  }

  function fitted(value: string, x: number, y: number, width: number, height: number, maxSize: number, minSize: number, weight = 700, color = ink) {
    const clean = value.replace(/\s+/g, " ").trim();
    const smallestSize = Math.min(minSize, 12);
    let size = maxSize;
    let lines: string[] = [];
    for (; size >= smallestSize; size -= 1) {
      ctx!.font = `${weight} ${size}px ${family}`;
      lines = [""];
      for (const word of clean.split(" ")) {
        const last = lines.length - 1;
        const candidate = lines[last] ? `${lines[last]} ${word}` : word;
        if (ctx!.measureText(candidate).width <= width) {
          lines[last] = candidate;
        } else if (ctx!.measureText(word).width <= width) {
          if (lines[last]) lines.push(word);
          else lines[last] = word;
        } else {
          if (lines[last]) lines.push("");
          for (const character of Array.from(word)) {
            const index = lines.length - 1;
            if (ctx!.measureText(lines[index] + character).width > width && lines[index]) lines.push(character);
            else lines[index] += character;
          }
        }
      }
      if (lines.length * size * 1.15 <= height) break;
    }
    size = Math.max(smallestSize, size);
    const limit = Math.max(1, Math.floor(height / (size * 1.15)));
    if (lines.length > limit) {
      lines = lines.slice(0, limit);
      let last = lines[limit - 1];
      ctx!.font = `${weight} ${size}px ${family}`;
      while (last && ctx!.measureText(last + "…").width > width) last = last.slice(0, -1);
      lines[limit - 1] = last + "…";
    }
    ctx!.save();
    ctx!.beginPath();
    ctx!.rect(x, y - size, width, height + size);
    ctx!.clip();
    lines.forEach((line, index) => text(line, x, y + index * size * 1.15, size, weight, color));
    ctx!.restore();
  }

  box(0, 0, canvas.width, canvas.height, paper);
  box(4, 4, canvas.width - 8, canvas.height - 8, paper, 8);
  box(8, 8, canvas.width - 16, 108, paper);
  if (logo) {
    const image = logo as HTMLImageElement;
    const sourceWidth = image.naturalWidth || image.width || 825;
    const sourceHeight = image.naturalHeight || image.height || 473;
    const targetH = 74;
    const targetW = Math.round((sourceWidth * targetH) / sourceHeight);
    ctx!.drawImage(logo, 48, 22, targetW, targetH);
    const badgeX = 48 + targetW + 18;
    box(badgeX + 3, 38 + 3, 134, 38, ink);
    box(badgeX, 38, 134, 38, pink);
    box(badgeX, 38, 134, 38, "transparent", 2);
    text("PROJECTS", badgeX + 16, 64, 18, 900, ink);
  } else {
    text("satukelas", 48, 77, 50, 900, ink);
    const brandW = ctx!.measureText("satukelas").width;
    const projX = Math.max(333, 48 + brandW + 16);
    text("Projects", projX, 76, 26, 700, ink);
  }
  box(8, 112, canvas.width - 16, 6, ink);

  if (side === "front") {
    box(816, 36, 195, 48, ink);
    box(812, 34, 195, 48, blue, 3);
    fitted(role, 824, 65, 175, 24, 18, 14, 800, white);
    box(58, 166, 188, 188, ink);
    box(50, 158, 188, 188, pink, 4);
    if (avatar) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(54, 162, 180, 180);
      ctx.clip();
      const image = avatar as HTMLImageElement;
      const sourceWidth = image.naturalWidth || image.width || 180;
      const sourceHeight = image.naturalHeight || image.height || 180;
      const crop = Math.min(sourceWidth, sourceHeight);
      ctx.drawImage(avatar, (sourceWidth - crop) / 2, (sourceHeight - crop) / 2, crop, crop, 54, 162, 180, 180);
      ctx.restore();
    } else {
      const initials = profile.name.trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join("").toLocaleUpperCase("id-ID");
      text(initials || "S", 78, 280, 72, 900, ink);
    }
    fitted(profile.name || "Anggota Satukelas", 280, 207, 725, 133, 58, 25, 900);
    fitted(profile.title?.trim() || role, 280, 350, 725, 65, 30, 21, 700, ink);
    box(50, 412, 957, 4, ink);
    fitted(profile.email, 50, 463, 957, 65, 29, 19, 700);
    if (profile.phone?.trim()) fitted(profile.phone, 50, 535, 690, 35, 27, 19, 700);
    text("Pendidikan. Kolaborasi. Dampak.", 50, 598, 23);
    if (profile.isActive !== undefined) {
      box(804, 563, 203, 46, paper, 3);
      box(820, 581, 10, 10, profile.isActive ? "#22C55E" : "#EF4444");
      text(profile.isActive ? "Anggota aktif" : "Nonaktif", 840, 594, 20, 700, ink);
    }
  } else {
    fitted("Kenalan dulu.\nTumbuh bareng.", 50, 211, 538, 147, 64, 38, 900);
    fitted(profile.name || "Tim Satukelas", 50, 376, 538, 75, 31, 21);
    fitted(profile.role === "MARKETER" ? "Pindai untuk melihat profil dan menghubungi saya." : "Pindai untuk mengenal Satukelas Projects.", 50, 458, 538, 79, 27, 21, 500);
    box(666, 141, 330, 330, ink);
    box(658, 133, 330, 330, white, 4);
    const moduleSize = Math.max(1, Math.floor(310 / (qr.size + qr.quietZone * 2)));
    const qrWidth = moduleSize * (qr.size + qr.quietZone * 2);
    const startX = Math.round(823 - qrWidth / 2);
    const startY = Math.round(298 - qrWidth / 2);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = ink;
    for (let row = 0; row < qr.size; row += 1) {
      for (let col = 0; col < qr.size; col += 1) {
        if (qr.modules[row * qr.size + col]) {
          ctx.fillRect(startX + (col + qr.quietZone) * moduleSize, startY + (row + qr.quietZone) * moduleSize, moduleSize, moduleSize);
        }
      }
    }
    text("Pindai kode QR", 714, 511, 29);
    box(8, 545, 1047, 85, ink);
    text("PORTAL RESMI SATUKELAS", 50, 574, 15, 800, pink);
    fitted(url.replace(/^https?:\/\//, ""), 50, 607, 957, 45, 24, 17, 700, paper);
  }
}

export async function renderBusinessCardCanvas(
  profile: CardProfile,
  side: CardSide,
  origin = "https://satukelas.com",
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_DIMENSIONS.width;
  canvas.height = CARD_DIMENSIONS.height;
  const url = getCardUrl(profile, origin);
  const qr = createCardQr(url);

  let avatar: HTMLImageElement | undefined;
  if (profile.avatarUrl) {
    try {
      avatar = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Gagal memuat avatar"));
        image.src = profile.avatarUrl!;
      });
    } catch {
      avatar = undefined;
    }
  }

  let logo: HTMLImageElement | undefined;
  try {
    logo = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Gagal memuat logo"));
      image.src = "/brand/satukelas-logo-tight.png";
    });
  } catch {
    logo = undefined;
  }

  drawBusinessCard(canvas, profile, side, url, qr, avatar, logo);
  return canvas;
}
