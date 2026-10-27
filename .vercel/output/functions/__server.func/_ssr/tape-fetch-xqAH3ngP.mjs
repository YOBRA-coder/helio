import { r as __exportAll } from "../_runtime.mjs";
import { t as __exportAll$1 } from "./rolldown-runtime-D7D4PA-g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tape-fetch-xqAH3ngP.js
var tape_fetch_xqAH3ngP_exports = /* @__PURE__ */ __exportAll({
	a: () => getJson,
	c: () => num,
	i: () => fetchSpotAt,
	l: () => parseResolution,
	n: () => fetchQuotes,
	o: () => lastOpenError,
	r: () => fetchResolutions,
	s: () => loadTape,
	t: () => asRecord,
	u: () => tape_fetch_exports
});
var tape_fetch_exports = /* @__PURE__ */ __exportAll$1({
	asRecord: () => asRecord,
	fetchQuotes: () => fetchQuotes,
	fetchResolutions: () => fetchResolutions,
	fetchSpotAt: () => fetchSpotAt,
	getJson: () => getJson,
	lastOpenError: () => lastOpenError,
	loadTape: () => loadTape,
	num: () => num,
	parseResolution: () => parseResolution,
	topOfBook: () => topOfBook
});
async function getJson(url, ms = 8e3) {
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), ms);
	try {
		const res = await fetch(url, {
			signal: ctrl.signal,
			headers: {
				accept: "application/json",
				"user-agent": "helios-desk/0.4 (+paper-trading research)"
			}
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return await res.json();
	} finally {
		clearTimeout(timer);
	}
}
function num(value, fallback = 0) {
	const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
	return Number.isFinite(n) ? n : fallback;
}
function asStrings(value) {
	if (Array.isArray(value)) return value.map(String);
	if (typeof value === "string") try {
		const parsed = JSON.parse(value);
		if (Array.isArray(parsed)) return parsed.map(String);
	} catch {
		return [];
	}
	return [];
}
function priceOr(value, fallback) {
	const n = num(value, NaN);
	if (!Number.isFinite(n) || n <= 0 || n >= 1) return fallback;
	return n;
}
function bestLevel(levels, mode) {
	if (!Array.isArray(levels)) return null;
	let best = null;
	for (const row of levels) {
		const rec = asRecord(row);
		const price = num(rec?.price, NaN);
		const size = num(rec?.size, NaN);
		if (!Number.isFinite(price) || price <= 0 || price >= 1) continue;
		if (Number.isFinite(size) && size <= 0) continue;
		best = best == null ? price : mode === "max" ? Math.max(best, price) : Math.min(best, price);
	}
	return best;
}
function topOfBook(payload) {
	const rec = asRecord(payload);
	if (!rec) return null;
	const bid = bestLevel(rec.bids, "max");
	const ask = bestLevel(rec.asks, "min");
	if (bid != null && ask != null && ask >= bid) return {
		bid,
		ask
	};
	if (bid != null) return {
		bid,
		ask: Math.min(.999, Math.max(bid + .01, .999))
	};
	if (ask != null) return {
		bid: Math.max(.001, ask - .01),
		ask
	};
	return null;
}
var WINDOW_MS = {
	"5m": 3e5,
	"15m": 9e5,
	"1h": 36e5,
	"4h": 144e5
};
var SERIES = [
	["5m", "btc-up-or-down-5m"],
	["15m", "btc-up-or-down-15m"],
	["1h", "btc-up-or-down-hourly"],
	["4h", "btc-up-or-down-4h"]
];
function pushMarket(markets, seen, market, eventSlug, group, fetchedAt) {
	if (market.closed === true || market.active === false) return;
	const id = String(market.id ?? "");
	const question = typeof market.question === "string" ? market.question : "";
	if (!id || seen.has(id) || !/bitcoin/i.test(question)) return;
	const endAt = Date.parse(typeof market.endDate === "string" ? market.endDate : "");
	if (!Number.isFinite(endAt) || endAt < fetchedAt - 3e4) return;
	const startRaw = typeof market.eventStartTime === "string" ? market.eventStartTime : "";
	const parsedStart = Date.parse(startRaw);
	const dur = WINDOW_MS[group];
	const startAt = dur ? endAt - dur : parsedStart;
	const outcomes = asStrings(market.outcomes);
	const prices = asStrings(market.outcomePrices).map((p) => num(p, NaN));
	const tokens = asStrings(market.clobTokenIds).filter((token) => /^\d{10,}$/.test(token));
	const yes = Number.isFinite(prices[0]) ? prices[0] : .5;
	const spread = num(market.spread, .02);
	const bid = priceOr(market.bestBid, Math.max(.01, yes - spread / 2));
	const ask = priceOr(market.bestAsk, Math.min(.99, yes + spread / 2));
	seen.add(id);
	markets.push({
		id,
		question,
		slug: typeof market.slug === "string" ? market.slug : id,
		eventSlug,
		eventTitle: question,
		outcomes: [outcomes[0] || "Up", outcomes[1] || "Down"],
		yesPrice: yes,
		bestBid: Math.min(bid, ask),
		bestAsk: Math.max(ask, Math.min(bid, ask) + .001),
		liquidity: num(market.liquidityNum, num(market.liquidity, 0)),
		volume: num(market.volumeNum, num(market.volume, 0)),
		endAt,
		startAt: Number.isFinite(startAt) ? startAt : fetchedAt,
		description: typeof market.description === "string" ? market.description.slice(0, 700) : "",
		group,
		restricted: false,
		yesTokenId: tokens[0] ?? null,
		noTokenId: tokens[1] ?? null,
		conditionId: typeof market.conditionId === "string" ? market.conditionId : null,
		booked: false
	});
}
function asRecord(value) {
	if (value && typeof value === "object") return value;
	return null;
}
async function loadTape() {
	const fetchedAt = Date.now();
	let spot = null;
	let error = null;
	const markets = [];
	const seen = /* @__PURE__ */ new Set();
	try {
		const amount = num(asRecord(asRecord(await getJson("https://api.coinbase.com/v2/prices/BTC-USD/spot"))?.data)?.amount, NaN);
		spot = Number.isFinite(amount) ? amount : null;
	} catch {
		error = "BTC reference print unavailable";
	}
	try {
		const min = (/* @__PURE__ */ new Date(fetchedAt - 9e4)).toISOString();
		(await Promise.all(SERIES.map(([, slug]) => getJson(`https://gamma-api.polymarket.com/events?series_slug=${slug}&closed=false&active=true&end_date_min=${encodeURIComponent(min)}&limit=3&order=endDate&ascending=true`).catch(() => null)))).forEach((payload, index) => {
			const events = Array.isArray(payload) ? payload : [];
			const group = SERIES[index]?.[0] ?? "BTC";
			for (const rawEvent of events) {
				const event = asRecord(rawEvent);
				if (!event || event.closed === true) continue;
				const eventSlug = typeof event.slug === "string" ? event.slug : "";
				const list = Array.isArray(event.markets) ? event.markets : [];
				for (const raw of list) {
					const market = asRecord(raw);
					if (!market) continue;
					pushMarket(markets, seen, market, eventSlug, group, fetchedAt);
				}
			}
		});
		const books = await Promise.all(markets.slice(0, 12).map(async (market) => {
			if (!market.yesTokenId) return null;
			try {
				const book = await getJson(`https://clob.polymarket.com/book?token_id=${market.yesTokenId}`, 5e3);
				return {
					id: market.id,
					quote: topOfBook(book)
				};
			} catch {
				return null;
			}
		}));
		for (const row of books) {
			if (!row?.quote) continue;
			const market = markets.find((item) => item.id === row.id);
			if (!market) continue;
			market.bestBid = row.quote.bid;
			market.bestAsk = Math.max(row.quote.ask, row.quote.bid);
			market.booked = true;
		}
		markets.sort((a, b) => a.endAt - b.endAt || b.liquidity - a.liquidity);
		if (markets.length === 0) error = error ? `${error}. No open Bitcoin windows on Polymarket.` : "No open Bitcoin windows on Polymarket.";
	} catch {
		error = error ? `${error}. Polymarket discovery failed.` : "Polymarket discovery failed";
	}
	return {
		spot,
		spotSource: "Coinbase BTC-USD",
		fetchedAt,
		markets: markets.slice(0, 36),
		error
	};
}
/** BTC-USD 1-minute candle open at or just before `ts`. Used to recover an "Up or Down" window's open price. */
var lastOpenError = "";
/** BTC price at the start of the minute containing `ts`. Tries Coinbase, then Kraken, then Binance. */
async function fetchSpotAt(ts) {
	const minute = Math.floor(ts / 6e4) * 6e4;
	const sources = [
		async () => {
			const start = new Date(minute).toISOString();
			const end = new Date(minute + 6e4).toISOString();
			const rows = await getJson(`https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, 6e3);
			if (!Array.isArray(rows)) return null;
			const open = num((rows.find((r) => num(r?.[0], -1) * 1e3 === minute) ?? rows[rows.length - 1])?.[3], NaN);
			return Number.isFinite(open) ? open : null;
		},
		async () => {
			const result = asRecord(asRecord(await getJson(`https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1&since=${Math.floor(minute / 1e3) - 60}`, 6e3))?.result);
			if (!result) return null;
			const key = Object.keys(result).find((k) => k !== "last");
			const open = num((key && Array.isArray(result[key]) ? result[key] : []).find((r) => num(r?.[0], -1) * 1e3 === minute)?.[1], NaN);
			return Number.isFinite(open) ? open : null;
		},
		async () => {
			const rows = await getJson(`https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1m&startTime=${minute}&limit=1`, 6e3);
			const open = num((Array.isArray(rows) ? rows[0] : [])?.[1], NaN);
			return Number.isFinite(open) ? open : null;
		}
	];
	const names = [
		"Coinbase",
		"Kraken",
		"Binance"
	];
	const errs = [];
	for (let i = 0; i < sources.length; i += 1) try {
		const v = await sources[i]();
		if (v != null) return v;
		errs.push(`${names[i]}: no candle for that minute`);
	} catch (e) {
		errs.push(`${names[i]}: ${e instanceof Error ? e.message : "failed"}`);
	}
	lastOpenError = errs.join(" · ");
	return null;
}
/**
* Ask Polymarket whether each market has resolved. Returns gammaId -> YES won.
* Markets that are not resolved yet (or return ambiguous prices) are omitted.
*/
async function fetchResolutions(gammaIds) {
	const out = {};
	const ids = [...new Set(gammaIds)].slice(0, 20);
	await Promise.all(ids.map(async (id) => {
		try {
			const m = asRecord(await getJson(`https://gamma-api.polymarket.com/markets/${encodeURIComponent(id)}`, 6e3));
			if (!m) return;
			const verdict = parseResolution(m);
			if (verdict != null) out[id] = verdict;
		} catch {}
	}));
	return out;
}
function parseResolution(m) {
	if (m.closed !== true) return null;
	const prices = asStrings(m.outcomePrices).map((p) => num(p, NaN));
	if (prices.length < 2 || !Number.isFinite(prices[0]) || !Number.isFinite(prices[1])) return null;
	if (prices[0] >= .99 && prices[1] <= .01) return true;
	if (prices[1] >= .99 && prices[0] <= .01) return false;
	return null;
}
/** Fresh best bid/ask for a set of YES tokens. Failures are skipped, not thrown. */
async function fetchQuotes(tokenIds) {
	const ids = [...new Set(tokenIds)].slice(0, 24);
	return (await Promise.all(ids.map(async (tokenId) => {
		try {
			const q = topOfBook(await getJson(`https://clob.polymarket.com/book?token_id=${tokenId}`, 4e3));
			return q ? {
				tokenId,
				bid: q.bid,
				ask: Math.max(q.ask, q.bid)
			} : null;
		} catch {
			return null;
		}
	}))).filter((r) => r != null);
}
//#endregion
export { getJson as a, num as c, fetchSpotAt as i, parseResolution as l, fetchQuotes as n, lastOpenError as o, fetchResolutions as r, loadTape as s, asRecord as t, tape_fetch_xqAH3ngP_exports as u };
