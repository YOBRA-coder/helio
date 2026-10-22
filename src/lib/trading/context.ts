/**
 * Context signals: what the wider world is saying while Helios trades BTC windows.
 *
 * Sources, cheapest first:
 *  1. Polymarket itself (free, no key): crowd probabilities on BTC / macro markets.
 *  2. alternative.me Fear & Greed (free, no key).
 *  3. World Monitor (optional, needs a paid API key): its own Fear & Greed read and
 *     prediction-market search. Its prediction endpoint is a relay of Polymarket's Gamma
 *     data, so it adds nothing for Polymarket prices; the value is the extra regime data.
 *
 * Nothing here is allowed to create trades. It can only (a) shrink stake in extreme regimes,
 * (b) block trading with a stated reason, or (c) when explicitly enabled, nudge long-horizon
 * probabilities by at most ±2 points. Every use is logged on the signal so the trial can
 * measure whether context helped or hurt.
 */
import { getJson, asRecord, num } from "./tape-fetch.ts";
import type { ContextItem, ContextSnapshot } from "./types.ts";

export interface ContextConfig {
  worldMonitorKey?: string;
  worldMonitorBase?: string;
  tiltEnabled?: boolean;
}

const CROWD_RE = /(bitcoin|\bbtc\b|crypto|\bfed\b|rate cut|recession|tariff|\betf\b|inflation|\bcpi\b)/i;

export function emptyContext(now: number): ContextSnapshot {
  return {
    fetchedAt: now,
    fearGreed: null,
    tilt: 0,
    stakeScale: 1,
    blockReason: null,
    items: [],
    crowd: [],
    worldMonitor: { status: "off", detail: "No World Monitor key configured.", at: now },
  };
}

export async function fetchFearGreed(): Promise<number | null> {
  try {
    const json = asRecord(await getJson("https://api.alternative.me/fng/?limit=1", 6000));
    const row = Array.isArray(json?.data) ? asRecord(json.data[0]) : null;
    const v = num(row?.value, NaN);
    return Number.isFinite(v) && v >= 0 && v <= 100 ? v : null;
  } catch {
    return null;
  }
}

export function parseCrowd(payload: unknown): ContextSnapshot["crowd"] {
  const rows = Array.isArray(payload) ? payload : [];
  const out: ContextSnapshot["crowd"] = [];
  for (const raw of rows) {
    const m = asRecord(raw);
    if (!m) continue;
    const title = typeof m.question === "string" ? m.question : "";
    if (!title || !CROWD_RE.test(title)) continue;
    let prices: unknown = m.outcomePrices;
    if (typeof prices === "string") {
      try {
        prices = JSON.parse(prices);
      } catch {
        prices = [];
      }
    }
    const yes = Array.isArray(prices) ? num(prices[0], NaN) : NaN;
    if (!Number.isFinite(yes)) continue;
    const ev = Array.isArray(m.events) ? asRecord(m.events[0]) : null;
    const slug = typeof ev?.slug === "string" ? ev.slug : null;
    out.push({
      title,
      yes,
      volume: num(m.volume24hr, num(m.volumeNum, 0)),
      url: slug ? `https://polymarket.com/event/${slug}` : null,
      source: "Polymarket",
    });
    if (out.length >= 8) break;
  }
  return out;
}

export async function fetchCrowd(): Promise<ContextSnapshot["crowd"]> {
  try {
    const payload = await getJson(
      "https://gamma-api.polymarket.com/markets?closed=false&active=true&order=volume24hr&ascending=false&limit=100",
      8000,
    );
    return parseCrowd(payload);
  } catch {
    return [];
  }
}

/** World Monitor adapter. Returns status instead of throwing: the desk must run without it. */
export async function fetchWorldMonitor(
  cfg: ContextConfig,
  now: number,
): Promise<{ status: ContextSnapshot["worldMonitor"]; fearGreed: number | null; crowd: ContextSnapshot["crowd"] }> {
  if (!cfg.worldMonitorKey) {
    return {
      status: { status: "off", detail: "No World Monitor key configured. REST API access is a paid plan.", at: now },
      fearGreed: null,
      crowd: [],
    };
  }
  const base = (cfg.worldMonitorBase || "https://api.worldmonitor.app").replace(/\/$/, "");
  const headers = { "X-WorldMonitor-Key": cfg.worldMonitorKey, "User-Agent": "helios-desk/1.0", accept: "application/json" };
  const get = async (path: string) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(`${base}${path}`, { headers, signal: ctrl.signal });
      if (res.status === 401 || res.status === 403) throw new Error("key rejected");
      if (res.status === 429) throw new Error("rate limited");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as unknown;
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    const [fg, pm] = await Promise.all([
      get("/api/market/v1/get-fear-greed-index").catch(() => null),
      get("/api/prediction/v1/list-prediction-markets?query=bitcoin&page_size=10"),
    ]);
    const fearGreed = pickIndex(fg);
    const crowd = parseWmMarkets(pm);
    return {
      status: { status: "ok", detail: `${crowd.length} markets${fearGreed != null ? `, fear & greed ${fearGreed}` : ""}`, at: now },
      fearGreed,
      crowd,
    };
  } catch (e) {
    return {
      status: { status: "error", detail: e instanceof Error ? e.message : "request failed", at: now },
      fearGreed: null,
      crowd: [],
    };
  }
}

export function pickIndex(payload: unknown): number | null {
  const rec = asRecord(payload);
  if (!rec) return null;
  for (const key of ["value", "score", "index", "fearGreedIndex", "fear_greed_index", "current"]) {
    const v = num(rec[key], NaN);
    if (Number.isFinite(v) && v >= 0 && v <= 100) return v;
  }
  const nested = asRecord(rec.data) ?? asRecord(rec.result);
  return nested ? pickIndex(nested) : null;
}

export function parseWmMarkets(payload: unknown): ContextSnapshot["crowd"] {
  const rec = asRecord(payload);
  const rows = Array.isArray(rec?.markets) ? rec.markets : [];
  const out: ContextSnapshot["crowd"] = [];
  for (const raw of rows) {
    const m = asRecord(raw);
    if (!m) continue;
    const title = typeof m.title === "string" ? m.title : "";
    const yes = num(m.yes_price ?? m.yesPrice, NaN);
    if (!title || !Number.isFinite(yes)) continue;
    out.push({
      title,
      yes,
      volume: num(m.volume, 0),
      url: typeof m.url === "string" ? m.url : null,
      source: "World Monitor",
    });
  }
  return out;
}

/** Pure: turn raw inputs into the bounded effects the engine may use. */
export function composeContext(
  now: number,
  input: { fearGreed: number | null; crowd: ContextSnapshot["crowd"]; wm: ContextSnapshot["worldMonitor"] },
  cfg: ContextConfig,
): ContextSnapshot {
  const items: ContextItem[] = [];
  let stakeScale = 1;
  let tilt = 0;
  const fg = input.fearGreed;
  if (fg != null) {
    items.push({ label: "Fear & Greed", value: String(Math.round(fg)), source: "alternative.me / World Monitor", at: now });
    if (fg <= 12 || fg >= 88) {
      stakeScale = 0.5;
      items.push({ label: "Regime", value: "Extreme sentiment: stake halved", source: "Helios rule", at: now });
    }
    if (cfg.tiltEnabled) tilt = Math.max(-1, Math.min(1, (fg - 50) / 50));
  }
  return {
    fetchedAt: now,
    fearGreed: fg,
    tilt,
    stakeScale,
    blockReason: null,
    items,
    crowd: input.crowd.slice(0, 10),
    worldMonitor: input.wm,
  };
}

export async function loadContext(cfg: ContextConfig, now = Date.now()): Promise<ContextSnapshot> {
  const [fg, crowd, wm] = await Promise.all([fetchFearGreed(), fetchCrowd(), fetchWorldMonitor(cfg, now)]);
  return composeContext(
    now,
    {
      fearGreed: wm.fearGreed ?? fg,
      crowd: [...wm.crowd, ...crowd],
      wm: wm.status,
    },
    cfg,
  );
}
