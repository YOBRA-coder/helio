import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { S as signInFn, _ as useDesk, i as Panel, n as Button, w as signUpFn, y as getMe } from "./router-D_0PflgJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-Brxgap8O.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LoginPage() {
	const nav = useNavigate();
	const setEmailState = useDesk((s) => s.setEmail);
	const [me, setMe] = (0, import_react.useState)(null);
	const [mode, setMode] = (0, import_react.useState)("in");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		getMe().then((m) => {
			setMe(m);
			if (!m.user && m.signupOpen && m.first) setMode("up");
		});
	}, []);
	async function submit(e) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			const res = mode === "up" ? await signUpFn({ data: {
				email,
				password
			} }) : await signInFn({ data: {
				email,
				password
			} });
			if (!res.ok) {
				setError(res.error ?? "Could not sign in.");
				return;
			}
			setEmailState(email.trim().toLowerCase());
			await useDesk.getState().syncServer();
			await nav({ to: "/" });
		} catch {
			setError("The server did not answer. Try again.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-md space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-semibold tracking-tight",
				children: mode === "in" ? "Open your desk." : "Make your desk."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-muted",
				children: "Each account gets its own paper book, trial record, limits, and exchange keys. Nobody else can see or control yours."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setMode("in"),
						className: mode === "in" ? "h-11 flex-1 rounded-md bg-primary text-sm font-semibold text-primary-fg" : "h-11 flex-1 rounded-md border border-line bg-surface text-sm",
						children: "Sign in"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: me ? !me.signupOpen : false,
						onClick: () => setMode("up"),
						className: mode === "up" ? "h-11 flex-1 rounded-md bg-primary text-sm font-semibold text-primary-fg" : "h-11 flex-1 rounded-md border border-line bg-surface text-sm disabled:opacity-40",
						children: "Sign up"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: submit,
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-1 block text-muted",
								children: "Email"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "email",
								required: true,
								autoComplete: "email",
								value: email,
								onChange: (e) => setEmail(e.target.value),
								className: "h-11 w-full rounded-md border border-line bg-raised px-3"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mb-1 block text-muted",
								children: ["Password ", mode === "up" && "(10+ characters)"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "password",
								required: true,
								minLength: mode === "up" ? 10 : 1,
								autoComplete: mode === "up" ? "new-password" : "current-password",
								value: password,
								onChange: (e) => setPassword(e.target.value),
								className: "h-11 w-full rounded-md border border-line bg-raised px-3"
							})]
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rounded-md bg-danger-soft px-3 py-2 text-sm text-danger",
							role: "alert",
							children: error
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							disabled: busy,
							className: "w-full",
							children: busy ? "Working…" : mode === "in" ? "Sign in" : "Create account"
						})
					]
				}),
				me && !me.signupOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "Sign-up is closed on this server. Ask the operator for an account."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs text-muted",
					children: "Passwords are hashed with scrypt and never stored in clear. There is no password reset by email: the operator can delete an account so you can re-register."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Not ready? The desk also runs a paper-only browser version without an account; it stops when you close the tab."
			})
		]
	});
}
//#endregion
export { LoginPage as component };
