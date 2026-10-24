/**
 * How much to trust the model against the market price.
 *
 * The market price already contains a lot of information (other venues, order flow, people watching the same feed),
 * so the desk never uses the raw model probability. It uses  market + w × (model − market),  and learns w from its
 * own settled trades: w is the value that would have scored best (lowest Brier) on real Polymarket windows.
 * If the model carries no information beyond the market, w falls toward 0 and edges disappear on their own.
 */
import type { BlendState, ScoreRow } from "./types.ts";

export const BLEND_PRIOR = 0.5;
export const BLEND_MIN_ROWS = 40;

export const defaultBlend = (): BlendState => ({ w: BLEND_PRIOR, n: 0, brierModel: null, brierMarket: null, brierBlend: null, at: 0 });

export function fitBlend(scores: ScoreRow[], now: number): BlendState {
  const rows = scores.filter((r) => r.kind === "live" && r.official && r.yesWon != null && Number.isFinite(r.pYesBase) && Number.isFinite(r.marketMid));
  const n = rows.length;
  if (n < BLEND_MIN_ROWS) return { ...defaultBlend(), n, at: now };
  const brier = (w: number) => rows.reduce((a, r) => a + (r.marketMid + w * (r.pYesBase - r.marketMid) - (r.yesWon ? 1 : 0)) ** 2, 0) / n;
  let bestW = 0;
  let best = Infinity;
  for (let i = 0; i <= 20; i += 1) {
    const w = i / 20;
    const b = brier(w);
    if (b < best) {
      best = b;
      bestW = w;
    }
  }
  // lean on the prior while the sample is small
  const w = (n * bestW + BLEND_MIN_ROWS * BLEND_PRIOR) / (n + BLEND_MIN_ROWS);
  return { w: Math.min(1, Math.max(0, w)), n, brierModel: brier(1), brierMarket: brier(0), brierBlend: brier(w), at: now };
}
