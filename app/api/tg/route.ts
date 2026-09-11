import { ORIGIN } from "@/lib/source";

export const dynamic = "force-dynamic";

/**
 * Telegram-bot deep link for a download, exactly like the button on the
 * source site — without ever sending the user to apkvision.org.
 *
 * Flow (mirrors the source's inline `generateToken(filePath)` JS):
 *   1. Client calls GET /api/tg?file=<dir/file.apk> (filePath parsed from the
 *      source download page's `onclick="generateToken('...')"`).
 *   2. We POST {file_name, secret} to the source's /generate_token.php
 *      (server-side, so no CORS problem) and get a one-time {token}.
 *   3. We return the bot deep link
 *      https://telegram.me/ApkDownload24Bot?start=<token> which the client
 *      opens — the bot then delivers the file inside Telegram.
 *
 * The `secret` below is public — it's embedded in the source site's own
 * page JS. `file` is strictly validated (relative .apk/.xapk/.apks path
 * only) so this endpoint can't be abused as an open proxy.
 */

const SECRET = process.env.TG_TOKEN_SECRET || "zI7sDzI7sD6fid3432454qQ4u6qQ4u";
const BOT = "ApkDownload24Bot";

function validFile(f: string): boolean {
  if (!f || f.length > 300) return false;
  if (f.includes("..") || f.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(f)) return false;
  return /^[\w][\w.\-+/% ]{0,280}\.(apk|xapk|apks)$/i.test(f);
}

async function requestToken(fileName: string): Promise<string> {
  const res = await fetch(`${ORIGIN}/generate_token.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      Referer: `${ORIGIN}/`,
    },
    body: JSON.stringify({ file_name: fileName, secret: SECRET }),
  });
  if (!res.ok) throw new Error(`token endpoint: ${res.status}`);
  const data = (await res.json()) as { token?: string; error?: string };
  if (!data.token) throw new Error(data.error || "no token");
  return data.token;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const file = (searchParams.get("file") || "").trim();
  if (!validFile(file)) {
    return Response.json({ error: "Invalid file parameter" }, { status: 400 });
  }

  try {
    let token = "";
    try {
      token = await requestToken(file);
    } catch {
      // Retry with URL-decoded variant (CDN hrefs are percent-encoded while
      // the token server may expect the raw filename, or vice versa).
      const decoded = (() => {
        try {
          return decodeURIComponent(file);
        } catch {
          return "";
        }
      })();
      if (!decoded || decoded === file) throw new Error("token failed");
      token = await requestToken(decoded);
    }
    return Response.json({
      url: `https://telegram.me/${BOT}?start=${encodeURIComponent(token)}`,
    });
  } catch {
    return Response.json(
      { error: "Gagal menghubungi bot Telegram, coba lagi." },
      { status: 502 }
    );
  }
}
