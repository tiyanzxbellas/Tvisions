import Link from "next/link";
import type { Genre } from "@/lib/types";

interface Props {
  kind: "games" | "app";
  genres: Genre[];
  active?: string | null;
}

export default function GenreNav({ kind, genres, active }: Props) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Link
        href={`/${kind}/`}
        className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
          !active
            ? "btn-neon"
            : "border border-white/10 bg-white/5 text-slate-300 hover:border-aqua/50 hover:text-white"
        }`}
      >
        All
      </Link>
      {genres.map((g) => {
        const isActive = active === g.slug;
        return (
          <Link
            key={g.id}
            href={`/${kind}/${g.slug}/`}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
              isActive
                ? "btn-neon"
                : "border border-white/10 bg-white/5 text-slate-300 hover:border-aqua/50 hover:text-white"
            }`}
          >
            {g.name}
            <span className={`rounded-full px-1.5 text-[11px] ${isActive ? "bg-black/25" : "bg-white/10 text-slate-400"}`}>
              {g.count.toLocaleString()}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
