import { notFound } from "next/navigation";
import { GAME_GENRES, APP_CATS, genreName } from "@/lib/genres";
import { getListing } from "@/lib/source";
import Breadcrumbs from "./Breadcrumbs";
import GenreNav from "./GenreNav";
import ListingGrid from "./ListingGrid";
import Pagination from "./Pagination";
import Reveal from "./Reveal";

interface Props {
  kind: "games" | "app";
  genre: string | null;
  page: number;
}

export default async function CatalogListing({ kind, genre, page }: Props) {
  const data = await getListing(kind, genre, page);
  if (data.items.length === 0) notFound();
  const genres = kind === "games" ? GAME_GENRES : APP_CATS;
  const kindLabel = kind === "games" ? "Games" : "Apps";
  const title = genre ? genreName(kind, genre) : kind === "games" ? "Games" : "Apps";
  const subtitle = genre
    ? `Best ${title} MOD APK downloads for Android`
    : kind === "games"
      ? "Free APK games for Android — download & play"
      : "Free premium apps & MOD APK for Android";

  return (
    <div className="pb-4">
      <Breadcrumbs
        items={genre ? [{ label: kindLabel, href: `/${kind}/` }, { label: title }] : [{ label: kindLabel }]}
      />
      <Reveal>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-3 font-display text-2xl font-black sm:text-3xl">
              <span className="h-9 w-1.5 rounded-full bg-gradient-to-b from-neon to-royal shadow-[0_0_16px_rgba(34,255,136,0.6)]" />
              {data.title || title}
            </h1>
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          </div>
          {data.totalPages > 1 && (
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-300">
              Page {data.page} of {data.totalPages.toLocaleString()}
            </span>
          )}
        </div>
      </Reveal>

      <GenreNav kind={kind} genres={genres} active={genre} />
      <ListingGrid items={data.items} />
      <Pagination page={data.page} totalPages={data.totalPages} basePath={genre ? `/${kind}/${genre}/` : `/${kind}/`} />
    </div>
  );
}
