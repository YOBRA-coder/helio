import { h as yesProbability, i as STARTING_CASH, l as evaluateOpportunity, n as DEFAULT_RISK, p as realizedVol, r as MODEL_VERSION, u as feePerShare } from "./engine-BmNSrsOt.mjs";
import { dataDir, writeAtomic } from "./desk-io-e10SEdvf.mjs";
import { a as getJson, c as num, l as parseResolution, t as asRecord } from "./tape-fetch-xqAH3ngP.mjs";
import { join } from "node:path";
import { mkdir, readFile } from "node:fs/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/backtest-job-DZv9Lh3t.js
/**
* Real-data backtest: replays the live decision rules over resolved Polymarket windows using the
* information that existed at each decision time (candles strictly before it, the last market price
* at or before it). Pure: takes a Dataset, returns a report.
*/
function lastAtOrBefore(rows, t, maxAge) {
	let lo = 0;
	let hi = rows.length - 1;
	let ans = -1;
	while (lo <= hi) {
		const mid = lo + hi >> 1;
		if (rows[mid][0] <= t) {
			ans = mid;
			lo = mid + 1;
		} else hi = mid - 1;
	}
	if (ans < 0) return null;
	return t - rows[ans][0] <= maxAge ? rows[ans] : null;
}
var CandleIndex = class {
	t;
	rows;
	constructor(rows) {
		this.rows = rows;
		this.t = rows.map((r) => r[0]);
	}
	/** Index of the candle that starts at `ms` (exact minute), or -1. */
	at(ms) {
		let lo = 0;
		let hi = this.t.length - 1;
		while (lo <= hi) {
			const mid = lo + hi >> 1;
			if (this.t[mid] === ms) return mid;
			if (this.t[mid] < ms) lo = mid + 1;
			else hi = mid - 1;
		}
		return -1;
	}
	open(i) {
		return this.rows[i][1];
	}
	close(i) {
		return this.rows[i][4];
	}
	closes(from, to) {
		const out = [];
		for (let i = Math.max(0, from); i <= to && i < this.rows.length; i += 1) out.push(this.rows[i][4]);
		return out;
	}
};
function decisionTimes(m) {
	const len = m.endAt - m.startAt;
	const step = Math.max(6e4, Math.round(len / 48 / 6e4) * 6e4);
	const out = [];
	for (let t = m.startAt + 6e4; t <= m.endAt - 6e4; t += step) out.push(t);
	return out;
}
function snapshots(m, ci) {
	const startMin = Math.floor(m.startAt / 6e4) * 6e4;
	const openIdx = ci.at(startMin);
	if (openIdx < 0) return [];
	const open = ci.open(openIdx);
	const out = [];
	for (const t of decisionTimes(m)) {
		const idx = ci.at(Math.floor(t / 6e4) * 6e4 - 6e4);
		if (idx < 0) continue;
		const px = lastAtOrBefore(m.prices, Math.floor(t / 1e3), 180);
		if (!px) continue;
		const hist = ci.closes(idx - 40, idx);
		out.push({
			t,
			spot: ci.close(idx),
			open,
			vol: realizedVol(hist, 6e4),
			mid: px[1]
		});
	}
	return out;
}
function synth(m, s, half) {
	return {
		id: m.id,
		kind: "live",
		question: `${m.question || "Bitcoin"} Up or Down`,
		outcomes: ["Up", "Down"],
		status: "open",
		startAt: m.startAt,
		endAt: m.endAt,
		strikeLow: null,
		strikeHigh: null,
		openSpot: s.open,
		resolution: "historical replay of a resolved Polymarket window ".repeat(2),
		sourceUrl: null,
		metadataOk: true,
		restricted: false,
		yesBid: Math.max(.01, s.mid - half),
		yesAsk: Math.min(.99, s.mid + half),
		liquidity: Math.max(m.liquidity, 5e3),
		volume: 0,
		updatedAt: s.t,
		source: "replay",
		group: m.group,
		yesTokenId: null,
		noTokenId: null,
		conditionId: null,
		gammaId: m.id
	};
}
function replay(markets, ci, params, base, half) {
	const risk = {
		...base,
		minEdge: params.minEdge,
		uncertaintyHaircut: params.uncertaintyHaircut
	};
	const trades = [];
	let equity = STARTING_CASH;
	const open = [];
	const placed = [];
	for (const m of markets) for (const s of snapshots(m, ci)) {
		const live = open.filter((o) => o.endAt > s.t);
		open.length = 0;
		open.push(...live);
		const exposure = open.reduce((a, o) => a + o.stake, 0);
		const lastHour = placed.filter((t) => s.t - t < 36e5).length;
		const opp = evaluateOpportunity(synth(m, s, half), s.spot, s.t, risk, equity, exposure, lastHour, false, null, {
			vol: s.vol,
			blendW: params.blendW
		});
		if (opp.hardFail) continue;
		const won = opp.side === "yes" === m.yesWon;
		const fee = opp.shares * feePerShare(opp.executablePrice, risk);
		const pnl = opp.shares * (won ? 1 : 0) - opp.shares * opp.executablePrice - fee;
		equity += pnl;
		open.push({
			endAt: m.endAt,
			stake: opp.debit
		});
		placed.push(s.t);
		trades.push({
			marketId: m.id,
			group: m.group,
			at: s.t,
			endAt: m.endAt,
			side: opp.side,
			price: opp.executablePrice,
			stake: opp.debit,
			pnl,
			fee,
			won,
			edge: opp.edge,
			pYes: opp.yesProbability,
			mid: s.mid
		});
		break;
	}
	return trades;
}
function periodOf(name, rows, start, skipped) {
	let eq = start;
	let peak = eq;
	let dd = 0;
	const curve = [{
		t: 0,
		equity: eq
	}];
	let gw = 0;
	let gl = 0;
	let wins = 0;
	let losses = 0;
	let fees = 0;
	rows.forEach((r, i) => {
		eq += r.pnl;
		fees += r.fee;
		if (r.pnl > 0) {
			wins += 1;
			gw += r.pnl;
		} else {
			losses += 1;
			gl -= r.pnl;
		}
		peak = Math.max(peak, eq);
		dd = Math.max(dd, peak - eq);
		curve.push({
			t: i + 1,
			equity: Math.round(eq * 100) / 100
		});
	});
	const sample = rows.slice(0, 8).map((r) => ({
		price: r.price,
		won: r.won,
		pnl: r.pnl,
		rejected: false
	}));
	return {
		name,
		trades: rows.length,
		wins,
		losses,
		rejected: skipped,
		netPnl: eq - start,
		fees,
		profitFactor: gl > 0 ? gw / gl : gw > 0 ? Infinity : 0,
		expectancy: rows.length ? (gw - gl) / rows.length : 0,
		maxDrawdown: dd,
		winRate: rows.length ? wins / rows.length : 0,
		avgWin: wins ? gw / wins : 0,
		avgLoss: losses ? -gl / losses : 0,
		curve,
		sample
	};
}
function brierAt(markets, ci, vol = true) {
	let n = 0;
	let bm = 0;
	let bk = 0;
	for (const m of markets) {
		const snaps = snapshots(m, ci);
		if (!snaps.length) continue;
		const s = snaps[Math.floor(snaps.length / 2)];
		const p = yesProbability(synth(m, s, .01), s.spot, s.t, vol ? s.vol : null).p;
		const y = m.yesWon ? 1 : 0;
		bm += (p - y) ** 2;
		bk += (s.mid - y) ** 2;
		n += 1;
	}
	return n ? {
		n,
		model: bm / n,
		market: bk / n
	} : null;
}
function runRealBacktest(data, opts = {}) {
	const half = opts.halfSpread ?? .01;
	const risk = {
		...DEFAULT_RISK,
		...opts.risk ?? {}
	};
	const minSel = opts.minTradesToSelect ?? 20;
	const ci = new CandleIndex(data.candles);
	const usable = data.markets.filter((m) => snapshots(m, ci).length > 0).sort((a, b) => a.endAt - b.endAt);
	const n = usable.length;
	const cut1 = Math.floor(n * .5);
	const cut2 = Math.floor(n * .75);
	const train = usable.slice(0, cut1);
	const val = usable.slice(cut1, cut2);
	const test = usable.slice(cut2);
	const grid = [];
	for (const minEdge of [
		.02,
		.04,
		.07
	]) for (const uncertaintyHaircut of [.35, .7]) for (const blendW of [
		.25,
		.5,
		1
	]) grid.push({
		minEdge,
		uncertaintyHaircut,
		blendW
	});
	const sweep = grid.map((params) => {
		const tr = replay(train, ci, params, risk, half);
		const va = replay(val, ci, params, risk, half);
		const exp = (rows) => rows.length ? rows.reduce((a, r) => a + r.pnl, 0) / rows.length : 0;
		return {
			params,
			train: {
				trades: tr.length,
				expectancy: exp(tr)
			},
			validation: {
				trades: va.length,
				expectancy: exp(va),
				netPnl: va.reduce((a, r) => a + r.pnl, 0)
			}
		};
	});
	const chosen = sweep.filter((s) => s.validation.trades >= minSel).sort((a, b) => b.validation.expectancy - a.validation.expectancy)[0]?.params ?? {
		minEdge: risk.minEdge,
		uncertaintyHaircut: risk.uncertaintyHaircut,
		blendW: .5
	};
	const trTrades = replay(train, ci, chosen, risk, half);
	const vaTrades = replay(val, ci, chosen, risk, half);
	const teTrades = replay(test, ci, chosen, risk, half);
	const deTrades = replay(test, ci, {
		minEdge: risk.minEdge,
		uncertaintyHaircut: risk.uncertaintyHaircut,
		blendW: .5
	}, risk, half);
	let cursor = STARTING_CASH;
	const periods = [];
	for (const [name, rows, mk] of [
		[
			"train",
			trTrades,
			train
		],
		[
			"validation",
			vaTrades,
			val
		],
		[
			"test",
			teTrades,
			test
		]
	]) {
		const p = periodOf(name, rows, cursor, mk.length - rows.length);
		periods.push(p);
		cursor += p.netPnl;
	}
	const defaultTest = periodOf("test", deTrades, STARTING_CASH, test.length - deTrades.length);
	const all = [
		...trTrades,
		...vaTrades,
		...teTrades
	];
	const byGroup = [...new Set(all.map((r) => r.group))].map((g) => {
		const rows = all.filter((r) => r.group === g);
		return {
			group: g,
			trades: rows.length,
			netPnl: rows.reduce((a, r) => a + r.pnl, 0),
			winRate: rows.filter((r) => r.pnl > 0).length / rows.length
		};
	});
	const brier = brierAt(usable, ci);
	const t = periods[2];
	const verdict = n < 100 ? `Only ${n} usable windows. Too little data to conclude anything; fetch more days.` : t.trades < 30 ? `The chosen rules traded only ${t.trades} times in the untouched test slice, so the result is not meaningful.` : brier && brier.model >= brier.market ? "The model's probabilities are no better than the market price on this data. Any edge shown is most likely noise or selection." : t.netPnl > 0 && t.profitFactor >= 1.1 ? "Test slice is profitable after costs and the model beats the market price on Brier. Promising, not proof: confirm in the live paper trial." : "Test slice is not profitable after costs. Do not go live on this model.";
	return {
		kind: "real-data",
		modelVersion: MODEL_VERSION,
		ranAt: Date.now(),
		range: {
			from: data.from,
			to: data.to
		},
		marketsUsed: n,
		marketsSkipped: data.markets.length - n,
		halfSpread: half,
		chosen,
		periods,
		defaultTest,
		sweep,
		brier,
		byGroup,
		notes: data.notes,
		verdict,
		assumptions: [
			`Replays resolved Polymarket Up/Down windows. Decisions use only candles that closed before the decision minute and the last market price at or before it.`,
			`Quotes are rebuilt from the price history as mid ± ${(half * 100).toFixed(1)}¢. Real books can be wider or thinner, so fills here are optimistic.`,
			`Costs: Polymarket taker fee ${(feePerShare(.5, risk) * 100).toFixed(2)}¢ per share at 50¢, slippage ${(risk.slippage * 100).toFixed(2)}¢, flat stake up to $${risk.maxStake}, one position per window, exposure and hourly caps respected.`,
			`Parameters (minimum edge, haircut) are picked on the validation slice only; the test slice is touched once. Slices are chronological thirds of 50/25/25 percent of windows.`,
			`BTC prints are Coinbase 1-minute candles; Polymarket resolves on its own source, so edge cases can differ.`,
			`Liquidity history is not available, so windows count as liquid (at least $5k).`
		]
	};
}
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
var SERIES = [
	{
		group: "5m",
		slug: "btc-up-or-down-5m",
		ms: 3e5
	},
	{
		group: "15m",
		slug: "btc-up-or-down-15m",
		ms: 9e5
	},
	{
		group: "1h",
		slug: "btc-up-or-down-hourly",
		ms: 36e5
	},
	{
		group: "4h",
		slug: "btc-up-or-down-4h",
		ms: 144e5
	}
];
function asStrings(v) {
	if (Array.isArray(v)) return v.map(String);
	if (typeof v === "string") try {
		const p = JSON.parse(v);
		return Array.isArray(p) ? p.map(String) : [];
	} catch {
		return [];
	}
	return [];
}
function parseResolvedEvent(event, group, ms) {
	const out = [];
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
		const startAt = Number.isFinite(evStart) && endAt - evStart > ms * .5 && endAt - evStart < ms * 2 ? evStart : endAt - ms;
		out.push({
			id: String(m.id),
			question: typeof m.question === "string" ? m.question : "",
			group,
			startAt,
			endAt,
			yesTokenId: tokens[0],
			yesWon,
			liquidity: num(m.liquidityNum, num(m.liquidity, 0)),
			prices: []
		});
	}
	return out;
}
function parsePriceHistory(payload) {
	const rec = asRecord(payload);
	const rows = Array.isArray(rec?.history) ? rec.history : [];
	const out = [];
	for (const r of rows) {
		const x = asRecord(r);
		const t = num(x?.t, NaN);
		const p = num(x?.p, NaN);
		if (Number.isFinite(t) && Number.isFinite(p) && p >= 0 && p <= 1) out.push([t, p]);
	}
	return out.sort((a, b) => a[0] - b[0]);
}
function parseCandles(payload) {
	if (!Array.isArray(payload)) return [];
	const out = [];
	for (const r of payload) {
		if (!Array.isArray(r) || r.length < 5) continue;
		const [t, low, high, open, close] = r.map(Number);
		if ([
			t,
			low,
			high,
			open,
			close
		].every(Number.isFinite)) out.push([
			t * 1e3,
			open,
			high,
			low,
			close
		]);
	}
	return out.sort((a, b) => a[0] - b[0]);
}
async function pool(items, n, fn) {
	let i = 0;
	await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
		while (i < items.length) {
			const k = i++;
			await fn(items[k], k);
		}
	}));
}
async function fetchDataset(opts) {
	const get = opts.getJson ?? getJson;
	const sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
	const now = opts.now ?? Date.now();
	const from = now - opts.days * 864e5;
	const conc = opts.concurrency ?? 6;
	const notes = [];
	const series = SERIES.filter((s) => !opts.groups || opts.groups.includes(s.group));
	const markets = [];
	for (const s of series) {
		let offset = 0;
		let got = 0;
		for (let page = 0; page < 60 && got < opts.maxPerSeries; page += 1) {
			opts.onProgress?.(`listing ${s.group}`, got, opts.maxPerSeries);
			let events;
			try {
				events = await get(`https://gamma-api.polymarket.com/events?series_slug=${s.slug}&closed=true&order=endDate&ascending=false&limit=100&offset=${offset}`, 12e3);
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
	let done = 0;
	await pool(markets, conc, async (m) => {
		const startTs = Math.floor(m.startAt / 1e3) - 120;
		const endTs = Math.ceil(m.endAt / 1e3) + 60;
		for (const fidelity of [1, 5]) {
			try {
				m.prices = parsePriceHistory(await get(`https://clob.polymarket.com/prices-history?market=${m.yesTokenId}&startTs=${startTs}&endTs=${endTs}&fidelity=${fidelity}`, 1e4));
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
	const candles = /* @__PURE__ */ new Map();
	if (withPrices.length) {
		const lo = Math.min(...withPrices.map((m) => m.startAt)) - 24e5;
		const hi = Math.max(...withPrices.map((m) => m.endAt)) + 6e4;
		const chunk = 18e6;
		const starts = [];
		for (let t = Math.floor(lo / 6e4) * 6e4; t < hi; t += chunk) starts.push(t);
		let c = 0;
		await pool(starts, 3, async (t) => {
			try {
				const rows = parseCandles(await get(`https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60&start=${encodeURIComponent(new Date(t).toISOString())}&end=${encodeURIComponent(new Date(Math.min(hi, t + chunk)).toISOString())}`, 12e3));
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
		notes
	};
}
/** Runs the real-data backtest as a background job and caches dataset and report on disk. Node-only. */
var g = globalThis;
var state = g.__heliosBt ??= {
	status: "idle",
	phase: "",
	done: 0,
	total: 0,
	startedAt: null,
	error: null,
	days: 0
};
function jobState() {
	return { ...state };
}
async function loadReport(dir = dataDir()) {
	try {
		return JSON.parse(await readFile(join(dir, "history", "report.json"), "utf8"));
	} catch {
		return null;
	}
}
async function loadCache(dir, days) {
	try {
		const ds = JSON.parse(await readFile(join(dir, "history", "dataset.json"), "utf8"));
		const fresh = Date.now() - ds.fetchedAt < 216e5;
		const covers = ds.to - ds.from >= days * 864e5 * .95;
		return fresh && covers ? ds : null;
	} catch {
		return null;
	}
}
async function runJob(opts, dir = dataDir()) {
	if (state.status === "running") throw new Error("A backtest is already running");
	Object.assign(state, {
		status: "running",
		phase: "starting",
		done: 0,
		total: 0,
		startedAt: Date.now(),
		error: null,
		days: opts.days
	});
	try {
		await mkdir(join(dir, "history"), { recursive: true });
		let ds = opts.useCache === false ? null : await loadCache(dir, opts.days);
		if (!ds) {
			ds = await fetchDataset({
				days: opts.days,
				maxPerSeries: opts.maxPerSeries,
				groups: opts.groups,
				onProgress: (phase, done, total) => Object.assign(state, {
					phase,
					done,
					total
				})
			});
			await writeAtomic(join(dir, "history", "dataset.json"), JSON.stringify(ds));
		}
		Object.assign(state, {
			phase: "replaying",
			done: 0,
			total: 0
		});
		const report = runRealBacktest(ds);
		await writeAtomic(join(dir, "history", "report.json"), JSON.stringify(report));
		Object.assign(state, {
			status: "done",
			phase: "done"
		});
		return report;
	} catch (e) {
		Object.assign(state, {
			status: "error",
			error: e instanceof Error ? e.message : "failed"
		});
		throw e;
	}
}
//#endregion
export { jobState, loadReport, runJob };
