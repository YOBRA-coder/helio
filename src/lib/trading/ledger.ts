/**
 * The desk ledger: a pure, framework-free state machine.
 *
 * Both the headless server worker (24/7 paper trial) and the in-browser fallback
 * run exactly this code, so what you see in a one-minute preview is what the
 * week-long trial does. Nothing here touches the network, the clock, or storage;
 * callers pass `now` and any market data in.
 */
import {
  APPROVAL_MS,
  circuitMessage,
  DEFAULT_RISK,
  DRIFT_LIMIT,
  ensureSimMarkets,
  evaluateOpportunity,
  MODEL_VERSION,
  parseStrikes,
  realizedVol,
  yesProbability,
  STARTING_CASH,
  yesWins,
} from "./engine.ts";
import type { TapePayload } from "./tape-fetch.ts";
import type {
  AlertItem,
  AuditEntry,
  DeskCommand,
  DeskCore,
  Fill,
  LiveBook,
  Market,
  Mode,
  Order,
  Position,
  RiskConfig,
  ScoreRow,
  Signal,
  TickCtx,
} from "./types.ts";

export const ORDER_TTL_MS = 90_000;
export const MAX_SCORES = 5000;

let seq = 0;
export function uid(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

const alertMemo = new Map<string, number>();

export function withAlert(list: AlertItem[], item: AlertItem, key: string, cooldown = 60_000) {
  const prev = alertMemo.get(key) ?? 0;
  if (item.at - prev < cooldown) return list;
  alertMemo.set(key, item.at);
  return [item, ...list].slice(0, 40);
}

export function withAudit(list: AuditEntry[], entry: AuditEntry) {
  return [entry, ...list].slice(0, 300);
}

function alert(now: number, severity: AlertItem["severity"], title: string, detail: string): AlertItem {
  return { id: uid("alert"), at: now, severity, title, detail, read: false };
}

export function defaultLiveBook(): LiveBook {
  return {
    status: "off",
    armedAt: null,
    auto: false,
    maxStake: 5,
    maxExposure: 25,
    dailyLossLimit: 10,
    orders: [],
    realized: 0,
    dayKey: "",
    dayRealized: 0,
    lastReconcileAt: null,
    lastReconcileOk: null,
    lastError: null,
    exchangeCash: null,
  };
}

export function makeCore(now = Date.now()): DeskCore {
  return {
    risk: { ...DEFAULT_RISK },
    mode: "manual",
    killed: false,
    cash: STARTING_CASH,
    simMarkets: [],
    liveMarkets: [],
    signals: [],
    orders: [],
    fills: [],
    positions: [],
    alerts: [],
    audit: [
      {
        id: uid("audit"),
        at: now,
        actor: "system",
        action: "Desk started",
        detail: "Paper mode. Auto execution is off until you enable it. No wallet or API secret is stored here.",
      },
    ],
    curve: [],
    dayKey: "",
    dayStartEquity: STARTING_CASH,
    peakEquity: STARTING_CASH,
    circuitKind: null,
    reconcileNote: "Local paper book matches the desk. No exchange account is connected.",
    spot: 0,
    spotSource: "Waiting for Coinbase",
    spots: [],
    spotDtMs: 5000,
    tickCount: 0,
    scores: [],
    hist: {},
    context: null,
    trialStartedAt: now,
    live: defaultLiveBook(),
  };
}

/** Merge persisted/unknown JSON into a valid core without trusting its shape. */
export function hydrateCore(raw: unknown, now = Date.now()): DeskCore {
  const base = makeCore(now);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<DeskCore>;
  const arr = <T>(v: T[] | undefined): T[] => (Array.isArray(v) ? v : []);
  return {
    ...base,
    ...r,
    risk: sanitizeRisk({ ...DEFAULT_RISK, ...(r.risk ?? {}) }),
    simMarkets: [],
    liveMarkets: arr(r.liveMarkets),
    signals: arr(r.signals),
    orders: arr(r.orders),
    fills: arr(r.fills),
    positions: arr(r.positions),
    alerts: arr(r.alerts),
    audit: arr(r.audit).length ? arr(r.audit) : base.audit,
    curve: arr(r.curve),
    spots: arr(r.spots),
    scores: arr(r.scores),
    hist: r.hist && typeof r.hist === "object" ? r.hist : {},
    live: { ...defaultLiveBook(), ...(r.live ?? {}), orders: arr(r.live?.orders) },
    // A restart must never silently resume live trading.
    mode: r.mode === "auto" ? "auto" : "manual",
  };
}

export function exposureOf(positions: Position[], orders: Order[]) {
  const pos = positions.filter((p) => p.status === "open").reduce((sum, p) => sum + p.quantity * p.averageCost, 0);
  const reserved = orders.filter((o) => o.status === "open").reduce((sum, o) => sum + o.debit, 0);
  return pos + reserved;
}

export function equityOf(cash: number, positions: Position[], orders: Order[]) {
  const reserved = orders.filter((o) => o.status === "open").reduce((sum, o) => sum + o.debit, 0);
  const marks = positions.filter((p) => p.status === "open").reduce((sum, p) => sum + p.quantity * p.lastMark, 0);
  return cash + reserved + marks;
}

export function findMarket(s: Pick<DeskCore, "simMarkets" | "liveMarkets">, id: string) {
  return s.simMarkets.find((m) => m.id === id) ?? s.liveMarkets.find((m) => m.id === id) ?? null;
}

export function sanitizeRisk(risk: RiskConfig): RiskConfig {
  return {
    maxStake: clampNum(risk.maxStake, 10, 1000),
    maxExposure: clampNum(risk.maxExposure, 50, 5000),
    dailyLossLimit: clampNum(risk.dailyLossLimit, 20, 2000),
    drawdownLimit: clampNum(risk.drawdownLimit, 50, 3000),
    maxOrdersPerHour: Math.round(clampNum(risk.maxOrdersPerHour, 1, 60)),
    minEdge: clampNum(risk.minEdge, 0, 0.2),
    maxSpread: clampNum(risk.maxSpread, 0.005, 0.2),
    minLiquidity: clampNum(risk.minLiquidity, 0, 100_000),
    feeRate: clampNum(risk.feeRate, 0, 0.05),
    slippage: clampNum(risk.slippage, 0, 0.05),
    freshnessMs: clampNum(risk.freshnessMs, 5_000, 120_000),
    cancelOnKill: Boolean(risk.cancelOnKill),
    uncertaintyHaircut: clampNum(risk.uncertaintyHaircut, 0, 1),
  };
}

function clampNum(n: number, lo: number, hi: number) {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

// ───────────────────────────── market intake ─────────────────────────────

export function liveToMarket(row: TapePayload["markets"][number], now: number): Market {
  const strikes = parseStrikes(row.question);
  // Polymarket often leaves the market-level description empty for the rolling Up/Down series (the rules live on the
  // series page), so a short description must not block trading. What matters is that we can compute the outcome.
  const metadataOk = strikes.ok;
  return {
    id: `poly-${row.id}`,
    kind: "live",
    question: row.question,
    outcomes: row.outcomes,
    status: row.endAt > now ? "open" : "closed",
    startAt: row.startAt || now,
    endAt: row.endAt,
    strikeLow: strikes.low,
    strikeHigh: strikes.high,
    openSpot: null,
    resolution:
      row.description.trim().length > 40
        ? row.description
        : /up or down/i.test(row.question)
          ? "Up or Down window: resolves Up if the BTC/USD price at the window end is greater than or equal to the price at the window start, per Polymarket's price source (Chainlink BTC/USD). The market page was not supplying its own rules text, so this is the standard series wording."
          : "Resolution text was not provided.",
    sourceUrl: row.eventSlug ? `https://polymarket.com/event/${row.eventSlug}` : "https://polymarket.com",
    metadataOk,
    restricted: row.restricted,
    yesBid: row.bestBid,
    yesAsk: row.bestAsk,
    liquidity: row.liquidity,
    volume: row.volume,
    updatedAt: now,
    source: row.booked ? "Polymarket CLOB" : "Polymarket public data",
    group: row.group || row.eventTitle,
    yesTokenId: row.yesTokenId,
    noTokenId: row.noTokenId,
    conditionId: row.conditionId,
    gammaId: row.id,
  };
}

/**
 * Fold a fresh discovery payload into the desk.
 * `opens` maps market id -> BTC print at the window open (from candle history), which
 * lets "Up or Down" windows be traded even if the worker started mid-window.
 */
export function applyTape(s: DeskCore, tape: TapePayload, opens: Record<string, number>, now: number): DeskCore {
  const prevById = new Map(s.liveMarkets.map((m) => [m.id, m]));
  const fetchedAt = tape.fetchedAt || now;
  const liveMarkets: Market[] = tape.markets.map((row) => {
    const next = liveToMarket(row, fetchedAt);
    const prev = prevById.get(next.id);
    const upDown = /up or down/i.test(next.question);
    let openSpot = prev?.openSpot ?? opens[next.id] ?? null;
    if (upDown && openSpot == null && tape.spot && next.startAt > 0 && next.startAt <= now && now - next.startAt < 45_000) {
      openSpot = tape.spot;
    }
    const metadataOk = next.metadataOk || (upDown && openSpot != null && !next.restricted);
    if (prev && prev.source === "Polymarket CLOB" && prev.updatedAt > fetchedAt) {
      return {
        ...next,
        yesBid: prev.yesBid,
        yesAsk: prev.yesAsk,
        updatedAt: prev.updatedAt,
        source: prev.source,
        openSpot,
        metadataOk,
      };
    }
    return { ...next, openSpot, metadataOk };
  });
  // Keep markets we hold exposure in even after they leave the discovery feed, so they can still settle.
  const heldIds = new Set(
    [...s.positions.filter((p) => p.status === "open"), ...s.orders.filter((o) => o.status === "open")].map((x) => x.marketId),
  );
  const carried = s.liveMarkets.filter((m) => heldIds.has(m.id) && !liveMarkets.some((n) => n.id === m.id));
  let alerts = s.alerts;
  let audit = s.audit;
  if (tape.error) alerts = withAlert(alerts, alert(now, "warn", "Tape warning", tape.error), "tape-error", 90_000);
  if (liveMarkets.length > 0 && s.liveMarkets.length === 0) {
    audit = withAudit(audit, {
      id: uid("audit"),
      at: now,
      actor: "system",
      action: "Markets discovered",
      detail: `${liveMarkets.length} BTC-related Polymarket contracts from the public feed. No hardcoded window id.`,
    });
  }
  return {
    ...s,
    liveMarkets: [...liveMarkets, ...carried],
    spot: tape.spot ?? s.spot,
    spotSource: tape.spot ? tape.spotSource : s.spotSource,
    alerts,
    audit,
  };
}

export function applyQuotes(
  s: DeskCore,
  quotes: Array<{ tokenId: string; bid: number; ask: number }>,
  now: number,
): DeskCore {
  if (quotes.length === 0) return s;
  const byToken = new Map(quotes.map((q) => [q.tokenId, q]));
  let changed = false;
  const liveMarkets = s.liveMarkets.map((m) => {
    if (!m.yesTokenId) return m;
    const q = byToken.get(m.yesTokenId);
    if (!q) return m;
    if (m.yesBid === q.bid && m.yesAsk === q.ask && m.source === "Polymarket CLOB") return { ...m, updatedAt: now };
    changed = true;
    return { ...m, yesBid: q.bid, yesAsk: q.ask, updatedAt: now, source: "Polymarket CLOB" };
  });
  return changed || liveMarkets.length ? { ...s, liveMarkets } : s;
}

// ───────────────────────────── scoring ─────────────────────────────

function scoreOf(p: Position, pnl: number, now: number, yesWon: boolean | null, official: boolean): ScoreRow {
  return {
    id: `${p.id}:${p.entryAt}`,
    venue: "paper",
    marketId: p.marketId,
    group: p.group,
    kind: p.kind,
    side: p.side,
    entryAt: p.entryAt,
    settledAt: now,
    minutesToExpiry: Math.max(0, (p.endAt - p.entryAt) / 60_000),
    entryPrice: p.averageCost,
    quantity: p.quantity,
    fees: p.fees,
    pnl,
    pYesBase: p.pYesBase,
    pYesCtx: p.pYesCtx,
    pYesAlt: p.pYesAlt,
    marketMid: p.entryMid,
    yesWon,
    edgeAtEntry: p.edgeAtEntry,
    official,
  };
}

function settlePosition(p: Position, yesWon: boolean, now: number, note: string, official: boolean) {
  const payoff = (p.side === "yes") === yesWon ? 1 : 0;
  const realized = p.quantity * payoff - p.quantity * p.averageCost - p.fees;
  const settled: Position = {
    ...p,
    status: "settled",
    realized,
    lastMark: payoff,
    settledAt: now,
    yesWon,
    settleNote: note,
  };
  return { settled, proceeds: p.quantity * payoff, score: scoreOf(p, realized, now, yesWon, official) };
}

// ───────────────────────────── tick ─────────────────────────────

export function tickCore(s: DeskCore, ctx: TickCtx): DeskCore {
  const now = ctx.now;
  const spot = ctx.spot ?? s.spot;
  const risk = s.risk;
  let { cash, positions, orders, fills, signals, alerts, audit, scores } = s;
  let circuitKind = s.circuitKind;
  let spots = s.spots;
  if (ctx.spotFresh && spot > 0) spots = [...spots, spot].slice(-360);
  const spotDtMs = ctx.spotDtMs ?? s.spotDtMs;

  // 1. sim windows: settle expired, then top up
  let simMarkets = s.simMarkets;
  for (const market of simMarkets.filter((m) => m.status === "open" && m.endAt <= now)) {
    const won = yesWins(market, spot || market.openSpot || 0);
    positions = positions.map((p) => {
      if (p.marketId !== market.id || p.status !== "open") return p;
      const r = settlePosition(p, won, now, won ? "Sim settlement: Up" : "Sim settlement: Down", true);
      cash += r.proceeds;
      scores = [r.score, ...scores];
      return r.settled;
    });
    audit = withAudit(audit, {
      id: uid("audit"),
      at: now,
      actor: "system",
      action: "Sim window settled",
      detail: `${market.question} resolved ${won ? "Up" : "Down"} on the desk reference.`,
    });
  }
  simMarkets = simMarkets.filter((m) => m.status === "open" && m.endAt > now);
  if (spot > 0 && ctx.sim !== false) simMarkets = ensureSimMarkets(simMarkets, now, spot);

  // 2. live (real Polymarket) positions: settle only on the venue's own resolution
  const resolutions = ctx.resolutions ?? {};
  positions = positions.map((p) => {
    if (p.status !== "open" || p.kind !== "live") return p;
    const gid = p.marketId.replace(/^poly-/, "");
    const verdict = resolutions[gid];
    if (verdict === undefined) return p;
    const r = settlePosition(p, verdict, now, `Polymarket resolved ${verdict ? "Yes/Up" : "No/Down"}.`, true);
    cash += r.proceeds;
    scores = [r.score, ...scores];
    audit = withAudit(audit, {
      id: uid("audit"),
      at: now,
      actor: "system",
      action: "Paper position settled",
      detail: `${p.question} · ${p.side.toUpperCase()} · P&L ${r.settled.realized.toFixed(2)}`,
    });
    return r.settled;
  });
  scores = scores.slice(0, MAX_SCORES);

  const liveMarkets = s.liveMarkets;
  const view = { simMarkets, liveMarkets };

  // 3. marks
  positions = positions.map((p) => {
    if (p.status !== "open") return p;
    const market = findMarket(view, p.marketId);
    if (!market || market.status !== "open") return p;
    const yes = (market.yesBid + market.yesAsk) / 2;
    return { ...p, lastMark: p.side === "yes" ? yes : 1 - yes };
  });

  // 4. resting orders: expire, cancel, or fill
  orders = orders.map((order) => {
    if (order.status !== "open") return order;
    const market = findMarket(view, order.marketId);
    const expired = now - order.submittedAt > ORDER_TTL_MS;
    if (!market || market.status !== "open" || market.endAt <= now || expired) {
      cash += order.debit;
      audit = withAudit(audit, {
        id: uid("audit"),
        at: now,
        actor: "system",
        action: "Order cancelled",
        detail: expired
          ? `${order.question} did not fill inside ${ORDER_TTL_MS / 1000}s. Reserved funds returned.`
          : `${order.question} closed before the paper order filled. Reserved funds returned.`,
      });
      return { ...order, status: "cancelled" as const, updatedAt: now };
    }
    const touch = order.side === "yes" ? market.yesAsk : 1 - market.yesBid;
    const fillPrice = Math.min(order.limitPrice, touch + risk.slippage);
    if (order.kind !== "sim-window" && touch + risk.slippage > order.limitPrice + 0.006) return order;
    const notional = order.quantity * fillPrice;
    const fee = notional * risk.feeRate;
    const spent = Math.min(order.debit, notional + fee);
    cash += order.debit - spent;
    fills = [
      {
        id: uid("fill"),
        orderId: order.id,
        marketId: order.marketId,
        side: order.side,
        price: fillPrice,
        quantity: order.quantity,
        fee,
        filledAt: now,
        question: order.question,
      } satisfies Fill,
      ...fills,
    ].slice(0, 200);
    const signal = signals.find((sig) => sig.id === order.signalId);
    const existing = positions.find((p) => p.id === `${order.marketId}:${order.side}` && p.status === "open");
    if (existing) {
      const qty = existing.quantity + order.quantity;
      positions = positions.map((p) =>
        p.id === existing.id
          ? {
              ...p,
              quantity: qty,
              averageCost: (existing.quantity * existing.averageCost + order.quantity * fillPrice) / qty,
              fees: existing.fees + fee,
              lastMark: fillPrice,
            }
          : p,
      );
    } else {
      const yesMid = (market.yesBid + market.yesAsk) / 2;
      positions = [
        {
          id: `${order.marketId}:${order.side}`,
          marketId: order.marketId,
          side: order.side,
          quantity: order.quantity,
          averageCost: fillPrice,
          fees: fee,
          status: "open" as const,
          question: order.question,
          kind: order.kind,
          lastMark: order.side === "yes" ? yesMid : 1 - yesMid,
          realized: 0,
          entryYesProb: signal ? (order.side === "yes" ? signal.probability : 1 - signal.probability) : yesMid,
          settledAt: null,
          settleNote: null,
          yesWon: null,
          pYesBase: signal?.pYesBase ?? yesMid,
          pYesCtx: signal?.pYesCtx ?? yesMid,
          pYesAlt: signal?.pYesAlt,
          entryMid: yesMid,
          entryAt: now,
          endAt: market.endAt,
          group: market.group,
          edgeAtEntry: signal?.edge ?? 0,
          modelVersion: signal?.modelVersion ?? MODEL_VERSION,
        },
        ...positions,
      ];
    }
    audit = withAudit(audit, {
      id: uid("audit"),
      at: now,
      actor: "system",
      action: "Paper fill",
      detail: `${order.side.toUpperCase()} ${order.quantity.toFixed(2)} @ ${fillPrice.toFixed(3)} on ${order.question}`,
    });
    return { ...order, status: "filled" as const, updatedAt: now };
  });

  // 5. pending approvals: expire on time or drift
  signals = signals.map((sig) => {
    if (sig.status !== "pending") return sig;
    const market = findMarket(view, sig.marketId);
    const touch = market
      ? sig.side === "yes"
        ? market.yesAsk + risk.slippage
        : 1 - market.yesBid + risk.slippage
      : sig.executablePrice;
    if (!market || now > sig.expiresAt || Math.abs(touch - sig.executablePrice) > DRIFT_LIMIT) {
      alerts = withAlert(alerts, alert(now, "warn", "Approval expired", sig.question), `expire-${sig.id}`, 10_000);
      audit = withAudit(audit, {
        id: uid("audit"),
        at: now,
        actor: "system",
        action: "Approval expired",
        detail: !market
          ? "Market disappeared before approval."
          : now > sig.expiresAt
            ? "Approval window elapsed."
            : "Touch moved beyond the drift limit.",
      });
      return { ...sig, status: "expired" as const, rejectedReason: "Stale approval" };
    }
    return sig;
  });

  // 6. equity, day roll, circuit breakers
  const equity = equityOf(cash, positions, orders);
  let dayKey = s.dayKey;
  let dayStartEquity = s.dayStartEquity;
  const key = new Date(now).toISOString().slice(0, 10);
  if (!dayKey) {
    dayKey = key;
    dayStartEquity = equity;
  } else if (key !== dayKey) {
    dayKey = key;
    dayStartEquity = equity;
    if (circuitKind === "daily") circuitKind = null;
    audit = withAudit(audit, {
      id: uid("audit"),
      at: now,
      actor: "system",
      action: "New session day",
      detail: "Daily loss accumulator reset on the UTC date change.",
    });
  }
  const peakEquity = Math.max(s.peakEquity, equity);
  if (circuitKind !== "reconcile") {
    if (equity - dayStartEquity <= -risk.dailyLossLimit) {
      if (circuitKind !== "daily") {
        alerts = withAlert(alerts, alert(now, "danger", "Daily loss limit", circuitMessage("daily")), "circuit-daily", 30_000);
        audit = withAudit(audit, {
          id: uid("audit"),
          at: now,
          actor: "system",
          action: "Daily loss limit",
          detail: circuitMessage("daily"),
        });
      }
      circuitKind = "daily";
    } else if (peakEquity - equity >= risk.drawdownLimit) {
      if (circuitKind !== "drawdown") {
        alerts = withAlert(alerts, alert(now, "danger", "Drawdown breaker", circuitMessage("drawdown")), "circuit-dd", 30_000);
      }
      circuitKind = "drawdown";
    } else if (circuitKind === "daily" || circuitKind === "drawdown") {
      circuitKind = null;
    }
  }

  // 7. signal generation
  const tickCount = s.tickCount + 1;
  const context = ctx.context === undefined ? s.context : ctx.context;
  if (tickCount % 4 === 0 && spot > 0) {
    const circuit = circuitKind ? circuitMessage(circuitKind) : null;
    // windows that have not opened yet have no reference price, so there is nothing to score
    const book = [
      ...simMarkets,
      ...liveMarkets.filter((m) => m.status === "open" && !(/up or down/i.test(m.question) && m.startAt > now)),
    ];
    // Orders that expired or were cancelled without a fill never held risk, so they do not use up the hourly cap.
    const ordersLastHour = orders.filter((o) => now - o.submittedAt < 3_600_000 && (o.status === "open" || o.status === "filled")).length;
    const vol = realizedVol(spots, spotDtMs);
    let created = 0;
    for (const market of book) {
      if (created >= 2) break;
      const pending = signals.some((sig) => sig.marketId === market.id && sig.status === "pending");
      const recent = signals.some((sig) => sig.marketId === market.id && sig.status === "executed" && now - sig.createdAt < 20_000);
      const resting = orders.some((o) => o.marketId === market.id && o.status === "open");
      // one open position per market: stacking correlated bets inflates the trial's sample size
      const held = positions.some((p) => p.marketId === market.id && p.status === "open");
      if (pending || recent || resting || held) continue;
      const opp = evaluateOpportunity(
        market, spot, now, risk, cash, exposureOf(positions, orders), ordersLastHour, s.killed, circuit,
        { vol, context, spots, spotDtMs },
      );
      const lastSame = signals.find((sig) => sig.marketId === market.id);
      const draft = (status: Signal["status"], expiresAt: number, mode: Mode, reason: string | null): Signal => ({
        id: uid("sig"),
        marketId: market.id,
        createdAt: now,
        expiresAt,
        modelVersion: MODEL_VERSION,
        probability: opp.probability,
        uncertainty: opp.uncertainty,
        side: opp.side,
        executablePrice: opp.executablePrice,
        stake: opp.stake,
        shares: opp.shares,
        debit: opp.debit,
        expectedValue: opp.expectedValue,
        edge: opp.edge,
        rationale: opp.rationale,
        risks: opp.risks,
        pYesBase: opp.pYesBase,
        pYesCtx: opp.yesProbability,
        pYesAlt: opp.pYesAlt,
        marketMid: opp.marketMid,
        status,
        rejectedReason: reason,
        question: market.question,
        kind: market.kind,
        mode,
      });
      if (opp.hardFail) {
        const nearMiss = market.kind === "sim-window" || opp.edge > -0.025;
        const recentBlocks = signals.filter((sig) => sig.status === "blocked" && now - sig.createdAt < 50_000).length;
        if (!nearMiss || recentBlocks >= 5) continue;
        if (lastSame && now - lastSame.createdAt < 50_000) continue;
        signals = [draft("blocked", now, s.mode, opp.hardFail), ...signals].slice(0, 120);
        continue;
      }
      if (s.mode === "manual" || s.killed || circuit) {
        signals = [draft("pending", now + APPROVAL_MS, "manual", null), ...signals].slice(0, 120);
        created += 1;
        audit = withAudit(audit, {
          id: uid("audit"),
          at: now,
          actor: "system",
          action: "Approval requested",
          detail: `${market.group}: ${opp.side.toUpperCase()} edge ${opp.edge.toFixed(3)}`,
        });
        continue;
      }
      const sig = draft("executed", now, s.mode, null);
      const placed = submitPaper(s.mode, sig, market, now, [sig, ...signals].slice(0, 120), orders, cash, audit, alerts);
      signals = placed.signals;
      orders = placed.orders;
      cash = placed.cash;
      audit = placed.audit;
      alerts = placed.alerts;
      created += 1;
    }
  }

  // 7b. chart history for open markets
  let hist = s.hist;
  if (tickCount % 5 === 0 && spot > 0) {
    const vol = realizedVol(spots, spotDtMs);
    const next: Record<string, Array<[number, number, number]>> = {};
    for (const m of [...simMarkets, ...liveMarkets.filter((x) => x.status === "open" && x.endAt > now)]) {
      const mid = (m.yesBid + m.yesAsk) / 2;
      const p = yesProbability(m, spot, now, vol).p;
      next[m.id] = [...(hist[m.id] ?? []), [now, mid, p] as [number, number, number]].slice(-150);
    }
    hist = next;
  }

  // 8. equity curve (every 5th tick ≈ every 5s on the worker)
  let curve = s.curve;
  if (tickCount % 5 === 0) curve = [...curve, { t: now, equity: Math.round(equity * 100) / 100 }].slice(-2000);

  return {
    ...s,
    spot,
    spotSource: ctx.spotSource ?? s.spotSource,
    spots,
    spotDtMs,
    simMarkets,
    cash,
    positions: positions.slice(0, 400),
    orders: orders.slice(0, 200),
    fills,
    signals,
    alerts,
    audit,
    scores,
    hist,
    circuitKind,
    dayKey,
    dayStartEquity,
    peakEquity,
    tickCount,
    curve,
    context,
  };
}

// ───────────────────────────── order submit ─────────────────────────────

export function submitPaper(
  mode: Mode,
  sig: Signal,
  market: Market,
  now: number,
  signals: Signal[],
  orders: Order[],
  cash: number,
  audit: AuditEntry[],
  alerts: AlertItem[],
) {
  if (orders.some((o) => o.idempotencyKey === sig.id)) return { signals, orders, cash, audit, alerts };
  if (cash < sig.debit) {
    alerts = withAlert(alerts, alert(now, "warn", "Order rejected", "Not enough paper balance."), `cash-${sig.id}`, 5_000);
    return {
      signals: signals.map((x) => (x.id === sig.id ? { ...x, status: "rejected" as const, rejectedReason: "Insufficient paper cash" } : x)),
      orders,
      cash,
      audit,
      alerts,
    };
  }
  const order: Order = {
    id: uid("ord"),
    idempotencyKey: sig.id,
    marketId: market.id,
    signalId: sig.id,
    mode,
    venue: "paper",
    side: sig.side,
    limitPrice: sig.executablePrice,
    quantity: sig.shares,
    debit: sig.debit,
    status: "open",
    submittedAt: now,
    updatedAt: now,
    question: market.question,
    kind: market.kind,
  };
  audit = withAudit(audit, {
    id: uid("audit"),
    at: now,
    actor: mode === "auto" ? "system" : "owner",
    action: "Paper order submitted",
    detail: `${mode} ${sig.side.toUpperCase()} ${sig.shares.toFixed(2)} @ ${sig.executablePrice.toFixed(3)} · key ${sig.id}`,
  });
  return { signals, orders: [order, ...orders].slice(0, 200), cash: cash - sig.debit, audit, alerts };
}

// ───────────────────────────── commands ─────────────────────────────

export function approveCore(s: DeskCore, signalId: string, now: number): DeskCore {
  const sig = s.signals.find((item) => item.id === signalId);
  if (!sig || sig.status !== "pending") return s;
  const market = findMarket(s, sig.marketId);
  let signals = s.signals;
  let alerts = s.alerts;
  let audit = s.audit;
  const fail = (reason: string): DeskCore => {
    signals = signals.map((item) => (item.id === sig.id ? { ...item, status: "expired" as const, rejectedReason: reason } : item));
    alerts = withAlert(alerts, alert(now, "warn", "Approval rejected", reason), `approve-fail-${sig.id}`, 5_000);
    audit = withAudit(audit, { id: uid("audit"), at: now, actor: "owner", action: "Approval rejected", detail: reason });
    return { ...s, signals, alerts, audit };
  };
  if (s.killed) return fail("Kill switch is on");
  if (s.circuitKind) return fail(circuitMessage(s.circuitKind));
  if (!market) return fail("Market is no longer available");
  if (now > sig.expiresAt) return fail("Approval expired");
  const touch = sig.side === "yes" ? market.yesAsk + s.risk.slippage : 1 - market.yesBid + s.risk.slippage;
  if (Math.abs(touch - sig.executablePrice) > DRIFT_LIMIT) return fail("Price moved beyond the approval threshold");
  const opp = evaluateOpportunity(
    market, s.spot, now, s.risk, s.cash, exposureOf(s.positions, s.orders),
    s.orders.filter((o) => now - o.submittedAt < 3_600_000).length,
    s.killed, null, { vol: realizedVol(s.spots, s.spotDtMs), context: s.context },
  );
  if (opp.hardFail) return fail(opp.hardFail);
  if (opp.side !== sig.side) return fail("The favored side changed. Request a new approval.");
  const placed = submitPaper("manual", sig, market, now, signals, s.orders, s.cash, audit, alerts);
  return {
    ...s,
    signals: placed.signals.map((item) =>
      item.id === sig.id && item.status === "pending" ? { ...item, status: "executed" as const, rejectedReason: null } : item,
    ),
    orders: placed.orders,
    cash: placed.cash,
    alerts: placed.alerts,
    audit: withAudit(placed.audit, {
      id: uid("audit"),
      at: now,
      actor: "owner",
      action: "Trade approved",
      detail: `${sig.question} · ${sig.side.toUpperCase()} · paper`,
    }),
  };
}

export function applyCommand(s: DeskCore, cmd: DeskCommand, now: number): DeskCore {
  switch (cmd.type) {
    case "approve":
      return approveCore(s, cmd.signalId, now);
    case "reject":
      return {
        ...s,
        signals: s.signals.map((sig) =>
          sig.id === cmd.signalId && sig.status === "pending"
            ? { ...sig, status: "rejected" as const, rejectedReason: "Dismissed by owner" }
            : sig,
        ),
        audit: withAudit(s.audit, { id: uid("audit"), at: now, actor: "owner", action: "Signal dismissed", detail: cmd.signalId }),
      };
    case "setMode":
      return {
        ...s,
        mode: cmd.mode,
        audit: withAudit(s.audit, {
          id: uid("audit"),
          at: now,
          actor: "owner",
          action: cmd.mode === "auto" ? "Auto mode enabled" : "Manual mode enabled",
          detail:
            cmd.mode === "auto"
              ? "Qualifying orders may submit without a click. Risk gates still apply. Open orders stay working."
              : "New autonomous submissions stopped. Open paper orders remain until they fill, cancel, or you kill the desk.",
        }),
        alerts: withAlert(
          s.alerts,
          alert(now, "info", cmd.mode === "auto" ? "Auto mode on" : "Back to manual", cmd.mode === "auto" ? "Only inside the risk gates." : "The desk will ask before every new order."),
          `mode-${cmd.mode}`,
          3_000,
        ),
      };
    case "setKilled":
      return killCore(s, cmd.on, now);
    case "updateRisk": {
      const risk = sanitizeRisk({ ...s.risk, ...cmd.risk });
      const recent = now - (alertMemo.get("risk-audit") ?? 0) < 2500;
      if (!recent) alertMemo.set("risk-audit", now);
      return {
        ...s,
        risk,
        audit: recent
          ? s.audit
          : withAudit(s.audit, {
              id: uid("audit"),
              at: now,
              actor: "owner",
              action: "Risk limits updated",
              detail: "Owner changed a limit. The model cannot raise these by itself.",
            }),
      };
    }
    case "flatten":
      return flattenCore(s, cmd.positionId, now);
    case "simulateMismatch":
      return {
        ...s,
        circuitKind: "reconcile",
        reconcileNote: "Drill: local book was marked out of sync. New orders stay paused.",
        alerts: withAlert(s.alerts, alert(now, "danger", "Reconciliation mismatch", "This is a drill. New orders are paused until you clear it."), "reconcile", 2_000),
        audit: withAudit(s.audit, { id: uid("audit"), at: now, actor: "owner", action: "Mismatch drill", detail: "Owner simulated a book mismatch." }),
      };
    case "clearMismatch":
      if (s.circuitKind !== "reconcile") return s;
      return {
        ...s,
        circuitKind: null,
        reconcileNote: "Owner marked the book reconciled.",
        audit: withAudit(s.audit, { id: uid("audit"), at: now, actor: "owner", action: "Reconcile cleared", detail: "Mismatch cleared by the owner." }),
      };
    case "markAlertsRead":
      return { ...s, alerts: s.alerts.map((a) => ({ ...a, read: true })) };
    case "resetTrial":
      return resetTrialCore(s, now);
    default:
      // live* commands are handled by the worker's live executor, never by the pure ledger
      return s;
  }
}

export function killCore(s: DeskCore, on: boolean, now: number): DeskCore {
  let orders = s.orders;
  let cash = s.cash;
  let audit = s.audit;
  let live = s.live;
  if (on && s.risk.cancelOnKill) {
    const open = orders.filter((o) => o.status === "open");
    for (const o of open) cash += o.debit;
    orders = orders.map((o) => (o.status === "open" ? { ...o, status: "cancelled" as const, updatedAt: now } : o));
    audit = withAudit(audit, {
      id: uid("audit"),
      at: now,
      actor: "owner",
      action: "Kill switch",
      detail: `New orders blocked. ${open.length} resting paper order${open.length === 1 ? "" : "s"} cancelled. Positions were left open.`,
    });
  } else {
    audit = withAudit(audit, {
      id: uid("audit"),
      at: now,
      actor: "owner",
      action: on ? "Kill switch" : "Kill switch released",
      detail: on
        ? "New orders blocked. Resting orders were left working because cancel-on-kill is off."
        : "New orders are allowed again, still subject to risk gates.",
    });
  }
  // The kill switch also disarms live trading. It never re-arms by itself.
  if (on && live.status !== "off") {
    live = { ...live, status: "off", armedAt: null, auto: false };
    audit = withAudit(audit, {
      id: uid("audit"),
      at: now,
      actor: "system",
      action: "Live disarmed",
      detail: "Kill switch turned live trading off. Re-arm it deliberately after release.",
    });
  }
  return {
    ...s,
    killed: on,
    orders,
    cash,
    audit,
    live,
    alerts: [
      alert(now, on ? "danger" : "info", on ? "Emergency stop" : "Emergency stop cleared", on ? "The kill switch blocks new orders and disarms live." : "You can approve or auto-submit orders again."),
      ...s.alerts,
    ].slice(0, 40),
  };
}

export function flattenCore(s: DeskCore, positionId: string, now: number): DeskCore {
  const position = s.positions.find((p) => p.id === positionId && p.status === "open");
  if (!position) return s;
  const market = findMarket(s, position.marketId);
  const touch = market ? (position.side === "yes" ? market.yesBid : 1 - market.yesAsk) : position.lastMark;
  const proceeds = position.quantity * touch;
  const realized = proceeds - position.quantity * position.averageCost - position.fees;
  const settled: Position = {
    ...position,
    status: "settled",
    realized,
    lastMark: touch,
    settledAt: now,
    settleNote: "Flattened at the touch. This is not an official resolution.",
    yesWon: null,
  };
  return {
    ...s,
    cash: s.cash + proceeds,
    positions: s.positions.map((p) => (p.id === positionId ? settled : p)),
    scores: [scoreOf(position, realized, now, null, false), ...s.scores].slice(0, MAX_SCORES),
    audit: withAudit(s.audit, {
      id: uid("audit"),
      at: now,
      actor: "owner",
      action: "Position flattened",
      detail: `${position.question} closed on paper at ${touch.toFixed(3)}.`,
    }),
  };
}

/** Start a clean trial: wipes the paper book and score history, keeps limits, mode, and live setup. */
export function resetTrialCore(s: DeskCore, now: number): DeskCore {
  const fresh = makeCore(now);
  return {
    ...fresh,
    risk: s.risk,
    mode: s.mode,
    killed: s.killed,
    live: s.live,
    liveMarkets: s.liveMarkets,
    spot: s.spot,
    spotSource: s.spotSource,
    spots: s.spots,
    spotDtMs: s.spotDtMs,
    context: s.context,
    hist: s.hist,
    audit: [
      {
        id: uid("audit"),
        at: now,
        actor: "owner",
        action: "Trial reset",
        detail: "Paper book, scores, and equity curve cleared. A new trial clock started.",
      },
    ],
  };
}

export function liveDayRoll(live: LiveBook, now: number): LiveBook {
  const key = new Date(now).toISOString().slice(0, 10);
  if (live.dayKey === key) return live;
  return { ...live, dayKey: key, dayRealized: 0 };
}
