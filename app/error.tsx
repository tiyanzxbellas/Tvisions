"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-3xl border border-red-500/40 bg-red-500/10">
        <AlertTriangle className="h-10 w-10 text-red-400" />
      </span>
      <h1 className="font-display text-2xl font-black">Something went wrong</h1>
      <p className="text-sm text-slate-400">
        Failed to load data from the source. It might be a temporary network issue.
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn-neon flex items-center gap-2 rounded-xl px-6 py-3 font-display font-bold">
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
        <Link href="/" className="btn-ghost-blue flex items-center gap-2 rounded-xl px-6 py-3 font-display font-bold">
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>
    </div>
  );
}
