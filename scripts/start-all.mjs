/**
 * One-container launcher for hosts that run a single process per service (Render, Railway, Fly...).
 * Starts the web server and the desk worker side by side. If either dies the container exits,
 * so the platform restarts both together.
 */
import { spawn } from "node:child_process";
import { databaseUrl, restore, startSync } from "./neon-sync.mjs";

const env = { ...process.env, HELIOS_DATA_DIR: process.env.HELIOS_DATA_DIR || "/data" };
const dbUrl = databaseUrl(env);
let sync = null;
if (dbUrl) {
  console.log("[start-all] Postgres storage is on: restoring saved data, then saving changes in the background");
  try {
    await restore(env.HELIOS_DATA_DIR, dbUrl);
  } catch (err) {
    console.error(`[start-all] could not reach Postgres, starting with local files only: ${err instanceof Error ? err.message : err}`);
  }
  sync = startSync(env.HELIOS_DATA_DIR, dbUrl, { slowEveryMs: Math.max(1, Number(env.HELIOS_CHECKPOINT_MIN) || 15) * 60_000 });
} else {
  console.log("[start-all] no database URL set: data lives only in HELIOS_DATA_DIR (needs a persistent disk)");
}

const procs = [
  ["web", ["node", [".output/server/index.mjs"]]],
  ["worker", ["node", ["--experimental-strip-types", "--no-warnings", "worker/desk-worker.ts"]]],
].map(([name, [cmd, args]]) => {
  const child = spawn(cmd, args, { env, stdio: "inherit" });
  child.on("exit", (code, signal) => {
    console.error(`[start-all] ${name} exited (${signal ?? code}); stopping the container so it restarts`);
    shutdown(code ?? 1);
  });
  return child;
});

let closing = false;
function shutdown(code) {
  if (closing) return;
  closing = true;
  for (const p of procs) if (!p.killed) p.kill("SIGTERM");
  // give the worker a moment to write its last state, then save everything to Postgres before exiting
  setTimeout(async () => {
    try {
      await sync?.stop();
    } catch {
      /* best effort */
    }
    process.exit(code);
  }, 3000);
}
process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));

// Render's free web service goes to sleep after 15 minutes without inbound traffic, which also freezes the worker.
// Calling our own public address every 9 minutes counts as traffic and keeps both awake.
const publicUrl = env.RENDER_EXTERNAL_URL || env.HELIOS_PUBLIC_URL;
if (publicUrl && env.HELIOS_KEEPALIVE !== "0") {
  console.log(`[start-all] keep-awake ping on ${publicUrl} every 9 minutes`);
  setInterval(() => {
    fetch(publicUrl, { signal: AbortSignal.timeout(20_000) }).catch((err) => console.error(`[start-all] keep-awake ping failed: ${err instanceof Error ? err.message : err}`));
  }, 9 * 60_000);
}
