/**
 * Helios desk worker: runs every user's paper trial (and live section) 24/7.
 *   npm run worker
 */
import { AccountStore } from "../src/lib/accounts/store.ts";
import { hasMasterKey } from "../src/lib/accounts/crypto.ts";
import { dataDir } from "../src/lib/trading/desk-io.ts";
import { Hub } from "../src/lib/trading/hub.ts";

const root = dataDir();
const env = process.env;
const hub = new Hub(new AccountStore(root, env), env);

console.log(`[helios-worker] started · data dir ${root}`);
console.log(`[helios-worker] master key: ${hasMasterKey(env) ? "set (user secrets can be stored)" : "NOT set (users cannot save exchange keys)"}`);
console.log(`[helios-worker] live trading globally ${env.HELIOS_LIVE_ENABLED === "1" ? "ENABLED" : "disabled"}`);

let stopping = false;
let lastOk = Date.now();
// Watchdog: if a step hangs (a stuck network call, a database stall) the worker exits, and the launcher restarts the container.
const STALL_MS = 120_000;
setInterval(() => {
  if (!stopping && Date.now() - lastOk > STALL_MS) {
    console.error(`[helios-worker] no completed step for ${Math.round((Date.now() - lastOk) / 1000)}s: exiting so the host restarts it`);
    process.exit(1);
  }
}, 15_000);

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`step timed out after ${ms}ms`)), ms);
    p.then((v) => (clearTimeout(t), resolve(v)), (e) => (clearTimeout(t), reject(e)));
  });
}

async function loop() {
  let last = 0;
  while (!stopping) {
    const t0 = Date.now();
    try {
      await withTimeout(hub.step(), 45_000);
      lastOk = Date.now();
      if (t0 - last > 60_000) {
        last = t0;
        console.log(`[helios-worker] ${hub.size} desk(s) running`);
      }
    } catch (err) {
      console.error("[helios-worker] hub step failed:", err instanceof Error ? err.message : err);
    }
    await new Promise((r) => setTimeout(r, Math.max(50, 1000 - (Date.now() - t0))));
  }
}

async function shutdown() {
  if (stopping) return;
  stopping = true;
  await hub.shutdown();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
await loop();
