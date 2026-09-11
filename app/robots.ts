import type { MetadataRoute } from "next";
import { getSiteUrlSafe } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const BASE = await getSiteUrlSafe();
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
