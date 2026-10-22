import assert from "node:assert/strict";
import test from "node:test";
import { realizedVol } from "./engine.ts";
import { applyCommand, applyTape, makeCore, tickCore } from "./ledger.ts";
import { planLiveOrder, reconcileLive, submitLive, roundUpToTick, type ClobSdk } from "./live.ts";
import { DeskRunner } from "./runner.ts";
import { evaluateGate, summarize } from "./trial.ts";
import { parseCrowd, parseWmMarkets, pickIndex } from "./context.ts";
import { parseResolution, type TapePayload } from "./tape-fetch.ts";
import type { Market, ScoreRow } from "./types.ts";

const T0 = 1_800_000_000_000;

function tape(now: number, ask = 0.45, endIn = 600_000): TapePayload {
  return {
    spot: 100_000,
    spotSource: "test",
    fetchedAt: now,
    error: null,
    markets: [
      {
        id: "m1", question: "Bitcoin Up or Down - test window", slug: "s", eventSlug: "e", eventTitle: "t",
        outcomes: ["Up", "Down"], yesPrice: 0.5, bestBid: ask - 0.02, bestAsk: ask, liquidity: 20_000, volume: 1000,
        endAt: now + endIn, startAt: now - 60_000, description: "x".repeat(80), group: "15m", restricted: false,
        yesTokenId: "111111111111", noTokenId: "222222222222", conditionId: "0xc", booked: true,
      },
    ],
  };
}

test("sim windows settle and score; real positions settle only on venue resolution", () => {
  let s = applyTape(makeCore(T0), tape(T0), { "poly-m1": 100_000 }, T0);
  s = { ...s, mode: "auto" };
  for (let i = 1; i <= 60; i += 1) s = tickCore(s, { now: T0 + i * 1000, spot: 100_000, spotFresh: true, spotDtMs: 1000 });
  const livePos = s.positions.filter((p) => p.kind === "live");
  // price 0.45 vs fair 0.5 minus costs: may or may not trade; if it did, it must remain open w/o resolution
  for (const p of livePos) assert.equal(p.status, "open");
  const later = tickCore(s, { now: T0 + 700_000, spot: 100_000, resolutions: { m1: true } });
  for (const p of later.positions.filter((x) => x.kind === "live")) assert.equal(p.status, "settled");
  assert.ok(later.scores.every((r) => Number.isFinite(r.pnl)));
});

test("kill switch cancels resting orders and disarms live", () => {
  let s = makeCore(T0);
  s = { ...s, live: { ...s.live, status: "armed", auto: true, armedAt: T0 } };
  s = applyCommand(s, { type: "setKilled", on: true }, T0 + 1);
  assert.equal(s.live.status, "off");
  assert.equal(s.live.auto, false);
});

test("resetTrial clears scores but keeps limits", () => {
  let s = makeCore(T0);
  s = applyCommand(s, { type: "updateRisk", risk: { maxStake: 50 } }, T0);
  s = { ...s, scores: [{ id: "a" } as ScoreRow] };
  s = applyCommand(s, { type: "resetTrial" }, T0 + 5);
  assert.equal(s.scores.length, 0);
  assert.equal(s.risk.maxStake, 50);
});

function row(i: number, pnl: number, yes: boolean, kind: ScoreRow["kind"] = "live"): ScoreRow {
  return {
    id: `r${i}`, venue: "paper", marketId: "m", group: "5m", kind, side: "yes", entryAt: T0, settledAt: T0 + i,
    minutesToExpiry: 5, entryPrice: 0.5, quantity: 10, fees: 0.1, pnl, pYesBase: 0.6, pYesCtx: 0.6, marketMid: 0.5,
    yesWon: yes, edgeAtEntry: 0.03, official: true,
  };
}

test("trial summary ignores sim rows and gate stays closed early", () => {
  const scores = [row(1, 5, true), row(2, -5, false), row(3, 100, true, "sim-window")];
  const sum = summarize({ scores, trialStartedAt: T0 }, T0 + 86_400_000, 10_000);
  assert.equal(sum.trades, 2);
  assert.equal(sum.sim.trades, 1);
  const gate = evaluateGate(sum, 600);
  assert.equal(gate.eligible, false);
  assert.ok(gate.checks.find((c) => c.id === "days" && !c.pass));
});

test("gate can open when every criterion holds", () => {
  const scores: ScoreRow[] = [];
  for (let i = 0; i < 120; i += 1) {
    const win = i % 3 !== 0; // 80 wins / 40 losses at the sample
    scores.push({ ...row(i, win ? 4 : -3, win), pYesBase: win ? 0.8 : 0.3, marketMid: 0.5 });
  }
  const sum = summarize({ scores, trialStartedAt: T0 }, T0 + 8 * 86_400_000, 10_000);
  const gate = evaluateGate(sum, 600);
  assert.equal(gate.eligible, true, JSON.stringify(gate.checks.filter((c) => !c.pass)));
});

test("realizedVol needs data and stays bounded", () => {
  assert.equal(realizedVol([1, 2, 3], 5000), null);
  const xs = Array.from({ length: 100 }, (_, i) => 100_000 * (1 + 0.0001 * Math.sin(i)));
  const v = realizedVol(xs, 5000);
  assert.ok(v != null && v >= 0.25 && v <= 1.6);
});

const market: Market = {
  ...(applyTape(makeCore(T0), tape(T0), { "poly-m1": 100_000 }, T0).liveMarkets[0] as Market),
};

function sig(over = {}) {
  return {
    id: "sig1", marketId: "poly-m1", createdAt: T0, expiresAt: T0, modelVersion: "t", probability: 0.6, uncertainty: 0.05,
    side: "yes" as const, executablePrice: 0.47, stake: 80, shares: 100, debit: 47, expectedValue: 0.05, edge: 0.05,
    rationale: [], risks: [], pYesBase: 0.6, pYesCtx: 0.6, marketMid: 0.44, status: "executed" as const,
    rejectedReason: null, question: "q", kind: "live" as const, mode: "auto" as const, ...over,
  };
}

test("live plan: refuses when off, stale, unaffordable; clamps size to caps", () => {
  const core = { killed: false, circuitKind: null };
  const base = makeCore(T0).live;
  const fresh = { ...market, updatedAt: T0, source: "Polymarket CLOB" };
  assert.ok("refused" in planLiveOrder(core, base, sig(), fresh, { now: T0, eligible: true }));
  const armed = { ...base, status: "armed" as const };
  assert.ok("refused" in planLiveOrder(core, armed, sig(), fresh, { now: T0, eligible: false }));
  assert.ok("refused" in planLiveOrder(core, armed, sig(), fresh, { now: T0 + 60_000, eligible: true }));
  const ok = planLiveOrder(core, armed, sig(), fresh, { now: T0, eligible: true });
  assert.ok("plan" in ok);
  if ("plan" in ok) {
    assert.ok(ok.plan.cost <= armed.maxStake + 1e-9);
    assert.equal(ok.plan.tokenId, "111111111111");
  }
  const no = planLiveOrder(core, armed, sig({ side: "no" }), fresh, { now: T0, eligible: true });
  if ("plan" in no) assert.equal(no.plan.tokenId, "222222222222");
  assert.ok("refused" in planLiveOrder({ killed: true, circuitKind: null }, armed, sig(), fresh, { now: T0, eligible: true }));
});

test("roundUpToTick keeps limit marketable", () => {
  assert.equal(roundUpToTick(0.471, 0.01), 0.48);
  assert.equal(roundUpToTick(0.47, 0.01), 0.47);
});

function mockSdk(log: string[], matched = "10"): ClobSdk {
  return {
    BUY: "BUY", GTC: "GTC", COLLATERAL: "C",
    client: {
      getTickSize: async () => "0.01",
      getNegRisk: async () => false,
      createOrder: async () => { log.push("create"); return {}; },
      createAndPostOrder: async () => { log.push("post"); return { success: true, orderID: "ex1", status: "live" }; },
      getOrder: async () => ({ status: "MATCHED", size_matched: matched, original_size: "10", price: "0.47" }),
      cancelOrder: async () => { log.push("cancel"); return {}; },
      getBalanceAllowance: async () => ({ balance: "12500000" }),
    },
  };
}

test("dry run signs but never posts; armed posts; reconcile settles on resolution", async () => {
  const log: string[] = [];
  const sdk = mockSdk(log);
  const plan = { tokenId: "111111111111", price: 0.47, size: 10, cost: 4.7 };
  const dry = await submitLive(sdk, { ...makeCore(T0).live, status: "dry" }, sig(), market, plan, T0);
  assert.equal(dry.status, "dry");
  assert.deepEqual(log, ["create"]);
  const real = await submitLive(sdk, { ...makeCore(T0).live, status: "armed" }, sig(), market, plan, T0);
  assert.equal(real.status, "open");
  assert.ok(log.includes("post"));
  const book = { ...makeCore(T0).live, status: "armed" as const, orders: [real] };
  const rec = await reconcileLive(sdk, book, { m1: true }, T0 + 1000);
  assert.equal(rec.lastReconcileOk, true);
  assert.equal(rec.orders[0].settled, true);
  assert.ok(Math.abs((rec.orders[0].pnl ?? 0) - 10 * (1 - 0.47)) < 1e-9);
  assert.equal(rec.exchangeCash, 12.5);
});

test("parsers: resolution, crowd, world monitor", () => {
  assert.equal(parseResolution({ closed: true, outcomePrices: '["1","0"]' }), true);
  assert.equal(parseResolution({ closed: true, outcomePrices: ["0", "1"] }), false);
  assert.equal(parseResolution({ closed: false, outcomePrices: ["1", "0"] }), null);
  assert.equal(parseResolution({ closed: true, outcomePrices: ["0.5", "0.5"] }), null);
  const crowd = parseCrowd([{ question: "Will Bitcoin hit 150k?", outcomePrices: '["0.12","0.88"]', volume24hr: 5 }, { question: "Super Bowl", outcomePrices: '["0.5","0.5"]' }]);
  assert.equal(crowd.length, 1);
  const wm = parseWmMarkets({ markets: [{ id: "a", title: "T", yes_price: 0.3, volume: 9, url: "u" }] });
  assert.equal(wm[0].yes, 0.3);
  assert.equal(pickIndex({ data: { value: 22 } }), 22);
  assert.equal(pickIndex({ value: 500 }), null);
});

test("runner: commands apply, live never resumes after restart, arming is refused without gate", async () => {
  let now = T0;
  const persisted: unknown[] = [];
  const queue: Array<import("./types.ts").DeskCommand> = [];
  const deps = {
    now: () => now,
    loadTape: async () => tape(now),
    fetchQuotes: async () => [],
    fetchResolutions: async () => ({}),
    fetchSpotAt: async () => 100_000,
    loadContext: async () => { throw new Error("offline"); },
    getSdk: async () => mockSdk([]),
    liveEnv: () => ({ enabled: true, hasKey: true, hasFunder: true, hasOwnerToken: true }),
    persist: async (c: unknown) => { persisted.push(c); },
    journal: async () => {},
    drainCommands: async () => queue.splice(0),
  };
  const armedCore = { ...makeCore(T0), live: { ...makeCore(T0).live, status: "armed" as const, auto: true } };
  const r = new DeskRunner(deps, armedCore);
  assert.equal(r.core.live.status, "off");
  queue.push({ type: "liveSetStatus", status: "armed", confirm: "I understand this trades real money" });
  now += 1000;
  await r.step();
  assert.equal(r.core.live.status, "off", "gate must block arming on an empty trial");
  queue.push({ type: "liveSetStatus", status: "dry" });
  now += 1000;
  await r.step();
  assert.equal(r.core.live.status, "dry");
  queue.push({ type: "liveUpdate", maxStake: 9999 });
  now += 1000;
  await r.step();
  assert.equal(r.core.live.maxStake, 25);
  assert.ok(persisted.length > 0);
});

import { mkdtemp, readFile as rf } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join as pjoin } from "node:path";
import { AccountStore } from "../accounts/store.ts";
import { open as openBlob, seal as sealBlob } from "../accounts/crypto.ts";

test("accounts: sign up/in, session, sealed secrets, isolation", async () => {
  const root = await mkdtemp(pjoin(tmpdir(), "helios-"));
  const env = { HELIOS_MASTER_KEY: "unit-test-master-key-123456" };
  const st = new AccountStore(root, env);
  assert.ok((await st.signUp("bad", "longenoughpw")).error);
  assert.ok((await st.signUp("a@b.co", "short")).error);
  const a = await st.signUp("A@b.co", "correct horse battery");
  assert.ok(a.user?.admin);
  assert.ok((await st.signUp("a@b.co", "another long pw!!")).error, "duplicate email");
  const b = await st.signUp("c@d.co", "correct horse battery");
  assert.equal(b.user?.admin, false);
  assert.ok((await st.signIn("a@b.co", "wrong password!!")).error);
  const ok = await st.signIn("a@b.co", "correct horse battery");
  assert.ok(ok.token);
  assert.equal((await st.userForToken(ok.token))?.id, a.user?.id);
  assert.equal(await st.userForToken("nope"), null);
  await st.saveSecrets(a.user!.id, { polyPrivateKey: "0xabc", polyFunder: "0xdef" });
  const raw = await rf(pjoin(st.userDir(a.user!.id), "secrets.enc"), "utf8");
  assert.ok(!raw.includes("0xabc"), "secret must not be on disk in clear");
  assert.equal((await st.loadSecrets(a.user!.id)).polyPrivateKey, "0xabc");
  assert.deepEqual(await st.loadSecrets(b.user!.id), {});
  assert.throws(() => openBlob(sealBlob("x", "user-a", env), "user-b", env), "AAD must bind to the owner");
  await st.signOut(ok.token);
  assert.equal(await st.userForToken(ok.token), null);
  await st.saveSecrets(a.user!.id, { clear: ["polyPrivateKey"] });
  assert.equal((await st.loadSecrets(a.user!.id)).polyPrivateKey, undefined);
});

test("accounts: lockout after repeated failures", async () => {
  const root = await mkdtemp(pjoin(tmpdir(), "helios-"));
  const st = new AccountStore(root, { HELIOS_MASTER_KEY: "unit-test-master-key-123456" });
  await st.signUp("x@y.co", "correct horse battery");
  for (let i = 0; i < 5; i += 1) await st.signIn("x@y.co", "wrong wrong wrong", "1.1.1.1");
  const r = await st.signIn("x@y.co", "correct horse battery", "1.1.1.1");
  assert.match(r.error ?? "", /Too many/);
});

import { fetchDataset, parseCandles, parsePriceHistory, parseResolvedEvent, type Dataset, type HistMarket } from "./history.ts";
import { runRealBacktest } from "./backtest.ts";
import { mulberry32, yesProbability } from "./engine.ts";

function synthDataset(n: number, efficient: boolean): Dataset {
  const rand = mulberry32(7);
  const T = 1_800_000_000_000;
  const candles: Dataset["candles"] = [];
  const markets: HistMarket[] = [];
  let px = 100_000;
  const total = n * 5 + 120;
  const cl: number[] = [];
  for (let i = 0; i < total; i += 1) {
    const o = px;
    px *= 1 + (rand() - 0.5) * 0.002;
    candles.push([T + i * 60_000, o, Math.max(o, px), Math.min(o, px), px]);
    cl.push(px);
  }
  for (let k = 0; k < n; k += 1) {
    const s = T + (k * 5 + 60) * 60_000;
    const e = s + 5 * 60_000;
    const openIdx = k * 5 + 60;
    const closeIdx = openIdx + 4;
    const yesWon = candles[closeIdx][4] > candles[openIdx][1];
    const prices: Array<[number, number]> = [];
    for (let m = 0; m <= 6; m += 1) {
      const ts = (s - 60_000 + m * 60_000) / 1000;
      let mid = 0.5;
      if (efficient && m >= 1) {
        // an efficient market prices the same information the model sees, plus a little noise
        const spotNow = candles[Math.min(openIdx + m - 2, closeIdx)][4];
        const mk = { kind: "live", question: "Up or Down", openSpot: candles[openIdx][1], endAt: e, startAt: s, strikeLow: null, strikeHigh: null } as unknown as Market;
        mid = Math.min(0.97, Math.max(0.03, yesProbability(mk, spotNow, s + (m - 1) * 60_000).p + (rand() - 0.5) * 0.02));
      }
      prices.push([ts, mid]);
    }
    markets.push({ id: `h${k}`, question: "Bitcoin", group: "5m", startAt: s, endAt: e, yesTokenId: "1".repeat(12), yesWon, liquidity: 10_000, prices });
  }
  return { fetchedAt: T, from: T, to: T + total * 60_000, candles, markets, notes: [] };
}

test("real backtest runs chronologically, produces three slices and a verdict", () => {
  const r = runRealBacktest(synthDataset(400, true));
  assert.equal(r.periods.map((p) => p.name).join(), "train,validation,test");
  assert.equal(r.marketsUsed, 400);
  assert.ok(r.brier && r.brier.n === 400);
  assert.ok(r.sweep.length === 12);
  assert.ok(typeof r.verdict === "string" && r.verdict.length > 10);
  // efficient market that already prices the spot move: no edge after costs, so no gold mine
  assert.ok(r.periods[2].netPnl < 150, `suspiciously profitable vs an efficient market: ${r.periods[2].netPnl}`);
});

test("against a market that ignores BTC, the replay does find the (real) edge", () => {
  const r = runRealBacktest(synthDataset(400, false));
  assert.ok(r.periods[2].trades > 20 && r.periods[2].netPnl > 0, `expected positive, got ${r.periods[2].netPnl}`);
  assert.ok(r.brier && r.brier.model < r.brier.market);
});

test("backtest cannot see the future: prices that leak the outcome only after decision time do not help", () => {
  const ds = synthDataset(300, true);
  // leak: add a final price at settlement (after any decision) revealing the outcome
  for (const m of ds.markets) m.prices.push([m.endAt / 1000, m.yesWon ? 1 : 0]);
  const r = runRealBacktest(ds);
  assert.ok(r.periods[2].netPnl < 150);
});

test("history parsers", () => {
  assert.equal(parsePriceHistory({ history: [{ t: 2, p: 0.6 }, { t: 1, p: 0.5 }, { t: 3, p: 7 }] }).length, 2);
  assert.deepEqual(parseCandles([[60, 1, 3, 2, 2.5, 10]])[0], [60_000, 2, 3, 1, 2.5]);
  const ev = { markets: [{ id: 5, question: "q", closed: true, outcomePrices: '["1","0"]', clobTokenIds: '["1234567890123","9999999999999"]', endDate: "2026-10-01T00:05:00Z", eventStartTime: "2026-10-01T00:00:00Z" }] };
  const m = parseResolvedEvent(ev, "5m", 300_000);
  assert.equal(m.length, 1);
  assert.equal(m[0].yesWon, true);
  assert.equal(m[0].endAt - m[0].startAt, 300_000);
});

test("fetchDataset assembles markets, prices and candles from fake endpoints", async () => {
  const now = Date.parse("2026-10-02T00:00:00Z");
  const get = async (url: string) => {
    if (url.includes("gamma-api") && url.includes("btc-up-or-down-5m")) {
      return url.includes("offset=0")
        ? [{ markets: [{ id: 1, question: "q", closed: true, outcomePrices: ["0", "1"], clobTokenIds: ["1234567890123", "2234567890123"], endDate: "2026-10-01T12:05:00Z" }] }]
        : [];
    }
    if (url.includes("gamma-api")) return [];
    if (url.includes("prices-history")) return { history: [{ t: 1, p: 0.4 }, { t: 2, p: 0.5 }, { t: 3, p: 0.6 }] };
    if (url.includes("candles")) return [[1_790_000_000, 1, 2, 1.5, 1.8, 3]];
    throw new Error("unexpected " + url);
  };
  const ds = await fetchDataset({ days: 2, maxPerSeries: 10, now, getJson: get, sleep: async () => {} });
  assert.equal(ds.markets.length, 1);
  assert.equal(ds.markets[0].yesWon, false);
  assert.ok(ds.candles.length >= 1);
});
