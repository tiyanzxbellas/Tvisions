"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

/**
 * "Download from Telegram Bot" — works exactly like the button on the source
 * site: fetches a one-time bot token for `filePath` via /api/tg, then opens
 * the bot deep link (t.me/ApkDownload24Bot?start=...) so the file is
 * delivered inside Telegram. Never navigates to apkvision.org.
 */
export default function TelegramDownloadButton({ filePath }: { filePath: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleClick() {
    if (status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/tg/?file=${encodeURIComponent(filePath)}`);
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "token failed");
      window.open(data.url, "_blank", "noopener");
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className="btn-telegram flex w-full items-center justify-center gap-3 rounded-xl px-6 py-4 disabled:opacity-70"
      >
        {status === "loading" ? (
          <Loader2 className="h-6 w-6 shrink-0 animate-spin" strokeWidth={2.5} />
        ) : (
          <Send className="h-6 w-6 shrink-0" strokeWidth={2.5} />
        )}
        <span className="font-display text-base font-bold leading-tight sm:text-lg">
          {status === "loading" ? "Menghubungi bot Telegram…" : "Download from Telegram Bot"}
        </span>
      </button>
      {status === "error" && (
        <p className="-mt-1 text-center text-xs font-semibold text-red-400">
          Gagal menghubungi bot Telegram — ketuk tombolnya untuk coba lagi.
        </p>
      )}
    </>
  );
}
