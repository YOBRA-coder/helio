/** npm run neon:check: confirms the database URL works and shows what is saved. */
import pg from "pg";
import { databaseUrl } from "./neon-sync.mjs";

const url = databaseUrl();
if (!url) {
  console.log("No HELIOS_DATABASE_URL (or DATABASE_URL) is set.");
  process.exit(1);
}
const c = new pg.Client({ connectionString: url, connectionTimeoutMillis: 20_000 });
try {
  await c.connect();
  await c.query("create table if not exists helios_files (path text primary key, content bytea not null, sha text not null, updated_at timestamptz not null default now())");
  const { rows } = await c.query("select path, length(content) as bytes, updated_at from helios_files order by path");
  console.log(`Connected. ${rows.length} file(s) saved:`);
  for (const r of rows) console.log(`  ${r.path}  ${r.bytes} bytes  ${new Date(r.updated_at).toISOString()}`);
} catch (e) {
  console.log("FAILED:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await c.end().catch(() => {});
}
