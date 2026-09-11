import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff, Home, RotateCcw } from "lucide-react";

export const metadata: Metadata = {
  title: "You are offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-3xl border border-aqua/40 bg-aqua/10">
        <WifiOff className="h-10 w-10 text-aqua" />
      </span>
      <h1 className="font-display text-2xl font-black">You are offline</h1>
      <p className="text-sm text-slate-400">
        No internet connection. Check your network and try again — your installed TiyanzVision app will work once you are back online.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="btn-neon flex items-center gap-2 rounded-xl px-6 py-3 font-display font-bold">
          <Home className="h-4 w-4" />
          Home
        </Link>
        <a href="/" className="btn-ghost-blue flex items-center gap-2 rounded-xl px-6 py-3 font-display font-bold">
          <RotateCcw className="h-4 w-4" />
          Retry
        </a>
      </div>
    </div>
  );
}
