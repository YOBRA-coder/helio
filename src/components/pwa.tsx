import { useEffect, useState } from "react";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

/** Registers the service worker and captures Chrome/Android's install prompt. Renders nothing. */
export function PwaRegister() {
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred = e as InstallEvent;
      emit();
    };
    const onInstalled = () => {
      deferred = null;
      emit();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}

export function useInstall() {
  const [, tick] = useState(0);
  const [standalone, setStandalone] = useState(false);
  // browser-only facts are read after mount so the server and first client render agree
  const [env, setEnv] = useState({ ios: false, secure: true });
  useEffect(() => {
    setEnv({
      ios: /iphone|ipad|ipod/i.test(navigator.userAgent),
      secure: location.protocol === "https:" || location.hostname === "localhost",
    });
    const fn = () => tick((n) => n + 1);
    listeners.add(fn);
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return {
    standalone,
    canPrompt: deferred !== null,
    ios: env.ios,
    secure: env.secure,
    async install() {
      if (!deferred) return false;
      await deferred.prompt();
      const choice = await deferred.userChoice;
      deferred = null;
      emit();
      return choice.outcome === "accepted";
    },
  };
}
