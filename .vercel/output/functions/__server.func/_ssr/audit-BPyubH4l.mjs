import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as useDesk, d as downloadText, f as money, g as toCsv, h as signedMoney, i as Panel, n as Button, p as pct, u as clock } from "./router-e2V2EpZR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/audit-BPyubH4l.js
var import_jsx_runtime = require_jsx_runtime();
function AuditPage() {
	const audit = useDesk((s) => s.audit);
	const signals = useDesk((s) => s.signals);
	const settled = useDesk((s) => s.positions).filter((p) => p.status === "settled");
	const sum = useDesk((s) => s.trial?.summary);
	const calibration = (sum?.calibration ?? []).map((c) => ({
		label: `${Math.round(c.p * 100)}%`,
		n: c.n,
		hit: c.won
	}));
	function exportDecisions() {
		const rows = [[
			"time",
			"status",
			"market",
			"side",
			"price",
			"stake",
			"edge",
			"reason",
			"model"
		], ...signals.map((s) => [
			new Date(s.createdAt).toISOString(),
			s.status,
			s.question,
			s.side,
			s.executablePrice,
			s.stake.toFixed(2),
			s.edge.toFixed(4),
			s.rejectedReason ?? "",
			s.modelVersion
		])];
		downloadText("helios-decisions.csv", toCsv(rows));
	}
	function exportTrades() {
		const rows = [[
			"time",
			"market",
			"side",
			"qty",
			"avg",
			"realized",
			"note"
		], ...settled.map((p) => [
			p.settledAt ? new Date(p.settledAt).toISOString() : "",
			p.question,
			p.side,
			p.quantity.toFixed(4),
			p.averageCost.toFixed(4),
			p.realized.toFixed(2),
			p.settleNote ?? ""
		])];
		downloadText("helios-trades.csv", toCsv(rows));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-3xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-semibold tracking-tight",
					children: "Why it traded, or why it didn't."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-muted",
					children: "Paper results only. Live exchange results: none — this desk cannot send an order. Secrets are not written because none are collected."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "quiet",
					onClick: exportDecisions,
					children: "Export decisions"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "quiet",
					onClick: exportTrades,
					children: "Export trades"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "Settled trades (real windows)",
						value: String(sum?.trades ?? 0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "Win rate",
						value: sum?.trades ? pct(sum.winRate) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "Avg win / loss",
						value: `${sum?.wins ? money(sum.avgWin) : "—"} / ${sum?.losses ? money(Math.abs(sum.avgLoss)) : "—"}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "Net P&L",
						value: signedMoney(sum?.netPnl ?? 0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "Fees",
						value: money(sum?.fees ?? 0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "Profit factor",
						value: sum && Number.isFinite(sum.profitFactor) && sum.profitFactor > 0 ? sum.profitFactor.toFixed(2) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "Expectancy per trade",
						value: sum?.trades ? signedMoney(sum.expectancy) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
						label: "Max drawdown",
						value: money(sum?.maxDrawdown ?? 0)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					"Same record as the Trial page. Practice windows are excluded",
					sum && sum.sim.trades > 0 ? ` (${sum.sim.trades} practice trades, ${signedMoney(sum.sim.netPnl)}, not counted)` : "",
					". The Book page shows the paper account, which also includes practice trades and open positions, so its totals differ on purpose."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Calibration on real settlements",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2 text-sm",
					children: calibration.map((bucket) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between gap-3 font-mono tabular-nums",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Model ≈ ", bucket.label] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted",
								children: [bucket.n, " settled"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [bucket.n ? pct(bucket.hit) : "—", " hit"] })
						]
					}, bucket.label))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "Hit rate is how often Up/Yes won at that model probability, not how often the trade made money."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Audit trail",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-3",
					children: [audit.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "border-b border-line pb-3 last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: [
									clock(entry.at),
									" · ",
									entry.actor
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium",
								children: entry.action
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: entry.detail
							})
						]
					}, entry.id)), audit.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-sm text-muted",
						children: "The trail starts when the desk boots."
					})]
				})
			})
		]
	});
}
function Mini({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-line bg-surface p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs uppercase tracking-wide text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 font-mono text-lg tabular-nums",
			children: value
		})]
	});
}
//#endregion
export { AuditPage as component };
