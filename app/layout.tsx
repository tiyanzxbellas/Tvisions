import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TopLoader from "@/components/TopLoader";
import PwaRegister from "@/components/PwaRegister";
import JsonLd from "@/components/JsonLd";
import { getSiteUrl } from "@/lib/site";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_NAME = "TiyanzVision";
const SITE_DESC =
  "TiyanzVision (TVision) — download free MOD APK games & premium apps (apkmod) for Android. Safe, fast, updated daily: unlimited money, unlocked premium, MOD menu & no ads.";

// NOTE: metadata dibuat per-request agar metadataBase/OG/canonical otomatis
// mengikuti domain yang sedang diakses (ganti domain = nol config).
export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "TiyanzVision (TVision) — Free MOD APK Games & Apps for Android",
      template: "%s | TiyanzVision",
    },
    description: SITE_DESC,
    keywords: [
      "tiyanzvision",
      "tiyanz vision",
      "tvision",
      "tv vision",
      "apkmod",
      "mod apk",
      "apk mod",
      "download mod apk",
      "free mod apk",
      "apk games",
      "premium apps apk",
      "unlimited money apk",
      "mod menu apk",
      "android games download",
    ],
    authors: [{ name: SITE_NAME, url: siteUrl }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "technology",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: { canonical: "/" },
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
      : {}),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: SITE_NAME,
      title: "TiyanzVision (TVision) — Free MOD APK Games & Apps",
      description: SITE_DESC,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: "TiyanzVision (TVision) — Free MOD APK Games & Apps",
      description: SITE_DESC,
      images: ["/og-image.png"],
    },
    icons: {
      icon: [
        { url: "/icons/favicon-32.png?v=2", sizes: "32x32", type: "image/png" },
        { url: "/icons/favicon-16.png?v=2", sizes: "16x16", type: "image/png" },
        { url: "/favicon.ico?v=2", sizes: "any" },
      ],
      apple: [{ url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" }],
      shortcut: "/favicon.ico?v=2",
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: "TVision", statusBarStyle: "black-translucent" },
  };
}

export const viewport: Viewport = {
  themeColor: "#04070a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-void font-sans antialiased">
        <JsonLd />
        <TopLoader />
        <PwaRegister />
        {/* ambient background */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-grid-neon animate-grid-pan opacity-60" />
          <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-neon/15 blur-[140px] animate-float" />
          <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-royal/20 blur-[160px] animate-float-slow" />
          <div className="absolute bottom-0 -left-32 h-96 w-96 rounded-full bg-aqua/10 blur-[140px] animate-float-slow" />
        </div>
        <Header />
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
