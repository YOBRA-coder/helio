/**
 * Real-data backtest from the command line.
 *   npm run backtest -- --days 7 --max 400
 * Needs outbound internet (Polymarket gamma/clob and Coinbase). Prints the report; saves it where the Lab page reads it.
 */
import { runJob } from "../src/lib/trading/backtest-job.ts";

const arg = (name: string, d: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) || d : d;
};
const days = arg("days", 7);
const max = arg("max", 400);
const groupsArg = process.argv.indexOf("--groups");
const groups = groupsArg > 0 ? process.argv[groupsArg + 1].split(",") : undefined;

const t = setInterval(() => {}, 1 << 30);
const report = await runJob({ days, maxPerSeries: max, groups, useCache: !process.argv.includes("--fresh") });
clearInterval(t);
const f = (n: number) => (n >= 0 ? "+" : "-") + "$" + Math.abs(n).toFixed(2);
console.log(`\nWindows used: ${report.marketsUsed} (skipped ${report.marketsSkipped})  ·  chosen ${JSON.stringify(report.chosen)}`);
for (const p of report.periods) console.log(`${p.name.padEnd(11)} trades ${String(p.trades).padStart(4)}  win ${(p.winRate * 100).toFixed(1)}%  net ${f(p.netPnl)}  PF ${Number.isFinite(p.profitFactor) ? p.profitFactor.toFixed(2) : "inf"}  maxDD $${p.maxDrawdown.toFixed(2)}`);
if (report.brier) console.log(`Brier  model ${report.brier.model.toFixed(4)}  market ${report.brier.market.toFixed(4)}  (n=${report.brier.n})`);
console.log(`\nVerdict: ${report.verdict}`);
for (const n of report.notes) console.log(`note: ${n}`);
