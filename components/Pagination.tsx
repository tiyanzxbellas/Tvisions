import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  basePath: string;
  extraQuery?: string;
}

function pagesAround(page: number, total: number): number[] {
  const set = new Set<number>([1, 2, total, total - 1, page - 1, page, page + 1]);
  return [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export default function Pagination({ page, totalPages, basePath, extraQuery = "" }: Props) {
  if (totalPages <= 1) return null;
  const href = (p: number) => (p <= 1 ? `${basePath}${extraQuery ? `?${extraQuery}` : ""}` : `${basePath}?page=${p}${extraQuery ? `&${extraQuery}` : ""}`);
  const nums = pagesAround(page, totalPages);

  return (
    <nav className="mt-10 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn-ghost-blue grid h-10 w-10 place-items-center rounded-xl" aria-label="Previous page">
          <ChevronLeft className="h-5 w-5" />
        </Link>
      ) : (
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/5 text-slate-700">
          <ChevronLeft className="h-5 w-5" />
        </span>
      )}

      {nums.map((p, i) => {
        const gap = i > 0 && p - nums[i - 1] > 1;
        return (
          <span key={p} className="flex items-center gap-2">
            {gap && <span className="text-slate-600">…</span>}
            {p === page ? (
              <span className="btn-neon grid h-10 min-w-10 place-items-center rounded-xl px-3 font-display font-bold">
                {p}
              </span>
            ) : (
              <Link
                href={href(p)}
                className="btn-ghost-blue grid h-10 min-w-10 place-items-center rounded-xl px-3 font-display font-bold"
              >
                {p}
              </Link>
            )}
          </span>
        );
      })}

      {page < totalPages ? (
        <Link href={href(page + 1)} className="btn-ghost-blue grid h-10 w-10 place-items-center rounded-xl" aria-label="Next page">
          <ChevronRight className="h-5 w-5" />
        </Link>
      ) : (
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/5 text-slate-700">
          <ChevronRight className="h-5 w-5" />
        </span>
      )}
    </nav>
  );
}
