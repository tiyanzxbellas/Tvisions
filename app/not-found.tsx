import Link from "next/link";
import { Ghost, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-3xl border border-aqua/40 bg-aqua/10">
        <Ghost className="h-10 w-10 text-aqua" />
      </span>
      <p className="font-display text-7xl font-black">
        <span className="bg-gradient-to-r from-neon to-aqua bg-clip-text text-transparent text-glow-green">404</span>
      </p>
      <h1 className="font-display text-xl font-bold">Page not found</h1>
      <p className="text-sm text-slate-400">The APK you are looking for has moved or never existed.</p>
      <Link href="/" className="btn-neon flex items-center gap-2 rounded-xl px-6 py-3 font-display font-bold">
        <Home className="h-4 w-4" />
        Back to home
      </Link>
    </div>
  );
}
