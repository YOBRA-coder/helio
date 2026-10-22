/**
 * One-container launcher for hosts that run a single process per service (Render, Railway, Fly...).
 * Starts the web server and the desk worker side by side. If either dies the container exits,
 * so the platform restarts both together.
 */
import { spawn } from "node:child_process";

const env = { ...process.env, HELIOS_DATA_DIR: process.env.HELIOS_DATA_DIR || "/data" };
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
  setTimeout(() => process.exit(code), 4000).unref();
}
process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));
