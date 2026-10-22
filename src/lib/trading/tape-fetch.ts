export interface TapeMarket {
  id: string;
  question: string;
  slug: string;
  eventSlug: string;
  eventTitle: string;
  outcomes: [string, string];
  yesPrice: number;
  bestBid: number;
  bestAsk: number;
  liquidity: number;
  volume: number;
  endAt: number;
  startAt: number;
  description: string;
  group: string;
  restricted: boolean;
  yesTokenId: string | null;
  noTokenId: string | null;
  conditionId: string | null;
  booked: boolean;
}

export interface TapePayload {
  spot: number | null;
  spotSource: string;
  fetchedAt: number;
  markets: TapeMarket[];
  error: string | null;
}

export async function getJson(url: string, ms = 8000): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { accept: "application/json", "user-agent": "helios-desk/0.4 (+paper-trading research)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function num(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function asStrings(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [];
    }
  }
  return [];
}

function priceOr(value: unknown, fallback: number) {
  const n = num(value, NaN);
  if (!Number.isFinite(n) || n <= 0 || n >= 1) return fallback;
  return n;
}

function bestLevel(levels: unknown, mode: "max" | "min") {
  if (!Array.isArray(levels)) return null;
  let best: number | null = null;
  for (const row of levels) {
    const rec = asRecord(row);
    const price = num(rec?.price, NaN);
    const size = num(rec?.size, NaN);
    if (!Number.isFinite(price) || price <= 0 || price >= 1) continue;
    if (Number.isFinite(size) && size <= 0) continue;
    best = best == null ? price : mode === "max" ? Math.max(best, price) : Math.min(best, price);
  }
  return best;
}

export function topOfBook(payload: unknown) {
  const rec = asRecord(payload);
  if (!rec) return null;
  const bid = bestLevel(rec.bids, "max");
  const ask = bestLevel(rec.asks, "min");
  if (bid != null && ask != null && ask >= bid) return { bid, ask };
  if (bid != null) return { bid, ask: Math.min(0.999, Math.max(bid + 0.01, 0.999)) };
  if (ask != null) return { bid: Math.max(0.001, ask - 0.01), ask };
  return null;
}

const WINDOW_MS: Record<string, number> = { "5m": 300_000, "15m": 900_000, "1h": 3_600_000, "4h": 14_400_000 };

const SERIES: Array<[string, string]> = [
  ["5m", "btc-up-or-down-5m"],
  ["15m", "btc-up-or-down-15m"],
  ["1h", "btc-up-or-down-hourly"],
  ["4h", "btc-up-or-down-4h"],
];

function pushMarket(
  markets: TapeMarket[],
  seen: Set<string>,
  market: Record<string, unknown>,
  eventSlug: string,
  group: string,
  fetchedAt: number,
) {
  if (market.closed === true || market.active === false) return;
  const id = String(market.id ?? "");
  const question = typeof market.question === "string" ? market.question : "";
  if (!id || seen.has(id) || !/bitcoin/i.test(question)) return;
  const endAt = Date.parse(typeof market.endDate === "string" ? market.endDate : "");
  if (!Number.isFinite(endAt) || endAt < fetchedAt - 30_000) return;
  const startRaw = typeof market.eventStartTime === "string" ? market.eventStartTime : "";
  const parsedStart = Date.parse(startRaw);
  // The window start is the one number the Up/Down rule hangs on, and the feed's start field is not always present or
  // exact. Rolling windows have a fixed length, so end minus length is authoritative.
  const dur = WINDOW_MS[group];
  const startAt = dur ? endAt - dur : parsedStart;
  const outcomes = asStrings(market.outcomes);
  const prices = asStrings(market.outcomePrices).map((p) => num(p, NaN));
  const tokens = asStrings(market.clobTokenIds).filter((token) => /^\d{10,}$/.test(token));
  const yes = Number.isFinite(prices[0]) ? prices[0] : 0.5;
  const spread = num(market.spread, 0.02);
  const bid = priceOr(market.bestBid, Math.max(0.01, yes - spread / 2));
  const ask = priceOr(market.bestAsk, Math.min(0.99, yes + spread / 2));
  seen.add(id);
  markets.push({
    id,
    question,
    slug: typeof market.slug === "string" ? market.slug : id,
    eventSlug,
    eventTitle: question,
    outcomes: [outcomes[0] || "Up", outcomes[1] || "Down"],
    yesPrice: yes,
    bestBid: Math.min(bid, ask),
    bestAsk: Math.max(ask, Math.min(bid, ask) + 0.001),
    liquidity: num(market.liquidityNum, num(market.liquidity, 0)),
    volume: num(market.volumeNum, num(market.volume, 0)),
    endAt,
    startAt: Number.isFinite(startAt) ? startAt : fetchedAt,
    description: typeof market.description === "string" ? market.description.slice(0, 700) : "",
    group,
    // Polymarket's per-market `restricted` flag is not an eligibility check, so it must not gate paper trading.
    // Eligibility is checked against Polymarket's geoblock endpoint before any live order is sent.
    restricted: false,
    yesTokenId: tokens[0] ?? null,
    noTokenId: tokens[1] ?? null,
    conditionId: typeof market.conditionId === "string" ? market.conditionId : null,
    booked: false,
  });
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return null;
}

export async function loadTape(): Promise<TapePayload> {
  const fetchedAt = Date.now();
  let spot: number | null = null;
  let error: string | null = null;
  const markets: TapeMarket[] = [];
  const seen = new Set<string>();

  try {
    const spotJson = asRecord(await getJson("https://api.coinbase.com/v2/prices/BTC-USD/spot"));
    const data = asRecord(spotJson?.data);
    const amount = num(data?.amount, NaN);
    spot = Number.isFinite(amount) ? amount : null;
  } catch {
    error = "BTC reference print unavailable";
  }

  try {
    const min = new Date(fetchedAt - 90_000).toISOString();
    const payloads = await Promise.all(
      SERIES.map(([, slug]) =>
        getJson(
          `https://gamma-api.polymarket.com/events?series_slug=${slug}&closed=false&active=true&end_date_min=${encodeURIComponent(min)}&limit=3&order=endDate&ascending=true`,
        ).catch(() => null),
      ),
    );
    payloads.forEach((payload, index) => {
      const events = Array.isArray(payload) ? payload : [];
      const group = SERIES[index]?.[0] ?? "BTC";
      for (const rawEvent of events) {
        const event = asRecord(rawEvent);
        if (!event || event.closed === true) continue;
        const eventSlug = typeof event.slug === "string" ? event.slug : "";
        const list = Array.isArray(event.markets) ? event.markets : [];
        for (const raw of list) {
          const market = asRecord(raw);
          if (!market) continue;
          pushMarket(markets, seen, market, eventSlug, group, fetchedAt);
        }
      }
    });
    const books = await Promise.all(
      markets.slice(0, 12).map(async (market) => {
        if (!market.yesTokenId) return null;
        try {
          const book = await getJson(`https://clob.polymarket.com/book?token_id=${market.yesTokenId}`, 5000);
          return { id: market.id, quote: topOfBook(book) };
        } catch {
          return null;
        }
      }),
    );
    for (const row of books) {
      if (!row?.quote) continue;
      const market = markets.find((item) => item.id === row.id);
      if (!market) continue;
      market.bestBid = row.quote.bid;
      market.bestAsk = Math.max(row.quote.ask, row.quote.bid);
      market.booked = true;
    }
    markets.sort((a, b) => a.endAt - b.endAt || b.liquidity - a.liquidity);
    if (markets.length === 0) {
      error = error ? `${error}. No open Bitcoin windows on Polymarket.` : "No open Bitcoin windows on Polymarket.";
    }
  } catch {
    error = error ? `${error}. Polymarket discovery failed.` : "Polymarket discovery failed";
  }

  return {
    spot,
    spotSource: "Coinbase BTC-USD",
    fetchedAt,
    markets: markets.slice(0, 36),
    error,
  };
}

/** BTC-USD 1-minute candle open at or just before `ts`. Used to recover an "Up or Down" window's open price. */
export let lastOpenError = "";

/** BTC price at the start of the minute containing `ts`. Tries Coinbase, then Kraken, then Binance. */
export async function fetchSpotAt(ts: number): Promise<number | null> {
  const minute = Math.floor(ts / 60_000) * 60_000;
  const sources: Array<() => Promise<number | null>> = [
    async () => {
      const start = new Date(minute).toISOString();
      const end = new Date(minute + 60_000).toISOString();
      const rows = await getJson(
        `https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
        6000,
      );
      if (!Array.isArray(rows)) return null;
      // [time, low, high, open, close, volume]; pick the candle that starts exactly at the minute
      const hit = (rows as unknown[][]).find((r) => num(r?.[0], -1) * 1000 === minute) ?? (rows as unknown[][])[rows.length - 1];
      const open = num(hit?.[3], NaN);
      return Number.isFinite(open) ? open : null;
    },
    async () => {
      const data = asRecord(await getJson(`https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1&since=${Math.floor(minute / 1000) - 60}`, 6000));
      const result = asRecord(data?.result);
      if (!result) return null;
      const key = Object.keys(result).find((k) => k !== "last");
      const rows = key && Array.isArray(result[key]) ? (result[key] as unknown[][]) : [];
      const hit = rows.find((r) => num(r?.[0], -1) * 1000 === minute);
      const open = num(hit?.[1], NaN);
      return Number.isFinite(open) ? open : null;
    },
    async () => {
      const rows = await getJson(`https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1m&startTime=${minute}&limit=1`, 6000);
      const open = num((Array.isArray(rows) ? (rows[0] as unknown[]) : [])?.[1], NaN);
      return Number.isFinite(open) ? open : null;
    },
  ];
  const names = ["Coinbase", "Kraken", "Binance"];
  const errs: string[] = [];
  for (let i = 0; i < sources.length; i += 1) {
    try {
      const v = await sources[i]();
      if (v != null) return v;
      errs.push(`${names[i]}: no candle for that minute`);
    } catch (e) {
      errs.push(`${names[i]}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  lastOpenError = errs.join(" · ");
  return null;
}

/**
 * Ask Polymarket whether each market has resolved. Returns gammaId -> YES won.
 * Markets that are not resolved yet (or return ambiguous prices) are omitted.
 */
export async function fetchResolutions(gammaIds: string[]): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = {};
  const ids = [...new Set(gammaIds)].slice(0, 20);
  await Promise.all(
    ids.map(async (id) => {
      try {
        const m = asRecord(await getJson(`https://gamma-api.polymarket.com/markets/${encodeURIComponent(id)}`, 6000));
        if (!m) return;
        const verdict = parseResolution(m);
        if (verdict != null) out[id] = verdict;
      } catch {
        /* leave unresolved */
      }
    }),
  );
  return out;
}

export function parseResolution(m: Record<string, unknown>): boolean | null {
  if (m.closed !== true) return null;
  const prices = asStrings(m.outcomePrices).map((p) => num(p, NaN));
  if (prices.length < 2 || !Number.isFinite(prices[0]) || !Number.isFinite(prices[1])) return null;
  if (prices[0] >= 0.99 && prices[1] <= 0.01) return true;
  if (prices[1] >= 0.99 && prices[0] <= 0.01) return false;
  return null;
}

/** Fresh best bid/ask for a set of YES tokens. Failures are skipped, not thrown. */
export async function fetchQuotes(tokenIds: string[]): Promise<Array<{ tokenId: string; bid: number; ask: number }>> {
  const ids = [...new Set(tokenIds)].slice(0, 24);
  const rows = await Promise.all(
    ids.map(async (tokenId) => {
      try {
        const book = await getJson(`https://clob.polymarket.com/book?token_id=${tokenId}`, 4000);
        const q = topOfBook(book);
        return q ? { tokenId, bid: q.bid, ask: Math.max(q.ask, q.bid) } : null;
      } catch {
        return null;
      }
    }),
  );
  return rows.filter((r): r is { tokenId: string; bid: number; ask: number } => r != null);
}
