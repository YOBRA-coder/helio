import assert from "node:assert/strict";
import test from "node:test";
import { MultiFeed, VENUES, parseBinanceBook, parseKrakenTicker, venuesFromEnv, type WsCtor } from "./feed.ts";

class FakeWs {
  static all: FakeWs[] = [];
  sent: string[] = [];
  closed = false;
  onopen: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onclose: ((ev: unknown) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  url: string;
  constructor(url: string) {
    this.url = url;
    FakeWs.all.push(this);
  }
  send(d: string) {
    this.sent.push(d);
  }
  close() {
    this.closed = true;
  }
  say(obj: unknown) {
    this.onmessage?.({ data: typeof obj === "string" ? obj : JSON.stringify(obj) });
  }
}

const sockets = (match: string) => FakeWs.all.filter((w) => w.url.includes(match) && !w.closed);
const cb = (px: number) => ({ type: "ticker", product_id: "BTC-USD", price: String(px) });
const kr = (px: number) => ({ channel: "ticker", type: "update", data: [{ symbol: "BTC/USD", last: px, bid: px - 1, ask: px + 1 }] });
const bn = (mid: number) => ({ u: 1, s: "BTCUSDT", b: String(mid - 0.01), B: "1", a: String(mid + 0.01), A: "1" });

function rig() {
  FakeWs.all = [];
  let t = 5_000_000;
  const timers: Array<{ fn: () => void; at: number; dead?: boolean }> = [];
  const feed = new MultiFeed({
    now: () => t,
    WebSocketCtor: FakeWs as unknown as WsCtor,
    setTimer: (fn, ms) => {
      const h = { fn, at: t + ms };
      timers.push(h);
      return h;
    },
    clearTimer: (h) => {
      (h as { dead?: boolean }).dead = true;
    },
  });
  const advance = (ms: number) => {
    t += ms;
    for (const h of timers.filter((x) => !x.dead && x.at <= t)) {
      h.dead = true;
      h.fn();
    }
  };
  feed.start();
  return { feed, advance, now: () => t };
}

test("parsers read the real message shapes and ignore everything else", () => {
  assert.equal(parseBinanceBook(JSON.stringify(bn(84000))), 84000);
  assert.equal(parseBinanceBook({ stream: "btcusdt@bookTicker", data: bn(84000) }), 84000);
  assert.equal(parseBinanceBook({ s: "ETHUSDT", b: "3000", a: "3001" }), null);
  assert.equal(parseBinanceBook({ s: "BTCUSDT", b: "84001", a: "84000" }), null, "crossed book");
  assert.equal(parseBinanceBook("nope"), null);
  assert.equal(parseKrakenTicker(JSON.stringify(kr(84000.5))), 84000.5);
  assert.equal(parseKrakenTicker({ channel: "heartbeat" }), null);
  assert.equal(parseKrakenTicker({ channel: "ticker", data: [{ symbol: "ETH/USD", last: 3000 }] }), null);
});

test("each venue connects to its own host and sends its own subscription", () => {
  rig();
  const cbWs = sockets("coinbase")[0];
  const bnWs = sockets("binance.com")[0];
  const krWs = sockets("kraken")[0];
  assert.ok(cbWs && bnWs && krWs);
  cbWs.onopen?.({});
  bnWs.onopen?.({});
  krWs.onopen?.({});
  assert.deepEqual(JSON.parse(cbWs.sent[0]), { type: "subscribe", product_ids: ["BTC-USD"], channels: ["ticker"] });
  assert.equal(bnWs.sent.length, 0, "the Binance stream is chosen by the URL, nothing to send");
  assert.deepEqual(JSON.parse(krWs.sent[0]), { method: "subscribe", params: { channel: "ticker", symbol: ["BTC/USD"] } });
});

test("USDT venue is aligned to the dollar venues, so the price level does not jump when it drops out", () => {
  const { feed, advance } = rig();
  const cbWs = sockets("coinbase")[0];
  const krWs = sockets("kraken")[0];
  const bnWs = sockets("binance.com")[0];
  // Binance runs about 5 bp above the dollar venues (USDT premium)
  cbWs.say(cb(84000));
  krWs.say(kr(84001));
  bnWs.say(bn(84042));
  bnWs.say(bn(84042));
  const withAll = feed.latest()!;
  assert.ok(Math.abs(withAll.price - 84000) < 3, `aligned to the dollar level, got ${withAll.price}`);
  assert.match(withAll.source ?? "", /Binance/);
  const v = feed.status().venues!.find((x) => x.id === "binance")!;
  assert.ok(v.offsetBp > 4 && v.offsetBp < 6, `learned offset ${v.offsetBp}bp`);

  // Binance keeps ticking higher by a real $20 move: the consensus follows the move, not the premium
  bnWs.say(bn(84062));
  assert.ok(feed.latest()!.price > 84015 && feed.latest()!.price < 84025, `follows the move, got ${feed.latest()!.price}`);

  // Binance goes quiet: after 2.5s it stops voting and the level stays continuous (no 40-dollar step)
  advance(1000);
  cbWs.say(cb(84020));
  advance(2000);
  krWs.say(kr(84021));
  cbWs.say(cb(84020));
  const without = feed.latest()!;
  assert.ok(Math.abs(without.price - 84020) < 3, `still the dollar level, got ${without.price}`);
  assert.doesNotMatch(without.source ?? "", /Binance/);
});

test("one bad print on one venue cannot move the price", () => {
  const { feed } = rig();
  sockets("coinbase")[0].say(cb(84000));
  sockets("kraken")[0].say(kr(84001));
  sockets("binance.com")[0].say(bn(84040));
  sockets("binance.com")[0].say(bn(84040));
  const good = feed.latest()!.price;
  sockets("kraken")[0].say(kr(84400)); // 48 bp off the other two: outlier
  const after = feed.latest()!;
  assert.ok(Math.abs(after.price - good) < 5, `outlier ignored, got ${after.price}`);
  assert.doesNotMatch(after.source ?? "", /Kraken/);
});

test("with a single venue alive it behaves like the old single feed", () => {
  const { feed } = rig();
  sockets("coinbase")[0].say(cb(84010));
  const t = feed.latest()!;
  assert.equal(t.price, 84010);
  assert.match(t.source ?? "", /Coinbase/);
  const st = feed.status();
  assert.equal(st.state, "live");
  assert.equal(st.venues!.filter((v) => v.used).length, 1);
});

test("nothing is returned as fresh once every venue is quiet, so the worker falls back to REST", () => {
  const { feed, advance, now } = rig();
  sockets("coinbase")[0].say(cb(84010));
  const at = feed.latest()!.at;
  advance(6000);
  const t = feed.latest();
  assert.equal(t?.at, at, "the old print is returned with its real age so the caller can reject it");
  assert.ok(now() - (t?.at ?? 0) > 3000);
  assert.notEqual(feed.status().state, "live");
});

test("a venue that fails on its first host retries on the next one", () => {
  const { advance } = rig();
  const first = sockets("binance.com")[0];
  first.onclose?.({});
  advance(1000);
  const urls = FakeWs.all.filter((w) => /binance/.test(w.url)).map((w) => w.url);
  assert.equal(urls.length, 2);
  assert.match(urls[1], /data-stream\.binance\.vision/);
});

test("HELIOS_FEED_VENUES picks venues and falls back to all three", () => {
  assert.deepEqual(venuesFromEnv("coinbase, kraken").map((v) => v.id), ["coinbase", "kraken"]);
  assert.deepEqual(venuesFromEnv(undefined).map((v) => v.id), ["coinbase", "binance", "kraken"]);
  assert.deepEqual(venuesFromEnv("nonsense").map((v) => v.id), Object.keys(VENUES));
});
