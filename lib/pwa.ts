"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// module-level singleton so every button shares the same deferred prompt
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("pwa:available"));
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    window.dispatchEvent(new Event("pwa:installed"));
  });
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function usePwaInstall() {
  const [available, setAvailable] = useState(false);
  const [done, setDone] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(isIos());
    if (installed || isStandalone()) {
      setDone(true);
      return;
    }
    if (deferredPrompt) setAvailable(true);
    const onAvail = () => setAvailable(true);
    const onDone = () => {
      setDone(true);
      setAvailable(false);
    };
    window.addEventListener("pwa:available", onAvail);
    window.addEventListener("pwa:installed", onDone);
    return () => {
      window.removeEventListener("pwa:available", onAvail);
      window.removeEventListener("pwa:installed", onDone);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      deferredPrompt = null;
      setAvailable(false);
      setDone(true);
      return true;
    }
    return false;
  }, []);

  return { available, done, ios, promptInstall };
}
