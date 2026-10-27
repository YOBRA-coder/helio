import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/charts-CKS2swHU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useRecharts() {
	const [mod, setMod] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let live = true;
		import("../_libs/recharts+[...].mjs").then((n) => n.t).then((m) => live && setMod(m));
		return () => {
			live = false;
		};
	}, []);
	return mod;
}
var tip = {
	background: "var(--t-surface)",
	border: "1px solid var(--t-line)",
	borderRadius: 12,
	color: "var(--t-fg)"
};
function Empty({ h, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid place-items-center rounded-md bg-raised text-sm text-muted",
		style: { height: h },
		children: label
	});
}
var hhmm = (t) => new Date(t).toLocaleTimeString([], {
	hour: "2-digit",
	minute: "2-digit"
});
/** Equity with drawdown from the running peak underneath. */
function EquityDrawdownChart({ data }) {
	const mod = useRecharts();
	if (!mod || data.length < 3) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
		h: 240,
		label: "Equity builds up as the desk runs"
	});
	let peak = -Infinity;
	const rows = data.map((d) => {
		peak = Math.max(peak, d.equity);
		return {
			t: d.t,
			equity: d.equity,
			dd: -(peak - d.equity)
		};
	});
	const { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } = mod;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-60 w-full min-w-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
			width: "100%",
			height: "100%",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComposedChart, {
				data: rows,
				margin: {
					left: 0,
					right: 8,
					top: 8,
					bottom: 0
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
						stroke: "var(--t-line)",
						strokeDasharray: "3 3",
						vertical: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
						dataKey: "t",
						tickFormatter: hhmm,
						tick: {
							fill: "var(--t-muted)",
							fontSize: 11
						},
						minTickGap: 48
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
						yAxisId: "e",
						domain: ["auto", "auto"],
						tick: {
							fill: "var(--t-muted)",
							fontSize: 11
						},
						width: 52,
						tickFormatter: (v) => `$${Math.round(Number(v))}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
						yAxisId: "d",
						orientation: "right",
						hide: true,
						domain: ["dataMin", 0]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
						contentStyle: tip,
						labelFormatter: (t) => new Date(Number(t)).toLocaleString(),
						formatter: (v, n) => [`$${Number(v).toFixed(2)}`, n === "dd" ? "Drawdown" : "Equity"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
						yAxisId: "d",
						type: "monotone",
						dataKey: "dd",
						stroke: "var(--t-danger)",
						fill: "var(--t-danger)",
						fillOpacity: .15,
						strokeWidth: 1,
						dot: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
						yAxisId: "e",
						type: "monotone",
						dataKey: "equity",
						stroke: "var(--t-primary)",
						strokeWidth: 2,
						dot: false
					})
				]
			})
		})
	});
}
/** BTC reference with the open print of each live window drawn as a line. */
function SpotChart({ spots, dtMs, now, opens }) {
	const mod = useRecharts();
	if (!mod || spots.length < 3) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
		h: 220,
		label: "Waiting for BTC prints"
	});
	const base = now || Date.now();
	const rows = spots.map((p, i) => ({
		t: base - (spots.length - 1 - i) * dtMs,
		p
	}));
	const lo = Math.min(...spots, ...opens.map((o) => o.price));
	const hi = Math.max(...spots, ...opens.map((o) => o.price));
	const pad = Math.max((hi - lo) * .15, hi * 3e-4);
	const { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, ReferenceLine } = mod;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-56 w-full min-w-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
			width: "100%",
			height: "100%",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
				data: rows,
				margin: {
					left: 0,
					right: 8,
					top: 8,
					bottom: 0
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
						stroke: "var(--t-line)",
						strokeDasharray: "3 3",
						vertical: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
						dataKey: "t",
						tickFormatter: hhmm,
						tick: {
							fill: "var(--t-muted)",
							fontSize: 11
						},
						minTickGap: 48
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
						domain: [lo - pad, hi + pad],
						tick: {
							fill: "var(--t-muted)",
							fontSize: 11
						},
						width: 60,
						tickFormatter: (v) => `$${Math.round(Number(v)).toLocaleString()}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
						contentStyle: tip,
						labelFormatter: (t) => new Date(Number(t)).toLocaleTimeString(),
						formatter: (v) => [`$${Number(v).toLocaleString(void 0, { maximumFractionDigits: 2 })}`, "BTC"]
					}),
					opens.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReferenceLine, {
						y: o.price,
						stroke: "var(--t-muted)",
						strokeDasharray: "4 4",
						label: {
							value: `${o.label} open`,
							fill: "var(--t-muted)",
							fontSize: 10,
							position: "insideTopLeft"
						}
					}, o.label)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
						type: "monotone",
						dataKey: "p",
						stroke: "var(--t-primary)",
						strokeWidth: 2,
						dot: false,
						isAnimationActive: false
					})
				]
			})
		})
	});
}
/** Market YES mid against the model's probability for one contract. */
function ModelVsMarketChart({ rows }) {
	const mod = useRecharts();
	if (!mod || rows.length < 3) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
		h: 180,
		label: "History builds while the contract is open"
	});
	const data = rows.map(([t, mid, p]) => ({
		t,
		mid: mid * 100,
		p: p * 100
	}));
	const { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } = mod;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-48 w-full min-w-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
			width: "100%",
			height: "100%",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
				data,
				margin: {
					left: 0,
					right: 8,
					top: 8,
					bottom: 0
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
						stroke: "var(--t-line)",
						strokeDasharray: "3 3",
						vertical: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
						dataKey: "t",
						tickFormatter: hhmm,
						tick: {
							fill: "var(--t-muted)",
							fontSize: 11
						},
						minTickGap: 48
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
						domain: [0, 100],
						tick: {
							fill: "var(--t-muted)",
							fontSize: 11
						},
						width: 36,
						tickFormatter: (v) => `${v}¢`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
						contentStyle: tip,
						labelFormatter: (t) => new Date(Number(t)).toLocaleTimeString(),
						formatter: (v, n) => [`${Number(v).toFixed(1)}%`, n === "mid" ? "Market" : "Model"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
						formatter: (v) => v === "mid" ? "Market YES" : "Model YES",
						wrapperStyle: { fontSize: 12 }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
						type: "monotone",
						dataKey: "mid",
						stroke: "var(--t-fg)",
						strokeWidth: 2,
						dot: false,
						isAnimationActive: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
						type: "monotone",
						dataKey: "p",
						stroke: "var(--t-primary)",
						strokeWidth: 2,
						dot: false,
						isAnimationActive: false
					})
				]
			})
		})
	});
}
/** Cumulative P&L per settled trade. */
function PnlCurve({ pnls }) {
	const mod = useRecharts();
	if (!mod || pnls.length < 2) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
		h: 180,
		label: "Needs two settled trades"
	});
	let c = 0;
	const data = pnls.map((p, i) => ({
		n: i + 1,
		c: c += p
	}));
	const { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, CartesianGrid } = mod;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-48 w-full min-w-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
			width: "100%",
			height: "100%",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
				data,
				margin: {
					left: 0,
					right: 8,
					top: 8,
					bottom: 0
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
						stroke: "var(--t-line)",
						strokeDasharray: "3 3",
						vertical: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
						dataKey: "n",
						tick: {
							fill: "var(--t-muted)",
							fontSize: 11
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
						tick: {
							fill: "var(--t-muted)",
							fontSize: 11
						},
						width: 48,
						tickFormatter: (v) => `$${Math.round(Number(v))}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReferenceLine, {
						y: 0,
						stroke: "var(--t-muted)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
						contentStyle: tip,
						labelFormatter: (n) => `Trade ${n}`,
						formatter: (v) => [`$${Number(v).toFixed(2)}`, "Cumulative"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
						type: "monotone",
						dataKey: "c",
						stroke: "var(--t-primary)",
						fill: "var(--t-primary)",
						fillOpacity: .16,
						strokeWidth: 2,
						dot: false,
						isAnimationActive: false
					})
				]
			})
		})
	});
}
/** Calibration: predicted bucket vs how often YES actually won. */
function CalibrationChart({ rows }) {
	const mod = useRecharts();
	const usable = rows.filter((r) => r.n > 0);
	if (!mod || usable.length < 2) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
		h: 200,
		label: "Needs more official settlements"
	});
	const data = usable.map((r) => ({
		p: r.p * 100,
		won: r.won * 100,
		n: r.n,
		ideal: r.p * 100
	}));
	const { ComposedChart, Line, Scatter, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } = mod;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-52 w-full min-w-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
			width: "100%",
			height: "100%",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComposedChart, {
				data,
				margin: {
					left: 0,
					right: 8,
					top: 8,
					bottom: 0
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
						stroke: "var(--t-line)",
						strokeDasharray: "3 3"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
						dataKey: "p",
						type: "number",
						domain: [0, 100],
						tick: {
							fill: "var(--t-muted)",
							fontSize: 11
						},
						tickFormatter: (v) => `${v}%`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
						type: "number",
						domain: [0, 100],
						tick: {
							fill: "var(--t-muted)",
							fontSize: 11
						},
						width: 36,
						tickFormatter: (v) => `${v}%`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
						contentStyle: tip,
						formatter: (v, n, item) => [`${Number(v).toFixed(0)}%`, n === "won" ? `Won (n=${item.payload.n})` : "Ideal"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
						dataKey: "ideal",
						stroke: "var(--t-muted)",
						strokeDasharray: "4 4",
						dot: false,
						isAnimationActive: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scatter, {
						dataKey: "won",
						fill: "var(--t-primary)"
					})
				]
			})
		})
	});
}
//#endregion
export { SpotChart as a, PnlCurve as i, EquityDrawdownChart as n, ModelVsMarketChart as r, CalibrationChart as t };
