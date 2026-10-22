export interface LiveQuote {
  tokenId: string;
  bid: number;
  ask: number;
}

const SOCKET_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market";

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

function quotesFrom(payload: unknown, into: Map<string, LiveQuote>) {
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

export function startBookSocket(options: {
  assetIds: string[];
  onQuotes: (quotes: LiveQuote[]) => void;
  onStatus: (status: "connecting" | "live" | "down") => void;
}) {
  const ids = [...new Set(options.assetIds)].slice(0, 40);
  let stopped = false;
  let socket: WebSocket | null = null;
  let ping: number | null = null;
  let retry: number | null = null;
  let attempt = 0;
  const pending = new Map<string, LiveQuote>();
  let flushQueued = false;

  function flush() {
    flushQueued = false;
    if (stopped || pending.size === 0) {
      pending.clear();
      return;
    }
    const quotes = [...pending.values()];
    pending.clear();
    options.onQuotes(quotes);
  }

  function queue(payload: unknown) {
    quotesFrom(payload, pending);
    if (flushQueued || pending.size === 0) return;
    flushQueued = true;
    window.setTimeout(flush, 250);
  }

  function cleanupSocket() {
    if (ping != null) window.clearInterval(ping);
    ping = null;
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) socket.close();
    }
    socket = null;
  }

  function connect() {
    if (stopped) return;
    cleanupSocket();
    options.onStatus("connecting");
    const next = new WebSocket(SOCKET_URL);
    socket = next;
    next.onopen = () => {
      if (stopped || socket !== next) return;
      attempt = 0;
      next.send(
        JSON.stringify({
          assets_ids: ids,
          type: "market",
          custom_feature_enabled: true,
          initial_dump: true,
        }),
      );
      options.onStatus("live");
      ping = window.setInterval(() => {
        if (next.readyState === WebSocket.OPEN) next.send("PING");
      }, 10_000);
    };
    next.onmessage = (event) => {
      if (typeof event.data !== "string" || event.data === "PONG") return;
      try {
        queue(JSON.parse(event.data) as unknown);
      } catch {
        return;
      }
    };
    next.onerror = () => {
      if (socket === next) options.onStatus("down");
    };
    next.onclose = () => {
      if (ping != null) window.clearInterval(ping);
      ping = null;
      if (stopped || socket !== next) return;
      options.onStatus("down");
      const wait = Math.min(20_000, 1000 * 2 ** attempt);
      attempt += 1;
      retry = window.setTimeout(connect, wait);
    };
  }

  connect();
  return () => {
    stopped = true;
    if (retry != null) window.clearTimeout(retry);
    cleanupSocket();
  };
}
