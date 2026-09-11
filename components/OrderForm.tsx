"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, Loader2 } from "lucide-react";

export default function OrderForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1200);
  };

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div
          key="ok"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3 rounded-2xl border border-neon/40 bg-neon/5 py-14 text-center"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}>
            <CheckCircle2 className="h-16 w-16 text-neon drop-shadow-[0_0_20px_rgba(34,255,136,0.7)]" />
          </motion.div>
          <p className="font-display text-xl font-bold">Request received!</p>
          <p className="max-w-sm text-sm text-slate-400">
            Your order has been added to the table. We usually publish requested APKs within 24–48 hours.
          </p>
          <button onClick={() => setSent(false)} className="btn-ghost-blue mt-2 rounded-xl px-6 py-2.5 text-sm font-bold">
            Make another request
          </button>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onSubmit={submit}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Your name</span>
              <input
                required
                placeholder="John Doe"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-neon/60 focus:shadow-[0_0_20px_rgba(34,255,136,0.2)]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Email</span>
              <input
                required
                type="email"
                placeholder="you@mail.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-neon/60 focus:shadow-[0_0_20px_rgba(34,255,136,0.2)]"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">App / Game name</span>
            <input
              required
              placeholder="e.g. Minecraft MOD APK"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-neon/60 focus:shadow-[0_0_20px_rgba(34,255,136,0.2)]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">Google Play link (optional)</span>
            <input
              placeholder="https://play.google.com/store/apps/details?id=…"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-neon/60 focus:shadow-[0_0_20px_rgba(34,255,136,0.2)]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400">MOD features wanted</span>
            <textarea
              rows={4}
              placeholder="Unlimited money, unlocked premium, no ads…"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-neon/60 focus:shadow-[0_0_20px_rgba(34,255,136,0.2)]"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="btn-neon flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-display font-bold disabled:opacity-60 sm:w-auto"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {loading ? "Sending…" : "Submit request"}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
