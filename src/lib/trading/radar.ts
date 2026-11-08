/**
 * The watch-list: for every open window, where it stands against the strategy's gates right now.
 * It calls the same evaluator the worker trades with, so what the screen says is what the engine would do.
 */
import { CLOSER, LOSS_Z_STEP, clamp, closerRead, evaluateOpportunity } from "./engine.ts";
import { classifyBlock, type BlockKind } from "./blocks.ts";
import type { FeedGuard, Market, RiskConfig, Side } from "./types.ts";

export type RadarStage = "early" | "forming" | "ready" | "blocked" | "watch";

export interface RadarRow {
  id: string;
  group: string;
  question: string;
  endAt: number;
  secLeft: number;
  stage: RadarStage;
  side: Side | null;
  /** distance of BTC from the window's open, in standard deviations of the time left (signed: + is Up) */
  z: number;
  needZ: number;
  /** seconds until the strategy is allowed to act (0 once inside its zone) */
  toZoneSec: number;
  zoneSec: number;
  /** BTC dollars above (+) or below (-) the window's open */
  gap: number | null;
  bid: number;
  ask: number;
  mid: number;
  /** model chance that Up wins (after the conservative haircut and blend) */
  pModel: number;
  edge: number;
  needEdge: number;
  price: number;
  stake: number;
  reason: string | null;
  kind: BlockKind | null;
}

export interface RadarInput {
  spot: number;
  now: number;
  risk: RiskConfig;
  vol: number | null;
  blendW: number;
  staleMs: number;
  feed?: FeedGuard | null;
  lossStreak?: number;
  killed: boolean;
  circuit: string | null;
  cash: number;
  exposure: number;
  ordersLastHour: number;
  coolOff?: string | null;
}

export function radarRow(m: Market, x: RadarInput): RadarRow {
  const isUpDown = /up or down/i.test(m.question);
  const secLeft = Math.max(0, (m.endAt - x.now) / 1000);
  const len = m.endAt - m.startAt;
  const zoneSec = clamp(len * CLOSER.zoneFraction, CLOSER.zoneMinMs, CLOSER.zoneMaxMs) / 1000;
  const needZ = CLOSER.minZ + LOSS_Z_STEP * clamp(Math.round(x.lossStreak ?? 0), 0, 3);
  const mid = (m.yesBid + m.yesAsk) / 2;
  const opp = evaluateOpportunity(m, x.spot, x.now, x.risk, x.cash, x.exposure, x.ordersLastHour, x.killed, x.circuit, {
    vol: x.vol,
    blendW: x.blendW,
    staleMs: x.staleMs,
    spots: [],
    spotDtMs: 6000,
    feed: x.feed ?? null,
    lossStreak: x.lossStreak ?? 0,
    coolOff: x.coolOff ?? null,
  });
  let z = 0;
  if (isUpDown && m.openSpot) z = closerRead(m.openSpot, x.spot, m.endAt, x.now, x.vol, x.staleMs).z;
  const info = opp.hardFail ? classifyBlock(opp.hardFail) : null;
  let stage: RadarStage;
  if (!isUpDown) stage = opp.hardFail ? "watch" : "ready";
  else if (!opp.hardFail) stage = "ready";
  else if (info?.kind === "waiting") stage = secLeft > zoneSec ? "early" : "forming";
  else stage = "blocked";
  return {
    id: m.id,
    group: m.group,
    question: m.question,
    endAt: m.endAt,
    secLeft,
    stage,
    side: isUpDown ? (z >= 0 ? "yes" : "no") : opp.side,
    z,
    needZ,
    toZoneSec: Math.max(0, secLeft - zoneSec),
    zoneSec,
    gap: isUpDown && m.openSpot ? x.spot - m.openSpot : null,
    bid: m.yesBid,
    ask: m.yesAsk,
    mid,
    pModel: opp.yesProbability,
    edge: opp.edge,
    needEdge: Math.max(x.risk.minEdge, CLOSER.minEdge),
    price: opp.executablePrice,
    stake: opp.stake,
    reason: opp.hardFail,
    kind: info?.kind ?? null,
  };
}
