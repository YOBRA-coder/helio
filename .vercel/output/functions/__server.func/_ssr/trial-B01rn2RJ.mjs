import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/trial-B01rn2RJ.js
var trial_exports = /* @__PURE__ */ __exportAll({
	DEFAULT_GATE: () => DEFAULT_GATE,
	calibrationNote: () => calibrationNote,
	evaluateGate: () => evaluateGate,
	powerNote: () => powerNote,
	summarize: () => summarize
});
var DEFAULT_GATE = {
	minDays: 7,
	minTrades: 100,
	minProfitFactor: 1.1,
	maxDrawdownFraction: .8
};
function bucketOf(rows, keyOf) {
	const map = /* @__PURE__ */ new Map();
	for (const r of rows) {
		const key = keyOf(r);
		const b = map.get(key) ?? {
			key,
			trades: 0,
			wins: 0,
			pnl: 0
		};
		b.trades += 1;
		if (r.pnl > 0) b.wins += 1;
		b.pnl += r.pnl;
		map.set(key, b);
	}
	return [...map.values()].sort((a, b) => b.trades - a.trades);
}
function ttxLabel(min) {
	if (min <= 6) return "≤ 5 min";
	if (min <= 16) return "≤ 15 min";
	if (min <= 65) return "≤ 1 h";
	if (min <= 250) return "≤ 4 h";
	return "> 4 h";
}
function calibrate(rows) {
	const buckets = Array.from({ length: 10 }, (_, i) => ({
		sum: 0,
		won: 0,
		n: 0,
		i
	}));
	for (const r of rows) {
		const b = buckets[Math.min(9, Math.floor(r.pYesBase * 10))];
		b.n += 1;
		b.sum += r.pYesBase;
		b.won += r.yesWon ? 1 : 0;
	}
	return buckets.map((b) => ({
		p: b.n ? b.sum / b.n : (b.i + .5) / 10,
		won: b.n ? b.won / b.n : 0,
		n: b.n
	}));
}
function summarize(core, now, startingEquity) {
	const all = core.scores;
	const real = all.filter((r) => r.kind === "live").sort((a, b) => a.settledAt - b.settledAt);
	const sim = all.filter((r) => r.kind === "sim-window");
	const wins = real.filter((r) => r.pnl > 0);
	const losses = real.filter((r) => r.pnl <= 0);
	const grossWin = wins.reduce((a, r) => a + r.pnl, 0);
	const grossLoss = -losses.reduce((a, r) => a + r.pnl, 0);
	const n = real.length;
	const mean = n ? real.reduce((a, r) => a + r.pnl, 0) / n : 0;
	const variance = n > 1 ? real.reduce((a, r) => a + (r.pnl - mean) ** 2, 0) / (n - 1) : 0;
	const se = n > 1 ? Math.sqrt(variance / n) : 0;
	let equity = startingEquity;
	let peak = equity;
	let maxDd = 0;
	for (const r of real) {
		equity += r.pnl;
		peak = Math.max(peak, equity);
		maxDd = Math.max(maxDd, peak - equity);
	}
	const official = real.filter((r) => r.official && r.yesWon != null);
	const brier = (pick) => official.length ? official.reduce((a, r) => a + (pick(r) - (r.yesWon ? 1 : 0)) ** 2, 0) / official.length : null;
	const brierModel = brier((r) => r.pYesBase);
	const brierCtx = brier((r) => r.pYesCtx);
	const altRows = official.filter((r) => typeof r.pYesAlt === "number");
	const brierAlt = altRows.length >= 10 ? altRows.reduce((a, r) => a + (r.pYesAlt - (r.yesWon ? 1 : 0)) ** 2, 0) / altRows.length : null;
	const brierMarket = brier((r) => r.marketMid);
	return {
		days: Math.max(0, (now - core.trialStartedAt) / 864e5),
		trades: n,
		officialTrades: official.length,
		wins: wins.length,
		losses: losses.length,
		winRate: n ? wins.length / n : 0,
		netPnl: real.reduce((a, r) => a + r.pnl, 0),
		fees: real.reduce((a, r) => a + r.fees, 0),
		profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0,
		expectancy: mean,
		expectancyLow90: mean - 1.2816 * se,
		avgWin: wins.length ? grossWin / wins.length : 0,
		avgLoss: losses.length ? -grossLoss / losses.length : 0,
		maxDrawdown: maxDd,
		brierModel,
		brierCtx,
		brierAlt,
		brierMarket,
		brierEdge: brierModel != null && brierMarket != null ? brierMarket - brierModel : null,
		byGroup: bucketOf(real, (r) => r.group),
		byTtx: bucketOf(real, (r) => ttxLabel(r.minutesToExpiry)),
		bySide: bucketOf(real, (r) => r.side === "yes" ? "Bet Up / Yes" : "Bet Down / No"),
		byEdge: bucketOf(real, (r) => r.edgeAtEntry < .05 ? "edge under 5¢" : r.edgeAtEntry < .1 ? "edge 5–10¢" : "edge 10¢+").sort((a, b) => a.key.localeCompare(b.key)),
		last24h: (() => {
			const rows = real.filter((r) => now - r.settledAt < 864e5);
			return {
				trades: rows.length,
				wins: rows.filter((r) => r.pnl > 0).length,
				pnl: rows.reduce((a, r) => a + r.pnl, 0)
			};
		})(),
		pnls: real.map((r) => r.pnl),
		calibration: calibrate(official),
		sim: {
			trades: sim.length,
			netPnl: sim.reduce((a, r) => a + r.pnl, 0)
		}
	};
}
function evaluateGate(summary, drawdownLimit, cfg = DEFAULT_GATE) {
	const pf = Number.isFinite(summary.profitFactor) ? summary.profitFactor.toFixed(2) : "∞";
	const checks = [
		{
			id: "days",
			label: `Trial has run at least ${cfg.minDays} days`,
			pass: summary.days >= cfg.minDays,
			detail: `${summary.days.toFixed(1)} days so far`
		},
		{
			id: "trades",
			label: `At least ${cfg.minTrades} settled trades on real Polymarket markets`,
			pass: summary.trades >= cfg.minTrades,
			detail: `${summary.trades} so far (sim windows excluded: ${summary.sim.trades})`
		},
		{
			id: "pnl",
			label: "Net P&L after fees and slippage is positive",
			pass: summary.trades > 0 && summary.netPnl > 0,
			detail: `${summary.netPnl >= 0 ? "+" : "−"}$${Math.abs(summary.netPnl).toFixed(2)}`
		},
		{
			id: "pf",
			label: `Profit factor at least ${cfg.minProfitFactor.toFixed(2)}`,
			pass: summary.profitFactor >= cfg.minProfitFactor,
			detail: pf
		},
		{
			id: "brier",
			label: "Model probabilities beat the market price (Brier score)",
			pass: summary.brierEdge != null && summary.brierEdge > 0,
			detail: summary.brierModel != null && summary.brierMarket != null ? `model ${summary.brierModel.toFixed(4)} vs market ${summary.brierMarket.toFixed(4)} (lower is better)` : "no official settlements yet"
		},
		{
			id: "dd",
			label: "Max drawdown stayed inside the breaker",
			pass: summary.maxDrawdown <= drawdownLimit * cfg.maxDrawdownFraction,
			detail: `$${summary.maxDrawdown.toFixed(2)} of $${(drawdownLimit * cfg.maxDrawdownFraction).toFixed(0)} allowed`
		}
	];
	return {
		checks,
		eligible: checks.every((c) => c.pass)
	};
}
/** Plain-language read on whether the model's probabilities can be trusted. */
function calibrationNote(summary) {
	const rows = summary.calibration.filter((r) => r.n > 0);
	const n = rows.reduce((a, r) => a + r.n, 0);
	if (n < 30) return "Not enough settled windows to judge calibration yet (needs about 30).";
	const predicted = rows.reduce((a, r) => a + r.p * r.n, 0) / n;
	const actual = rows.reduce((a, r) => a + r.won * r.n, 0) / n;
	const confident = rows.filter((r) => r.p >= .7 || r.p <= .3);
	const cn = confident.reduce((a, r) => a + r.n, 0);
	let out = `Across ${n} settled windows the model averaged ${(predicted * 100).toFixed(0)}% for Up and Up actually won ${(actual * 100).toFixed(0)}%.`;
	if (cn >= 10) {
		const gap = confident.reduce((a, r) => a + Math.abs((r.p >= .5 ? r.p : 1 - r.p) - (r.p >= .5 ? r.won : 1 - r.won)) * r.n, 0) / cn;
		out += ` When it was confident (70%+), it was off by ${(gap * 100).toFixed(0)} points on average${gap > .1 ? ", so its big edges are probably overstated" : ""}.`;
	}
	if (summary.brierAlt != null && summary.brierModel != null) out += summary.brierAlt < summary.brierModel - .002 ? " The momentum variant scored better than the baseline." : " The momentum variant did not beat the baseline.";
	return out;
}
/**
* Honest sample-size note. With ~50¢ binary bets a per-trade standard deviation is about the stake,
* so noise on the average result shrinks only with the square root of the number of trades.
*/
function powerNote(summary) {
	if (summary.trades < 30) return "Too few trades to say anything. Keep the trial running.";
	if (summary.expectancyLow90 > 0) return "Average result is above zero even after allowing for noise (~90% one-sided). Still not a guarantee.";
	return "The average result is inside the noise band. 100 trades can show a bad strategy but cannot prove a good one; 300+ is more convincing.";
}
//#endregion
export { summarize as a, powerNote as i, calibrationNote as n, trial_exports as o, evaluateGate as r, DEFAULT_GATE as t };
