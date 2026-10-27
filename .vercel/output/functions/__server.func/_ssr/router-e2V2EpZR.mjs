import { o as __toESM } from "../_runtime.mjs";
import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { C as require_jsx_runtime, S as useRouter, X as require_react, _ as lazyRouteComponent, b as Link, d as Scripts, f as HeadContent, g as Outlet, h as createRouter, p as useRouterState, v as createFileRoute, y as createRootRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as THEMES, d as isTheme, i as STARTING_CASH, m as runBacktest, r as MODEL_VERSION } from "./engine-BmNSrsOt.mjs";
import { a as hydrateCore, c as makeCore, l as tickCore, n as applyQuotes, r as applyTape, t as applyCommand } from "./ledger-CdyAlo7W.mjs";
import { a as summarize, i as powerNote, n as calibrationNote, r as evaluateGate, t as DEFAULT_GATE } from "./trial-B01rn2RJ.mjs";
import { a as TriangleAlert, c as RefreshCw, d as LayoutDashboard, f as Gauge, g as Ban, h as Bell, i as UserRound, l as Radar, m as Crosshair, n as X, o as SlidersHorizontal, p as FlaskConical, r as Wallet, s as ScrollText, t as Zap, u as Menu } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/desk-api-CjRojGXk.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var desk_api_exports = /* @__PURE__ */ __exportAll({
	exportBackup: () => exportBackup,
	getBacktest: () => getBacktest,
	getDesk: () => getDesk,
	getVersion: () => getVersion,
	restoreBackup: () => restoreBackup,
	sendCommand: () => sendCommand,
	startBacktest: () => startBacktest
});
var getDesk = createServerFn({ method: "GET" }).handler(createSsrRpc("6bb9d1d4288c61ed75c3223be2cc1284ccfe42ce64bb99900f82a8f3f0753ab2"));
var sendCommand = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("f185d0f9cc4eb0882491ec32077ad50057606be82c2f21c2a6f808ab846c85d0"));
var getBacktest = createServerFn({ method: "GET" }).handler(createSsrRpc("db2bced928ad16e7f468f541f598bbf85a4cdb145ff97544b7b3e3d62f285dcc"));
var startBacktest = createServerFn({ method: "POST" }).validator((i) => i).handler(createSsrRpc("0a4ed536b0c588a8b85afa0871e20249ea29694ac2f7d5c61a38a1637bdd5d88"));
/** Everything that makes up the desk (book, scores, trial clock, limits). Keys and passwords are never included. */
var exportBackup = createServerFn({ method: "POST" }).handler(createSsrRpc("15fb9a660a0fe9004ede28c6ff5e02b10a3131697575818ec627dca8eb1cec9f"));
var restoreBackup = createServerFn({ method: "POST" }).validator((i) => i).handler(createSsrRpc("c3bda05130ec6e4413d1b076cd60de02b28c4b2d4e5f5b8def5c9213f2a12328"));
/** The build the server is running. The browser compares it with its own to offer an update. */
var getVersion = createServerFn({ method: "GET" }).handler(createSsrRpc("52f44871d324c9407981df9887db23f09a353d9b121e1b72cb505c1e57c71fa0"));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-e2V2EpZR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* Path-based preview hosts serve the dev server under `/{port_id}/` and strip
* that prefix before forwarding, so SSR sees `/` while the browser URL keeps the
* prefix. TanStack Start resets `basepath` on hydration, so a `rewrite` keeps
* client routing and generated links aligned with the public URL.
*/
var PATH_BASED_PREVIEW_HOSTS = /* @__PURE__ */ new Set([
	"preview.grok.genai.mil",
	"preview.grok.mil",
	"preview.grokgsac.com"
]);
var PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;
function previewPathPrefix(hostname, pathname) {
	if (!PATH_BASED_PREVIEW_HOSTS.has(hostname.toLowerCase())) return void 0;
	return PORT_ID_PREFIX.exec(pathname)?.[0];
}
function prefixRewrite(prefix) {
	return {
		input: ({ url }) => {
			if (url.pathname === prefix) url.pathname = "/";
			else if (url.pathname.startsWith(`${prefix}/`)) url.pathname = url.pathname.slice(prefix.length);
			return url;
		},
		output: ({ url }) => {
			url.pathname = `${prefix}${url.pathname}`;
			return url;
		}
	};
}
function previewPathRewrite() {
	if (typeof window === "undefined") return void 0;
	const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
	return prefix ? prefixRewrite(prefix) : void 0;
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var deferred = null;
var listeners = /* @__PURE__ */ new Set();
var emit = () => listeners.forEach((fn) => fn());
/** Registers the service worker and captures Chrome/Android's install prompt. Renders nothing. */
function PwaRegister() {
	(0, import_react.useEffect)(() => {
		const onPrompt = (e) => {
			e.preventDefault();
			deferred = e;
			emit();
		};
		const onInstalled = () => {
			deferred = null;
			emit();
		};
		window.addEventListener("beforeinstallprompt", onPrompt);
		window.addEventListener("appinstalled", onInstalled);
		if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("/sw.js").catch(() => {});
		return () => {
			window.removeEventListener("beforeinstallprompt", onPrompt);
			window.removeEventListener("appinstalled", onInstalled);
		};
	}, []);
	return null;
}
function useInstall() {
	const [, tick] = (0, import_react.useState)(0);
	const [standalone, setStandalone] = (0, import_react.useState)(false);
	const [env, setEnv] = (0, import_react.useState)({
		ios: false,
		secure: true
	});
	(0, import_react.useEffect)(() => {
		setEnv({
			ios: /iphone|ipad|ipod/i.test(navigator.userAgent),
			secure: location.protocol === "https:" || location.hostname === "localhost"
		});
		const fn = () => tick((n) => n + 1);
		listeners.add(fn);
		setStandalone(window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true);
		return () => {
			listeners.delete(fn);
		};
	}, []);
	return {
		standalone,
		canPrompt: deferred !== null,
		ios: env.ios,
		secure: env.secure,
		async install() {
			if (!deferred) return false;
			await deferred.prompt();
			const choice = await deferred.userChoice;
			deferred = null;
			emit();
			return choice.outcome === "accepted";
		}
	};
}
/** Reloads the app so the newest version loads. Also asks the browser to refresh its service worker. */
async function reloadApp() {
	try {
		await (await navigator.serviceWorker?.getRegistration())?.update();
	} catch {}
	location.reload();
}
/** True when the server is running a newer build than the one loaded in this tab. Checks every minute and on return to the app. */
function useUpdateAvailable() {
	const [stale, setStale] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let live = true;
		const check = async () => {
			try {
				const { getVersion } = await import("../_libs/_.mjs").then((n) => n.t);
				const v = await getVersion();
				if (live && v.build && v.build !== "1793084446722") setStale(true);
			} catch {}
		};
		const timer = window.setInterval(check, 6e4);
		const onVisible = () => document.visibilityState === "visible" && void check();
		document.addEventListener("visibilitychange", onVisible);
		window.addEventListener("online", check);
		check();
		return () => {
			live = false;
			window.clearInterval(timer);
			document.removeEventListener("visibilitychange", onVisible);
			window.removeEventListener("online", check);
		};
	}, []);
	return stale;
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var SOCKET_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market";
function num(value) {
	const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
	return Number.isFinite(n) ? n : null;
}
function level(levels, mode) {
	if (!Array.isArray(levels)) return null;
	let best = null;
	for (const row of levels) {
		if (!row || typeof row !== "object") continue;
		const price = num(row.price);
		const size = num(row.size);
		if (price == null || price <= 0 || price >= 1) continue;
		if (size != null && size <= 0) continue;
		best = best == null ? price : mode === "max" ? Math.max(best, price) : Math.min(best, price);
	}
	return best;
}
function pair(bidRaw, askRaw) {
	const bid = num(bidRaw);
	const ask = num(askRaw);
	if (bid == null || ask == null || bid <= 0 || ask >= 1 || ask < bid) return null;
	return {
		bid,
		ask
	};
}
function quotesFrom(payload, into) {
	const rows = Array.isArray(payload) ? payload : [payload];
	for (const row of rows) {
		if (!row || typeof row !== "object") continue;
		const rec = row;
		if (Array.isArray(rec.price_changes)) {
			for (const change of rec.price_changes) {
				if (!change || typeof change !== "object") continue;
				const item = change;
				const tokenId = typeof item.asset_id === "string" ? item.asset_id : "";
				const quote = pair(item.best_bid, item.best_ask);
				if (tokenId && quote) into.set(tokenId, {
					tokenId,
					...quote
				});
			}
			continue;
		}
		const tokenId = typeof rec.asset_id === "string" ? rec.asset_id : "";
		if (!tokenId) continue;
		if (rec.best_bid != null || rec.best_ask != null) {
			const quote = pair(rec.best_bid, rec.best_ask);
			if (quote) into.set(tokenId, {
				tokenId,
				...quote
			});
			continue;
		}
		if (rec.bids || rec.asks) {
			const quote = pair(level(rec.bids, "max"), level(rec.asks, "min"));
			if (quote) into.set(tokenId, {
				tokenId,
				...quote
			});
		}
	}
}
function startBookSocket(options) {
	const ids = [...new Set(options.assetIds)].slice(0, 40);
	let stopped = false;
	let socket = null;
	let ping = null;
	let retry = null;
	let attempt = 0;
	const pending = /* @__PURE__ */ new Map();
	let flushQueued = false;
	function flush() {
		flushQueued = false;
		if (stopped || pending.size === 0) {
			pending.clear();
			return;
		}
		const quotes = [...pending.values()];
		pending.clear();
		options.onQuotes(quotes);
	}
	function queue(payload) {
		quotesFrom(payload, pending);
		if (flushQueued || pending.size === 0) return;
		flushQueued = true;
		window.setTimeout(flush, 250);
	}
	function cleanupSocket() {
		if (ping != null) window.clearInterval(ping);
		ping = null;
		if (socket) {
			socket.onopen = null;
			socket.onmessage = null;
			socket.onerror = null;
			socket.onclose = null;
			if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) socket.close();
		}
		socket = null;
	}
	function connect() {
		if (stopped) return;
		cleanupSocket();
		options.onStatus("connecting");
		const next = new WebSocket(SOCKET_URL);
		socket = next;
		next.onopen = () => {
			if (stopped || socket !== next) return;
			attempt = 0;
			next.send(JSON.stringify({
				assets_ids: ids,
				type: "market",
				custom_feature_enabled: true,
				initial_dump: true
			}));
			options.onStatus("live");
			ping = window.setInterval(() => {
				if (next.readyState === WebSocket.OPEN) next.send("PING");
			}, 1e4);
		};
		next.onmessage = (event) => {
			if (typeof event.data !== "string" || event.data === "PONG") return;
			try {
				queue(JSON.parse(event.data));
			} catch {
				return;
			}
		};
		next.onerror = () => {
			if (socket === next) options.onStatus("down");
		};
		next.onclose = () => {
			if (ping != null) window.clearInterval(ping);
			ping = null;
			if (stopped || socket !== next) return;
			options.onStatus("down");
			const wait = Math.min(2e4, 1e3 * 2 ** attempt);
			attempt += 1;
			retry = window.setTimeout(connect, wait);
		};
	}
	connect();
	return () => {
		stopped = true;
		if (retry != null) window.clearTimeout(retry);
		cleanupSocket();
	};
}
var getMe = createServerFn({ method: "GET" }).handler(createSsrRpc("41996e041589bf38c6cace7d166f1e72718dcb5e3bb5f2e11322c833bd6dad24"));
var signUpFn = createServerFn({ method: "POST" }).validator((i) => i).handler(createSsrRpc("7a0861cc1111038f043213a2e109ad8c5a26120f56794d21ac926ea908b6d209"));
var signInFn = createServerFn({ method: "POST" }).validator((i) => i).handler(createSsrRpc("fa5e9f7b3a10dbfe7e312dc5834fdea67cd504686ee884e80714c3381ccdf5a2"));
var signOutFn = createServerFn({ method: "POST" }).handler(createSsrRpc("90c30146b3cd35dea9a368bf061e162d2d80141362bcaf36b6f9b514027791b3"));
var getSettings = createServerFn({ method: "GET" }).handler(createSsrRpc("8673949ba5aa0f1785fabaee3557b443fdde93d2e18ad891572525cab7a78833"));
var saveSettings = createServerFn({ method: "POST" }).validator((i) => i).handler(createSsrRpc("03ba1b308e4858380baf7b9ea35b04c2c5b5b59b505c9c5c146a36243d02a009"));
var testConnection = createServerFn({ method: "POST" }).handler(createSsrRpc("f6f7aadbe2bca34250f9c39f8535ea0ba5313ff85d9dbc8cb5cf686e0dfe13f0"));
var deleteAccount = createServerFn({ method: "POST" }).validator((i) => i).handler(createSsrRpc("7803d5d212e09a58b9287ee117cf0791595efd16e86ac99d6839baef979bc881"));
/** Browser-side fallback path (used only when no server worker is running). */
var fetchTape = createServerFn({ method: "GET" }).handler(createSsrRpc("10f952f4d3b3cfd195261ae67af1a81cac02f8c25a8667d42d10266a56dbadec"));
var fetchResolutionsFn = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("66e192131d4f2484dbb79ed78ab4c47ec3b3947e0043798a9dd0ce445e32ab16"));
var STORAGE_KEY = "helios-desk-v2";
var THEME_KEY = "helios-theme";
var CORE_KEYS = [
	"risk",
	"mode",
	"killed",
	"cash",
	"simMarkets",
	"liveMarkets",
	"signals",
	"orders",
	"fills",
	"positions",
	"alerts",
	"audit",
	"curve",
	"dayKey",
	"dayStartEquity",
	"peakEquity",
	"circuitKind",
	"reconcileNote",
	"spot",
	"spotSource",
	"spots",
	"spotDtMs",
	"tickCount",
	"scores",
	"blend",
	"hist",
	"context",
	"trialStartedAt",
	"live"
];
function pickCore(s) {
	const out = {};
	for (const k of CORE_KEYS) out[k] = s[k];
	return out;
}
function readLocal() {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}
function writeLocal(core) {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
			...core,
			simMarkets: [],
			liveMarkets: [],
			scores: core.scores.slice(0, 500),
			curve: core.curve.slice(-300),
			audit: core.audit.slice(0, 120),
			spots: core.spots.slice(-120)
		}));
	} catch {}
}
var pending = null;
function localTrial(core, now) {
	const summary = summarize(core, now, STARTING_CASH);
	const gate = evaluateGate(summary, core.risk.drawdownLimit, DEFAULT_GATE);
	return {
		summary,
		checks: gate.checks,
		eligible: gate.eligible,
		power: powerNote(summary),
		calibration: calibrationNote(summary),
		recent: core.scores.slice(0, 40)
	};
}
var noEnv = {
	enabled: false,
	hasKey: false,
	hasFunder: false,
	hasOwnerToken: false
};
var useDesk = create((set, get) => ({
	...makeCore(0),
	theme: "orchard",
	booted: false,
	now: 0,
	source: "connecting",
	workerAlive: false,
	heartbeatAgeMs: null,
	commandNote: null,
	liveStatus: "idle",
	liveError: null,
	liveFetchedAt: 0,
	bookStatus: "idle",
	backtest: null,
	trial: null,
	liveEnv: noEnv,
	signedIn: false,
	email: null,
	setEmail: (e) => set({ email: e }),
	boot: () => {
		if (get().booted) return;
		let theme = "orchard";
		try {
			const t = window.localStorage.getItem(THEME_KEY);
			if (isTheme(t)) theme = t;
		} catch {}
		const now = Date.now();
		const core = hydrateCore(readLocal(), now);
		document.documentElement.dataset.theme = theme;
		set({
			...core,
			theme,
			booted: true,
			now
		});
		get().syncServer();
	},
	syncServer: async () => {
		try {
			const view = await getDesk();
			if (view.core) {
				const alive = view.alive;
				const hold = pending && Date.now() - pending.at < 6e3 ? pending : null;
				if (pending && !hold) pending = null;
				if (hold?.risk && Object.entries(hold.risk).every(([k, v]) => view.core.risk[k] === v)) pending = null;
				set({
					...view.core,
					...hold?.risk ? { risk: {
						...view.core.risk,
						...hold.risk
					} } : {},
					...hold?.mode ? { mode: hold.mode } : {},
					...hold?.killed != null ? { killed: hold.killed } : {},
					source: alive ? "server" : "server-offline",
					workerAlive: alive,
					heartbeatAgeMs: view.heartbeatAgeMs,
					commandNote: view.lastCommandNote,
					trial: view.trial,
					liveEnv: view.liveEnv,
					signedIn: view.signedIn,
					now: view.now,
					liveStatus: view.feedError && view.core.liveMarkets.length === 0 ? "error" : view.core.liveMarkets.length ? "ok" : "loading",
					liveError: view.feedError,
					liveFetchedAt: view.tapeAt,
					bookStatus: view.quotesAt && view.now - view.quotesAt < 1e4 ? "live" : alive ? "connecting" : "down"
				});
				return;
			}
			set({
				source: "local",
				liveEnv: view.liveEnv,
				signedIn: view.signedIn,
				workerAlive: false
			});
		} catch {
			if (get().source === "connecting") set({ source: "local" });
		}
	},
	tick: () => {
		const s = get();
		if (!s.booted || s.source !== "local") return;
		const now = Date.now();
		const core = tickCore(pickCore(s), {
			now,
			spot: s.spot || null
		});
		set({
			...core,
			now,
			trial: localTrial(core, now)
		});
		if (core.tickCount % 5 === 0) writeLocal(core);
	},
	refreshLive: async () => {
		const s = get();
		if (s.source !== "local") return;
		if (s.liveStatus !== "ok") set({ liveStatus: "loading" });
		try {
			const tape = await fetchTape();
			const now = Date.now();
			let core = applyTape(pickCore(get()), tape, {}, now);
			const held = core.positions.filter((p) => p.status === "open" && p.kind === "live").map((p) => p.marketId.replace(/^poly-/, ""));
			let resolutions = {};
			if (held.length) resolutions = await fetchResolutionsFn({ data: { ids: held } }).catch(() => ({}));
			core = tickCore(core, {
				now,
				spot: tape.spot,
				spotSource: tape.spotSource,
				spotFresh: Boolean(tape.spot),
				spotDtMs: 12e3,
				resolutions
			});
			set({
				...core,
				now,
				liveStatus: tape.error && core.liveMarkets.length === 0 ? "error" : "ok",
				liveError: tape.error,
				liveFetchedAt: tape.fetchedAt,
				trial: localTrial(core, now)
			});
		} catch {
			set({
				liveStatus: "error",
				liveError: "Could not reach the public market feed."
			});
		}
	},
	applyLiveQuotes: (quotes) => {
		if (get().source !== "local" || quotes.length === 0) return;
		set(applyQuotes(pickCore(get()), quotes, Date.now()));
	},
	setBookStatus: (status) => {
		if (get().source !== "local" || get().bookStatus === status) return;
		set({ bookStatus: status });
	},
	dispatch: async (cmd) => {
		const s = get();
		if (s.source === "local") {
			if (cmd.type.startsWith("live")) {
				set({ commandNote: s.signedIn ? "The worker has not picked up your desk yet. Start it with npm run worker; live needs it." : "Sign in to use the server desk and live trading. The browser desk is paper only." });
				return;
			}
			const now = Date.now();
			const core = applyCommand(pickCore(s), cmd, now);
			set({
				...core,
				now,
				trial: localTrial(core, now)
			});
			writeLocal(core);
			return;
		}
		if (cmd.type === "updateRisk") {
			pending = {
				...pending,
				risk: {
					...pending?.risk,
					...cmd.risk
				},
				at: Date.now()
			};
			set({ risk: {
				...s.risk,
				...cmd.risk
			} });
		} else if (cmd.type === "setMode") {
			pending = {
				...pending,
				mode: cmd.mode,
				at: Date.now()
			};
			set({ mode: cmd.mode });
		} else if (cmd.type === "setKilled") {
			pending = {
				...pending,
				killed: cmd.on,
				at: Date.now()
			};
			set({ killed: cmd.on });
		}
		if (s.source === "server-offline") set({ commandNote: "The desk worker is offline. Start it with npm run worker; commands queue until it is back." });
		try {
			const res = await sendCommand({ data: { cmd } });
			set({ commandNote: res.ok ? null : res.error ?? "Command refused" });
			window.setTimeout(() => void get().syncServer(), 600);
		} catch {
			set({ commandNote: "Could not reach the server." });
		}
	},
	approve: (signalId) => void get().dispatch({
		type: "approve",
		signalId
	}),
	reject: (signalId) => void get().dispatch({
		type: "reject",
		signalId
	}),
	setMode: (mode) => void get().dispatch({
		type: "setMode",
		mode
	}),
	setKilled: (on) => void get().dispatch({
		type: "setKilled",
		on
	}),
	updateRisk: (risk) => void get().dispatch({
		type: "updateRisk",
		risk
	}),
	flatten: (positionId) => void get().dispatch({
		type: "flatten",
		positionId
	}),
	simulateMismatch: () => void get().dispatch({ type: "simulateMismatch" }),
	clearMismatch: () => void get().dispatch({ type: "clearMismatch" }),
	markAlertsRead: () => void get().dispatch({ type: "markAlertsRead" }),
	resetTrial: () => void get().dispatch({ type: "resetTrial" }),
	setTheme: (theme) => {
		document.documentElement.dataset.theme = theme;
		try {
			window.localStorage.setItem(THEME_KEY, theme);
		} catch {}
		set({ theme });
	},
	runStudy: () => set({ backtest: runBacktest(get().risk) })
}));
function DeskProvider({ children }) {
	const theme = useDesk((s) => s.theme);
	(0, import_react.useEffect)(() => {
		document.documentElement.dataset.theme = theme;
		const color = THEMES.find((item) => item.id === theme)?.color ?? "#101512";
		document.querySelector("meta[name=\"theme-color\"]")?.setAttribute("content", color);
	}, [theme]);
	(0, import_react.useEffect)(() => {
		useDesk.getState().boot();
		getMe().then((m) => useDesk.getState().setEmail(m.user?.email ?? null)).catch(() => {});
		const sync = window.setInterval(() => void useDesk.getState().syncServer(), 1500);
		const poll = window.setInterval(() => useDesk.getState().tick(), 1e3);
		const live = window.setInterval(() => void useDesk.getState().refreshLive(), 12e3);
		const kick = window.setTimeout(() => void useDesk.getState().refreshLive(), 1800);
		let stopBook = () => {};
		let assetKey = "";
		const syncBook = () => {
			if (useDesk.getState().source !== "local") {
				if (assetKey) {
					stopBook();
					stopBook = () => {};
					assetKey = "";
				}
				return;
			}
			const ids = useDesk.getState().liveMarkets.map((market) => market.yesTokenId).filter((id) => Boolean(id)).slice(0, 40);
			const key = ids.join(",");
			if (key === assetKey) return;
			assetKey = key;
			stopBook();
			if (ids.length === 0) {
				useDesk.getState().setBookStatus("idle");
				stopBook = () => {};
				return;
			}
			stopBook = startBookSocket({
				assetIds: ids,
				onQuotes: (quotes) => useDesk.getState().applyLiveQuotes(quotes),
				onStatus: (status) => useDesk.getState().setBookStatus(status)
			});
		};
		const watch = window.setInterval(syncBook, 2e3);
		return () => {
			window.clearInterval(sync);
			window.clearInterval(poll);
			window.clearInterval(live);
			window.clearInterval(watch);
			window.clearTimeout(kick);
			stopBook();
		};
	}, []);
	return children;
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function money(n, digits = 2) {
	if (!Number.isFinite(n)) return "—";
	return n.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	});
}
function px(n) {
	if (!Number.isFinite(n)) return "—";
	return `${Math.round(n * 1e3) / 10}¢`;
}
function signedMoney(n) {
	if (!Number.isFinite(n)) return "—";
	const body = money(Math.abs(n));
	if (n > 0) return `+${body}`;
	if (n < 0) return `−${body}`;
	return body;
}
function pct(n) {
	if (!Number.isFinite(n)) return "—";
	return `${(n * 100).toFixed(1)}%`;
}
function remain(ms) {
	if (!Number.isFinite(ms) || ms <= 0) return "0s";
	const s = Math.floor(ms / 1e3);
	const m = Math.floor(s / 60);
	const h = Math.floor(m / 60);
	const d = Math.floor(h / 24);
	if (d > 0) return `${d}d ${h % 24}h`;
	if (h > 0) return `${h}h ${m % 60}m`;
	if (m > 0) return `${m}m ${s % 60}s`;
	return `${s}s`;
}
function clock(ts) {
	if (!ts) return "—";
	return new Date(ts).toLocaleString(void 0, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit"
	});
}
function age(now, then) {
	if (!then || !now) return "—";
	return `${remain(Math.max(0, now - then))} ago`;
}
function csvCell(value) {
	const text = String(value ?? "");
	if (/[",\n]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
	return text;
}
function toCsv(rows) {
	return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}
function downloadText(filename, text) {
	const blob = new Blob([text], { type: filename.endsWith(".json") ? "application/json" : "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
/** The four tabs that stay on the phone bar; everything else lives behind "More". */
var PRIMARY = [
	"/",
	"/signals",
	"/book",
	"/trial"
];
var NAV = [
	{
		to: "/",
		label: "Desk",
		icon: LayoutDashboard
	},
	{
		to: "/markets",
		label: "Markets",
		icon: Radar
	},
	{
		to: "/signals",
		label: "Signals",
		icon: Crosshair
	},
	{
		to: "/book",
		label: "Book",
		icon: Wallet
	},
	{
		to: "/trial",
		label: "Trial",
		icon: Gauge
	},
	{
		to: "/live",
		label: "Live",
		icon: Zap
	},
	{
		to: "/lab",
		label: "Lab",
		icon: FlaskConical
	},
	{
		to: "/audit",
		label: "Audit",
		icon: ScrollText
	},
	{
		to: "/controls",
		label: "Limits",
		icon: SlidersHorizontal
	},
	{
		to: "/account",
		label: "Account",
		icon: UserRound
	}
];
function Shell({ children }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const killed = useDesk((s) => s.killed);
	const mode = useDesk((s) => s.mode);
	const circuitKind = useDesk((s) => s.circuitKind);
	const source = useDesk((s) => s.source);
	const email = useDesk((s) => s.email);
	const signedIn = useDesk((s) => s.signedIn);
	const liveStatusVenue = useDesk((s) => s.live.status);
	const heartbeatAgeMs = useDesk((s) => s.heartbeatAgeMs);
	const setKilled = useDesk((s) => s.setKilled);
	const alerts = useDesk((s) => s.alerts);
	const markAlertsRead = useDesk((s) => s.markAlertsRead);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [more, setMore] = (0, import_react.useState)(false);
	const pwa = useInstall();
	const updateReady = useUpdateAvailable();
	const [spinning, setSpinning] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setMore(false);
		setOpen(false);
	}, [pathname]);
	const unread = alerts.filter((a) => !a.read).length;
	const page = NAV.find((item) => item.to === pathname)?.label ?? "Desk";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "chrome-solid sticky top-0 z-30 border-b border-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl items-center gap-3 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-10 place-items-center rounded-lg bg-primary text-primary-fg",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
								viewBox: "0 0 32 32",
								className: "size-6",
								"aria-hidden": "true",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "16",
									cy: "16",
									r: "4.5",
									fill: "currentColor"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "16",
									cy: "16",
									r: "10",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "2"
								})]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-sm font-semibold tracking-tight",
								children: "Helios Desk"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block text-xs text-muted",
								children: ["BTC trader · ", MODEL_VERSION]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("hidden rounded-full px-3 py-1 text-xs font-medium sm:inline", liveStatusVenue === "armed" ? "bg-danger text-danger-fg" : "bg-primary-soft text-primary"),
								children: liveStatusVenue === "armed" ? "LIVE ARMED" : liveStatusVenue === "dry" ? "Paper + live dry-run" : "Paper"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("rounded-full px-3 py-1 text-xs font-medium", mode === "auto" ? "bg-primary text-primary-fg" : "bg-raised text-fg"),
								children: mode === "auto" ? "Auto" : "Manual"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: signedIn ? "/account" : "/login",
								className: "hidden h-11 items-center rounded-lg border border-line bg-surface px-3 text-sm sm:inline-flex",
								children: signedIn ? email ?? "Account" : "Sign in"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "relative grid size-11 place-items-center rounded-lg border border-line bg-surface",
								"aria-label": "Alerts",
								onClick: () => {
									setOpen((v) => !v);
									markAlertsRead();
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-4" }), unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute right-2 top-2 size-2 rounded-full bg-danger" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setKilled(!killed),
								className: cn("inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-transform duration-150 ease-out active:scale-[0.96]", killed ? "bg-danger text-danger-fg" : "border border-line bg-surface text-fg"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { className: "size-4" }), killed ? "Stopped" : "Kill"]
							})
						]
					})]
				}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "fixed inset-0 z-50",
					role: "dialog",
					"aria-modal": "true",
					"aria-label": "Alerts",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Close alerts",
						className: "absolute inset-0 bg-black/50",
						onClick: () => setOpen(false)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute inset-x-3 top-[4.5rem] max-h-[75dvh] overflow-y-auto rounded-2xl border border-line bg-surface p-3 shadow-2xl md:left-auto md:right-6 md:w-[26rem]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between px-2 pb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs uppercase tracking-wide text-muted",
									children: "Alerts"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": "Close",
									onClick: () => setOpen(false),
									className: "grid size-9 place-items-center rounded-full border border-line",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
								})]
							}),
							alerts.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "px-2 pb-2 text-sm text-muted",
								children: "No alerts. Breakers, feed problems and live-order events show up here. Everything the desk did is in the audit trail."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "space-y-2",
								children: alerts.slice(0, 12).map((alert) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/audit",
									onClick: () => setOpen(false),
									className: "block rounded-md bg-raised px-3 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "flex items-center justify-between gap-2 text-sm font-medium",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: alert.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-xs font-normal text-muted",
											children: new Date(alert.at).toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit"
											})
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted",
										children: alert.detail
									})]
								}) }, alert.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/audit",
								onClick: () => setOpen(false),
								className: "mt-3 flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-fg",
								children: "Open audit trail"
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto grid max-w-6xl gap-6 px-4 py-5 md:grid-cols-[12rem_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "hidden md:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sticky top-24",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-1",
							children: NAV.map((item) => {
								const active = pathname === item.to;
								const Icon = item.icon;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: item.to,
									className: cn("flex h-11 items-center gap-2 rounded-md px-3 text-sm", active ? "bg-primary-soft font-medium text-primary" : "text-muted hover:bg-raised hover:text-fg"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), item.label]
								}) }, item.to);
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								setSpinning(true);
								reloadApp();
							},
							className: "mt-4 flex h-11 w-full items-center gap-2 rounded-md px-3 text-sm text-muted hover:bg-raised hover:text-fg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: cn("size-4", spinning && "animate-spin") }), "Reload app"]
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "min-w-0 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "glow pointer-events-none -mx-4 -mt-5 mb-4 h-16" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4 flex flex-col gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium uppercase tracking-wide text-muted",
								children: page
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeRail, {})]
						}),
						updateReady && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary bg-primary-soft px-4 py-3 text-sm",
							role: "status",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "A new version of Helios is ready." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => void reloadApp(),
								className: "h-11 rounded-lg bg-primary px-4 font-semibold text-primary-fg",
								children: "Update now"
							})]
						}),
						source === "local" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted",
							children: [
								"Browser desk: paper trading runs in this tab only and stops when you close it.",
								" ",
								signedIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									"Your account is signed in, but the worker has not started your desk yet (",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono",
										children: "npm run worker"
									}),
									")."
								] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/login",
									className: "underline",
									children: "Sign in"
								}), " to get a 24/7 desk with your own keys and record."] })
							]
						}),
						source === "server-offline" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4 rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm",
							children: [
								"The desk worker is offline",
								heartbeatAgeMs != null ? ` (last seen ${Math.round(heartbeatAgeMs / 1e3)}s ago)` : "",
								". Numbers below are the last saved state. Restart it with ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono",
									children: "npm run worker"
								}),
								"."
							]
						}),
						(killed || circuitKind) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-4 rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm",
							children: killed ? "Kill switch is on. New paper orders are blocked. Resting orders follow the cancel policy in Controls. Open positions stay put." : circuitKind === "reconcile" ? "Reconciliation drill is active. New paper orders are paused." : circuitKind === "daily" ? "Daily loss limit is active. New paper orders are paused." : "Drawdown breaker is active. New paper orders are paused."
						}),
						children,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-8 text-sm text-muted",
							children: "Paper-first research desk. Live orders are off unless you configure, pass the trial gate, and arm them. No custody, no promised win rate. Deposits and withdrawals stay on Polymarket."
						})
					]
				})]
			}),
			more && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-40 md:hidden",
				role: "dialog",
				"aria-modal": "true",
				"aria-label": "More pages",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Close menu",
					className: "absolute inset-0 bg-black/60",
					onClick: () => setMore(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-surface px-4 pt-4 shadow-2xl",
					style: { paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" },
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-center justify-between",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold",
									children: "More"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => {
										setSpinning(true);
										reloadApp();
									},
									className: "ml-auto mr-2 inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: cn("size-4", spinning && "animate-spin") }), "Reload app"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": "Close",
									onClick: () => setMore(false),
									className: "grid size-11 place-items-center rounded-full border border-line",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "grid grid-cols-3 gap-2",
							children: NAV.filter((item) => !PRIMARY.includes(item.to)).map((item) => {
								const Icon = item.icon;
								const active = pathname === item.to;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: item.to,
									className: cn("flex h-20 flex-col items-center justify-center gap-2 rounded-xl border text-sm", active ? "border-primary bg-primary-soft text-primary" : "border-line bg-raised"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }), item.label]
								}) }, item.to);
							})
						}),
						pwa.canPrompt && !pwa.standalone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								pwa.install();
								setMore(false);
							},
							className: "mt-3 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-fg",
							children: "Install Helios on this phone"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "chrome-solid fixed inset-x-0 bottom-0 z-30 border-t border-line md:hidden",
				style: { paddingBottom: "env(safe-area-inset-bottom)" },
				"aria-label": "Primary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "flex",
					children: [NAV.filter((item) => PRIMARY.includes(item.to)).map((item) => {
						const active = pathname === item.to;
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "flex-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: item.to,
								"aria-current": active ? "page" : void 0,
								className: cn("flex h-16 flex-col items-center justify-center gap-1 text-xs", active ? "text-primary" : "text-muted"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("grid h-7 w-12 place-items-center rounded-full", active && "bg-primary-soft"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
								}), item.label]
							})
						}, item.to);
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "flex-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setMore(true),
							"aria-haspopup": "dialog",
							className: cn("flex h-16 w-full flex-col items-center justify-center gap-1 text-xs", !PRIMARY.includes(pathname) ? "text-primary" : "text-muted"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("grid h-7 w-12 place-items-center rounded-full", !PRIMARY.includes(pathname) && "bg-primary-soft"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
							}), !PRIMARY.includes(pathname) ? NAV.find((i) => i.to === pathname)?.label ?? "More" : "More"]
						})
					})]
				})
			})
		]
	});
}
function Panel({ title, action, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("rounded-lg border border-line bg-surface p-4", className),
		children: [(title || action) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-center justify-between gap-3",
			children: [title && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-semibold tracking-tight",
				children: title
			}), action]
		}), children]
	});
}
function Button({ children, variant = "primary", className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		className: cn("inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-transform duration-150 ease-out active:not-disabled:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40", variant === "primary" && "bg-primary text-primary-fg", variant === "quiet" && "border border-line bg-raised text-fg", variant === "danger" && "bg-danger text-danger-fg", variant === "ghost" && "bg-transparent text-fg", className),
		...props,
		children
	});
}
function Pill({ children, tone = "neutral" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium", tone === "neutral" && "bg-raised text-muted", tone === "good" && "bg-primary-soft text-primary", tone === "bad" && "bg-danger-soft text-danger"),
		children
	});
}
function Stat({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-line bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs uppercase tracking-wide text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-mono text-2xl font-medium tabular-nums tracking-tight",
				children: value
			}),
			hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: hint
			})
		]
	});
}
function ProbBar({ model, market }) {
	const m = Math.min(100, Math.max(0, model * 100));
	const k = Math.min(100, Math.max(0, market * 100));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-2 rounded-full bg-raised",
		title: "Bar is the model. Marker is the market.",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-y-0 left-0 rounded-full bg-primary",
			style: { width: `${m}%` }
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute -top-1 h-4 w-0.5 bg-fg",
			style: { left: `${k}%` }
		})]
	});
}
function ThemeRail() {
	const theme = useDesk((s) => s.theme);
	const setTheme = useDesk((s) => s.setTheme);
	const active = THEMES.find((item) => item.id === theme) ?? THEMES[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex gap-2 overflow-x-auto pb-1",
		children: THEMES.map((item) => {
			const on = theme === item.id;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				"aria-pressed": on,
				onClick: () => setTheme(item.id),
				className: cn("inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium", on ? "border-primary bg-primary-soft text-fg" : "border-line bg-surface text-muted"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					"data-theme": item.id,
					className: "size-2.5 rounded-full bg-primary"
				}), item.name]
			}, item.id);
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-2 text-sm text-muted",
		children: active.line
	})] });
}
function ThemeSwatches() {
	const theme = useDesk((s) => s.theme);
	const setTheme = useDesk((s) => s.setTheme);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
		children: THEMES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			"data-theme": item.id,
			"aria-pressed": theme === item.id,
			onClick: () => setTheme(item.id),
			className: cn("rounded-lg border bg-bg p-4 text-left text-fg", theme === item.id ? "border-primary" : "border-line"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mb-3 flex gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-10 flex-1 rounded-md border border-line bg-surface" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-10 w-10 rounded-md bg-primary" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-10 w-6 rounded-md bg-danger" })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-sm font-semibold",
					children: item.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-1 block text-sm text-muted",
					children: item.line
				})
			]
		}, item.id))
	});
}
function Countdown({ end }) {
	const now = useDesk((s) => s.now);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "font-mono tabular-nums",
		children: now ? remain(end - now) : "—"
	});
}
var styles_default = "/assets/styles-Bh2aacoY.css";
var APP_NAME = "Helios Desk";
var Route$11 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#101512"
			},
			{
				name: "description",
				content: "Paper-first Polymarket BTC trading desk with manual approval, risk gates, and a baseline probability model."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/icons/apple-touch-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PwaRegister, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
var $$splitComponentImporter$10 = () => import("./routes-Cx7hFS96.mjs");
var Route$10 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./account-DP8ZTisj.mjs");
var Route$9 = createFileRoute("/account")({
	head: () => ({ meta: [{ title: "Account · Helios Desk" }] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./audit-BPyubH4l.mjs");
var Route$8 = createFileRoute("/audit")({
	head: () => ({ meta: [{ title: "Audit · Helios Desk" }] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./book-C1dvIO_z.mjs");
var Route$7 = createFileRoute("/book")({
	head: () => ({ meta: [{ title: "Book · Helios Desk" }] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./controls-jWGrRQ8k.mjs");
var Route$6 = createFileRoute("/controls")({
	head: () => ({ meta: [{ title: "Controls · Helios Desk" }] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./lab-BLiIaWUX.mjs");
var Route$5 = createFileRoute("/lab")({
	head: () => ({ meta: [{ title: "Lab · Helios Desk" }] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./live-BSZBN-1c.mjs");
var Route$4 = createFileRoute("/live")({
	head: () => ({ meta: [{ title: "Live · Helios Desk" }] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./login-B9aFfs7q.mjs");
var Route$3 = createFileRoute("/login")({
	head: () => ({ meta: [{ title: "Sign in · Helios Desk" }] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./markets-HZs_ihER.mjs");
var Route$2 = createFileRoute("/markets")({
	head: () => ({ meta: [{ title: "Markets · Helios Desk" }] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./signals-D18Y20AD.mjs");
var Route$1 = createFileRoute("/signals")({
	head: () => ({ meta: [{ title: "Signals · Helios Desk" }] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./trial-ChKljDlW.mjs");
var Route = createFileRoute("/trial")({
	head: () => ({ meta: [{ title: "Trial · Helios Desk" }] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var rootRouteChildren = {
	IndexRoute: Route$10.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$11
	}),
	AccountRoute: Route$9.update({
		id: "/account",
		path: "/account",
		getParentRoute: () => Route$11
	}),
	AuditRoute: Route$8.update({
		id: "/audit",
		path: "/audit",
		getParentRoute: () => Route$11
	}),
	BookRoute: Route$7.update({
		id: "/book",
		path: "/book",
		getParentRoute: () => Route$11
	}),
	ControlsRoute: Route$6.update({
		id: "/controls",
		path: "/controls",
		getParentRoute: () => Route$11
	}),
	LabRoute: Route$5.update({
		id: "/lab",
		path: "/lab",
		getParentRoute: () => Route$11
	}),
	LiveRoute: Route$4.update({
		id: "/live",
		path: "/live",
		getParentRoute: () => Route$11
	}),
	LoginRoute: Route$3.update({
		id: "/login",
		path: "/login",
		getParentRoute: () => Route$11
	}),
	MarketsRoute: Route$2.update({
		id: "/markets",
		path: "/markets",
		getParentRoute: () => Route$11
	}),
	SignalsRoute: Route$1.update({
		id: "/signals",
		path: "/signals",
		getParentRoute: () => Route$11
	}),
	TrialRoute: Route.update({
		id: "/trial",
		path: "/trial",
		getParentRoute: () => Route$11
	})
};
var routeTree = Route$11._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		rewrite: previewPathRewrite(),
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { getBacktest as A, signOutFn as C, createSsrRpc as D, useInstall as E, restoreBackup as M, sendCommand as N, desk_api_exports as O, startBacktest as P, signInFn as S, testConnection as T, useDesk as _, Pill as a, getSettings as b, ThemeSwatches as c, downloadText as d, money as f, toCsv as g, signedMoney as h, Panel as i, getDesk as j, exportBackup as k, age as l, px as m, Button as n, ProbBar as o, pct as p, Countdown as r, Stat as s, router_exports as t, clock as u, deleteAccount as v, signUpFn as w, saveSettings as x, getMe as y };
