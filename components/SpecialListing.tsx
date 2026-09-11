import { SPECIAL_PAGES } from "@/lib/genres";
import { getSpecialPage } from "@/lib/source";
import Breadcrumbs from "./Breadcrumbs";
import ListingGrid from "./ListingGrid";
import Pagination from "./Pagination";
import Reveal from "./Reveal";

export default async function SpecialListing({ slug, page }: { slug: string; page: number }) {
  const meta = SPECIAL_PAGES[slug];
  const data = await getSpecialPage(slug, page);

  return (
    <div className="pb-4">
      <Breadcrumbs items={[{ label: meta.title }]} />
      <Reveal>
        <div className="mb-6">
          <h1 className="flex items-center gap-3 font-display text-2xl font-black sm:text-3xl">
            <span className="h-9 w-1.5 rounded-full bg-gradient-to-b from-neon to-royal shadow-[0_0_16px_rgba(34,255,136,0.6)]" />
            {data.title || meta.title}
          </h1>
          <p className="mt-2 text-sm text-slate-400">{meta.subtitle}</p>
        </div>
      </Reveal>
      <ListingGrid items={data.items} />
      <Pagination page={data.page} totalPages={data.totalPages} basePath={`/${slug}/`} />
    </div>
  );
}
