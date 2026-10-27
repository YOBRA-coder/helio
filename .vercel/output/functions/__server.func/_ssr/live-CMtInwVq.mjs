import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as useDesk, a as Pill, f as money, h as signedMoney, i as Panel, n as Button, s as Stat, u as clock } from "./router-D_0PflgJ.mjs";
import { n as LIVE_CEILING, t as ARM_PHRASE } from "./live-const-QXZLlCa8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/live-CMtInwVq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Check({ ok, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex items-start gap-3 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: ok ? "text-primary" : "text-danger",
			"aria-hidden": "true",
			children: ok ? "✓" : "✗"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children })]
	});
}
function LivePage() {
	const live = useDesk((s) => s.live);
	const env = useDesk((s) => s.liveEnv);
	const trial = useDesk((s) => s.trial);
	const source = useDesk((s) => s.source);
	const killed = useDesk((s) => s.killed);
	const dispatch = useDesk((s) => s.dispatch);
	const note = useDesk((s) => s.commandNote);
	const signedIn = useDesk((s) => s.signedIn);
	const [phrase, setPhrase] = (0, import_react.useState)("");
	const [stake, setStake] = (0, import_react.useState)("");
	const [expo, setExpo] = (0, import_react.useState)("");
	const [loss, setLoss] = (0, import_react.useState)("");
	const serverOk = source === "server";
	const envOk = signedIn && env.enabled && env.hasKey && env.hasFunder;
	const eligible = Boolean(trial?.eligible);
	const openExposure = live.orders.filter((o) => o.status === "open" || o.status === "filled" && !o.settled).reduce((a, o) => a + o.debit, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-3xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-semibold tracking-tight",
					children: "Live is a door with four locks."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-muted",
					children: "Paper keeps running underneath, so you can see how far live fills drift from the simulation. Real orders need the your saved keys, a passed paper trial, and a typed confirmation. They go out only inside small caps, and the kill switch disarms them."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Status",
						value: live.status === "armed" ? "ARMED" : live.status === "dry" ? "Dry run" : "Off",
						hint: live.armedAt ? `since ${clock(live.armedAt)}` : void 0
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Live P&L",
						value: signedMoney(live.realized),
						hint: `today ${signedMoney(live.dayRealized)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Open live exposure",
						value: money(openExposure),
						hint: `cap ${money(live.maxExposure)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "Exchange cash",
						value: live.exchangeCash != null ? money(live.exchangeCash) : "—",
						hint: live.lastReconcileAt ? `checked ${clock(live.lastReconcileAt)}` : "not checked"
					})
				]
			}),
			note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm text-danger",
				children: note
			}),
			live.lastError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm text-danger",
				children: ["Last live error: ", live.lastError]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Checklist",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							ok: serverOk,
							children: "Server worker is running (live never runs from the browser tab)."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							ok: signedIn,
							children: "You are signed in (live is tied to your account)."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							ok: env.enabled,
							children: "The operator turned live trading on for this server (HELIOS_LIVE_ENABLED=1)."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Check, {
							ok: env.hasKey && env.hasFunder,
							children: [
								"Your signing key and funder address are saved on the ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/account",
									className: "underline",
									children: "Account"
								}),
								" page. They are never sent back to the browser."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Check, {
							ok: eligible,
							children: [
								"Paper trial passed the gate (",
								trial ? `${trial.checks.filter((c) => c.pass).length}/${trial.checks.length}` : "0/0",
								" checks). Dry run does not need this; arming does."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							ok: !killed,
							children: "Kill switch is released."
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Mode",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: live.status === "off" ? "primary" : "quiet",
							onClick: () => void dispatch({
								type: "liveSetStatus",
								status: "off"
							}),
							children: "Off"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: live.status === "dry" ? "primary" : "quiet",
							disabled: !serverOk || !envOk,
							onClick: () => void dispatch({
								type: "liveSetStatus",
								status: "dry"
							}),
							children: "Dry run (sign, don’t post)"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "Run the dry mode for a day first. It builds and signs the exact orders without sending them, so you can check sizes and prices in the audit log."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-lg border border-danger p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: "Arm live trading"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-sm text-muted",
								children: [
									"Type ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono",
										children: ARM_PHRASE
									}),
									" to enable the button."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: phrase,
								onChange: (e) => setPhrase(e.target.value),
								className: "mt-2 h-11 w-full rounded-md border border-line bg-raised px-3 text-sm",
								placeholder: ARM_PHRASE,
								autoComplete: "off"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "danger",
								className: "mt-3",
								disabled: !serverOk || !envOk || !eligible || killed || phrase !== "I understand this trades real money",
								onClick: () => {
									dispatch({
										type: "liveSetStatus",
										status: "armed",
										confirm: phrase
									});
									setPhrase("");
								},
								children: "Arm live"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Caps",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mb-1 block text-muted",
									children: [
										"Max per order ($, ≤ ",
										LIVE_CEILING.maxStake,
										")"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: stake,
									onChange: (e) => setStake(e.target.value),
									placeholder: String(live.maxStake),
									inputMode: "decimal",
									className: "h-11 w-full rounded-md border border-line bg-raised px-3 font-mono"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mb-1 block text-muted",
									children: [
										"Max open exposure ($, ≤ ",
										LIVE_CEILING.maxExposure,
										")"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: expo,
									onChange: (e) => setExpo(e.target.value),
									placeholder: String(live.maxExposure),
									inputMode: "decimal",
									className: "h-11 w-full rounded-md border border-line bg-raised px-3 font-mono"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mb-1 block text-muted",
									children: [
										"Daily loss stop ($, ≤ ",
										LIVE_CEILING.dailyLossLimit,
										")"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: loss,
									onChange: (e) => setLoss(e.target.value),
									placeholder: String(live.dailyLossLimit),
									inputMode: "decimal",
									className: "h-11 w-full rounded-md border border-line bg-raised px-3 font-mono"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "quiet",
							onClick: () => {
								dispatch({
									type: "liveUpdate",
									maxStake: stake ? Number(stake) : void 0,
									maxExposure: expo ? Number(expo) : void 0,
									dailyLossLimit: loss ? Number(loss) : void 0
								});
								setStake("");
								setExpo("");
								setLoss("");
							},
							children: "Save caps"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: live.auto,
								disabled: live.status === "off",
								onChange: (e) => void dispatch({
									type: "liveUpdate",
									auto: e.target.checked
								})
							}), "Mirror every executed paper signal live (auto)"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "With auto off, only signals you press “Approve + send live” on go out."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Live orders",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: live.orders.length }),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-2 text-sm",
					children: [live.orders.slice(0, 20).map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-md bg-raised px-3 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: o.question
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
									tone: o.status === "filled" || o.status === "open" ? "good" : o.status === "error" || o.status === "rejected" ? "bad" : "neutral",
									children: o.status
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 font-mono text-xs tabular-nums text-muted",
								children: [
									o.side.toUpperCase(),
									" ",
									o.size,
									" @ ",
									o.price.toFixed(2),
									" · ",
									clock(o.submittedAt),
									o.pnl != null ? ` · P&L ${signedMoney(o.pnl)}` : ""
								]
							}),
							o.note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted",
								children: o.note
							})
						]
					}, o.id)), live.orders.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-muted",
						children: "No live or dry-run orders yet."
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Before you put money in",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "list-disc space-y-1 pl-5 text-sm text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Check Polymarket’s current terms and whether trading is permitted where you are. Helios does not route around regional restrictions, and neither should you." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "This module has been tested against a mock exchange only. Dry-run first, then start with the smallest caps." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Paper fills are friendlier than real ones: queue position, partial fills, and fees on the taker side all cost more live." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Keep only what you can lose in the funder wallet." })
					]
				})
			})
		]
	});
}
//#endregion
export { LivePage as component };
