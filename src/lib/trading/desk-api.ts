import { createServerFn } from "@tanstack/react-start";
import type { DeskCommand, DeskCore } from "./types.ts";
import type { GateCheck, TrialSummary } from "./trial.ts";

/** What the browser sees: the core with the heavy arrays trimmed, plus server-computed trial stats. */
export interface DeskView {
  alive: boolean;
  heartbeatAgeMs: number | null;
  workerStartedAt: number | null;
  tapeAt: number;
  quotesAt: number;
  feedError: string | null;
  lastCommandNote: string | null;
  core: DeskCore | null;
  trial: {
    summary: TrialSummary;
    checks: GateCheck[];
    eligible: boolean;
    power: string;
    calibration: string;
    recent: DeskCore["scores"];
  } | null;
  liveEnv: { enabled: boolean; hasKey: boolean; hasFunder: boolean; hasOwnerToken: boolean };
  signedIn: boolean;
  now: number;
}

const COMMAND_TYPES = new Set([
  "approve", "reject", "setMode", "setKilled", "updateRisk", "flatten", "simulateMismatch",
  "clearMismatch", "markAlertsRead", "resetTrial", "liveSetStatus", "liveUpdate", "liveSend",
]);

export const getDesk = createServerFn({ method: "GET" }).handler(async (): Promise<DeskView> => {
  const { readSnapshot, HEARTBEAT_STALE_MS } = await import("./desk-io.ts");
  const sess = await import("../accounts/session.server.ts");
  const { summarize, evaluateGate, powerNote, calibrationNote, DEFAULT_GATE } = await import("./trial.ts");
  const { STARTING_CASH } = await import("./engine.ts");
  const { liveEnv } = await import("./live.ts");
  const now = Date.now();
  const user = await sess.currentUser();
  const env = { ...liveEnv(), hasOwnerToken: true };
  const snap = user ? await readSnapshot(sess.accounts().userDir(user.id)) : null;
  if (!snap) {
    return {
      alive: false, heartbeatAgeMs: null, workerStartedAt: null, tapeAt: 0, quotesAt: 0, feedError: null,
      lastCommandNote: null, core: null, trial: null, liveEnv: env, signedIn: Boolean(user), now,
    };
  }
  const age = snap.heartbeat > 0 ? now - snap.heartbeat : null;
  const summary = summarize(snap.core, now, STARTING_CASH);
  const gate = evaluateGate(summary, snap.core.risk.drawdownLimit, DEFAULT_GATE);
  const trimmed: DeskCore = {
    ...snap.core,
    scores: [],
    hist: Object.fromEntries(Object.entries(snap.core.hist ?? {}).map(([k, v]) => [k, v.slice(-150)])),
    curve: snap.core.curve.slice(-600),
    audit: snap.core.audit.slice(0, 120),
    signals: snap.core.signals.slice(0, 60),
    orders: snap.core.orders.slice(0, 60),
    fills: snap.core.fills.slice(0, 60),
    positions: snap.core.positions.slice(0, 80),
    spots: snap.core.spots.slice(-120),
  };
  return {
    alive: age != null && age < HEARTBEAT_STALE_MS,
    heartbeatAgeMs: age,
    workerStartedAt: snap.workerStartedAt,
    tapeAt: snap.tapeAt,
    quotesAt: snap.quotesAt,
    feedError: snap.feedError,
    lastCommandNote: snap.lastCommandNote,
    core: trimmed,
    trial: { summary, checks: gate.checks, eligible: gate.eligible, power: powerNote(summary), calibration: calibrationNote(summary), recent: snap.core.scores.slice(0, 40) },
    liveEnv: snap.liveEnv,
    signedIn: true,
    now,
  };
});

export const sendCommand = createServerFn({ method: "POST" })
  .validator((input: { cmd: DeskCommand }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const { enqueueCommand } = await import("./desk-io.ts");
    const sess = await import("../accounts/session.server.ts");
    sess.assertSameSite();
    const user = await sess.currentUser();
    if (!user) return { ok: false, error: "Sign in to control the server desk." };
    const cmd = data.cmd;
    if (!cmd || typeof cmd.type !== "string" || !COMMAND_TYPES.has(cmd.type)) return { ok: false, error: "Unknown command" };
    await enqueueCommand(sess.accounts().userDir(user.id), cmd);
    return { ok: true };
  });

export interface BacktestView {
  job: { status: "idle" | "running" | "done" | "error"; phase: string; done: number; total: number; startedAt: number | null; error: string | null; days: number };
  report: import("./backtest.ts").RealBacktestReport | null;
}

export const getBacktest = createServerFn({ method: "GET" }).handler(async (): Promise<BacktestView> => {
  const { jobState, loadReport } = await import("./backtest-job.ts");
  return { job: jobState(), report: await loadReport() };
});

export const startBacktest = createServerFn({ method: "POST" })
  .validator((i: { days: number; max: number }) => i)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const sess = await import("../accounts/session.server.ts");
    sess.assertSameSite();
    if (!(await sess.currentUser())) return { ok: false, error: "Sign in to run a real-data backtest." };
    const { jobState, runJob } = await import("./backtest-job.ts");
    if (jobState().status === "running") return { ok: false, error: "A backtest is already running." };
    const days = Math.min(30, Math.max(1, Math.round(Number(data.days) || 7)));
    const max = Math.min(1500, Math.max(50, Math.round(Number(data.max) || 400)));
    void runJob({ days, maxPerSeries: max, useCache: false }).catch(() => {});
    return { ok: true };
  });

const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

/** Everything that makes up the desk (book, scores, trial clock, limits). Keys and passwords are never included. */
export const exportBackup = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ ok: boolean; error?: string; filename?: string; json?: string }> => {
    const { readSnapshot } = await import("./desk-io.ts");
    const sess = await import("../accounts/session.server.ts");
    sess.assertSameSite();
    const user = await sess.currentUser();
    if (!user) return { ok: false, error: "Sign in first." };
    const snap = await readSnapshot(sess.accounts().userDir(user.id));
    if (!snap) return { ok: false, error: "No desk data yet. Start the worker first." };
    const body = { kind: "helios-backup", version: 1, exportedAt: new Date().toISOString(), core: snap.core };
    return { ok: true, filename: `helios-backup-${new Date().toISOString().slice(0, 10)}.json`, json: JSON.stringify(body) };
  },
);

export const restoreBackup = createServerFn({ method: "POST" })
  .validator((i: { json: string }) => i)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const { writeRestore, readSnapshot, backupSnapshot } = await import("./desk-io.ts");
    const sess = await import("../accounts/session.server.ts");
    sess.assertSameSite();
    const user = await sess.currentUser();
    if (!user) return { ok: false, error: "Sign in first." };
    if (typeof data.json !== "string" || data.json.length > MAX_BACKUP_BYTES) return { ok: false, error: "That file is too large to be a Helios backup." };
    let parsed: { kind?: unknown; version?: unknown; core?: Record<string, unknown> };
    try {
      parsed = JSON.parse(data.json);
    } catch {
      return { ok: false, error: "That is not valid JSON." };
    }
    const c = parsed.core;
    if (parsed.kind !== "helios-backup" || !c || typeof c !== "object" || !Array.isArray(c.positions) || !Array.isArray(c.scores) || typeof c.cash !== "number") {
      return { ok: false, error: "That file is not a Helios backup." };
    }
    const dir = sess.accounts().userDir(user.id);
    if (await readSnapshot(dir)) await backupSnapshot(dir); // keep the current desk as desk.bak.json before replacing it
    await writeRestore(dir, JSON.stringify({ core: c }));
    return { ok: true };
  });
