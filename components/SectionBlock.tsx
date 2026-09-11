"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { ApkItem } from "@/lib/types";
import ApkCard from "./ApkCard";
import Reveal from "./Reveal";

interface Props {
  title: string;
  moreUrl?: string;
  moreLabel?: string;
  items: ApkItem[];
  icon?: React.ReactNode;
}

export default function SectionBlock({ title, moreUrl, moreLabel = "More", items, icon }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const list = items.slice(0, 16);

  useEffect(() => {
    const update = () => {
      const el = scroller.current;
      if (!el) return;
      setCanLeft(el.scrollLeft > 12);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 12);
    };
    update();
    window.addEventListener("resize", update);
    // re-check after fonts/images settle
    const t = setTimeout(update, 800);
    return () => {
      window.removeEventListener("resize", update);
      clearTimeout(t);
    };
  }, [list.length]);

  if (list.length === 0) return null;

  const scroll = (dir: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 12);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 12);
  };

  const arrowCls =
    "grid h-9 w-9 place-items-center rounded-lg border transition disabled:cursor-default disabled:opacity-25";

  return (
    <section className="mt-10 sm:mt-12">
      <Reveal>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="flex min-w-0 items-center gap-3 font-display text-xl font-bold sm:text-2xl">
            <span className="h-8 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-neon to-royal shadow-[0_0_16px_rgba(34,255,136,0.6)]" />
            <span className="flex min-w-0 items-center gap-2">
              <span className="shrink-0">{icon}</span>
              <span className="truncate">{title}</span>
            </span>
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            {/* desktop arrows */}
            <div className="hidden gap-2 md:flex">
              <button
                onClick={() => scroll(-1)}
                disabled={!canLeft}
                aria-label="Scroll left"
                className={`${arrowCls} border-white/10 text-slate-300 enabled:hover:border-neon/60 enabled:hover:text-neon`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scroll(1)}
                disabled={!canRight}
                aria-label="Scroll right"
                className={`${arrowCls} border-white/10 text-slate-300 enabled:hover:border-neon/60 enabled:hover:text-neon`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            {moreUrl && (
              <Link
                href={moreUrl}
                className="btn-ghost-blue group hidden items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold sm:inline-flex"
              >
                {moreLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="relative">
          <div
            ref={scroller}
            onScroll={onScroll}
            className="snap-row no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 pt-1 sm:-mx-6 sm:gap-4 sm:px-6"
          >
            {list.map((item) => (
              <div key={item.id} className="w-[152px] shrink-0 snap-start sm:w-[174px]">
                <ApkCard item={item} animate={false} />
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {moreUrl && (
        <Link
          href={moreUrl}
          className="btn-ghost-blue mt-1 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold sm:hidden"
        >
          {moreLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}
