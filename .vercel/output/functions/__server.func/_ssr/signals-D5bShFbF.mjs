import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as feePerShare } from "./engine-BmNSrsOt.mjs";
import { _ as useDesk, a as Pill, d as downloadText, f as money, g as toCsv, i as Panel, m as px, n as Button, o as ProbBar, r as Countdown } from "./router-D_0PflgJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/signals-D5bShFbF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SignalCard({ signal, quiet = false }) {
	const approve = useDesk((s) => s.approve);
	const reject = useDesk((s) => s.reject);
	const dispatch = useDesk((s) => s.dispatch);
	const liveStatus = useDesk((s) => s.live.status);
	const source = useDesk((s) => s.source);
	const risk = useDesk((s) => s.risk);
	const market = useDesk((s) => s.simMarkets.find((m) => m.id === signal.marketId) ?? s.liveMarkets.find((m) => m.id === signal.marketId));
	const touch = market ? signal.side === "yes" ? market.yesAsk : 1 - market.yesBid : null;
	const outcome = signal.side === "yes" ? "Yes / Up" : "No / Down";
	const hair = signal.uncertainty * risk.uncertaintyHaircut;
	const fee = feePerShare(signal.executablePrice, risk);
	const checkEdge = signal.probability - hair - signal.executablePrice - fee;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		title: signal.question,
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
			tone: signal.status === "pending" ? "good" : signal.status === "blocked" || signal.status === "expired" ? "bad" : "neutral",
			children: signal.status
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: signal.kind === "live" ? "Polymarket" : "Simulated" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: signal.mode }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: outcome })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 font-mono text-sm tabular-nums sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Model"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [(signal.probability * 100).toFixed(1), "%"] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Limit"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: px(signal.executablePrice) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Stake"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: money(signal.stake) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Net edge"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: signal.edge >= 0 ? "text-primary" : "text-danger",
						children: signal.edge.toFixed(3)
					})] })
				]
			}),
			!quiet && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProbBar, {
						model: signal.probability,
						market: signal.executablePrice
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-muted",
						children: "Bar is the model on this side. Marker is the executable price."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 rounded-md bg-raised p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs uppercase tracking-wide text-muted",
							children: "How the edge is built (per share)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-sm tabular-nums",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Model chance this side wins" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: signal.probability.toFixed(3) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
									className: "text-muted",
									children: [
										"− uncertainty haircut (±",
										(signal.uncertainty * 100).toFixed(1),
										" pts × ",
										risk.uncertaintyHaircut,
										")"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: ["−", hair.toFixed(3)] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "− price paid (touch + slippage)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: ["−", signal.executablePrice.toFixed(3)] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "− Polymarket fee"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: ["−", fee.toFixed(3)] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "border-t border-line pt-1 font-semibold",
									children: "Net edge"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: `border-t border-line pt-1 font-semibold ${signal.edge >= 0 ? "text-primary" : "text-danger"}`,
									children: signal.edge.toFixed(3)
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-xs text-muted",
							children: [
								"Market mid for YES was ",
								(signal.marketMid * 100).toFixed(1),
								"¢; model YES ",
								(signal.pYesBase * 100).toFixed(1),
								"%",
								Math.abs(signal.pYesCtx - signal.pYesBase) > 5e-4 ? ` (context-adjusted ${(signal.pYesCtx * 100).toFixed(1)}%)` : "",
								".",
								Math.abs(checkEdge - signal.edge) > .002 ? " Figures may differ slightly if limits changed after this signal." : ""
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-1 text-sm text-muted",
					children: signal.rationale.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, line))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-1 text-sm",
					children: signal.risks.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, line))
				})
			] }),
			signal.rejectedReason && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-danger",
				children: signal.rejectedReason
			}),
			signal.status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: () => approve(signal.id),
						children: "Approve paper order"
					}),
					liveStatus !== "off" && signal.kind === "live" && source !== "local" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "quiet",
						onClick: () => void dispatch({
							type: "liveSend",
							signalId: signal.id
						}),
						children: liveStatus === "armed" ? "Approve + send live" : "Approve + live dry-run"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "quiet",
						onClick: () => reject(signal.id),
						children: "Dismiss"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							"Expires in ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Countdown, { end: signal.expiresAt }),
							touch != null && ` · touch now ${px(touch)}`
						]
					})
				]
			})
		]
	});
}
var TABS = [
	"Pending",
	"Blocked",
	"History",
	"All"
];
function SignalsPage() {
	const signals = useDesk((s) => s.signals);
	const [tab, setTab] = (0, import_react.useState)("Pending");
	const [query, setQuery] = (0, import_react.useState)("");
	const [win, setWin] = (0, import_react.useState)("all");
	const [reason, setReason] = (0, import_react.useState)(null);
	const reasons = (0, import_react.useMemo)(() => {
		const m = /* @__PURE__ */ new Map();
		for (const x of signals) {
			if (x.status !== "blocked" || !x.rejectedReason) continue;
			const key = x.rejectedReason.replace(/-?\d+(\.\d+)?/g, "#");
			m.set(key, (m.get(key) ?? 0) + 1);
		}
		return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
	}, [signals]);
	const windowOf = (q) => {
		const m = q.match(/(\d{1,2}(?::\d{2})?\s?[AP]M)\s?-\s?(\d{1,2}(?::\d{2})?\s?[AP]M)/i);
		if (!m) return /4:00PM|12:00PM-4/i.test(q) ? "4h" : "1h";
		const toMin = (t) => {
			const [, h, mi, ap] = t.match(/(\d{1,2})(?::(\d{2}))?\s?([AP])M/i) ?? [];
			return (Number(h) % 12 + (ap?.toUpperCase() === "P" ? 12 : 0)) * 60 + Number(mi ?? 0);
		};
		const d = (toMin(m[2]) - toMin(m[1]) + 1440) % 1440;
		return d <= 5 ? "5m" : d <= 15 ? "15m" : d <= 60 ? "1h" : "4h";
	};
	const rows = signals.filter((signal) => {
		if (query && !signal.question.toLowerCase().includes(query.toLowerCase())) return false;
		if (win !== "all" && windowOf(signal.question) !== win) return false;
		if (reason && (signal.rejectedReason ?? "").replace(/-?\d+(\.\d+)?/g, "#") !== reason) return false;
		if (tab === "Pending") return signal.status === "pending";
		if (tab === "Blocked") return signal.status === "blocked" || signal.status === "expired" || signal.status === "rejected";
		if (tab === "All") return true;
		return signal.status === "executed" || signal.status === "approved";
	});
	const exportCsv = () => downloadText(`helios-signals-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`, toCsv([[
		"time",
		"status",
		"kind",
		"window question",
		"side",
		"model p(side)",
		"price",
		"stake",
		"edge",
		"reason"
	], ...signals.map((x) => [
		new Date(x.createdAt).toISOString(),
		x.status,
		x.kind,
		x.question,
		x.side,
		x.probability.toFixed(4),
		x.executablePrice.toFixed(4),
		x.stake.toFixed(2),
		x.edge.toFixed(4),
		x.rejectedReason ?? ""
	])]));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-3xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-semibold tracking-tight",
					children: "Every idea has to clear the gate."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-muted",
					children: "Manual mode waits for a deliberate approval. If the touch moves more than 2.5¢, or 35 seconds pass, the approval dies. Auto mode can submit only when the same hard gates pass, and it is off until you turn it on."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 overflow-x-auto",
				children: TABS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab(item),
					className: tab === item ? "h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg" : "h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm",
					children: item
				}, item))
			}),
			reasons.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border border-line bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold",
						children: "Why signals were blocked"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 space-y-1",
						children: reasons.map(([text, n]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								setReason(reason === text ? null : text);
								setTab("Blocked");
							},
							className: `flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm ${reason === text ? "bg-primary text-primary-fg" : ""}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 flex-1",
								children: text.replace("#", "…")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono tabular-nums",
								children: n
							})]
						}) }, text))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-muted",
						children: "Tap a reason to filter. Mostly \"net edge below the minimum\" means the filter is working."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: "Search windows",
					"aria-label": "Search signals",
					className: "h-11 min-w-0 flex-1 rounded-md border border-line bg-raised px-3 text-sm"
				}), [
					"all",
					"5m",
					"15m",
					"1h",
					"4h"
				].map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setWin(w),
					className: win === w ? "h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg" : "h-11 rounded-full border border-line bg-surface px-4 text-sm",
					children: w === "all" ? "All windows" : w
				}, w))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						signals.length,
						" signals kept · ",
						signals.filter((x) => x.status === "executed").length,
						" executed · ",
						signals.filter((x) => x.status === "blocked").length,
						" blocked"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "quiet",
					onClick: exportCsv,
					children: "Export CSV"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [rows.map((signal) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignalCard, {
					signal,
					quiet: tab !== "Pending" && tab !== "All"
				}, signal.id)), rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-lg border border-line bg-surface p-4 text-sm text-muted",
					children: "Nothing in this tab. The baseline is picky on purpose. A quiet log is a working filter, not a broken feed."
				})]
			})
		]
	});
}
//#endregion
export { SignalsPage as component };
