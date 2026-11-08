/**
 * Live BTC price feed: Coinbase's public websocket (ticker channel), so the desk sees every trade within a
 * fraction of a second instead of one REST print every ~6 seconds.
 *
 * Design rules:
 *  - The feed is an optional speed-up. Consumers must check `ageMs` and fall back to the REST price when it is old.
 *  - It never throws into the trading loop. Errors only change `status()`.
 *  - Bad ticks (non-numeric, absurd jumps) are dropped, not trusted.
 *  - Uses Node 22's built-in WebSocket. If it is missing, or HELIOS_WS_FEED=0, the feed stays off.
 */

export interface FeedTick {
  price: number;
  /** local receipt time (ms). Local time avoids clock-skew against the exchange's own timestamps. */
  at: number;
  /** which venues produced this price, e.g. "Coinbase + Kraken websocket" (multi-venue feed only) */
  source?: string;
}

export interface VenueStatus {
  id: string;
  name: string;
  state: "connecting" | "live" | "error" | "off";
  /** true while this venue's newest print is under 2.5s old and not rejected as an outlier */
  used: boolean;
  ticks: number;
  reconnects: number;
  lastTickAt: number;
  /** learned premium over the dollar venues in basis points (USDT venues only; 0 for dollar venues) */
  offsetBp: number;
  host: string;
  detail: string;
}

/** What the worker needs from a BTC price feed. Both SpotFeed and MultiFeed satisfy it. */
export interface PriceFeed {
  start(): void;
  stop(): void;
  latest(): FeedTick | null;
  status(): FeedStatus;
  /** price at (or within `tolMs` of) a past instant, from the feed's own recording; null when unknown */
  at?(ts: number, tolMs?: number): number | null;
  /** spread between the venues currently voting, in basis points; null with fewer than two */
  spreadBp?(): number | null;
}

export interface FeedStatus {
  state: "off" | "connecting" | "live" | "stale" | "error";
  detail: string;
  ticks: number;
  reconnects: number;
  lastTickAt: number;
  venues?: VenueStatus[];
}

interface WsLike {
  onopen: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  send(data: string): void;
  close(): void;
}
export type WsCtor = new (url: string) => WsLike;

export interface FeedOpts {
  url?: string;
  productId?: string;
  now?: () => number;
  WebSocketCtor?: WsCtor | null;
  /** timers are injectable so tests can drive reconnects and the watchdog by hand */
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (h: unknown) => void;
  /** no message for this long = the socket is silently dead: drop it and reconnect */
  silenceMs?: number;
  /** a tick this far from the previous one is treated as a bad print */
  maxJump?: number;
}

export const COINBASE_WS = "wss://ws-feed.exchange.coinbase.com";

export function parseTicker(raw: unknown, productId = "BTC-USD"): number | null {
  let msg: unknown = raw;
  if (typeof raw === "string") {
    try {
      msg = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!msg || typeof msg !== "object") return null;
  const m = msg as Record<string, unknown>;
  if (m.type !== "ticker" || m.product_id !== productId) return null;
  const price = Number(m.price);
  return Number.isFinite(price) && price > 1000 && price < 10_000_000 ? price : null;
}

export class SpotFeed {
  private o: Required<Omit<FeedOpts, "WebSocketCtor">> & { WebSocketCtor: WsCtor | null };
  private ws: WsLike | null = null;
  private tick: FeedTick | null = null;
  private wanted = false;
  private reconnects = 0;
  private ticks = 0;
  private backoff = 1000;
  private retry: unknown = null;
  private watchdog: unknown = null;
  private state: FeedStatus["state"] = "off";
  private detail = "not started";

  constructor(opts: FeedOpts = {}) {
    const g = globalThis as unknown as { WebSocket?: WsCtor };
    this.o = {
      url: opts.url ?? COINBASE_WS,
      productId: opts.productId ?? "BTC-USD",
      now: opts.now ?? Date.now,
      WebSocketCtor: opts.WebSocketCtor === undefined ? (g.WebSocket ?? null) : opts.WebSocketCtor,
      setTimer: opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms)),
      clearTimer: opts.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>)),
      silenceMs: opts.silenceMs ?? 15_000,
      maxJump: opts.maxJump ?? 0.05,
    };
  }

  start() {
    if (this.wanted) return;
    if (!this.o.WebSocketCtor) {
      this.state = "off";
      this.detail = "this Node has no built-in WebSocket (needs Node 22): using the 6-second REST price";
      return;
    }
    this.wanted = true;
    this.connect();
  }

  stop() {
    this.wanted = false;
    if (this.retry) this.o.clearTimer(this.retry);
    if (this.watchdog) this.o.clearTimer(this.watchdog);
    this.retry = this.watchdog = null;
    this.drop();
    this.state = "off";
    this.detail = "stopped";
  }

  /** Newest accepted print, or null before the first one. Callers decide how old is too old. */
  latest(): FeedTick | null {
    return this.tick;
  }

  status(): FeedStatus {
    const now = this.o.now();
    let state = this.state;
    if (state === "live" && this.tick && now - this.tick.at > 5000) state = "stale";
    return { state, detail: this.detail, ticks: this.ticks, reconnects: this.reconnects, lastTickAt: this.tick?.at ?? 0 };
  }

  private drop() {
    const ws = this.ws;
    this.ws = null;
    if (!ws) return;
    ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
    try {
      ws.close();
    } catch {
      /* already closed */
    }
  }

  private arm() {
    if (this.watchdog) this.o.clearTimer(this.watchdog);
    this.watchdog = this.o.setTimer(() => {
      if (!this.wanted) return;
      this.detail = `no data for ${Math.round(this.o.silenceMs / 1000)}s: reconnecting`;
      this.state = "error";
      this.drop();
      this.scheduleRetry();
    }, this.o.silenceMs);
  }

  private scheduleRetry() {
    if (!this.wanted || this.retry) return;
    if (this.watchdog) this.o.clearTimer(this.watchdog);
    this.watchdog = null;
    const wait = this.backoff;
    this.backoff = Math.min(30_000, this.backoff * 2);
    this.retry = this.o.setTimer(() => {
      this.retry = null;
      this.reconnects += 1;
      this.connect();
    }, wait);
  }

  private connect() {
    const Ctor = this.o.WebSocketCtor;
    if (!Ctor || !this.wanted) return;
    this.state = "connecting";
    this.detail = "connecting";
    let ws: WsLike;
    try {
      ws = new Ctor(this.o.url);
    } catch (e) {
      this.state = "error";
      this.detail = e instanceof Error ? e.message : "could not open the socket";
      this.scheduleRetry();
      return;
    }
    this.ws = ws;
    this.arm();
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe", product_ids: [this.o.productId], channels: ["ticker"] }));
      this.detail = "subscribed";
    };
    ws.onmessage = (ev) => {
      const price = parseTicker(ev.data, this.o.productId);
      if (price == null) return;
      const prev = this.tick?.price;
      if (prev && Math.abs(price / prev - 1) > this.o.maxJump) {
        this.detail = `dropped a bad print ${price} (previous ${prev})`;
        return;
      }
      this.tick = { price, at: this.o.now() };
      this.ticks += 1;
      this.backoff = 1000;
      this.state = "live";
      this.detail = "live";
      this.arm();
    };
    const lost = (why: string) => () => {
      if (this.ws !== ws) return;
      this.drop();
      this.state = "error";
      this.detail = why;
      this.scheduleRetry();
    };
    ws.onclose = lost("socket closed: reconnecting");
    ws.onerror = lost("socket error: reconnecting");
  }
}

// ───────────────────────────── multi-venue feed ─────────────────────────────
//
// One socket per exchange. Every accepted print is aligned to the dollar level and becomes the desk's price, so the
// desk reacts to whichever venue moves first, and one frozen or glitching venue cannot move the price on its own.
//
//  - Alignment: Binance quotes USDT, which trades a few basis points away from USD. Its premium is learned slowly
//    against the dollar venues (Coinbase, Kraken) and removed, so the level does not jump when a venue drops in or out.
//  - Outliers: a print more than OUTLIER_BP from what the other live venues say is rejected until they agree again.
//  - Freshness: a venue stops voting 2.5s after its last print.
//  - Memory: the feed records its own price every 0.5s for hours, so "what was BTC when this window opened" is
//    answered from the same source the desk trades on, with no candle lookup (and no "waiting for the open" block).

const VENUE_FRESH_MS = 2_500;
const OUTLIER_BP = 15;
const HISTORY_STEP_MS = 500;
const HISTORY_MAX = 6 * 3600 * 2;

export interface VenueSpec {
  id: string;
  name: string;
  /** tried in turn: each reconnect moves to the next host */
  urls: string[];
  /** quoted in dollars (true) or USDT (false: its premium is learned and removed) */
  usd: boolean;
  subscribe?: string;
  parse: (raw: unknown) => number | null;
  ping?: { msg: string; everyMs: number };
}

function asObject(raw: unknown): Record<string, unknown> | null {
  let msg: unknown = raw;
  if (typeof raw === "string") {
    try {
      msg = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return msg && typeof msg === "object" ? (msg as Record<string, unknown>) : null;
}

const sane = (n: number) => Number.isFinite(n) && n > 1000 && n < 10_000_000;

/** Binance bookTicker (best bid/ask) for BTCUSDT: the mid. Accepts the combined-stream wrapper too. */
export function parseBinanceBook(raw: unknown): number | null {
  let m = asObject(raw);
  if (m && m.data && typeof m.data === "object" && m.stream) m = m.data as Record<string, unknown>;
  if (!m || m.s !== "BTCUSDT") return null;
  const bid = Number(m.b);
  const ask = Number(m.a);
  if (!sane(bid) || !sane(ask) || bid > ask) return null;
  return Math.round(((bid + ask) / 2) * 1e4) / 1e4;
}

/** Kraken v2 ticker for BTC/USD: the last trade, else the mid. */
export function parseKrakenTicker(raw: unknown): number | null {
  const m = asObject(raw);
  if (!m || m.channel !== "ticker" || !Array.isArray(m.data)) return null;
  const row = m.data[0] as Record<string, unknown> | undefined;
  if (!row || row.symbol !== "BTC/USD") return null;
  const last = Number(row.last);
  if (sane(last)) return last;
  const bid = Number(row.bid);
  const ask = Number(row.ask);
  return sane(bid) && sane(ask) && bid <= ask ? (bid + ask) / 2 : null;
}

/**
 * Polymarket's legacy RTDS relay of the Chainlink BTC/USD stream (what its up/down windows settle on).
 * Polymarket has deprecated this endpoint in favour of an authenticated one, so it is opt-in:
 * HELIOS_FEED_VENUES=coinbase,kraken,binance,chainlink
 */
export function parseChainlinkRtds(raw: unknown): number | null {
  const m = asObject(raw);
  if (!m || m.topic !== "crypto_prices_chainlink") return null;
  const p = m.payload as Record<string, unknown> | undefined;
  if (!p || String(p.symbol).toLowerCase() !== "btc/usd") return null;
  const v = Number(p.value);
  return sane(v) ? v : null;
}

export const VENUES: Record<string, VenueSpec> = {
  coinbase: {
    id: "coinbase",
    name: "Coinbase",
    urls: [COINBASE_WS],
    usd: true,
    subscribe: JSON.stringify({ type: "subscribe", product_ids: ["BTC-USD"], channels: ["ticker"] }),
    parse: (raw) => parseTicker(raw),
  },
  binance: {
    id: "binance",
    name: "Binance",
    urls: ["wss://stream.binance.com:9443/ws/btcusdt@bookTicker", "wss://data-stream.binance.vision/ws/btcusdt@bookTicker"],
    usd: false,
    parse: parseBinanceBook,
  },
  kraken: {
    id: "kraken",
    name: "Kraken",
    urls: ["wss://ws.kraken.com/v2"],
    usd: true,
    subscribe: JSON.stringify({ method: "subscribe", params: { channel: "ticker", symbol: ["BTC/USD"] } }),
    parse: parseKrakenTicker,
  },
};

export const OPTIONAL_VENUES: Record<string, VenueSpec> = {
  chainlink: {
    id: "chainlink",
    name: "Chainlink",
    urls: ["wss://ws-live-data.polymarket.com"],
    usd: true,
    subscribe: JSON.stringify({ action: "subscribe", subscriptions: [{ topic: "crypto_prices_chainlink", type: "*", filters: JSON.stringify({ symbol: "btc/usd" }) }] }),
    parse: parseChainlinkRtds,
    ping: { msg: "PING", everyMs: 5_000 },
  },
};

/** HELIOS_FEED_VENUES="coinbase,kraken": which venues to use. Unknown or empty falls back to the default three. */
export function venuesFromEnv(raw: string | undefined): VenueSpec[] {
  const all = { ...VENUES, ...OPTIONAL_VENUES };
  const picked = (raw ?? "")
    .split(/[\s,]+/)
    .map((x) => x.trim().toLowerCase())
    .filter((x) => x in all);
  const ids = picked.length ? [...new Set(picked)] : Object.keys(VENUES);
  return ids.map((id) => all[id]);
}

interface VenueRt {
  spec: VenueSpec;
  urlIdx: number;
  ws: WsLike | null;
  state: VenueStatus["state"];
  detail: string;
  ticks: number;
  reconnects: number;
  backoff: number;
  retry: unknown;
  watchdog: unknown;
  pinger: unknown;
  lastRaw: number | null;
  lastAdj: number | null;
  lastAt: number;
  offsetBp: number | null;
  offsetAt: number;
  bad: boolean;
}

export interface MultiFeedOpts {
  venues?: VenueSpec[];
  now?: () => number;
  WebSocketCtor?: WsCtor | null;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (h: unknown) => void;
  silenceMs?: number;
  maxJump?: number;
  /** a venue votes only while its newest print is younger than this (default 2.5s; quiet tickers need more) */
  freshMs?: number;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export class MultiFeed implements PriceFeed {
  private o: { now: () => number; WebSocketCtor: WsCtor | null; setTimer: (fn: () => void, ms: number) => unknown; clearTimer: (h: unknown) => void; silenceMs: number; maxJump: number; freshMs: number };
  private rts: VenueRt[];
  private tick: FeedTick | null = null;
  private ticks = 0;
  private wanted = false;
  private hist: Array<[number, number]> = [];

  constructor(opts: MultiFeedOpts = {}) {
    const g = globalThis as unknown as { WebSocket?: WsCtor };
    this.o = {
      now: opts.now ?? Date.now,
      WebSocketCtor: opts.WebSocketCtor === undefined ? (g.WebSocket ?? null) : opts.WebSocketCtor,
      setTimer: opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms)),
      clearTimer: opts.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>)),
      silenceMs: opts.silenceMs ?? 15_000,
      maxJump: opts.maxJump ?? 0.05,
      freshMs: opts.freshMs ?? VENUE_FRESH_MS,
    };
    this.rts = (opts.venues ?? venuesFromEnv(undefined)).map((spec) => ({
      spec,
      urlIdx: 0,
      ws: null,
      state: "off",
      detail: "not started",
      ticks: 0,
      reconnects: 0,
      backoff: 1000,
      retry: null,
      watchdog: null,
      pinger: null,
      lastRaw: null,
      lastAdj: null,
      lastAt: 0,
      offsetBp: spec.usd ? 0 : null,
      offsetAt: 0,
      bad: false,
    }));
  }

  start() {
    if (this.wanted) return;
    if (!this.o.WebSocketCtor) {
      for (const rt of this.rts) {
        rt.state = "off";
        rt.detail = "this Node has no built-in WebSocket (needs Node 22)";
      }
      return;
    }
    this.wanted = true;
    for (const rt of this.rts) this.connect(rt);
  }

  stop() {
    this.wanted = false;
    for (const rt of this.rts) {
      this.clearTimers(rt);
      this.drop(rt);
      rt.state = "off";
      rt.detail = "stopped";
    }
  }

  private voting(rt: VenueRt, now = this.o.now()) {
    return rt.lastAdj != null && !rt.bad && now - rt.lastAt <= this.o.freshMs;
  }

  latest(): FeedTick | null {
    if (!this.tick) return null;
    const names = this.rts.filter((r) => this.voting(r)).map((r) => r.spec.name);
    return { price: this.tick.price, at: this.tick.at, source: names.length ? `${names.join(" + ")} websocket` : this.tick.source };
  }

  status(): FeedStatus {
    const now = this.o.now();
    const venues: VenueStatus[] = this.rts.map((r) => ({
      id: r.spec.id,
      name: r.spec.name,
      state: r.state,
      used: this.voting(r, now),
      ticks: r.ticks,
      reconnects: r.reconnects,
      lastTickAt: r.lastAt,
      offsetBp: Math.round((r.offsetBp ?? 0) * 100) / 100,
      host: this.hostOf(r),
      detail: r.detail,
    }));
    const reconnects = this.rts.reduce((a, r) => a + r.reconnects, 0);
    let state: FeedStatus["state"];
    let detail: string;
    if (!this.wanted) {
      state = "off";
      detail = this.rts[0]?.detail ?? "not started";
    } else if (this.tick) {
      state = now - this.tick.at > 5000 ? "stale" : "live";
      const n = venues.filter((v) => v.used).length;
      detail = `${n} of ${venues.length} venues voting`;
    } else if (this.rts.every((r) => r.state === "error")) {
      state = "error";
      detail = this.rts[0]?.detail ?? "all venues failed";
    } else {
      state = "connecting";
      detail = "connecting";
    }
    return { state, detail, ticks: this.ticks, reconnects, lastTickAt: this.tick?.at ?? 0, venues };
  }

  /** The feed's own recorded price at a past instant (nearest sample within `tolMs`). */
  at(ts: number, tolMs = 2500): number | null {
    const h = this.hist;
    if (!h.length) return null;
    let lo = 0;
    let hi = h.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (h[mid][0] < ts) lo = mid + 1;
      else hi = mid;
    }
    let best = h[lo];
    if (lo > 0 && Math.abs(h[lo - 1][0] - ts) <= Math.abs(best[0] - ts)) best = h[lo - 1];
    return Math.abs(best[0] - ts) <= tolMs ? best[1] : null;
  }

  /** How far apart the voting venues are right now (after alignment), in basis points. */
  spreadBp(): number | null {
    const now = this.o.now();
    const px = this.rts.filter((r) => this.voting(r, now)).map((r) => r.lastAdj as number);
    if (px.length < 2) return null;
    return ((Math.max(...px) - Math.min(...px)) / median(px)) * 1e4;
  }

  /** Recorded prices from the last `ms`, oldest first, thinned to at most `max` points (for charts). */
  recent(ms: number, max = 300): Array<[number, number]> {
    const since = this.o.now() - ms;
    const rows = this.hist.filter((r) => r[0] >= since);
    if (rows.length <= max) return rows;
    const step = rows.length / max;
    return Array.from({ length: max }, (_, i) => rows[Math.min(rows.length - 1, Math.floor(i * step))]);
  }

  // ── internals ──

  private hostOf(rt: VenueRt) {
    const url = rt.spec.urls[rt.urlIdx % rt.spec.urls.length];
    try {
      return new URL(url.replace(/^wss?:/, "https:")).host;
    } catch {
      return url;
    }
  }

  private clearTimers(rt: VenueRt) {
    for (const h of [rt.retry, rt.watchdog, rt.pinger]) if (h) this.o.clearTimer(h);
    rt.retry = rt.watchdog = rt.pinger = null;
  }

  private drop(rt: VenueRt) {
    const ws = rt.ws;
    rt.ws = null;
    if (!ws) return;
    ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
    try {
      ws.close();
    } catch {
      /* already closed */
    }
  }

  private arm(rt: VenueRt) {
    if (rt.watchdog) this.o.clearTimer(rt.watchdog);
    rt.watchdog = this.o.setTimer(() => {
      if (!this.wanted) return;
      this.fail(rt, `no data for ${Math.round(this.o.silenceMs / 1000)}s: reconnecting`);
    }, this.o.silenceMs);
  }

  private fail(rt: VenueRt, why: string) {
    this.clearTimers(rt);
    this.drop(rt);
    rt.state = "error";
    rt.detail = why;
    if (!this.wanted) return;
    const wait = rt.backoff;
    rt.backoff = Math.min(30_000, rt.backoff * 2);
    rt.retry = this.o.setTimer(() => {
      rt.retry = null;
      rt.reconnects += 1;
      rt.urlIdx += 1; // a venue with a second host tries it on the next attempt
      this.connect(rt);
    }, wait);
  }

  private connect(rt: VenueRt) {
    const Ctor = this.o.WebSocketCtor;
    if (!Ctor || !this.wanted) return;
    rt.state = "connecting";
    rt.detail = "connecting";
    const url = rt.spec.urls[rt.urlIdx % rt.spec.urls.length];
    let ws: WsLike;
    try {
      ws = new Ctor(url);
    } catch (e) {
      this.fail(rt, e instanceof Error ? e.message : "could not open the socket");
      return;
    }
    rt.ws = ws;
    this.arm(rt);
    ws.onopen = () => {
      if (rt.ws !== ws) return;
      try {
        if (rt.spec.subscribe) ws.send(rt.spec.subscribe);
      } catch {
        /* the close handler deals with it */
      }
      rt.detail = "subscribed";
      const ping = rt.spec.ping;
      if (ping) {
        const loop = () => {
          if (!this.wanted || rt.ws !== ws) return;
          try {
            ws.send(ping.msg);
          } catch {
            /* ignore */
          }
          rt.pinger = this.o.setTimer(loop, ping.everyMs);
        };
        rt.pinger = this.o.setTimer(loop, ping.everyMs);
      }
    };
    ws.onmessage = (ev) => {
      if (rt.ws !== ws) return;
      this.arm(rt); // any message proves the socket is alive (heartbeats, acks)
      const px = rt.spec.parse(ev.data);
      if (px == null) return;
      this.onPrint(rt, px);
    };
    ws.onclose = () => {
      if (rt.ws === ws) this.fail(rt, "socket closed: reconnecting");
    };
    ws.onerror = () => {
      if (rt.ws === ws) this.fail(rt, "socket error: reconnecting");
    };
  }

  private onPrint(rt: VenueRt, raw: number) {
    const now = this.o.now();
    if (rt.lastRaw && Math.abs(raw / rt.lastRaw - 1) > this.o.maxJump) {
      rt.detail = `dropped a bad print ${raw} (previous ${rt.lastRaw})`;
      return;
    }
    const others = this.rts.filter((r) => r !== rt && this.voting(r, now));
    // learn the USDT premium against the dollar venues: first sight at once, then a slow average (once a second)
    if (!rt.spec.usd) {
      const ref = others.filter((r) => r.spec.usd).map((r) => r.lastAdj as number);
      if (ref.length) {
        const obs = clampBp((raw / median(ref) - 1) * 1e4);
        if (rt.offsetBp == null) {
          rt.offsetBp = obs;
          rt.offsetAt = now;
        } else if (now - rt.offsetAt >= 1000) {
          rt.offsetBp = rt.offsetBp * 0.9 + obs * 0.1;
          rt.offsetAt = now;
        }
      }
    }
    const adj = raw / (1 + (rt.offsetBp ?? 0) / 1e4);
    if (others.length) {
      const ref = median(others.map((r) => r.lastAdj as number));
      if (Math.abs(adj / ref - 1) * 1e4 > OUTLIER_BP) {
        rt.bad = true;
        rt.detail = `rejected ${raw.toFixed(2)}: ${(((adj / ref) - 1) * 1e4).toFixed(0)}bp from the other venues`;
        return;
      }
    }
    rt.bad = false;
    rt.lastRaw = raw;
    rt.lastAdj = adj;
    rt.lastAt = now;
    rt.ticks += 1;
    rt.backoff = 1000;
    rt.state = "live";
    rt.detail = "live";
    this.ticks += 1;
    const names = this.rts.filter((r) => this.voting(r, now)).map((r) => r.spec.name);
    this.tick = { price: adj, at: now, source: `${names.join(" + ")} websocket` };
    const last = this.hist[this.hist.length - 1];
    if (!last || now - last[0] >= HISTORY_STEP_MS) {
      this.hist.push([now, adj]);
      if (this.hist.length > HISTORY_MAX) this.hist.splice(0, this.hist.length - HISTORY_MAX);
    }
  }
}

function clampBp(n: number) {
  return Math.max(-60, Math.min(60, n));
}
