/**
 * Hub: one DeskRunner per user, sharing a single set of market-data fetches.
 * Secrets are decrypted only here, in the worker's memory, and handed to the exchange SDK.
 */
import { join } from "node:path";
import { AccountStore, type UserSecrets } from "../accounts/store.ts";
import { appendJournal, backupSnapshot, drainCommands, readSnapshot, takeRestore, writeSnapshot } from "./desk-io.ts";
import { loadContext } from "./context.ts";
import { MultiFeed, venuesFromEnv, type PriceFeed } from "./feed.ts";
import { BookFeed } from "./book-feed.ts";
import { loadSdk } from "./live.ts";
import { DeskRunner, WORKER_VERSION } from "./runner.ts";
import { fetchQuotes, fetchResolutions, fetchSpotAt, loadTape } from "./tape-fetch.ts";
import type { ContextSnapshot } from "./types.ts";
import { stat } from "node:fs/promises";

export function cached<A extends unknown[], R>(ttlMs: number, fn: (...a: A) => Promise<R>, now: () => number, keyOf: (...a: A) => string = () => "") {
  const m = new Map<string, { at: number; p: Promise<R> }>();
  return (...a: A): Promise<R> => {
    const k = keyOf(...a);
    const hit = m.get(k);
    if (hit && now() - hit.at < ttlMs) return hit.p;
    const p = fn(...a);
    m.set(k, { at: now(), p });
    p.catch(() => m.delete(k));
    if (m.size > 200) m.delete(m.keys().next().value as string);
    return p;
  };
}

export async function sendWebhook(url: string | undefined, text: string, last: { at: number }, now = Date.now()) {
  if (!url || !/^https:\/\//.test(url) || now - last.at < 10_000) return;
  last.at = now;
  try {
    if (/^https:\/\/([a-z0-9-]+\.)*ntfy\.sh\//i.test(url)) {
      // ntfy takes the message as a plain-text body and pushes it to the phone app
      await fetch(url, { method: "POST", headers: { title: "Helios" }, body: text.slice(0, 1800), signal: AbortSignal.timeout(5000) });
      return;
    }
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // `content` for Discord, `text` for Slack and compatible endpoints
      body: JSON.stringify({ content: text.slice(0, 1800), text: text.slice(0, 1800) }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* alerts are best effort */
  }
}

interface Tenant {
  id: string;
  runner: DeskRunner;
  secrets: UserSecrets;
  secretsMtime: number;
  writes: number;
}

export class Hub {
  private tenants = new Map<string, Tenant>();
  private lastScan = 0;
  private store: AccountStore;
  private env: Record<string, string | undefined>;
  private shared;
  /** live BTC sockets (Coinbase, Binance, Kraken) shared by every desk; optional (HELIOS_WS_FEED=0 turns it off) */
  readonly feed: PriceFeed | null;
  /** Polymarket order-book websocket shared by every desk; the REST poll is the fallback (HELIOS_BOOK_WS=0 turns it off) */
  readonly book: BookFeed | null;

  constructor(store: AccountStore, env: Record<string, string | undefined> = process.env, now: () => number = Date.now) {
    this.store = store;
    this.env = env;
    this.now = now;
    this.feed = env.HELIOS_WS_FEED === "0" ? null : new MultiFeed({ now, venues: venuesFromEnv(env.HELIOS_FEED_VENUES) });
    this.book = env.HELIOS_BOOK_WS === "0" ? null : new BookFeed({ now });
    this.shared = {
      loadTape: cached(5_500, loadTape, now),
      fetchQuotes: cached(2_000, fetchQuotes, now, (ids: string[]) => [...ids].sort().join(",")),
      fetchResolutions: cached(15_000, fetchResolutions, now, (ids: string[]) => [...ids].sort().join(",")),
      fetchSpotAt: cached(60_000, fetchSpotAt, now, (ts: number) => String(Math.floor(ts / 60_000))),
    };
  }
  private now: () => number;
  private ctxCache = new Map<string, { at: number; p: Promise<ContextSnapshot> }>();

  private context(secrets: UserSecrets) {
    const key = secrets.worldMonitorKey ?? "";
    const hit = this.ctxCache.get(key);
    if (hit && this.now() - hit.at < 110_000) return hit.p;
    const p = loadContext({
      worldMonitorKey: key || undefined,
      worldMonitorBase: this.env.WORLDMONITOR_BASE_URL?.trim() || undefined,
      tiltEnabled: this.env.HELIOS_CTX_TILT === "1",
    });
    this.ctxCache.set(key, { at: this.now(), p });
    return p;
  }

  /** Per-user process env handed to the exchange SDK. Never logged. */
  static sdkEnv(base: Record<string, string | undefined>, s: UserSecrets): Record<string, string | undefined> {
    return {
      ...base,
      POLY_PRIVATE_KEY: s.polyPrivateKey,
      POLY_FUNDER_ADDRESS: s.polyFunder,
      POLY_SIGNATURE_TYPE: String(s.polySignatureType ?? 2),
      POLY_API_KEY: s.polyApiKey,
      POLY_API_SECRET: s.polyApiSecret,
      POLY_API_PASSPHRASE: s.polyApiPassphrase,
    };
  }

  private async spawn(id: string): Promise<Tenant> {
    const dir = this.store.userDir(id);
    const secrets = await this.store.loadSecrets(id);
    const prior = await readSnapshot(dir);
    const tenant: Tenant = { id, runner: null as unknown as DeskRunner, secrets, secretsMtime: await this.mtime(dir), writes: 0 };
    const webhookGate = { at: 0 };
    const t = () => tenant.secrets;
    tenant.runner = new DeskRunner(
      {
        now: this.now,
        loadTape: this.shared.loadTape,
        fetchQuotes: this.shared.fetchQuotes,
        fetchResolutions: this.shared.fetchResolutions,
        fetchSpotAt: this.shared.fetchSpotAt,
        liveSpot: () => this.feed?.latest() ?? null,
        spotAt: this.feed?.at ? (ts: number) => this.feed?.at?.(ts) ?? null : undefined,
        feedGuard: this.feed
          ? (now: number) => {
              const f = this.feed as PriceFeed;
              return { p15: f.at?.(now - 15_000) ?? null, spreadBp: f.spreadBp?.() ?? null, venues: f.status().venues?.filter((v) => v.used).length ?? 1 };
            }
          : undefined,
        watchBook: this.book ? (ids: string[]) => this.watchBook(id, ids) : undefined,
        bookQuotes: this.book ? (ids: string[]) => (this.book?.healthy() ? this.book.quotes(ids) : null) : undefined,
        loadContext: () => this.context(t()),
        getSdk: () => loadSdk(Hub.sdkEnv(this.env, t())),
        liveEnv: () => ({
          enabled: this.env.HELIOS_LIVE_ENABLED === "1",
          hasKey: Boolean(t().polyPrivateKey),
          hasFunder: Boolean(t().polyFunder),
          // the authenticated session is the owner check in multi-user mode
          hasOwnerToken: true,
        }),
        persist: async (core, meta) => {
          tenant.writes += 1;
          if (tenant.writes % 120 === 1) await backupSnapshot(dir);
          const e = { enabled: this.env.HELIOS_LIVE_ENABLED === "1", hasKey: Boolean(t().polyPrivateKey), hasFunder: Boolean(t().polyFunder), hasOwnerToken: true };
          await writeSnapshot(dir, {
            core,
            heartbeat: this.now(),
            workerStartedAt: meta.workerStartedAt,
            workerVersion: WORKER_VERSION,
            tapeAt: meta.tapeAt,
            quotesAt: meta.quotesAt,
            feedError: meta.feedError,
            liveEnv: e,
            lastCommandNote: meta.lastCommandNote,
            health: {
              venues: (this.feed?.status().venues ?? []).map((v) => ({ name: v.name, state: v.state, used: v.used, ageMs: v.lastTickAt ? this.now() - v.lastTickAt : null })),
              book: this.book ? (({ state, tokens, quotes }) => ({ state, tokens, quotes }))(this.book.status()) : null,
            },
          });
        },
        journal: (rows) => appendJournal(dir, rows),
        drainCommands: () => drainCommands(dir),
        takeRestore: () => takeRestore(dir),
        notify: (text) => void sendWebhook(t().webhookUrl, text, webhookGate, this.now()),
      },
      prior?.core,
    );
    await tenant.runner.init();
    return tenant;
  }

  /** each desk reports the tokens it follows; the one book socket follows the union */
  private wanted = new Map<string, string[]>();
  private watchBook(tenantId: string, ids: string[]) {
    this.wanted.set(tenantId, ids);
  }
  private lastAssets = "";
  private syncBookAssets() {
    if (!this.book) return;
    const all = [...new Set([...this.wanted.values()].flat())].sort();
    const key = all.join(",");
    if (key === this.lastAssets) return;
    this.lastAssets = key;
    this.book.setAssets(all);
  }

  private async mtime(dir: string) {
    try {
      return (await stat(join(dir, "secrets.enc"))).mtimeMs;
    } catch {
      return 0;
    }
  }

  async step() {
    const now = this.now();
    this.feed?.start(); // idempotent
    this.book?.start();
    this.syncBookAssets();
    if (now - this.lastScan > 5_000) {
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
      for (const id of [...this.tenants.keys()]) {
        if (ids.includes(id)) continue;
        this.tenants.delete(id);
        this.wanted.delete(id);
      }
    }
    await Promise.all(
      [...this.tenants.values()].map((t) =>
        t.runner.step().catch((e) => console.error(`[helios-worker] ${t.id} step failed:`, e instanceof Error ? e.message : e)),
      ),
    );
  }

  /** Final snapshot with heartbeat 0 so the UI shows "offline" immediately. */
  async shutdown() {
    this.feed?.stop();
    this.book?.stop();
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
        liveEnv: { enabled: false, hasKey: false, hasFunder: false, hasOwnerToken: true },
        lastCommandNote: "stopped",
      }).catch(() => {});
    }
  }

  get size() {
    return this.tenants.size;
  }
}
