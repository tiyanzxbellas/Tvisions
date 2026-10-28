import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import type { CollectionSummary } from "@/lib/types";
import ApkIcon from "./ApkIcon";

/** Collection card for /collections/: 2×2 preview-icon mosaic + title + count. */
export default function CollectionCard({ c }: { c: CollectionSummary }) {
  const tiles = [...c.icons.slice(0, 4)];
  while (tiles.length < 4) tiles.push("");
  return (
    <Link
      href={c.url}
      className="card-neon group relative flex items-center gap-4 overflow-hidden rounded-2xl p-4"
    >
      {/* hover beam */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-neon to-aqua transition-transform duration-300 group-hover:scale-x-100" />

      <span className="grid shrink-0 grid-cols-2 gap-1.5">
        {tiles.map((src, i) => (
          <ApkIcon
            key={i}
            src={src}
            title={c.title}
            width={48}
            height={48}
            className="h-11 w-11 rounded-xl border border-white/10 object-cover text-base font-bold transition-transform duration-300 group-hover:scale-105 sm:h-12 sm:w-12"
          />
        ))}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-bold leading-snug text-slate-100 transition group-hover:text-neon">
          {c.title}
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {c.count > 0 && (
            <span className="chip-mod inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
              <Layers className="h-3 w-3" />
              {c.count} {c.count === 1 ? "game" : "games"}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-bold text-aqua">
            View collection
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </span>
      </span>
    </Link>
  );
}
