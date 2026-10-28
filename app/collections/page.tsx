import type { Metadata } from "next";
import { Layers } from "lucide-react";
import { getCollections } from "@/lib/source";
import Breadcrumbs from "@/components/Breadcrumbs";
import CollectionCard from "@/components/CollectionCard";
import Reveal from "@/components/Reveal";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Collections — Curated Android Game Lists",
  description:
    "Browse curated collections of Android games on TiyanzVision: best offline games, PC games for Android, games for low-end phones and more.",
  alternates: { canonical: "/collections/" },
  openGraph: {
    title: "Collections — Curated Android Game Lists",
    description: "Curated collections of the best Android games, hand-picked by theme.",
    url: "/collections/",
    type: "website",
  },
};

export default async function CollectionsPage() {
  const collections = await getCollections().catch(() => []);

  return (
    <div className="pb-4">
      <Breadcrumbs items={[{ label: "Collections" }]} />

      <Reveal>
        <div className="mb-6">
          <h1 className="flex items-center gap-3 font-display text-2xl font-black sm:text-3xl">
            <span className="h-9 w-1.5 rounded-full bg-gradient-to-b from-neon to-royal shadow-[0_0_16px_rgba(34,255,136,0.6)]" />
            <Layers className="h-7 w-7 text-aqua" />
            Collections
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Hand-picked game lists by theme — find your next favorite Android game.
          </p>
        </div>
      </Reveal>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-panel/60 py-16 text-center">
          <Layers className="h-12 w-12 text-slate-600" />
          <p className="font-display text-lg font-bold">Collections are syncing</p>
          <p className="text-sm text-slate-400">Please try again in a few minutes.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {collections.map((c) => (
            <CollectionCard key={c.slug} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
