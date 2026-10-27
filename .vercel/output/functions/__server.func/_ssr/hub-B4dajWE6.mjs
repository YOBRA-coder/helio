import { i as STARTING_CASH } from "./engine-BmNSrsOt.mjs";
import { a as hydrateCore, c as makeCore, d as withAlert, f as withAudit, i as findMarket, l as tickCore, n as applyQuotes, o as killCore, r as applyTape, s as liveDayRoll, t as applyCommand, u as uid } from "./ledger-CdyAlo7W.mjs";
import { a as summarize, r as evaluateGate, t as DEFAULT_GATE } from "./trial-B01rn2RJ.mjs";
import { appendJournal, backupSnapshot, drainCommands, readSnapshot, takeRestore, writeSnapshot } from "./desk-io-e10SEdvf.mjs";
import { a as getJson, c as num, i as fetchSpotAt, n as fetchQuotes, o as lastOpenError, r as fetchResolutions, s as loadTape, t as asRecord } from "./tape-fetch-xqAH3ngP.mjs";
import { n as LIVE_CEILING } from "./live-const-QXZLlCa8.mjs";
import { cancelAllLive, envReady, loadSdk, planLiveOrder, reconcileLive, submitLive } from "./live-ab9wFk_-.mjs";
import { join } from "node:path";
import { stat } from "node:fs/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/hub-B4dajWE6.js
/**
* Context signals: what the wider world is saying while Helios trades BTC windows.
*
* Sources, cheapest first:
*  1. Polymarket itself (free, no key): crowd probabilities on BTC / macro markets.
*  2. alternative.me Fear & Greed (free, no key).
*  3. World Monitor (optional, needs a paid API key): its own Fear & Greed read and
*     prediction-market search. Its prediction endpoint is a relay of Polymarket's Gamma
*     data, so it adds nothing for Polymarket prices; the value is the extra regime data.
*
* Nothing here is allowed to create trades. It can only (a) shrink stake in extreme regimes,
* (b) block trading with a stated reason, or (c) when explicitly enabled, nudge long-horizon
* probabilities by at most ±2 points. Every use is logged on the signal so the trial can
* measure whether context helped or hurt.
*/
var CROWD_RE = /(bitcoin|\bbtc\b|crypto|\bfed\b|rate cut|recession|tariff|\betf\b|inflation|\bcpi\b)/i;
async function fetchFearGreed() {
	try {
		const json = asRecord(await getJson("https://api.alternative.me/fng/?limit=1", 6e3));
		const row = Array.isArray(json?.data) ? asRecord(json.data[0]) : null;
		const v = num(row?.value, NaN);
		return Number.isFinite(v) && v >= 0 && v <= 100 ? v : null;
	} catch {
		return null;
	}
}
function parseCrowd(payload) {
	const rows = Array.isArray(payload) ? payload : [];
	const out = [];
	for (const raw of rows) {
		const m = asRecord(raw);
		if (!m) continue;
		const title = typeof m.question === "string" ? m.question : "";
		if (!title || !CROWD_RE.test(title)) continue;
		let prices = m.outcomePrices;
		if (typeof prices === "string") try {
			prices = JSON.parse(prices);
		} catch {
			prices = [];
		}
		const yes = Array.isArray(prices) ? num(prices[0], NaN) : NaN;
		if (!Number.isFinite(yes)) continue;
		const ev = Array.isArray(m.events) ? asRecord(m.events[0]) : null;
		const slug = typeof ev?.slug === "string" ? ev.slug : null;
		out.push({
			title,
			yes,
			volume: num(m.volume24hr, num(m.volumeNum, 0)),
			url: slug ? `https://polymarket.com/event/${slug}` : null,
			source: "Polymarket"
		});
		if (out.length >= 8) break;
	}
	return out;
}
async function fetchCrowd() {
	try {
		return parseCrowd(await getJson("https://gamma-api.polymarket.com/markets?closed=false&active=true&order=volume24hr&ascending=false&limit=100", 8e3));
	} catch {
		return [];
	}
}
/** World Monitor adapter. Returns status instead of throwing: the desk must run without it. */
async function fetchWorldMonitor(cfg, now) {
	if (!cfg.worldMonitorKey) return {
		status: {
			status: "off",
			detail: "No World Monitor key configured. REST API access is a paid plan.",
			at: now
		},
		fearGreed: null,
		crowd: []
	};
	const base = (cfg.worldMonitorBase || "https://api.worldmonitor.app").replace(/\/$/, "");
	const headers = {
		"X-WorldMonitor-Key": cfg.worldMonitorKey,
		"User-Agent": "helios-desk/1.0",
		accept: "application/json"
	};
	const get = async (path) => {
		const ctrl = new AbortController();
		const timer = setTimeout(() => ctrl.abort(), 8e3);
		try {
			const res = await fetch(`${base}${path}`, {
				headers,
				signal: ctrl.signal
			});
			if (res.status === 401 || res.status === 403) throw new Error("key rejected");
			if (res.status === 429) throw new Error("rate limited");
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.json();
		} finally {
			clearTimeout(timer);
		}
	};
	try {
		const [fg, pm] = await Promise.all([get("/api/market/v1/get-fear-greed-index").catch(() => null), get("/api/prediction/v1/list-prediction-markets?query=bitcoin&page_size=10")]);
		const fearGreed = pickIndex(fg);
		const crowd = parseWmMarkets(pm);
		return {
			status: {
				status: "ok",
				detail: `${crowd.length} markets${fearGreed != null ? `, fear & greed ${fearGreed}` : ""}`,
				at: now
			},
			fearGreed,
			crowd
		};
	} catch (e) {
		return {
			status: {
				status: "error",
				detail: e instanceof Error ? e.message : "request failed",
				at: now
			},
			fearGreed: null,
			crowd: []
		};
	}
}
function pickIndex(payload) {
	const rec = asRecord(payload);
	if (!rec) return null;
	for (const key of [
		"value",
		"score",
		"index",
		"fearGreedIndex",
		"fear_greed_index",
		"current"
	]) {
		const v = num(rec[key], NaN);
		if (Number.isFinite(v) && v >= 0 && v <= 100) return v;
	}
	const nested = asRecord(rec.data) ?? asRecord(rec.result);
	return nested ? pickIndex(nested) : null;
}
function parseWmMarkets(payload) {
	const rec = asRecord(payload);
	const rows = Array.isArray(rec?.markets) ? rec.markets : [];
	const out = [];
	for (const raw of rows) {
		const m = asRecord(raw);
		if (!m) continue;
		const title = typeof m.title === "string" ? m.title : "";
		const yes = num(m.yes_price ?? m.yesPrice, NaN);
		if (!title || !Number.isFinite(yes)) continue;
		out.push({
			title,
			yes,
			volume: num(m.volume, 0),
			url: typeof m.url === "string" ? m.url : null,
			source: "World Monitor"
		});
	}
	return out;
}
/** Pure: turn raw inputs into the bounded effects the engine may use. */
function composeContext(now, input, cfg) {
	const items = [];
	let stakeScale = 1;
	let tilt = 0;
	const fg = input.fearGreed;
	if (fg != null) {
		items.push({
			label: "Fear & Greed",
			value: String(Math.round(fg)),
			source: "alternative.me / World Monitor",
			at: now
		});
		if (fg <= 12 || fg >= 88) {
			stakeScale = .5;
			items.push({
				label: "Regime",
				value: "Extreme sentiment: stake halved",
				source: "Helios rule",
				at: now
			});
		}
		if (cfg.tiltEnabled) tilt = Math.max(-1, Math.min(1, (fg - 50) / 50));
	}
	return {
		fetchedAt: now,
		fearGreed: fg,
		tilt,
		stakeScale,
		blockReason: null,
		items,
		crowd: input.crowd.slice(0, 10),
		worldMonitor: input.wm
	};
}
async function loadContext(cfg, now = Date.now()) {
	const [fg, crowd, wm] = await Promise.all([
		fetchFearGreed(),
		fetchCrowd(),
		fetchWorldMonitor(cfg, now)
	]);
	return composeContext(now, {
		fearGreed: wm.fearGreed ?? fg,
		crowd: [...wm.crowd, ...crowd],
		wm: wm.status
	}, cfg);
}
/**
* DeskRunner: the orchestration loop behind the 24/7 paper trial and the live section.
* All I/O is injected so the loop can be tested with fakes and a fake clock.
*/
var WORKER_VERSION = "helios-worker-1";
var DeskRunner = class {
	core;
	meta;
	resolutions = {};
	opens = /* @__PURE__ */ new Map();
	openTried = /* @__PURE__ */ new Map();
	spotLog = [];
	openFails = 0;
	lastTape = 0;
	lastQuotes = 0;
	lastRes = 0;
	lastCtx = 0;
	lastReconcile = 0;
	lastPersist = 0;
	journaled = /* @__PURE__ */ new Set();
	busy = /* @__PURE__ */ new Set();
	lastAlertAt = 0;
	lastDigestAt = 0;
	settledNotified = /* @__PURE__ */ new Set();
	digestPrimed = false;
	deps;
	constructor(deps, initial) {
		this.deps = deps;
		const now = deps.now();
		this.core = initial ? hydrateCore(initial, now) : makeCore(now);
		this.meta = {
			tapeAt: 0,
			quotesAt: 0,
			feedError: null,
			workerStartedAt: now,
			lastCommandNote: null
		};
		for (const s of this.core.scores) this.journaled.add(s.id);
		if (this.core.live.status === "armed") {
			this.core.live = {
				...this.core.live,
				status: "off",
				armedAt: null,
				auto: false
			};
			this.core.audit = withAudit(this.core.audit, {
				id: uid("audit"),
				at: now,
				actor: "system",
				action: "Live disarmed on restart",
				detail: "The worker restarted. Live trading never resumes on its own; re-arm it deliberately."
			});
		}
	}
	/** Run once at startup: pull any live orders a previous run left resting on the exchange. */
	async init() {
		const env = this.deps.liveEnv();
		const open = this.core.live.orders.filter((o) => o.status === "open" && o.exchangeId);
		if (!open.length || !env.hasKey) return;
		try {
			const sdk = await this.deps.getSdk();
			const next = await cancelAllLive(sdk, this.core.live, this.deps.now());
			this.core = {
				...this.core,
				live: next,
				audit: withAudit(this.core.audit, {
					id: uid("audit"),
					at: this.deps.now(),
					actor: "system",
					action: "Startup cancel",
					detail: `Cancelled ${open.length} live order(s) left resting before the restart.`
				})
			};
			this.deps.notify?.(`Helios restarted and cancelled ${open.length} resting live order(s).`);
		} catch {
			this.deps.notify?.("Helios restarted but could not cancel resting live orders. Check Polymarket directly.");
		}
	}
	notifyNew() {
		if (!this.deps.notify) return;
		const fresh = this.core.alerts.filter((a) => a.severity === "danger" && a.at > this.lastAlertAt);
		if (fresh.length) {
			this.lastAlertAt = Math.max(...fresh.map((a) => a.at));
			this.deps.notify(`Helios: ${fresh.map((a) => `${a.title} (${a.detail})`).join("; ")}`);
		}
	}
	/** Phone alerts for settled real-market trades, plus a daily summary and a model-vs-market warning. */
	notifyTrades(now) {
		if (!this.deps.notify) return;
		const real = this.core.scores.filter((r) => r.kind === "live");
		if (!this.digestPrimed) {
			for (const r of real) this.settledNotified.add(r.id);
			this.lastDigestAt = now;
			this.digestPrimed = true;
			return;
		}
		const fresh = real.filter((r) => !this.settledNotified.has(r.id));
		for (const r of fresh.slice(0, 3)) {
			this.settledNotified.add(r.id);
			this.deps.notify(`Helios settled: ${r.side.toUpperCase()} on ${r.group} window ${r.pnl >= 0 ? "won" : "lost"} ${r.pnl >= 0 ? "+" : "-"}$${Math.abs(r.pnl).toFixed(2)} (paper).`);
		}
		for (const r of fresh.slice(3)) this.settledNotified.add(r.id);
		if (now - this.lastDigestAt >= 864e5) {
			this.lastDigestAt = now;
			const s = summarize(this.core, now, STARTING_CASH);
			const gate = evaluateGate(s, this.core.risk.drawdownLimit, DEFAULT_GATE);
			let msg = `Helios daily summary: ${s.trades} real trades, net ${s.netPnl >= 0 ? "+" : "-"}$${Math.abs(s.netPnl).toFixed(2)}, win rate ${(s.winRate * 100).toFixed(0)}%, trial day ${s.days.toFixed(1)}, gate ${gate.eligible ? "PASSED" : "not passed"}.`;
			if (s.officialTrades >= 30 && s.brierEdge != null && s.brierEdge <= 0) msg += " Warning: the model is not beating the market price on probability accuracy.";
			this.deps.notify(msg);
		}
	}
	once(name, fn) {
		if (this.busy.has(name)) return;
		this.busy.add(name);
		fn().catch(() => {}).finally(() => this.busy.delete(name));
	}
	/** Called every second. Network refreshes run in the background; the tick itself is synchronous. */
	async step() {
		const now = this.deps.now();
		const d = this.deps;
		if (now - this.lastTape > 6e3) {
			this.lastTape = now;
			this.once("tape", async () => {
				const tape = await d.loadTape();
				const t = d.now();
				const opens = {};
				for (const m of tape.markets) {
					const id = `poly-${m.id}`;
					const known = this.opens.get(id);
					if (known != null) opens[id] = known;
				}
				this.core = applyTape(this.core, tape, opens, t);
				this.meta.tapeAt = t;
				this.meta.feedError = tape.error;
				if (tape.spot) {
					this.pendingSpot = {
						spot: tape.spot,
						source: tape.spotSource
					};
					this.spotLog = [...this.spotLog, [t, tape.spot]].filter((r) => t - r[0] < 216e5).slice(-4e3);
				}
				for (const m of this.core.liveMarkets) {
					if (m.openSpot != null || !/up or down/i.test(m.question) || m.startAt > t) continue;
					if (t - (this.openTried.get(m.id) ?? 0) < 3e4) continue;
					this.openTried.set(m.id, t);
					const near = this.spotLog.reduce((best, r) => Math.abs(r[0] - m.startAt) <= 8e3 && (!best || Math.abs(r[0] - m.startAt) < Math.abs(best[0] - m.startAt)) ? r : best, null);
					const open = near ? near[1] : await d.fetchSpotAt(m.startAt);
					if (open == null) {
						this.openFails += 1;
						this.meta.feedError = `Cannot load the BTC price at window open. ${lastOpenError}`;
					} else this.openFails = 0;
					if (open != null) {
						this.opens.set(m.id, open);
						this.core = {
							...this.core,
							liveMarkets: this.core.liveMarkets.map((x) => x.id === m.id ? {
								...x,
								openSpot: open,
								metadataOk: x.metadataOk || !x.restricted
							} : x)
						};
					}
				}
			});
		}
		if (now - this.lastQuotes > 2500) {
			this.lastQuotes = now;
			this.once("quotes", async () => {
				const ids = this.core.liveMarkets.filter((m) => m.status === "open").map((m) => m.yesTokenId).filter((x) => Boolean(x));
				const q = await d.fetchQuotes(ids);
				if (q.length) {
					this.core = applyQuotes(this.core, q, d.now());
					this.meta.quotesAt = d.now();
				}
			});
		}
		if (now - this.lastRes > 2e4) {
			this.lastRes = now;
			this.once("resolutions", async () => {
				const wanted = /* @__PURE__ */ new Set();
				for (const p of this.core.positions) if (p.status === "open" && p.kind === "live") wanted.add(p.marketId.replace(/^poly-/, ""));
				for (const o of this.core.live.orders) if (o.status === "filled" && !o.settled) wanted.add(o.marketId.replace(/^poly-/, ""));
				const due = [...wanted].filter((gid) => {
					const m = this.core.liveMarkets.find((x) => x.id === `poly-${gid}`);
					return !m || m.endAt <= d.now() + 5e3;
				});
				if (due.length) this.resolutions = {
					...this.resolutions,
					...await d.fetchResolutions(due)
				};
			});
		}
		if (now - this.lastCtx > 12e4) {
			this.lastCtx = now;
			this.once("context", async () => {
				const ctx = await d.loadContext();
				this.core = {
					...this.core,
					context: ctx
				};
			});
		}
		if (this.core.live.status === "armed" && now - this.lastReconcile > 1e4) {
			this.lastReconcile = now;
			this.once("reconcile", async () => {
				const sdk = await d.getSdk();
				const next = await reconcileLive(sdk, this.core.live, this.resolutions, d.now());
				this.core = {
					...this.core,
					live: next
				};
				if (next.lastReconcileOk === false) this.core = {
					...this.core,
					live: {
						...this.core.live,
						status: "off",
						armedAt: null,
						auto: false
					},
					circuitKind: "reconcile",
					reconcileNote: `Live reconciliation failed: ${next.lastError ?? "unknown"}. Live was disarmed.`,
					alerts: withAlert(this.core.alerts, {
						id: uid("alert"),
						at: d.now(),
						severity: "danger",
						title: "Live reconcile failed",
						detail: "Live trading was disarmed. Check the exchange, then clear the mismatch.",
						read: false
					}, "live-reconcile", 3e4)
				};
			});
		}
		const restored = d.takeRestore ? await d.takeRestore() : null;
		if (restored && typeof restored === "object") {
			const body = restored;
			if (body.core && typeof body.core === "object") {
				const next = hydrateCore(body.core, now);
				next.live = {
					...next.live,
					status: "off",
					armedAt: null,
					auto: false
				};
				next.audit = withAudit(next.audit, {
					id: uid("audit"),
					at: now,
					actor: "owner",
					action: "Backup restored",
					detail: "Desk state replaced from an uploaded backup. Live trading is off; re-arm it deliberately."
				});
				this.core = next;
				this.journaled = new Set(next.scores.map((x) => x.id));
				this.settledNotified = new Set(next.scores.map((x) => x.id));
				this.meta.lastCommandNote = "Backup restored";
			}
		}
		const cmds = await d.drainCommands();
		for (const cmd of cmds) await this.apply(cmd);
		const fresh = this.pendingSpot;
		this.pendingSpot = null;
		this.core = tickCore(this.core, {
			now,
			spot: fresh?.spot ?? this.core.spot,
			spotSource: fresh?.source,
			spotFresh: Boolean(fresh),
			spotDtMs: 6e3,
			resolutions: this.resolutions,
			sim: process.env.HELIOS_SIM_WINDOWS === "1"
		});
		await this.mirrorLive(now);
		this.notifyNew();
		this.notifyTrades(now);
		const fresh2 = this.core.scores.filter((s) => !this.journaled.has(s.id));
		if (fresh2.length) {
			for (const s of fresh2) this.journaled.add(s.id);
			await d.journal(fresh2.map((s) => ({
				type: "score",
				...s
			})));
		}
		if (now - this.lastPersist > 5e3 || cmds.length) {
			this.lastPersist = now;
			await d.persist(this.core, this.meta);
		}
	}
	pendingSpot = null;
	eligible() {
		const s = summarize(this.core, this.deps.now(), STARTING_CASH);
		return evaluateGate(s, this.core.risk.drawdownLimit, DEFAULT_GATE).eligible;
	}
	async mirrorLive(now) {
		const live = this.core.live;
		if (live.status === "off" || !live.auto) return;
		for (const sig of this.core.signals) {
			if (sig.status !== "executed" || sig.kind !== "live") continue;
			if (live.armedAt && sig.createdAt < live.armedAt) continue;
			if (now - sig.createdAt > 2e4) continue;
			if (this.core.live.orders.some((o) => o.signalId === sig.id)) continue;
			await this.sendLive(sig, now);
		}
	}
	async sendLive(sig, now) {
		const market = findMarket(this.core, sig.marketId);
		const decision = planLiveOrder(this.core, this.core.live, sig, market, {
			now,
			eligible: this.eligible()
		});
		if ("refused" in decision) {
			this.meta.lastCommandNote = `Live skipped: ${decision.refused}`;
			this.core = {
				...this.core,
				audit: withAudit(this.core.audit, {
					id: uid("audit"),
					at: now,
					actor: "system",
					action: "Live skipped",
					detail: `${sig.question}: ${decision.refused}`
				})
			};
			return;
		}
		try {
			const sdk = await this.deps.getSdk();
			const order = await submitLive(sdk, this.core.live, sig, market, decision.plan, now);
			const book = {
				...this.core.live,
				orders: [order, ...this.core.live.orders].slice(0, 300)
			};
			this.core = {
				...this.core,
				live: book,
				audit: withAudit(this.core.audit, {
					id: uid("audit"),
					at: now,
					actor: "system",
					action: order.status === "dry" ? "Live dry run" : order.status === "open" ? "Live order posted" : `Live order ${order.status}`,
					detail: `${sig.side.toUpperCase()} ${order.size} @ ${order.price} · ${order.note}`
				})
			};
			await this.deps.journal([{
				type: "live-order",
				...order
			}]);
			if (order.status !== "dry") this.deps.notify?.(`Helios live order ${order.status}: ${sig.side.toUpperCase()} ${order.size} @ ${order.price} on ${market?.question ?? ""}. ${order.note}`);
		} catch (e) {
			this.core = {
				...this.core,
				live: {
					...this.core.live,
					lastError: e instanceof Error ? e.message.slice(0, 200) : "live submit failed"
				}
			};
		}
	}
	async apply(cmd) {
		const now = this.deps.now();
		const env = this.deps.liveEnv();
		switch (cmd.type) {
			case "setKilled":
				this.core = killCore(this.core, cmd.on, now);
				if (cmd.on && env.hasKey) try {
					const sdk = await this.deps.getSdk();
					this.core = {
						...this.core,
						live: await cancelAllLive(sdk, this.core.live, now)
					};
				} catch {}
				return;
			case "liveSetStatus": {
				const live = this.core.live;
				const deny = (why) => {
					this.meta.lastCommandNote = why;
					this.core = {
						...this.core,
						audit: withAudit(this.core.audit, {
							id: uid("audit"),
							at: now,
							actor: "owner",
							action: "Live change refused",
							detail: why
						})
					};
				};
				if (cmd.status === "off") {
					this.core = {
						...this.core,
						live: {
							...live,
							status: "off",
							armedAt: null,
							auto: false
						},
						audit: withAudit(this.core.audit, {
							id: uid("audit"),
							at: now,
							actor: "owner",
							action: "Live off",
							detail: "Live trading turned off. Resting live orders are cancelled on the next reconcile."
						})
					};
					return;
				}
				if (this.core.killed) return deny("Release the kill switch first");
				if (!env.enabled || !env.hasKey || !env.hasFunder) return deny("Live env is not configured (HELIOS_LIVE_ENABLED, POLY_PRIVATE_KEY, POLY_FUNDER_ADDRESS)");
				if (cmd.status === "armed") {
					if (!envReady(env)) return deny("HELIOS_OWNER_TOKEN must be set to arm live");
					if (cmd.confirm !== "I understand this trades real money") return deny("Confirmation phrase did not match");
					if (!this.eligible()) return deny("The paper trial has not passed the live gate");
				}
				this.core = {
					...this.core,
					live: {
						...live,
						status: cmd.status,
						armedAt: now,
						auto: cmd.status === "armed" ? live.auto : false
					},
					audit: withAudit(this.core.audit, {
						id: uid("audit"),
						at: now,
						actor: "owner",
						action: cmd.status === "armed" ? "Live ARMED" : "Live dry-run on",
						detail: cmd.status === "armed" ? `Real orders may be posted inside caps: $${live.maxStake}/order, $${live.maxExposure} open, $${live.dailyLossLimit}/day.` : "Orders are built and signed but never posted."
					})
				};
				return;
			}
			case "liveUpdate": {
				const live = this.core.live;
				const clamp = (v, cur, ceil) => v == null || !Number.isFinite(v) ? cur : Math.min(ceil, Math.max(1, v));
				this.core = {
					...this.core,
					live: {
						...live,
						auto: cmd.auto == null ? live.auto : live.status === "off" ? false : cmd.auto,
						maxStake: clamp(cmd.maxStake, live.maxStake, LIVE_CEILING.maxStake),
						maxExposure: clamp(cmd.maxExposure, live.maxExposure, LIVE_CEILING.maxExposure),
						dailyLossLimit: clamp(cmd.dailyLossLimit, live.dailyLossLimit, LIVE_CEILING.dailyLossLimit)
					},
					audit: withAudit(this.core.audit, {
						id: uid("audit"),
						at: now,
						actor: "owner",
						action: "Live limits updated",
						detail: "Caps are clamped to hard ceilings."
					})
				};
				return;
			}
			case "liveSend": {
				let sig = this.core.signals.find((s) => s.id === cmd.signalId);
				if (!sig) return;
				if (sig.status === "pending") {
					this.core = applyCommand(this.core, {
						type: "approve",
						signalId: sig.id
					}, now);
					sig = this.core.signals.find((s) => s.id === cmd.signalId);
				}
				if (sig && sig.status === "executed") await this.sendLive(sig, now);
				return;
			}
			case "resetTrial":
				this.journaled.clear();
				this.core = applyCommand(this.core, cmd, now);
				return;
			default:
				this.core = applyCommand(this.core, cmd, now);
				this.core = {
					...this.core,
					live: liveDayRoll(this.core.live, now)
				};
		}
	}
};
/**
* Hub: one DeskRunner per user, sharing a single set of market-data fetches.
* Secrets are decrypted only here, in the worker's memory, and handed to the exchange SDK.
*/
function cached(ttlMs, fn, now, keyOf = () => "") {
	const m = /* @__PURE__ */ new Map();
	return (...a) => {
		const k = keyOf(...a);
		const hit = m.get(k);
		if (hit && now() - hit.at < ttlMs) return hit.p;
		const p = fn(...a);
		m.set(k, {
			at: now(),
			p
		});
		p.catch(() => m.delete(k));
		if (m.size > 200) m.delete(m.keys().next().value);
		return p;
	};
}
async function sendWebhook(url, text, last, now = Date.now()) {
	if (!url || !/^https:\/\//.test(url) || now - last.at < 1e4) return;
	last.at = now;
	try {
		if (/^https:\/\/([a-z0-9-]+\.)*ntfy\.sh\//i.test(url)) {
			await fetch(url, {
				method: "POST",
				headers: { title: "Helios" },
				body: text.slice(0, 1800),
				signal: AbortSignal.timeout(5e3)
			});
			return;
		}
		await fetch(url, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				content: text.slice(0, 1800),
				text: text.slice(0, 1800)
			}),
			signal: AbortSignal.timeout(5e3)
		});
	} catch {}
}
var Hub = class Hub {
	tenants = /* @__PURE__ */ new Map();
	lastScan = 0;
	store;
	env;
	shared;
	constructor(store, env = process.env, now = Date.now) {
		this.store = store;
		this.env = env;
		this.now = now;
		this.shared = {
			loadTape: cached(5500, loadTape, now),
			fetchQuotes: cached(2e3, fetchQuotes, now, (ids) => [...ids].sort().join(",")),
			fetchResolutions: cached(15e3, fetchResolutions, now, (ids) => [...ids].sort().join(",")),
			fetchSpotAt: cached(6e4, fetchSpotAt, now, (ts) => String(Math.floor(ts / 6e4)))
		};
	}
	now;
	ctxCache = /* @__PURE__ */ new Map();
	context(secrets) {
		const key = secrets.worldMonitorKey ?? "";
		const hit = this.ctxCache.get(key);
		if (hit && this.now() - hit.at < 11e4) return hit.p;
		const p = loadContext({
			worldMonitorKey: key || void 0,
			worldMonitorBase: this.env.WORLDMONITOR_BASE_URL?.trim() || void 0,
			tiltEnabled: this.env.HELIOS_CTX_TILT === "1"
		});
		this.ctxCache.set(key, {
			at: this.now(),
			p
		});
		return p;
	}
	/** Per-user process env handed to the exchange SDK. Never logged. */
	static sdkEnv(base, s) {
		return {
			...base,
			POLY_PRIVATE_KEY: s.polyPrivateKey,
			POLY_FUNDER_ADDRESS: s.polyFunder,
			POLY_SIGNATURE_TYPE: String(s.polySignatureType ?? 2),
			POLY_API_KEY: s.polyApiKey,
			POLY_API_SECRET: s.polyApiSecret,
			POLY_API_PASSPHRASE: s.polyApiPassphrase
		};
	}
	async spawn(id) {
		const dir = this.store.userDir(id);
		const secrets = await this.store.loadSecrets(id);
		const prior = await readSnapshot(dir);
		const tenant = {
			id,
			runner: null,
			secrets,
			secretsMtime: await this.mtime(dir),
			writes: 0
		};
		const webhookGate = { at: 0 };
		const t = () => tenant.secrets;
		tenant.runner = new DeskRunner({
			now: this.now,
			loadTape: this.shared.loadTape,
			fetchQuotes: this.shared.fetchQuotes,
			fetchResolutions: this.shared.fetchResolutions,
			fetchSpotAt: this.shared.fetchSpotAt,
			loadContext: () => this.context(t()),
			getSdk: () => loadSdk(Hub.sdkEnv(this.env, t())),
			liveEnv: () => ({
				enabled: this.env.HELIOS_LIVE_ENABLED === "1",
				hasKey: Boolean(t().polyPrivateKey),
				hasFunder: Boolean(t().polyFunder),
				hasOwnerToken: true
			}),
			persist: async (core, meta) => {
				tenant.writes += 1;
				if (tenant.writes % 120 === 1) await backupSnapshot(dir);
				const e = {
					enabled: this.env.HELIOS_LIVE_ENABLED === "1",
					hasKey: Boolean(t().polyPrivateKey),
					hasFunder: Boolean(t().polyFunder),
					hasOwnerToken: true
				};
				await writeSnapshot(dir, {
					core,
					heartbeat: this.now(),
					workerStartedAt: meta.workerStartedAt,
					workerVersion: WORKER_VERSION,
					tapeAt: meta.tapeAt,
					quotesAt: meta.quotesAt,
					feedError: meta.feedError,
					liveEnv: e,
					lastCommandNote: meta.lastCommandNote
				});
			},
			journal: (rows) => appendJournal(dir, rows),
			drainCommands: () => drainCommands(dir),
			takeRestore: () => takeRestore(dir),
			notify: (text) => void sendWebhook(t().webhookUrl, text, webhookGate, this.now())
		}, prior?.core);
		await tenant.runner.init();
		return tenant;
	}
	async mtime(dir) {
		try {
			return (await stat(join(dir, "secrets.enc"))).mtimeMs;
		} catch {
			return 0;
		}
	}
	async step() {
		const now = this.now();
		if (now - this.lastScan > 5e3) {
			this.lastScan = now;
			const ids = await this.store.listUserIds();
			for (const id of ids) {
				const cur = this.tenants.get(id);
				if (!cur) {
					this.tenants.set(id, await this.spawn(id));
					continue;
				}
				const m = await this.mtime(this.store.userDir(id));
				if (m !== cur.secretsMtime) {
					cur.secrets = await this.store.loadSecrets(id);
					cur.secretsMtime = m;
				}
			}
			for (const id of [...this.tenants.keys()]) if (!ids.includes(id)) this.tenants.delete(id);
		}
		await Promise.all([...this.tenants.values()].map((t) => t.runner.step().catch((e) => console.error(`[helios-worker] ${t.id} step failed:`, e instanceof Error ? e.message : e))));
	}
	/** Final snapshot with heartbeat 0 so the UI shows "offline" immediately. */
	async shutdown() {
		for (const t of this.tenants.values()) {
			const dir = this.store.userDir(t.id);
			await writeSnapshot(dir, {
				core: t.runner.core,
				heartbeat: 0,
				workerStartedAt: t.runner.meta.workerStartedAt,
				workerVersion: WORKER_VERSION,
				tapeAt: t.runner.meta.tapeAt,
				quotesAt: t.runner.meta.quotesAt,
				feedError: t.runner.meta.feedError,
				liveEnv: {
					enabled: false,
					hasKey: false,
					hasFunder: false,
					hasOwnerToken: true
				},
				lastCommandNote: "stopped"
			}).catch(() => {});
		}
	}
	get size() {
		return this.tenants.size;
	}
};
//#endregion
export { Hub };
