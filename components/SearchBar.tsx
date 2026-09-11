"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, FileDown } from "lucide-react";

interface Suggestion {
  id: number;
  title: string;
  url: string;
}

export default function SearchBar({ big = false }: { big?: boolean }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest/?q=${encodeURIComponent(q.trim())}`);
        const data = (await res.json()) as Suggestion[];
        setItems(data);
        setShow(true);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  const go = (query: string) => {
    if (!query.trim()) return;
    setShow(false);
    router.push(`/search/?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className={`group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur transition-all duration-300 focus-within:border-neon/60 focus-within:shadow-[0_0_24px_rgba(34,255,136,0.25)] ${
          big ? "px-5 py-4" : "px-3 py-2"
        }`}
      >
        {loading ? (
          <Loader2 className={`animate-spin text-neon ${big ? "h-6 w-6" : "h-4 w-4"}`} />
        ) : (
          <Search className={`${big ? "h-6 w-6" : "h-4 w-4"} shrink-0 text-slate-400 transition group-focus-within:text-neon`} />
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => items.length > 0 && setShow(true)}
          placeholder="Search games & apps…"
          className={`w-full bg-transparent outline-none placeholder:text-slate-500 ${
            big ? "text-lg" : "text-sm"
          }`}
        />
        {q && (
          <button
            type="submit"
            className={`btn-neon shrink-0 rounded-lg font-bold ${big ? "px-6 py-2.5 text-base" : "px-3 py-1 text-xs"}`}
          >
            Search
          </button>
        )}
      </form>

      {show && items.length > 0 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-aqua/25 bg-panel/95 shadow-[0_20px_60px_-10px_rgba(47,107,255,0.5)] backdrop-blur-xl">
          {items.map((s) => (
            <Link
              key={s.id}
              href={s.url}
              onClick={() => setShow(false)}
              className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-neon/10"
            >
              <FileDown className="h-4 w-4 shrink-0 text-neon" />
              <span className="truncate text-sm font-medium text-slate-100">{s.title}</span>
            </Link>
          ))}
          <button
            onClick={() => go(q)}
            className="w-full border-t border-white/10 bg-white/[0.03] px-4 py-2.5 text-left text-xs font-semibold text-aqua transition hover:bg-aqua/10"
          >
            See all results for “{q.trim()}” →
          </button>
        </div>
      )}
    </div>
  );
}
