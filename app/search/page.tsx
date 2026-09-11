import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { searchApk } from "@/lib/source";
import Breadcrumbs from "@/components/Breadcrumbs";
import ListingGrid from "@/components/ListingGrid";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import Reveal from "@/components/Reveal";

export const revalidate = 600;

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search results for "${q}"` : "Search",
    alternates: { canonical: "/search/" },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, page: pageStr } = await searchParams;
  const query = (q || "").trim();
  const page = Math.max(parseInt(pageStr || "1", 10) || 1, 1);

  if (!query) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="font-display text-3xl font-black">Search APK</h1>
        <p className="mt-2 text-slate-400">Type a game or app name to start searching.</p>
        <div className="mt-6">
          <SearchBar big />
        </div>
      </div>
    );
  }

  const data = await searchApk(query, page);

  return (
    <div className="pb-4">
      <Breadcrumbs items={[{ label: `Search: ${query}` }]} />
      <Reveal>
        <h1 className="flex items-center gap-3 font-display text-2xl font-black sm:text-3xl">
          <span className="h-9 w-1.5 rounded-full bg-gradient-to-b from-neon to-royal shadow-[0_0_16px_rgba(34,255,136,0.6)]" />
          Results for “<span className="text-neon">{query}</span>”
        </h1>
      </Reveal>
      <div className="mb-6 mt-4 max-w-xl">
        <SearchBar />
      </div>

      {data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-panel/60 py-16 text-center">
          <SearchX className="h-12 w-12 text-slate-600" />
          <p className="font-display text-lg font-bold">No results found</p>
          <p className="text-sm text-slate-400">Try another keyword or browse genres instead.</p>
        </div>
      ) : (
        <>
          <ListingGrid items={data.items} />
          <Pagination page={data.page} totalPages={data.totalPages} basePath="/search/" extraQuery={`q=${encodeURIComponent(query)}`} />
        </>
      )}
    </div>
  );
}
