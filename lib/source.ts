import * as cheerio from "cheerio";
import type {
  ApkDetail,
  ApkDownloadFile,
  ApkItem,
  DownloadLink,
  HomeSection,
  PagedResult,
  TelegramDownload,
} from "./types";

/** Source site. Overridable via SOURCE_ORIGIN (dev/local mock). */
export const ORIGIN = process.env.SOURCE_ORIGIN || "https://apkvision.org";
let ORIGIN_HOST = "apkvision.org";
try {
  ORIGIN_HOST = new URL(ORIGIN).hostname;
} catch {
  /* keep default */
}
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

/* --------------------------- value sanitising ---------------------------- */

/** Hard cap for anything scraped out of a source page. */
const MAX_FIELD = 80;

/**
 * The source ships a lot of its markup as one long line, so a naive
 * "Label: value" slice can run straight into the rest of the document (the
 * download buttons, the FAQ, the sidebar, the footer…). Keep only the leading
 * part of the value so a bad parse can never blow up a button label.
 */
function trimValue(raw: string, max = MAX_FIELD): string {
  const s = clean(decodeEntities(raw));
  if (s.length <= max) return s;
  const head = s.slice(0, max);
  const sp = head.lastIndexOf(" ");
  return `${clean((sp > max / 3 ? head.slice(0, sp) : head).replace(/[\s,;:.+\-–—]+$/, ""))}…`;
}

/** Short values pass through untouched; a spilled one is cut down to `re`. */
function pickValue(raw: string, re: RegExp, max = MAX_FIELD): string {
  const s = clean(decodeEntities(raw));
  if (!s) return "";
  if (s.length <= max) return s;
  const m = s.match(re);
  return m ? clean(m[0]) : trimValue(s, max);
}

/** e.g. "2.46 GB" — leading `\s*`/`^\s*` variants for both anchored and mid-text use */
const RE_SIZE = /^\s*\d[\d.,]*\s*(?:GB|MB|KB|B)\b/i;
const RE_SIZE_ANY = /(?<![\d.,])\d[\d.,]*\s*(?:GB|MB|KB)\b/i;
/** e.g. "GTA-SA-v2.11.311-full-mod-money-apkvision.apk" */
const RE_FILE = /^[\w.+\-]{3,}\.(?:apk|xapk|apks|zip|obb|rar)\b/i;
/** e.g. "v2.11.311" */
const RE_VER = /^\s*v?\d[\w.+\-]*/i;
/** e.g. "arm64-v8a, armeabi-v7a" */
const RE_ARCH = /^[a-z0-9_][a-z0-9_\-]*(?:\s*,\s*[a-z0-9_][a-z0-9_\-]*)*/i;

/** Convert absolute source URL -> local path. Returns null for non-cloneable URLs. */
export function toLocal(href: string): string | null {
  try {
    const u = new URL(href, ORIGIN);
    if (u.hostname !== ORIGIN_HOST) return null;
    const p = u.pathname;
    if (p === "/" || p.startsWith("/games/") || p.startsWith("/app/")) return p;
    if (["/best-new-releases/", "/popular-games/", "/updated/", "/top-100-games/", "/request/"].includes(p))
      return p;
    return null;
  } catch {
    return null;
  }
}

/** Convert an external download-page URL -> local /download/... path. */
export function toLocalDownload(href: string): string | null {
  try {
    const u = new URL(href, ORIGIN);
    if (u.hostname !== ORIGIN_HOST) return null;
    const segs = u.pathname.split("/").filter(Boolean);
    const di = segs.indexOf("download");
    if (di < 1 || di === segs.length - 1) return null;
    // keep [genre?, slug] before "download" + [version] after it
    const body = [...segs.slice(1, di), ...segs.slice(di + 1)];
    return body.length >= 2 ? `/download/${body.join("/")}/` : null;
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

export async function getRestPost(id: string): Promise<RestPost | null> {
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
    // Never leak inline JS/CSS text into the button label.
    $(el).find("script, style").remove();
    const text = clean($(el).text());
    // The button stacks its bits in sibling <div>s, which .text() glues
    // together ("v2.11.3112.46 GBAPK") — keep a spaced copy for reading.
    const spaced = clean(($(el).html() || "").slice(0, 2000).replace(/<[^>]*>/g, " "));
    // The source nests size / file-type / version badges inside its button, so
    // the raw text is one long run ("Download X APK v1.0 84.89 MB APK v1.0").
    // Prefer the innermost "Download …" line for the label and keep the size
    // on its own line instead (see DownloadSection).
    const inner = $(el)
      .find("*")
      .map((_, n) => clean($(n).text()))
      .get()
      .filter((t) => t.length >= 15 && /^download\b/i.test(t));
    const label = trimValue(
      inner.length ? inner.sort((a, b) => a.length - b.length)[0] : spaced || text,
      90,
    );
    const sizeMatch = spaced.slice(0, 200).match(RE_SIZE_ANY);
    downloads.push({
      url: href.startsWith("http") ? href : `${ORIGIN}${href}`,
      localUrl: toLocalDownload(href) || "",
      label,
      size: sizeMatch ? sizeMatch[0].toUpperCase() : "",
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

/* ------------------------------ download pages ----------------------------- */

/**
 * Fetch the source's download page for a given post+version and extract the
 * direct .apk file URL + file metadata (filename, size, arch, version).
 * This lets us render our own download page that goes straight to the file,
 * skipping the source's countdown timer and ads.
 */
export async function getDownloadFile(id: string, version: string): Promise<ApkDownloadFile | null> {
  const post = await getRestPost(id);
  if (!post) return null;
  const detailPath = toLocal(post.link);
  if (!detailPath) return null;
  const sourceUrl = `${ORIGIN}${detailPath}download/${version}/`;

  let html: string;
  try {
    const res = await fetch(sourceUrl, { headers: HEADERS, next: { revalidate: DETAIL_REVALIDATE } });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  const $ = cheerio.load(html);
  let fileUrl = "";
  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (!href) return;
    const abs = href.startsWith("http") ? href : `${ORIGIN}${href}`;
    if (/\.apk(\?|#|$)/i.test(abs)) {
      fileUrl = abs.split(/[?#]/)[0];
      return false;
    }
  });
  if (!fileUrl) return null;

  // The Telegram button calls the source's inline `generateToken('dir/file.apk')`.
  // Grab that file path so our own button can request a bot token for it
  // (see /api/tg). Fallback: derive it from the CDN file URL, whose path
  // matches (`https://dl.apkvision.org/<dir>/<file>` -> `<dir>/<file>`).
  const tgCall = html.match(/generateToken\(\s*['"]([^'"]+)['"]\s*\)/i);
  let tgFilePath = tgCall ? clean(decodeEntities(tgCall[1])) : "";
  if (!tgFilePath && fileUrl) {
    try {
      tgFilePath = new URL(fileUrl).pathname.replace(/^\/+/, "");
    } catch {
      /* ignore */
    }
  }

  // Parse "Label: value" pairs from the tag-stripped text (line based, so
  // markup like <b>Size:</b> works regardless of tag placement).
  // Strip scripts/styles first so inline JS never leaks into parsed values.
  const LABELS = ["Filename", "Version", "Processor", "Architecture", "Arch", "Size", "Updated"];
  const noScript = html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style[\s\S]*?<\/style\s*>/gi, " ");
  const plain = noScript.replace(/<[^>]*>/g, " ");
  const lines = plain.split("\n").map(clean).filter(Boolean);
  const row = (label: string): string => {
    const re = new RegExp(`(?<![\\w-])${label}\\s*:\\s*(.+)`, "i");
    for (const line of lines) {
      const m = line.match(re);
      if (m) {
        // if several labels share one line, cut at the next label
        const value = m[1].split(new RegExp(`\\s+(?:${LABELS.join("|")})\\s*:`, "i"))[0];
        return clean(decodeEntities(value));
      }
    }
    return "";
  };

  // Every value runs through pickValue(): the download page can be a single
  // long line of markup, in which case the slice after "Size:" (the last row)
  // swallows the rest of the document.
  const filename =
    pickValue(row("Filename"), RE_FILE, 140) || decodeURIComponent(fileUrl.split("/").pop() || "");

  // "Download from Telegram Bot" alternative (same file, delivered by the
  // source's Telegram bot @ApkDownload24Bot). The button exists when the page
  // carries a `generateToken('...')` call or the button label (the FAQ text
  // "...via the telegram client" doesn't match this pattern). Our own button
  // requests a token server-side via /api/tg and deep-links straight into
  // Telegram — the user never visits the source page.
  let telegram: TelegramDownload | undefined;
  const tgAt = noScript.search(/download\s+(?:from|via)\s+telegram/i);
  if (tgFilePath && (tgCall || tgAt >= 0)) {
    const tgWindow =
      tgAt >= 0 ? noScript.slice(tgAt, tgAt + 800).replace(/<[^>]*>/g, " ") : "";
    const tgName = tgWindow.match(/[\w.\-+]+\.(?:apk|xapk|apks)/i);
    telegram = {
      filename: tgName
        ? decodeEntities(tgName[0])
        : decodeURIComponent(tgFilePath.split("/").pop() || "") || filename,
      filePath: tgFilePath,
    };
  }

  return {
    fileUrl,
    filename,
    version: pickValue(row("Version"), RE_VER, 40) || version,
    arch: pickValue(row("Processor") || row("Architecture") || row("Arch"), RE_ARCH, 60),
    size: pickValue(row("Size"), RE_SIZE, 32),
    sourceUrl,
    telegram,
  };
}

/** Related/popular items parsed from a detail page (sidebar block). */
export async function getRelated(localPath: string): Promise<ApkItem[]> {
  try {
    const html = await fetchHtml(localPath.endsWith("/") ? localPath : `${localPath}/`, DETAIL_REVALIDATE);
    const $ = cheerio.load(html);
    const items: ApkItem[] = [];
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
