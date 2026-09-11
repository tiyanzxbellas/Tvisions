import * as cheerio from "cheerio";
import type { ApkDetail, ApkItem, DownloadLink, HomeSection, PagedResult } from "./types";

export const ORIGIN = "https://apkvision.org";
export const API = `${ORIGIN}/wp-json/wp/v2`;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

const LIST_REVALIDATE = 1800; // 30 min
const DETAIL_REVALIDATE = 43200; // 12 h

/* ---------------------------------- utils --------------------------------- */

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'");
}

/** Convert absolute source URL -> local path. Returns null for non-cloneable URLs. */
export function toLocal(href: string): string | null {
  try {
    const u = new URL(href, ORIGIN);
    if (u.hostname !== "apkvision.org") return null;
    const p = u.pathname;
    if (p === "/" || p.startsWith("/games/") || p.startsWith("/app/")) return p;
    if (["/best-new-releases/", "/popular-games/", "/updated/", "/top-100-games/", "/request/"].includes(p))
      return p;
    return null;
  } catch {
    return null;
  }
}

function idFromHref(href: string, idAttr?: string): string {
  if (idAttr) {
    const m = idAttr.match(/post-(\d+)/);
    if (m) return m[1];
  }
  const m = href.match(/-(\d+)\/?$/);
  return m ? m[1] : href;
}

async function fetchHtml(path: string, revalidate = LIST_REVALIDATE): Promise<string> {
  const res = await fetch(`${ORIGIN}${path}`, {
    headers: HEADERS,
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`fetch ${path}: ${res.status}`);
  return res.text();
}

/** Same as fetchHtml but returns null on 404 (used for listings). */
async function fetchHtmlOrNull(path: string, revalidate = LIST_REVALIDATE): Promise<string | null> {
  const res = await fetch(`${ORIGIN}${path}`, {
    headers: HEADERS,
    next: { revalidate },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetch ${path}: ${res.status}`);
  return res.text();
}

/** Parse `a.mainb-item` (games) and `a.main-news` (apps) cards. */
const CARD_SEL = "a.mainb-item, a.main-news";
const CARD_TITLE_SEL = ".mainb-title, .main-news-title";
const CARD_CAT_SEL = ".mainb-cat, .main-news-cat";

function parseCards($: cheerio.CheerioAPI, scope?: string): ApkItem[] {
  const items: ApkItem[] = [];
  const seen = new Set<string>();
  const sel = scope ? `${scope} ${CARD_SEL}` : CARD_SEL;
  $(sel).each((_, el) => {
    const parsed = parseCard($, el);
    if (parsed && !seen.has(parsed.id)) {
      seen.add(parsed.id);
      items.push(parsed);
    }
  });
  return items.filter((i) => i.title && i.url);
}

/** IDs hidden from all listings (source-brand apps, etc). */
const BLOCKED_IDS = new Set(["131787"]); // "APKVision Store" app

function parseCard($: cheerio.CheerioAPI, el: unknown): ApkItem | null {
  const a = $(el as never);
  const href = a.attr("href") || "";
  const local = toLocal(href);
  if (!local) return null;
  const id = idFromHref(href, a.attr("id"));
  if (BLOCKED_IDS.has(id)) return null;
  const cats = a
    .find(CARD_CAT_SEL)
    .map((_, c) => clean($(c).text()))
    .get()
    .filter(Boolean);
  const img = a.find("img").first();
  return {
    id,
    title: clean(a.find(CARD_TITLE_SEL).text()) || clean(a.attr("title") || ""),
    url: local,
    originalUrl: href.startsWith("http") ? href : `${ORIGIN}${local}`,
    icon: img.attr("src") || img.attr("data-src") || "",
    version: cats[0] || "",
    mod: cats.slice(1).join(" • "),
  };
}

function parseTotalPages($: cheerio.CheerioAPI): number {
  let max = 1;
  $('a[href*="/page/"]').each((_, el) => {
    const m = ($(el).attr("href") || "").match(/\/page\/(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return max;
}

/* --------------------------------- homepage -------------------------------- */

export async function getHomeSections(): Promise<HomeSection[]> {
  const html = await fetchHtml("/");
  const $ = cheerio.load(html);
  const sections: HomeSection[] = [];
  $(".mainb").each((_, block) => {
    const b = $(block);
    const title = clean(b.find(".mainb-main-title").first().text());
    if (!title) return;
    const more = b.find("a.mainb-seemore").first();
    const moreHref = more.attr("href") || "";
    // parse cards within this block only
    const items: ApkItem[] = [];
    const seen = new Set<string>();
    b.find(CARD_SEL).each((_, el) => {
      const parsed = parseCard($, el);
      if (parsed && !seen.has(parsed.id)) {
        seen.add(parsed.id);
        items.push(parsed);
      }
    });
    if (items.length > 0) {
      sections.push({
        title,
        moreUrl: toLocal(moreHref) || "",
        moreLabel: clean(more.text()) || "More",
        items,
      });
    }
  });
  return sections;
}

/* --------------------------------- listings -------------------------------- */

export type ListingKind = "games" | "app" | "special" | "search";

export async function getListing(
  kind: "games" | "app",
  genre: string | null,
  page: number
): Promise<PagedResult> {
  let path = genre ? `/${kind}/${genre}/` : `/${kind}/`;
  if (page > 1) path += `page/${page}/`;
  const html = await fetchHtmlOrNull(path);
  if (html === null) return { items: [], page, totalPages: 1, title: "" };
  const $ = cheerio.load(html);
  const items = parseCards($);
  const h1 = clean($("h1").first().text());
  return { items, page, totalPages: Math.max(parseTotalPages($), page), title: h1 };
}

export async function getSpecialPage(slug: string, page: number): Promise<PagedResult> {
  const path = page > 1 ? `/${slug}/page/${page}/` : `/${slug}/`;
  const html = await fetchHtml(path);
  const $ = cheerio.load(html);
  return {
    items: parseCards($),
    page,
    totalPages: Math.max(parseTotalPages($), 1),
    title: clean($("h1").first().text()),
  };
}

export async function searchApk(query: string, page: number): Promise<PagedResult> {
  const path = page > 1 ? `/page/${page}/?s=${encodeURIComponent(query)}` : `/?s=${encodeURIComponent(query)}`;
  const html = await fetchHtml(path, 600);
  const $ = cheerio.load(html);
  return {
    items: parseCards($),
    page,
    totalPages: Math.max(parseTotalPages($), 1),
    title: `Search: ${query}`,
  };
}

/* ---------------------------------- detail --------------------------------- */

interface RestPost {
  id: number;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  modified: string;
  categories: number[];
}

async function getRestPost(id: string): Promise<RestPost | null> {
  try {
    const res = await fetch(`${API}/posts/${id}?_fields=id,slug,link,title,content,excerpt,modified,categories`, {
      headers: HEADERS,
      next: { revalidate: DETAIL_REVALIDATE },
    });
    if (!res.ok) return null;
    return (await res.json()) as RestPost;
  } catch {
    return null;
  }
}

export async function getDetail(id: string, localPath: string): Promise<ApkDetail | null> {
  if (BLOCKED_IDS.has(id)) return null;
  const [post, html] = await Promise.all([
    getRestPost(id),
    fetchHtml(localPath.endsWith("/") ? localPath : `${localPath}/`, DETAIL_REVALIDATE).catch(() => null),
  ]);
  if (!post || !html) return null;
  const $ = cheerio.load(html);

  const verTop = $(".ver-top-version")
    .map((_, el) => clean($(el).text()))
    .get()
    .filter(Boolean);

  const info: { label: string; value: string }[] = [];
  let googlePlayUrl = "";
  let genreName = "";
  let genreUrl = "";
  let developer = "";
  let packageName = "";
  let updated = "";
  $("table.appinfo tr").each((_, tr) => {
    const label = clean($(tr).find("th").text());
    const td = $(tr).find("td");
    const value = clean(td.text());
    if (!label) return;
    if (label === "Get it On") {
      googlePlayUrl = td.find("a").attr("href") || "";
      return;
    }
    if (label === "Genre") {
      genreName = value;
      genreUrl = toLocal(td.find("a").attr("href") || "") || "";
    }
    if (label === "Developer") developer = value;
    if (label === "Package name") packageName = value;
    if (label === "Updated") updated = value;
    info.push({ label, value });
  });

  const downloads: DownloadLink[] = [];
  const seenDl = new Set<string>();
  $('a[href*="/download/"]').each((_, el) => {
    const href = $(el).attr("href") || "";
    if (seenDl.has(href) || !href) return;
    seenDl.add(href);
    const label = clean($(el).text());
    const sizeMatch = label.match(/(\d[\d.,]*\s*(?:GB|MB|KB))/i);
    downloads.push({
      url: href.startsWith("http") ? href : `${ORIGIN}${href}`,
      label,
      size: sizeMatch ? sizeMatch[1].toUpperCase() : "",
    });
  });

  const screenshots: string[] = [];
  const seenShot = new Set<string>();
  $('img[src*="img.apkvision.org"]').each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src && !seenShot.has(src)) {
      seenShot.add(src);
      screenshots.push(src);
    }
  });

  const ratingMatch = html.match(/(\d+\.\d+)\/5\s*\((\d+)\s*votes\)/);
  const workMatch = html.match(/js-version-votes_percent[^>]*>\s*(\d+%)\s*</);
  const voicesMatch = html.match(/Voices:\s*<span[^>]*>\s*(\d+)\s*<\/span>/);

  const ogImage = $('meta[property="og:image"]').attr("content") || "";
  const cats = $(".mainb-cat")
    .map((_, c) => clean($(c).text()))
    .get();

  return {
    id: String(post.id),
    title: clean($(".ver-top-h1 h1").first().text().replace(/\s+APK$/i, "")) || clean(post.title.rendered),
    url: localPath,
    originalUrl: post.link,
    icon: ogImage,
    version: verTop[0] || cats[0] || "",
    mod: verTop.slice(1).join(" • "),
    descriptionHtml: post.content.rendered,
    info,
    googlePlayUrl,
    downloads,
    screenshots,
    rating: ratingMatch ? ratingMatch[1] : "",
    ratingVotes: ratingMatch ? ratingMatch[2] : "",
    workPercent: workMatch ? workMatch[1] : "",
    workVoices: voicesMatch ? voicesMatch[1] : "",
    updated,
    genreName,
    genreUrl,
    developer,
    packageName,
  };
}

/** Related/popular items parsed from a detail page (sidebar block). */
export async function getRelated(localPath: string): Promise<ApkItem[]> {
  try {
    const html = await fetchHtml(localPath.endsWith("/") ? localPath : `${localPath}/`, DETAIL_REVALIDATE);
    const $ = cheerio.load(html);
    let items: ApkItem[] = [];
    $(".mainb").each((_, block) => {
      const title = clean($(block).find(".mainb-main-title").text()).toLowerCase();
      if (title.includes("popular")) {
        $(block)
          .find(CARD_SEL)
          .each((_, el) => {
            const parsed = parseCard($, el);
            if (parsed) items.push(parsed);
          });
      }
    });
    return items.filter((i) => i.title).slice(0, 12);
  } catch {
    return [];
  }
}

/* ------------------------------- suggestions ------------------------------- */

export interface Suggestion {
  id: number;
  title: string;
  url: string;
}

export async function suggest(query: string): Promise<Suggestion[]> {
  try {
    const res = await fetch(`${API}/search?search=${encodeURIComponent(query)}&per_page=8`, {
      headers: HEADERS,
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { id: number; title: string; url: string }[];
    return data
      .map((d) => ({ id: d.id, title: decodeEntities(d.title), url: toLocal(d.url) || "" }))
      .filter((d) => d.url && !BLOCKED_IDS.has(String(d.id)));
  } catch {
    return [];
  }
}
