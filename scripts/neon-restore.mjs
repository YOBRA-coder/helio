/**
 * npm run neon:restore: one-time copy of everything saved in Postgres (accounts, sessions, encrypted keys, desk) into HELIOS_DATA_DIR.
 * Use it when moving from a host that used HELIOS_DATABASE_URL (Render + Neon) to a VPS that keeps its data on disk.
 * Keep HELIOS_MASTER_KEY identical, or the saved keys cannot be decrypted.
 */
import { databaseUrl, restore } from "./neon-sync.mjs";

const url = databaseUrl();
if (!url) {
  console.error("Set HELIOS_DATABASE_URL to the same Postgres connection string the old host used.");
  process.exit(1);
}
const dir = process.env.HELIOS_DATA_DIR || "./data";
await restore(dir, url);
console.log(`Restored into ${dir}. Start the web app and worker now.`);
