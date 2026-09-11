"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ApkItem } from "@/lib/types";

export default function ApkCard({
  item,
  index = 0,
  animate = true,
}: {
  item: ApkItem;
  index?: number;
  /** set false inside horizontal rows → zero animation cost, scroll licin */
  animate?: boolean;
}) {
  const card = (
    <Link
      href={item.url}
      className="card-neon cv-auto group relative flex h-full flex-col items-center gap-2 overflow-hidden rounded-2xl p-4 text-center"
    >
      {/* hover beam */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-neon to-aqua transition-transform duration-300 group-hover:scale-x-100" />

      <span className="relative">
        <span className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-neon/0 to-aqua/0 blur-md transition-all duration-300 group-hover:from-neon/40 group-hover:to-aqua/40" />
        {item.icon ? (
          <Image
            src={item.icon}
            alt={item.title}
            width={96}
            height={96}
            loading="lazy"
            className="relative h-20 w-20 rounded-2xl object-cover transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 sm:h-24 sm:w-24"
          />
        ) : (
          <span className="relative grid h-20 w-20 place-items-center rounded-2xl bg-white/5 font-display text-2xl font-bold text-neon sm:h-24 sm:w-24">
            {item.title.charAt(0)}
          </span>
        )}
      </span>

      <span className="w-full">
        <span className="block truncate font-display text-sm font-bold text-slate-100 transition group-hover:text-neon">
          {item.title}
        </span>
        {item.version && (
          <span className="mt-0.5 block truncate text-xs font-medium text-aqua">{item.version}</span>
        )}
        {item.mod ? (
          <span className="chip-mod mt-1.5 inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[11px] font-semibold">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.mod}</span>
          </span>
        ) : (
          <span className="mt-1.5 inline-block rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
            Original
          </span>
        )}
      </span>
    </Link>
  );

  // inside carousels: render static (no observers, no animation → smooth scroll)
  if (!animate) return card;

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, delay: Math.min(index % 8, 7) * 0.06, ease: "easeOut" }}
    >
      {card}
    </motion.div>
  );
}
