import { r as __exportAll } from "../_runtime.mjs";
import { t as __exportAll$1 } from "./rolldown-runtime-D7D4PA-g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/engine-BmNSrsOt.js
var engine_BmNSrsOt_exports = /* @__PURE__ */ __exportAll({
	_: () => yesWins,
	a: () => STARTING_CASH,
	c: () => engine_exports,
	d: () => feePerShare,
	f: () => isTheme,
	g: () => yesProbability,
	h: () => runBacktest,
	i: () => MODEL_VERSION,
	l: () => ensureSimMarkets,
	m: () => realizedVol,
	n: () => DEFAULT_RISK,
	o: () => THEMES,
	p: () => parseStrikes,
	r: () => DRIFT_LIMIT,
	s: () => circuitMessage,
	t: () => APPROVAL_MS,
	u: () => evaluateOpportunity
});
var engine_exports = /* @__PURE__ */ __exportAll$1({
	APPROVAL_MS: () => APPROVAL_MS,
	DEFAULT_RISK: () => DEFAULT_RISK,
	DRIFT_LIMIT: () => DRIFT_LIMIT,
	ENTRY_DELAY_MS: () => ENTRY_DELAY_MS,
	ENTRY_FRACTION: () => ENTRY_FRACTION,
	MAX_BELIEVABLE_EDGE: () => MAX_BELIEVABLE_EDGE,
	MAX_CTX_TILT: () => MAX_CTX_TILT,
	MODEL_VERSION: () => MODEL_VERSION,
	STARTING_CASH: () => STARTING_CASH,
	THEMES: () => THEMES,
	circuitMessage: () => circuitMessage,
	clamp: () => clamp,
	contextAdjusted: () => contextAdjusted,
	ensureSimMarkets: () => ensureSimMarkets,
	evaluateOpportunity: () => evaluateOpportunity,
	feePerShare: () => feePerShare,
	isTheme: () => isTheme,
	makeSimWindow: () => makeSimWindow,
	momentumProbability: () => momentumProbability,
	mulberry32: () => mulberry32,
	normalCdf: () => normalCdf,
	parseStrikes: () => parseStrikes,
	realizedVol: () => realizedVol,
	runBacktest: () => runBacktest,
	yesProbability: () => yesProbability,
	yesWins: () => yesWins
});
/**
* Shadow variant: the baseline plus a small nudge from the last ~60 seconds of price movement.
* It is recorded and scored next to the baseline in the trial, but it never decides a trade.
*/
function momentumProbability(baseP, spots, spot, annualVol, spotDtMs) {
	const lookback = Math.max(2, Math.round(6e4 / Math.max(1e3, spotDtMs)));
	if (spots.length <= lookback || spot <= 0) return baseP;
	const move = spot - spots[spots.length - 1 - lookback];
	const sigma = (annualVol ?? PRIOR_ANNUAL_VOL) / Math.sqrt(8766) * Math.sqrt(1 / 60) * spot;
	if (!(sigma > 0)) return baseP;
	return clamp(baseP + clamp(move / sigma, -2, 2) * .02, .04, .96);
}
var MODEL_VERSION = "helios-btc-0.5";
/** Up/Down windows: wait this long after the open before trading (the open print and early noise dominate). */
var MAX_BELIEVABLE_EDGE = .08;
var ENTRY_FRACTION = .3;
var ENTRY_DELAY_MS = 45e3;
/** Taker fee per share at a given price. Polymarket's crypto fee peaks at 50¢ (about 1.75¢ per share) and shrinks toward the edges. */
function feePerShare(price, risk) {
	return price * risk.feeRate + risk.feeCoef * price * (1 - price);
}
var STARTING_CASH = 1e4;
var APPROVAL_MS = 35e3;
var DRIFT_LIMIT = .025;
var DEFAULT_RISK = {
	maxStake: 80,
	maxExposure: 400,
	dailyLossLimit: 250,
	drawdownLimit: 600,
	maxOrdersPerHour: 8,
	minEdge: .02,
	maxSpread: .06,
	minLiquidity: 1500,
	feeRate: 0,
	feeCoef: .07,
	slippage: .004,
	freshnessMs: 45e3,
	cancelOnKill: true,
	uncertaintyHaircut: .35
};
var THEMES = [
	{
		id: "orchard",
		name: "Orchard",
		line: "Moss night. Chartreuse is the only signal.",
		color: "#101512"
	},
	{
		id: "glacier",
		name: "Glacier",
		line: "Graphite field and an ice-blue print.",
		color: "#0e1116"
	},
	{
		id: "gilt",
		name: "Gilt",
		line: "Umber dark, antique gold, after hours.",
		color: "#14110e"
	},
	{
		id: "ion",
		name: "Ion",
		line: "Ops floor. Ink black, one cyan mark.",
		color: "#07090d"
	},
	{
		id: "daybook",
		name: "Daybook",
		line: "Daylight paper. Same numbers, ink instead of glow.",
		color: "#f3efe6"
	}
];
function isTheme(value) {
	return THEMES.some((item) => item.id === value);
}
function clamp(n, lo, hi) {
	return Math.min(hi, Math.max(lo, n));
}
function normalCdf(x) {
	const z = Math.abs(x);
	const t = 1 / (1 + .2316419 * z);
	const p = .3989422804 * Math.exp(-z * z / 2) * t * (.31938153 + t * (-.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
	return x >= 0 ? 1 - p : p;
}
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function randn(rand) {
	const u = Math.max(1e-9, rand());
	const v = Math.max(1e-9, rand());
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}
var PRIOR_ANNUAL_VOL = .55;
/**
* Annualised realised volatility from a rolling list of spot prints taken `dtMs` apart.
* Returns null when there is not enough data. Blended with the prior so a quiet
* ten minutes cannot talk the model into false certainty.
*/
function realizedVol(spots, dtMs) {
	const xs = spots.filter((n) => Number.isFinite(n) && n > 0);
	if (xs.length < 30 || dtMs <= 0) return null;
	const rets = [];
	for (let i = 1; i < xs.length; i += 1) rets.push(Math.log(xs[i] / xs[i - 1]));
	const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
	const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, rets.length - 1);
	const annual = Math.sqrt(variance / dtMs) * Math.sqrt(315576e5);
	if (!Number.isFinite(annual) || annual <= 0) return null;
	return clamp(.5 * annual + .5 * PRIOR_ANNUAL_VOL, .25, 1.6);
}
function yesProbability(market, spot, now, annualVol = null) {
	const hours = Math.max(0, market.endAt - now) / 36e5;
	const volPerSqrtHour = (annualVol ?? PRIOR_ANNUAL_VOL) / Math.sqrt(8766);
	const sigma = Math.max(volPerSqrtHour * Math.sqrt(Math.max(hours, .05)) * spot, spot * 8e-4);
	if (market.openSpot && (market.kind === "sim-window" || /up or down/i.test(market.question))) return {
		p: clamp(normalCdf((spot - market.openSpot) / sigma * .9), .04, .96),
		uncertainty: market.kind === "sim-window" ? .045 : .08,
		sigma
	};
	if (/up or down/i.test(market.question)) return {
		p: .5,
		uncertainty: .2,
		sigma
	};
	const zLo = market.strikeLow == null ? -8 : (market.strikeLow - spot) / sigma;
	return {
		p: clamp(normalCdf(market.strikeHigh == null ? 8 : (market.strikeHigh - spot) / sigma) - normalCdf(zLo), .005, .995),
		uncertainty: clamp(.04 + .06 * Math.exp(-hours / 8), .035, .16),
		sigma
	};
}
/** Max probability shift context may apply, and only on markets with at least 4h to run. */
var MAX_CTX_TILT = .02;
function contextAdjusted(market, p, now, ctx) {
	if (!ctx || ctx.tilt === 0) return p;
	if ((market.endAt - now) / 36e5 < 4) return p;
	const q = market.question.toLowerCase();
	return clamp(p + (q.includes("less than") || q.includes("below") || q.includes("dip") ? -1 : 1) * clamp(ctx.tilt, -1, 1) * MAX_CTX_TILT, .005, .995);
}
function parseStrikes(question) {
	const nums = [...question.matchAll(/\$([0-9][0-9,]*)/g)].map((m) => Number(m[1].replace(/,/g, "")));
	const q = question.toLowerCase();
	if (q.includes("between") && nums.length >= 2 && nums[0] < nums[1]) return {
		low: nums[0],
		high: nums[1],
		ok: true
	};
	if (q.includes("less than") && nums[0]) return {
		low: null,
		high: nums[0],
		ok: true
	};
	if ((q.includes("greater than") || q.includes("or more")) && nums[0]) return {
		low: nums[0],
		high: null,
		ok: true
	};
	return {
		low: null,
		high: null,
		ok: false
	};
}
function yesWins(market, spot) {
	if (market.kind === "sim-window") return spot > (market.openSpot ?? spot);
	if (market.strikeLow != null && spot <= market.strikeLow) return false;
	if (market.strikeHigh != null && spot >= market.strikeHigh) return false;
	if (market.strikeLow == null && market.strikeHigh == null) return false;
	return true;
}
var SIM_SPECS = [
	{
		label: "5m",
		ms: 3e5,
		bias: -.07
	},
	{
		label: "15m",
		ms: 9e5,
		bias: .065
	},
	{
		label: "1h",
		ms: 36e5,
		bias: -.05
	}
];
function makeSimWindow(label, ms, bias, now, spot) {
	const mid = clamp(.5 + bias, .2, .8);
	const half = .01;
	return {
		id: `sim-${label}-${now}`,
		kind: "sim-window",
		question: `Sim ${label} · BTC above ${spot.toLocaleString("en-US", { maximumFractionDigits: 2 })} at expiry?`,
		outcomes: ["Up", "Down"],
		status: "open",
		startAt: now,
		endAt: now + ms,
		strikeLow: spot,
		strikeHigh: null,
		openSpot: spot,
		resolution: "Simulated short-duration contract. Resolves Up if the desk BTC reference at expiry is above the open captured when this window was created. Not an official Polymarket market and not a Binance candle.",
		sourceUrl: null,
		metadataOk: true,
		restricted: false,
		yesBid: mid - half,
		yesAsk: mid + half,
		liquidity: 22e3,
		volume: 0,
		updatedAt: now,
		source: "Helios sim tape",
		group: label,
		yesTokenId: null,
		noTokenId: null,
		conditionId: null,
		gammaId: null
	};
}
function ensureSimMarkets(markets, now, spot) {
	const open = markets.filter((m) => m.status === "open" && m.endAt > now);
	for (const spec of SIM_SPECS) if (!open.some((m) => m.group === spec.label)) open.push(makeSimWindow(spec.label, spec.ms, spec.bias, now, spot));
	return open;
}
function evaluateOpportunity(market, spot, now, risk, cash, exposure, ordersLastHour, killed, circuit, extra = {}) {
	const blocks = [];
	if (killed) blocks.push("Kill switch is on");
	if (circuit) blocks.push(circuit);
	if (!market.metadataOk) blocks.push(/up or down/i.test(market.question) && market.openSpot == null ? "Waiting for the window-open BTC price (Coinbase candle not loaded yet)" : "Resolution metadata is missing or ambiguous");
	if (market.restricted) blocks.push("Eligibility cannot be verified");
	if (market.status !== "open") blocks.push("Market is not open");
	if (now - market.updatedAt > risk.freshnessMs) blocks.push("Market data is stale");
	if (market.endAt - now < 2e4) blocks.push("Inside the no-trade buffer before expiry");
	const spread = market.yesAsk - market.yesBid;
	if (spread > risk.maxSpread) blocks.push("Spread is wider than the limit");
	if (market.liquidity < risk.minLiquidity) blocks.push("Liquidity is below the floor");
	if (ordersLastHour >= risk.maxOrdersPerHour) blocks.push("Order count for this hour is at the cap");
	if (exposure >= risk.maxExposure) blocks.push("Open exposure is at the cap");
	const base = yesProbability(market, spot, now, extra.vol ?? null);
	const uncertainty = base.uncertainty;
	const pCtx = contextAdjusted(market, base.p, now, extra.context);
	const midForBlend = (market.yesBid + market.yesAsk) / 2;
	const w = clamp(extra.blendW ?? .5, 0, 1);
	const p = market.kind === "sim-window" ? pCtx : clamp(midForBlend + w * (pCtx - midForBlend), .01, .99);
	if (extra.context?.blockReason) blocks.push(extra.context.blockReason);
	const hair = uncertainty * risk.uncertaintyHaircut;
	const yesPx = clamp(market.yesAsk + risk.slippage, .01, .99);
	const noPx = clamp(1 - market.yesBid + risk.slippage, .01, .99);
	const evYes = p - hair - yesPx - feePerShare(yesPx, risk);
	const evNo = 1 - p - hair - noPx - feePerShare(noPx, risk);
	const side = evYes >= evNo ? "yes" : "no";
	const executablePrice = side === "yes" ? yesPx : noPx;
	const edge = side === "yes" ? evYes : evNo;
	const modelForSide = side === "yes" ? p : 1 - p;
	const real = market.kind !== "sim-window";
	if (real && extra.coolOff) blocks.push(extra.coolOff);
	const midYes = (market.yesBid + market.yesAsk) / 2;
	if (market.kind !== "sim-window" && Math.abs(pCtx - midYes) > .25) blocks.push(`Model (${Math.round(pCtx * 100)}%) and market (${Math.round(midYes * 100)}%) disagree by over 25 points: treated as a data problem, not an edge`);
	if (real && edge > .08) blocks.push(`Net edge ${edge.toFixed(3)} is above ${MAX_BELIEVABLE_EDGE}: against an efficient market that is more likely a model error than a real edge`);
	if (real && /up or down/i.test(market.question)) {
		const len = market.endAt - market.startAt;
		const wait = Math.max(ENTRY_DELAY_MS, len * ENTRY_FRACTION);
		if (now - market.startAt < wait) blocks.push(`Too early in the window: waiting ${Math.round(wait / 1e3)}s so the price has moved enough to say something`);
	}
	if (edge < risk.minEdge) blocks.push(`Net edge ${edge.toFixed(3)} is below the minimum ${risk.minEdge.toFixed(3)}`);
	const lo = real ? .22 : .08;
	const hi = real ? .88 : .92;
	if (executablePrice < lo || executablePrice > hi) blocks.push(`Executable price is outside the ${Math.round(lo * 100)}¢–${Math.round(hi * 100)}¢ band`);
	const scale = clamp(extra.context?.stakeScale ?? 1, 0, 1);
	const edgeScale = clamp(edge / .06, .25, 1);
	const trustScale = real ? clamp(.3 + w, .3, 1) : 1;
	const stake = Math.min(risk.maxStake * scale * edgeScale * trustScale, Math.max(0, cash));
	if (stake < Math.min(1, risk.maxStake)) blocks.push("Paper balance is below the minimum stake");
	const unitCost = executablePrice + feePerShare(executablePrice, risk);
	const shares = stake > 0 ? stake / unitCost : 0;
	const debit = shares * unitCost;
	if (debit > 0 && exposure + debit > risk.maxExposure) blocks.push("This stake would breach open exposure");
	const outcome = side === "yes" ? market.outcomes[0] : market.outcomes[1];
	const rationale = [
		`Baseline ${MODEL_VERSION} puts Yes at ${(p * 100).toFixed(1)}% with ±${(uncertainty * 100).toFixed(1)} pts of uncertainty.`,
		`Tradable ${outcome} touch is ${Math.round(executablePrice * 1e3) / 10}¢ after slippage. Haircut and fees leave net edge ${edge.toFixed(3)} per share.`,
		market.kind === "sim-window" ? "Short window is simulated so fills and expiry can be rehearsed without touching an exchange." : "Live contract prices come from Polymarket's public market data. Orders from this desk stay on paper."
	];
	const risks = [
		"The baseline can be wrong. A printed edge is not a forecast of profit.",
		`About ${Math.max(0, Math.round((market.endAt - now) / 6e4))} minutes remain. Short windows move fast.`,
		`Spread ${(spread * 100).toFixed(1)}¢ · liquidity ${Math.round(market.liquidity).toLocaleString("en-US")}.`
	];
	return {
		probability: modelForSide,
		yesProbability: p,
		pYesBase: base.p,
		pYesAlt: momentumProbability(base.p, extra.spots ?? [], spot, extra.vol ?? null, extra.spotDtMs ?? 6e3),
		marketMid: (market.yesBid + market.yesAsk) / 2,
		uncertainty,
		side,
		executablePrice,
		stake,
		shares,
		debit,
		expectedValue: edge,
		edge,
		rationale,
		risks,
		hardFail: blocks[0] ?? null
	};
}
function circuitMessage(kind) {
	if (kind === "daily") return "Daily loss limit reached — new paper orders are paused";
	if (kind === "drawdown") return "Drawdown circuit breaker — new paper orders are paused";
	return "Reconciliation mismatch — new paper orders are paused until you clear it";
}
function runBacktest(risk, seed = 20261011) {
	const rand = mulberry32(seed);
	const plan = [
		{
			name: "train",
			n: 48
		},
		{
			name: "validation",
			n: 24
		},
		{
			name: "test",
			n: 48
		}
	];
	let equity = STARTING_CASH;
	const periods = plan.map((period) => {
		let peak = equity;
		let maxDd = 0;
		let wins = 0;
		let losses = 0;
		let rejected = 0;
		let grossWin = 0;
		let grossLoss = 0;
		let fees = 0;
		let winSum = 0;
		let lossSum = 0;
		const curve = [{
			t: 0,
			equity
		}];
		const sample = [];
		for (let i = 0; i < period.n; i += 1) {
			const price = clamp(clamp(.5 + (rand() - .5) * .16, .12, .88) + risk.slippage, .08, .92);
			const edge = .5 - .045 * risk.uncertaintyHaircut - price - feePerShare(price, risk);
			const won = randn(rand) > 0;
			if (edge < risk.minEdge) {
				rejected += 1;
				if (sample.length < 8) sample.push({
					price,
					won,
					pnl: 0,
					rejected: true
				});
			} else {
				const shares = Math.min(risk.maxStake, equity * .04) / (price + feePerShare(price, risk));
				const fee = shares * feePerShare(price, risk);
				const pnl = shares * (won ? 1 : 0) - shares * price - fee;
				equity += pnl;
				fees += fee;
				if (pnl >= 0) {
					wins += 1;
					grossWin += pnl;
					winSum += pnl;
				} else {
					losses += 1;
					grossLoss += -pnl;
					lossSum += pnl;
				}
				if (sample.length < 8) sample.push({
					price,
					won,
					pnl,
					rejected: false
				});
			}
			peak = Math.max(peak, equity);
			maxDd = Math.max(maxDd, peak - equity);
			if (i % 2 === 0) curve.push({
				t: i + 1,
				equity: Math.round(equity * 100) / 100
			});
		}
		curve.push({
			t: period.n,
			equity: Math.round(equity * 100) / 100
		});
		const trades = wins + losses;
		return {
			name: period.name,
			trades,
			wins,
			losses,
			rejected,
			netPnl: equity - (curve[0]?.equity ?? equity),
			fees,
			profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 0 : 0,
			expectancy: trades ? (grossWin - grossLoss) / trades : 0,
			maxDrawdown: maxDd,
			winRate: trades ? wins / trades : 0,
			avgWin: wins ? winSum / wins : 0,
			avgLoss: losses ? lossSum / losses : 0,
			curve,
			sample
		};
	});
	let cursor = STARTING_CASH;
	for (const period of periods) {
		const end = period.curve[period.curve.length - 1]?.equity ?? cursor;
		period.netPnl = end - cursor;
		cursor = end;
	}
	return {
		periods,
		modelVersion: MODEL_VERSION,
		ranAt: Date.now(),
		assumptions: [
			"Time-ordered synthetic 5-minute windows. The decision never sees the settlement coin-flip.",
			"Fair probability is 0.50 at the open. Quotes are noise around that fair value, so most 'edge' is false.",
			`Costs use your current settings: Polymarket taker fee ${(feePerShare(.5, risk) * 100).toFixed(2)}¢ per share at 50¢ and slippage ${(risk.slippage * 100).toFixed(2)}¢, plus the uncertainty haircut.`,
			"Train, validation, and test are chronological slices of one path. They are not a live track record.",
			"A pretty curve would be a bug in the story. This baseline is here to reject the idea of a promised win rate."
		]
	};
}
//#endregion
export { THEMES as a, ensureSimMarkets as c, isTheme as d, parseStrikes as f, yesWins as g, yesProbability as h, STARTING_CASH as i, evaluateOpportunity as l, runBacktest as m, DEFAULT_RISK as n, circuitMessage as o, realizedVol as p, MODEL_VERSION as r, engine_BmNSrsOt_exports as s, APPROVAL_MS as t, feePerShare as u };
