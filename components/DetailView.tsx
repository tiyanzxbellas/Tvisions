import Image from "next/image";
import Link from "next/link";
import { Star, Download, CalendarClock, User, Package, ChevronRight, Info, FileText } from "lucide-react";
import type { ApkDetail, ApkItem } from "@/lib/types";
import Breadcrumbs from "./Breadcrumbs";
import Screenshots from "./Screenshots";
import DownloadSection from "./DownloadSection";
import SectionBlock from "./SectionBlock";
import Reveal from "./Reveal";

function Stars({ rating }: { rating: string }) {
  const val = parseFloat(rating) || 0;
  return (
    <span className="flex items-center gap-0.5" title={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= Math.round(val) ? "fill-neon text-neon drop-shadow-[0_0_6px_rgba(34,255,136,0.8)]" : "text-slate-700"}`}
        />
      ))}
    </span>
  );
}

export default function DetailView({
  detail,
  related,
  kindLabel,
  kindPath,
}: {
  detail: ApkDetail;
  related: ApkItem[];
  kindLabel: string;
  kindPath: string;
}) {
  return (
    <div className="pb-4">
      <Breadcrumbs
        items={[
          { label: kindLabel, href: kindPath },
          ...(detail.genreUrl
            ? [{ label: detail.genreName || "Genre", href: detail.genreUrl }]
            : []),
          { label: detail.title },
        ]}
      />

      {/* ------------------------------ header card ----------------------------- */}
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-panel2 to-panel p-5 sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-neon/15 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-royal/25 blur-[100px]" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative mx-auto shrink-0 sm:mx-0">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-neon/50 to-royal/50 blur-lg" />
              {detail.icon ? (
                <Image
                  src={detail.icon}
                  alt={detail.title}
                  width={160}
                  height={160}
                  priority
                  className="relative h-36 w-36 rounded-3xl border border-white/20 object-cover sm:h-40 sm:w-40"
                />
              ) : (
                <div className="relative grid h-36 w-36 place-items-center rounded-3xl bg-white/5 font-display text-5xl font-black text-neon sm:h-40 sm:w-40">
                  {detail.title.charAt(0)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="font-display text-2xl font-black leading-tight sm:text-4xl">
                {detail.title} <span className="text-slate-500">APK</span>
              </h1>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {detail.version && (
                  <span className="rounded-full border border-aqua/50 bg-aqua/10 px-3 py-1 text-sm font-bold text-aqua">
                    {detail.version}
                  </span>
                )}
                {detail.mod ? (
                  <span className="chip-mod rounded-full px-3 py-1 text-sm font-bold">{detail.mod}</span>
                ) : (
                  <span className="rounded-full border border-white/15 px-3 py-1 text-sm font-bold text-slate-400">
                    Original
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-400 sm:justify-start">
                {detail.rating && (
                  <span className="flex items-center gap-2">
                    <Stars rating={detail.rating} />
                    <b className="text-slate-100">{detail.rating}/5</b>
                    {detail.ratingVotes && <span>({detail.ratingVotes} votes)</span>}
                  </span>
                )}
                {detail.updated && (
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4 text-neon" />
                    {detail.updated}
                  </span>
                )}
                {detail.developer && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-neon" />
                    {detail.developer}
                  </span>
                )}
                {detail.packageName && (
                  <span className="hidden items-center gap-1.5 lg:flex">
                    <Package className="h-4 w-4 text-neon" />
                    {detail.packageName}
                  </span>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a href="#download" className="btn-neon flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 font-display font-bold">
                  <Download className="h-5 w-5" strokeWidth={2.5} />
                  Download APK
                </a>
                {detail.genreUrl && (
                  <Link
                    href={detail.genreUrl}
                    className="btn-ghost-blue flex items-center justify-center gap-1 rounded-xl px-6 py-3.5 font-display font-bold"
                  >
                    More {detail.genreName}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ------------------------------- info table ------------------------------ */}
      {detail.info.length > 0 && (
        <Reveal className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.03] px-5 py-3 font-display font-bold">
            <Info className="h-4 w-4 text-aqua" />
            App Info
          </div>
          <dl className="grid sm:grid-cols-2">
            {detail.info.map((row, i) => (
              <div
                key={i}
                className={`flex items-center justify-between gap-4 px-5 py-3 text-sm ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}
              >
                <dt className="shrink-0 font-bold uppercase tracking-wide text-slate-500 text-xs">{row.label}</dt>
                <dd className="truncate text-right font-semibold text-slate-100">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      )}

      {/* ------------------------------- description ----------------------------- */}
      <Reveal className="mt-6 rounded-2xl border border-white/10 bg-panel/60 p-5 sm:p-7">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <FileText className="h-5 w-5 text-neon" />
          About {detail.title}
        </h2>
        <div
          className="prose-neon text-[15px]"
          dangerouslySetInnerHTML={{ __html: detail.descriptionHtml }}
        />
      </Reveal>

      <Screenshots images={detail.screenshots} title={detail.title} />

      <DownloadSection
        title={detail.title}
        version={detail.version}
        mod={detail.mod}
        downloads={detail.downloads}
        googlePlayUrl={detail.googlePlayUrl}
        workPercent={detail.workPercent}
        workVoices={detail.workVoices}
      />

      {related.length > 0 && (
        <SectionBlock title="Popular Games" moreUrl="/popular-games/" moreLabel="More Popular" items={related.slice(0, 8)} />
      )}
    </div>
  );
}
