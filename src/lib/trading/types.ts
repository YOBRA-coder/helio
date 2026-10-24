export type ThemeId = "orchard" | "glacier" | "gilt" | "ion" | "daybook";
export type Side = "yes" | "no";
export type MarketKind = "sim-window" | "live";
export type Mode = "manual" | "auto";
export type CircuitKind = "daily" | "drawdown" | "reconcile" | null;

export interface RiskConfig {
  maxStake: number;
  maxExposure: number;
  dailyLossLimit: number;
  drawdownLimit: number;
  maxOrdersPerHour: number;
  minEdge: number;
  maxSpread: number;
  minLiquidity: number;
  /** extra flat proportional fee (usually 0) */
  feeRate: number;
  /** Polymarket crypto taker fee: per share = feeCoef × price × (1 − price). 0.07 per current Polymarket docs. */
  feeCoef: number;
  slippage: number;
  freshnessMs: number;
  cancelOnKill: boolean;
  uncertaintyHaircut: number;
}

export interface Market {
  id: string;
  kind: MarketKind;
  question: string;
  outcomes: [string, string];
  status: "open" | "closed";
  startAt: number;
  endAt: number;
  strikeLow: number | null;
  strikeHigh: number | null;
  openSpot: number | null;
  resolution: string;
  sourceUrl: string | null;
  metadataOk: boolean;
  restricted: boolean;
  yesBid: number;
  yesAsk: number;
  liquidity: number;
  volume: number;
  updatedAt: number;
  source: string;
  group: string;
  yesTokenId: string | null;
  noTokenId: string | null;
  conditionId: string | null;
  /** Polymarket gamma market id (without the `poly-` prefix) for resolution lookups. */
  gammaId: string | null;
}

export interface Signal {
  id: string;
  marketId: string;
  createdAt: number;
  expiresAt: number;
  modelVersion: string;
  probability: number;
  uncertainty: number;
  side: Side;
  executablePrice: number;
  stake: number;
  shares: number;
  debit: number;
  expectedValue: number;
  edge: number;
  rationale: string[];
  risks: string[];
  /** Base-model YES probability and the context-adjusted YES probability, for A/B scoring. */
  pYesBase: number;
  pYesCtx: number;
  /** Shadow variant (momentum). Scored against outcomes but never traded. */
  pYesAlt?: number;
  marketMid: number;
  status: "pending" | "approved" | "rejected" | "expired" | "executed" | "blocked";
  rejectedReason: string | null;
  question: string;
  kind: MarketKind;
  mode: Mode;
}

export interface Order {
  id: string;
  idempotencyKey: string;
  marketId: string;
  signalId: string;
  mode: Mode;
  venue: "paper";
  side: Side;
  limitPrice: number;
  quantity: number;
  debit: number;
  status: "open" | "filled" | "cancelled" | "rejected";
  submittedAt: number;
  updatedAt: number;
  question: string;
  kind: MarketKind;
}

export interface Fill {
  id: string;
  orderId: string;
  marketId: string;
  side: Side;
  price: number;
  quantity: number;
  fee: number;
  filledAt: number;
  question: string;
}

export interface Position {
  id: string;
  marketId: string;
  side: Side;
  quantity: number;
  averageCost: number;
  fees: number;
  status: "open" | "settled";
  question: string;
  kind: MarketKind;
  lastMark: number;
  realized: number;
  entryYesProb: number;
  settledAt: number | null;
  settleNote: string | null;
  yesWon: boolean | null;
  /** Snapshot at entry, used for calibration scoring when the position settles. */
  pYesBase: number;
  pYesCtx: number;
  pYesAlt?: number;
  entryMid: number;
  entryAt: number;
  endAt: number;
  group: string;
  edgeAtEntry: number;
  modelVersion: string;
}

export interface AuditEntry {
  id: string;
  at: number;
  actor: "owner" | "system";
  action: string;
  detail: string;
}

export interface AlertItem {
  id: string;
  at: number;
  severity: "info" | "warn" | "danger";
  title: string;
  detail: string;
  read: boolean;
}

export interface EquityPoint {
  t: number;
  equity: number;
}

export interface BacktestTrade {
  price: number;
  won: boolean;
  pnl: number;
  rejected: boolean;
}

export interface BacktestPeriod {
  name: "train" | "validation" | "test";
  trades: number;
  wins: number;
  losses: number;
  rejected: number;
  netPnl: number;
  fees: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  curve: EquityPoint[];
  sample: BacktestTrade[];
}

export interface BacktestReport {
  periods: BacktestPeriod[];
  assumptions: string[];
  modelVersion: string;
  ranAt: number;
}

export interface Opportunity {
  probability: number;
  yesProbability: number;
  pYesBase: number;
  pYesAlt: number;
  marketMid: number;
  uncertainty: number;
  side: Side;
  executablePrice: number;
  stake: number;
  shares: number;
  debit: number;
  expectedValue: number;
  edge: number;
  rationale: string[];
  risks: string[];
  hardFail: string | null;
}

/** One settled paper (or live) trade, kept for the trial report. */
export interface ScoreRow {
  id: string;
  venue: "paper" | "live";
  marketId: string;
  group: string;
  kind: MarketKind;
  side: Side;
  entryAt: number;
  settledAt: number;
  minutesToExpiry: number;
  entryPrice: number;
  quantity: number;
  fees: number;
  pnl: number;
  /** YES-side probabilities at entry. */
  pYesBase: number;
  pYesCtx: number;
  pYesAlt?: number;
  marketMid: number;
  yesWon: boolean | null;
  edgeAtEntry: number;
  official: boolean;
}

export interface ContextItem {
  label: string;
  value: string;
  source: string;
  at: number;
}

export interface ContextSnapshot {
  fetchedAt: number;
  fearGreed: number | null;
  /** -1..+1 tilt applied (bounded) to long-horizon BTC probabilities. 0 means no opinion. */
  tilt: number;
  /** 0..1 stake multiplier. 1 means no change. */
  stakeScale: number;
  blockReason: string | null;
  items: ContextItem[];
  crowd: Array<{ title: string; yes: number; volume: number; url: string | null; source: string }>;
  worldMonitor: { status: "off" | "ok" | "error"; detail: string; at: number };
}

export type VenueStatus = "off" | "dry" | "armed";

export interface LiveOrder {
  id: string;
  clientKey: string;
  exchangeId: string | null;
  marketId: string;
  tokenId: string;
  side: Side;
  price: number;
  size: number;
  debit: number;
  status: "dry" | "open" | "filled" | "cancelled" | "rejected" | "error";
  submittedAt: number;
  updatedAt: number;
  question: string;
  note: string;
  signalId: string;
  filledSize?: number;
  settled?: boolean;
  pnl?: number;
}

export interface LiveBook {
  status: VenueStatus;
  /** Owner must retype this phrase to arm. */
  armedAt: number | null;
  auto: boolean;
  maxStake: number;
  maxExposure: number;
  dailyLossLimit: number;
  orders: LiveOrder[];
  realized: number;
  dayKey: string;
  dayRealized: number;
  lastReconcileAt: number | null;
  lastReconcileOk: boolean | null;
  lastError: string | null;
  exchangeCash: number | null;
}

export interface BlendState {
  w: number;
  n: number;
  brierModel: number | null;
  brierMarket: number | null;
  brierBlend: number | null;
  at: number;
}

export interface DeskCore {
  risk: RiskConfig;
  /** learned trust in the model versus the market price */
  blend: BlendState;
  mode: Mode;
  killed: boolean;
  cash: number;
  simMarkets: Market[];
  liveMarkets: Market[];
  signals: Signal[];
  orders: Order[];
  fills: Fill[];
  positions: Position[];
  alerts: AlertItem[];
  audit: AuditEntry[];
  curve: EquityPoint[];
  dayKey: string;
  dayStartEquity: number;
  peakEquity: number;
  circuitKind: CircuitKind;
  reconcileNote: string;
  spot: number;
  spotSource: string;
  spots: number[];
  spotDtMs: number;
  tickCount: number;
  scores: ScoreRow[];
  /** Per open market: [time, yes mid, model P(yes)] for charts. */
  hist: Record<string, Array<[number, number, number]>>;
  context: ContextSnapshot | null;
  trialStartedAt: number;
  live: LiveBook;
}

export interface TickCtx {
  now: number;
  spot: number | null;
  spotSource?: string;
  /** true when `spot` is a new print since the last tick (keeps the vol sample honest). */
  spotFresh?: boolean;
  spotDtMs?: number;
  /** gammaId -> YES won (true/false), only for markets the venue says are resolved. */
  resolutions?: Record<string, boolean>;
  context?: ContextSnapshot | null;
  /** false = real markets only (no practice windows). Defaults to true. */
  sim?: boolean;
}

export type DeskCommand =
  | { type: "approve"; signalId: string }
  | { type: "reject"; signalId: string }
  | { type: "setMode"; mode: Mode }
  | { type: "setKilled"; on: boolean }
  | { type: "updateRisk"; risk: Partial<RiskConfig> }
  | { type: "flatten"; positionId: string }
  | { type: "simulateMismatch" }
  | { type: "clearMismatch" }
  | { type: "markAlertsRead" }
  | { type: "resetTrial" }
  | { type: "liveSetStatus"; status: VenueStatus; confirm?: string }
  | { type: "liveUpdate"; auto?: boolean; maxStake?: number; maxExposure?: number; dailyLossLimit?: number }
  | { type: "liveSend"; signalId: string };
