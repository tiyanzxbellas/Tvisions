"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * APK icon with staged self-healing. The server-side resolver already strips
 * lazy-load placeholders, but a parsed icon URL can still 404 (WordPress
 * thumbnails like `-140x140` are sometimes never generated, CDN hiccups):
 *   stage 0 → original URL
 *   stage 1 → full-size original (strip the -<w>x<h> WP suffix)
 *   stage 2 → initial-letter tile (never a broken-image glyph)
 * `className` carries sizing/rounding for both the <Image> and the tile.
 */
export default function ApkIcon({
  src,
  title,
  width = 96,
  height = 96,
  priority = false,
  className = "",
}: {
  src: string;
  title: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}) {
  const [stage, setStage] = useState(0);
  const usable = Boolean(src) && !src.startsWith("data:");
  const fullSize = usable ? src.replace(/-\d+x\d+(?=\.[a-z0-9]+(?:[?#]|$))/i, "") : "";
  const current = stage === 0 ? src : fullSize;

  if (!usable || !current || stage >= 2 || (stage === 1 && fullSize === src)) {
    return (
      <span className={`grid place-items-center bg-white/5 font-display text-neon ${className}`} aria-hidden>
        {(title || "?").charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={current}
      alt={title}
      width={width}
      height={height}
      {...(priority ? { priority: true } : { loading: "lazy" as const })}
      onError={() => setStage((s) => s + 1)}
      className={className}
    />
  );
}
