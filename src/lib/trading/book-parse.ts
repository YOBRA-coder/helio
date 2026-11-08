/**
 * Pure parsing of Polymarket's market websocket messages into best bid/ask quotes.
 * Shared by the browser socket (book-socket.ts) and the worker's book feed (book-feed.ts).
 */
export interface LiveQuote {
  tokenId: string;
  bid: number;
  ask: number;
}

export const SOCKET_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market";

function num(value: unknown) {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function level(levels: unknown, mode: "max" | "min") {
  if (!Array.isArray(levels)) return null;
  let best: number | null = null;
  for (const row of levels) {
    if (!row || typeof row !== "object") continue;
    const price = num((row as { price?: unknown }).price);
    const size = num((row as { size?: unknown }).size);
    if (price == null || price <= 0 || price >= 1) continue;
    if (size != null && size <= 0) continue;
    best = best == null ? price : mode === "max" ? Math.max(best, price) : Math.min(best, price);
  }
  return best;
}

function pair(bidRaw: unknown, askRaw: unknown): { bid: number; ask: number } | null {
  const bid = num(bidRaw);
  const ask = num(askRaw);
  if (bid == null || ask == null || bid <= 0 || ask >= 1 || ask < bid) return null;
  return { bid, ask };
}

export function quotesFrom(payload: unknown, into: Map<string, LiveQuote>) {
  const rows = Array.isArray(payload) ? payload : [payload];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    if (Array.isArray(rec.price_changes)) {
      for (const change of rec.price_changes) {
        if (!change || typeof change !== "object") continue;
        const item = change as Record<string, unknown>;
        const tokenId = typeof item.asset_id === "string" ? item.asset_id : "";
        const quote = pair(item.best_bid, item.best_ask);
        if (tokenId && quote) into.set(tokenId, { tokenId, ...quote });
      }
      continue;
    }
    const tokenId = typeof rec.asset_id === "string" ? rec.asset_id : "";
    if (!tokenId) continue;
    if (rec.best_bid != null || rec.best_ask != null) {
      const quote = pair(rec.best_bid, rec.best_ask);
      if (quote) into.set(tokenId, { tokenId, ...quote });
      continue;
    }
    if (rec.bids || rec.asks) {
      const quote = pair(level(rec.bids, "max"), level(rec.asks, "min"));
      if (quote) into.set(tokenId, { tokenId, ...quote });
    }
  }
}

