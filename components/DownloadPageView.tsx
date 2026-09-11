import Link from "next/link";
import Image from "next/image";
import { Download, FileBox, HardDrive, Cpu, Tag, AlertTriangle, ExternalLink, ChevronLeft } from "lucide-react";
import type { ApkDetail, ApkDownloadFile } from "@/lib/types";
import Breadcrumbs from "./Breadcrumbs";
import Reveal from "./Reveal";
import TelegramDownloadButton from "./TelegramDownloadButton";

interface Props {
  id: string;
  version: string;
  detail: ApkDetail | null;
  file: ApkDownloadFile | null;
  detailUrl: string;
  /** Source download-page URL (fallback when the file can't be resolved) */
  fallbackUrl: string;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-3 text-sm last:border-0">
      <dt className="flex shrink-0 items-center gap-2 font-bold uppercase tracking-wide text-slate-500 text-xs">
        {icon}
        {label}
      </dt>
      <dd className="truncate text-right font-semibold text-slate-100">{value}</dd>
    </div>
  );
}

export default function DownloadPageView({ id, version, detail, file, detailUrl, fallbackUrl }: Props) {
  const title = detail?.title || (file ? file.filename.replace(/\.apk$/i, "") : `APK ${id}`);
  const ver = file?.version || version;
  const available = Boolean(file?.fileUrl);
  // Optional: stream the file through our own domain (/api/apk). Off by default
  // — production links straight to the source CDN file.
  const downloadHref =
    file?.fileUrl && process.env.USE_APK_PROXY === "1"
      ? `/api/apk?src=${encodeURIComponent(file.fileUrl)}`
      : file?.fileUrl || "#";

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <Breadcrumbs
        items={[
          { label: title, href: detailUrl },
          { label: `Download ${ver}` },
        ]}
      />

      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-neon/25 bg-gradient-to-br from-panel2 to-panel">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-neon/15 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-royal/25 blur-[100px]" />

          <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
            {detail?.icon ? (
              <div className="relative mx-auto shrink-0 sm:mx-0">
                <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-br from-neon/50 to-royal/50 blur-lg" />
                <Image
                  src={detail.icon}
                  alt={title}
                  width={112}
                  height={112}
                  priority
                  className="relative h-28 w-28 rounded-3xl border border-white/20 object-cover"
                />
              </div>
            ) : (
              <div className="relative mx-auto grid h-28 w-28 shrink-0 place-items-center rounded-3xl border border-white/20 bg-white/5 font-display text-4xl font-black text-neon sm:mx-0">
                {title.charAt(0)}
              </div>
            )}

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Download ready</p>
              <h1 className="mt-1 font-display text-2xl font-black leading-tight sm:text-3xl">
                {title} <span className="text-slate-500">APK</span>
              </h1>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {ver && (
                  <span className="rounded-full border border-aqua/50 bg-aqua/10 px-3 py-1 text-sm font-bold text-aqua">
                    {ver}
                  </span>
                )}
                {detail?.mod ? (
                  <span className="chip-mod rounded-full px-3 py-1 text-sm font-bold">{detail.mod}</span>
                ) : (
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-bold text-slate-400">
                    Original
                  </span>
                )}
                {detail?.rating && (
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-bold text-slate-300">
                    ★ {detail.rating}/5
                  </span>
                )}
              </div>
            </div>
          </div>

          {available && file ? (
            <div className="relative space-y-3 p-5 pt-0 sm:p-6 sm:pt-0">
              {/* file info card */}
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-void/50">
                <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.03] px-5 py-3">
                  <FileBox className="h-4 w-4 text-neon" />
                  <span className="break-all font-display text-sm font-bold">{file.filename}</span>
                </div>
                <dl className="grid sm:grid-cols-2">
                  <InfoRow icon={<Tag className="h-3.5 w-3.5" />} label="Version" value={file.version} />
                  <InfoRow icon={<HardDrive className="h-3.5 w-3.5" />} label="Size" value={file.size} />
                  <InfoRow icon={<Cpu className="h-3.5 w-3.5" />} label="Processor" value={file.arch} />
                </dl>
              </div>

              {/* the big button — straight to the file, no source countdown */}
              <a
                href={downloadHref}
                className="btn-neon flex w-full items-center justify-center gap-3 rounded-xl px-6 py-4"
              >
                <Download className="h-6 w-6" strokeWidth={2.5} />
                <span className="font-display text-lg font-bold">
                  Download APK{file.size ? ` — ${file.size}` : ""}
                </span>
              </a>

              {/* Telegram bot alternative — same file, deep-links straight into
                  Telegram (token via /api/tg), like the button on the source site */}
              {file.telegram && <TelegramDownloadButton filePath={file.telegram.filePath} />}
            </div>
          ) : (
            <div className="relative space-y-3 p-5 pt-0 sm:p-6 sm:pt-0">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/5 px-6 py-10 text-center">
                <AlertTriangle className="h-10 w-10 text-amber-400" />
                <p className="font-display text-lg font-bold">Download link belum tersedia</p>
                <p className="max-w-md text-sm text-slate-400">
                  Link untuk versi <b className="text-slate-200">{ver}</b> masih belum siap di server source.
                  Coba lagi dalam beberapa menit, atau buka halaman source untuk update terbaru.
                </p>
                <a
                  href={fallbackUrl}
                  target="_blank"
                  rel="nofollow noopener"
                  className="btn-ghost-blue flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
                >
                  Buka halaman source
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          <div className="relative flex justify-center p-5 pt-0 sm:p-6 sm:pt-0">
            <Link
              href={detailUrl}
              className="btn-ghost-blue flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold"
            >
              <ChevronLeft className="h-4 w-4" />
              Kembali ke halaman {title}
            </Link>
          </div>
        </div>
      </Reveal>

      {/* related games */}
      {detail && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold">Download lain yang populer</h2>
          <p className="mt-1 text-sm text-slate-500">
            Mau coba game lain? Kembali ke{" "}
            <Link href="/games/" className="text-aqua hover:underline">
              daftar games
            </Link>{" "}
            atau{" "}
            <Link href="/app/" className="text-aqua hover:underline">
              apps
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
