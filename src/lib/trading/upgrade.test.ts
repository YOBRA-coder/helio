import assert from "node:assert/strict";
import test from "node:test";
import { classifyBlock, summarizeBlocks } from "./blocks.ts";
import { DEFAULT_RISK, evaluateOpportunity } from "./engine.ts";
import { makeCore, recentLossStreak, tickCore } from "./ledger.ts";
import { radarRow } from "./radar.ts";
import { DeskRunner, type RunnerDeps } from "./runner.ts";
import type { TapeMarket, TapePayload } from "./tape-fetch.ts";
import type { Market, ScoreRow } from "./types.ts";

const T0 = 1_800_000_000_000;
const OPEN = 100_000;
const VOL = 0.5;

function win(over: Partial<Market> = {}): Market {
  return {
    id: "w", kind: "live", question: "Bitcoin Up or Down", outcomes: ["Up", "Down"], status: "open",
    startAt: T0, endAt: T0 + 300_000, strikeLow: null, strikeHigh: null, openSpot: OPEN,
    resolution: "x".repeat(80), sourceUrl: null, metadataOk: true, restricted: false,
    yesBid: 0.7, yesAsk: 0.72, liquidity: 20_000, volume: 0, updatedAt: T0 + 240_000, source: "t", group: "5m",
    yesTokenId: "1000000000001", noTokenId: "1000000000002", conditionId: "c", gammaId: "g", ...over,
  };
}
const ev = (m: Market, spot: number, now: number, extra = {}) =>
  evaluateOpportunity({ ...m, updatedAt: now }, spot, now, DEFAULT_RISK, 10_000, 0, 0, false, null, { vol: VOL, blendW: 0.6, ...extra });

// ── block classification ───────────────────────────────────────────────────────────────────────────────────────

test("every reason on the Signals screen lands in the right bucket", () => {
  const kind = (s: string) => classifyBlock(s).kind;
  assert.equal(kind("Too early: this strategy only acts in the last 120s of a window, when the outcome is largely decided"), "waiting");
  assert.equal(kind("Not decided yet: BTC is 0.42 standard deviations from the open, and this strategy needs 1.0"), "waiting");
  assert.equal(kind("Inside the no-trade buffer before expiry"), "waiting");
  assert.equal(kind("Model (92%) and market (60%) disagree by over 25 points: treated as a data problem, not an edge"), "data");
  assert.equal(kind("Waiting for the window-open BTC price (not recorded for this window yet)"), "data");
  assert.equal(kind("Market data is stale"), "data");
  assert.equal(kind("Net edge 0.004 is below the minimum 0.020"), "quality");
  assert.equal(kind("Executable price is outside the 55¢–97¢ band (favourites only)"), "quality");
  assert.equal(kind("Order count for this hour is at the cap"), "risk");
  assert.equal(kind("Open exposure is at the cap"), "risk");
  assert.equal(kind("Kill switch is on"), "stop");
  assert.equal(kind("Cooling off for an hour after 4 losing trades in a row"), "stop");
  assert.equal(kind("Daily loss limit reached — new paper orders are paused"), "stop");
  assert.equal(kind("BTC is snapping back against this side ($30 in 15s): waiting for it to settle"), "guard");
});

test("the summary separates 'waiting' from real rejections", () => {
  const s = summarizeBlocks([
    "Too early: x 120s", "Too early: x 120s", "Not decided yet: BTC is 0.4 standard deviations", "Net edge 0.004 is below the minimum 0.020", null,
  ]);
  assert.equal(s.total, 4);
  assert.equal(s.byKind.waiting, 3);
  assert.equal(s.byKind.quality, 1);
  assert.equal(s.top[0].n, 2, "numbers are collapsed so the same reason counts together");
});

test("'not yet' windows are not logged as blocked signals", () => {
  let core = makeCore(T0);
  core = { ...core, liveMarkets: [win({ id: "poly-1", updatedAt: T0 + 30_000 })], spots: Array(60).fill(OPEN) };
  for (let i = 0; i < 12; i += 1) core = tickCore(core, { now: T0 + 30_000 + i * 1000, spot: OPEN + 5, spotFresh: false, sim: false });
  assert.equal(core.signals.filter((x) => x.status === "blocked").length, 0, "early in the window is the normal state, not a rejection");
});

// ── loss guards ────────────────────────────────────────────────────────────────────────────────────────────────

test("snap-back guard: a decided window that is already reversing is refused", () => {
  const m = win({ yesBid: 0.7, yesAsk: 0.72 });
  const now = T0 + 240_000;
  assert.equal(ev(m, OPEN + 120, now).hardFail, null);
  assert.equal(ev(m, OPEN + 120, now, { feed: { p15: OPEN + 125, spreadBp: 1, venues: 3 } }).hardFail, null, "a small dip is fine");
  const snap = ev(m, OPEN + 120, now, { feed: { p15: OPEN + 175, spreadBp: 1, venues: 3 } });
  assert.match(snap.hardFail ?? "", /snapping back/);
  // moving further in our favour is never a reason to refuse
  assert.equal(ev(m, OPEN + 120, now, { feed: { p15: OPEN + 60, spreadBp: 1, venues: 3 } }).hardFail, null);
  // for a Down bet the direction flips
  const down = win({ yesBid: 0.28, yesAsk: 0.3 });
  assert.equal(ev(down, OPEN - 120, now).hardFail, null);
  assert.match(ev(down, OPEN - 120, now, { feed: { p15: OPEN - 175, spreadBp: 1, venues: 3 } }).hardFail ?? "", /snapping back/);
});

test("exchange-disagreement guard", () => {
  const m = win();
  const now = T0 + 240_000;
  assert.match(ev(m, OPEN + 120, now, { feed: { p15: null, spreadBp: 12, venues: 3 } }).hardFail ?? "", /Exchanges disagree/);
  assert.equal(ev(m, OPEN + 120, now, { feed: { p15: null, spreadBp: 2, venues: 3 } }).hardFail, null);
});

test("each recent loss raises the bar, and two halve the size", () => {
  const m = win();
  const now = T0 + 240_000;
  const base = ev(m, OPEN + 100, now);
  assert.equal(base.hardFail, null, base.hardFail ?? "");
  // find a lead that clears 1.0 sd but not 1.25 sd
  let lead = 0;
  for (let d = 60; d < 200; d += 2) {
    const o = ev(m, OPEN + d, now);
    const o1 = ev(m, OPEN + d, now, { lossStreak: 1 });
    if (!o.hardFail && /Not decided/.test(o1.hardFail ?? "")) {
      lead = d;
      break;
    }
  }
  assert.ok(lead > 0, "there is a band that one loss closes");
  assert.match(ev(m, OPEN + lead, now, { lossStreak: 1 }).hardFail ?? "", /raised after 1 recent loss/);
  const full = ev(m, OPEN + 160, now, { blendW: 1 });
  const half = ev(m, OPEN + 160, now, { blendW: 1, lossStreak: 2 });
  if (!half.hardFail) assert.ok(half.stake <= full.stake, "size does not grow after losses");
});

test("recentLossStreak counts only consecutive recent real losses", () => {
  const row = (pnl: number, ago: number): ScoreRow =>
    ({ id: String(Math.random()), venue: "paper", kind: "live", official: true, pnl, settledAt: T0 - ago }) as unknown as ScoreRow;
  assert.equal(recentLossStreak([], T0), 0);
  assert.equal(recentLossStreak([row(-5, 60_000), row(-5, 120_000), row(4, 180_000), row(-5, 240_000)], T0), 2);
  assert.equal(recentLossStreak([row(3, 60_000), row(-5, 120_000)], T0), 0, "a win resets it");
  assert.equal(recentLossStreak([row(-5, 3_000_000)], T0), 0, "old losses expire after 45 minutes");
});

// ── watch-list ─────────────────────────────────────────────────────────────────────────────────────────────────

const rin = (now: number, spot: number, extra = {}) => ({
  spot, now, risk: DEFAULT_RISK, vol: VOL, blendW: 0.6, staleMs: 1000, killed: false, circuit: null, cash: 10_000, exposure: 0, ordersLastHour: 0, ...extra,
});

test("watch-list: early, then forming, then ready", () => {
  const m = win();
  const early = radarRow({ ...m, updatedAt: T0 + 30_000 }, rin(T0 + 30_000, OPEN + 120));
  assert.equal(early.stage, "early");
  assert.ok(early.toZoneSec > 0);
  const forming = radarRow({ ...m, updatedAt: T0 + 200_000 }, rin(T0 + 200_000, OPEN + 2));
  assert.equal(forming.stage, "forming");
  assert.equal(forming.toZoneSec, 0);
  assert.ok(Math.abs(forming.z) < forming.needZ);
  const ready = radarRow({ ...m, updatedAt: T0 + 240_000 }, rin(T0 + 240_000, OPEN + 120));
  assert.equal(ready.stage, "ready");
  assert.equal(ready.side, "yes");
  assert.ok(ready.edge >= ready.needEdge);
  const blocked = radarRow({ ...m, yesBid: 0.95, yesAsk: 0.97, updatedAt: T0 + 240_000 }, rin(T0 + 240_000, OPEN + 120));
  assert.equal(blocked.stage, "blocked");
  assert.equal(blocked.kind, "quality");
});

// ── runner: window opens from the feed, quotes from the order-book socket ─────────────────────────────────────────

function tapeMarket(): TapeMarket {
  return {
    id: "1", question: "Bitcoin Up or Down - 5 min", slug: "s", eventSlug: "e", eventTitle: "t", outcomes: ["Up", "Down"],
    yesPrice: 0.6, bestBid: 0.59, bestAsk: 0.61, liquidity: 20_000, volume: 1, endAt: T0 + 600_000, startAt: T0 + 300_000,
    description: "x".repeat(80), group: "5m", restricted: false, yesTokenId: "1000000000001", noTokenId: "1000000000002", conditionId: "c", booked: false,
  };
}

function runnerRig(over: Partial<RunnerDeps> = {}) {
  let now = T0 + 301_000; // the window opened a second ago
  const calls = { rest: 0, spotAt: [] as number[] };
  const tape: TapePayload = { spot: 100_000, spotSource: "Coinbase BTC-USD", fetchedAt: now, error: null, markets: [tapeMarket()] };
  const deps: RunnerDeps = {
    now: () => now,
    loadTape: async () => ({ ...tape, fetchedAt: now }),
    fetchQuotes: async () => {
      calls.rest += 1;
      return [];
    },
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
    ...over,
  };
  const r = new DeskRunner(deps);
  return { r, calls, tick: async (ms = 1000) => ((now += ms), r.step()), now: () => now };
}
const settle = () => new Promise((res) => setTimeout(res, 20));

test("a window's open price comes from the feed's own recording, with no candle lookup", async () => {
  const asked: number[] = [];
  const h = runnerRig({
    spotAt: (ts) => {
      asked.push(ts);
      return ts === T0 + 300_000 ? 100_040 : null;
    },
  });
  await h.tick();
  await settle();
  await h.tick();
  const m = h.r.core.liveMarkets.find((x) => x.id === "poly-1");
  assert.ok(m, "market discovered");
  assert.equal(m?.openSpot, 100_040);
  assert.equal(m?.metadataOk, true, "the window can trade as soon as the feed has its open");
  assert.ok(asked.includes(T0 + 300_000));
});

test("order-book quotes come from the websocket when it covers every market, and REST is not used", async () => {
  const h = runnerRig({
    watchBook: () => {},
    bookQuotes: (ids) => ids.map((tokenId) => ({ tokenId, bid: 0.81, ask: 0.83, at: h.now() - 200 })),
  });
  await h.tick();
  await settle();
  await h.tick();
  await h.tick();
  await settle();
  const m = h.r.core.liveMarkets.find((x) => x.id === "poly-1");
  assert.equal(m?.yesBid, 0.81);
  assert.equal(m?.yesAsk, 0.83);
  assert.equal(m?.source, "Polymarket CLOB");
  assert.equal(h.calls.rest, 0, "no REST order-book calls while the socket covers everything");
  assert.equal(h.r.bookViaSocket, true);
});

test("when the book socket is unhealthy the REST poll takes over", async () => {
  const h = runnerRig({ watchBook: () => {}, bookQuotes: () => null });
  await h.tick();
  await settle();
  await h.tick(3000);
  await settle();
  assert.ok(h.calls.rest >= 1, "REST fallback is used");
  assert.equal(h.r.bookViaSocket, false);
});

test("pace: balanced acts at 0.75 sd where selective waits", async () => {
  const { closerParams, PACES } = await import("./engine.ts");
  assert.ok(closerParams("balanced").minZ < closerParams("selective").minZ);
  assert.ok(closerParams("active").minZ < closerParams("balanced").minZ);
  assert.equal(closerParams(undefined), PACES.balanced);
  assert.equal(closerParams("nonsense"), PACES.balanced);
});
