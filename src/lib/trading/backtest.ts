/**
 * Real-data backtest: replays the live decision rules over resolved Polymarket windows using the
 * information that existed at each decision time (candles strictly before it, the last market price
 * at or before it). Pure: takes a Dataset, returns a report.
 */
import { DEFAULT_RISK, evaluateOpportunity, feePerShare, MODEL_VERSION, realizedVol, STARTING_CASH, yesProbability } from "./engine.ts";
import type { Dataset, HistMarket } from "./history.ts";
import type { BacktestPeriod, BacktestTrade, EquityPoint, Market, RiskConfig } from "./types.ts";

export interface Params {
  minEdge: number;
  uncertaintyHaircut: number;
  /** trust in the model versus the market price (see blend.ts) */
  blendW: number;
}

export interface TradeRow {
  marketId: string;
  group: string;
  at: number;
  endAt: number;
  side: "yes" | "no";
  price: number;
  stake: number;
  pnl: number;
  fee: number;
  won: boolean;
  edge: number;
  pYes: number;
  mid: number;
}

export interface SweepRow {
  params: Params;
  train: { trades: number; expectancy: number };
  validation: { trades: number; expectancy: number; netPnl: number };
}

export interface RealBacktestReport {
  kind: "real-data";
  modelVersion: string;
  ranAt: number;
  range: { from: number; to: number };
  marketsUsed: number;
  marketsSkipped: number;
  halfSpread: number;
  chosen: Params;
  periods: BacktestPeriod[];
  defaultTest: BacktestPeriod | null;
  sweep: SweepRow[];
  brier: { n: number; model: number; market: number } | null;
  byGroup: Array<{ group: string; trades: number; netPnl: number; winRate: number }>;
  assumptions: string[];
  notes: string[];
  verdict: string;
}

export interface BtOptions {
  halfSpread?: number;
  risk?: Partial<RiskConfig>;
  minTradesToSelect?: number;
}

function lastAtOrBefore<T extends [number, ...unknown[]]>(rows: T[], t: number, maxAge: number): T | null {
  let lo = 0;
  let hi = rows.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (rows[mid][0] <= t) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (ans < 0) return null;
  return t - rows[ans][0] <= maxAge ? rows[ans] : null;
}

export class CandleIndex {
  private t: number[];
  private rows: Dataset["candles"];
  constructor(rows: Dataset["candles"]) {
    this.rows = rows;
    this.t = rows.map((r) => r[0]);
  }
  /** Index of the candle that starts at `ms` (exact minute), or -1. */
  at(ms: number) {
    let lo = 0;
    let hi = this.t.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.t[mid] === ms) return mid;
      if (this.t[mid] < ms) lo = mid + 1;
      else hi = mid - 1;
    }
    return -1;
  }
  open(i: number) {
    return this.rows[i][1];
  }
  close(i: number) {
    return this.rows[i][4];
  }
  closes(from: number, to: number) {
    const out: number[] = [];
    for (let i = Math.max(0, from); i <= to && i < this.rows.length; i += 1) out.push(this.rows[i][4]);
    return out;
  }
}

function decisionTimes(m: HistMarket) {
  const len = m.endAt - m.startAt;
  const step = Math.max(60_000, Math.round(len / 48 / 60_000) * 60_000);
  const out: number[] = [];
  for (let t = m.startAt + 60_000; t <= m.endAt - 60_000; t += step) out.push(t);
  return out;
}

interface Snapshot {
  t: number;
  spot: number;
  open: number;
  vol: number | null;
  mid: number;
}

function snapshots(m: HistMarket, ci: CandleIndex): Snapshot[] {
  const startMin = Math.floor(m.startAt / 60_000) * 60_000;
  const openIdx = ci.at(startMin);
  if (openIdx < 0) return [];
  const open = ci.open(openIdx);
  const out: Snapshot[] = [];
  for (const t of decisionTimes(m)) {
    // the candle that ended at or before t is the one starting one minute earlier: no look-ahead
    const idx = ci.at(Math.floor(t / 60_000) * 60_000 - 60_000);
    if (idx < 0) continue;
    const px = lastAtOrBefore(m.prices, Math.floor(t / 1000), 180);
    if (!px) continue;
    const hist = ci.closes(idx - 40, idx);
    out.push({ t, spot: ci.close(idx), open, vol: realizedVol(hist, 60_000), mid: px[1] });
  }
  return out;
}

function synth(m: HistMarket, s: Snapshot, half: number): Market {
  return {
    id: m.id, kind: "live", question: `${m.question || "Bitcoin"} Up or Down`, outcomes: ["Up", "Down"], status: "open",
    startAt: m.startAt, endAt: m.endAt, strikeLow: null, strikeHigh: null, openSpot: s.open,
    resolution: "historical replay of a resolved Polymarket window ".repeat(2), sourceUrl: null, metadataOk: true, restricted: false,
    yesBid: Math.max(0.01, s.mid - half), yesAsk: Math.min(0.99, s.mid + half),
    liquidity: Math.max(m.liquidity, 5_000), volume: 0, updatedAt: s.t, source: "replay", group: m.group,
    yesTokenId: null, noTokenId: null, conditionId: null, gammaId: m.id,
  };
}

export function replay(markets: HistMarket[], ci: CandleIndex, params: Params, base: RiskConfig, half: number): TradeRow[] {
  const risk: RiskConfig = { ...base, minEdge: params.minEdge, uncertaintyHaircut: params.uncertaintyHaircut };
  const trades: TradeRow[] = [];
  let equity = STARTING_CASH;
  const open: Array<{ endAt: number; stake: number }> = [];
  const placed: number[] = [];
  for (const m of markets) {
    for (const s of snapshots(m, ci)) {
      const live = open.filter((o) => o.endAt > s.t);
      open.length = 0;
      open.push(...live);
      const exposure = open.reduce((a, o) => a + o.stake, 0);
      const lastHour = placed.filter((t) => s.t - t < 3_600_000).length;
      const opp = evaluateOpportunity(synth(m, s, half), s.spot, s.t, risk, equity, exposure, lastHour, false, null, { vol: s.vol, blendW: params.blendW });
      if (opp.hardFail) continue;
      const won = (opp.side === "yes") === m.yesWon;
      const fee = opp.shares * feePerShare(opp.executablePrice, risk);
      const pnl = opp.shares * (won ? 1 : 0) - opp.shares * opp.executablePrice - fee;
      equity += pnl;
      open.push({ endAt: m.endAt, stake: opp.debit });
      placed.push(s.t);
      trades.push({ marketId: m.id, group: m.group, at: s.t, endAt: m.endAt, side: opp.side, price: opp.executablePrice, stake: opp.debit, pnl, fee, won, edge: opp.edge, pYes: opp.yesProbability, mid: s.mid });
      break; // one position per market
    }
  }
  return trades;
}

function periodOf(name: BacktestPeriod["name"], rows: TradeRow[], start: number, skipped: number): BacktestPeriod {
  let eq = start;
  let peak = eq;
  let dd = 0;
  const curve: EquityPoint[] = [{ t: 0, equity: eq }];
  let gw = 0;
  let gl = 0;
  let wins = 0;
  let losses = 0;
  let fees = 0;
  rows.forEach((r, i) => {
    eq += r.pnl;
    fees += r.fee;
    if (r.pnl > 0) {
      wins += 1;
      gw += r.pnl;
    } else {
      losses += 1;
      gl -= r.pnl;
    }
    peak = Math.max(peak, eq);
    dd = Math.max(dd, peak - eq);
    curve.push({ t: i + 1, equity: Math.round(eq * 100) / 100 });
  });
  const sample: BacktestTrade[] = rows.slice(0, 8).map((r) => ({ price: r.price, won: r.won, pnl: r.pnl, rejected: false }));
  return {
    name, trades: rows.length, wins, losses, rejected: skipped, netPnl: eq - start, fees,
    profitFactor: gl > 0 ? gw / gl : gw > 0 ? Infinity : 0,
    expectancy: rows.length ? (gw - gl) / rows.length : 0,
    maxDrawdown: dd, winRate: rows.length ? wins / rows.length : 0,
    avgWin: wins ? gw / wins : 0, avgLoss: losses ? -gl / losses : 0, curve, sample,
  };
}

function brierAt(markets: HistMarket[], ci: CandleIndex, vol = true) {
  let n = 0;
  let bm = 0;
  let bk = 0;
  for (const m of markets) {
    const snaps = snapshots(m, ci);
    if (!snaps.length) continue;
    const s = snaps[Math.floor(snaps.length / 2)];
    const p = yesProbability(synth(m, s, 0.01), s.spot, s.t, vol ? s.vol : null).p;
    const y = m.yesWon ? 1 : 0;
    bm += (p - y) ** 2;
    bk += (s.mid - y) ** 2;
    n += 1;
  }
  return n ? { n, model: bm / n, market: bk / n } : null;
}

export function runRealBacktest(data: Dataset, opts: BtOptions = {}): RealBacktestReport {
  const half = opts.halfSpread ?? 0.01;
  const risk: RiskConfig = { ...DEFAULT_RISK, ...(opts.risk ?? {}) };
  const minSel = opts.minTradesToSelect ?? 20;
  const ci = new CandleIndex(data.candles);
  const usable = data.markets.filter((m) => snapshots(m, ci).length > 0).sort((a, b) => a.endAt - b.endAt);
  const n = usable.length;
  const cut1 = Math.floor(n * 0.5);
  const cut2 = Math.floor(n * 0.75);
  const train = usable.slice(0, cut1);
  const val = usable.slice(cut1, cut2);
  const test = usable.slice(cut2);

  const grid: Params[] = [];
  for (const minEdge of [0.02, 0.04, 0.07]) for (const uncertaintyHaircut of [0.35, 0.7]) for (const blendW of [0.25, 0.5, 1]) grid.push({ minEdge, uncertaintyHaircut, blendW });
  const sweep: SweepRow[] = grid.map((params) => {
    const tr = replay(train, ci, params, risk, half);
    const va = replay(val, ci, params, risk, half);
    const exp = (rows: TradeRow[]) => (rows.length ? rows.reduce((a, r) => a + r.pnl, 0) / rows.length : 0);
    return {
      params,
      train: { trades: tr.length, expectancy: exp(tr) },
      validation: { trades: va.length, expectancy: exp(va), netPnl: va.reduce((a, r) => a + r.pnl, 0) },
    };
  });
  // choose on validation only, needing a minimum sample; otherwise keep the shipped defaults
  const eligible = sweep.filter((s) => s.validation.trades >= minSel).sort((a, b) => b.validation.expectancy - a.validation.expectancy);
  const chosen = eligible[0]?.params ?? { minEdge: risk.minEdge, uncertaintyHaircut: risk.uncertaintyHaircut, blendW: 0.5 };

  const trTrades = replay(train, ci, chosen, risk, half);
  const vaTrades = replay(val, ci, chosen, risk, half);
  const teTrades = replay(test, ci, chosen, risk, half);
  const deTrades = replay(test, ci, { minEdge: risk.minEdge, uncertaintyHaircut: risk.uncertaintyHaircut, blendW: 0.5 }, risk, half);
  let cursor = STARTING_CASH;
  const periods: BacktestPeriod[] = [];
  for (const [name, rows, mk] of [["train", trTrades, train], ["validation", vaTrades, val], ["test", teTrades, test]] as const) {
    const p = periodOf(name, rows, cursor, mk.length - rows.length);
    periods.push(p);
    cursor += p.netPnl;
  }
  const defaultTest = periodOf("test", deTrades, STARTING_CASH, test.length - deTrades.length);

  const all = [...trTrades, ...vaTrades, ...teTrades];
  const groups = [...new Set(all.map((r) => r.group))];
  const byGroup = groups.map((g) => {
    const rows = all.filter((r) => r.group === g);
    return { group: g, trades: rows.length, netPnl: rows.reduce((a, r) => a + r.pnl, 0), winRate: rows.filter((r) => r.pnl > 0).length / rows.length };
  });
  const brier = brierAt(usable, ci);
  const t = periods[2];
  const verdict =
    n < 100
      ? `Only ${n} usable windows. Too little data to conclude anything; fetch more days.`
      : t.trades < 30
        ? `The chosen rules traded only ${t.trades} times in the untouched test slice, so the result is not meaningful.`
        : brier && brier.model >= brier.market
          ? "The model's probabilities are no better than the market price on this data. Any edge shown is most likely noise or selection."
          : t.netPnl > 0 && t.profitFactor >= 1.1
            ? "Test slice is profitable after costs and the model beats the market price on Brier. Promising, not proof: confirm in the live paper trial."
            : "Test slice is not profitable after costs. Do not go live on this model.";
  return {
    kind: "real-data",
    modelVersion: MODEL_VERSION,
    ranAt: Date.now(),
    range: { from: data.from, to: data.to },
    marketsUsed: n,
    marketsSkipped: data.markets.length - n,
    halfSpread: half,
    chosen,
    periods,
    defaultTest,
    sweep,
    brier,
    byGroup,
    notes: data.notes,
    verdict,
    assumptions: [
      `Replays resolved Polymarket Up/Down windows. Decisions use only candles that closed before the decision minute and the last market price at or before it.`,
      `Quotes are rebuilt from the price history as mid ± ${(half * 100).toFixed(1)}¢. Real books can be wider or thinner, so fills here are optimistic.`,
      `Costs: Polymarket taker fee ${(feePerShare(0.5, risk) * 100).toFixed(2)}¢ per share at 50¢, slippage ${(risk.slippage * 100).toFixed(2)}¢, flat stake up to $${risk.maxStake}, one position per window, exposure and hourly caps respected.`,
      `Parameters (minimum edge, haircut) are picked on the validation slice only; the test slice is touched once. Slices are chronological thirds of 50/25/25 percent of windows.`,
      `BTC prints are Coinbase 1-minute candles; Polymarket resolves on its own source, so edge cases can differ.`,
      `Liquidity history is not available, so windows count as liquid (at least $5k).`,
    ],
  };
}
