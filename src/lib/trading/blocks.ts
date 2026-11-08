/**
 * Why a signal did not become a trade, sorted by what it means for you.
 *
 * Most "blocked" lines are not rejections at all: the closer strategy only acts late in a window, once BTC is clearly
 * on one side, so for most of a window the honest answer is "not yet". Those are `waiting`, and they are shown as a
 * live watch-list instead of piling up in the blocked log. What is left in the log is what deserves a look.
 */
export type BlockKind = "waiting" | "quality" | "data" | "guard" | "risk" | "stop";

export interface BlockInfo {
  kind: BlockKind;
  /** short bucket name for headings */
  label: string;
  /** what it means and what, if anything, to do */
  hint: string;
}

const KINDS: Record<BlockKind, Omit<BlockInfo, "kind">> = {
  waiting: { label: "Waiting for a setup", hint: "Normal. The strategy acts late in a window, once BTC is clearly on one side. Nothing to fix." },
  quality: { label: "Not worth it", hint: "A setup formed, but the market already priced it or the costs ate the edge. The filter is doing its job." },
  data: { label: "Data check", hint: "The inputs looked unreliable (stale book, missing open price, model far from market). Fixed by faster feeds, not by looser limits." },
  guard: { label: "Loss guard", hint: "A late-move or price-disagreement guard stepped in. These exist to avoid the trades that flip at the last second." },
  risk: { label: "Your limits", hint: "A limit you set is full (orders per hour, exposure, balance). Raising it allows more trades and more risk." },
  stop: { label: "Stopped", hint: "A stop is holding all new orders: the kill switch, a circuit breaker, or the loss-streak cool-off." },
};

export function classifyBlock(reason: string | null | undefined): BlockInfo {
  const r = reason ?? "";
  let kind: BlockKind;
  if (/^(Too early|Not decided yet)|no-trade buffer/i.test(r)) kind = "waiting";
  else if (/Kill switch|Daily loss limit|Drawdown|Reconciliation|Cooling off/i.test(r)) kind = "stop";
  else if (/snapping back|Exchanges disagree/i.test(r)) kind = "guard";
  else if (/window-open BTC price|stale|disagree by over|metadata|Eligibility|not open|data problem/i.test(r)) kind = "data";
  else if (/Order count|exposure|Paper balance/i.test(r)) kind = "risk";
  else kind = "quality";
  return { kind, ...KINDS[kind] };
}

/** Collapse the numbers so "BTC is 0.42 sd" and "BTC is 0.51 sd" count as one reason. */
export const reasonKey = (reason: string) => reason.replace(/-?\$?\d+(\.\d+)?/g, "#");

export interface BlockSummary {
  total: number;
  byKind: Record<BlockKind, number>;
  top: Array<{ key: string; sample: string; n: number; kind: BlockKind }>;
}

export function summarizeBlocks(reasons: Array<string | null | undefined>): BlockSummary {
  const byKind: Record<BlockKind, number> = { waiting: 0, quality: 0, data: 0, guard: 0, risk: 0, stop: 0 };
  const map = new Map<string, { sample: string; n: number; kind: BlockKind }>();
  let total = 0;
  for (const r of reasons) {
    if (!r) continue;
    total += 1;
    const { kind } = classifyBlock(r);
    byKind[kind] += 1;
    const key = reasonKey(r);
    const hit = map.get(key);
    if (hit) hit.n += 1;
    else map.set(key, { sample: r, n: 1, kind });
  }
  const top = [...map.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.n - a.n);
  return { total, byKind, top };
}
