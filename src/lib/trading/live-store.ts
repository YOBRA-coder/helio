/**
 * The live tape, straight into the browser: BTC prices from the exchanges' public websockets and Polymarket's
 * order-book socket for the open windows. It does not depend on the worker, so the screen moves the instant the
 * market does. (The worker trades on its own copies of the same feeds; this one is for looking.)
 */
import { useEffect } from "react";
import { create } from "zustand";
import { MultiFeed, venuesFromEnv, type FeedStatus } from "./feed.ts";
import { startBookSocket } from "./book-socket.ts";
import { useDesk } from "./store.ts";
import type { Market } from "./types.ts";

export interface LiveQuoteRow {
  bid: number;
  ask: number;
  at: number;
}

export interface LiveState {
  btc: { price: number; at: number; source: string } | null;
  feed: FeedStatus | null;
  /** about five minutes of BTC, [time, price] */
  series: Array<[number, number]>;
  quotes: Record<string, LiveQuoteRow>;
  book: "idle" | "connecting" | "live" | "down";
  /** spread between the exchanges in bp */
  spreadBp: number | null;
}

export const useLive = create<LiveState>(() => ({ btc: null, feed: null, series: [], quotes: {}, book: "idle", spreadBp: null }));

/** Start the feeds while the tab is visible. Mounted once, in DeskProvider. */
export function useLiveFeeds() {
  useEffect(() => {
    let feed: MultiFeed | null = null;
    let pump = 0;
    let stopBook = () => {};
    let assetKey = "";
    let watchTimer = 0;
    let dead = false;
    const pending: Record<string, LiveQuoteRow> = {};

    const startAll = () => {
      if (dead || feed) return;
      feed = new MultiFeed({ venues: venuesFromEnv(undefined) });
      feed.start();
      let n = 0;
      pump = window.setInterval(() => {
        if (!feed) return;
        const t = feed.latest();
        n += 1;
        const patch: Partial<LiveState> = {};
        if (t) patch.btc = { price: t.price, at: t.at, source: t.source ?? "" };
        if (n % 4 === 0) {
          patch.feed = feed.status();
          patch.series = feed.recent(5 * 60_000, 240);
          patch.spreadBp = feed.spreadBp();
        }
        if (Object.keys(pending).length) {
          patch.quotes = { ...useLive.getState().quotes, ...pending };
          for (const k of Object.keys(pending)) delete pending[k];
        }
        useLive.setState(patch);
      }, 250);
      const syncBook = () => {
        const markets = useDesk.getState().liveMarkets.filter((m: Market) => m.status === "open" && m.yesTokenId);
        const ids = markets.map((m: Market) => m.yesTokenId as string).slice(0, 40);
        const key = ids.join(",");
        if (key === assetKey) return;
        assetKey = key;
        stopBook();
        stopBook = () => {};
        if (!ids.length) {
          useLive.setState({ book: "idle" });
          return;
        }
        stopBook = startBookSocket({
          assetIds: ids,
          onQuotes: (qs) => {
            const at = Date.now();
            for (const q of qs) pending[q.tokenId] = { bid: q.bid, ask: q.ask, at };
          },
          onStatus: (book) => useLive.setState({ book }),
        });
      };
      syncBook();
      watchTimer = window.setInterval(syncBook, 2000);
    };

    const stopAll = () => {
      window.clearInterval(pump);
      window.clearInterval(watchTimer);
      stopBook();
      stopBook = () => {};
      assetKey = "";
      feed?.stop();
      feed = null;
      useLive.setState({ book: "idle" });
    };

    // a hidden tab keeps no sockets open (saves the phone's battery and the exchanges' goodwill)
    const onVis = () => (document.hidden ? stopAll() : startAll());
    document.addEventListener("visibilitychange", onVis);
    if (!document.hidden) startAll();
    return () => {
      dead = true;
      document.removeEventListener("visibilitychange", onVis);
      stopAll();
    };
  }, []);
}

/** Open windows with the freshest quote from the browser's own order-book socket laid over the desk's copy. */
export function overlayQuotes(markets: Market[], quotes: Record<string, LiveQuoteRow>): Array<Market & { liveAt: number | null }> {
  return markets.map((m) => {
    const q = m.yesTokenId ? quotes[m.yesTokenId] : undefined;
    if (q && q.at >= m.updatedAt) return { ...m, yesBid: q.bid, yesAsk: q.ask, updatedAt: q.at, source: "Polymarket CLOB", liveAt: q.at };
    return { ...m, liveAt: m.source === "Polymarket CLOB" ? m.updatedAt : null };
  });
}
