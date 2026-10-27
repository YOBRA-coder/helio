import { C as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as useDesk, a as Pill, f as money, h as signedMoney, i as Panel, l as age, m as px, n as Button, r as Countdown, s as Stat } from "./router-e2V2EpZR.mjs";
import { a as SpotChart, n as EquityDrawdownChart } from "./charts-CKS2swHU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Cx7hFS96.js
var import_jsx_runtime = require_jsx_runtime();
function DeskHome() {
	const booted = useDesk((s) => s.booted);
	const spot = useDesk((s) => s.spot);
	const spots = useDesk((s) => s.spots);
	const spotSource = useDesk((s) => s.spotSource);
	const cash = useDesk((s) => s.cash);
	const positions = useDesk((s) => s.positions);
	const orders = useDesk((s) => s.orders);
	const dayStart = useDesk((s) => s.dayStartEquity);
	const signals = useDesk((s) => s.signals);
	const simMarkets = useDesk((s) => s.simMarkets);
	const liveMarkets = useDesk((s) => s.liveMarkets);
	const liveStatus = useDesk((s) => s.liveStatus);
	const bookStatus = useDesk((s) => s.bookStatus);
	const now = useDesk((s) => s.now);
	const mode = useDesk((s) => s.mode);
	const killed = useDesk((s) => s.killed);
	const circuitKind = useDesk((s) => s.circuitKind);
	const curve = useDesk((s) => s.curve);
	const spotDtMs = useDesk((s) => s.spotDtMs);
	const flatten = useDesk((s) => s.flatten);
	const scores = useDesk((s) => s.trial?.summary);
	const day = useDesk((s) => s.trial?.summary.last24h) ?? {
		trades: 0,
		wins: 0,
		pnl: 0
	};
	const openList = positions.filter((p) => p.status === "open").sort((a, b) => a.endAt - b.endAt);
	const reserved = orders.filter((o) => o.status === "open").reduce((sum, o) => sum + o.debit, 0);
	const marks = positions.filter((p) => p.status === "open").reduce((sum, p) => sum + p.quantity * p.lastMark, 0);
	const equity = cash + reserved + marks;
	const exposure = positions.filter((p) => p.status === "open").reduce((sum, p) => sum + p.quantity * p.averageCost, 0) + reserved;
	const pending = signals.filter((s) => s.status === "pending");
	const latestBlock = signals.find((s) => s.status === "blocked" || s.status === "expired");
	const approve = useDesk((s) => s.approve);
	const reject = useDesk((s) => s.reject);
	const first = spots[0];
	const last = spots[spots.length - 1];
	const drift = first && last ? (last - first) / first * 100 : 0;
	const openPositions = positions.filter((p) => p.status === "open").length;
	const streamed = liveMarkets.filter((market) => market.yesTokenId).slice(0, 6);
	const onBook = streamed.filter((market) => market.source === "Polymarket CLOB").length;
	const bookLabel = bookStatus === "live" ? "Live book" : bookStatus === "connecting" ? "Connecting" : bookStatus === "down" ? "Book down" : "Book idle";
	const read = !booted ? "The desk is still opening the tape. No order can leave until a reference print and a fresh book are both in." : [
		spot ? `BTC reference ${money(spot, 0)}. The path on screen has drifted ${drift >= 0 ? "up" : "down"} ${Math.abs(drift).toFixed(2)}% since this session's first print.` : "No BTC print yet. Windows stay dark until Coinbase answers.",
		killed ? "Emergency stop is holding. The model can still score, but it will not submit." : circuitKind ? "A circuit is open. New paper orders stay paused until you clear it." : pending.length ? `${pending.length} proposal${pending.length === 1 ? "" : "s"} cleared minimum edge. ${mode === "manual" ? "Manual mode will not send them without your approval." : "Auto paper mode may send them if the gates still hold."}` : latestBlock ? `Nothing is waiting. Latest gate: ${latestBlock.rejectedReason}` : "Nothing is waiting. A quiet log means the filter refused the book, not that the feed died.",
		`${liveMarkets.length} live Bitcoin windows from Polymarket. ${onBook} are priced off the public order book. ${simMarkets.length ? `${simMarkets.length} practice windows run underneath. ` : ""}${openPositions} paper position${openPositions === 1 ? "" : "s"} marked.`
	].join(" ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-3xl lg:col-span-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-3xl font-semibold tracking-tight",
						children: "The night desk for BTC contracts."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-muted",
						children: [
							"Helios watches public Polymarket Bitcoin markets, scores them with a transparent baseline, and will only paper-trade inside your risk gates. ",
							mode === "manual" ? "Manual approval is on." : "Auto paper mode is on.",
							" ",
							killed ? "The kill switch is holding new orders." : "Prices are live. Orders stay on paper."
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Baseline read",
					className: "lg:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed",
						children: read
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-muted",
						children: "Not a chatbot. This line is the same gates the order path uses."
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "BTC reference",
						value: spot ? money(spot, 0) : "—",
						hint: spotSource
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Paper equity",
						value: booted ? money(equity, 0) : "—",
						hint: "Cash, reserved, and marks"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Equity change today",
						value: booted ? signedMoney(equity - dayStart) : "—",
						hint: "Paper book incl. open positions"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Open exposure",
						value: booted ? money(exposure, 0) : "—",
						hint: "Cost of positions and resting orders"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Last 24 hours",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid min-w-0 gap-4 md:grid-cols-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs uppercase tracking-wide text-muted",
								children: "Last 24 hours · real windows only"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 font-mono text-xl tabular-nums",
								children: [
									day.trades,
									" · ",
									day.wins,
									"W ",
									day.trades - day.wins,
									"L"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `font-mono text-sm tabular-nums ${day.pnl >= 0 ? "text-primary" : "text-danger"}`,
								children: signedMoney(day.pnl)
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 md:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-wide text-muted",
							children: "Open positions"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-1 space-y-1 text-sm",
							children: [openList.slice(0, 4).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex min-w-0 items-start justify-between gap-3 rounded-md bg-raised px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "block text-xs font-medium text-muted",
										children: [
											p.group,
											" · ",
											p.side.toUpperCase()
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "line-clamp-2 break-words",
										children: p.question
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "shrink-0 pt-0.5 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Countdown, { end: p.endAt })
								})]
							}, p.id)), openList.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "text-muted",
								children: "None. Waiting for a signal that clears every gate."
							})]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "BTC reference and window opens",
					className: "lg:col-span-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpotChart, {
						spots,
						dtMs: spotDtMs,
						now,
						opens: liveMarkets.filter((m) => m.status === "open" && m.openSpot != null).slice(0, 4).map((m) => ({
							label: m.group,
							price: m.openSpot
						}))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "Dashed lines are the open print of each live Up/Down window. A window pays Up when the reference finishes above its line. Prints come from Coinbase; Polymarket resolves on its own source, so a close call can settle differently."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Needs a decision",
					className: "lg:col-span-2",
					children: [pending.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2 text-sm text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: booted ? "No approval is waiting." : "Syncing the tape…" }),
							latestBlock && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Latest gate: ", latestBlock.rejectedReason] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/signals",
								className: "inline-flex h-11 items-center font-semibold text-primary",
								children: "Open the signal log"
							})
						]
					}), pending.slice(0, 2).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-3",
						children: pending.slice(0, 2).map((signal) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-md bg-raised p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: signal.question
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 font-mono text-sm tabular-nums text-primary",
									children: [
										signal.side.toUpperCase(),
										" · edge ",
										signal.edge.toFixed(3),
										" · ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Countdown, { end: signal.expiresAt })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex flex-wrap gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										onClick: () => approve(signal.id),
										children: "Approve"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "quiet",
										onClick: () => reject(signal.id),
										children: "Dismiss"
									})]
								})
							]
						}, signal.id))
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Equity and drawdown",
					className: "lg:col-span-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EquityDrawdownChart, { data: curve })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Open positions",
					className: "lg:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "space-y-2 text-sm",
						children: [positions.filter((p) => p.status === "open").slice(0, 8).map((p) => {
							const pnl = p.quantity * (p.lastMark - p.averageCost) - p.fees;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "rounded-md bg-raised px-3 py-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate",
										children: p.question
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 flex items-center justify-between gap-2 font-mono text-xs tabular-nums text-muted",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											p.side.toUpperCase(),
											" ",
											p.quantity.toFixed(1),
											" @ ",
											p.averageCost.toFixed(2),
											" → ",
											p.lastMark.toFixed(2)
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: pnl >= 0 ? "text-primary" : "text-danger",
											children: signedMoney(pnl)
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => flatten(p.id),
										className: "mt-1 h-9 text-xs font-semibold text-primary",
										children: "Flatten at the touch"
									})
								]
							}, p.id);
						}), positions.filter((p) => p.status === "open").length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-muted",
							children: "No open positions."
						})]
					}), scores && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-xs text-muted",
						children: [
							"Record on real markets: ",
							scores.wins,
							"W / ",
							scores.losses,
							"L · net ",
							signedMoney(scores.netPnl),
							" · ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/trial",
								className: "underline",
								children: "full trial"
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Live Polymarket",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
					tone: bookStatus === "live" || onBook > 0 ? "good" : "neutral",
					children: bookLabel
				}),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 md:grid-cols-2 xl:grid-cols-3",
					children: [streamed.map((market) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-md border border-line bg-raised p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: market.source === "Polymarket CLOB" ? "good" : "neutral",
									children: market.group
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Countdown, { end: market.endAt })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm",
								children: market.question
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 flex items-center gap-2 font-mono text-sm tabular-nums",
								children: [
									market.source === "Polymarket CLOB" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "live-dot",
										"aria-hidden": "true"
									}),
									px(market.yesBid),
									" / ",
									px(market.yesAsk),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted",
										children: market.source === "Polymarket CLOB" ? `live · ${age(now, market.updatedAt)}` : "catalog"
									})
								]
							})
						]
					}, market.id)), streamed.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: liveStatus === "error" ? "The public Polymarket feed did not answer." : "Opening the current Bitcoin windows."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "5-minute, 15-minute, hourly, and 4-hour windows come from Polymarket's live series. Bids and asks stream from the public order book. No window id is hardcoded, and nothing here is a live order."
				})]
			}),
			simMarkets.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Paper windows",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
					tone: liveStatus === "ok" ? "good" : "neutral",
					children: liveStatus === "ok" ? "Reference up" : "Feed warming"
				}),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 md:grid-cols-3",
					children: [simMarkets.map((market) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "rounded-md border border-line bg-raised p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: market.group }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Countdown, { end: market.endAt })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm",
								children: market.question
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "relative mt-3 h-2 rounded-full bg-bg",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute inset-y-0 rounded-full bg-primary",
									style: {
										left: `${Math.min(96, market.yesBid * 100)}%`,
										width: `${Math.max(4, (market.yesAsk - market.yesBid) * 100)}%`
									}
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 font-mono text-sm tabular-nums text-muted",
								children: [
									Math.round(market.yesBid * 100),
									"–",
									Math.round(market.yesAsk * 100),
									"¢ · liq ",
									Math.round(market.liquidity / 1e3),
									"k"
								]
							})
						]
					}, market.id)), simMarkets.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Opening the 5m, 15m, and 1h paper windows."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "Simulated, so expiry can be rehearsed without a five-minute id pinned in the code."
				})]
			})
		]
	});
}
//#endregion
export { DeskHome as component };
