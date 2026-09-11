import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Zap, RefreshCw } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-panel/60 backdrop-blur">
      {/* feature strip */}
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6">
        {[
          { icon: ShieldCheck, t: "Verified & Safe", d: "Every file is checked before publishing.", c: "text-neon" },
          { icon: Zap, t: "Fast Downloads", d: "Direct links with no speed limits.", c: "text-aqua" },
          { icon: RefreshCw, t: "Always Updated", d: "Latest versions & fresh MODs daily.", c: "text-royal" },
        ].map((f) => (
          <div key={f.t} className="card-neon flex items-center gap-4 rounded-2xl p-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/5">
              <f.icon className={`h-6 w-6 ${f.c}`} />
            </span>
            <span>
              <span className="block font-display font-bold">{f.t}</span>
              <span className="text-sm text-slate-400">{f.d}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icons/icon-192.png"
              alt="TiyanzVision logo"
              width={32}
              height={32}
              loading="lazy"
              className="h-8 w-8 rounded-lg border border-white/20 object-cover"
            />
            <span className="font-display font-bold">
              <span className="bg-gradient-to-r from-neon to-aqua bg-clip-text text-transparent">TiyanzVision</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-400">
            <Link href="/games/" className="transition hover:text-neon">Games</Link>
            <Link href="/app/" className="transition hover:text-neon">Apps</Link>
            <Link href="/top-100-games/" className="transition hover:text-neon">TOP 100</Link>
            <Link href="/privacy-policy/" className="transition hover:text-neon">Privacy Policy</Link>
            <Link href="/dmca/" className="transition hover:text-neon">DMCA</Link>
            <Link href="/contacts/" className="transition hover:text-neon">Contact</Link>
          </nav>
        </div>
        <div className="border-t border-white/5 py-5 text-center text-xs leading-relaxed text-slate-500">
          <p>© 2026 TiyanzVision — Free MOD APK Games & Apps for Android.</p>
          <p className="mt-1">No files are hosted on this server. All download buttons redirect to the original source. All trademarks belong to their respective owners.</p>
        </div>
      </div>
    </footer>
  );
}
