import { useEffect } from "react";
import { startBookSocket } from "@/lib/trading/book-socket";
import { getMe } from "@/lib/trading/auth-api";
import { THEMES } from "@/lib/trading/engine";
import { useLiveFeeds } from "@/lib/trading/live-store";
import { useDesk } from "@/lib/trading/store";

export function DeskProvider({ children }: { children: React.ReactNode }) {
  const theme = useDesk((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const color = THEMES.find((item) => item.id === theme)?.color ?? "#101512";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
  }, [theme]);
  useLiveFeeds();
  useEffect(() => {
    useDesk.getState().boot();
    void getMe().then((m) => useDesk.getState().setEmail(m.user?.email ?? null)).catch(() => {});
    // Server mode: mirror the worker. Local mode: run the same ledger in this tab.
    // The worker saves every ~5s, so polling faster than 2s only burns the server. A hidden tab polls every 10s, and
    // comes back with an immediate refresh.
    let syncTimer = 0;
    let stopped = false;
    const loop = async () => {
      if (stopped) return;
      await useDesk.getState().syncServer();
      if (!stopped) syncTimer = window.setTimeout(loop, document.hidden ? 10_000 : 2_000);
    };
    syncTimer = window.setTimeout(loop, 2_000);
    const onVisible = () => {
      if (document.hidden) return;
      window.clearTimeout(syncTimer);
      void loop();
    };
    document.addEventListener("visibilitychange", onVisible);
    const poll = window.setInterval(() => {
      if (document.hidden) return;
      useDesk.getState().tick();
      useDesk.getState().tickClock();
    }, 1000);
    const live = window.setInterval(() => void useDesk.getState().refreshLive(), 12_000);
    const kick = window.setTimeout(() => void useDesk.getState().refreshLive(), 1800);
    let stopBook = () => {};
    let assetKey = "";
    const syncBook = () => {
      if (useDesk.getState().source !== "local") {
        if (assetKey) {
          stopBook();
          stopBook = () => {};
          assetKey = "";
        }
        return;
      }
      const ids = useDesk
        .getState()
        .liveMarkets.map((market) => market.yesTokenId)
        .filter((id): id is string => Boolean(id))
        .slice(0, 40);
      const key = ids.join(",");
      if (key === assetKey) return;
      assetKey = key;
      stopBook();
      if (ids.length === 0) {
        useDesk.getState().setBookStatus("idle");
        stopBook = () => {};
        return;
      }
      stopBook = startBookSocket({
        assetIds: ids,
        onQuotes: (quotes) => useDesk.getState().applyLiveQuotes(quotes),
        onStatus: (status) => useDesk.getState().setBookStatus(status),
      });
    };
    const watch = window.setInterval(syncBook, 2000);
    return () => {
      stopped = true;
      window.clearTimeout(syncTimer);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(poll);
      window.clearInterval(live);
      window.clearInterval(watch);
      window.clearTimeout(kick);
      stopBook();
    };
  }, []);
  return children;
}
