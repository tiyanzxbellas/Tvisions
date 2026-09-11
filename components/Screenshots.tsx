"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";

export default function Screenshots({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (images.length === 0) return null;

  const prev = () => setOpen((v) => (v === null ? v : (v - 1 + images.length) % images.length));
  const next = () => setOpen((v) => (v === null ? v : (v + 1) % images.length));

  return (
    <div className="mt-8">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
        <Images className="h-5 w-5 text-aqua" />
        Screenshots
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.slice(0, 8).map((src, i) => (
          <motion.button
            key={src}
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            onClick={() => setOpen(i)}
            className="card-neon group overflow-hidden rounded-xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${title} screenshot ${i + 1}`}
              loading="lazy"
              className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setOpen(null)}
          >
            <button
              className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition hover:border-neon hover:text-neon"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition hover:border-neon hover:text-neon sm:left-8"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <motion.div
              key={open}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="max-h-[85vh] max-w-5xl overflow-hidden rounded-2xl border border-neon/30 shadow-[0_0_80px_rgba(34,255,136,0.25)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[open]} alt={`${title} screenshot ${open + 1}`} className="max-h-[85vh] w-auto object-contain" />
            </motion.div>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition hover:border-neon hover:text-neon sm:right-8"
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <span className="absolute bottom-5 rounded-full border border-white/15 bg-black/60 px-4 py-1 text-sm font-semibold text-slate-300">
              {open + 1} / {images.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
