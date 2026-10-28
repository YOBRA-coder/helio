/**
 * Strategy lab CLI: old vs new strategy in a synthetic BTC Up/Down world, swept over how slow the crowd is.
 *   npm run lab:strategy -- --windows 3000 --len 300 --seeds 4
 * No network needed. See src/lib/trading/simlab.ts for what this does and does not prove.
 */
import { runSim, type StrategyId } from "../src/lib/trading/simlab.ts";

const arg = (name: string, d: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) || d : d;
};
const windows = arg("windows", 3000);
const len = arg("len", 300);
const seeds = arg("seeds", 4);
const lags = (process.argv.includes("--lags") ? process.argv[process.argv.indexOf("--lags") + 1].split(",").map(Number) : [0, 2, 5, 10]);
const feedSec = arg("feed", 6);
const strategies: StrategyId[] = process.argv.includes("--only") ? [process.argv[process.argv.indexOf("--only") + 1] as StrategyId] : ["legacy", "closer"];
const money = (n: number) => (n >= 0 ? "+" : "-") + "$" + Math.abs(n).toFixed(0);

console.log(`Synthetic ${len / 60}-minute windows: ${windows} per seed x ${seeds} seeds. Crowd lag = how many seconds the Polymarket price trails Coinbase. Helios reads BTC every ${feedSec}s.\n`);
console.log("strategy  lag  trades/100w  win%   avg px  net P&L   PF    avgWin avgLoss  maxDD   Brier model/market");
for (const lag of lags) {
  for (const strategy of strategies) {
    let trades = 0, wins = 0, net = 0, gw = 0, gl = 0, dd = 0, px = 0, bm = 0, bk = 0, aw = 0, al = 0;
    for (let s = 0; s < seeds; s += 1) {
      const r = runSim({ windows, lenSec: len, lagSec: lag, strategy, feedSec, seed: 11 + s * 101 });
      const sm = r.summary;
      trades += sm.trades; wins += sm.wins; net += sm.netPnl; dd = Math.max(dd, sm.maxDrawdown);
      px += sm.avgPrice * sm.trades; bm += sm.brierModel * sm.trades; bk += sm.brierMarket * sm.trades;
      gw += sm.avgWin * sm.wins; gl += Math.abs(sm.avgLoss) * sm.losses; aw += sm.avgWin * sm.wins; al += Math.abs(sm.avgLoss) * sm.losses;
    }
    const losses = trades - wins;
    console.log(
      `${strategy.padEnd(9)} ${String(lag).padStart(3)}s ${((trades / (windows * seeds)) * 100).toFixed(1).padStart(10)}  ${trades ? ((wins / trades) * 100).toFixed(1).padStart(5) : "  n/a"}  ${trades ? (px / trades).toFixed(2).padStart(6) : "   n/a"}  ${money(net / seeds).padStart(7)}  ${gl > 0 ? (gw / gl).toFixed(2).padStart(4) : " n/a"}  ${wins ? ("$" + (aw / wins).toFixed(2)).padStart(7) : "    n/a"} ${losses ? ("$" + (al / losses).toFixed(2)).padStart(7) : "    n/a"}  ${("$" + dd.toFixed(0)).padStart(5)}   ${trades ? (bm / trades).toFixed(3) : "n/a"}/${trades ? (bk / trades).toFixed(3) : "n/a"}`,
    );
  }
}
console.log("\nnet P&L is per seed (one run of the windows above, starting from $10,000, max stake $80).");
