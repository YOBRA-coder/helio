/**
 * Paper-trial analytics and the live-eligibility gate.
 *
 * Only trades on REAL Polymarket markets count (kind === "live"). The sim windows are
 * priced with a deliberate bias so the UI has something to rehearse on; they must never
 * count towards a track record.
 */
import type { BrierBasis, DeskCore, ScoreRow } from "./types.ts";

export const BASIS_LABEL: Record<BrierBasis, string> = { model: "Model", ctx: "Model + context", alt: "Shadow: momentum" };

export interface Bucket {
  key: string;
  trades: number;
  wins: number;
  pnl: number;
}

export interface TrialSummary {
  days: number;
  trades: number;
  officialTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnl: number;
  fees: number;
  profitFactor: number;
  expectancy: number;
  /** One-sided ~90% lower bound on per-trade expectancy (normal approx). */
  expectancyLow90: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  brierModel: number | null;
  brierCtx: number | null;
  brierAlt: number | null;
  brierMarket: number | null;
  /** Which probability the gate scores. */
  brierBasis: BrierBasis;
  /** Brier of the chosen basis, and of the market on exactly the same trades (null until enough data). */
  brierChosen: number | null;
  brierChosenMarket: number | null;
  /** Positive when the chosen probabilities beat the market mid on the same trades. */
  brierEdge: number | null;
  /** brierEdge divided by its standard error. Under ~1.3 the gap is indistinguishable from luck. */
  brierEdgeZ: number | null;
  byMode: Bucket[];
  byGroup: Bucket[];
  byTtx: Bucket[];
  bySide: Bucket[];
  byEdge: Bucket[];
  last24h: { trades: number; wins: number; pnl: number };
  pnls: number[];
  calibration: Array<{ p: number; won: number; n: number }>;
  sim: { trades: number; netPnl: number };
}

export interface GateCheck {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
}

export interface GateConfig {
  minDays: number;
  minTrades: number;
  minProfitFactor: number;
  maxDrawdownFraction: number;
}

export const DEFAULT_GATE: GateConfig = {
  minDays: 7,
  minTrades: 100,
  minProfitFactor: 1.1,
  maxDrawdownFraction: 0.8,
};

function bucketOf(rows: ScoreRow[], keyOf: (r: ScoreRow) => string): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const r of rows) {
    const key = keyOf(r);
    const b = map.get(key) ?? { key, trades: 0, wins: 0, pnl: 0 };
    b.trades += 1;
    if (r.pnl > 0) b.wins += 1;
    b.pnl += r.pnl;
    map.set(key, b);
  }
  return [...map.values()].sort((a, b) => b.trades - a.trades);
}

function ttxLabel(min: number) {
  if (min <= 6) return "≤ 5 min";
  if (min <= 16) return "≤ 15 min";
  if (min <= 65) return "≤ 1 h";
  if (min <= 250) return "≤ 4 h";
  return "> 4 h";
}

function calibrate(rows: ScoreRow[], pick: (r: ScoreRow) => number = (r) => r.pYesBase) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({ sum: 0, won: 0, n: 0, i }));
  for (const r of rows) {
    const p = pick(r);
    const b = buckets[Math.min(9, Math.max(0, Math.floor(p * 10)))];
    b.n += 1;
    b.sum += p;
    b.won += r.yesWon ? 1 : 0;
  }
  return buckets.map((b) => ({ p: b.n ? b.sum / b.n : (b.i + 0.5) / 10, won: b.n ? b.won / b.n : 0, n: b.n }));
}

export function summarize(core: Pick<DeskCore, "scores" | "trialStartedAt"> & { gateBasis?: BrierBasis }, now: number, startingEquity: number): TrialSummary {
  const basis: BrierBasis = core.gateBasis === "ctx" || core.gateBasis === "alt" ? core.gateBasis : "model";
  const all = core.scores;
  const real = all.filter((r) => r.kind === "live").sort((a, b) => a.settledAt - b.settledAt);
  const sim = all.filter((r) => r.kind === "sim-window");
  const wins = real.filter((r) => r.pnl > 0);
  const losses = real.filter((r) => r.pnl <= 0);
  const grossWin = wins.reduce((a, r) => a + r.pnl, 0);
  const grossLoss = -losses.reduce((a, r) => a + r.pnl, 0);
  const n = real.length;
  const mean = n ? real.reduce((a, r) => a + r.pnl, 0) / n : 0;
  const variance = n > 1 ? real.reduce((a, r) => a + (r.pnl - mean) ** 2, 0) / (n - 1) : 0;
  const se = n > 1 ? Math.sqrt(variance / n) : 0;

  let equity = startingEquity;
  let peak = equity;
  let maxDd = 0;
  for (const r of real) {
    equity += r.pnl;
    peak = Math.max(peak, equity);
    maxDd = Math.max(maxDd, peak - equity);
  }

  const official = real.filter((r) => r.official && r.yesWon != null);
  const brier = (pick: (r: ScoreRow) => number) =>
    official.length ? official.reduce((a, r) => a + (pick(r) - (r.yesWon ? 1 : 0)) ** 2, 0) / official.length : null;
  const brierModel = brier((r) => r.pYesBase);
  const brierCtx = brier((r) => r.pYesCtx);
  const altRows = official.filter((r) => typeof r.pYesAlt === "number");
  const brierAlt = altRows.length >= 10 ? altRows.reduce((a, r) => a + ((r.pYesAlt as number) - (r.yesWon ? 1 : 0)) ** 2, 0) / altRows.length : null;
  const brierMarket = brier((r) => r.marketMid);

  // The gate yardstick: chosen probability vs the market, on exactly the same trades (paired).
  const pickP = (r: ScoreRow) => (basis === "ctx" ? r.pYesCtx : basis === "alt" ? (r.pYesAlt as number) : r.pYesBase);
  const rowsB = basis === "alt" ? altRows : official;
  const sq = (p: number, r: ScoreRow) => (p - (r.yesWon ? 1 : 0)) ** 2;
  let brierChosen: number | null = null;
  let brierChosenMarket: number | null = null;
  let brierEdge: number | null = null;
  let brierEdgeZ: number | null = null;
  if (rowsB.length >= (basis === "alt" ? 10 : 1)) {
    const d = rowsB.map((r) => sq(r.marketMid, r) - sq(pickP(r), r)); // positive = chosen beats market
    const m = d.reduce((a, x) => a + x, 0) / d.length;
    brierChosen = rowsB.reduce((a, r) => a + sq(pickP(r), r), 0) / rowsB.length;
    brierChosenMarket = rowsB.reduce((a, r) => a + sq(r.marketMid, r), 0) / rowsB.length;
    brierEdge = m;
    if (d.length > 2) {
      const v = d.reduce((a, x) => a + (x - m) ** 2, 0) / (d.length - 1);
      brierEdgeZ = v > 0 ? m / Math.sqrt(v / d.length) : null;
    }
  }

  return {
    days: Math.max(0, (now - core.trialStartedAt) / 86_400_000),
    trades: n,
    officialTrades: official.length,
    wins: wins.length,
    losses: losses.length,
    winRate: n ? wins.length / n : 0,
    netPnl: real.reduce((a, r) => a + r.pnl, 0),
    fees: real.reduce((a, r) => a + r.fees, 0),
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
    expectancy: mean,
    expectancyLow90: mean - 1.2816 * se,
    avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? -grossLoss / losses.length : 0,
    maxDrawdown: maxDd,
    brierModel,
    brierCtx,
    brierAlt,
    brierMarket,
    brierBasis: basis,
    brierChosen,
    brierChosenMarket,
    brierEdge,
    brierEdgeZ,
    byMode: bucketOf(real, (r) => (r.mode === "auto" ? "Auto (desk placed)" : r.mode === "manual" ? "Manual (you approved)" : "Before mode was recorded")),
    byGroup: bucketOf(real, (r) => r.group),
    byTtx: bucketOf(real, (r) => ttxLabel(r.minutesToExpiry)),
    bySide: bucketOf(real, (r) => (r.side === "yes" ? "Bet Up / Yes" : "Bet Down / No")),
    byEdge: bucketOf(real, (r) => (r.edgeAtEntry < 0.05 ? "edge under 5¢" : r.edgeAtEntry < 0.1 ? "edge 5–10¢" : "edge 10¢+")).sort((a, b) => a.key.localeCompare(b.key)),
    last24h: (() => {
      const rows = real.filter((r) => now - r.settledAt < 86_400_000);
      return { trades: rows.length, wins: rows.filter((r) => r.pnl > 0).length, pnl: rows.reduce((a, r) => a + r.pnl, 0) };
    })(),
    pnls: real.map((r) => r.pnl),
    calibration: calibrate(rowsB, pickP),
    sim: { trades: sim.length, netPnl: sim.reduce((a, r) => a + r.pnl, 0) },
  };
}

export function evaluateGate(
  summary: TrialSummary,
  drawdownLimit: number,
  cfg: GateConfig = DEFAULT_GATE,
): { checks: GateCheck[]; eligible: boolean } {
  const pf = Number.isFinite(summary.profitFactor) ? summary.profitFactor.toFixed(2) : "∞";
  const z = summary.brierEdgeZ;
  const label = BASIS_LABEL[summary.brierBasis];
  const brierDetail =
    summary.brierChosen != null && summary.brierChosenMarket != null
      ? `${label.toLowerCase()} ${summary.brierChosen.toFixed(4)} vs market ${summary.brierChosenMarket.toFixed(4)} (lower is better)` +
        (z != null ? ` · ${z >= 1.64 ? "clearly" : z > 0 ? "not clearly" : "not"} better than luck (z ${z.toFixed(1)})` : "")
      : summary.brierBasis === "alt"
        ? "momentum shadow needs 10+ scored windows"
        : "no official settlements yet";
  const checks: GateCheck[] = [
    {
      id: "days",
      label: `Trial has run at least ${cfg.minDays} days`,
      pass: summary.days >= cfg.minDays,
      detail: `${summary.days.toFixed(1)} days so far`,
    },
    {
      id: "trades",
      label: `At least ${cfg.minTrades} settled trades on real Polymarket markets`,
      pass: summary.trades >= cfg.minTrades,
      detail: `${summary.trades} so far (sim windows excluded: ${summary.sim.trades})`,
    },
    {
      id: "pnl",
      label: "Net P&L after fees and slippage is positive",
      pass: summary.trades > 0 && summary.netPnl > 0,
      detail: `${summary.netPnl >= 0 ? "+" : "−"}$${Math.abs(summary.netPnl).toFixed(2)}`,
    },
    {
      id: "pf",
      label: `Profit factor at least ${cfg.minProfitFactor.toFixed(2)}`,
      pass: summary.profitFactor >= cfg.minProfitFactor,
      detail: pf,
    },
    {
      id: "brier",
      label: `${label} probabilities beat the market price (Brier score)`,
      pass: summary.brierEdge != null && summary.brierEdge > 0,
      detail: brierDetail,
    },
    {
      id: "dd",
      label: "Max drawdown stayed inside the breaker",
      pass: summary.maxDrawdown <= drawdownLimit * cfg.maxDrawdownFraction,
      detail: `$${summary.maxDrawdown.toFixed(2)} of $${(drawdownLimit * cfg.maxDrawdownFraction).toFixed(0)} allowed`,
    },
  ];
  return { checks, eligible: checks.every((c) => c.pass) };
}

/** Plain-language read on whether the model's probabilities can be trusted. */
export function calibrationNote(summary: TrialSummary): string {
  const rows = summary.calibration.filter((r) => r.n > 0);
  const n = rows.reduce((a, r) => a + r.n, 0);
  if (n < 30) return "Not enough settled windows to judge calibration yet (needs about 30).";
  const predicted = rows.reduce((a, r) => a + r.p * r.n, 0) / n;
  const actual = rows.reduce((a, r) => a + r.won * r.n, 0) / n;
  const confident = rows.filter((r) => r.p >= 0.7 || r.p <= 0.3);
  const cn = confident.reduce((a, r) => a + r.n, 0);
  let out = `Across ${n} settled windows the model averaged ${(predicted * 100).toFixed(0)}% for Up and Up actually won ${(actual * 100).toFixed(0)}%.`;
  if (cn >= 10) {
    const gap = confident.reduce((a, r) => a + Math.abs((r.p >= 0.5 ? r.p : 1 - r.p) - (r.p >= 0.5 ? r.won : 1 - r.won)) * r.n, 0) / cn;
    out += ` When it was confident (70%+), it was off by ${(gap * 100).toFixed(0)} points on average${gap > 0.1 ? ", so its big edges are probably overstated" : ""}.`;
  }
  if (summary.brierAlt != null && summary.brierModel != null) {
    out += summary.brierAlt < summary.brierModel - 0.002 ? " The momentum variant scored better than the baseline." : " The momentum variant did not beat the baseline.";
  }
  return out;
}

/**
 * Honest sample-size note. With ~50¢ binary bets a per-trade standard deviation is about the stake,
 * so noise on the average result shrinks only with the square root of the number of trades.
 */
export function powerNote(summary: TrialSummary): string {
  if (summary.trades < 30) return "Too few trades to say anything. Keep the trial running.";
  if (summary.expectancyLow90 > 0) return "Average result is above zero even after allowing for noise (~90% one-sided). Still not a guarantee.";
  return "The average result is inside the noise band. 100 trades can show a bad strategy but cannot prove a good one; 300+ is more convincing.";
}
