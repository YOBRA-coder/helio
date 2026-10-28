import assert from "node:assert/strict";
import test from "node:test";
import { CLOSER, DEFAULT_RISK, closerRead, evaluateOpportunity, yesProbability } from "./engine.ts";
import { runSim } from "./simlab.ts";
import type { Market } from "./types.ts";

const T0 = 1_800_000_000_000;
const OPEN = 100_000;
const VOL = 0.5;

function win(over: Partial<Market> = {}): Market {
  return {
    id: "w", kind: "live", question: "Bitcoin Up or Down", outcomes: ["Up", "Down"], status: "open",
    startAt: T0, endAt: T0 + 300_000, strikeLow: null, strikeHigh: null, openSpot: OPEN,
    resolution: "x".repeat(80), sourceUrl: null, metadataOk: true, restricted: false,
    yesBid: 0.7, yesAsk: 0.72, liquidity: 20_000, volume: 0, updatedAt: T0 + 240_000, source: "t", group: "5m",
    yesTokenId: "1", noTokenId: "2", conditionId: "c", gammaId: "g", ...over,
  };
}

const ev = (m: Market, spot: number, now: number, extra = {}) =>
  evaluateOpportunity({ ...m, updatedAt: now }, spot, now, DEFAULT_RISK, 10_000, 0, 0, false, null, { vol: VOL, blendW: 0.6, ...extra });

test("closer model: confidence grows as the window runs out and does not floor the time left", () => {
  const lead = OPEN + 120;
  const early = closerRead(OPEN, lead, T0 + 300_000, T0 + 60_000, VOL, 6000);
  const late = closerRead(OPEN, lead, T0 + 300_000, T0 + 270_000, VOL, 6000);
  assert.ok(late.sigma < early.sigma, "less time left means a narrower range");
  assert.ok(late.p > early.p && late.p > 0.9);
  // the old model floored time at 3 minutes: with 30s left it could never be more than ~70% sure of a modest lead
  assert.ok(closerRead(OPEN, OPEN + 70, T0 + 300_000, T0 + 270_000, VOL, 6000).p > 0.8);
  assert.ok(late.pCons < late.p && late.pCons > 0.5, "conservative read is lower but on the same side");
  const down = closerRead(OPEN, OPEN - 120, T0 + 300_000, T0 + 270_000, VOL, 6000);
  assert.ok(Math.abs(down.p - (1 - late.p)) < 0.005, "symmetric");
});

test("closer model: stale prices and the settlement-source basis keep it from certainty at the last second", () => {
  const r = closerRead(OPEN, OPEN + 30, T0 + 300_000, T0 + 299_000, VOL, 6000);
  assert.ok(r.p < 0.995 && r.sigma > 10);
});

test("yesProbability: real Up/Down uses the closer model; practice windows keep the old one", () => {
  const live = yesProbability(win(), OPEN + 120, T0 + 270_000, VOL).p;
  assert.ok(live > 0.9);
  const sim = yesProbability(win({ kind: "sim-window", question: "Sim 5m" }), OPEN + 120, T0 + 270_000, VOL).p;
  assert.ok(sim < live, "the old model is less confident late in the window");
});

test("closer strategy: waits, then buys the favourite when the market has not caught up", () => {
  const m = win({ yesBid: 0.7, yesAsk: 0.72 });
  const early = ev(m, OPEN + 120, T0 + 30_000);
  assert.match(early.hardFail ?? "", /Too early/);
  const o = ev(m, OPEN + 120, T0 + 240_000);
  assert.equal(o.hardFail, null, o.hardFail ?? "");
  assert.equal(o.side, "yes");
  assert.ok(o.executablePrice >= CLOSER.priceLo && o.executablePrice <= CLOSER.priceHi);
  assert.ok(o.edge >= DEFAULT_RISK.minEdge);
  assert.ok(o.probability > o.executablePrice, "model must beat the price it pays");
});

test("closer strategy: never buys the underdog, even where the old rule would see value in it", () => {
  // BTC is well below the open (Down is clearly ahead) but the market still prices Up at 40c
  const m = win({ yesBid: 0.4, yesAsk: 0.42 });
  const o = ev(m, OPEN - 120, T0 + 240_000);
  assert.equal(o.side, "no");
  const flat = ev(m, OPEN + 5, T0 + 240_000);
  assert.ok(flat.hardFail, "a window that is not decided is not traded");
  // underdog price band
  const cheap = ev(win({ yesBid: 0.2, yesAsk: 0.22 }), OPEN + 120, T0 + 240_000);
  assert.ok(cheap.hardFail);
  assert.ok(cheap.side === "yes" && cheap.executablePrice < CLOSER.priceLo || /disagree|band|edge/.test(cheap.hardFail ?? ""));
});

test("closer strategy: refuses when the market already prices the move, or when the data looks wrong", () => {
  const priced = ev(win({ yesBid: 0.95, yesAsk: 0.97 }), OPEN + 120, T0 + 240_000);
  assert.ok(priced.hardFail);
  const wrongOpen = ev(win({ yesBid: 0.49, yesAsk: 0.51 }), OPEN + 300, T0 + 240_000);
  assert.match(wrongOpen.hardFail ?? "", /disagree by over 25 points/);
  const cool = ev(win(), OPEN + 120, T0 + 240_000, { coolOff: "Cooling off" });
  assert.equal(cool.hardFail, "Cooling off");
  const buffer = ev(win(), OPEN + 120, T0 + 290_000);
  assert.match(buffer.hardFail ?? "", /no-trade buffer/);
});

test("strategy switch: legacy still available for comparison", () => {
  const m = win({ startAt: T0 - 400_000, endAt: T0 + 500_000, yesBid: 0.7, yesAsk: 0.72 });
  const a = evaluateOpportunity({ ...m, updatedAt: T0 }, OPEN + 70, T0, DEFAULT_RISK, 10_000, 0, 0, false, null, { vol: VOL, strategy: "legacy" });
  const b = evaluateOpportunity({ ...m, updatedAt: T0 }, OPEN + 70, T0, DEFAULT_RISK, 10_000, 0, 0, false, null, { vol: VOL });
  assert.notEqual(a.pYesBase, b.pYesBase);
});

test("lab: against a crowd that is as fast as the feed, the old rule loses by buying longshots and the new one does not bleed", () => {
  const old = runSim({ windows: 1500, lagSec: 0, strategy: "legacy", seed: 5 }).summary;
  const neu = runSim({ windows: 1500, lagSec: 0, strategy: "closer", seed: 5 }).summary;
  assert.ok(old.winRate < 0.4 && old.avgPrice < 0.4, `legacy should be buying cheap sides and losing most trades (win ${old.winRate}, px ${old.avgPrice})`);
  assert.ok(old.netPnl < 0);
  assert.ok(neu.winRate > 0.65 && neu.avgPrice > 0.6, `closer should be buying favourites (win ${neu.winRate}, px ${neu.avgPrice})`);
  assert.ok(neu.netPnl > old.netPnl + 300);
  assert.ok(neu.maxDrawdown < old.maxDrawdown);
});

test("lab: when the crowd is slow, the closer strategy makes money and its probabilities beat the market's", () => {
  const r = runSim({ windows: 1500, lagSec: 5, strategy: "closer", seed: 9 }).summary;
  assert.ok(r.trades >= 30);
  assert.ok(r.netPnl > 0 && r.profitFactor > 1.2);
  assert.ok(r.brierModel < r.brierMarket);
});
