/**
 * Live execution on Polymarket's CLOB. Server/worker only. Never imported by the browser bundle.
 *
 * Safety model (every layer must agree before a real order leaves the building):
 *   1. Env: HELIOS_LIVE_ENABLED=1 plus signing key and funder address present.
 *   2. Owner: HELIOS_OWNER_TOKEN set, and the command that arms live carries it plus a typed phrase.
 *   3. Gate: the paper trial must pass `evaluateGate` (days, trades, P&L, Brier, drawdown).
 *   4. Caps: small per-order stake, total live exposure, daily live loss. Independent of paper limits.
 *   5. Kill switch: turning it on disarms live and cancels resting live orders.
 *   6. "dry" status builds and signs the exact order but does not post it. Use it first.
 *
 * This file has been exercised against a mock client only. It has not been run against the real
 * exchange from the build environment (no network, no keys). Run `dry` for a day before arming.
 */
import type { DeskCore, LiveBook, LiveOrder, Market, Signal } from "./types.ts";
import { liveDayRoll, uid } from "./ledger.ts";

import { ARM_PHRASE } from "./live-const.ts";
export { ARM_PHRASE };
export const MIN_ORDER_SHARES = 5;

export interface LiveEnv {
  enabled: boolean;
  hasKey: boolean;
  hasFunder: boolean;
  hasOwnerToken: boolean;
}

export function liveEnv(env: Record<string, string | undefined> = process.env): LiveEnv {
  return {
    enabled: env.HELIOS_LIVE_ENABLED === "1",
    hasKey: Boolean(env.POLY_PRIVATE_KEY?.trim()),
    hasFunder: Boolean(env.POLY_FUNDER_ADDRESS?.trim()),
    hasOwnerToken: Boolean(env.HELIOS_OWNER_TOKEN?.trim()),
  };
}

export function envReady(e: LiveEnv) {
  return e.enabled && e.hasKey && e.hasFunder && e.hasOwnerToken;
}

export interface LivePlan {
  tokenId: string;
  price: number;
  size: number;
  cost: number;
}

/** Round a price up to the tick so a marketable limit stays marketable. */
export function roundUpToTick(price: number, tick: number) {
  const t = tick > 0 ? tick : 0.01;
  return Math.min(0.99, Math.round(Math.ceil(price / t - 1e-9) * t * 1e6) / 1e6);
}

/** Pure risk check + sizing. Returns a plan or the reason it was refused. */
export function planLiveOrder(
  core: Pick<DeskCore, "killed" | "circuitKind">,
  book: LiveBook,
  sig: Signal,
  market: Market | null,
  opts: { now: number; eligible: boolean; tick?: number },
): { plan: LivePlan } | { refused: string } {
  const live = liveDayRoll(book, opts.now);
  if (live.status === "off") return { refused: "Live is off" };
  if (core.killed) return { refused: "Kill switch is on" };
  if (core.circuitKind) return { refused: "A circuit breaker is active" };
  if (live.status === "armed" && !opts.eligible) return { refused: "Paper trial has not passed the live gate" };
  if (!market || market.kind !== "live") return { refused: "Only real Polymarket markets can trade live" };
  if (market.status !== "open" || market.endAt - opts.now < 30_000) return { refused: "Market is closed or about to close" };
  if (!market.metadataOk || market.restricted) return { refused: "Market metadata is ambiguous or restricted" };
  if (market.source !== "Polymarket CLOB") return { refused: "No fresh order book for this market" };
  if (opts.now - market.updatedAt > 15_000) return { refused: "Quote is stale" };
  const tokenId = sig.side === "yes" ? market.yesTokenId : market.noTokenId;
  if (!tokenId) return { refused: "Missing token id for this side" };
  if (live.dayRealized <= -live.dailyLossLimit) return { refused: "Daily live loss limit reached" };
  const dup = live.orders.some((o) => o.signalId === sig.id && o.status !== "rejected" && o.status !== "error");
  if (dup) return { refused: "Signal already sent live" };

  const tick = opts.tick ?? 0.01;
  const price = roundUpToTick(sig.executablePrice, tick);
  if (price < 0.08 || price > 0.92) return { refused: "Price outside the 8¢–92¢ band" };
  const open = live.orders
    .filter((o) => (o.status === "open" || (o.status === "filled" && !o.settled)))
    .reduce((a, o) => a + o.debit, 0);
  const room = live.maxExposure - open;
  const stake = Math.min(live.maxStake, sig.stake, room);
  if (stake <= 0) return { refused: "Live exposure cap reached" };
  const size = Math.floor((stake / price) * 100) / 100;
  if (size < MIN_ORDER_SHARES) return { refused: `Stake too small for the ${MIN_ORDER_SHARES}-share minimum` };
  return { plan: { tokenId, price, size, cost: size * price } };
}

/** Minimal surface of @polymarket/clob-client that Helios uses; lets tests inject a mock. */
export interface ClobLike {
  getTickSize(tokenId: string): Promise<string | number>;
  getNegRisk(tokenId: string): Promise<boolean>;
  createOrder(order: { tokenID: string; price: number; size: number; side: unknown }, opts: { tickSize: string; negRisk: boolean }): Promise<unknown>;
  createAndPostOrder(
    order: { tokenID: string; price: number; size: number; side: unknown },
    opts: { tickSize: string; negRisk: boolean },
    type: unknown,
  ): Promise<{ success?: boolean; orderID?: string; errorMsg?: string; status?: string } & Record<string, unknown>>;
  getOrder(id: string): Promise<{ status: string; size_matched: string; original_size: string; price: string }>;
  cancelOrder(p: { orderID: string }): Promise<unknown>;
  getBalanceAllowance(p: { asset_type: unknown }): Promise<{ balance: string; allowance?: string; allowances?: Record<string, string> }>;
}

export interface ClobSdk {
  client: ClobLike;
  BUY: unknown;
  GTC: unknown;
  COLLATERAL: unknown;
}

const sdkCache = new Map<string, Promise<ClobSdk>>();

export function loadSdk(env: Record<string, string | undefined> = process.env): Promise<ClobSdk> {
  const cacheKey = `${env.POLY_PRIVATE_KEY}|${env.POLY_FUNDER_ADDRESS}|${env.POLY_SIGNATURE_TYPE}`;
  const hit = sdkCache.get(cacheKey);
  if (hit) return hit;
  const made = (async () => {
    const { ClobClient, Side, OrderType, AssetType } = await import("@polymarket/clob-client");
    const { Wallet } = await import("ethers");
    const host = env.POLY_CLOB_HOST || "https://clob.polymarket.com";
    const signer = new Wallet(String(env.POLY_PRIVATE_KEY));
    const sigType = Number(env.POLY_SIGNATURE_TYPE ?? 2);
    const funder = String(env.POLY_FUNDER_ADDRESS);
    let creds;
    if (env.POLY_API_KEY && env.POLY_API_SECRET && env.POLY_API_PASSPHRASE) {
      creds = { key: env.POLY_API_KEY, secret: env.POLY_API_SECRET, passphrase: env.POLY_API_PASSPHRASE };
    } else {
      creds = await new ClobClient(host, 137, signer).createOrDeriveApiKey();
    }
    const client = new ClobClient(host, 137, signer, creds, sigType, funder) as unknown as ClobLike;
    return { client, BUY: Side.BUY, GTC: OrderType.GTC, COLLATERAL: AssetType.COLLATERAL };
  })().catch((e) => {
    sdkCache.delete(cacheKey);
    throw e;
  });
  sdkCache.set(cacheKey, made);
  return made;
}

export interface ConnectionReport {
  ok: boolean;
  balance: number | null;
  allowanceOk: boolean | null;
  messages: string[];
}

/** Preflight: can we authenticate, see a balance, and is the exchange allowed to spend it? */
export async function checkConnection(sdk: ClobSdk): Promise<ConnectionReport> {
  const messages: string[] = [];
  try {
    const bal = await sdk.client.getBalanceAllowance({ asset_type: sdk.COLLATERAL });
    const balance = Number(bal.balance) / 1e6;
    const allowances = bal.allowances ? Object.values(bal.allowances).map(Number) : bal.allowance != null ? [Number(bal.allowance)] : [];
    const allowanceOk = allowances.length ? allowances.some((a) => Number.isFinite(a) && a > 0) : null;
    messages.push(`Authenticated. USDC balance $${Number.isFinite(balance) ? balance.toFixed(2) : "?"}.`);
    if (allowanceOk === false) messages.push("Exchange allowance is zero. Trade once from the Polymarket website (or approve USDC there) so the exchange can spend your balance.");
    if (Number.isFinite(balance) && balance < 5) messages.push("Balance is below one minimum order. Deposit through Polymarket first.");
    return { ok: true, balance: Number.isFinite(balance) ? balance : null, allowanceOk, messages };
  } catch (e) {
    return { ok: false, balance: null, allowanceOk: null, messages: [`Could not authenticate: ${safeError(e)}`] };
  }
}

/** Never put keys in an error that reaches the UI or logs. */
export function safeError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.replace(/0x[a-fA-F0-9]{40,}/g, "0x…").replace(/(secret|passphrase|key)["':= ]+[A-Za-z0-9+/=_-]{8,}/gi, "$1=…").slice(0, 240);
}

export async function submitLive(
  sdk: ClobSdk,
  book: LiveBook,
  sig: Signal,
  market: Market,
  plan: LivePlan,
  now: number,
): Promise<LiveOrder> {
  const dry = book.status === "dry";
  const base: LiveOrder = {
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
    signalId: sig.id,
  };
  try {
    const tickSize = String(await sdk.client.getTickSize(plan.tokenId));
    const negRisk = await sdk.client.getNegRisk(plan.tokenId);
    const order = { tokenID: plan.tokenId, price: plan.price, size: plan.size, side: sdk.BUY };
    if (dry) {
      await sdk.client.createOrder(order, { tickSize, negRisk });
      return { ...base, note: "Dry run: order built and signed, not posted." };
    }
    const resp = await sdk.client.createAndPostOrder(order, { tickSize, negRisk }, sdk.GTC);
    if (resp.success === false || !resp.orderID) {
      return { ...base, status: "rejected", note: safeError(resp.errorMsg || "Exchange rejected the order") };
    }
    return { ...base, exchangeId: resp.orderID, note: `Posted (${resp.status ?? "accepted"})` };
  } catch (e) {
    return { ...base, status: "error", note: safeError(e) };
  }
}

/**
 * Pull exchange state for open live orders; cancel stale ones; settle filled ones when the venue
 * has resolved the market. Returns the updated book. Never throws.
 */
export async function reconcileLive(
  sdk: ClobSdk,
  book: LiveBook,
  resolutions: Record<string, boolean>,
  now: number,
): Promise<LiveBook> {
  let live = liveDayRoll(book, now);
  try {
    const orders: LiveOrder[] = [];
    for (const o of live.orders) {
      if (o.status === "open" && o.exchangeId) {
        const remote = await sdk.client.getOrder(o.exchangeId);
        const matched = Number(remote.size_matched) || 0;
        const original = Number(remote.original_size) || o.size;
        const st = remote.status.toLowerCase();
        if (matched >= original - 1e-9) {
          orders.push({ ...o, status: "filled", filledSize: matched, updatedAt: now });
          continue;
        }
        if (st.includes("cancel") || st.includes("expire")) {
          orders.push({ ...o, status: matched > 0 ? "filled" : "cancelled", filledSize: matched, updatedAt: now });
          continue;
        }
        if (now - o.submittedAt > 60_000) {
          await sdk.client.cancelOrder({ orderID: o.exchangeId });
          orders.push({ ...o, status: matched > 0 ? "filled" : "cancelled", filledSize: matched, updatedAt: now, note: "Cancelled after 60s without a full fill" });
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
      if (verdict === undefined) return o;
      const qty = o.filledSize ?? o.size;
      const payoff = (o.side === "yes") === verdict ? 1 : 0;
      const pnl = qty * payoff - qty * o.price;
      realized += pnl;
      dayRealized += pnl;
      return { ...o, settled: true, pnl, updatedAt: now };
    });
    let exchangeCash: number | null = live.exchangeCash;
    try {
      const bal = await sdk.client.getBalanceAllowance({ asset_type: sdk.COLLATERAL });
      const v = Number(bal.balance) / 1e6;
      if (Number.isFinite(v)) exchangeCash = v;
    } catch {
      /* balance is informational; order state above is what matters */
    }
    live = {
      ...live,
      orders: settled.slice(0, 300),
      realized,
      dayRealized,
      exchangeCash,
      lastReconcileAt: now,
      lastReconcileOk: true,
      lastError: null,
    };
  } catch (e) {
    live = { ...live, lastReconcileAt: now, lastReconcileOk: false, lastError: safeError(e) };
  }
  return live;
}

/** Best-effort cancel of every resting live order (used by the kill switch). */
export async function cancelAllLive(sdk: ClobSdk, book: LiveBook, now: number): Promise<LiveBook> {
  const orders: LiveOrder[] = [];
  for (const o of book.orders) {
    if (o.status === "open" && o.exchangeId) {
      try {
        await sdk.client.cancelOrder({ orderID: o.exchangeId });
        orders.push({ ...o, status: "cancelled", updatedAt: now, note: "Cancelled by kill switch" });
        continue;
      } catch (e) {
        orders.push({ ...o, note: `Cancel failed: ${safeError(e)}`, updatedAt: now });
        continue;
      }
    }
    orders.push(o);
  }
  return { ...book, orders };
}
