/**
 * Polymarket order-book feed for the worker: one websocket on the CLOB "market" channel instead of a REST /book call
 * per market every few seconds. Quotes arrive the moment the book changes, so the price the desk decides on is
 * fractions of a second old rather than up to 2.5 seconds, and the worker makes far fewer requests.
 *
 * Rules, like the BTC feed:
 *  - It is an optional speed-up. The runner keeps the REST poll as a fallback and only trusts this feed while
 *    `healthy()` is true.
 *  - It never throws into the trading loop. Problems only change `status()`.
 *  - New tokens are added with Polymarket's subscribe-more message. If a new token has not produced a quote a few
 *    seconds later (the message was ignored, or the socket is half-dead), the feed reconnects with the full list.
 */
import { SOCKET_URL, quotesFrom, type LiveQuote } from "./book-parse.ts";
import type { WsCtor } from "./feed.ts";

export interface BookQuote extends LiveQuote {
  /** local receipt time of the newest message for this token */
  at: number;
}

export interface BookFeedStatus {
  state: "off" | "connecting" | "live" | "error";
  detail: string;
  tokens: number;
  quotes: number;
  messages: number;
  reconnects: number;
  lastMessageAt: number;
}

export interface BookFeedOpts {
  url?: string;
  now?: () => number;
  WebSocketCtor?: WsCtor | null;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (h: unknown) => void;
  /** send a keepalive this often (Polymarket drops idle sockets) */
  pingMs?: number;
  /** nothing at all (not even a PONG) for this long = dead socket */
  silenceMs?: number;
  /** a token added to a live socket must produce a quote within this long, or we reconnect */
  verifyMs?: number;
  /** most tokens on one socket */
  maxTokens?: number;
}

export class BookFeed {
  private o: Required<Omit<BookFeedOpts, "WebSocketCtor">> & { WebSocketCtor: WsCtor | null };
  private ws: ReturnType<typeof makeWs> | null = null;
  private wanted = false;
  private tokens = new Set<string>();
  private subscribed = new Set<string>();
  private quotesByToken = new Map<string, BookQuote>();
  private verify = new Map<string, number>();
  /** tokens that already failed one resubscribe (usually a one-sided book): we stop checking them so we never loop */
  private gaveUp = new Set<string>();
  private messages = 0;
  private reconnects = 0;
  private lastMessageAt = 0;
  private backoff = 1000;
  private open = false;
  private retry: unknown = null;
  private ping: unknown = null;
  private watch: unknown = null;
  private lastForcedAt = 0;
  private state: BookFeedStatus["state"] = "off";
  private detail = "not started";

  constructor(opts: BookFeedOpts = {}) {
    const g = globalThis as unknown as { WebSocket?: WsCtor };
    this.o = {
      url: opts.url ?? SOCKET_URL,
      now: opts.now ?? Date.now,
      WebSocketCtor: opts.WebSocketCtor === undefined ? (g.WebSocket ?? null) : opts.WebSocketCtor,
      setTimer: opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms)),
      clearTimer: opts.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>)),
      pingMs: opts.pingMs ?? 10_000,
      silenceMs: opts.silenceMs ?? 30_000,
      verifyMs: opts.verifyMs ?? 5_000,
      maxTokens: opts.maxTokens ?? 60,
    };
  }

  start() {
    if (this.wanted) return;
    if (!this.o.WebSocketCtor) {
      this.state = "off";
      this.detail = "this Node has no built-in WebSocket (needs Node 22): using the REST order-book poll";
      return;
    }
    this.wanted = true;
    this.connect();
  }

  stop() {
    this.wanted = false;
    this.clearAll();
    this.drop();
    this.state = "off";
    this.detail = "stopped";
  }

  /** Tell the feed which YES tokens matter right now. Safe to call every second. */
  setAssets(ids: string[]) {
    const next = new Set(ids.filter((x) => /^\d{10,}$/.test(x)).slice(0, this.o.maxTokens));
    const added = [...next].filter((x) => !this.tokens.has(x));
    this.tokens = next;
    // forget quotes for tokens we no longer follow
    for (const k of [...this.quotesByToken.keys()]) if (!next.has(k)) this.quotesByToken.delete(k);
    for (const k of [...this.subscribed]) if (!next.has(k)) this.subscribed.delete(k);
    for (const k of [...this.gaveUp]) if (!next.has(k)) this.gaveUp.delete(k);
    if (!this.wanted || !added.length) return;
    if (this.ws && this.open) this.subscribeMore(added);
    // otherwise onopen subscribes to everything in `tokens`
  }

  /** Newest known quote for each requested token (only tokens that have produced one). */
  quotes(ids: string[]): BookQuote[] {
    const out: BookQuote[] = [];
    for (const id of ids) {
      const q = this.quotesByToken.get(id);
      if (q) out.push(q);
    }
    return out;
  }

  /** True while the socket is open and has said something recently. Callers should fall back to REST when false. */
  healthy(): boolean {
    return this.wanted && this.open && this.state === "live" && this.o.now() - this.lastMessageAt < this.o.silenceMs;
  }

  status(): BookFeedStatus {
    return {
      state: this.healthy() ? "live" : this.state === "live" ? "error" : this.state,
      detail: this.detail,
      tokens: this.tokens.size,
      quotes: this.quotesByToken.size,
      messages: this.messages,
      reconnects: this.reconnects,
      lastMessageAt: this.lastMessageAt,
    };
  }

  // ── internals ──

  private clearAll() {
    for (const h of [this.retry, this.ping, this.watch]) if (h) this.o.clearTimer(h);
    this.retry = this.ping = this.watch = null;
  }

  private drop() {
    const ws = this.ws;
    this.ws = null;
    this.open = false;
    this.subscribed.clear();
    this.verify.clear();
    if (!ws) return;
    ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
    try {
      ws.close();
    } catch {
      /* already closed */
    }
  }

  private scheduleRetry(why: string) {
    this.state = "error";
    this.detail = why;
    if (!this.wanted || this.retry) return;
    this.clearAll();
    const wait = this.backoff;
    this.backoff = Math.min(30_000, this.backoff * 2);
    this.retry = this.o.setTimer(() => {
      this.retry = null;
      this.reconnects += 1;
      this.connect();
    }, wait);
  }

  private subscribeMore(ids: string[]) {
    if (!this.ws || !this.open || !ids.length) return;
    try {
      this.ws.send(JSON.stringify({ assets_ids: ids, operation: "subscribe", custom_feature_enabled: true }));
    } catch {
      return;
    }
    const deadline = this.o.now() + this.o.verifyMs;
    for (const id of ids) {
      this.subscribed.add(id);
      if (!this.quotesByToken.has(id) && !this.gaveUp.has(id)) this.verify.set(id, deadline);
    }
  }

  private connect() {
    const Ctor = this.o.WebSocketCtor;
    if (!Ctor || !this.wanted) return;
    this.state = "connecting";
    this.detail = "connecting";
    this.drop();
    let ws: ReturnType<typeof makeWs>;
    try {
      ws = makeWs(Ctor, this.o.url);
    } catch (e) {
      this.scheduleRetry(e instanceof Error ? e.message : "could not open the socket");
      return;
    }
    this.ws = ws;
    this.lastMessageAt = this.o.now(); // the silence clock starts at connect
    ws.onopen = () => {
      if (this.ws !== ws) return;
      this.open = true;
      const ids = [...this.tokens];
      // an empty list is legal: the socket stays up and setAssets() subscribes later
      ws.send(JSON.stringify({ assets_ids: ids, type: "market", custom_feature_enabled: true, initial_dump: true }));
      for (const id of ids) this.subscribed.add(id);
      this.detail = `subscribed to ${ids.length} token${ids.length === 1 ? "" : "s"}`;
      this.state = "live";
      this.lastMessageAt = this.o.now();
      this.armTimers(ws);
    };
    ws.onmessage = (ev) => {
      if (this.ws !== ws) return;
      const now = this.o.now();
      this.lastMessageAt = now;
      this.state = "live";
      this.backoff = 1000;
      if (typeof ev.data !== "string" || ev.data === "PONG") return;
      let payload: unknown;
      try {
        payload = JSON.parse(ev.data);
      } catch {
        return;
      }
      this.messages += 1;
      const found = new Map<string, LiveQuote>();
      quotesFrom(payload, found);
      for (const [id, q] of found) {
        if (!this.tokens.has(id)) continue;
        this.quotesByToken.set(id, { ...q, at: now });
        this.verify.delete(id);
        this.gaveUp.delete(id);
      }
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.drop();
      this.scheduleRetry("socket closed: reconnecting");
    };
    ws.onerror = () => {
      if (this.ws !== ws) return;
      this.drop();
      this.scheduleRetry("socket error: reconnecting");
    };
  }

  private armTimers(ws: ReturnType<typeof makeWs>) {
    let lastPing = this.o.now();
    const tick = () => {
      if (!this.wanted || this.ws !== ws) return;
      const now = this.o.now();
      if (now - this.lastMessageAt > this.o.silenceMs) {
        this.drop();
        this.scheduleRetry(`no data for ${Math.round(this.o.silenceMs / 1000)}s: reconnecting`);
        return;
      }
      // a token we added never produced a quote: the subscribe-more message did not take, so rebuild the subscription
      const stuck = [...this.verify].filter(([, deadline]) => now > deadline).map(([id]) => id);
      if (stuck.length && now - this.lastForcedAt > 15_000) {
        this.lastForcedAt = now;
        for (const id of stuck) this.gaveUp.add(id);
        this.detail = "a new token got no quote: resubscribing";
        this.drop();
        this.scheduleRetry("resubscribing");
        return;
      }
      if (now - lastPing >= this.o.pingMs) {
        lastPing = now;
        try {
          ws.send("PING");
        } catch {
          /* the close handler will deal with it */
        }
      }
      this.ping = this.o.setTimer(tick, 2_000);
    };
    this.ping = this.o.setTimer(tick, 2_000);
  }
}

function makeWs(Ctor: WsCtor, url: string) {
  return new Ctor(url);
}
