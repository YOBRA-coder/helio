import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as useDesk, a as Pill, f as money, h as signedMoney, i as Panel, n as Button, p as pct, s as Stat, u as clock } from "./router-e2V2EpZR.mjs";
import { i as PnlCurve, n as EquityDrawdownChart, t as CalibrationChart } from "./charts-CKS2swHU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/trial-ChKljDlW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function TrialPage() {
	const trial = useDesk((s) => s.trial);
	const curve = useDesk((s) => s.curve);
	const context = useDesk((s) => s.context);
	const source = useDesk((s) => s.source);
	const startedAt = useDesk((s) => s.trialStartedAt);
	const resetTrial = useDesk((s) => s.resetTrial);
	const [confirm, setConfirm] = (0, import_react.useState)(false);
	const sum = trial?.summary;
	const blend = useDesk((s) => s.blend);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-3xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-semibold tracking-tight",
					children: "A week of paper, scored honestly."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-muted",
					children: "Only settled trades on real Polymarket markets count here. Simulated windows are priced with a built-in bias so the desk has something to rehearse on, so they never enter the record. Fills use the ask plus your slippage and a fee, and positions settle only when Polymarket reports a resolution."
				})]
			}),
			source === "local" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted",
				children: "This is the browser desk, so the clock stops when the tab closes. Run the worker for an unattended trial."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Trial clock",
						value: sum ? `${sum.days.toFixed(1)} d` : "—",
						hint: startedAt ? `since ${clock(startedAt)}` : void 0
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Settled trades",
						value: String(sum?.trades ?? 0),
						hint: `${sum?.officialTrades ?? 0} official resolutions`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Net P&L",
						value: sum ? signedMoney(sum.netPnl) : "—",
						hint: sum ? `fees ${money(sum.fees)}` : void 0
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Win rate",
						value: sum ? pct(sum.winRate) : "—",
						hint: sum ? `PF ${Number.isFinite(sum.profitFactor) ? sum.profitFactor.toFixed(2) : "∞"}` : void 0
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Equity and drawdown · paper",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EquityDrawdownChart, { data: curve })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Cumulative P&L per settled trade",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PnlCurve, { pnls: sum?.pnls ?? [] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Calibration: model vs what happened",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalibrationChart, { rows: sum?.calibration ?? [] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm",
							children: trial?.calibration
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs text-muted",
							children: "Dots on the dashed line mean the model’s 70% really wins 70% of the time. Dots far from it mean overconfidence."
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Live eligibility",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
					tone: trial?.eligible ? "good" : "bad",
					children: trial?.eligible ? "Eligible for a tiny live test" : "Not yet"
				}),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2",
						children: (trial?.checks ?? []).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-start gap-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: c.pass ? "text-primary" : "text-danger",
								"aria-hidden": "true",
								children: c.pass ? "✓" : "✗"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block",
									children: c.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block font-mono text-xs text-muted",
									children: c.detail
								})]
							})]
						}, c.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: trial?.power
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-muted",
						children: "Passing means the paper record does not rule the idea out. It is not proof of an edge, and live fills will be worse than paper fills."
					})
				]
			}),
			sum && sum.brierModel != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Calibration (Brier score, lower is better)",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 font-mono text-sm tabular-nums sm:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "Model"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: sum.brierModel.toFixed(4) })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "Model + context"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: sum.brierCtx?.toFixed(4) ?? "—" })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "Shadow: momentum"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: sum.brierAlt?.toFixed(4) ?? "needs 10+" })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "Market price"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: sum.brierMarket?.toFixed(4) ?? "—" })] })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "A coin flip scores 0.25. If the model does not beat the market column, its “edge” is noise and the gate stays closed."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Model trust (learned from your own settled trades)",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-mono text-3xl tabular-nums",
					children: [Math.round(blend.w * 100), "%"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm text-muted",
					children: [
						"The desk never trades the raw model. It trades the market price plus this share of the model's disagreement with it.",
						blend.n < 40 ? ` Still on the starting value of 50%: it needs 40 settled real windows to learn (${blend.n} so far).` : ` Fitted on ${blend.n} settled real windows: model accuracy ${blend.brierModel?.toFixed(4)}, market ${blend.brierMarket?.toFixed(4)}, blend ${blend.brierBlend?.toFixed(4)} (lower is better).`,
						blend.n >= 40 && blend.w < .15 ? " A low number means the model adds little beyond the market, so expect very few trades." : ""
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Where the results come from",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mb-3 text-sm text-muted",
					children: [
						"Only segments with 20+ trades are judged. A segment marked ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "losing" }),
						" has an average result below zero even after allowing for luck. Do not tune the strategy on small segments, they flip back and forth."
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 md:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Insight, {
						title: "By side",
						rows: sum?.bySide ?? [],
						pnls: sum?.pnls
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Insight, {
						title: "By edge size at entry",
						rows: sum?.byEdge ?? [],
						pnls: sum?.pnls
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Breakdown, {
					title: "By window",
					rows: sum?.byGroup ?? []
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Breakdown, {
					title: "By time to expiry at entry",
					rows: sum?.byTtx ?? []
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Context signals",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: context?.worldMonitor.status === "ok" ? "good" : context?.worldMonitor.status === "error" ? "bad" : "neutral",
								children: ["World Monitor: ", context?.worldMonitor.status ?? "off"]
							}),
							context?.fearGreed != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, { children: ["Fear & Greed ", Math.round(context.fearGreed)] }),
							context && context.stakeScale < 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, {
								tone: "bad",
								children: ["Stake ×", context.stakeScale]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mb-3 text-sm text-muted",
						children: [context?.worldMonitor.detail ?? "Waiting for the first context refresh.", " Context can shrink stake or block a trade; it never creates one. Its effect on probabilities is capped at ±2 points, off unless enabled, and scored separately above."]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "space-y-2 text-sm",
						children: [(context?.crowd ?? []).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-baseline justify-between gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: c.url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: "underline decoration-line underline-offset-2",
										href: c.url,
										target: "_blank",
										rel: "noreferrer",
										children: c.title
									}) : c.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono tabular-nums",
									children: [(c.yes * 100).toFixed(0), "%"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-24 text-right text-xs text-muted",
									children: c.source
								})
							]
						}, `${c.source}-${c.title}`)), (context?.crowd.length ?? 0) === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-muted",
							children: "No related markets loaded yet."
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Recent settled trades",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-2 text-sm",
					children: [(trial?.recent ?? []).slice(0, 15).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between gap-3 font-mono tabular-nums",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-24 text-muted",
								children: clock(r.settledAt)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1 truncate font-sans",
								children: [
									r.group,
									" · ",
									r.side.toUpperCase(),
									r.kind === "sim-window" ? " · sim" : ""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: r.pnl >= 0 ? "text-primary" : "text-danger",
								children: signedMoney(r.pnl)
							})
						]
					}, r.id)), (trial?.recent.length ?? 0) === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-muted",
						children: "No settled trades yet."
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Start over",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Clears the paper book, scores, and trial clock. Limits, mode, and live setup are kept. Do this after you change the model so old results do not flatter the new version."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-2",
					children: !confirm ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "quiet",
						onClick: () => setConfirm(true),
						children: "Reset trial"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "danger",
						onClick: () => {
							resetTrial();
							setConfirm(false);
						},
						children: "Yes, wipe the record"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "quiet",
						onClick: () => setConfirm(false),
						children: "Cancel"
					})] })
				})]
			})
		]
	});
}
function Breakdown({ title, rows }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
		title,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
			className: "space-y-2 text-sm",
			children: [rows.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center justify-between gap-3 font-mono tabular-nums",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-24 font-sans",
						children: b.key
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted",
						children: [b.trades, " trades"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: b.trades ? pct(b.wins / b.trades) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: b.pnl >= 0 ? "text-primary" : "text-danger",
						children: signedMoney(b.pnl)
					})
				]
			}, b.key)), rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "text-muted",
				children: "No data yet."
			})]
		})
	});
}
function Insight({ title, rows }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mb-2 text-xs uppercase tracking-wide text-muted",
		children: title
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
		className: "space-y-2 text-sm",
		children: [rows.map((b) => {
			const exp = b.trades ? b.pnl / b.trades : 0;
			const judged = b.trades >= 20;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center justify-between gap-3 font-mono tabular-nums",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "min-w-0 flex-1 truncate font-sans",
						children: b.key
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted",
						children: [b.trades, "×"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: b.trades ? pct(b.wins / b.trades) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: b.pnl >= 0 ? "text-primary" : "text-danger",
						children: signedMoney(b.pnl)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "w-16 text-right font-sans text-xs",
						children: !judged ? "too few" : exp < 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
							className: "text-danger",
							children: "losing"
						}) : "ok"
					})
				]
			}, b.key);
		}), rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
			className: "text-muted",
			children: "No data yet."
		})]
	})] });
}
//#endregion
export { TrialPage as component };
