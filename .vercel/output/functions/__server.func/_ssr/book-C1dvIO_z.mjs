import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as STARTING_CASH } from "./engine-BmNSrsOt.mjs";
import { _ as useDesk, a as Pill, d as downloadText, f as money, g as toCsv, h as signedMoney, i as Panel, m as px, n as Button, p as pct, u as clock } from "./router-e2V2EpZR.mjs";
import { r as ModelVsMarketChart } from "./charts-CKS2swHU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/book-C1dvIO_z.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TABS = [
	"Positions",
	"Orders",
	"Fills"
];
function BookPage() {
	const cash = useDesk((s) => s.cash);
	const orders = useDesk((s) => s.orders);
	const fills = useDesk((s) => s.fills);
	const positions = useDesk((s) => s.positions);
	const flatten = useDesk((s) => s.flatten);
	const hist = useDesk((s) => s.hist);
	const [tab, setTab] = (0, import_react.useState)("Positions");
	const reserved = orders.filter((o) => o.status === "open").reduce((sum, o) => sum + o.debit, 0);
	const unrealized = positions.filter((p) => p.status === "open").reduce((sum, p) => sum + p.quantity * (p.lastMark - p.averageCost), 0);
	const marks = positions.filter((p) => p.status === "open").reduce((sum, p) => sum + p.quantity * p.lastMark, 0);
	const totalPnl = cash + reserved + marks - STARTING_CASH;
	const realized = totalPnl - unrealized;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-3xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-semibold tracking-tight",
					children: "Paper book, labeled as paper."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-muted",
					children: "Balances are simulated. Nothing here is a Polymarket wallet. Flatten sells at the current touch. Simulated windows settle by themselves at expiry."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						title: "Available",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-2xl tabular-nums",
							children: money(cash, 0)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						title: "Reserved",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-2xl tabular-nums",
							children: money(reserved, 0)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						title: "Unrealized · realized since reset",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-2xl tabular-nums",
								children: signedMoney(unrealized)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									"Realized ",
									signedMoney(realized),
									" · total ",
									signedMoney(totalPnl)
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted",
								children: "Whole paper account, practice trades included. The Trial page counts real windows only."
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [TABS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setTab(item),
					className: tab === item ? "h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg" : "h-11 rounded-full border border-line bg-surface px-4 text-sm",
					children: item
				}, item)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "quiet",
					className: "ml-auto",
					onClick: () => downloadText(`helios-trades-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`, toCsv([[
						"entered",
						"settled",
						"status",
						"kind",
						"window",
						"question",
						"side",
						"shares",
						"avg cost",
						"fees",
						"pnl",
						"model p(up)",
						"market mid",
						"edge",
						"result"
					], ...positions.map((p) => [
						new Date(p.entryAt).toISOString(),
						p.settledAt ? new Date(p.settledAt).toISOString() : "",
						p.status,
						p.kind,
						p.group,
						p.question,
						p.side,
						p.quantity.toFixed(2),
						p.averageCost.toFixed(4),
						p.fees.toFixed(2),
						p.realized.toFixed(2),
						p.pYesBase.toFixed(4),
						p.entryMid.toFixed(4),
						p.edgeAtEntry.toFixed(4),
						p.yesWon == null ? "" : p.yesWon ? "up" : "down"
					])])),
					children: "Export trades CSV"
				})]
			}),
			tab === "Positions" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [positions.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { label: "No paper positions yet. Approve a signal to open one." }), positions.map((position) => {
					const unrealized = position.quantity * position.lastMark - position.quantity * position.averageCost;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-lg border border-line bg-surface p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
										tone: position.status === "open" ? "good" : "neutral",
										children: position.status
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: position.kind === "live" ? "Polymarket paper" : "Sim" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: sideLabel(position.question, position.side) }),
									position.status === "settled" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
										tone: position.realized >= 0 ? "good" : "bad",
										children: position.realized >= 0 ? "Trade won" : "Trade lost"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-2 text-lg font-semibold",
								children: position.question
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 font-mono text-sm tabular-nums text-muted",
								children: [
									position.quantity.toFixed(2),
									" sh · avg ",
									px(position.averageCost),
									" · mark ",
									px(position.lastMark),
									" ·",
									" ",
									position.status === "open" ? signedMoney(unrealized) : signedMoney(position.realized)
								]
							}),
							position.settleNote && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: position.settleNote
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
								className: "mt-3 rounded-md border border-line bg-raised p-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
										className: "cursor-pointer text-sm font-semibold",
										children: "Trade detail"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
										className: "mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs tabular-nums sm:grid-cols-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Entered",
												v: clock(position.entryAt)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Window",
												v: position.group
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Model P(Up) at entry",
												v: pct(position.pYesBase)
											}),
											position.pYesAlt != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Shadow momentum P(Up)",
												v: pct(position.pYesAlt)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Market mid at entry",
												v: pct(position.entryMid)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Net edge at entry",
												v: position.edgeAtEntry.toFixed(3)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Fees",
												v: money(position.fees)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Model",
												v: position.modelVersion
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Your bet",
												v: `${sideLabel(position.question, position.side)} at ${px(position.averageCost)}`
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Window result",
												v: position.yesWon == null ? "not official / open" : upDownWon(position.question, position.yesWon)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												k: "Your trade",
												v: position.status === "open" ? "open" : position.realized >= 0 ? "WON" : "LOST"
											})
										]
									}),
									(hist[position.marketId]?.length ?? 0) > 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModelVsMarketChart, { rows: hist[position.marketId] })
									})
								]
							}),
							position.status === "open" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "quiet",
								className: "mt-3",
								onClick: () => flatten(position.id),
								children: "Flatten at touch"
							})
						]
					}, position.id + position.status + (position.settledAt ?? 0));
				})]
			}),
			tab === "Orders" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [orders.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { label: "No paper orders yet." }), orders.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-lg border border-line bg-surface p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: order.status }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: order.mode }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: order.venue })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-2 font-semibold",
							children: order.question
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 font-mono text-sm tabular-nums text-muted",
							children: [
								order.side.toUpperCase(),
								" ",
								order.quantity.toFixed(2),
								" @ ",
								px(order.limitPrice),
								" · ",
								clock(order.submittedAt)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-xs text-muted",
							children: ["Idempotency ", order.idempotencyKey]
						})
					]
				}, order.id))]
			}),
			tab === "Fills" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [fills.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { label: "Fills show up after a resting paper order is marketable." }), fills.map((fill) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-lg border border-line bg-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold",
						children: fill.question
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 font-mono text-sm tabular-nums text-muted",
						children: [
							fill.side.toUpperCase(),
							" ",
							fill.quantity.toFixed(2),
							" @ ",
							px(fill.price),
							" · fee ",
							money(fill.fee),
							" · ",
							clock(fill.filledAt)
						]
					})]
				}, fill.id))]
			})
		]
	});
}
var isUpDown = (q) => /up or down/i.test(q);
function sideLabel(question, side) {
	return isUpDown(question) ? side === "yes" ? "Bet: Up" : "Bet: Down" : side === "yes" ? "Bet: Yes" : "Bet: No";
}
function upDownWon(question, yesWon) {
	return isUpDown(question) ? yesWon ? "Up won" : "Down won" : yesWon ? "Yes won" : "No won";
}
function Row({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "font-sans text-muted",
		children: k
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: v })] });
}
function Empty({ label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "rounded-lg border border-line bg-surface p-4 text-sm text-muted",
		children: label
	});
}
//#endregion
export { BookPage as component };
