import assert from "node:assert/strict";
import test from "node:test";
import { SpotFeed, parseTicker, type WsCtor } from "./feed.ts";
import { DeskRunner, type RunnerDeps } from "./runner.ts";
import type { TapePayload } from "./tape-fetch.ts";

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

function rig() {
  FakeWs.all = [];
  let t = 1_000_000;
  const timers: Array<{ fn: () => void; at: number; id: number; dead?: boolean }> = [];
  let nid = 0;
  const feed = new SpotFeed({
    now: () => t,
    WebSocketCtor: FakeWs as unknown as WsCtor,
    setTimer: (fn, ms) => {
      const h = { fn, at: t + ms, id: ++nid };
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
  return { feed, advance, set: (n: number) => (t = n), now: () => t };
}

test("parseTicker accepts real tickers and rejects everything else", () => {
  assert.equal(parseTicker('{"type":"ticker","product_id":"BTC-USD","price":"81415.12"}'), 81415.12);
  assert.equal(parseTicker({ type: "ticker", product_id: "BTC-USD", price: "81415.12" }), 81415.12);
  assert.equal(parseTicker('{"type":"ticker","product_id":"ETH-USD","price":"3000"}'), null);
  assert.equal(parseTicker('{"type":"subscriptions"}'), null);
  assert.equal(parseTicker("not json"), null);
  assert.equal(parseTicker('{"type":"ticker","product_id":"BTC-USD","price":"abc"}'), null);
  assert.equal(parseTicker('{"type":"ticker","product_id":"BTC-USD","price":"5"}'), null);
});

test("feed subscribes on open and keeps the newest good print", () => {
  const { feed } = rig();
  feed.start();
  const ws = FakeWs.all[0];
  assert.equal(ws.url, "wss://ws-feed.exchange.coinbase.com");
  ws.onopen?.({});
  assert.deepEqual(JSON.parse(ws.sent[0]), { type: "subscribe", product_ids: ["BTC-USD"], channels: ["ticker"] });
  assert.equal(feed.latest(), null);
  ws.say({ type: "ticker", product_id: "BTC-USD", price: "81000.5" });
  ws.say({ type: "ticker", product_id: "BTC-USD", price: "81001.0" });
  assert.equal(feed.latest()?.price, 81001);
  assert.equal(feed.status().state, "live");
  assert.equal(feed.status().ticks, 2);
});

test("feed drops absurd prints instead of trading on them", () => {
  const { feed } = rig();
  feed.start();
  const ws = FakeWs.all[0];
  ws.say({ type: "ticker", product_id: "BTC-USD", price: "81000" });
  ws.say({ type: "ticker", product_id: "BTC-USD", price: "8100" }); // 90% drop
  ws.say({ type: "ticker", product_id: "BTC-USD", price: "99000" }); // 22% jump
  assert.equal(feed.latest()?.price, 81000);
  assert.equal(feed.status().ticks, 1);
});

test("feed reconnects with backoff after a close, and after silence", () => {
  const { feed, advance } = rig();
  feed.start();
  FakeWs.all[0].say({ type: "ticker", product_id: "BTC-USD", price: "81000" });
  FakeWs.all[0].onclose?.({});
  assert.equal(feed.status().state, "error");
  assert.equal(FakeWs.all.length, 1);
  advance(1000);
  assert.equal(FakeWs.all.length, 2, "reconnects after 1s");
  assert.equal(feed.latest()?.price, 81000, "last print is kept for the caller to age-check");
  // second socket stays silent: the watchdog drops it and a retry follows
  advance(15_000);
  assert.equal(FakeWs.all[1].closed, true);
  advance(2000);
  assert.equal(FakeWs.all.length, 3);
  FakeWs.all[2].say({ type: "ticker", product_id: "BTC-USD", price: "81010" });
  assert.equal(feed.status().state, "live");
  assert.ok(feed.status().reconnects >= 2);
});

test("feed reports stale when prints stop, and stop() shuts it down", () => {
  const { feed, set, now } = rig();
  feed.start();
  FakeWs.all[0].say({ type: "ticker", product_id: "BTC-USD", price: "81000" });
  set(now() + 6000);
  assert.equal(feed.status().state, "stale");
  feed.stop();
  assert.equal(feed.status().state, "off");
  assert.equal(FakeWs.all[0].closed, true);
});

test("feed stays off cleanly when the runtime has no WebSocket", () => {
  const feed = new SpotFeed({ WebSocketCtor: null });
  feed.start();
  assert.equal(feed.status().state, "off");
  assert.equal(feed.latest(), null);
});

// ---- runner integration -------------------------------------------------------------------------------------------

const T0 = 1_800_000_000_000;

function runnerRig(live: () => { price: number; at: number } | null) {
  let now = T0;
  const tape: TapePayload = { spot: 100_000, spotSource: "Coinbase BTC-USD", fetchedAt: T0, error: null, markets: [] };
  const deps: RunnerDeps = {
    now: () => now,
    loadTape: async () => ({ ...tape, fetchedAt: now }),
    fetchQuotes: async () => [],
    fetchResolutions: async () => ({}),
    fetchSpotAt: async () => null,
    loadContext: async () => {
      throw new Error("no context in tests");
    },
    getSdk: async () => {
      throw new Error("no sdk in tests");
    },
    liveEnv: () => ({ enabled: false, hasKey: false, hasFunder: false, hasOwnerToken: true }),
    persist: async () => {},
    journal: async () => {},
    drainCommands: async () => [],
    liveSpot: live,
  };
  const r = new DeskRunner(deps);
  return { r, tick: async (ms = 1000) => ((now += ms), r.step()), now: () => now };
}

test("runner trades on the live websocket price when it is fresh", async () => {
  let px = 100_050;
  const h = runnerRig(() => ({ price: px, at: h.now() - 300 }));
  await h.tick();
  await new Promise((res) => setTimeout(res, 20)); // let the background tape load land
  await h.tick();
  assert.equal(h.r.core.spot, 100_050);
  assert.match(h.r.core.spotSource, /websocket/i);
  px = 100_070;
  await h.tick();
  assert.equal(h.r.core.spot, 100_070, "follows the live price every second, not every 6 seconds");
});

test("runner falls back to the REST price when the websocket print is old or missing", async () => {
  const h = runnerRig(() => ({ price: 123_456, at: h.now() - 10_000 }));
  await h.tick();
  await new Promise((res) => setTimeout(res, 20));
  await h.tick();
  assert.equal(h.r.core.spot, 100_000);
  assert.ok(!/websocket/i.test(h.r.core.spotSource));
  const none = runnerRig(() => null);
  await none.tick();
  await new Promise((res) => setTimeout(res, 20));
  await none.tick();
  assert.equal(none.r.core.spot, 100_000);
});

test("vol samples keep their 6-second cadence even though the live price updates every second", async () => {
  const h = runnerRig(() => ({ price: 100_000, at: h.now() - 100 }));
  const before = h.r.core.spots.length;
  for (let i = 0; i < 30; i += 1) await h.tick();
  const added = h.r.core.spots.length - before;
  assert.ok(added >= 4 && added <= 6, `expected about 5 samples in 30s, got ${added}`);
});
