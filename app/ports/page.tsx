import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MonitorSmartphone, Gamepad2, Info } from "lucide-react";
import { getPorts } from "@/lib/source";
import Breadcrumbs from "@/components/Breadcrumbs";
import ListingGrid from "@/components/ListingGrid";
import Pagination from "@/components/Pagination";
import Reveal from "@/components/Reveal";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Android Ports — PC & Console Games for Android",
  description:
    "Download Android ports of PC and console games: native Android builds, engine ports and launchers, with version info and installation notes on TiyanzVision.",
  alternates: { canonical: "/ports/" },
  openGraph: {
    title: "Android Ports — PC & Console Games for Android",
    description:
      "Browse the Android port catalog: PC and console games adapted for Android phones and tablets.",
    url: "/ports/",
    type: "website",
  },
};

type Props = { searchParams: Promise<{ page?: string }> };

export default async function PortsPage({ searchParams }: Props) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(parseInt(pageStr || "1", 10) || 1, 1);
  const data = await getPorts(page).catch(() => null);
  if (!data || (page > 1 && data.items.length === 0)) notFound();

  return (
    <div className="pb-4">
      <Breadcrumbs items={[{ label: "Android Ports" }]} />

      <Reveal>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-3 font-display text-2xl font-black sm:text-3xl">
              <span className="h-9 w-1.5 rounded-full bg-gradient-to-b from-neon to-royal shadow-[0_0_16px_rgba(34,255,136,0.6)]" />
              <MonitorSmartphone className="h-7 w-7 text-neon" />
              {data.title || "Android Ports"}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              PC &amp; console games ported to Android — check version, controls and requirements on each game page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {data.total ? (
              <span className="rounded-full border border-neon/40 bg-neon/10 px-4 py-1.5 text-xs font-bold text-neon">
                Port catalog: {data.total.toLocaleString()}
              </span>
            ) : null}
            {data.totalPages > 1 && (
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-300">
                Page {data.page} of {data.totalPages.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Reveal>

      {data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-panel/60 py-16 text-center">
          <Gamepad2 className="h-12 w-12 text-slate-600" />
          <p className="font-display text-lg font-bold">Port catalog is syncing</p>
          <p className="text-sm text-slate-400">Please try again in a few minutes.</p>
        </div>
      ) : (
        <>
          <ListingGrid items={data.items} />
          <Pagination page={data.page} totalPages={data.totalPages} basePath="/ports/" />
        </>
      )}

      {/* ------------------------------ info / SEO ----------------------------- */}
      <Reveal className="mt-14 rounded-3xl border border-white/10 bg-panel/60 p-6 sm:p-8">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <Info className="h-5 w-5 text-aqua" />
          Explore Android ports of PC and console games
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">
          <p>
            An Android port brings a game originally released on another platform to Android phones and
            tablets. This catalog collects native Android builds, recreated engines and launchers — open a
            game page to check its version, download availability and installation instructions before you
            install.
          </p>
          <p>
            Ports can differ in supported Android versions, processor architecture, storage requirements
            and controls. Some projects offer touch controls, others play better with a controller, and
            engine ports or launchers may need data from your own copy of the original game. Always read
            the requirements and notes on the game page first.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
