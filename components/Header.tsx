"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Gamepad2, Menu, X, Home, LayoutGrid, Smartphone, Trophy, ClipboardList } from "lucide-react";
import SearchBar from "./SearchBar";
import InstallButton from "./InstallButton";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/games/", label: "Games", icon: Gamepad2 },
  { href: "/app/", label: "Apps", icon: Smartphone },
  { href: "/top-100-games/", label: "TOP 100", icon: Trophy },
  { href: "/request/", label: "Order table", icon: ClipboardList },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`glass-bar sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-neon/25 shadow-[0_8px_40px_-12px_rgba(34,255,136,0.35)]" : "border-b border-white/5"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="relative block h-10 w-10 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
            <span className="absolute -inset-1 rounded-xl bg-gradient-to-br from-neon to-royal opacity-60 blur-[6px]" />
            <Image
              src="/icons/icon-192.png"
              alt="TiyanzVision logo"
              width={40}
              height={40}
              priority
              className="relative h-10 w-10 rounded-xl border border-white/20 object-cover"
            />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-neon via-emerald-200 to-aqua bg-clip-text text-transparent text-glow-green">
              TiyanzVision
            </span>
            <span className="ml-1 hidden rounded bg-royal/30 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-aqua sm:inline-block">
              MOD APK
            </span>
          </span>
        </Link>

        {/* desktop nav */}
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                  active ? "text-neon" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {n.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-gradient-to-r from-neon to-aqua shadow-[0_0_12px_rgba(34,255,136,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* desktop search + install */}
        <div className="ml-auto hidden w-72 items-center gap-2 md:flex xl:w-96">
          <div className="w-full">
            <SearchBar />
          </div>
          <InstallButton variant="header" />
        </div>

        {/* mobile buttons */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <InstallButton variant="icon" />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-slate-200 transition hover:border-neon/50"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* mobile search (always visible under bar) */}
      <div className="border-t border-white/5 px-4 py-2 md:hidden">
        <SearchBar />
      </div>

      {/* mobile nav dropdown */}
      <div
        className={`overflow-hidden border-white/5 transition-all duration-300 lg:hidden ${
          open ? "max-h-96 border-t" : "max-h-0"
        }`}
      >
        <nav className="space-y-1 px-4 py-3">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-neon/10 text-neon"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
          <Link
            href="/games/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <LayoutGrid className="h-4 w-4" />
            All genres
          </Link>
        </nav>
      </div>
    </header>
  );
}
