import { ORIGIN } from "@/lib/source";

export const dynamic = "force-dynamic";

// Lets the download button stream the APK through our own domain instead of
// linking straight to the source CDN. This is OPTIONAL and OFF by default —
// production keeps the direct-CDN behavior (Option A). Set USE_APK_PROXY=1
// (e.g. in this offline sandbox preview) to route file bytes through us.
//
// The route is intentionally NOT an open proxy: `src` must resolve to the
// source origin or a subdomain of it (e.g. dl.apkvision.org / 127.0.0.1:8931).

function allowedHost(): string {
  try {
    return new URL(ORIGIN).hostname;
  } catch {
    return "";
  }
}

function isAllowed(src: string): boolean {
  try {
    const host = new URL(src).hostname.toLowerCase();
    const base = allowedHost().toLowerCase();
    if (!base) return false;
    return host === base || host.endsWith(`.${base}`);
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const src = searchParams.get("src");
  if (!src) return new Response("Missing src", { status: 400 });
  if (!isAllowed(src)) return new Response("Blocked origin", { status: 403 });

  let up: Response;
  try {
    up = await fetch(src, { headers: { "User-Agent": "Mozilla/5.0 TiyanzVision" } });
  } catch {
    return new Response("Upstream fetch failed", { status: 502 });
  }
  if (!up.ok || !up.body) return new Response("Upstream error", { status: up.status });

  const filename = decodeURIComponent(src.split("/").pop() || "download.apk");
  const headers = new Headers();
  const ct = up.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  const cl = up.headers.get("content-length");
  if (cl) headers.set("content-length", cl);
  headers.set("content-disposition", `attachment; filename="${filename}"`);
  headers.set("cache-control", "private, max-age=0");

  return new Response(up.body, { status: 200, headers });
}
