import Link from "next/link";
import { Download, ExternalLink, HardDrive, ShieldCheck, Play, ChevronRight } from "lucide-react";
import type { DownloadLink } from "@/lib/types";

interface Props {
  title: string;
  version: string;
  mod: string;
  downloads: DownloadLink[];
  googlePlayUrl: string;
  workPercent: string;
  workVoices: string;
}

export default function DownloadSection({ title, version, mod, downloads, googlePlayUrl, workPercent, workVoices }: Props) {
  return (
    <div id="download" className="mt-8 scroll-mt-24 overflow-hidden rounded-2xl border border-neon/25 bg-gradient-to-br from-panel2 to-panel">
      <div className="flex items-center gap-3 border-b border-white/5 bg-neon/5 px-5 py-4">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-neon to-aqua shadow-[0_0_24px_rgba(34,255,136,0.45)]">
          <Download className="h-6 w-6 text-void" strokeWidth={2.5} />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold leading-tight">
            Download {title} APK <span className="text-neon">free</span>
          </h2>
          <p className="text-sm text-slate-400">
            {[version, mod].filter(Boolean).join(" • ") || "Latest version"}
          </p>
        </div>
        {workPercent && (
          <span className="ml-auto hidden items-center gap-2 rounded-full border border-neon/40 bg-neon/10 px-4 py-1.5 text-sm font-bold text-neon sm:flex">
            <ShieldCheck className="h-4 w-4" />
            Works? {workPercent}
            {workVoices && <span className="font-normal text-slate-400">({workVoices} votes)</span>}
          </span>
        )}
      </div>

      <div className="space-y-3 p-5">
        {downloads.length === 0 && (
          <p className="text-sm text-slate-400">Download links are being prepared — please check the original page.</p>
        )}
        {downloads.map((d, i) =>
          d.localUrl ? (
            <Link
              key={i}
              href={d.localUrl}
              className="btn-neon flex items-center gap-4 rounded-xl px-5 py-4"
            >
              <Download className="h-7 w-7 shrink-0" strokeWidth={2.5} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display font-bold">
                  {d.label || `Download ${title} ${version}`}
                </span>
                <span className="flex items-center gap-2 text-xs font-semibold opacity-80">
                  <HardDrive className="h-3.5 w-3.5" />
                  {d.size ? `${d.size} • ` : ""}APK • Android
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0" />
            </Link>
          ) : (
            <a
              key={i}
              href={d.url}
              target="_blank"
              rel="nofollow noopener"
              className="btn-neon flex items-center gap-4 rounded-xl px-5 py-4"
            >
              <Download className="h-7 w-7 shrink-0" strokeWidth={2.5} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display font-bold">
                  {d.label || `Download ${title} ${version}`}
                </span>
                <span className="flex items-center gap-2 text-xs font-semibold opacity-80">
                  <HardDrive className="h-3.5 w-3.5" />
                  {d.size ? `${d.size} • ` : ""}APK • Android
                </span>
              </span>
              <ExternalLink className="h-5 w-5 shrink-0" />
            </a>
          )
        )}

        {googlePlayUrl && (
          <a
            href={googlePlayUrl}
            target="_blank"
            rel="nofollow noopener"
            className="btn-ghost-blue flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold"
          >
            <Play className="h-4 w-4" />
            Get it on Google Play
          </a>
        )}
        <p className="text-center text-xs text-slate-500">
          Files are not hosted on this site — downloads are served by the original source files.
        </p>
      </div>
    </div>
  );
}
