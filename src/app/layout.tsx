import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geist = localFont({
  src: "./fonts/Geist.ttf",
  variable: "--font-geist",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Mitra Marketing | Satukelas Projects", template: "%s | Satukelas Projects" },
  description: "Kenali peran mitra marketing Satukelas Projects. Buka relasi dengan sekolah dan jadi penghubung cerita baru.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" data-scroll-behavior="smooth" className={geist.variable}>
    <body className="min-h-screen bg-white text-black antialiased">{children}</body>
  </html>;
}
