/**
 * Strategy lab: a synthetic Polymarket "BTC Up or Down" world used to compare strategies head to head.
 *
 * WHAT IT IS: a controlled experiment. A 1-second BTC path (changing volatility, jumps), a crowd that prices each
 * window from that path, and the desk's real decision code (`evaluateOpportunity`) trading against the crowd's quotes
 * with the real fee formula, slippage, spread, exposure caps, hourly cap and loss-streak cool-off.
 *
 * WHAT IT IS NOT: proof of a real-market edge. The single most important unknown is how quickly Polymarket quotes
 * follow Coinbase (`lagSec`). The lab therefore sweeps it. If a strategy only wins when the crowd is slow, that is
 * what the sweep shows, and the live paper trial is what decides whether the real crowd is that slow.
 */
import { DEFAULT_RISK, STARTING_CASH, evaluateOpportunity, feePerShare, mulberry32, normalCdf, realizedVol } from "./engine.ts";
import type { Market, RiskConfig } from "./types.ts";

export type StrategyId = "legacy" | "closer";

export interface SimOpts {
  windows: number;
  /** window length in seconds (300 = the 5m series) */
  lenSec?: number;
  /** how many seconds the crowd's view of BTC trails the exchange feed Helios reads */
  lagSec?: number;
  seed?: number;
  strategy: StrategyId;
  /** crowd quote noise (probability points, 1 sd) */
  quoteNoise?: number;
  /** Polymarket resolves on its own source; 1 sd of the open/close difference vs Coinbase, in basis points */
  basisBp?: number;
  halfSpread?: number;
  /** how often Helios reads BTC, in seconds: 6 = the old REST poll, 1 = the live websocket */
  feedSec?: number;
  blendW?: number;
  risk?: Partial<RiskConfig>;
  /** crowd shades its probabilities toward 50% by this fraction (0 = perfectly calibrated crowd) */
  crowdShade?: number;
}

export interface SimTrade {
  window: number;
  side: "yes" | "no";
  price: number;
  stake: number;
  pnl: number;
  fee: number;
  won: boolean;
  edge: number;
  secondsLeft: number;
  modelP: number;
  mid: number;
}

export interface SimSummary {
  windows: number;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnl: number;
  fees: number;
  profitFactor: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  avgPrice: number;
  tradesPer100Windows: number;
  /** model Brier on the side it bought vs the price it paid (lower is better) */
  brierModel: number;
  brierMarket: number;
  curve: number[];
}

function randn(rand: () => number) {
  const u = Math.max(1e-12, rand());
  const v = Math.max(1e-12, rand());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}

const SEC_PER_YEAR = 365.25 * 24 * 3600;
const START_T = 1_800_000_000_000;
/** Jumps add variance the crowd knows about; this is exact for the jump process below. */
const JUMP_VAR_FACTOR = 1.27;

export function runSim(opts: SimOpts): { trades: SimTrade[]; summary: SimSummary } {
  const lenSec = opts.lenSec ?? 300;
  const lag = Math.max(0, Math.round(opts.lagSec ?? 0));
  const rand = mulberry32(opts.seed ?? 7);
  const quoteNoise = opts.quoteNoise ?? 0.012;
  const basis = (opts.basisBp ?? 1.5) / 10_000;
  const half = opts.halfSpread ?? 0.01;
  const blendW = opts.blendW ?? 0.5;
  const feedSec = Math.max(1, Math.round(opts.feedSec ?? 6));
  const shade = opts.crowdShade ?? 0;
  const risk: RiskConfig = { ...DEFAULT_RISK, ...(opts.risk ?? {}) };

  const warm = 2400; // seconds of history so the vol estimator is primed
  const total = warm + opts.windows * lenSec + 5;
  const S = new Float64Array(total);
  const sig = new Float64Array(total); // true per-second vol (fraction of price)
  S[0] = 80_000;
  let annual = 0.5;
  for (let t = 1; t < total; t += 1) {
    if (t % 1800 === 1) annual = Math.min(1.5, Math.max(0.2, 0.5 * Math.exp(0.35 * randn(rand))));
    const s = annual / Math.sqrt(SEC_PER_YEAR);
    sig[t] = s;
    let shock = s * randn(rand);
    if (rand() < 1 / 900) shock += s * Math.sqrt(60) * 2 * randn(rand);
    S[t] = S[t - 1] * (1 + shock);
  }

  let cash = STARTING_CASH;
  let peak = cash;
  let maxDd = 0;
  const curve: number[] = [cash];
  const trades: SimTrade[] = [];
  const placedAt: number[] = [];
  const open: Array<{ endSec: number; debit: number }> = [];
  const recent: boolean[] = []; // true = win, newest first
  let coolUntil = -1;
  const spots: number[] = [];
  let lastPoll = S[0];
  let lastPollT = 0;

  for (let w = 0; w < opts.windows; w += 1) {
    const t0 = warm + w * lenSec;
    const t1 = t0 + lenSec;
    const openFeed = S[t0];
    const market: Market = {
      id: `w${w}`, kind: "live", question: `Bitcoin Up or Down ${w}`, outcomes: ["Up", "Down"], status: "open",
      startAt: START_T + t0 * 1000, endAt: START_T + t1 * 1000, strikeLow: null, strikeHigh: null, openSpot: openFeed,
      resolution: "synthetic window used by the strategy lab, not a real market", sourceUrl: null, metadataOk: true, restricted: false,
      yesBid: 0.49, yesAsk: 0.51, liquidity: 20_000, volume: 0, updatedAt: START_T + t0 * 1000, source: "lab",
      group: lenSec === 300 ? "5m" : lenSec === 900 ? "15m" : lenSec === 3600 ? "1h" : "4h",
      yesTokenId: null, noTokenId: null, conditionId: null, gammaId: null,
    };
    // resolution compares Polymarket's source, which differs slightly from the exchange feed
    const yesWon = S[t1] * (1 + basis * randn(rand)) > S[t0] * (1 + basis * randn(rand));
    let held: { side: "yes" | "no"; qty: number; cost: number; fee: number; edge: number; secLeft: number; modelP: number; mid: number; price: number } | null = null;
    let quote = { bid: 0.49, ask: 0.51, mid: 0.5 };

    for (let t = t0 + 1; t < t1; t += 1) {
      const now = START_T + t * 1000;
      // exchange feed polled every 6 s, as the worker does
      if (t % feedSec === 0) {
        lastPoll = S[t] * (1 + 0.00003 * randn(rand));
        lastPollT = t;
      }
      // the volatility sample keeps its 6-second cadence whatever the feed speed
      if (t % 6 === 0) {
        spots.push(lastPoll);
        if (spots.length > 360) spots.shift();
      }
      // crowd quote refreshes every 2-3 s from its (lagged) view of BTC
      if (t % 2 === 0) {
        const seen = S[Math.max(t0, t - lag)];
        const left = Math.max(1, t1 - t);
        const sigmaT = sig[t] * Math.sqrt(left + lag) * Math.sqrt(JUMP_VAR_FACTOR) * seen;
        let pm = normalCdf((seen - S[t0]) / sigmaT);
        pm = 0.5 + (pm - 0.5) * (1 - shade);
        pm = Math.min(0.985, Math.max(0.015, pm + quoteNoise * randn(rand)));
        const bid = Math.max(0.01, Math.round((pm - half) * 100) / 100);
        const ask = Math.min(0.99, Math.round((pm + half) * 100) / 100);
        quote = { bid, ask, mid: (bid + ask) / 2 };
      }
      if (held || t % 4 !== 0 || spots.length < 5) continue;
      if (t < coolUntil) continue;

      for (let i = open.length - 1; i >= 0; i -= 1) if (open[i].endSec <= t) open.splice(i, 1);
      const exposure = open.reduce((a, o) => a + o.debit, 0);
      const lastHour = placedAt.filter((x) => t - x < 3600).length;
      const vol = realizedVol(spots, 6000);
      const m: Market = { ...market, yesBid: quote.bid, yesAsk: quote.ask, updatedAt: now };
      const opp = evaluateOpportunity(m, lastPoll, now, risk, cash, exposure, lastHour, false, null, {
        vol, spots, spotDtMs: 6000, staleMs: (t - lastPollT) * 1000 + (feedSec <= 1 ? 300 : 800), blendW, strategy: opts.strategy,
      });
      if (opp.hardFail) continue;
      const fee = opp.shares * feePerShare(opp.executablePrice, risk);
      const cost = opp.shares * opp.executablePrice + fee;
      if (cost > cash) continue;
      cash -= cost;
      open.push({ endSec: t1, debit: cost });
      placedAt.push(t);
      held = { side: opp.side, qty: opp.shares, cost, fee, edge: opp.edge, secLeft: t1 - t, modelP: opp.probability, mid: opp.marketMid, price: opp.executablePrice };
    }

    if (held) {
      const won = (held.side === "yes") === yesWon;
      const proceeds = won ? held.qty : 0;
      cash += proceeds;
      const pnl = proceeds - held.cost;
      trades.push({ window: w, side: held.side, price: held.price, stake: held.cost, pnl, fee: held.fee, won, edge: held.edge, secondsLeft: held.secLeft, modelP: held.modelP, mid: held.side === "yes" ? held.mid : 1 - held.mid });
      recent.unshift(won);
      if (recent.length >= 4 && recent.slice(0, 4).every((x) => !x)) {
        coolUntil = t1 + 3600; // same rule as the ledger: 4 losses in a row pauses entries for an hour
        recent.length = 0;
      }
    }
    peak = Math.max(peak, cash);
    maxDd = Math.max(maxDd, peak - cash);
    curve.push(Math.round(cash * 100) / 100);
  }

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const gw = wins.reduce((a, t) => a + t.pnl, 0);
  const gl = -losses.reduce((a, t) => a + t.pnl, 0);
  const n = trades.length;
  const summary: SimSummary = {
    windows: opts.windows,
    trades: n,
    wins: wins.length,
    losses: losses.length,
    winRate: n ? wins.length / n : 0,
    netPnl: cash - STARTING_CASH,
    fees: trades.reduce((a, t) => a + t.fee, 0),
    profitFactor: gl > 0 ? gw / gl : gw > 0 ? Infinity : 0,
    expectancy: n ? (gw - gl) / n : 0,
    avgWin: wins.length ? gw / wins.length : 0,
    avgLoss: losses.length ? -gl / losses.length : 0,
    maxDrawdown: maxDd,
    avgPrice: n ? trades.reduce((a, t) => a + t.price, 0) / n : 0,
    tradesPer100Windows: (n / opts.windows) * 100,
    brierModel: n ? trades.reduce((a, t) => a + (t.modelP - (t.won ? 1 : 0)) ** 2, 0) / n : 0,
    brierMarket: n ? trades.reduce((a, t) => a + (t.mid - (t.won ? 1 : 0)) ** 2, 0) / n : 0,
    curve,
  };
  return { trades, summary };
}
