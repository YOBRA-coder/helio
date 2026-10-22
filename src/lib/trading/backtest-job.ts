/** Runs the real-data backtest as a background job and caches dataset and report on disk. Node-only. */
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { runRealBacktest, type RealBacktestReport } from "./backtest.ts";
import { dataDir, writeAtomic } from "./desk-io.ts";
import { fetchDataset, type Dataset } from "./history.ts";

export interface JobState {
  status: "idle" | "running" | "done" | "error";
  phase: string;
  done: number;
  total: number;
  startedAt: number | null;
  error: string | null;
  days: number;
}

const g = globalThis as typeof globalThis & { __heliosBt?: JobState };
const state = (g.__heliosBt ??= { status: "idle", phase: "", done: 0, total: 0, startedAt: null, error: null, days: 0 });

export function jobState(): JobState {
  return { ...state };
}

export async function loadReport(dir = dataDir()): Promise<RealBacktestReport | null> {
  try {
    return JSON.parse(await readFile(join(dir, "history", "report.json"), "utf8")) as RealBacktestReport;
  } catch {
    return null;
  }
}

async function loadCache(dir: string, days: number): Promise<Dataset | null> {
  try {
    const ds = JSON.parse(await readFile(join(dir, "history", "dataset.json"), "utf8")) as Dataset;
    const fresh = Date.now() - ds.fetchedAt < 6 * 3_600_000;
    const covers = ds.to - ds.from >= days * 86_400_000 * 0.95;
    return fresh && covers ? ds : null;
  } catch {
    return null;
  }
}

export async function runJob(opts: { days: number; maxPerSeries: number; groups?: string[]; useCache?: boolean }, dir = dataDir()): Promise<RealBacktestReport> {
  if (state.status === "running") throw new Error("A backtest is already running");
  Object.assign(state, { status: "running", phase: "starting", done: 0, total: 0, startedAt: Date.now(), error: null, days: opts.days });
  try {
    await mkdir(join(dir, "history"), { recursive: true });
    let ds = opts.useCache === false ? null : await loadCache(dir, opts.days);
    if (!ds) {
      ds = await fetchDataset({
        days: opts.days,
        maxPerSeries: opts.maxPerSeries,
        groups: opts.groups,
        onProgress: (phase, done, total) => Object.assign(state, { phase, done, total }),
      });
      await writeAtomic(join(dir, "history", "dataset.json"), JSON.stringify(ds));
    }
    Object.assign(state, { phase: "replaying", done: 0, total: 0 });
    const report = runRealBacktest(ds);
    await writeAtomic(join(dir, "history", "report.json"), JSON.stringify(report));
    Object.assign(state, { status: "done", phase: "done" });
    return report;
  } catch (e) {
    Object.assign(state, { status: "error", error: e instanceof Error ? e.message : "failed" });
    throw e;
  }
}
