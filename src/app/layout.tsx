import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppToaster } from "@/components/app-toaster";
import { getSiteUrl } from "@/lib/supabase/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SanayiDesk",
    template: "%s · SanayiDesk",
  },
  description:
    "Oto sanayi dükkanı için iş emri, usta PIN, tahsilat, stok ve rapor — tek uygulamada.",
  applicationName: "SanayiDesk",
  appleWebApp: {
    capable: true,
    title: "SanayiDesk",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "SanayiDesk",
    title: "SanayiDesk",
    description:
      "Oto sanayi dükkanı için iş emri, usta PIN, tahsilat, stok ve rapor.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SanayiDesk",
    description:
      "Oto sanayi dükkanı için iş emri, usta PIN, tahsilat, stok ve rapor.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full font-sans">
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
