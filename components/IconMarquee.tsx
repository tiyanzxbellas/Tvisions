import Image from "next/image";
import Link from "next/link";
import type { ApkItem } from "@/lib/types";

export default function IconMarquee({ items }: { items: ApkItem[] }) {
  const row = items.filter((i) => i.icon).slice(0, 16);
  if (row.length === 0) return null;
  const doubled = [...row, ...row];
  return (
    <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused]">
        {doubled.map((item, i) => (
          <Link
            key={`${item.id}-${i}`}
            href={item.url}
            className="group relative shrink-0"
            title={item.title}
          >
            <Image
              src={item.icon}
              alt={item.title}
              width={72}
              height={72}
              loading="lazy"
              className="h-16 w-16 rounded-2xl border border-white/10 object-cover transition-all duration-300 group-hover:scale-110 group-hover:border-neon/60 group-hover:shadow-[0_0_24px_rgba(34,255,136,0.45)]"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
