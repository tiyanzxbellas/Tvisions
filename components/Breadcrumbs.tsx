import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 py-4 text-sm" aria-label="Breadcrumb">
      <Link href="/" className="flex items-center gap-1 text-slate-400 transition hover:text-neon">
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
          {c.href ? (
            <Link href={c.href} className="text-slate-400 transition hover:text-neon">
              {c.label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-100">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
