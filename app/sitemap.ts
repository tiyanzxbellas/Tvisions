import type { MetadataRoute } from "next";
import { GAME_GENRES, APP_CATS, SPECIAL_PAGES } from "@/lib/genres";
import { API, toLocal } from "@/lib/source";
import { getSiteUrlSafe } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = await getSiteUrlSafe();
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/games/`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/app/`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    ...GAME_GENRES.map((g) => ({
      url: `${BASE}/games/${g.slug}/`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...APP_CATS.map((g) => ({
      url: `${BASE}/app/${g.slug}/`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...Object.keys(SPECIAL_PAGES).map((s) => ({
      url: `${BASE}/${s}/`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  // include latest 100 APK detail URLs
  try {
    const res = await fetch(`${API}/posts?per_page=100&_fields=link,modified`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const posts = (await res.json()) as { link: string; modified: string }[];
      for (const p of posts) {
        const local = toLocal(p.link);
        if (local) {
          urls.push({
            url: `${BASE}${local}`,
            lastModified: new Date(p.modified),
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      }
    }
  } catch {
    /* ignore */
  }

  return urls;
}
