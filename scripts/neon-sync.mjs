/**
 * Durable storage on Postgres (Neon) for hosts with no persistent disk (Render free/starter without a Disk, etc.).
 *
 * How it works: the app keeps using plain files in HELIOS_DATA_DIR (fast, live). This module
 *   1. at boot, restores any files that are missing locally from Postgres, and
 *   2. while running, copies changed files up: accounts/sessions/keys within ~10 seconds, the desk state
 *      on a slow schedule (default every 15 minutes) and once more on shutdown.
 *
 * The slow schedule is deliberate. Neon's free plan has 100 compute-hours a month and sleeps after 5 idle minutes,
 * so writing every few seconds would keep it awake all month and use the quota up.
 *
 * Env: HELIOS_DATABASE_URL (or DATABASE_URL), HELIOS_CHECKPOINT_MIN (default 15), HELIOS_DB=files to disable.
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import pg from "pg";

const FAST = [/^users\.json$/, /^sessions\.json$/, /^users\/[0-9a-f]+\/secrets\.enc$/];
const SLOW = [/^users\/[0-9a-f]+\/desk\.json$/, /^users\/[0-9a-f]+\/desk\.bak\.json$/, /^history\/report\.json$/];

export function databaseUrl(env = process.env) {
  if (env.HELIOS_DB === "files") return null;
  const raw = (env.HELIOS_DATABASE_URL || env.DATABASE_URL || "").trim();
  return raw || null;
}

async function withClient(url, fn) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 20_000, statement_timeout: 30_000 });
    try {
      await client.connect(); // first connect after idle wakes Neon, which can take a few seconds
      try {
        return await fn(client);
      } finally {
        await client.end().catch(() => {});
      }
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
  throw lastErr;
}

const INIT = `create table if not exists helios_files (
  path text primary key,
  content bytea not null,
  sha text not null,
  updated_at timestamptz not null default now()
)`;

async function walk(root, rel = "") {
  const out = [];
  let entries = [];
  try {
    entries = await readdir(join(root, rel), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (e.name === "commands" || e.name === "node_modules") continue;
      out.push(...(await walk(root, r)));
    } else if ([...FAST, ...SLOW].some((re) => re.test(r))) out.push(r);
  }
  return out;
}

/** Copy anything Postgres has that this machine lacks. Returns how many files were restored. */
export async function restore(root, url, log = console.log) {
  let restored = 0;
  await withClient(url, async (c) => {
    await c.query(INIT);
    const { rows } = await c.query("select path, content from helios_files");
    for (const row of rows) {
      const target = join(root, row.path);
      if (row.path.includes("..")) continue;
      try {
        await stat(target);
      } catch {
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, row.content, { mode: 0o600 });
        restored += 1;
      }
    }
  });
  log(`[neon-sync] restored ${restored} file(s) from Postgres`);
  return restored;
}

export function startSync(root, url, { log = console.log, slowEveryMs = 15 * 60_000 } = {}) {
  const seen = new Map(); // path -> sha already uploaded
  let busy = false;
  let lastSlow = 0;
  let stopped = false;

  async function flush(includeSlow) {
    if (busy) return;
    busy = true;
    try {
      const files = await walk(root);
      const todo = [];
      for (const rel of files) {
        if (!includeSlow && !FAST.some((re) => re.test(rel))) continue;
        let buf;
        try {
          buf = await readFile(join(root, rel));
        } catch {
          continue;
        }
        const sha = createHash("sha256").update(buf).digest("hex");
        if (seen.get(rel) !== sha) todo.push([rel, buf, sha]);
      }
      // removals: an account that was deleted locally must not come back after a restart
      const present = new Set(files);
      let remote = null;
      if (includeSlow || todo.length) {
        await withClient(url, async (c) => {
          await c.query(INIT);
          for (const [rel, buf, sha] of todo) {
            await c.query(
              "insert into helios_files (path, content, sha, updated_at) values ($1,$2,$3,now()) on conflict (path) do update set content = excluded.content, sha = excluded.sha, updated_at = now()",
              [rel, buf, sha],
            );
            seen.set(rel, sha);
          }
          remote = (await c.query("select path from helios_files where updated_at < now() - interval '2 minutes'")).rows.map((r) => r.path);
          const gone = remote.filter((p) => !present.has(p));
          for (const p of gone) {
            await c.query("delete from helios_files where path = $1", [p]);
            seen.delete(p);
          }
        });
        if (todo.length) log(`[neon-sync] saved ${todo.length} file(s)`);
      }
    } catch (err) {
      log(`[neon-sync] save failed (will retry): ${err instanceof Error ? err.message : err}`);
    } finally {
      busy = false;
    }
  }

  const fast = setInterval(() => {
    if (stopped) return;
    const slow = Date.now() - lastSlow >= slowEveryMs;
    if (slow) lastSlow = Date.now();
    void flush(slow);
  }, 10_000);
  fast.unref?.();

  return {
    /** Final full save, used on shutdown. */
    async stop() {
      stopped = true;
      clearInterval(fast);
      while (busy) await new Promise((r) => setTimeout(r, 200));
      await flush(true);
    },
  };
}
