/**
 * Historical data for the real-data backtest: resolved Polymarket BTC windows, their YES price
 * history, and Coinbase 1-minute candles. All network access goes through an injectable `GetJson`
 * so the pipeline can be tested with fixtures. Runs server-side or from the CLI, never in the browser.
 *
 * Endpoints (public, no key):
 *   gamma-api.polymarket.com/events?series_slug=…&closed=true      resolved windows
 *   clob.polymarket.com/prices-history?market=<yesToken>&…         YES price history
 *   api.exchange.coinbase.com/products/BTC-USD/candles             BTC 1-minute candles
 */
import { asRecord, getJson as defaultGetJson, num, parseResolution } from "./tape-fetch.ts";

export type GetJson = (url: string, ms?: number) => Promise<unknown>;

export interface HistMarket {
  id: string;
  question: string;
  group: string;
  startAt: number;
  endAt: number;
  yesTokenId: string;
  yesWon: boolean;
  liquidity: number;
  /** [unix seconds, YES price] ascending. */
  prices: Array<[number, number]>;
}

export interface Dataset {
  fetchedAt: number;
  from: number;
  to: number;
  /** [ms, open, high, low, close] ascending, 1-minute. */
  candles: Array<[number, number, number, number, number]>;
  markets: HistMarket[];
  notes: string[];
}

export const SERIES: Array<{ group: string; slug: string; ms: number }> = [
  { group: "5m", slug: "btc-up-or-down-5m", ms: 5 * 60_000 },
  { group: "15m", slug: "btc-up-or-down-15m", ms: 15 * 60_000 },
  { group: "1h", slug: "btc-up-or-down-hourly", ms: 60 * 60_000 },
  { group: "4h", slug: "btc-up-or-down-4h", ms: 4 * 60 * 60_000 },
];

export interface FetchOpts {
  days: number;
  maxPerSeries: number;
  groups?: string[];
  concurrency?: number;
  now?: number;
  onProgress?: (phase: string, done: number, total: number) => void;
  getJson?: GetJson;
  sleep?: (ms: number) => Promise<void>;
}

function asStrings(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v) as unknown;
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function parseResolvedEvent(event: Record<string, unknown>, group: string, ms: number): HistMarket[] {
  const out: HistMarket[] = [];
  const list = Array.isArray(event.markets) ? event.markets : [];
  for (const raw of list) {
    const m = asRecord(raw);
    if (!m) continue;
    const yesWon = parseResolution(m);
    if (yesWon == null) continue;
    const tokens = asStrings(m.clobTokenIds).filter((t) => /^\d{10,}$/.test(t));
    const endAt = Date.parse(typeof m.endDate === "string" ? m.endDate : "");
    if (!tokens[0] || !Number.isFinite(endAt) || m.id == null) continue;
    const evStart = Date.parse(typeof m.eventStartTime === "string" ? m.eventStartTime : "");
    const startAt = Number.isFinite(evStart) && endAt - evStart > ms * 0.5 && endAt - evStart < ms * 2 ? evStart : endAt - ms;
    out.push({
      id: String(m.id),
      question: typeof m.question === "string" ? m.question : "",
      group,
      startAt,
      endAt,
      yesTokenId: tokens[0],
      yesWon,
      liquidity: num(m.liquidityNum, num(m.liquidity, 0)),
      prices: [],
    });
  }
  return out;
}

export function parsePriceHistory(payload: unknown): Array<[number, number]> {
  const rec = asRecord(payload);
  const rows = Array.isArray(rec?.history) ? rec.history : [];
  const out: Array<[number, number]> = [];
  for (const r of rows) {
    const x = asRecord(r);
    const t = num(x?.t, NaN);
    const p = num(x?.p, NaN);
    if (Number.isFinite(t) && Number.isFinite(p) && p >= 0 && p <= 1) out.push([t, p]);
  }
  return out.sort((a, b) => a[0] - b[0]);
}

export function parseCandles(payload: unknown): Array<[number, number, number, number, number]> {
  if (!Array.isArray(payload)) return [];
  const out: Array<[number, number, number, number, number]> = [];
  for (const r of payload) {
    if (!Array.isArray(r) || r.length < 5) continue;
    const [t, low, high, open, close] = r.map(Number);
    if ([t, low, high, open, close].every(Number.isFinite)) out.push([t * 1000, open, high, low, close]);
  }
  return out.sort((a, b) => a[0] - b[0]);
}

async function pool<T>(items: T[], n: number, fn: (x: T, i: number) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        await fn(items[k], k);
      }
    }),
  );
}

export async function fetchDataset(opts: FetchOpts): Promise<Dataset> {
  const get = opts.getJson ?? defaultGetJson;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = opts.now ?? Date.now();
  const from = now - opts.days * 86_400_000;
  const conc = opts.concurrency ?? 6;
  const notes: string[] = [];
  const series = SERIES.filter((s) => !opts.groups || opts.groups.includes(s.group));

  // 1. resolved windows, newest first, paged until the cutoff or the cap
  const markets: HistMarket[] = [];
  for (const s of series) {
    let offset = 0;
    let got = 0;
    for (let page = 0; page < 60 && got < opts.maxPerSeries; page += 1) {
      opts.onProgress?.(`listing ${s.group}`, got, opts.maxPerSeries);
      let events: unknown;
      try {
        events = await get(
          `https://gamma-api.polymarket.com/events?series_slug=${s.slug}&closed=true&order=endDate&ascending=false&limit=100&offset=${offset}`,
          12_000,
        );
      } catch (e) {
        notes.push(`${s.group}: listing failed (${e instanceof Error ? e.message : "error"}) after ${got} markets`);
        break;
      }
      const rows = Array.isArray(events) ? events : [];
      if (rows.length === 0) break;
      let oldest = Infinity;
      for (const ev of rows) {
        const e = asRecord(ev);
        if (!e) continue;
        for (const m of parseResolvedEvent(e, s.group, s.ms)) {
          oldest = Math.min(oldest, m.endAt);
          if (m.endAt >= from && m.endAt <= now && got < opts.maxPerSeries) {
            markets.push(m);
            got += 1;
          }
        }
      }
      if (oldest < from) break;
      offset += rows.length;
      await sleep(150);
    }
    if (got === 0) notes.push(`${s.group}: no resolved windows returned`);
  }

  // 2. YES price history per market
  let done = 0;
  await pool(markets, conc, async (m) => {
    const startTs = Math.floor(m.startAt / 1000) - 120;
    const endTs = Math.ceil(m.endAt / 1000) + 60;
    for (const fidelity of [1, 5]) {
      try {
        m.prices = parsePriceHistory(await get(`https://clob.polymarket.com/prices-history?market=${m.yesTokenId}&startTs=${startTs}&endTs=${endTs}&fidelity=${fidelity}`, 10_000));
      } catch {
        m.prices = [];
      }
      if (m.prices.length >= 3) break;
    }
    done += 1;
    if (done % 10 === 0) opts.onProgress?.("price history", done, markets.length);
    await sleep(40);
  });
  opts.onProgress?.("price history", markets.length, markets.length);
  const withPrices = markets.filter((m) => m.prices.length >= 3);
  if (withPrices.length < markets.length) notes.push(`${markets.length - withPrices.length} of ${markets.length} windows had no usable price history and were skipped.`);

  // 3. BTC candles covering the span, 300 per request
  const candles = new Map<number, [number, number, number, number, number]>();
  if (withPrices.length) {
    const lo = Math.min(...withPrices.map((m) => m.startAt)) - 40 * 60_000;
    const hi = Math.max(...withPrices.map((m) => m.endAt)) + 60_000;
    const chunk = 300 * 60_000;
    const starts: number[] = [];
    for (let t = Math.floor(lo / 60_000) * 60_000; t < hi; t += chunk) starts.push(t);
    let c = 0;
    await pool(starts, 3, async (t) => {
      try {
        const rows = parseCandles(
          await get(`https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60&start=${encodeURIComponent(new Date(t).toISOString())}&end=${encodeURIComponent(new Date(Math.min(hi, t + chunk)).toISOString())}`, 12_000),
        );
        for (const r of rows) candles.set(r[0], r);
      } catch (e) {
        notes.push(`candles ${new Date(t).toISOString()} failed (${e instanceof Error ? e.message : "error"})`);
      }
      c += 1;
      opts.onProgress?.("candles", c, starts.length);
      await sleep(120);
    });
  }
  return {
    fetchedAt: now,
    from,
    to: now,
    candles: [...candles.values()].sort((a, b) => a[0] - b[0]),
    markets: withPrices.sort((a, b) => a.endAt - b.endAt),
    notes,
  };
}
