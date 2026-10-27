import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as getBacktest, P as startBacktest, _ as useDesk, a as Pill, f as money, h as signedMoney, i as Panel, n as Button, p as pct, s as Stat } from "./router-D_0PflgJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lab-DhOSagpW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function EquityChart({ data }) {
	const [mod, setMod] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let live = true;
		import("../_libs/recharts+[...].mjs").then((n) => n.t).then((loaded) => {
			if (live) setMod(loaded);
		});
		return () => {
			live = false;
		};
	}, []);
	if (!mod || data.length < 2) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid h-52 place-items-center rounded-md bg-raised text-sm text-muted",
		children: "Equity curve"
	});
	const { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } = mod;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-52 w-full min-w-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
			width: "100%",
			height: "100%",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
				data,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
						dataKey: "t",
						hide: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
						hide: true,
						domain: ["auto", "auto"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
						formatter: (value) => [`$${Number(value).toFixed(2)}`, "Equity"],
						contentStyle: {
							background: "var(--t-surface)",
							border: "1px solid var(--t-line)",
							borderRadius: 12,
							color: "var(--t-fg)"
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
						type: "monotone",
						dataKey: "equity",
						stroke: "var(--t-primary)",
						fill: "var(--t-primary)",
						fillOpacity: .18,
						strokeWidth: 2
					})
				]
			})
		})
	});
}
function LabPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RealBacktest, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
			className: "rounded-lg border border-line bg-surface p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
				className: "cursor-pointer text-sm font-semibold",
				children: "Coin-flip sanity check (synthetic, not real data)"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SyntheticLab, {})
			})]
		})]
	});
}
function RealBacktest() {
	const signedIn = useDesk((s) => s.signedIn);
	const [view, setView] = (0, import_react.useState)(null);
	const [days, setDays] = (0, import_react.useState)("7");
	const [max, setMax] = (0, import_react.useState)("400");
	const [msg, setMsg] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("test");
	const running = view?.job.status === "running";
	(0, import_react.useEffect)(() => {
		let live = true;
		const load = () => void getBacktest().then((v) => live && setView(v)).catch(() => {});
		load();
		const t = window.setInterval(load, running ? 2e3 : 15e3);
		return () => {
			live = false;
			window.clearInterval(t);
		};
	}, [running]);
	const r = view?.report;
	const period = r?.periods.find((p) => p.name === name) ?? r?.periods[2];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-3xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-semibold tracking-tight",
					children: "Backtest on what actually happened."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-muted",
					children: "Downloads resolved Polymarket Bitcoin windows with their price history and Coinbase candles, then replays the live rules minute by minute using only what was known at each moment. Settings are chosen on a validation slice; the test slice is scored once."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Run",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-end gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1 block text-muted",
									children: "Days back (1–30)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: days,
									onChange: (e) => setDays(e.target.value),
									inputMode: "numeric",
									className: "h-11 w-24 rounded-md border border-line bg-raised px-3 font-mono"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1 block text-muted",
									children: "Max windows per type"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: max,
									onChange: (e) => setMax(e.target.value),
									inputMode: "numeric",
									className: "h-11 w-28 rounded-md border border-line bg-raised px-3 font-mono"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								disabled: running || !signedIn,
								onClick: async () => {
									setMsg(null);
									const res = await startBacktest({ data: {
										days: Number(days),
										max: Number(max)
									} });
									if (!res.ok) setMsg(res.error ?? "Could not start");
									setView(await getBacktest());
								},
								children: running ? "Running…" : "Fetch real data and run"
							})
						]
					}),
					!signedIn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "Sign in to run it. The server needs internet access to Polymarket and Coinbase."
					}),
					msg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-danger",
						children: msg
					}),
					running && view && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm text-muted",
						role: "status",
						children: [
							view.job.phase,
							": ",
							view.job.done,
							"/",
							view.job.total || "…",
							" · this can take several minutes for many windows."
						]
					}),
					view?.job.status === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm text-danger",
						children: [
							"Failed: ",
							view.job.error,
							". Check the server can reach the internet."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-xs text-muted",
						children: ["Or from a terminal: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono",
							children: "npm run backtest -- --days 7 --max 400"
						})]
					})
				]
			}),
			!r && !running && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "No real-data result yet",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Run it once and the result stays here. Nothing below is simulated."
				})
			}),
			r && period && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: `rounded-lg border px-4 py-3 text-sm ${r.periods[2].netPnl > 0 && r.brier && r.brier.model < r.brier.market ? "border-line bg-surface" : "border-danger bg-danger-soft"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold",
						children: "Verdict: "
					}), r.verdict]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Windows replayed",
							value: String(r.marketsUsed),
							hint: `${new Date(r.range.from).toLocaleDateString()} → ${new Date(r.range.to).toLocaleDateString()}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Chosen min edge",
							value: r.chosen.minEdge.toFixed(2),
							hint: `haircut ${r.chosen.uncertaintyHaircut} · model weight ${r.chosen.blendW}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Brier: model",
							value: r.brier ? r.brier.model.toFixed(4) : "—",
							hint: "lower is better"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: "Brier: market",
							value: r.brier ? r.brier.market.toFixed(4) : "—",
							hint: "the bar to beat"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2 overflow-x-auto",
					children: r.periods.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setName(p.name),
						className: name === p.name ? "h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-semibold capitalize text-primary-fg" : "h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm capitalize",
						children: p.name
					}, p.name))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: `${period.name} equity · replayed on real data`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EquityChart, { data: period.curve })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Trades",
							value: String(period.trades)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Win rate",
							value: pct(period.winRate)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Net P&L",
							value: signedMoney(period.netPnl)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Fees",
							value: money(period.fees)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Profit factor",
							value: Number.isFinite(period.profitFactor) ? period.profitFactor.toFixed(2) : "∞"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Expectancy",
							value: signedMoney(period.expectancy)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Max drawdown",
							value: money(period.maxDrawdown)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "No trade",
							value: String(period.rejected)
						})
					]
				}),
				r.defaultTest && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Test slice: shipped defaults vs chosen settings",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							"Defaults (edge 0.02, haircut 0.35, weight 0.5): ",
							r.defaultTest.trades,
							" trades, ",
							signedMoney(r.defaultTest.netPnl),
							". Chosen: ",
							r.periods[2].trades,
							" trades, ",
							signedMoney(r.periods[2].netPnl),
							". If the chosen settings only win because they were picked on validation, expect them to fade live."
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "By window type",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2 text-sm",
						children: r.byGroup.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between gap-3 font-mono tabular-nums",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-12 font-sans",
									children: g.group
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted",
									children: [g.trades, " trades"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: pct(g.winRate)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: signedMoney(g.netPnl) })
							]
						}, g.group))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
					className: "rounded-lg border border-line bg-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
						className: "cursor-pointer text-sm font-semibold",
						children: "Parameter sweep (train / validation)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "mt-3 w-full text-left font-mono text-xs tabular-nums",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "edge" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "haircut" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "weight" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "train n" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "train exp" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "val n" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "val exp" })
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: r.sweep.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: s.params.minEdge === r.chosen.minEdge && s.params.uncertaintyHaircut === r.chosen.uncertaintyHaircut && s.params.blendW === r.chosen.blendW ? "text-primary" : "",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: s.params.minEdge }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: s.params.uncertaintyHaircut }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: s.params.blendW }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: s.train.trades }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: s.train.expectancy.toFixed(2) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: s.validation.trades }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: s.validation.expectancy.toFixed(2) })
							]
						}, i)) })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Assumptions and caveats",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "space-y-2 text-sm text-muted",
						children: [r.assumptions.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: a }, a)), r.notes.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-danger",
							children: a
						}, a))]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, { children: ["Model ", r.modelVersion] })
					})]
				})
			] })
		]
	});
}
function SyntheticLab() {
	const report = useDesk((s) => s.backtest);
	const runStudy = useDesk((s) => s.runStudy);
	const [name, setName] = (0, import_react.useState)("test");
	const period = report?.periods.find((item) => item.name === name) ?? report?.periods[2];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-3xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-semibold tracking-tight",
					children: "A backtest that is allowed to lose."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-muted",
					children: "This study is synthetic, time-ordered, and costed. It does not peek at the settlement. It is not a live track record and it is not a promise."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				onClick: () => runStudy(),
				children: report ? "Run the study again" : "Run train, validation, and test"
			}),
			!report && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Not run yet",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Uses your current fee, slippage, haircut, minimum edge, and stake. Results stay on this page and are labeled simulated."
				})
			}),
			report && period && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2 overflow-x-auto",
					children: report.periods.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setName(item.name),
						className: name === item.name ? "h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-semibold capitalize text-primary-fg" : "h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm capitalize",
						children: item.name
					}, item.name))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: `${period.name} equity · simulated`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EquityChart, { data: period.curve })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Trades",
							value: String(period.trades)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Win rate",
							value: pct(period.winRate)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Net P&L",
							value: signedMoney(period.netPnl)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Fees",
							value: money(period.fees)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Profit factor",
							value: Number.isFinite(period.profitFactor) ? period.profitFactor.toFixed(2) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Expectancy",
							value: signedMoney(period.expectancy)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Max drawdown",
							value: money(period.maxDrawdown)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Rejected",
							value: String(period.rejected)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Sample path",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2 text-sm",
						children: period.sample.map((trade, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between gap-3 font-mono tabular-nums",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: trade.rejected ? "Rejected" : trade.won ? "Settled up" : "Settled down" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted",
									children: [(trade.price * 100).toFixed(1), "¢"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: trade.rejected ? "—" : signedMoney(trade.pnl) })
							]
						}, `${period.name}-${index}`))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					title: "Assumptions",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2 text-sm text-muted",
						children: report.assumptions.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, line))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Pill, { children: ["Model ", report.modelVersion] })
					})]
				})
			] })
		]
	});
}
function Metric({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-line bg-surface p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs uppercase tracking-wide text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 font-mono text-xl tabular-nums",
			children: value
		})]
	});
}
//#endregion
export { LabPage as component };
