import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Layers, Sparkles, Star } from "lucide-react";
import { getCollectionDetail } from "@/lib/source";
import { genreName } from "@/lib/genres";
import type { CollectionGame } from "@/lib/types";
import ApkIcon from "@/components/ApkIcon";
import Breadcrumbs from "@/components/Breadcrumbs";
import Reveal from "@/components/Reveal";

export const revalidate = 1800;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = await getCollectionDetail(slug).catch(() => null);
  if (!d) return { title: "Collection not found" };
  const desc =
    d.description ||
    `${d.title} — a curated collection of ${d.count || d.items.length} Android games on TiyanzVision.`;
  return {
    title: d.title,
    description: desc,
    alternates: { canonical: `/collections/${slug}/` },
    openGraph: {
      title: d.title,
      description: desc,
      url: `/collections/${slug}/`,
      type: "article",
      images: d.items[0]?.icon ? [{ url: d.items[0].icon, alt: d.title }] : undefined,
    },
    twitter: { card: "summary", title: d.title, description: desc },
  };
}

function RankBadge({ rank }: { rank: number }) {
  const top = rank <= 3;
  return (
    <span
      className={`w-8 shrink-0 text-center font-display text-xl font-black sm:text-2xl ${
        top
          ? "bg-gradient-to-b from-neon to-aqua bg-clip-text text-transparent text-glow-green"
          : "text-slate-600"
      }`}
    >
      {rank}
    </span>
  );
}

function GameRow({ g, rank }: { g: CollectionGame; rank: number }) {
  const kind = g.url.startsWith("/app/") ? "app" : "games";
  return (
    <Link
      href={g.url}
      className="card-neon group relative flex items-center gap-3 overflow-hidden rounded-2xl p-3 sm:gap-4 sm:p-4"
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 w-[3px] origin-top scale-y-0 bg-gradient-to-b from-neon to-royal transition-transform duration-300 group-hover:scale-y-100" />
      <RankBadge rank={rank} />
      <ApkIcon
        src={g.icon}
        title={g.title}
        width={64}
        height={64}
        className="h-14 w-14 shrink-0 rounded-2xl border border-white/10 object-cover text-xl font-bold transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-16"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-sm font-bold text-slate-100 transition group-hover:text-neon sm:text-base">
          {g.title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          {g.genreSlug && (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
              {genreName(kind, g.genreSlug)}
            </span>
          )}
          {g.version && <span className="text-xs font-medium text-aqua">{g.version}</span>}
          {g.mod && (
            <span className="chip-mod inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
              <Sparkles className="h-3 w-3" />
              {g.mod}
            </span>
          )}
        </span>
      </span>
      {g.rating && (
        <span className="shrink-0 text-right">
          <span className="flex items-center justify-end gap-1 font-display text-sm font-bold text-neon">
            <Star className="h-4 w-4 fill-neon text-neon drop-shadow-[0_0_6px_rgba(34,255,136,0.8)]" />
            {g.rating}
          </span>
          {g.ratings && <span className="mt-0.5 block text-[11px] text-slate-500">{g.ratings} ratings</span>}
        </span>
      )}
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-neon" />
    </Link>
  );
}

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;
  const d = await getCollectionDetail(slug).catch(() => null);
  if (!d || d.items.length === 0) notFound();

  return (
    <div className="pb-4">
      <Breadcrumbs items={[{ label: "Collections", href: "/collections/" }, { label: d.title }]} />

      <Reveal>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-3 font-display text-2xl font-black leading-tight sm:text-3xl">
              <span className="h-9 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-neon to-royal shadow-[0_0_16px_rgba(34,255,136,0.6)]" />
              {d.title}
            </h1>
            {d.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{d.description}</p>}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-neon/10 px-4 py-1.5 text-xs font-bold text-neon">
            <Layers className="h-3.5 w-3.5" />
            {d.count || d.items.length} games in this collection
          </span>
        </div>
      </Reveal>

      <ol className="space-y-3">
        {d.items.map((g, i) => (
          <li key={g.id}>
            <GameRow g={g} rank={i + 1} />
          </li>
        ))}
      </ol>
    </div>
  );
}
