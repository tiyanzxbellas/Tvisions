import * as cheerio from "cheerio";
import type {
  ApkDetail,
  ApkDownloadFile,
  ApkItem,
  CollectionDetail,
  CollectionGame,
  CollectionSummary,
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

/**
 * A link label longer than this means the source's `<a>` didn't wrap a button
 * but a whole section — see `linkLines`. Real buttons read like
 * "Download APK — 2.46 GB".
 */
const MAX_LABEL = 64;

/** Trim a parsed value to a sane length, cutting on a word boundary. */
function capText(s: string, max = 100): string {
  const v = clean(s);
  if (v.length <= max) return v;
  const cut = v.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${clean(sp > max / 2 ? cut.slice(0, sp) : cut)}…`;
}

/**
 * Text of an element split the way the browser renders it: block-level tags
 * (and `<br>`) become line breaks, inline noise (script/style/noscript/svg)
 * is dropped. Needed because `$(el).text()` glues an entire nested subtree
 * into one string.
 */
function linkLines(markup: string): string[] {
  return markup
    .replace(/<(script|style|noscript|template|svg)[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(
      /<\/?\s*(div|p|li|ul|ol|h[1-6]|table|thead|tbody|tr|td|th|button|span|b|strong|em|i|a|section|article|aside|footer|header|nav|main|dl|dt|dd|figure|small|label)\b[^>]*>/gi,
      "\n"
    )
    .replace(/<[^>]*>/g, " ")
    .split("\n")
    .map((l) => clean(decodeEntities(l)))
    .filter(Boolean);
}

/** A line that is only a file name — never a button label. */
const NOISE_LINE = /^[\w.+\-]+\.(?:apk|xapk|apks)$/i;

/**
 * Boilerplate that happens to start with "Download" (or is a page heading).
 * These show up inside a runaway anchor and must never become the label.
 */
const BOILERPLATE_LINE =
  /^(?:download\s+faqs?\b|faqs?\b|new releases?\b|send report\b|download\s+apkvision\b|related\b|comments?\b|attention\b|can(?:'|’)?t download)/i;

/**
 * Short label for a download link.
 *
 * The source's download markup is sloppy: the button's `<a>` is sometimes left
 * unclosed, so the HTML parser nests everything after it (the file name, the
 * Telegram button, the ARM64 "Attention!" note, the whole FAQ, the sidebar and
 * the footer) inside the anchor. Plain `.text()` then returns the rest of the
 * page as the button label. So: take the first rendered line that reads like a
 * button ("Download APK — 2.46 GB"), and if nothing sane is left fall back to
 * a label built from the parsed file size.
 */
function downloadLabel(markup: string): { label: string; size: string } {
  const lines = linkLines(markup);
  const full = clean(lines.join(" "));

  // size: first "2.46 GB" / "84.89 MB" anywhere in the anchor
  const sizeMatch = full.match(/(\d[\d.,]*\s*(?:GB|MB|KB))/i);
  const size = sizeMatch ? sizeMatch[1].toUpperCase() : "";

  // a short anchor is a well-formed button — keep its text as-is
  if (full && full.length <= MAX_LABEL && !NOISE_LINE.test(full)) return { label: full, size };

  // long anchor -> rebuild the label from the rendered lines, starting at the
  // line that reads like a button and stopping at the file name / a long line
  const start = lines.findIndex(
    (l) => /^(download|get|install|unduh)\b/i.test(l) && !BOILERPLATE_LINE.test(l)
  );
  if (start >= 0) {
    let label = lines[start];
    for (let i = start + 1; i < lines.length; i++) {
      if (NOISE_LINE.test(lines[i]) || label.length + 1 + lines[i].length > MAX_LABEL) break;
      label = `${label} ${lines[i]}`;
    }
    return { label: capText(label, MAX_LABEL), size };
  }

  return { label: capText(size ? `Download APK — ${size}` : "Download APK", MAX_LABEL), size };
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

/* ------------------------------ image resolving ---------------------------- */

/**
 * Card icons on the source are lazy-loaded: for below-the-fold cards the raw
 * `src` is a 1x1 placeholder and the real URL hides in `data-lazy-src` /
 * `data-src` / `srcset` / `<noscript>`. The old `src || data-src` read never
 * reached `data-src` (the placeholder is non-empty), so most homepage icons
 * shipped to the browser as blank pixels. These helpers resolve the REAL
 * icon URL for every lazy pattern and normalize it to an absolute,
 * optimizer-friendly URL (relative / protocol-relative / http included).
 */
const PLACEHOLDER_BASENAME =
  /^(?:placeholder|spacer|blank|transparent|pixel|1x1|lazy|lazyload|lazy-load|loading)(?:[._-]\d+x\d+)?\.(?:gif|png|jpe?g|svg|webp|avif)$/i;

function isPlaceholderUrl(raw: string): boolean {
  const v = raw.trim();
  if (!v) return true;
  const low = v.toLowerCase();
  if (low.startsWith("data:") || low.startsWith("about:") || low.startsWith("javascript:")) return true;
  const base = v.split(/[?#]/)[0].split("/").pop() || "";
  return PLACEHOLDER_BASENAME.test(base);
}

const IS_HTTPS_ORIGIN = ORIGIN.toLowerCase().startsWith("https://");

/**
 * Normalize a parsed image URL: resolve relative/protocol-relative against
 * ORIGIN, force https on source hosts. Returns "" for unusable/placeholder.
 */
function normalizeImageUrl(raw: string | undefined | null): string {
  if (!raw) return "";
  const v = clean(decodeEntities(raw));
  if (isPlaceholderUrl(v)) return "";
  try {
    const u = new URL(v, ORIGIN);
    if (
      u.protocol === "http:" &&
      IS_HTTPS_ORIGIN &&
      (u.hostname === ORIGIN_HOST || u.hostname === "apkvision.org" || u.hostname.endsWith(".apkvision.org"))
    ) {
      u.protocol = "https:";
    }
    return u.href;
  } catch {
    return "";
  }
}

/** Pick the best candidate from a srcset: smallest ≥192w, else the largest. */
function pickFromSrcset(srcset: string | undefined | null): string {
  if (!srcset) return "";
  const cands: { url: string; w: number }[] = [];
  for (const part of srcset.split(",")) {
    const m = part.trim().match(/^(\S+)(?:\s+(\d+(?:\.\d+)?)(w|x))?/);
    if (!m) continue;
    if (isPlaceholderUrl(m[1])) continue;
    const w = m[2] ? parseFloat(m[2]) * (m[3] === "x" ? 100 : 1) : 0;
    cands.push({ url: m[1], w });
  }
  if (cands.length === 0) return "";
  const sorted = [...cands].sort((a, b) => a.w - b.w);
  return (sorted.find((c) => c.w >= 192) || sorted[sorted.length - 1]).url;
}

const LAZY_SRC_ATTRS = ["data-lazy-src", "data-src", "data-original", "data-lazyloaded-src", "data-echo"];
const LAZY_SRCSET_ATTRS = ["data-lazy-srcset", "data-srcset", "srcset"];

/** Resolve one <img> element to its real URL ("" when it only holds a placeholder). */
function resolveImgEl($: cheerio.CheerioAPI, el: unknown): string {
  const img = $(el as never);
  for (const attr of LAZY_SRC_ATTRS) {
    const u = normalizeImageUrl(img.attr(attr));
    if (u) return u;
  }
  const src = normalizeImageUrl(img.attr("src"));
  if (src) return src;
  for (const attr of LAZY_SRCSET_ATTRS) {
    const u = normalizeImageUrl(pickFromSrcset(img.attr(attr)));
    if (u) return u;
  }
  return "";
}

/**
 * Real icon URL for a card element: its <img>s (lazy-aware), then
 * <picture><source> srcset, then a <noscript> fallback img, then an inline
 * CSS background-image.
 */
function resolveCardIcon($: cheerio.CheerioAPI, el: unknown): string {
  const scope = $(el as never);
  let found = "";
  scope.find("img").each((_, im) => {
    if (!found) found = resolveImgEl($, im);
  });
  if (found) return found;
  scope.find("source").each((_, s) => {
    if (found) return;
    for (const attr of LAZY_SRCSET_ATTRS) {
      const u = normalizeImageUrl(pickFromSrcset($(s).attr(attr)));
      if (u) {
        found = u;
        break;
      }
    }
  });
  if (found) return found;
  // <noscript><img src="real"></noscript> — cheerio keeps it as markup text
  const nsEl = scope.find("noscript").first();
  const ns = (nsEl.length ? nsEl.html() || nsEl.text() : "") || "";
  const m = ns.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m) {
    const u = normalizeImageUrl(m[1]);
    if (u) return u;
  }
  let bg = "";
  scope.find("[style]").each((_, s) => {
    if (bg) return;
    const mm = ($(s).attr("style") || "").match(/url\(\s*["']?([^"')]+)["']?\s*\)/i);
    if (mm) bg = normalizeImageUrl(mm[1]);
  });
  return bg;
}

/** Convert absolute source URL -> local path. Returns null for non-cloneable URLs. */
export function toLocal(href: string): string | null {
  try {
    const u = new URL(href, ORIGIN);
    if (u.hostname !== ORIGIN_HOST) return null;
    const p = u.pathname;
    if (p === "/" || p.startsWith("/games/") || p.startsWith("/app/")) return p;
    if (p === "/ports/" || p === "/collections/" || p.startsWith("/collections/")) return p;
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

/**
 * Card anchors, both template generations:
 * - gen-2 (current, after the 2026-10 source redesign): `a.apk-games-card`
 *   (games/app listings), `a.apk-browse-card` (homepage panels + search
 *   results) and `a.apk-discovery__card` (detail-page related blocks).
 * - gen-1 (legacy): `a.mainb-item` (games) and `a.main-news` (apps), kept so
 *   an APO cache hit / rollback never blanks the site.
 */
const CARD_SEL =
  "a.apk-games-card, a.apk-browse-card, a.apk-discovery__card, a.mainb-item, a.main-news";
const CARD_TITLE_SEL =
  ".apk-games-card__title, .apk-browse-card__title, .apk-discovery__name, .mainb-title, .main-news-title";
const CARD_CAT_SEL = ".mainb-cat, .main-news-cat";

/** Parse cards under a root element, de-duplicated by id. */
function collectCards(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<never>
): ApkItem[] {
  const items: ApkItem[] = [];
  const seen = new Set<string>();
  root.find(CARD_SEL).each((_, el) => {
    const parsed = parseCard($, el);
    if (parsed && !seen.has(parsed.id)) {
      seen.add(parsed.id);
      items.push(parsed);
    }
  });
  return items.filter((i) => i.title && i.url);
}

function parseCards($: cheerio.CheerioAPI, scope?: string, opts?: { generic?: boolean }): ApkItem[] {
  const root = scope ? $(scope) : $("body");
  const known = collectCards($, root as cheerio.Cheerio<never>);
  if (known.length > 0 || !opts?.generic) return known;
  return walkPostCards($, root as cheerio.Cheerio<never>);
}

/* ------------------------- generic card fallback --------------------------- */

/**
 * Template-proof card walker: finds anchors to post URLs
 * (/(games|app)/…-<id>/) that look like cards (they carry an img or a
 * heading) and extracts title/icon/version/badges from whatever markup the
 * current — or next — source template uses. Powers new pages (/ports/,
 * /collections/<slug>/) whose card classes differ from the known selectors,
 * and acts as a safety net for future redesigns.
 */
const POST_PATH_RE = /^\/(games|app)\/(?:([\w-]+)\/)?[\w-]+-(\d+)\/$/;
const VERSION_LINE = /^(?:v\d[\w.\-+]*|\d+(?:\.\d+)+[\w.\-+]*)$/i;
const BADGE_WORD = /^(?:unlocked|full|premium|patched|update|launcher only|pro|god mode|no root|free shopping)$/i;

function isBadgeLine(l: string): boolean {
  if (/^mod\b/i.test(l)) return true;
  if (!l) return false;
  return l
    .split("•")
    .map((s) => clean(s))
    .filter(Boolean)
    .every((p) => BADGE_WORD.test(p));
}

function walkPostCards($: cheerio.CheerioAPI, root: cheerio.Cheerio<never>): CollectionGame[] {
  const out: CollectionGame[] = [];
  const seen = new Set<string>();
  root.find("a[href]").each((_, el) => {
    const a = $(el);
    const href = a.attr("href") || "";
    const local = toLocal(href);
    if (!local) return;
    const m = local.match(POST_PATH_RE);
    if (!m) return;
    const id = m[3];
    if (BLOCKED_IDS.has(id) || seen.has(id)) return;
    // must look like a card, not a plain text link (nav/breadcrumb/footer)
    const hasImg = a.find("img").length > 0;
    const titleEl = a.find("[class*='__title'], [class*='__name'], h1, h2, h3, h4, strong, b").first();
    if (!hasImg && titleEl.length === 0) return;

    const lines = linkLines(a.html() || "");
    let title = clean(titleEl.text()) || clean(a.find("img").first().attr("alt") || "");
    if (!title) {
      title =
        lines.find((l) => !VERSION_LINE.test(l) && !isBadgeLine(l) && !/^\d+$/.test(l) && !/ratings?$/i.test(l)) ||
        "";
    }
    if (!title) return;

    const textAll = clean(a.text());
    const ratingsM = textAll.match(/([\d.,]+)\s*ratings?/i);
    // "4.3" next to an "N ratings" label is a rating, not a version
    let rating = "";
    let ratingIdx = -1;
    if (ratingsM) {
      ratingIdx = lines.findIndex((l) => /^\d\.\d$/.test(l) && parseFloat(l) <= 5);
      if (ratingIdx >= 0) rating = lines[ratingIdx];
    }
    const version = lines.find((l, i) => i !== ratingIdx && l !== title && VERSION_LINE.test(l)) || "";
    const mod = lines.filter((l) => l !== title && l !== version && isBadgeLine(l)).join(" • ");

    seen.add(id);
    out.push({
      id,
      title,
      url: local,
      originalUrl: href.startsWith("http") ? href : `${ORIGIN}${local}`,
      icon: resolveCardIcon($, el),
      version,
      mod,
      genreSlug: m[2] || "",
      rating,
      ratings: ratingsM ? ratingsM[1] : "",
    });
  });
  return out;
}

/** IDs hidden from all listings (source-brand apps, etc). */
const BLOCKED_IDS = new Set(["131787"]); // "APKVision Store" app

function parseCard($: cheerio.CheerioAPI, el: unknown): ApkItem | null {
  const a = $(el as never);
  const href = a.attr("href") || "";
  const local = toLocal(href);
  if (!local) return null;
  // gen-2 cards carry the numeric id in data-game-id / data-browse-id
  const dataId = a.attr("data-game-id") || a.attr("data-browse-id") || "";
  const id = dataId || idFromHref(href, a.attr("id"));
  if (BLOCKED_IDS.has(id)) return null;
  // gen-1 category strip (also duplicates version/mod when present)
  const cats = a
    .find(CARD_CAT_SEL)
    .map((_, c) => clean($(c).text()))
    .get()
    .filter(Boolean);
  // gen-2 explicit fields
  const edition = clean(
    a.find(".apk-games-card__edition, .apk-browse-card__badge, [class*='__edition'], [class*='__badge']").first().text()
  );
  let version = clean(
    a.find(".apk-games-card__version, .apk-browse-card__version, [class*='__version']").first().text()
  );
  if (!version) version = cats[0] || "";
  const mod = edition || cats.slice(1).join(" • ");
  return {
    id,
    title:
      clean(a.find(CARD_TITLE_SEL).first().text()) ||
      clean(a.attr("title") || "") ||
      clean(a.find("img").first().attr("alt") || ""),
    url: local,
    originalUrl: href.startsWith("http") ? href : `${ORIGIN}${local}`,
    // lazy-aware: never the 1x1 placeholder left in `src` (see resolveCardIcon)
    icon: resolveCardIcon($, el),
    version,
    mod,
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

  // gen-2 home template: each panel is a <section data-home-panel="..."> with
  // an h3.apk-home-panel-title, a .apk-home-card-track of browse cards and a
  // .apk-home-tab-more "View all ..." link. Games panel titles read plain
  // ("New", "Popular"); app panels say "New apps" or get an "(Apps)" suffix so
  // two panels never render under the same heading.
  $("[data-home-panel]").each((_, panel) => {
    const p = $(panel);
    const heading = clean(p.find(".apk-home-panel-title").first().text());
    if (!heading) return;
    const isApps = /apps/i.test(clean(p.closest("section").find("h2").first().text()));
    const title = isApps && !/apps/i.test(heading) ? `${heading} (Apps)` : heading;
    const more = p.find(".apk-home-tab-more a").first();
    const items = collectCards($, p as cheerio.Cheerio<never>);
    if (items.length > 0) {
      sections.push({
        title,
        moreUrl: toLocal(more.attr("href") || "") || "",
        moreLabel: clean(more.text()) || "More",
        items,
      });
    }
  });

  // gen-1 fallback (legacy .mainb blocks)
  if (sections.length === 0) {
    $(".mainb").each((_, block) => {
      const b = $(block);
      const title = clean(b.find(".mainb-main-title").first().text());
      if (!title) return;
      const more = b.find("a.mainb-seemore").first();
      const moreHref = more.attr("href") || "";
      const items = collectCards($, b as cheerio.Cheerio<never>);
      if (items.length > 0) {
        sections.push({
          title,
          moreUrl: toLocal(moreHref) || "",
          moreLabel: clean(more.text()) || "More",
          items,
        });
      }
    });
  }
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

/* ------------------------------ android ports ------------------------------ */

/**
 * Android Ports catalog (source: /ports/, paginated /ports/page/N/, 15 per
 * page with a "Load More" link to the next page and a "Port catalog <N>"
 * counter in the header — the only reliable source for totalPages).
 */
export async function getPorts(page: number): Promise<PagedResult> {
  const path = page > 1 ? `/ports/page/${page}/` : "/ports/";
  const html = await fetchHtmlOrNull(path);
  if (html === null) return { items: [], page, totalPages: page, title: "Android Ports", total: 0 };
  const $ = cheerio.load(html);
  const items = parseCards($, undefined, { generic: true });
  const countM = clean($("body").text()).match(/port catalog\D{0,24}?(\d[\d,]*)/i);
  const total = countM ? parseInt(countM[1].replace(/,/g, ""), 10) : 0;
  const perPage = page === 1 && items.length > 0 ? items.length : 15;
  let totalPages = Math.max(parseTotalPages($), page);
  if (total > 0) totalPages = Math.max(Math.ceil(total / perPage), page);
  else if (items.length >= 15) totalPages = Math.max(totalPages, page + 1);
  return { items, page, totalPages, title: clean($("h1").first().text()) || "Android Ports", total };
}

/* ------------------------------- collections ------------------------------- */

const COLLECTION_PATH_RE = /^\/collections\/([\w-]+)\/$/;

/** Collections archive (source: /collections/) — one card per collection. */
export async function getCollections(): Promise<CollectionSummary[]> {
  const html = await fetchHtmlOrNull("/collections/");
  if (!html) return [];
  const $ = cheerio.load(html);
  const out: CollectionSummary[] = [];
  const seen = new Set<string>();
  $("a[href]").each((_, el) => {
    const a = $(el);
    const local = toLocal(a.attr("href") || "");
    const m = local?.match(COLLECTION_PATH_RE);
    if (!m) return;
    const slug = m[1];
    if (seen.has(slug)) return;
    const icons: string[] = [];
    a.find("img").each((_, im) => {
      const u = resolveImgEl($, im);
      if (u && !icons.includes(u)) icons.push(u);
    });
    // a card carries preview icons; a bare nav/menu text link doesn't
    if (icons.length === 0) return;
    const countM = clean(a.text()).match(/(\d+)\s+games?/i);
    let title = clean(a.find("[class*='__title'], [class*='card-title'], h1, h2, h3, h4, strong, b").first().text());
    if (!title) {
      const lines = linkLines(a.html() || "").filter(
        (l) => !/^\d+\s+games?$/i.test(l) && !/^view (more|all)/i.test(l)
      );
      title = lines[0] || slug.replace(/-/g, " ");
    }
    seen.add(slug);
    out.push({
      slug,
      title,
      url: local as string,
      count: countM ? parseInt(countM[1], 10) : 0,
      icons: icons.slice(0, 4),
    });
  });
  return out;
}

/**
 * One collection (source: /collections/<slug>/) — a ranked list of games.
 * Rank = document order. Entries are read from the main content first so
 * header/sidebar widgets never pollute the ranking.
 */
export async function getCollectionDetail(slug: string): Promise<CollectionDetail | null> {
  if (!/^[\w-]+$/.test(slug)) return null;
  const html = await fetchHtmlOrNull(`/collections/${slug}/`, DETAIL_REVALIDATE);
  if (!html) return null;
  const $ = cheerio.load(html);
  const title =
    clean($("h1").first().text()) ||
    clean($('meta[property="og:title"]').attr("content") || "") ||
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  const description = capText(
    clean($('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || ""),
    320
  );
  let items: CollectionGame[] = [];
  for (const scope of ["main", "article", "[class*='collection']", "body"]) {
    const root = $(scope).first();
    if (!root.length) continue;
    items = walkPostCards($, root as cheerio.Cheerio<never>);
    if (items.length > 0) break;
  }
  const countM = clean($("body").text()).match(/games in this collection\D{0,12}?(\d+)/i);
  return {
    slug,
    title,
    description,
    count: countM ? parseInt(countM[1], 10) : items.length,
    items: items.slice(0, 100),
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
    // Clone first: never strip script/style out of the shared document, and
    // never let an unclosed <a> leak the rest of the page into the label.
    const { label, size } = downloadLabel($(el as never).clone().html() || "");
    downloads.push({
      url: href.startsWith("http") ? href : `${ORIGIN}${href}`,
      localUrl: toLocalDownload(href) || "",
      label,
      size,
    });
  });

  // Screenshots live on the img.* CDN and are lazy-loaded too — resolve the
  // real URL from data-*/srcset instead of trusting `src`. In dev (custom
  // SOURCE_ORIGIN) the mock serves shots from the same host, so allow it too.
  const screenshots: string[] = [];
  const seenShot = new Set<string>();
  const customOrigin = ORIGIN !== "https://apkvision.org";
  $("img").each((_, el) => {
    const src = resolveImgEl($, el);
    if (!src) return;
    let host = "";
    try {
      host = new URL(src).hostname;
    } catch {
      return;
    }
    const okHost = host === "img.apkvision.org" || (customOrigin && host === ORIGIN_HOST);
    if (!okHost || seenShot.has(src)) return;
    seenShot.add(src);
    screenshots.push(src);
  });

  const ratingMatch = html.match(/(\d+\.\d+)\/5\s*\((\d+)\s*votes\)/);
  const workMatch = html.match(/js-version-votes_percent[^>]*>\s*(\d+%)\s*</);
  const voicesMatch = html.match(/Voices:\s*<span[^>]*>\s*(\d+)\s*<\/span>/);

  const ogImage = $('meta[property="og:image"]').attr("content") || "";
  const cats = $(".mainb-cat")
    .map((_, c) => clean($(c).text()))
    .get();
  const icon = normalizeImageUrl(ogImage) || screenshots[0] || "";

  return {
    id: String(post.id),
    title: clean($(".ver-top-h1 h1").first().text().replace(/\s+APK$/i, "")) || clean(post.title.rendered),
    url: localPath,
    originalUrl: post.link,
    icon,
    version: verTop[0] || cats[0] || "",
    mod: verTop.slice(1).join(" • "),
    descriptionHtml: post.content.rendered,
    info,
    googlePlayUrl,
    downloads,
    screenshots: screenshots.filter((s) => s !== icon),
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
        // a run-on line (minified markup) must not become a paragraph
        return capText(decodeEntities(value), 100);
      }
    }
    return "";
  };

  // Only ever a real file name — the "Filename:" row can carry the rest of the
  // page's text when the source's markup runs together.
  const FILENAME_RE = /[\w.+\-]+\.(?:apk|xapk|apks)/i;
  const filenameRow = row("Filename");
  const filenameMatch = filenameRow.match(FILENAME_RE);
  const filename =
    (filenameMatch ? decodeEntities(filenameMatch[0]) : "") ||
    decodeURIComponent(fileUrl.split("/").pop() || "");

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
    version: row("Version") || version,
    arch: row("Processor") || row("Architecture") || row("Arch"),
    size: row("Size"),
    sourceUrl,
    telegram,
  };
}

/** Related/popular items parsed from a detail page (discovery block). */
export async function getRelated(localPath: string): Promise<ApkItem[]> {
  try {
    const html = await fetchHtml(localPath.endsWith("/") ? localPath : `${localPath}/`, DETAIL_REVALIDATE);
    const $ = cheerio.load(html);

    // gen-2 detail template: tabbed .apk-discovery section, panels
    // similar -> popular -> hot. "Similar" is the best match for a related
    // row, so prefer it and fall back to the other panels.
    let panel = $("#apk-discovery-panel-similar");
    if (!panel.length) panel = $("#apk-discovery-panel-popular");
    if (!panel.length) panel = $("section.apk-discovery .apk-discovery__panel").first();
    if (panel.length) {
      return collectCards($, panel as cheerio.Cheerio<never>).slice(0, 12);
    }

    // gen-1 fallback: legacy .mainb block titled "popular"
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
