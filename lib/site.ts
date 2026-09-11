import { headers } from "next/headers";

/**
 * Deteksi base URL otomatis dari domain yang sedang diakses.
 * Baca header `x-forwarded-host` (Vercel/proxy) lalu `host` biasa.
 * Ganti domain/subdomain kapan pun — SEO, sitemap, robots, JSON-LD
 * otomatis ikut tanpa edit file / setting env.
 */
export async function getSiteUrl(): Promise<string> {
  const h = await headers();
  const host =
    h.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    h.get("host")?.trim() ||
    "tvisions.tiyan.my.id";
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Versi aman buat sitemap/robots (fallback kalau di luar request scope). */
export async function getSiteUrlSafe(): Promise<string> {
  try {
    return await getSiteUrl();
  } catch {
    return process.env.NEXT_PUBLIC_SITE_URL || "https://tvisions.tiyan.my.id";
  }
}
