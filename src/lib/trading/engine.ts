import type {
  BacktestPeriod,
  ContextSnapshot,
  BacktestReport,
  BacktestTrade,
  EquityPoint,
  Market,
  Opportunity,
  RiskConfig,
  Side,
  ThemeId,
} from "./types.ts";

/**
 * Shadow variant: the baseline plus a small nudge from the last ~60 seconds of price movement.
 * It is recorded and scored next to the baseline in the trial, but it never decides a trade.
 */
export function momentumProbability(baseP: number, spots: number[], spot: number, annualVol: number | null, spotDtMs: number) {
  const lookback = Math.max(2, Math.round(60_000 / Math.max(1000, spotDtMs)));
  if (spots.length <= lookback || spot <= 0) return baseP;
  const move = spot - spots[spots.length - 1 - lookback];
  const sigma = ((annualVol ?? PRIOR_ANNUAL_VOL) / Math.sqrt(365.25 * 24)) * Math.sqrt(1 / 60) * spot;
  if (!(sigma > 0)) return baseP;
  return clamp(baseP + clamp(move / sigma, -2, 2) * 0.02, 0.04, 0.96);
}

export const MODEL_VERSION = "helios-btc-0.6";
/** Up/Down windows: wait this long after the open before trading (the open print and early noise dominate). */
export const MAX_BELIEVABLE_EDGE = 0.08;
export const ENTRY_FRACTION = 0.3;
export const ENTRY_DELAY_MS = 45_000;

/** Taker fee per share at a given price. Polymarket's crypto fee peaks at 50¢ (about 1.75¢ per share) and shrinks toward the edges. */
export function feePerShare(price: number, risk: Pick<RiskConfig, "feeRate" | "feeCoef">) {
  return price * risk.feeRate + risk.feeCoef * price * (1 - price);
}
export const STARTING_CASH = 10_000;
export const APPROVAL_MS = 35_000;
export const DRIFT_LIMIT = 0.025;

export const DEFAULT_RISK: RiskConfig = {
  maxStake: 80,
  maxExposure: 400,
  dailyLossLimit: 250,
  drawdownLimit: 600,
  maxOrdersPerHour: 8,
  minEdge: 0.02,
  maxSpread: 0.06,
  minLiquidity: 1500,
  feeRate: 0,
  feeCoef: 0.07,
  slippage: 0.004,
  freshnessMs: 45_000,
  cancelOnKill: true,
  uncertaintyHaircut: 0.35,
};

export const THEMES: Array<{ id: ThemeId; name: string; line: string; color: string }> = [
  {
    id: "orchard",
    name: "Orchard",
    line: "Moss night. Chartreuse is the only signal.",
    color: "#101512",
  },
  {
    id: "glacier",
    name: "Glacier",
    line: "Graphite field and an ice-blue print.",
    color: "#0e1116",
  },
  {
    id: "gilt",
    name: "Gilt",
    line: "Umber dark, antique gold, after hours.",
    color: "#14110e",
  },
  {
    id: "ion",
    name: "Ion",
    line: "Ops floor. Ink black, one cyan mark.",
    color: "#07090d",
  },
  {
    id: "daybook",
    name: "Daybook",
    line: "Daylight paper. Same numbers, ink instead of glow.",
    color: "#f3efe6",
  },
];

export function isTheme(value: string | undefined | null): value is ThemeId {
  return THEMES.some((item) => item.id === value);
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function normalCdf(x: number) {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.2316419 * z);
  const d = 0.3989422804 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.319381530 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - p : p;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rand: () => number) {
  const u = Math.max(1e-9, rand());
  const v = Math.max(1e-9, rand());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}

const PRIOR_ANNUAL_VOL = 0.55;

/**
 * Annualised realised volatility from a rolling list of spot prints taken `dtMs` apart.
 * Returns null when there is not enough data. Blended with the prior so a quiet
 * ten minutes cannot talk the model into false certainty.
 */
export function realizedVol(spots: number[], dtMs: number): number | null {
  const xs = spots.filter((n) => Number.isFinite(n) && n > 0);
  if (xs.length < 30 || dtMs <= 0) return null;
  const rets: number[] = [];
  for (let i = 1; i < xs.length; i += 1) rets.push(Math.log(xs[i] / xs[i - 1]));
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, rets.length - 1);
  const perSqrtMs = Math.sqrt(variance / dtMs);
  const annual = perSqrtMs * Math.sqrt(365.25 * 24 * 3_600_000);
  if (!Number.isFinite(annual) || annual <= 0) return null;
  return clamp(0.5 * annual + 0.5 * PRIOR_ANNUAL_VOL, 0.25, 1.6);
}

export function legacyYesProbability(market: Market, spot: number, now: number, annualVol: number | null = null) {
  const hours = Math.max(0, market.endAt - now) / 3_600_000;
  const volPerSqrtHour = (annualVol ?? PRIOR_ANNUAL_VOL) / Math.sqrt(365.25 * 24);
  const sigma = Math.max(volPerSqrtHour * Math.sqrt(Math.max(hours, 0.05)) * spot, spot * 0.0008);
  if (market.openSpot && (market.kind === "sim-window" || /up or down/i.test(market.question))) {
    const z = (spot - market.openSpot) / sigma;
    const p = clamp(normalCdf(z * 0.9), 0.04, 0.96);
    return { p, uncertainty: market.kind === "sim-window" ? 0.045 : 0.08, sigma };
  }
  if (/up or down/i.test(market.question)) {
    // No window-open price: there is no honest estimate. Return a coin flip (the caller blocks the trade).
    return { p: 0.5, uncertainty: 0.2, sigma };
  }
  const zLo = market.strikeLow == null ? -8 : (market.strikeLow - spot) / sigma;
  const zHi = market.strikeHigh == null ? 8 : (market.strikeHigh - spot) / sigma;
  const p = clamp(normalCdf(zHi) - normalCdf(zLo), 0.005, 0.995);
  const uncertainty = clamp(0.04 + 0.06 * Math.exp(-hours / 8), 0.035, 0.16);
  return { p, uncertainty, sigma };
}

/**
 * "Closer" model (helios-btc-0.6) for real Up/Down windows.
 *
 * Question it answers: given where BTC is now versus the window-open print, and how long is left, how likely is it
 * that BTC finishes above the open? It is a plain random-walk model with honest error bars:
 *   - sigma over the time left comes from realised vol (annualised), widened by FAT_TAIL for jumps;
 *   - plus the staleness of our last print (we poll every few seconds, so the true price has moved since);
 *   - plus a basis term, because Polymarket settles on its own price source, not on Coinbase.
 * The 0.5-version of this model floored the time left at 3 minutes and shrank z by 10%, which made it far less
 * confident than the market late in a window. Because the desk then bought whichever side the market priced as the
 * underdog, it kept buying longshots. Those two shortcuts are removed here.
 */
export const FAT_TAIL = 1.15;
/** Extra vol multiplier used for the conservative probability that actually decides a trade. */
export const VOL_DOUBT = 1.2;
export const BASIS_BP = 2;
const SEC_PER_YEAR = 365.25 * 24 * 3600;

export interface CloserRead {
  /** model P(finish above the open) */
  p: number;
  /** same, with vol inflated by VOL_DOUBT: what trades are judged on */
  pCons: number;
  z: number;
  /** 1-sd move expected over the time left, in dollars */
  sigma: number;
  secLeft: number;
}

/** `staleMs` = how old the BTC print is. The real price has moved since; the model widens its error bars for it. */
export function closerRead(openSpot: number, spot: number, endAt: number, now: number, annualVol: number | null, staleMs: number): CloserRead {
  const secLeft = Math.max(0, (endAt - now) / 1000);
  const perSec = (annualVol ?? PRIOR_ANNUAL_VOL) / Math.sqrt(SEC_PER_YEAR);
  const stale = Math.max(500, staleMs) / 1000;
  const basis = (BASIS_BP / 10_000) * Math.SQRT2;
  const varFrac = (perSec * FAT_TAIL) ** 2 * (secLeft + stale) + basis ** 2;
  const sigma = Math.sqrt(varFrac) * spot;
  const z = sigma > 0 ? (spot - openSpot) / sigma : 0;
  const p = clamp(normalCdf(z), 0.005, 0.995);
  const zc = z / VOL_DOUBT;
  const pCons = clamp(normalCdf(zc), 0.005, 0.995);
  return { p, pCons, z, sigma, secLeft };
}

/** Where in the window the closer strategy is allowed to act: the last stretch, once the outcome is largely decided. */
export const CLOSER = {
  /** zone = last 40% of the window, never shorter than 60s and never longer than 20 minutes */
  zoneFraction: 0.4,
  zoneMinMs: 60_000,
  zoneMaxMs: 20 * 60_000,
  minZ: 1.0,
  minEdge: 0.02,
  priceLo: 0.55,
  priceHi: 0.97,
  maxEdge: 0.15,
};

export function yesProbability(market: Market, spot: number, now: number, annualVol: number | null = null, staleMs = 6000) {
  const isUpDown = /up or down/i.test(market.question);
  if (market.kind !== "sim-window" && isUpDown && market.openSpot) {
    const r = closerRead(market.openSpot, spot, market.endAt, now, annualVol, staleMs);
    return { p: r.p, uncertainty: clamp(Math.abs(r.p - r.pCons) + 0.01, 0.01, 0.2), sigma: r.sigma };
  }
  return legacyYesProbability(market, spot, now, annualVol);
}

/** Max probability shift context may apply, and only on markets with at least 4h to run. */
export const MAX_CTX_TILT = 0.02;

export function contextAdjusted(market: Market, p: number, now: number, ctx: ContextSnapshot | null | undefined) {
  if (!ctx || ctx.tilt === 0) return p;
  const hours = (market.endAt - now) / 3_600_000;
  if (hours < 4) return p;
  // Only "above X" style markets lean with risk appetite; "less than" flips sign.
  const q = market.question.toLowerCase();
  const bearish = q.includes("less than") || q.includes("below") || q.includes("dip");
  const dir = bearish ? -1 : 1;
  return clamp(p + dir * clamp(ctx.tilt, -1, 1) * MAX_CTX_TILT, 0.005, 0.995);
}

export function parseStrikes(question: string) {
  const nums = [...question.matchAll(/\$([0-9][0-9,]*)/g)].map((m) =>
    Number(m[1].replace(/,/g, "")),
  );
  const q = question.toLowerCase();
  if (q.includes("between") && nums.length >= 2 && nums[0] < nums[1]) {
    return { low: nums[0], high: nums[1], ok: true };
  }
  if (q.includes("less than") && nums[0]) return { low: null, high: nums[0], ok: true };
  if ((q.includes("greater than") || q.includes("or more")) && nums[0]) {
    return { low: nums[0], high: null, ok: true };
  }
  return { low: null, high: null, ok: false };
}

export function yesWins(market: Market, spot: number) {
  if (market.kind === "sim-window") return spot > (market.openSpot ?? spot);
  if (market.strikeLow != null && spot <= market.strikeLow) return false;
  if (market.strikeHigh != null && spot >= market.strikeHigh) return false;
  if (market.strikeLow == null && market.strikeHigh == null) return false;
  return true;
}

const SIM_SPECS = [
  { label: "5m", ms: 5 * 60_000, bias: -0.07 },
  { label: "15m", ms: 15 * 60_000, bias: 0.065 },
  { label: "1h", ms: 60 * 60_000, bias: -0.05 },
];

export function makeSimWindow(label: string, ms: number, bias: number, now: number, spot: number): Market {
  const mid = clamp(0.5 + bias, 0.2, 0.8);
  const half = 0.01;
  return {
    id: `sim-${label}-${now}`,
    kind: "sim-window",
    question: `Sim ${label} · BTC above ${spot.toLocaleString("en-US", { maximumFractionDigits: 2 })} at expiry?`,
    outcomes: ["Up", "Down"],
    status: "open",
    startAt: now,
    endAt: now + ms,
    strikeLow: spot,
    strikeHigh: null,
    openSpot: spot,
    resolution:
      "Simulated short-duration contract. Resolves Up if the desk BTC reference at expiry is above the open captured when this window was created. Not an official Polymarket market and not a Binance candle.",
    sourceUrl: null,
    metadataOk: true,
    restricted: false,
    yesBid: mid - half,
    yesAsk: mid + half,
    liquidity: 22_000,
    volume: 0,
    updatedAt: now,
    source: "Helios sim tape",
    group: label,
    yesTokenId: null,
    noTokenId: null,
    conditionId: null,
    gammaId: null,
  };
}

export function ensureSimMarkets(markets: Market[], now: number, spot: number) {
  const open = markets.filter((m) => m.status === "open" && m.endAt > now);
  for (const spec of SIM_SPECS) {
    if (!open.some((m) => m.group === spec.label)) {
      open.push(makeSimWindow(spec.label, spec.ms, spec.bias, now, spot));
    }
  }
  return open;
}

export function stepSpot(spot: number, rand: () => number) {
  const shock = (rand() - 0.5) * 0.00008;
  return Math.max(1000, spot * (1 + shock));
}

export function stepSimQuote(market: Market, spot: number, now: number, rand: () => number): Market {
  const { p } = yesProbability(market, spot, now);
  const mid = (market.yesBid + market.yesAsk) / 2;
  const noise = (rand() - 0.5) * 0.004;
  const next = clamp(mid + (p - mid) * 0.02 + noise, 0.05, 0.95);
  const half = 0.009;
  return {
    ...market,
    yesBid: clamp(next - half, 0.02, 0.97),
    yesAsk: clamp(next + half, 0.03, 0.98),
    updatedAt: now,
  };
}

export function evaluateLegacy(
  market: Market,
  spot: number,
  now: number,
  risk: RiskConfig,
  cash: number,
  exposure: number,
  ordersLastHour: number,
  killed: boolean,
  circuit: string | null,
  extra: EvalExtra = {},
): Opportunity {
  const blocks: string[] = [];
  if (killed) blocks.push("Kill switch is on");
  if (circuit) blocks.push(circuit);
  if (!market.metadataOk) {
    blocks.push(
      /up or down/i.test(market.question) && market.openSpot == null
        ? "Waiting for the window-open BTC price (Coinbase candle not loaded yet)"
        : "Resolution metadata is missing or ambiguous",
    );
  }
  if (market.restricted) blocks.push("Eligibility cannot be verified");
  if (market.status !== "open") blocks.push("Market is not open");
  if (now - market.updatedAt > risk.freshnessMs) blocks.push("Market data is stale");
  if (market.endAt - now < 20_000) blocks.push("Inside the no-trade buffer before expiry");
  const spread = market.yesAsk - market.yesBid;
  if (spread > risk.maxSpread) blocks.push("Spread is wider than the limit");
  if (market.liquidity < risk.minLiquidity) blocks.push("Liquidity is below the floor");
  if (ordersLastHour >= risk.maxOrdersPerHour) blocks.push("Order count for this hour is at the cap");
  if (exposure >= risk.maxExposure) blocks.push("Open exposure is at the cap");

  const base = legacyYesProbability(market, spot, now, extra.vol ?? null);
  const uncertainty = base.uncertainty;
  const pCtx = contextAdjusted(market, base.p, now, extra.context);
  // never trade the raw model: pull it toward the market by the learned trust weight
  const midForBlend = (market.yesBid + market.yesAsk) / 2;
  const w = clamp(extra.blendW ?? 0.5, 0, 1);
  const p = market.kind === "sim-window" ? pCtx : clamp(midForBlend + w * (pCtx - midForBlend), 0.01, 0.99);
  if (extra.context?.blockReason) blocks.push(extra.context.blockReason);
  const hair = uncertainty * risk.uncertaintyHaircut;
  const yesPx = clamp(market.yesAsk + risk.slippage, 0.01, 0.99);
  const noPx = clamp(1 - market.yesBid + risk.slippage, 0.01, 0.99);
  const evYes = p - hair - yesPx - feePerShare(yesPx, risk);
  const evNo = 1 - p - hair - noPx - feePerShare(noPx, risk);
  const side: Side = evYes >= evNo ? "yes" : "no";
  const executablePrice = side === "yes" ? yesPx : noPx;
  const edge = side === "yes" ? evYes : evNo;
  const modelForSide = side === "yes" ? p : 1 - p;

  const real = market.kind !== "sim-window";
  if (real && extra.coolOff) blocks.push(extra.coolOff);
  const midYes = (market.yesBid + market.yesAsk) / 2;
  if (market.kind !== "sim-window" && Math.abs(pCtx - midYes) > 0.25) {
    blocks.push(`Model (${Math.round(pCtx * 100)}%) and market (${Math.round(midYes * 100)}%) disagree by over 25 points: treated as a data problem, not an edge`);
  }
  if (real && edge > MAX_BELIEVABLE_EDGE) {
    blocks.push(`Net edge ${edge.toFixed(3)} is above ${MAX_BELIEVABLE_EDGE}: against an efficient market that is more likely a model error than a real edge`);
  }
  if (real && /up or down/i.test(market.question)) {
    const len = market.endAt - market.startAt;
    const wait = Math.max(ENTRY_DELAY_MS, len * ENTRY_FRACTION);
    if (now - market.startAt < wait) {
      blocks.push(`Too early in the window: waiting ${Math.round(wait / 1000)}s so the price has moved enough to say something`);
    }
  }
  if (edge < risk.minEdge) {
    blocks.push(`Net edge ${edge.toFixed(3)} is below the minimum ${risk.minEdge.toFixed(3)}`);
  }

  // Real results: buying cheap longshots lost money (the market was right far more often than the model), so real markets use a tighter band.
  const lo = real ? 0.22 : 0.08;
  const hi = real ? 0.88 : 0.92;
  if (executablePrice < lo || executablePrice > hi) {
    blocks.push(`Executable price is outside the ${Math.round(lo * 100)}¢–${Math.round(hi * 100)}¢ band`);
  }
  const scale = clamp(extra.context?.stakeScale ?? 1, 0, 1);
  // size with conviction: a thin edge gets a quarter of the cap, a 10-point edge gets all of it
  const edgeScale = clamp(edge / 0.06, 0.25, 1);
  // bet less while the model has not proven itself: full size only once its learned trust is high
  const trustScale = real ? clamp(0.3 + w, 0.3, 1) : 1;
  const stake = Math.min(risk.maxStake * scale * edgeScale * trustScale, Math.max(0, cash));
  if (stake < Math.min(1, risk.maxStake)) blocks.push("Paper balance is below the minimum stake");
  const unitCost = executablePrice + feePerShare(executablePrice, risk);
  const shares = stake > 0 ? stake / unitCost : 0;
  const debit = shares * unitCost;
  if (debit > 0 && exposure + debit > risk.maxExposure) {
    blocks.push("This stake would breach open exposure");
  }

  const outcome = side === "yes" ? market.outcomes[0] : market.outcomes[1];
  const rationale = [
    `Baseline ${MODEL_VERSION} puts Yes at ${(p * 100).toFixed(1)}% with ±${(uncertainty * 100).toFixed(1)} pts of uncertainty.`,
    `Tradable ${outcome} touch is ${Math.round(executablePrice * 1000) / 10}¢ after slippage. Haircut and fees leave net edge ${edge.toFixed(3)} per share.`,
    market.kind === "sim-window"
      ? "Short window is simulated so fills and expiry can be rehearsed without touching an exchange."
      : "Live contract prices come from Polymarket's public market data. Orders from this desk stay on paper.",
  ];
  const risks = [
    "The baseline can be wrong. A printed edge is not a forecast of profit.",
    `About ${Math.max(0, Math.round((market.endAt - now) / 60000))} minutes remain. Short windows move fast.`,
    `Spread ${(spread * 100).toFixed(1)}¢ · liquidity ${Math.round(market.liquidity).toLocaleString("en-US")}.`,
  ];

  return {
    probability: modelForSide,
    yesProbability: p,
    pYesBase: base.p,
    pYesAlt: momentumProbability(base.p, extra.spots ?? [], spot, extra.vol ?? null, extra.spotDtMs ?? 6000),
    marketMid: (market.yesBid + market.yesAsk) / 2,
    uncertainty,
    side,
    executablePrice,
    stake,
    shares,
    debit,
    expectedValue: edge,
    edge,
    rationale,
    risks,
    hardFail: blocks[0] ?? null,
  };
}

export interface EvalExtra {
  vol?: number | null;
  context?: ContextSnapshot | null;
  spots?: number[];
  /** seconds between the samples in `spots` (the volatility cadence) */
  spotDtMs?: number;
  /** age of the BTC print being traded on; defaults to spotDtMs */
  staleMs?: number;
  blendW?: number;
  coolOff?: string | null;
  /** "closer" (default, helios-btc-0.6) or "legacy" (helios-btc-0.5, kept for comparison in the strategy lab) */
  strategy?: "legacy" | "closer";
}

/**
 * Entry point used by the desk. Real Up/Down windows go to the closer strategy. Practice windows and any other
 * contract keep the original logic, because the closer model is only defined for "finish above the open" markets.
 */
export function evaluateOpportunity(
  market: Market,
  spot: number,
  now: number,
  risk: RiskConfig,
  cash: number,
  exposure: number,
  ordersLastHour: number,
  killed: boolean,
  circuit: string | null,
  extra: EvalExtra = {},
): Opportunity {
  const closer = extra.strategy !== "legacy" && market.kind !== "sim-window" && /up or down/i.test(market.question);
  return closer
    ? evaluateCloser(market, spot, now, risk, cash, exposure, ordersLastHour, killed, circuit, extra)
    : evaluateLegacy(market, spot, now, risk, cash, exposure, ordersLastHour, killed, circuit, extra);
}

/**
 * helios-btc-0.6: trade only the last stretch of a window, only the side the model says is clearly ahead,
 * only when that beats the market's price by more than every cost. Otherwise do nothing.
 */
export function evaluateCloser(
  market: Market,
  spot: number,
  now: number,
  risk: RiskConfig,
  cash: number,
  exposure: number,
  ordersLastHour: number,
  killed: boolean,
  circuit: string | null,
  extra: EvalExtra = {},
): Opportunity {
  const blocks: string[] = [];
  if (killed) blocks.push("Kill switch is on");
  if (circuit) blocks.push(circuit);
  if (!market.metadataOk) {
    blocks.push(market.openSpot == null ? "Waiting for the window-open BTC price (Coinbase candle not loaded yet)" : "Resolution metadata is missing or ambiguous");
  }
  if (market.restricted) blocks.push("Eligibility cannot be verified");
  if (market.status !== "open") blocks.push("Market is not open");
  if (now - market.updatedAt > risk.freshnessMs) blocks.push("Market data is stale");
  if (market.endAt - now < 20_000) blocks.push("Inside the no-trade buffer before expiry");
  const spread = market.yesAsk - market.yesBid;
  if (spread > risk.maxSpread) blocks.push("Spread is wider than the limit");
  if (market.liquidity < risk.minLiquidity) blocks.push("Liquidity is below the floor");
  if (ordersLastHour >= risk.maxOrdersPerHour) blocks.push("Order count for this hour is at the cap");
  if (exposure >= risk.maxExposure) blocks.push("Open exposure is at the cap");
  if (extra.context?.blockReason) blocks.push(extra.context.blockReason);
  if (extra.coolOff) blocks.push(extra.coolOff);

  const mid = (market.yesBid + market.yesAsk) / 2;
  const read = market.openSpot
    ? closerRead(market.openSpot, spot, market.endAt, now, extra.vol ?? null, extra.staleMs ?? extra.spotDtMs ?? 6000)
    : { p: 0.5, pCons: 0.5, z: 0, sigma: 0, secLeft: Math.max(0, (market.endAt - now) / 1000) };
  // judge on the conservative probability, then pull toward the market by the learned trust weight
  const w = clamp(extra.blendW ?? 0.5, 0, 1);
  const p = clamp(mid + w * (read.pCons - mid), 0.01, 0.99);
  const yesPx = clamp(market.yesAsk + risk.slippage, 0.01, 0.99);
  const noPx = clamp(1 - market.yesBid + risk.slippage, 0.01, 0.99);
  const evYes = p - yesPx - feePerShare(yesPx, risk);
  const evNo = 1 - p - noPx - feePerShare(noPx, risk);
  // the side is the one the model says is ahead, never the market's underdog
  const side: Side = read.z >= 0 ? "yes" : "no";
  const executablePrice = side === "yes" ? yesPx : noPx;
  const edge = side === "yes" ? evYes : evNo;
  const modelForSide = side === "yes" ? p : 1 - p;
  const unitCost = executablePrice + feePerShare(executablePrice, risk);

  if (Math.abs(read.p - mid) > 0.25) {
    blocks.push(`Model (${Math.round(read.p * 100)}%) and market (${Math.round(mid * 100)}%) disagree by over 25 points: treated as a data problem, not an edge`);
  }
  const len = market.endAt - market.startAt;
  const zone = clamp(len * CLOSER.zoneFraction, CLOSER.zoneMinMs, CLOSER.zoneMaxMs);
  const left = market.endAt - now;
  if (left > zone) {
    blocks.push(`Too early: this strategy only acts in the last ${Math.round(zone / 1000)}s of a window, when the outcome is largely decided`);
  }
  if (Math.abs(read.z) < CLOSER.minZ) {
    blocks.push(`Not decided yet: BTC is ${Math.abs(read.z).toFixed(2)} standard deviations from the open, and this strategy needs ${CLOSER.minZ.toFixed(1)}`);
  }
  const needEdge = Math.max(risk.minEdge, CLOSER.minEdge);
  if (edge > CLOSER.maxEdge) {
    blocks.push(`Net edge ${edge.toFixed(3)} is above ${CLOSER.maxEdge}: more likely a data problem than a real edge`);
  }
  if (edge < needEdge) blocks.push(`Net edge ${edge.toFixed(3)} is below the minimum ${needEdge.toFixed(3)}`);
  if (executablePrice < CLOSER.priceLo || executablePrice > CLOSER.priceHi) {
    blocks.push(`Executable price is outside the ${Math.round(CLOSER.priceLo * 100)}¢–${Math.round(CLOSER.priceHi * 100)}¢ band (favourites only)`);
  }

  const scale = clamp(extra.context?.stakeScale ?? 1, 0, 1);
  const edgeScale = clamp(edge / 0.06, 0.25, 1);
  const trustScale = clamp(0.3 + w, 0.3, 1);
  const stake = Math.min(risk.maxStake * scale * edgeScale * trustScale, Math.max(0, cash));
  if (stake < Math.min(1, risk.maxStake)) blocks.push("Paper balance is below the minimum stake");
  const shares = stake > 0 ? stake / unitCost : 0;
  const debit = shares * unitCost;
  if (debit > 0 && exposure + debit > risk.maxExposure) blocks.push("This stake would breach open exposure");

  const outcome = side === "yes" ? market.outcomes[0] : market.outcomes[1];
  const dollars = Math.abs(spot - (market.openSpot ?? spot));
  const rationale = [
    `${Math.round(read.secLeft)}s left. BTC is $${dollars.toFixed(0)} ${spot >= (market.openSpot ?? spot) ? "above" : "below"} the open, ${Math.abs(read.z).toFixed(2)} standard deviations (1 sd = $${read.sigma.toFixed(0)} over the time left).`,
    `${MODEL_VERSION} puts ${outcome} at ${(modelForSide * 100).toFixed(1)}% after widening for fat tails and trusting it ${Math.round(w * 100)}% against the market (market mid ${(side === "yes" ? mid : 1 - mid).toFixed(2)}).`,
    `Buying ${outcome} at ${Math.round(executablePrice * 1000) / 10}¢ after slippage. Fee and slippage leave net edge ${edge.toFixed(3)} per share.`,
  ];
  const risks = [
    `A loss costs the whole stake (about ${Math.round(executablePrice * 100)}¢ per share) against a ${Math.round((1 - executablePrice) * 100)}¢ gain. Win rate must stay above ${(unitCost * 100).toFixed(0)}% to profit.`,
    "A late jump in BTC, or a difference between Coinbase and Polymarket's price source at the close, can flip a decided window.",
    `Spread ${(spread * 100).toFixed(1)}¢ · liquidity ${Math.round(market.liquidity).toLocaleString("en-US")}.`,
  ];

  return {
    probability: modelForSide,
    yesProbability: p,
    pYesBase: read.p,
    pYesAlt: momentumProbability(read.p, extra.spots ?? [], spot, extra.vol ?? null, extra.spotDtMs ?? 6000),
    marketMid: mid,
    uncertainty: clamp(Math.abs(read.p - read.pCons) + 0.01, 0.01, 0.2),
    side,
    executablePrice,
    stake,
    shares,
    debit,
    expectedValue: edge,
    edge,
    rationale,
    risks,
    hardFail: blocks[0] ?? null,
  };
}

export function circuitMessage(kind: "daily" | "drawdown" | "reconcile") {
  if (kind === "daily") return "Daily loss limit reached — new paper orders are paused";
  if (kind === "drawdown") return "Drawdown circuit breaker — new paper orders are paused";
  return "Reconciliation mismatch — new paper orders are paused until you clear it";
}

export function runBacktest(risk: RiskConfig, seed = 20261011): BacktestReport {
  const rand = mulberry32(seed);
  const plan: Array<{ name: BacktestPeriod["name"]; n: number }> = [
    { name: "train", n: 48 },
    { name: "validation", n: 24 },
    { name: "test", n: 48 },
  ];
  let equity = STARTING_CASH;
  const periods: BacktestPeriod[] = plan.map((period) => {
    let peak = equity;
    let maxDd = 0;
    let wins = 0;
    let losses = 0;
    let rejected = 0;
    let grossWin = 0;
    let grossLoss = 0;
    let fees = 0;
    let winSum = 0;
    let lossSum = 0;
    const curve: EquityPoint[] = [{ t: 0, equity }];
    const sample: BacktestTrade[] = [];
    for (let i = 0; i < period.n; i += 1) {
      const quote = clamp(0.5 + (rand() - 0.5) * 0.16, 0.12, 0.88);
      const price = clamp(quote + risk.slippage, 0.08, 0.92);
      const uncertainty = 0.045;
      const fair = 0.5;
      const edge = fair - uncertainty * risk.uncertaintyHaircut - price - feePerShare(price, risk);
      const z = randn(rand);
      const won = z > 0;
      if (edge < risk.minEdge) {
        rejected += 1;
        if (sample.length < 8) sample.push({ price, won, pnl: 0, rejected: true });
      } else {
        const stake = Math.min(risk.maxStake, equity * 0.04);
        const shares = stake / (price + feePerShare(price, risk));
        const fee = shares * feePerShare(price, risk);
        const pnl = shares * (won ? 1 : 0) - shares * price - fee;
        equity += pnl;
        fees += fee;
        if (pnl >= 0) {
          wins += 1;
          grossWin += pnl;
          winSum += pnl;
        } else {
          losses += 1;
          grossLoss += -pnl;
          lossSum += pnl;
        }
        if (sample.length < 8) sample.push({ price, won, pnl, rejected: false });
      }
      peak = Math.max(peak, equity);
      maxDd = Math.max(maxDd, peak - equity);
      if (i % 2 === 0) curve.push({ t: i + 1, equity: Math.round(equity * 100) / 100 });
    }
    curve.push({ t: period.n, equity: Math.round(equity * 100) / 100 });
    const trades = wins + losses;
    return {
      name: period.name,
      trades,
      wins,
      losses,
      rejected,
      netPnl: equity - (curve[0]?.equity ?? equity),
      fees,
      profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 0 : 0,
      expectancy: trades ? (grossWin - grossLoss) / trades : 0,
      maxDrawdown: maxDd,
      winRate: trades ? wins / trades : 0,
      avgWin: wins ? winSum / wins : 0,
      avgLoss: losses ? lossSum / losses : 0,
      curve,
      sample,
    };
  });

  // Net P&L per period should be the change inside that period, not from the global start.
  let cursor = STARTING_CASH;
  for (const period of periods) {
    const end = period.curve[period.curve.length - 1]?.equity ?? cursor;
    period.netPnl = end - cursor;
    cursor = end;
  }

  return {
    periods,
    modelVersion: MODEL_VERSION,
    ranAt: Date.now(),
    assumptions: [
      "Time-ordered synthetic 5-minute windows. The decision never sees the settlement coin-flip.",
      "Fair probability is 0.50 at the open. Quotes are noise around that fair value, so most 'edge' is false.",
      `Costs use your current settings: Polymarket taker fee ${(feePerShare(0.5, risk) * 100).toFixed(2)}¢ per share at 50¢ and slippage ${(risk.slippage * 100).toFixed(2)}¢, plus the uncertainty haircut.`,
      "Train, validation, and test are chronological slices of one path. They are not a live track record.",
      "A pretty curve would be a bug in the story. This baseline is here to reject the idea of a promised win rate.",
    ],
  };
}
