import { o as __toESM } from "../_runtime.mjs";
import { s as liveDayRoll, u as uid } from "./ledger-CdyAlo7W.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/live-ab9wFk_-.js
function liveEnv(env = process.env) {
	return {
		enabled: env.HELIOS_LIVE_ENABLED === "1",
		hasKey: Boolean(env.POLY_PRIVATE_KEY?.trim()),
		hasFunder: Boolean(env.POLY_FUNDER_ADDRESS?.trim()),
		hasOwnerToken: Boolean(env.HELIOS_OWNER_TOKEN?.trim())
	};
}
function envReady(e) {
	return e.enabled && e.hasKey && e.hasFunder && e.hasOwnerToken;
}
/** Round a price up to the tick so a marketable limit stays marketable. */
function roundUpToTick(price, tick) {
	const t = tick > 0 ? tick : .01;
	return Math.min(.99, Math.round(Math.ceil(price / t - 1e-9) * t * 1e6) / 1e6);
}
/** Pure risk check + sizing. Returns a plan or the reason it was refused. */
function planLiveOrder(core, book, sig, market, opts) {
	const live = liveDayRoll(book, opts.now);
	if (live.status === "off") return { refused: "Live is off" };
	if (core.killed) return { refused: "Kill switch is on" };
	if (core.circuitKind) return { refused: "A circuit breaker is active" };
	if (live.status === "armed" && !opts.eligible) return { refused: "Paper trial has not passed the live gate" };
	if (!market || market.kind !== "live") return { refused: "Only real Polymarket markets can trade live" };
	if (market.status !== "open" || market.endAt - opts.now < 3e4) return { refused: "Market is closed or about to close" };
	if (!market.metadataOk || market.restricted) return { refused: "Market metadata is ambiguous or restricted" };
	if (market.source !== "Polymarket CLOB") return { refused: "No fresh order book for this market" };
	if (opts.now - market.updatedAt > 15e3) return { refused: "Quote is stale" };
	const tokenId = sig.side === "yes" ? market.yesTokenId : market.noTokenId;
	if (!tokenId) return { refused: "Missing token id for this side" };
	if (live.dayRealized <= -live.dailyLossLimit) return { refused: "Daily live loss limit reached" };
	if (live.orders.some((o) => o.signalId === sig.id && o.status !== "rejected" && o.status !== "error")) return { refused: "Signal already sent live" };
	const tick = opts.tick ?? .01;
	const price = roundUpToTick(sig.executablePrice, tick);
	if (price < .08 || price > .92) return { refused: "Price outside the 8¢–92¢ band" };
	const open = live.orders.filter((o) => o.status === "open" || o.status === "filled" && !o.settled).reduce((a, o) => a + o.debit, 0);
	const room = live.maxExposure - open;
	const stake = Math.min(live.maxStake, sig.stake, room);
	if (stake <= 0) return { refused: "Live exposure cap reached" };
	const size = Math.floor(stake / price * 100) / 100;
	if (size < 5) return { refused: `Polymarket needs at least 5 shares: $${(5 * price).toFixed(2)} at ${Math.round(price * 100)}¢, but the cap here is $${stake.toFixed(2)}. Raise the live cap or skip this one.` };
	return { plan: {
		tokenId,
		price,
		size,
		cost: size * price
	} };
}
var sdkCache = /* @__PURE__ */ new Map();
function loadSdk(env = process.env) {
	const cacheKey = `${env.POLY_PRIVATE_KEY}|${env.POLY_FUNDER_ADDRESS}|${env.POLY_SIGNATURE_TYPE}`;
	const hit = sdkCache.get(cacheKey);
	if (hit) return hit;
	const made = (async () => {
		const { ClobClient, Side, OrderType, AssetType } = await import("../_libs/@polymarket/clob-client+[...].mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
		const { Wallet } = await import("../_libs/ethers.mjs").then((n) => n.t);
		const host = env.POLY_CLOB_HOST || "https://clob.polymarket.com";
		const signer = new Wallet(String(env.POLY_PRIVATE_KEY));
		const sigType = Number(env.POLY_SIGNATURE_TYPE ?? 2);
		const funder = String(env.POLY_FUNDER_ADDRESS);
		let creds;
		if (env.POLY_API_KEY && env.POLY_API_SECRET && env.POLY_API_PASSPHRASE) creds = {
			key: env.POLY_API_KEY,
			secret: env.POLY_API_SECRET,
			passphrase: env.POLY_API_PASSPHRASE
		};
		else creds = await new ClobClient(host, 137, signer).createOrDeriveApiKey();
		return {
			client: new ClobClient(host, 137, signer, creds, sigType, funder),
			BUY: Side.BUY,
			GTC: OrderType.GTC,
			COLLATERAL: AssetType.COLLATERAL
		};
	})().catch((e) => {
		sdkCache.delete(cacheKey);
		throw e;
	});
	sdkCache.set(cacheKey, made);
	return made;
}
/** Preflight: can we authenticate, see a balance, and is the exchange allowed to spend it? */
async function checkConnection(sdk) {
	const messages = [];
	try {
		const bal = await sdk.client.getBalanceAllowance({ asset_type: sdk.COLLATERAL });
		const balance = Number(bal.balance) / 1e6;
		const allowances = bal.allowances ? Object.values(bal.allowances).map(Number) : bal.allowance != null ? [Number(bal.allowance)] : [];
		const allowanceOk = allowances.length ? allowances.some((a) => Number.isFinite(a) && a > 0) : null;
		messages.push(`Authenticated. USDC balance $${Number.isFinite(balance) ? balance.toFixed(2) : "?"}.`);
		if (allowanceOk === false) messages.push("Exchange allowance is zero. Trade once from the Polymarket website (or approve USDC there) so the exchange can spend your balance.");
		if (Number.isFinite(balance) && balance < 5) messages.push("Balance is below one minimum order. Deposit through Polymarket first.");
		return {
			ok: true,
			balance: Number.isFinite(balance) ? balance : null,
			allowanceOk,
			messages
		};
	} catch (e) {
		return {
			ok: false,
			balance: null,
			allowanceOk: null,
			messages: [`Could not authenticate: ${safeError(e)}`]
		};
	}
}
/** Never put keys in an error that reaches the UI or logs. */
function safeError(e) {
	return (e instanceof Error ? e.message : String(e)).replace(/0x[a-fA-F0-9]{40,}/g, "0x…").replace(/(secret|passphrase|key)["':= ]+[A-Za-z0-9+/=_-]{8,}/gi, "$1=…").slice(0, 240);
}
async function checkGeoblock() {
	try {
		const res = await fetch("https://polymarket.com/api/geoblock", {
			headers: { accept: "application/json" },
			signal: AbortSignal.timeout(6e3)
		});
		if (!res.ok) return {
			blocked: null,
			where: ""
		};
		const j = await res.json();
		if (typeof j.blocked !== "boolean") return {
			blocked: null,
			where: ""
		};
		return {
			blocked: j.blocked,
			where: [j.country, j.region].filter((x) => typeof x === "string" && x).join("/") || "this location"
		};
	} catch {
		return {
			blocked: null,
			where: ""
		};
	}
}
async function submitLive(sdk, book, sig, market, plan, now, geo = checkGeoblock) {
	const dry = book.status === "dry";
	const base = {
		id: uid("lord"),
		clientKey: sig.id,
		exchangeId: null,
		marketId: market.id,
		tokenId: plan.tokenId,
		side: sig.side,
		price: plan.price,
		size: plan.size,
		debit: plan.cost,
		status: dry ? "dry" : "open",
		submittedAt: now,
		updatedAt: now,
		question: market.question,
		note: "",
		signalId: sig.id
	};
	try {
		const g = dry ? {
			blocked: false,
			where: ""
		} : await geo();
		if (g.blocked !== false) return {
			...base,
			status: "rejected",
			note: g.blocked === true ? `Polymarket blocks trading from ${g.where}. Not sent.` : "Could not confirm this location is allowed to trade. Not sent."
		};
		const tickSize = String(await sdk.client.getTickSize(plan.tokenId));
		const negRisk = await sdk.client.getNegRisk(plan.tokenId);
		const order = {
			tokenID: plan.tokenId,
			price: plan.price,
			size: plan.size,
			side: sdk.BUY
		};
		if (dry) {
			await sdk.client.createOrder(order, {
				tickSize,
				negRisk
			});
			return {
				...base,
				note: "Dry run: order built and signed, not posted."
			};
		}
		const resp = await sdk.client.createAndPostOrder(order, {
			tickSize,
			negRisk
		}, sdk.GTC);
		if (resp.success === false || !resp.orderID) return {
			...base,
			status: "rejected",
			note: safeError(resp.errorMsg || "Exchange rejected the order")
		};
		return {
			...base,
			exchangeId: resp.orderID,
			note: `Posted (${resp.status ?? "accepted"})`
		};
	} catch (e) {
		return {
			...base,
			status: "error",
			note: safeError(e)
		};
	}
}
/**
* Pull exchange state for open live orders; cancel stale ones; settle filled ones when the venue
* has resolved the market. Returns the updated book. Never throws.
*/
async function reconcileLive(sdk, book, resolutions, now) {
	let live = liveDayRoll(book, now);
	try {
		const orders = [];
		for (const o of live.orders) {
			if (o.status === "open" && o.exchangeId) {
				const remote = await sdk.client.getOrder(o.exchangeId);
				const matched = Number(remote.size_matched) || 0;
				const original = Number(remote.original_size) || o.size;
				const st = remote.status.toLowerCase();
				if (matched >= original - 1e-9) {
					orders.push({
						...o,
						status: "filled",
						filledSize: matched,
						updatedAt: now
					});
					continue;
				}
				if (st.includes("cancel") || st.includes("expire")) {
					orders.push({
						...o,
						status: matched > 0 ? "filled" : "cancelled",
						filledSize: matched,
						updatedAt: now
					});
					continue;
				}
				if (now - o.submittedAt > 6e4) {
					await sdk.client.cancelOrder({ orderID: o.exchangeId });
					orders.push({
						...o,
						status: matched > 0 ? "filled" : "cancelled",
						filledSize: matched,
						updatedAt: now,
						note: "Cancelled after 60s without a full fill"
					});
					continue;
				}
			}
			orders.push(o);
		}
		let realized = live.realized;
		let dayRealized = live.dayRealized;
		const settled = orders.map((o) => {
			if (o.status !== "filled" || o.settled) return o;
			const verdict = resolutions[o.marketId.replace(/^poly-/, "")];
			if (verdict === void 0) return o;
			const qty = o.filledSize ?? o.size;
			const pnl = qty * (o.side === "yes" === verdict ? 1 : 0) - qty * o.price;
			realized += pnl;
			dayRealized += pnl;
			return {
				...o,
				settled: true,
				pnl,
				updatedAt: now
			};
		});
		let exchangeCash = live.exchangeCash;
		try {
			const bal = await sdk.client.getBalanceAllowance({ asset_type: sdk.COLLATERAL });
			const v = Number(bal.balance) / 1e6;
			if (Number.isFinite(v)) exchangeCash = v;
		} catch {}
		live = {
			...live,
			orders: settled.slice(0, 300),
			realized,
			dayRealized,
			exchangeCash,
			lastReconcileAt: now,
			lastReconcileOk: true,
			lastError: null
		};
	} catch (e) {
		live = {
			...live,
			lastReconcileAt: now,
			lastReconcileOk: false,
			lastError: safeError(e)
		};
	}
	return live;
}
/** Best-effort cancel of every resting live order (used by the kill switch). */
async function cancelAllLive(sdk, book, now) {
	const orders = [];
	for (const o of book.orders) {
		if (o.status === "open" && o.exchangeId) try {
			await sdk.client.cancelOrder({ orderID: o.exchangeId });
			orders.push({
				...o,
				status: "cancelled",
				updatedAt: now,
				note: "Cancelled by kill switch"
			});
			continue;
		} catch (e) {
			orders.push({
				...o,
				note: `Cancel failed: ${safeError(e)}`,
				updatedAt: now
			});
			continue;
		}
		orders.push(o);
	}
	return {
		...book,
		orders
	};
}
//#endregion
export { cancelAllLive, checkConnection, envReady, liveEnv, loadSdk, planLiveOrder, reconcileLive, safeError, submitLive };
