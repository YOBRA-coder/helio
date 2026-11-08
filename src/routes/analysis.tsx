import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BlockBreakdown, LiveTape, WindowRadar } from "@/components/analysis";
import { EdgeResultChart, PriceBucketChart } from "@/components/charts";
import { Panel, Shell, Stat } from "@/components/widgets";
import { pct, signedMoney } from "@/lib/trading/format";
import { useDesk } from "@/lib/trading/store";

export const Route = createFileRoute("/analysis")({ component: Analysis });

const BUCKETS: Array<[string, number, number]> = [["≤65¢", 0, 0.65], ["65–75¢", 0.65, 0.75], ["75–85¢", 0.75, 0.85], ["85–92¢", 0.85, 0.92], ["92¢+", 0.92, 1.01]];

function Analysis() {
  const trial = useDesk((s) => s.trial);
  const signals = useDesk((s) => s.signals);
  const sum = trial?.summary ?? null;
  const recent = useMemo(() => (trial?.recent ?? []).filter((r) => r.kind === "live"), [trial?.recent]);
  const buckets = useMemo(
    () =>
      BUCKETS.map(([label, lo, hi]) => {
        const rows = recent.filter((r) => r.entryPrice >= lo && r.entryPrice < hi);
        const wins = rows.filter((r) => r.pnl > 0).length;
        const avg = rows.length ? rows.reduce((a, r) => a + r.entryPrice, 0) / rows.length : 0;
        return { label, trades: rows.length, winRate: rows.length ? wins / rows.length : 0, breakEven: avg };
      }),
    [recent],
  );
  const reasons = useMemo(() => signals.filter((s) => s.status === "blocked").map((s) => s.rejectedReason ?? null), [signals]);
  return (
    <Shell>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Analysis</h1>
          <p className="text-sm text-muted">Live prices, where each window stands against the gates, and how the settled trades are really doing.</p>
        </header>
        <LiveTape recent={recent} />
        <WindowRadar recent={recent} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Net P&L" value={sum ? signedMoney(sum.netPnl) : "—"} hint={sum ? `${sum.trades} settled` : undefined} />
          <Stat label="Win rate" value={sum ? pct(sum.winRate) : "—"} hint={sum ? `avg win ${signedMoney(sum.avgWin)} · avg loss ${signedMoney(sum.avgLoss)}` : undefined} />
          <Stat label="Profit factor" value={sum && Number.isFinite(sum.profitFactor) ? sum.profitFactor.toFixed(2) : "—"} hint="above 1 means winners outweigh losers" />
          <Stat label="Max drawdown" value={sum ? signedMoney(-sum.maxDrawdown) : "—"} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Win rate by price paid">
            <PriceBucketChart rows={buckets} />
            <p className="mt-2 text-xs text-muted">Paying 90¢ needs a 90% win rate to break even. Bars under the red line are losing buckets.</p>
          </Panel>
          <Panel title="Claimed edge vs result">
            <EdgeResultChart rows={recent.map((r) => ({ edge: r.edgeAtEntry, pnl: r.pnl }))} />
            <p className="mt-2 text-xs text-muted">If the model's edge is real, higher-edge trades should sit higher.</p>
          </Panel>
        </div>
        <Panel title="Why trades were not placed">
          <BlockBreakdown reasons={reasons} />
        </Panel>
      </div>
    </Shell>
  );
}
