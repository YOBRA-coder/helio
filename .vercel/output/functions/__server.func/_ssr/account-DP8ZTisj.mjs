import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as signOutFn, E as useInstall, M as restoreBackup, T as testConnection, _ as useDesk, a as Pill, b as getSettings, d as downloadText, i as Panel, k as exportBackup, n as Button, v as deleteAccount, x as saveSettings, y as getMe } from "./router-e2V2EpZR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account-DP8ZTisj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AccountPage() {
	const nav = useNavigate();
	const setEmailState = useDesk((s) => s.setEmail);
	const [me, setMe] = (0, import_react.useState)(null);
	const [view, setView] = (0, import_react.useState)(null);
	const [f, setF] = (0, import_react.useState)({
		key: "",
		funder: "",
		sig: "2",
		apiKey: "",
		apiSecret: "",
		apiPass: "",
		wm: "",
		hook: ""
	});
	const [msg, setMsg] = (0, import_react.useState)(null);
	const [report, setReport] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [delPw, setDelPw] = (0, import_react.useState)("");
	const pwa = useInstall();
	const load = async () => {
		const [m, s] = await Promise.all([getMe(), getSettings()]);
		setMe(m);
		setView(s);
		if (s) setF((p) => ({
			...p,
			sig: String(s.signatureType)
		}));
	};
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	async function save(input, done) {
		setBusy(true);
		setMsg(null);
		const r = await saveSettings({ data: input }).catch(() => ({
			ok: false,
			error: "Server did not answer."
		}));
		setMsg(r.ok ? done : r.error ?? "Could not save.");
		if (r.ok) {
			setF((p) => ({
				...p,
				key: "",
				apiKey: "",
				apiSecret: "",
				apiPass: "",
				wm: "",
				hook: ""
			}));
			await load();
		}
		setBusy(false);
	}
	if (me && !me.user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
		title: "Account",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-muted",
			children: [
				"You are not signed in. ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					className: "underline",
					href: "/login",
					children: "Sign in or create an account"
				}),
				"."
			]
		})
	});
	const input = "h-11 w-full rounded-md border border-line bg-raised px-3 font-mono text-sm";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-3xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-semibold tracking-tight",
					children: "Your keys, your desk."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-muted",
					children: [
						"Signed in as ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono",
							children: me?.user?.email
						}),
						". Keys are encrypted on the server with AES-256-GCM and only the trading worker can read them. They are never sent back to this page."
					]
				})]
			}),
			view && !view.masterKeySet && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm text-danger",
				children: [
					"This server has no ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono",
						children: "HELIOS_MASTER_KEY"
					}),
					", so it will not store secrets. The operator must set a long random value and restart."
				]
			}),
			msg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-lg border border-line bg-surface px-4 py-3 text-sm",
				role: "status",
				children: msg
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Polymarket trading wallet",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
					tone: view?.hasPrivateKey ? "good" : "neutral",
					children: view?.hasPrivateKey ? "Key saved" : "Not set"
				}),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mb-4 list-disc space-y-1 pl-5 text-sm text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Use a dedicated wallet holding only what you can lose. Never your main wallet." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The funder is the wallet that holds the USDC (your Polymarket proxy address); the private key signs for it." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "You can paste the key once; to change it, paste a new one. To remove it, use Remove." })
						]
					}),
					view?.eoaAddress && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mb-3 text-sm",
						children: ["Signer address: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono",
							children: view.eoaAddress
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm sm:col-span-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1 block text-muted",
									children: "Private key"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "password",
									autoComplete: "off",
									value: f.key,
									onChange: (e) => setF({
										...f,
										key: e.target.value
									}),
									placeholder: view?.hasPrivateKey ? "•••••••• saved (paste to replace)" : "0x…",
									className: input
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1 block text-muted",
									children: "Funder address"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: f.funder,
									onChange: (e) => setF({
										...f,
										funder: e.target.value
									}),
									placeholder: view?.funder ?? "0x…",
									className: input
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1 block text-muted",
									children: "Signature type"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: f.sig,
									onChange: (e) => setF({
										...f,
										sig: e.target.value
									}),
									className: input,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "0",
											children: "0 · plain wallet (EOA)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "1",
											children: "1 · Polymarket proxy (email/Magic)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "2",
											children: "2 · Safe wallet (most browser-wallet accounts)"
										})
									]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
						className: "mt-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
								className: "cursor-pointer text-muted",
								children: ["Optional: existing CLOB API credentials ", view?.hasApiCreds && "(saved)"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 grid gap-3 sm:grid-cols-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "password",
										autoComplete: "off",
										value: f.apiKey,
										onChange: (e) => setF({
											...f,
											apiKey: e.target.value
										}),
										placeholder: "API key",
										className: input
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "password",
										autoComplete: "off",
										value: f.apiSecret,
										onChange: (e) => setF({
											...f,
											apiSecret: e.target.value
										}),
										placeholder: "Secret",
										className: input
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "password",
										autoComplete: "off",
										value: f.apiPass,
										onChange: (e) => setF({
											...f,
											apiPass: e.target.value
										}),
										placeholder: "Passphrase",
										className: input
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-muted",
								children: "Leave empty to derive them from the private key."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								disabled: busy,
								onClick: () => void save({
									polyPrivateKey: f.key || void 0,
									polyFunder: f.funder || void 0,
									polySignatureType: Number(f.sig),
									polyApiKey: f.apiKey || void 0,
									polyApiSecret: f.apiSecret || void 0,
									polyApiPassphrase: f.apiPass || void 0
								}, "Wallet settings saved."),
								children: "Save wallet"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "quiet",
								disabled: busy || !view?.hasPrivateKey,
								onClick: async () => {
									setBusy(true);
									setReport(null);
									setReport(await testConnection());
									setBusy(false);
								},
								children: "Test connection"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "quiet",
								disabled: busy || !view?.hasPrivateKey,
								onClick: () => void save({ clear: [
									"polyPrivateKey",
									"polyFunder",
									"polyApiKey",
									"polyApiSecret",
									"polyApiPassphrase"
								] }, "Wallet keys removed."),
								children: "Remove keys"
							})
						]
					}),
					report && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `mt-3 rounded-md px-3 py-2 text-sm ${report.ok ? "bg-primary-soft" : "bg-danger-soft text-danger"}`,
						role: "status",
						children: report.messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: m }, m))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-xs text-muted",
						children: [
							"Live trading also needs the operator to enable it (",
							view?.liveGloballyEnabled ? "enabled on this server" : "currently disabled on this server",
							") and your paper trial to pass the gate."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "World Monitor (optional)",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
					tone: view?.hasWorldMonitor ? "good" : "neutral",
					children: view?.hasWorldMonitor ? "Key saved" : "Not set"
				}),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-sm text-muted",
						children: "Needs a paid World Monitor API plan. Without it Helios uses free sources only: Polymarket crowd odds and the Fear & Greed index."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "password",
						autoComplete: "off",
						value: f.wm,
						onChange: (e) => setF({
							...f,
							wm: e.target.value
						}),
						placeholder: view?.hasWorldMonitor ? "•••••••• saved" : "wm_…",
						className: input
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							disabled: busy || !f.wm,
							onClick: () => void save({ worldMonitorKey: f.wm }, "World Monitor key saved. It takes effect within two minutes."),
							children: "Save"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "quiet",
							disabled: busy || !view?.hasWorldMonitor,
							onClick: () => void save({ clear: ["worldMonitorKey"] }, "World Monitor key removed."),
							children: "Remove"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Alerts webhook (optional)",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
					tone: view?.hasWebhook ? "good" : "neutral",
					children: view?.hasWebhook ? "Set" : "Not set"
				}),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mb-3 text-sm text-muted",
						children: [
							"A phone alert URL. Works with ntfy (https://ntfy.sh/your-secret-topic, then install the ntfy app), Telegram (https://api.telegram.org/bot",
							"<token>",
							"/sendMessage?chat_id=",
							"<id>",
							"), Discord or Slack webhooks. You get a message for settled trades, a daily summary, live orders, breaker trips and disarms."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: f.hook,
						onChange: (e) => setF({
							...f,
							hook: e.target.value
						}),
						placeholder: view?.hasWebhook ? "saved (paste to replace)" : "https://…",
						className: input
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							disabled: busy || !f.hook,
							onClick: () => void save({ webhookUrl: f.hook }, "Webhook saved."),
							children: "Save"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "quiet",
							disabled: busy || !view?.hasWebhook,
							onClick: () => void save({ clear: ["webhookUrl"] }, "Webhook removed."),
							children: "Remove"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Install on this device",
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
					tone: pwa.standalone ? "good" : "neutral",
					children: pwa.standalone ? "Installed" : "Not installed"
				}),
				children: pwa.standalone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "You are running the installed app."
				}) : pwa.canPrompt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-sm text-muted",
					children: "Adds Helios to your home screen so it opens full screen like an app."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					onClick: () => void pwa.install(),
					children: "Install app"
				})] }) : pwa.ios ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						"On iPhone: open this page in Safari, tap the Share button, then ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Add to Home Screen" }),
						"."
					]
				}) : !pwa.secure ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Installing needs an https address. This page is on plain http, so the browser will not offer it. Open the https link of your deployed desk instead."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						"On Android Chrome: tap the ⋮ menu, then ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Install app" }),
						" (or ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Add to Home screen" }),
						"). If it is missing, reload the page once, visit a couple of pages, and make sure you are not in a private tab. The browser only offers it after the page has loaded with the service worker running."
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Backup and restore",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-sm text-muted",
					children: "Download your whole paper desk (book, trial record, limits). Saved keys and your password are never included. Restoring replaces the current desk, keeps the old one as a one-step backup on the server, and always comes back with live trading off."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						disabled: busy,
						onClick: async () => {
							const r = await exportBackup().catch(() => ({
								ok: false,
								error: "Server did not answer."
							}));
							if (r.ok && r.json && r.filename) {
								downloadText(r.filename, r.json);
								setMsg("Backup downloaded.");
							} else setMsg(r.error ?? "Could not export.");
						},
						children: "Download backup"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "inline-flex h-11 cursor-pointer items-center rounded-md border border-line bg-surface px-4 text-sm font-medium",
						children: ["Restore from file", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: "application/json,.json",
							className: "sr-only",
							onChange: async (e) => {
								const file = e.target.files?.[0];
								e.target.value = "";
								if (!file) return;
								if (!window.confirm("Replace the current desk with this backup? Live trading will be switched off.")) return;
								const r = await restoreBackup({ data: { json: await file.text() } }).catch(() => ({
									ok: false,
									error: "Server did not answer."
								}));
								setMsg(r.ok ? "Backup sent. The worker applies it within a few seconds." : r.error ?? "Could not restore.");
							}
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Session",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "quiet",
					onClick: async () => {
						await signOutFn();
						setEmailState(null);
						await useDesk.getState().syncServer();
						await nav({ to: "/login" });
					},
					children: "Sign out"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				title: "Delete account",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-sm text-muted",
					children: "Removes your desk, trial record, and saved keys from the server. Any open live orders are not cancelled by this, so flatten and disarm first."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "password",
						autoComplete: "current-password",
						value: delPw,
						onChange: (e) => setDelPw(e.target.value),
						placeholder: "Password",
						className: "h-11 rounded-md border border-line bg-raised px-3 text-sm"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "danger",
						disabled: !delPw || busy,
						onClick: async () => {
							const r = await deleteAccount({ data: { password: delPw } });
							if (r.ok) {
								setEmailState(null);
								await nav({ to: "/login" });
							} else setMsg(r.error ?? "Could not delete.");
						},
						children: "Delete everything"
					})]
				})]
			})
		]
	});
}
//#endregion
export { AccountPage as component };
