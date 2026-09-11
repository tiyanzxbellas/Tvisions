"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

function Bar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // hide when navigation completes
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  // show when an internal link is clicked
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const a = el.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//")) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch {
        return;
      }
      setLoading(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // safety timeout
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 9000);
    return () => clearTimeout(t);
  }, [loading]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden"
        >
          <motion.div
            className="h-full w-[40vw] bg-gradient-to-r from-transparent via-neon to-transparent shadow-[0_0_16px_rgba(34,255,136,0.9)]"
            animate={{ x: ["-40vw", "100vw"] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function TopLoader() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
