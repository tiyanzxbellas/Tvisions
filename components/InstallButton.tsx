"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, PlusSquare, Check } from "lucide-react";
import { usePwaInstall } from "@/lib/pwa";

/**
 * Install App button — lives in the top bar (no scrolling needed).
 * variants: "header" (desktop pill) | "icon" (compact, next to hamburger on mobile).
 * Renders nothing if not installable (except iOS which uses manual steps).
 */
export default function InstallButton({ variant = "header" }: { variant?: "header" | "icon" }) {
  const { available, done, ios, promptInstall } = usePwaInstall();
  const [showIosHint, setShowIosHint] = useState(false);
  const [busy, setBusy] = useState(false);

  if (done) return null;

  const onClick = async () => {
    if (ios) {
      setShowIosHint((v) => !v);
      return;
    }
    if (!available) return;
    setBusy(true);
    await promptInstall();
    setBusy(false);
  };

  // Android/desktop: only show when browser fires install prompt; iOS: always show (manual steps)
  if (!ios && !available) return null;

  return (
    <>
      {variant === "header" ? (
        <button
          onClick={onClick}
          className="btn-neon hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold lg:inline-flex"
          title="Install TiyanzVision app"
        >
          <Download className="h-4 w-4" strokeWidth={2.5} />
          {busy ? "Installing…" : "Install App"}
        </button>
      ) : (
        <button
          onClick={onClick}
          aria-label="Install app"
          title="Install TiyanzVision app"
          className="btn-neon grid h-10 w-10 shrink-0 place-items-center rounded-lg"
        >
          <Download className="h-5 w-5" strokeWidth={2.5} />
        </button>
      )}

      {/* iOS manual-install hint */}
      <AnimatePresence>
        {ios && showIosHint && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            className="fixed right-4 top-16 z-[95] w-72 rounded-2xl border border-aqua/30 bg-panel/95 p-4 shadow-[0_20px_60px_-10px_rgba(47,107,255,0.6)] backdrop-blur-xl"
          >
            <button
              onClick={() => setShowIosHint(false)}
              className="absolute right-3 top-3 text-slate-500 transition hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="font-display text-sm font-bold">Install on iPhone</p>
            <ol className="mt-2 space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Share className="h-4 w-4 shrink-0 text-aqua" /> Tap <b>Share</b> in Safari toolbar
              </li>
              <li className="flex items-center gap-2">
                <PlusSquare className="h-4 w-4 shrink-0 text-aqua" /> Choose <b>Add to Home Screen</b>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-neon" /> Tap <b>Add</b> — done!
              </li>
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
