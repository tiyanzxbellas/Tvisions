/**
 * Parser for the "file info" block on the source's download page
 * (`Filename: … / Version: … / Processor: … / Size: …`).
 *
 * The source page is minified, so everything that follows the last label can
 * sit on one huge line. A naive "take the rest of the line" scrape then pulled
 * the rest of the page — download button, FAQ, footer — into the *Size* value,
 * which ended up inside the "Download APK — <size>" button label.
 *
 * So every value is matched by *shape* (a size, a filename, a version, a short
 * token) and anything longer than MAX_VALUE that doesn't match its shape is
 * dropped instead of being rendered.
 *
 * Import-free on purpose (pure string work) so it can be unit-tested from
 * plain Node — see `scripts/check-file-meta.mjs`.
 */

/** Longest value we trust — anything longer is leaked page prose. */
const MAX_VALUE = 64;

/** Labels that terminate a value when the page packs several on one line. */
const NEXT_LABEL = /\s+(?:Filename|Version|Processor|Architecture|Arch|Size|Updated)\s*:/i;

/** Strict value shapes. A long value without a shape match is not metadata. */
const SHAPES: Record<string, RegExp> = {
  Filename: /[\w.+-]+\.(?:apk|xapk|apks|apkm|obb|zip|rar|7z)/i,
  Version: /v?\d[\w.+-]{0,24}/,
  Size: /\d[\d.,]*\s*(?:GB|MB|KB|TB|B)\b/i,
};

function squash(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function entities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'");
}

export interface FileMeta {
  filename: string;
  version: string;
  /** CPU/ABI the file is built for, e.g. `arm64-v8a`. */
  arch: string;
  size: string;
}

/**
 * Read `Filename` / `Version` / `Processor` / `Size` from a download page's
 * raw HTML. Missing or unparseable fields come back as empty strings.
 */
export function parseFileMeta(html: string): FileMeta {
  const plain = html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ");

  const lines = plain.split("\n").map(squash).filter(Boolean);

  /** Text after `Label:`, cut at the next label (so it never spans the page). */
  const rawRow = (label: string): string => {
    const re = new RegExp(`(?<![\\w-])${label}\\s*:\\s*(.+)`, "i");
    for (const line of lines) {
      const m = line.match(re);
      if (!m) continue;
      const value = squash(entities(m[1].split(NEXT_LABEL)[0]));
      if (value) return value;
    }
    return "";
  };

  /** Shaped value when possible, otherwise the raw one if it is short enough. */
  const row = (label: string): string => {
    const raw = rawRow(label);
    if (!raw) return "";
    const shape = SHAPES[label];
    const shaped = shape ? shape.exec(raw) : null;
    if (shaped) return squash(entities(shaped[0]));
    return raw.length <= MAX_VALUE ? raw : "";
  };

  return {
    filename: row("Filename"),
    version: row("Version"),
    arch: row("Processor") || row("Architecture") || row("Arch"),
    size: row("Size"),
  };
}
