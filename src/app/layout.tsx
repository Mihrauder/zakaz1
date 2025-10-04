import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BAF Service — Ремонт и настройка ПК/ноутбуков",
  description: "Выездной ремонт и настройка компьютеров и ноутбуков. Быстро, качественно, с гарантией.",
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: "BAF Service — Ремонт и настройка ПК/ноутбуков",
    description: "Выездной ремонт и настройка компьютеров и ноутбуков. Быстро, качественно, с гарантией.",
    type: "website",
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
