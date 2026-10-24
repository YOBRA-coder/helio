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

/** Reloads the app so the newest version loads. Also asks the browser to refresh its service worker. */
export async function reloadApp() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
  } catch {
    /* reload anyway */
  }
  location.reload();
}

/** True when the server is running a newer build than the one loaded in this tab. Checks every minute and on return to the app. */
export function useUpdateAvailable() {
  const [stale, setStale] = useState(false);
  useEffect(() => {
    let live = true;
    const check = async () => {
      try {
        const { getVersion } = await import("@/lib/trading/desk-api");
        const v = await getVersion();
        if (live && v.build && v.build !== __BUILD_ID__) setStale(true);
      } catch {
        /* offline or server restarting: try again later */
      }
    };
    const timer = window.setInterval(check, 60_000);
    const onVisible = () => document.visibilityState === "visible" && void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", check);
    void check();
    return () => {
      live = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", check);
    };
  }, []);
  return stale;
}
