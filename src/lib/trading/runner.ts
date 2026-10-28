/**
 * DeskRunner: the orchestration loop behind the 24/7 paper trial and the live section.
 * All I/O is injected so the loop can be tested with fakes and a fake clock.
 */
import { ARM_PHRASE, cancelAllLive, envReady, planLiveOrder, reconcileLive, submitLive, type ClobSdk, type LiveEnv } from "./live.ts";
import {
  applyCommand,
  applyQuotes,
  applyTape,
  findMarket,
  hydrateCore,
  killCore,
  liveDayRoll,
  makeCore,
  tickCore,
  uid,
  withAlert,
  withAudit,
} from "./ledger.ts";
import { LIVE_CEILING } from "./live-const.ts";
import { DEFAULT_GATE, evaluateGate, summarize } from "./trial.ts";
import { STARTING_CASH } from "./engine.ts";
import type { TapePayload } from "./tape-fetch.ts";
import { lastOpenError } from "./tape-fetch.ts";
import type { ContextSnapshot, DeskCommand, DeskCore, LiveBook, Market, Signal } from "./types.ts";

export const WORKER_VERSION = "helios-worker-1";


export interface RunnerDeps {
  now: () => number;
  loadTape: () => Promise<TapePayload>;
  fetchQuotes: (tokenIds: string[]) => Promise<Array<{ tokenId: string; bid: number; ask: number }>>;
  fetchResolutions: (gammaIds: string[]) => Promise<Record<string, boolean>>;
  fetchSpotAt: (ts: number) => Promise<number | null>;
  /** optional live websocket price; when present and fresh it replaces the 6-second REST print */
  liveSpot?: () => { price: number; at: number } | null;
  loadContext: () => Promise<ContextSnapshot>;
  getSdk: () => Promise<ClobSdk>;
  liveEnv: () => LiveEnv;
  persist: (core: DeskCore, meta: RunnerMeta) => Promise<void>;
  journal: (rows: unknown[]) => Promise<void>;
  drainCommands: () => Promise<DeskCommand[]>;
  takeRestore?: () => Promise<unknown | null>;
  notify?: (text: string) => void;
}

export interface RunnerMeta {
  tapeAt: number;
  quotesAt: number;
  feedError: string | null;
  workerStartedAt: number;
  lastCommandNote: string | null;
}

export class DeskRunner {
  core: DeskCore;
  meta: RunnerMeta;
  private resolutions: Record<string, boolean> = {};
  private opens = new Map<string, number>();
  private openTried = new Map<string, number>();
  private spotLog: Array<[number, number]> = [];
  /** when the REST price in core.spot arrived, and when we last logged / sampled a live print */
  private restSpotAt = 0;
  private wsLoggedAt = 0;
  private wsSampledAt = 0;
  private openFails = 0;
  private lastTape = 0;
  private lastQuotes = 0;
  private lastRes = 0;
  private lastCtx = 0;
  private lastReconcile = 0;
  private lastPersist = 0;
  private journaled = new Set<string>();
  private busy = new Set<string>();
  private lastAlertAt = 0;
  private lastDigestAt = 0;
  private settledNotified = new Set<string>();
  private digestPrimed = false;

  private deps: RunnerDeps;

  constructor(deps: RunnerDeps, initial?: unknown) {
    this.deps = deps;
    const now = deps.now();
    this.core = initial ? hydrateCore(initial, now) : makeCore(now);
    this.meta = { tapeAt: 0, quotesAt: 0, feedError: null, workerStartedAt: now, lastCommandNote: null };
    for (const s of this.core.scores) this.journaled.add(s.id);
    // Restart safety: anything half-open on a live book needs a human look.
    if (this.core.live.status === "armed") {
      this.core.live = { ...this.core.live, status: "off", armedAt: null, auto: false };
      this.core.audit = withAudit(this.core.audit, {
        id: uid("audit"),
        at: now,
        actor: "system",
        action: "Live disarmed on restart",
        detail: "The worker restarted. Live trading never resumes on its own; re-arm it deliberately.",
      });
    }
  }

  /** Run once at startup: pull any live orders a previous run left resting on the exchange. */
  async init() {
    const env = this.deps.liveEnv();
    const open = this.core.live.orders.filter((o) => o.status === "open" && o.exchangeId);
    if (!open.length || !env.hasKey) return;
    try {
      const sdk = await this.deps.getSdk();
      const next = await cancelAllLive(sdk, this.core.live, this.deps.now());
      this.core = {
        ...this.core,
        live: next,
        audit: withAudit(this.core.audit, { id: uid("audit"), at: this.deps.now(), actor: "system", action: "Startup cancel", detail: `Cancelled ${open.length} live order(s) left resting before the restart.` }),
      };
      this.deps.notify?.(`Helios restarted and cancelled ${open.length} resting live order(s).`);
    } catch {
      this.deps.notify?.("Helios restarted but could not cancel resting live orders. Check Polymarket directly.");
    }
  }

  private notifyNew() {
    if (!this.deps.notify) return;
    const fresh = this.core.alerts.filter((a) => a.severity === "danger" && a.at > this.lastAlertAt);
    if (fresh.length) {
      this.lastAlertAt = Math.max(...fresh.map((a) => a.at));
      this.deps.notify(`Helios: ${fresh.map((a) => `${a.title} (${a.detail})`).join("; ")}`);
    }
  }

  /** Phone alerts for settled real-market trades, plus a daily summary and a model-vs-market warning. */
  private notifyTrades(now: number) {
    if (!this.deps.notify) return;
    const real = this.core.scores.filter((r) => r.kind === "live");
    if (!this.digestPrimed) {
      // after a restart, do not re-announce history
      for (const r of real) this.settledNotified.add(r.id);
      this.lastDigestAt = now;
      this.digestPrimed = true;
      return;
    }
    const fresh = real.filter((r) => !this.settledNotified.has(r.id));
    for (const r of fresh.slice(0, 3)) {
      this.settledNotified.add(r.id);
      this.deps.notify(`Helios settled: ${r.side.toUpperCase()} on ${r.group} window ${r.pnl >= 0 ? "won" : "lost"} ${r.pnl >= 0 ? "+" : "-"}$${Math.abs(r.pnl).toFixed(2)} (paper).`);
    }
    for (const r of fresh.slice(3)) this.settledNotified.add(r.id);
    if (now - this.lastDigestAt >= 86_400_000) {
      this.lastDigestAt = now;
      const s = summarize(this.core, now, STARTING_CASH);
      const gate = evaluateGate(s, this.core.risk.drawdownLimit, DEFAULT_GATE);
      let msg = `Helios daily summary: ${s.trades} real trades, net ${s.netPnl >= 0 ? "+" : "-"}$${Math.abs(s.netPnl).toFixed(2)}, win rate ${(s.winRate * 100).toFixed(0)}%, trial day ${s.days.toFixed(1)}, gate ${gate.eligible ? "PASSED" : "not passed"}.`;
      if (s.officialTrades >= 30 && s.brierEdge != null && s.brierEdge <= 0) msg += " Warning: the model is not beating the market price on probability accuracy.";
      this.deps.notify(msg);
    }
  }

  private once(name: string, fn: () => Promise<void>) {
    if (this.busy.has(name)) return;
    this.busy.add(name);
    void fn()
      .catch(() => {})
      .finally(() => this.busy.delete(name));
  }

  /** Called every second. Network refreshes run in the background; the tick itself is synchronous. */
  async step() {
    const now = this.deps.now();
    const d = this.deps;

    if (now - this.lastTape > 6_000) {
      this.lastTape = now;
      this.once("tape", async () => {
        const tape = await d.loadTape();
        const t = d.now();
        const opens: Record<string, number> = {};
        for (const m of tape.markets) {
          const id = `poly-${m.id}`;
          const known = this.opens.get(id);
          if (known != null) opens[id] = known;
        }
        this.core = applyTape(this.core, tape, opens, t);
        this.meta.tapeAt = t;
        this.meta.feedError = tape.error;
        if (tape.spot) {
          this.pendingSpot = { spot: tape.spot, source: tape.spotSource };
          this.restSpotAt = t;
          this.spotLog = [...this.spotLog, [t, tape.spot] as [number, number]].filter((r) => t - r[0] < 6 * 3_600_000).slice(-6000);
        }
        // recover window-open prints for Up/Down markets we joined mid-window
        for (const m of this.core.liveMarkets) {
          if (m.openSpot != null || !/up or down/i.test(m.question) || m.startAt > t) continue;
          const tried = this.openTried.get(m.id) ?? 0;
          if (t - tried < 30_000) continue;
          this.openTried.set(m.id, t);
          // Our own recorded prints are the best source when the window opened while the worker was running.
          const near = this.spotLog.reduce<[number, number] | null>(
            (best, r) => (Math.abs(r[0] - m.startAt) <= 8_000 && (!best || Math.abs(r[0] - m.startAt) < Math.abs(best[0] - m.startAt)) ? r : best),
            null,
          );
          const open = near ? near[1] : await d.fetchSpotAt(m.startAt);
          if (open == null) {
            this.openFails += 1;
            this.meta.feedError = `Cannot load the BTC price at window open. ${lastOpenError}`;
          } else {
            this.openFails = 0;
          }
          if (open != null) {
            this.opens.set(m.id, open);
            this.core = {
              ...this.core,
              liveMarkets: this.core.liveMarkets.map((x) => (x.id === m.id ? { ...x, openSpot: open, metadataOk: x.metadataOk || !x.restricted } : x)),
            };
          }
        }
      });
    }

    if (now - this.lastQuotes > 2_500) {
      this.lastQuotes = now;
      this.once("quotes", async () => {
        const ids = this.core.liveMarkets.filter((m) => m.status === "open").map((m) => m.yesTokenId).filter((x): x is string => Boolean(x));
        const q = await d.fetchQuotes(ids);
        if (q.length) {
          this.core = applyQuotes(this.core, q, d.now());
          this.meta.quotesAt = d.now();
        }
      });
    }

    if (now - this.lastRes > 20_000) {
      this.lastRes = now;
      this.once("resolutions", async () => {
        const wanted = new Set<string>();
        for (const p of this.core.positions) if (p.status === "open" && p.kind === "live") wanted.add(p.marketId.replace(/^poly-/, ""));
        for (const o of this.core.live.orders) if (o.status === "filled" && !o.settled) wanted.add(o.marketId.replace(/^poly-/, ""));
        // only ask about markets that should be over by now
        const due = [...wanted].filter((gid) => {
          const m = this.core.liveMarkets.find((x) => x.id === `poly-${gid}`);
          return !m || m.endAt <= d.now() + 5_000;
        });
        if (due.length) this.resolutions = { ...this.resolutions, ...(await d.fetchResolutions(due)) };
      });
    }

    if (now - this.lastCtx > 120_000) {
      this.lastCtx = now;
      this.once("context", async () => {
        const ctx = await d.loadContext();
        this.core = { ...this.core, context: ctx };
      });
    }

    const live = this.core.live;
    if (live.status === "armed" && now - this.lastReconcile > 10_000) {
      this.lastReconcile = now;
      this.once("reconcile", async () => {
        const sdk = await d.getSdk();
        const next = await reconcileLive(sdk, this.core.live, this.resolutions, d.now());
        this.core = { ...this.core, live: next };
        if (next.lastReconcileOk === false) {
          this.core = {
            ...this.core,
            live: { ...this.core.live, status: "off", armedAt: null, auto: false },
            circuitKind: "reconcile",
            reconcileNote: `Live reconciliation failed: ${next.lastError ?? "unknown"}. Live was disarmed.`,
            alerts: withAlert(
              this.core.alerts,
              { id: uid("alert"), at: d.now(), severity: "danger", title: "Live reconcile failed", detail: "Live trading was disarmed. Check the exchange, then clear the mismatch.", read: false },
              "live-reconcile",
              30_000,
            ),
          };
        }
      });
    }

    // restore from an uploaded backup
    const restored = d.takeRestore ? await d.takeRestore() : null;
    if (restored && typeof restored === "object") {
      const body = restored as { core?: unknown };
      if (body.core && typeof body.core === "object") {
        const next = hydrateCore(body.core, now);
        // a restored desk never comes back armed
        next.live = { ...next.live, status: "off", armedAt: null, auto: false };
        next.audit = withAudit(next.audit, { id: uid("audit"), at: now, actor: "owner", action: "Backup restored", detail: "Desk state replaced from an uploaded backup. Live trading is off; re-arm it deliberately." });
        this.core = next;
        this.journaled = new Set(next.scores.map((x) => x.id));
        this.settledNotified = new Set(next.scores.map((x) => x.id));
        this.meta.lastCommandNote = "Backup restored";
      }
    }

    // commands
    const cmds = await d.drainCommands();
    for (const cmd of cmds) await this.apply(cmd);

    // tick. A live websocket print (under 3s old) is the price we trade on; the REST print is the fallback.
    const wsPrint = d.liveSpot?.() ?? null;
    const wsAge = wsPrint ? now - wsPrint.at : Infinity;
    const useWs = Boolean(wsPrint) && wsAge < 3_000 && (wsPrint?.price ?? 0) > 0;
    let fresh = this.pendingSpot;
    this.pendingSpot = null;
    let spotFresh = Boolean(fresh);
    let spot = fresh?.spot ?? this.core.spot;
    let spotSource = fresh?.source;
    let spotAgeMs = Math.max(0, now - this.restSpotAt) + 800;
    if (useWs && wsPrint) {
      spot = wsPrint.price;
      spotSource = "Coinbase websocket BTC-USD";
      spotAgeMs = wsAge + 200;
      // the volatility sample keeps its 6-second cadence so the vol estimate means the same thing as before
      spotFresh = now - this.wsSampledAt >= 6_000;
      if (spotFresh) this.wsSampledAt = now;
      fresh = null;
      // keep a record of window-open prices at 5s resolution
      if (now - this.wsLoggedAt >= 5_000) {
        this.wsLoggedAt = now;
        this.spotLog = [...this.spotLog, [now, wsPrint.price] as [number, number]].filter((r) => now - r[0] < 6 * 3_600_000).slice(-6000);
      }
    }
    this.core = tickCore(this.core, {
      now,
      spot,
      spotSource,
      spotFresh,
      spotAgeMs,
      spotDtMs: 6_000,
      resolutions: this.resolutions,
      sim: process.env.HELIOS_SIM_WINDOWS === "1",
    });

    // live mirror
    await this.mirrorLive(now);
    this.notifyNew();
    this.notifyTrades(now);

    // journal new scores
    const fresh2 = this.core.scores.filter((s) => !this.journaled.has(s.id));
    if (fresh2.length) {
      for (const s of fresh2) this.journaled.add(s.id);
      await d.journal(fresh2.map((s) => ({ type: "score", ...s })));
    }

    if (now - this.lastPersist > 5_000 || cmds.length) {
      this.lastPersist = now;
      await d.persist(this.core, this.meta);
    }
  }

  private pendingSpot: { spot: number; source: string } | null = null;

  private eligible() {
    const s = summarize(this.core, this.deps.now(), STARTING_CASH);
    return evaluateGate(s, this.core.risk.drawdownLimit, DEFAULT_GATE).eligible;
  }

  private async mirrorLive(now: number) {
    const live = this.core.live;
    if (live.status === "off" || !live.auto) return;
    for (const sig of this.core.signals) {
      if (sig.status !== "executed" || sig.kind !== "live") continue;
      if (live.armedAt && sig.createdAt < live.armedAt) continue;
      if (now - sig.createdAt > 20_000) continue;
      if (this.core.live.orders.some((o) => o.signalId === sig.id)) continue;
      await this.sendLive(sig, now);
    }
  }

  private async sendLive(sig: Signal, now: number) {
    const market = findMarket(this.core, sig.marketId);
    const decision = planLiveOrder(this.core, this.core.live, sig, market, { now, eligible: this.eligible() });
    if ("refused" in decision) {
      this.meta.lastCommandNote = `Live skipped: ${decision.refused}`;
      this.core = {
        ...this.core,
        audit: withAudit(this.core.audit, { id: uid("audit"), at: now, actor: "system", action: "Live skipped", detail: `${sig.question}: ${decision.refused}` }),
      };
      return;
    }
    try {
      const sdk = await this.deps.getSdk();
      const order = await submitLive(sdk, this.core.live, sig, market as Market, decision.plan, now);
      const book: LiveBook = { ...this.core.live, orders: [order, ...this.core.live.orders].slice(0, 300) };
      this.core = {
        ...this.core,
        live: book,
        audit: withAudit(this.core.audit, {
          id: uid("audit"),
          at: now,
          actor: "system",
          action: order.status === "dry" ? "Live dry run" : order.status === "open" ? "Live order posted" : `Live order ${order.status}`,
          detail: `${sig.side.toUpperCase()} ${order.size} @ ${order.price} · ${order.note}`,
        }),
      };
      await this.deps.journal([{ type: "live-order", ...order }]);
      if (order.status !== "dry") this.deps.notify?.(`Helios live order ${order.status}: ${sig.side.toUpperCase()} ${order.size} @ ${order.price} on ${market?.question ?? ""}. ${order.note}`);
    } catch (e) {
      this.core = {
        ...this.core,
        live: { ...this.core.live, lastError: e instanceof Error ? e.message.slice(0, 200) : "live submit failed" },
      };
    }
  }

  async apply(cmd: DeskCommand) {
    const now = this.deps.now();
    const env = this.deps.liveEnv();
    switch (cmd.type) {
      case "setKilled": {
        this.core = killCore(this.core, cmd.on, now);
        if (cmd.on && env.hasKey) {
          try {
            const sdk = await this.deps.getSdk();
            this.core = { ...this.core, live: await cancelAllLive(sdk, this.core.live, now) };
          } catch {
            /* cancelAll is best effort; live is already disarmed */
          }
        }
        return;
      }
      case "liveSetStatus": {
        const live = this.core.live;
        const deny = (why: string) => {
          this.meta.lastCommandNote = why;
          this.core = { ...this.core, audit: withAudit(this.core.audit, { id: uid("audit"), at: now, actor: "owner", action: "Live change refused", detail: why }) };
        };
        if (cmd.status === "off") {
          this.core = {
            ...this.core,
            live: { ...live, status: "off", armedAt: null, auto: false },
            audit: withAudit(this.core.audit, { id: uid("audit"), at: now, actor: "owner", action: "Live off", detail: "Live trading turned off. Resting live orders are cancelled on the next reconcile." }),
          };
          return;
        }
        if (this.core.killed) return deny("Release the kill switch first");
        if (!env.enabled || !env.hasKey || !env.hasFunder) return deny("Live env is not configured (HELIOS_LIVE_ENABLED, POLY_PRIVATE_KEY, POLY_FUNDER_ADDRESS)");
        if (cmd.status === "armed") {
          if (!envReady(env)) return deny("HELIOS_OWNER_TOKEN must be set to arm live");
          if (cmd.confirm !== ARM_PHRASE) return deny("Confirmation phrase did not match");
          if (!this.eligible()) return deny("The paper trial has not passed the live gate");
        }
        this.core = {
          ...this.core,
          live: { ...live, status: cmd.status, armedAt: now, auto: cmd.status === "armed" ? live.auto : false },
          audit: withAudit(this.core.audit, {
            id: uid("audit"),
            at: now,
            actor: "owner",
            action: cmd.status === "armed" ? "Live ARMED" : "Live dry-run on",
            detail: cmd.status === "armed" ? `Real orders may be posted inside caps: $${live.maxStake}/order, $${live.maxExposure} open, $${live.dailyLossLimit}/day.` : "Orders are built and signed but never posted.",
          }),
        };
        return;
      }
      case "liveUpdate": {
        const live = this.core.live;
        const clamp = (v: number | undefined, cur: number, ceil: number) => (v == null || !Number.isFinite(v) ? cur : Math.min(ceil, Math.max(1, v)));
        this.core = {
          ...this.core,
          live: {
            ...live,
            auto: cmd.auto == null ? live.auto : live.status === "off" ? false : cmd.auto,
            maxStake: clamp(cmd.maxStake, live.maxStake, LIVE_CEILING.maxStake),
            maxExposure: clamp(cmd.maxExposure, live.maxExposure, LIVE_CEILING.maxExposure),
            dailyLossLimit: clamp(cmd.dailyLossLimit, live.dailyLossLimit, LIVE_CEILING.dailyLossLimit),
          },
          audit: withAudit(this.core.audit, { id: uid("audit"), at: now, actor: "owner", action: "Live limits updated", detail: "Caps are clamped to hard ceilings." }),
        };
        return;
      }
      case "liveSend": {
        let sig = this.core.signals.find((s) => s.id === cmd.signalId);
        if (!sig) return;
        if (sig.status === "pending") {
          this.core = applyCommand(this.core, { type: "approve", signalId: sig.id }, now);
          sig = this.core.signals.find((s) => s.id === cmd.signalId);
        }
        if (sig && sig.status === "executed") await this.sendLive(sig, now);
        return;
      }
      case "resetTrial":
        this.journaled.clear();
        this.core = applyCommand(this.core, cmd, now);
        return;
      default:
        this.core = applyCommand(this.core, cmd, now);
        this.core = { ...this.core, live: liveDayRoll(this.core.live, now) };
    }
  }
}
