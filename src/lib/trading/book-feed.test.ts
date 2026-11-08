import assert from "node:assert/strict";
import test from "node:test";
import { BookFeed } from "./book-feed.ts";
import type { WsCtor } from "./feed.ts";

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

const A = "1".repeat(20);
const B = "2".repeat(20);
const C = "3".repeat(20);

function rig() {
  FakeWs.all = [];
  let t = 9_000_000;
  const timers: Array<{ fn: () => void; at: number; dead?: boolean }> = [];
  const feed = new BookFeed({
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
    // step in small slices so repeating timers re-arm the way they would in real time
    for (let left = ms; left > 0; left -= 500) {
      t += Math.min(500, left);
      for (const h of timers.filter((x) => !x.dead && x.at <= t)) {
        h.dead = true;
        h.fn();
      }
    }
  };
  return { feed, advance, now: () => t };
}

const live = () => FakeWs.all[FakeWs.all.length - 1];

test("subscribes to every token on open and turns snapshots and price changes into quotes", () => {
  const { feed } = rig();
  feed.setAssets([A, B]);
  feed.start();
  const ws = live();
  ws.onopen?.({});
  assert.deepEqual(JSON.parse(ws.sent[0]), { assets_ids: [A, B], type: "market", custom_feature_enabled: true, initial_dump: true });
  assert.equal(feed.healthy(), true);
  ws.say([{ asset_id: A, bids: [{ price: "0.70", size: "50" }, { price: "0.69", size: "10" }], asks: [{ price: "0.73", size: "40" }, { price: "0.72", size: "5" }] }]);
  assert.deepEqual(feed.quotes([A, B]).map((q) => [q.tokenId, q.bid, q.ask]), [[A, 0.7, 0.72]]);
  ws.say({ event_type: "price_change", price_changes: [{ asset_id: A, best_bid: "0.71", best_ask: "0.72" }] });
  assert.equal(feed.quotes([A])[0].bid, 0.71);
  ws.say({ asset_id: B, best_bid: "0.30", best_ask: "0.33" });
  assert.equal(feed.quotes([B])[0].ask, 0.33);
});

test("ignores tokens it was not asked about, and forgets tokens that are dropped", () => {
  const { feed } = rig();
  feed.setAssets([A]);
  feed.start();
  live().onopen?.({});
  live().say({ asset_id: C, best_bid: "0.4", best_ask: "0.5" });
  assert.equal(feed.quotes([C]).length, 0);
  live().say({ asset_id: A, best_bid: "0.4", best_ask: "0.5" });
  assert.equal(feed.quotes([A]).length, 1);
  feed.setAssets([B]);
  assert.equal(feed.quotes([A]).length, 0);
});

test("a new token on a live socket is added with a subscribe message, with no reconnect when it works", () => {
  const { feed, advance } = rig();
  feed.setAssets([A]);
  feed.start();
  live().onopen?.({});
  feed.setAssets([A, B]);
  const msg = JSON.parse(live().sent[1]);
  assert.deepEqual(msg.assets_ids, [B]);
  assert.equal(msg.operation, "subscribe");
  live().say({ asset_id: B, best_bid: "0.4", best_ask: "0.5" });
  advance(20_000);
  live().say("PONG");
  assert.equal(FakeWs.all.length, 1, "no reconnect");
  assert.equal(feed.healthy(), true);
});

test("if the subscribe message is ignored, it reconnects with the full token list", () => {
  const { feed, advance } = rig();
  feed.setAssets([A]);
  feed.start();
  live().onopen?.({});
  feed.setAssets([A, B]);
  advance(7500); // no quote for B arrived: the check fires after verifyMs
  advance(1500); // backoff
  assert.equal(FakeWs.all.length, 2);
  FakeWs.all[1].onopen?.({});
  assert.deepEqual(JSON.parse(FakeWs.all[1].sent[0]).assets_ids, [A, B]);
});

test("a token that never gets a two-sided book does not cause a reconnect loop", () => {
  const { feed, advance } = rig();
  feed.setAssets([A]);
  feed.start();
  live().onopen?.({});
  feed.setAssets([A, B]);
  advance(7500);
  FakeWs.all[1]?.onopen?.({}); // the one forced resubscribe
  const n = FakeWs.all.length;
  // keep the socket alive while time passes; B never produces a quote
  for (let i = 0; i < 12; i += 1) {
    advance(5000);
    live().say("PONG");
  }
  assert.equal(FakeWs.all.length, n, "stays on the same socket after the first attempt");
});

test("silence marks it unhealthy and reconnects; a clean close reconnects with backoff", () => {
  const { feed, advance } = rig();
  feed.setAssets([A]);
  feed.start();
  live().onopen?.({});
  assert.equal(feed.healthy(), true);
  advance(33_000);
  assert.equal(feed.healthy(), false);
  assert.ok(FakeWs.all[0].closed);
  advance(1500);
  assert.equal(FakeWs.all.length, 2);
  FakeWs.all[1].onopen?.({});
  assert.equal(feed.healthy(), true);
  FakeWs.all[1].onclose?.({});
  assert.equal(feed.healthy(), false);
  advance(2500);
  assert.equal(FakeWs.all.length, 3);
});

test("sends keepalive pings and stays off cleanly without a WebSocket", () => {
  const { feed, advance } = rig();
  feed.setAssets([A]);
  feed.start();
  live().onopen?.({});
  advance(11_000);
  assert.ok(live().sent.filter((x) => x === "PING").length >= 1);
  feed.stop();
  assert.equal(feed.status().state, "off");
  const off = new BookFeed({ WebSocketCtor: null });
  off.start();
  assert.equal(off.healthy(), false);
  assert.equal(off.status().state, "off");
});
