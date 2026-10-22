import { create } from "zustand";
import { isTheme, MODEL_VERSION, runBacktest, STARTING_CASH } from "./engine.ts";
import { applyCommand, applyQuotes, applyTape, hydrateCore, makeCore, tickCore } from "./ledger.ts";
import { getDesk, sendCommand, type DeskView } from "./desk-api.ts";
import { fetchResolutionsFn, fetchTape } from "./tape.ts";
import { DEFAULT_GATE, evaluateGate, powerNote, summarize } from "./trial.ts";
import type { LiveQuote } from "./book-socket.ts";
import type { BacktestReport, DeskCommand, DeskCore, Mode, RiskConfig, ThemeId } from "./types.ts";

const STORAGE_KEY = "helios-desk-v2";
const THEME_KEY = "helios-theme";

export type DeskSource = "connecting" | "server" | "server-offline" | "local";

export interface DeskState extends DeskCore {
  theme: ThemeId;
  booted: boolean;
  now: number;
  source: DeskSource;
  workerAlive: boolean;
  heartbeatAgeMs: number | null;
  commandNote: string | null;
  liveStatus: "idle" | "loading" | "ok" | "error";
  liveError: string | null;
  liveFetchedAt: number;
  bookStatus: "idle" | "connecting" | "live" | "down";
  backtest: BacktestReport | null;
  trial: NonNullable<DeskView["trial"]> | null;
  liveEnv: DeskView["liveEnv"];
  signedIn: boolean;
  email: string | null;
  setEmail: (e: string | null) => void;
  boot: () => void;
  syncServer: () => Promise<void>;
  tick: () => void;
  refreshLive: () => Promise<void>;
  applyLiveQuotes: (quotes: LiveQuote[]) => void;
  setBookStatus: (status: DeskState["bookStatus"]) => void;
  dispatch: (cmd: DeskCommand) => Promise<void>;
  approve: (signalId: string) => void;
  reject: (signalId: string) => void;
  setMode: (mode: Mode) => void;
  setKilled: (on: boolean) => void;
  updateRisk: (partial: Partial<RiskConfig>) => void;
  setTheme: (theme: ThemeId) => void;
  runStudy: () => void;
  flatten: (positionId: string) => void;
  simulateMismatch: () => void;
  clearMismatch: () => void;
  markAlertsRead: () => void;
  resetTrial: () => void;
}

const CORE_KEYS: Array<keyof DeskCore> = [
  "risk", "mode", "killed", "cash", "simMarkets", "liveMarkets", "signals", "orders", "fills", "positions", "alerts",
  "audit", "curve", "dayKey", "dayStartEquity", "peakEquity", "circuitKind", "reconcileNote", "spot", "spotSource",
  "spots", "spotDtMs", "tickCount", "scores", "hist", "context", "trialStartedAt", "live",
];

function pickCore(s: DeskState): DeskCore {
  const out: Record<string, unknown> = {};
  for (const k of CORE_KEYS) out[k] = s[k];
  return out as unknown as DeskCore;
}

function readLocal(): unknown {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function writeLocal(core: DeskCore) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...core, simMarkets: [], liveMarkets: [], scores: core.scores.slice(0, 500), curve: core.curve.slice(-300), audit: core.audit.slice(0, 120), spots: core.spots.slice(-120) }),
    );
  } catch {
    /* storage can be blocked or full; the desk still runs */
  }
}

function localTrial(core: DeskCore, now: number): DeskState["trial"] {
  const summary = summarize(core, now, STARTING_CASH);
  const gate = evaluateGate(summary, core.risk.drawdownLimit, DEFAULT_GATE);
  return { summary, checks: gate.checks, eligible: gate.eligible, power: powerNote(summary), recent: core.scores.slice(0, 40) };
}

const noEnv = { enabled: false, hasKey: false, hasFunder: false, hasOwnerToken: false };

export const useDesk = create<DeskState>((set, get) => ({
  ...makeCore(0),
  theme: "orchard",
  booted: false,
  now: 0,
  source: "connecting",
  workerAlive: false,
  heartbeatAgeMs: null,
  commandNote: null,
  liveStatus: "idle",
  liveError: null,
  liveFetchedAt: 0,
  bookStatus: "idle",
  backtest: null,
  trial: null,
  liveEnv: noEnv,
  signedIn: false,
  email: null,
  setEmail: (e) => set({ email: e }),

  boot: () => {
    if (get().booted) return;
    let theme: ThemeId = "orchard";
    try {
      const t = window.localStorage.getItem(THEME_KEY);
      if (isTheme(t)) theme = t;
    } catch {
      /* ignore */
    }
    const now = Date.now();
    const core = hydrateCore(readLocal(), now);
    document.documentElement.dataset.theme = theme;
    set({ ...core, theme, booted: true, now });
    void get().syncServer();
  },

  syncServer: async () => {
    try {
      const view = await getDesk();
      if (view.core) {
        const alive = view.alive;
        set({
          ...view.core,
          source: alive ? "server" : "server-offline",
          workerAlive: alive,
          heartbeatAgeMs: view.heartbeatAgeMs,
          commandNote: view.lastCommandNote,
          trial: view.trial,
          liveEnv: view.liveEnv,
          signedIn: view.signedIn,
          now: view.now,
          liveStatus: view.feedError && view.core.liveMarkets.length === 0 ? "error" : view.core.liveMarkets.length ? "ok" : "loading",
          liveError: view.feedError,
          liveFetchedAt: view.tapeAt,
          bookStatus: view.quotesAt && view.now - view.quotesAt < 10_000 ? "live" : alive ? "connecting" : "down",
        });
        return;
      }
      // No worker has ever written state: run the same ledger in this tab.
      set({ source: "local", liveEnv: view.liveEnv, signedIn: view.signedIn, workerAlive: false });
    } catch {
      if (get().source === "connecting") set({ source: "local" });
    }
  },

  tick: () => {
    const s = get();
    if (!s.booted || s.source !== "local") return;
    const now = Date.now();
    const core = tickCore(pickCore(s), { now, spot: s.spot || null });
    set({ ...core, now, trial: localTrial(core, now) });
    if (core.tickCount % 5 === 0) writeLocal(core);
  },

  refreshLive: async () => {
    const s = get();
    if (s.source !== "local") return;
    if (s.liveStatus !== "ok") set({ liveStatus: "loading" });
    try {
      const tape = await fetchTape();
      const now = Date.now();
      let core = applyTape(pickCore(get()), tape, {}, now);
      const held = core.positions.filter((p) => p.status === "open" && p.kind === "live").map((p) => p.marketId.replace(/^poly-/, ""));
      let resolutions: Record<string, boolean> = {};
      if (held.length) resolutions = await fetchResolutionsFn({ data: { ids: held } }).catch(() => ({}));
      core = tickCore(core, { now, spot: tape.spot, spotSource: tape.spotSource, spotFresh: Boolean(tape.spot), spotDtMs: 12_000, resolutions });
      set({
        ...core,
        now,
        liveStatus: tape.error && core.liveMarkets.length === 0 ? "error" : "ok",
        liveError: tape.error,
        liveFetchedAt: tape.fetchedAt,
        trial: localTrial(core, now),
      });
    } catch {
      set({ liveStatus: "error", liveError: "Could not reach the public market feed." });
    }
  },

  applyLiveQuotes: (quotes) => {
    if (get().source !== "local" || quotes.length === 0) return;
    set(applyQuotes(pickCore(get()), quotes, Date.now()));
  },

  setBookStatus: (status) => {
    if (get().source !== "local" || get().bookStatus === status) return;
    set({ bookStatus: status });
  },

  dispatch: async (cmd) => {
    const s = get();
    if (s.source === "local") {
      if (cmd.type.startsWith("live")) {
        set({ commandNote: s.signedIn ? "The worker has not picked up your desk yet. Start it with npm run worker; live needs it." : "Sign in to use the server desk and live trading. The browser desk is paper only." });
        return;
      }
      const now = Date.now();
      const core = applyCommand(pickCore(s), cmd, now);
      set({ ...core, now, trial: localTrial(core, now) });
      writeLocal(core);
      return;
    }
    if (s.source === "server-offline") {
      set({ commandNote: "The desk worker is offline. Start it with npm run worker; commands queue until it is back." });
    }
    try {
      const res = await sendCommand({ data: { cmd } });
      set({ commandNote: res.ok ? null : (res.error ?? "Command refused") });
      window.setTimeout(() => void get().syncServer(), 600);
    } catch {
      set({ commandNote: "Could not reach the server." });
    }
  },

  approve: (signalId) => void get().dispatch({ type: "approve", signalId }),
  reject: (signalId) => void get().dispatch({ type: "reject", signalId }),
  setMode: (mode) => void get().dispatch({ type: "setMode", mode }),
  setKilled: (on) => void get().dispatch({ type: "setKilled", on }),
  updateRisk: (risk) => void get().dispatch({ type: "updateRisk", risk }),
  flatten: (positionId) => void get().dispatch({ type: "flatten", positionId }),
  simulateMismatch: () => void get().dispatch({ type: "simulateMismatch" }),
  clearMismatch: () => void get().dispatch({ type: "clearMismatch" }),
  markAlertsRead: () => void get().dispatch({ type: "markAlertsRead" }),
  resetTrial: () => void get().dispatch({ type: "resetTrial" }),

  setTheme: (theme) => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
    set({ theme });
  },

  runStudy: () => set({ backtest: runBacktest(get().risk) }),
}));

export { MODEL_VERSION };
