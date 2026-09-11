import { Rocket, Crown, Gamepad2, Flame, RefreshCw, Smartphone, BadgeCheck } from "lucide-react";
import { getHomeSections, getListing, getSpecialPage } from "@/lib/source";
import { SPECIAL_PAGES } from "@/lib/genres";
import type { ApkItem, HomeSection } from "@/lib/types";
import SearchBar from "@/components/SearchBar";
import SectionBlock from "@/components/SectionBlock";
import IconMarquee from "@/components/IconMarquee";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";

export const revalidate = 1800;

const ICONS: Record<string, React.ReactNode> = {
  "best new": <Rocket className="h-6 w-6 text-neon" />,
  "editor": <Crown className="h-6 w-6 text-aqua" />,
  "new games": <Gamepad2 className="h-6 w-6 text-neon" />,
  popular: <Flame className="h-6 w-6 text-aqua" />,
  update: <RefreshCw className="h-6 w-6 text-neon" />,
};

function iconFor(title: string): React.ReactNode {
  const t = title.toLowerCase();
  for (const [k, v] of Object.entries(ICONS)) {
    if (t.includes(k)) return v;
  }
  return <BadgeCheck className="h-6 w-6 text-aqua" />;
}

/** Top-up each homepage row with items from its listing page (dedupe, max 16). */
async function enrichSection(s: HomeSection): Promise<HomeSection> {
  if (!s.moreUrl) return s;
  try {
    let extra: ApkItem[] = [];
    const asGenre = s.moreUrl.match(/^\/(games|app)\/([^/]+)\/$/);
    const asRoot = s.moreUrl.match(/^\/(games|app)\/$/);
    if (asGenre) {
      extra = (await getListing(asGenre[1] as "games" | "app", asGenre[2], 1)).items;
    } else if (asRoot) {
      extra = (await getListing(asRoot[1] as "games" | "app", null, 1)).items;
    } else {
      const slug = s.moreUrl.replaceAll("/", "");
      if (SPECIAL_PAGES[slug]) extra = (await getSpecialPage(slug, 1)).items;
    }
    if (extra.length === 0) return s;
    const seen = new Set(s.items.map((i) => i.id));
    const merged = [...s.items];
    for (const it of extra) {
      if (!seen.has(it.id)) {
        seen.add(it.id);
        merged.push(it);
      }
      if (merged.length >= 16) break;
    }
    return { ...s, items: merged };
  } catch {
    return s;
  }
}

export default async function Home() {
  const [rawSections, apps] = await Promise.all([
    getHomeSections(),
    getListing("app", null, 1).catch(() => ({ items: [], page: 1, totalPages: 1, title: "" })),
  ]);
  const sections = await Promise.all(rawSections.map(enrichSection));

  const marqueeItems = sections.flatMap((s) => s.items).slice(0, 16);

  return (
    <div className="pb-4">
      {/* ------------------------------- HERO ------------------------------- */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-panel2 via-panel to-void px-6 py-12 text-center sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-neon/20 blur-[110px] animate-float" />
          <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-royal/30 blur-[120px] animate-float-slow" />
          <div className="absolute inset-0 bg-grid-neon opacity-70" />
        </div>

        <Reveal className="relative">
          <span className="chip-mod inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-neon animate-pulse-glow" />
            100% Free • No speed limits
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-black leading-tight sm:text-6xl">
            Free{" "}
            <span className="bg-gradient-to-r from-neon via-emerald-200 to-aqua bg-clip-text text-transparent text-glow-green">
              MOD APK
            </span>{" "}
            Games & Apps
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400 sm:text-base">
            Download verified Android games and premium apps on TiyanzVision. Safe, up-to-date, with fresh MODs every day.
          </p>
        </Reveal>

        <Reveal delay={0.15} className="relative mx-auto mt-7 max-w-2xl">
          <SearchBar big />
        </Reveal>

        <Reveal delay={0.25} className="relative">
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3">
            {[
              { v: 9597, s: "+", l: "APK Files" },
              { v: 50, s: "", l: "Genres" },
              { v: 100, s: "%", l: "Free" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-4 backdrop-blur transition hover:border-neon/40"
              >
                <div className="font-display text-2xl font-black text-neon text-glow-green sm:text-3xl">
                  <CountUp to={s.v} suffix={s.s} />
                </div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400 sm:text-xs">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="relative">
          <IconMarquee items={marqueeItems} />
        </div>
      </section>

      {/* ------------------------------ SECTIONS ----------------------------- */}
      {sections.map((s) => (
        <SectionBlock
          key={s.title}
          title={s.title}
          moreUrl={s.moreUrl}
          moreLabel={s.moreLabel}
          items={s.items}
          icon={iconFor(s.title)}
        />
      ))}

      {apps.items.length > 0 && (
        <SectionBlock
          title="New Apps"
          moreUrl="/app/"
          moreLabel="More Apps"
          items={apps.items.slice(0, 16)}
          icon={<Smartphone className="h-6 w-6 text-aqua" />}
        />
      )}

      {/* -------------------------------- SEO text ---------------------------- */}
      <Reveal className="mt-14 rounded-3xl border border-white/10 bg-panel/60 p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold">TiyanzVision — Mod APK Games and Premium Apps</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          TiyanzVision is a website with free Mod APK Games and Premium Apps for Android. Here you will find
          games of almost any category — action, adventure, RPG, simulation, strategy and more. Download any
          Android game for free, with unlocked features, unlimited money, MOD menus and much more. All files
          are checked for performance and safety before publishing.
        </p>
      </Reveal>
    </div>
  );
}
