import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as useDesk, a as Pill, f as money, i as Panel, l as age, m as px, n as Button, r as Countdown } from "./router-D_0PflgJ.mjs";
import { r as ModelVsMarketChart } from "./charts-CKS2swHU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/markets-DBoUqgiE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FILTERS = [
	"All",
	"Live",
	"5m",
	"15m",
	"1h"
];
function MarketsPage() {
	const sim = useDesk((s) => s.simMarkets);
	const live = useDesk((s) => s.liveMarkets);
	const now = useDesk((s) => s.now);
	const liveError = useDesk((s) => s.liveError);
	const bookStatus = useDesk((s) => s.bookStatus);
	const [filter, setFilter] = (0, import_react.useState)("All");
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const rows = [...sim, ...live].filter((market) => {
		if (filter === "Live") return market.kind === "live";
		if (filter === "All") return true;
		return market.group === filter;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-3xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-semibold tracking-tight",
					children: "Discover the board. Don't pin one window."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-muted",
					children: "Live rows are discovered from Polymarket, then their bids and asks stream from the public order book. Windows are found automatically, so no five-minute id is hardcoded."
				})]
			}),
			liveError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger",
				children: liveError
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
					tone: bookStatus === "live" ? "good" : bookStatus === "down" ? "bad" : "neutral",
					children: bookStatus === "live" ? "Live book" : bookStatus === "connecting" ? "Connecting" : bookStatus === "down" ? "Book down" : "Book idle"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-2 overflow-x-auto",
				children: FILTERS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setFilter(item),
					className: filter === item ? "h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg" : "h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm text-fg",
					children: item
				}, item))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [rows.map((market) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketRow, {
					market,
					now,
					open: openId === market.id,
					onToggle: () => setOpenId((id) => id === market.id ? null : market.id)
				}, market.id)), rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					title: "Nothing in this filter",
					children: "The tape is still warming, or this duration is between windows."
				})]
			})
		]
	});
}
function MarketRow({ market, now, open, onToggle }) {
	const hist = useDesk((s) => s.hist[market.id]);
	const spread = market.yesAsk - market.yesBid;
	const blocked = !market.metadataOk || market.restricted || market.status !== "open";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-lg border border-line bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: market.kind === "live" ? "good" : "neutral",
								children: market.kind === "live" ? "Polymarket" : "Simulated"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { children: market.group || "BTC" }),
							blocked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
								tone: "bad",
								children: market.kind === "live" ? "Watch only" : "Blocked"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-semibold tracking-tight",
						children: market.question
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-sm tabular-nums text-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Countdown, { end: market.endAt })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-4 grid grid-cols-2 gap-3 font-mono text-sm tabular-nums sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-xs text-muted",
						children: "Bid / ask"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
						px(market.yesBid),
						" / ",
						px(market.yesAsk)
					] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-xs text-muted",
						children: "Spread"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: px(spread) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-xs text-muted",
						children: "Liquidity"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: money(market.liquidity, 0) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "text-xs text-muted",
						children: "Fresh"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: age(now, market.updatedAt) })] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "ghost",
				className: "mt-2 px-0",
				onClick: onToggle,
				children: open ? "Hide contract" : "Resolution and source"
			}),
			open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 space-y-2 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModelVsMarketChart, { rows: hist ?? [] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: market.resolution }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"Outcomes: ",
						market.outcomes[0],
						" / ",
						market.outcomes[1],
						". Source: ",
						market.source,
						".",
						market.metadataOk ? " Critical metadata is present." : market.kind === "live" ? " Up/down windows stay watch-only until this desk sees the open print. Orders stay on paper." : " Missing strike or resolution text blocks paper orders.",
						market.restricted ? " Marked restricted, so eligibility is unverified." : ""
					] }),
					market.sourceUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "font-semibold text-primary",
						href: market.sourceUrl,
						target: "_blank",
						rel: "noreferrer",
						children: "Open on Polymarket"
					})
				]
			})
		]
	});
}
//#endregion
export { MarketsPage as component };
