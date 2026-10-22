/**
 * Connectivity check for the machine that runs the worker:  npm run doctor
 * Prints which data sources this machine can actually reach, and what the desk would see.
 */
import { fetchSpotAt, getJson, lastOpenError, loadTape } from "../src/lib/trading/tape-fetch.ts";

async function step(name: string, fn: () => Promise<string>) {
  try {
    console.log(`  OK    ${name}: ${await fn()}`);
  } catch (e) {
    console.log(`  FAIL  ${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

console.log("Helios doctor, checking what this machine can reach:\n");
await step("Polymarket gamma (market discovery)", async () => {
  const tape = await loadTape();
  const ud = tape.markets.filter((m) => /up or down/i.test(m.question));
  const sample = ud[0];
  return `${tape.markets.length} markets, ${ud.length} Up/Down${sample ? `, e.g. "${sample.question}" start ${new Date(sample.startAt).toISOString()} end ${new Date(sample.endAt).toISOString()}` : ""}${tape.error ? ` (feed error: ${tape.error})` : ""}`;
});
await step("Polymarket CLOB (order books)", async () => {
  const r = (await getJson("https://clob.polymarket.com/time")) as unknown;
  return `server time ${String(r)}`;
});
await step("Coinbase spot", async () => {
  const r = (await getJson("https://api.exchange.coinbase.com/products/BTC-USD/ticker")) as { price?: string };
  return `BTC ${r.price}`;
});
await step("Window-open price (5 minutes ago, Coinbase → Kraken → Binance)", async () => {
  const ts = Math.floor((Date.now() - 300_000) / 60_000) * 60_000;
  const v = await fetchSpotAt(ts);
  if (v == null) throw new Error(lastOpenError || "no source returned a price");
  return `BTC ${v} at ${new Date(ts).toISOString()}`;
});
await step("Polymarket geoblock (may you trade live from here?)", async () => {
  const r = (await getJson("https://polymarket.com/api/geoblock")) as { blocked?: boolean; country?: string };
  return r.blocked ? `BLOCKED (${r.country}): paper trading works, live orders are refused` : `allowed (${r.country ?? "?"})`;
});
console.log("\nIf a line says FAIL, that source is blocked from this machine (firewall, VPN, DNS, or region). Fix that first.");
