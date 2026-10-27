import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as DEFAULT_RISK, r as MODEL_VERSION } from "./engine-BmNSrsOt.mjs";
import { _ as useDesk, c as ThemeSwatches, i as Panel, n as Button } from "./router-e2V2EpZR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/controls-jWGrRQ8k.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LIMIT_KEYS = [
	"maxStake",
	"maxExposure",
	"dailyLossLimit",
	"drawdownLimit",
	"maxOrdersPerHour",
	"minEdge",
	"maxSpread",
	"minLiquidity",
	"feeCoef",
	"slippage"
];
var pick = (r) => Object.fromEntries(LIMIT_KEYS.map((k) => [k, r[k]]));
var PRESETS = [
	{
		id: "cautious",
		name: "Cautious",
		note: "Small bets, tight loss limits, only clearer edges",
		values: {
			maxStake: 10,
			maxExposure: 50,
			dailyLossLimit: 25,
			drawdownLimit: 100,
			maxOrdersPerHour: 4,
			minEdge: .03,
			maxSpread: .04,
			minLiquidity: 3e3
		}
	},
	{
		id: "default",
		name: "Default",
		note: "The recommended starting limits",
		values: pick(DEFAULT_RISK)
	},
	{
		id: "active",
		name: "Active",
		note: "Bigger bets and more trades, more risk",
		values: {
			maxStake: 150,
			maxExposure: 800,
			dailyLossLimit: 400,
			drawdownLimit: 800,
			maxOrdersPerHour: 12,
			minEdge: .015,
			maxSpread: .08,
			minLiquidity: 1e3
		}
	}
];
function ControlsPage() {
	const mode = useDesk((s) => s.mode);
	const setMode = useDesk((s) => s.setMode);
	const killed = useDesk((s) => s.killed);
	const setKilled = useDesk((s) => s.setKilled);
	const risk = useDesk((s) => s.risk);
	const updateRisk = useDesk((s) => s.updateRisk);
	const [opened] = (0, import_react.useState)(() => pick(risk));
	const same = (v) => LIMIT_KEYS.every((k) => v[k] === void 0 || Math.abs(risk[k] - v[k]) < 1e-9);
	const circuitKind = useDesk((s) => s.circuitKind);
	const reconcileNote = useDesk((s) => s.reconcileNote);
	const simulateMismatch = useDesk((s) => s.simulateMismatch);
	const clearMismatch = useDesk((s) => s.clearMismatch);
	const [confirmAuto, setConfirmAuto] = (0, import_react.useState)(false);
	const [armed, setArmed] = (0, import_react.useState)(false);
	const [confirmResume, setConfirmResume] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-3xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-semibold tracking-tight",
					children: "Limits, themes, and the stop."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-muted",
					children: "Five atmospheres restyle the whole desk. The model cannot raise a risk limit. Auto mode ships off. This build never asks for a wallet seed and never sends a live order."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Themes",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeSwatches, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Mode",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-sm text-muted",
					children: "Manual asks before every paper order. Auto may submit qualifying paper orders without a click. Switching back to manual stops new autonomous submissions. Open paper orders stay working unless the kill switch cancels them."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: mode === "manual" ? "primary" : "quiet",
						onClick: () => setMode("manual"),
						children: "Manual"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: mode === "auto" ? "primary" : "quiet",
						onClick: () => setConfirmAuto(true),
						children: "Auto"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Kill switch",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							"Turning it on blocks every new paper order. ",
							risk.cancelOnKill ? "Resting paper orders are cancelled and their reserved cash returns." : "Resting paper orders are left working.",
							" Positions are not force-closed. A real Polymarket account is not connected, so nothing is cancelled there."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "danger",
							onClick: () => setKilled(true),
							disabled: killed,
							children: killed ? "Emergency stop is on" : "Emergency stop"
						}), killed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "quiet",
							onClick: () => setConfirmResume(true),
							children: "Release stop"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-4 flex items-center gap-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: risk.cancelOnKill,
							onChange: (event) => updateRisk({ cancelOnKill: event.target.checked })
						}), "Cancel resting paper orders when the stop is hit"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Risk limits",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-4 grid gap-2 sm:grid-cols-3",
						children: PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => updateRisk(p.values),
							className: `rounded-xl border px-3 py-2 text-left ${same(p.values) ? "border-primary text-primary" : "border-line text-muted"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block text-sm font-semibold",
								children: [p.name, same(p.values) ? " · active" : ""]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-xs",
								children: p.note
							})]
						}, p.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							onClick: () => updateRisk(pick(DEFAULT_RISK)),
							disabled: same(pick(DEFAULT_RISK)),
							children: "Reset to defaults"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "quiet",
							onClick: () => updateRisk(opened),
							disabled: same(opened),
							children: "Undo changes since opening"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 md:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								label: "Max stake",
								value: risk.maxStake,
								min: 1,
								max: 500,
								step: 1,
								format: (n) => `$${n}`,
								onChange: (maxStake) => updateRisk({ maxStake })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								label: "Max open exposure",
								value: risk.maxExposure,
								min: 5,
								max: 2e3,
								step: 5,
								format: (n) => `$${n}`,
								onChange: (maxExposure) => updateRisk({ maxExposure })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								label: "Daily loss limit",
								value: risk.dailyLossLimit,
								min: 2,
								max: 1e3,
								step: 2,
								format: (n) => `$${n}`,
								onChange: (dailyLossLimit) => updateRisk({ dailyLossLimit })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								label: "Drawdown breaker",
								value: risk.drawdownLimit,
								min: 50,
								max: 2e3,
								step: 10,
								format: (n) => `$${n}`,
								onChange: (drawdownLimit) => updateRisk({ drawdownLimit })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								label: "Orders per hour",
								value: risk.maxOrdersPerHour,
								min: 1,
								max: 30,
								step: 1,
								format: (n) => String(n),
								onChange: (maxOrdersPerHour) => updateRisk({ maxOrdersPerHour })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								label: "Minimum net edge",
								value: risk.minEdge,
								min: 0,
								max: .1,
								step: .005,
								format: (n) => n.toFixed(3),
								onChange: (minEdge) => updateRisk({ minEdge })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								label: "Max spread",
								value: risk.maxSpread,
								min: .01,
								max: .12,
								step: .005,
								format: (n) => `${Math.round(n * 100)}¢`,
								onChange: (maxSpread) => updateRisk({ maxSpread })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								label: "Min liquidity",
								value: risk.minLiquidity,
								min: 0,
								max: 2e4,
								step: 100,
								format: (n) => `$${n}`,
								onChange: (minLiquidity) => updateRisk({ minLiquidity })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								label: "Polymarket taker fee (per share at 50¢)",
								value: risk.feeCoef,
								min: 0,
								max: .1,
								step: .005,
								format: (n) => `${(n * 25).toFixed(2)}¢`,
								onChange: (feeCoef) => updateRisk({ feeCoef })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								label: "Slippage",
								value: risk.slippage,
								min: 0,
								max: .03,
								step: .001,
								format: (n) => `${(n * 100).toFixed(1)}¢`,
								onChange: (slippage) => updateRisk({ slippage })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm text-muted",
						children: [
							"Model ",
							MODEL_VERSION,
							". Uncertainty haircut ",
							risk.uncertaintyHaircut,
							". Freshness window ",
							Math.round(risk.freshnessMs / 1e3),
							"s."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Reconciliation",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: reconcileNote
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "quiet",
						onClick: () => simulateMismatch(),
						children: "Simulate a mismatch"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "quiet",
						onClick: () => clearMismatch(),
						disabled: circuitKind !== "reconcile",
						children: "Mark reconciled"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Cash, in and out",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Version one does not accept deposits or process withdrawals, and it does not custody funds. Move collateral only through Polymarket. This desk can show paper balances and link you out. It will not claim a transfer settled."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					className: "mt-3 inline-flex h-11 items-center font-semibold text-primary",
					href: "https://polymarket.com",
					target: "_blank",
					rel: "noreferrer",
					children: "Open Polymarket"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "How to use the desk",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
					className: "list-decimal space-y-2 pl-5 text-sm text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Read a short window or a live Bitcoin contract. If resolution text or the strike is missing, it stays blocked." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "In manual mode, approve a proposal before the timer or the price drift kills it." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Auto mode is optional and still cannot skip a hard gate. It only places paper orders." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The kill switch is the emergency stop. Read the line under it so you know whether resting orders cancel." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Use the lab before you trust any number. Simulated and live results are never mixed, because live results do not exist here." })
					]
				})
			}),
			confirmAuto && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dialog", {
				open: true,
				className: "scrim fixed inset-0 z-40 m-0 grid place-items-end p-4 sm:place-items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-md rounded-lg border border-line bg-surface p-4",
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "auto-title",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "auto-title",
							className: "text-lg font-semibold",
							children: "Enable auto paper mode?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "Qualifying paper orders can submit without another click. Risk gates still apply. This does not connect an exchange account."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-3 flex items-start gap-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: armed,
								onChange: (event) => setArmed(event.target.checked)
							}), "I understand these are paper orders inside the limits I set."]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								disabled: !armed,
								onClick: () => {
									setMode("auto");
									setConfirmAuto(false);
									setArmed(false);
								},
								children: "Enable auto"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "quiet",
								onClick: () => setConfirmAuto(false),
								children: "Keep manual"
							})]
						})
					]
				})
			}),
			confirmResume && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dialog", {
				open: true,
				className: "scrim fixed inset-0 z-40 m-0 grid place-items-end p-4 sm:place-items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-md rounded-lg border border-line bg-surface p-4",
					role: "dialog",
					"aria-modal": "true",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-semibold",
							children: "Release the emergency stop?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "New paper orders will be allowed again. Gates and the daily loss limit still apply."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								onClick: () => {
									setKilled(false);
									setConfirmResume(false);
								},
								children: "Release"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "quiet",
								onClick: () => setConfirmResume(false),
								children: "Keep it stopped"
							})]
						})
					]
				})
			})
		]
	});
}
function Slider({ label, value, min, max, step, format, onChange }) {
	const [draft, setDraft] = (0, import_react.useState)(null);
	const timer = (0, import_react.useRef)(null);
	const latest = (0, import_react.useRef)(null);
	const commit = () => {
		if (timer.current) window.clearTimeout(timer.current);
		timer.current = null;
		if (latest.current != null) onChange(latest.current);
		latest.current = null;
		setDraft(null);
	};
	const shown = draft ?? value;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono tabular-nums text-primary",
				children: format(shown)
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			className: "mt-2 touch-pan-y",
			type: "range",
			min,
			max,
			step,
			value: shown,
			onChange: (event) => {
				const v = Number(event.target.value);
				latest.current = v;
				setDraft(v);
				if (timer.current) window.clearTimeout(timer.current);
				timer.current = window.setTimeout(commit, 700);
			},
			onPointerUp: commit,
			onTouchEnd: commit,
			onKeyUp: commit,
			onBlur: commit,
			"aria-label": label
		})]
	});
}
//#endregion
export { ControlsPage as component };
