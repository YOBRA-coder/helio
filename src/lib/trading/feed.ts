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
}

export interface FeedStatus {
  state: "off" | "connecting" | "live" | "stale" | "error";
  detail: string;
  ticks: number;
  reconnects: number;
  lastTickAt: number;
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
