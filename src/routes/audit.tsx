import { createFileRoute } from "@tanstack/react-router";
import { Button, Panel } from "@/components/widgets";
import { clock, downloadText, money, pct, signedMoney, toCsv } from "@/lib/trading/format";
import { useDesk } from "@/lib/trading/store";

export const Route = createFileRoute("/audit")({
  head: () => ({ meta: [{ title: "Audit · Helios Desk" }] }),
  component: AuditPage,
});

function AuditPage() {
  const audit = useDesk((s) => s.audit);
  const signals = useDesk((s) => s.signals);
  const positions = useDesk((s) => s.positions);
  const settled = positions.filter((p) => p.status === "settled");
  // Headline numbers come from the same record as the Trial page: every settled trade on a real Polymarket window.
  // (The positions list in the browser is capped at the latest 80, so it cannot be used for totals.)
  const sum = useDesk((s) => s.trial?.summary);
  const calibration = (sum?.calibration ?? []).map((c) => ({ label: `${Math.round(c.p * 100)}%`, n: c.n, hit: c.won }));

  function exportDecisions() {
    const rows: Array<Array<string | number>> = [
      ["time", "status", "market", "side", "price", "stake", "edge", "reason", "model"],
      ...signals.map((s) => [
        new Date(s.createdAt).toISOString(),
        s.status,
        s.question,
        s.side,
        s.executablePrice,
        s.stake.toFixed(2),
        s.edge.toFixed(4),
        s.rejectedReason ?? "",
        s.modelVersion,
      ]),
    ];
    downloadText("helios-decisions.csv", toCsv(rows));
  }

  function exportTrades() {
    const rows: Array<Array<string | number>> = [
      ["time", "market", "side", "qty", "avg", "realized", "note"],
      ...settled.map((p) => [
        p.settledAt ? new Date(p.settledAt).toISOString() : "",
        p.question,
        p.side,
        p.quantity.toFixed(4),
        p.averageCost.toFixed(4),
        p.realized.toFixed(2),
        p.settleNote ?? "",
      ]),
    ];
    downloadText("helios-trades.csv", toCsv(rows));
  }

  return (
    <div className="space-y-4">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Why it traded, or why it didn't.</h1>
        <p className="mt-2 text-muted">
          Paper results only. Live exchange results: none — this desk cannot send an order. Secrets are not written
          because none are collected.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="quiet" onClick={exportDecisions}>
          Export decisions
        </Button>
        <Button type="button" variant="quiet" onClick={exportTrades}>
          Export trades
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Mini label="Settled trades (real windows)" value={String(sum?.trades ?? 0)} />
        <Mini label="Win rate" value={sum?.trades ? pct(sum.winRate) : "—"} />
        <Mini label="Avg win / loss" value={`${sum?.wins ? money(sum.avgWin) : "—"} / ${sum?.losses ? money(Math.abs(sum.avgLoss)) : "—"}`} />
        <Mini label="Net P&L" value={signedMoney(sum?.netPnl ?? 0)} />
        <Mini label="Fees" value={money(sum?.fees ?? 0)} />
        <Mini label="Profit factor" value={sum && Number.isFinite(sum.profitFactor) && sum.profitFactor > 0 ? sum.profitFactor.toFixed(2) : "—"} />
        <Mini label="Expectancy per trade" value={sum?.trades ? signedMoney(sum.expectancy) : "—"} />
        <Mini label="Max drawdown" value={money(sum?.maxDrawdown ?? 0)} />
      </div>
      <p className="text-sm text-muted">
        Same record as the Trial page. Practice windows are excluded{sum && sum.sim.trades > 0 ? ` (${sum.sim.trades} practice trades, ${signedMoney(sum.sim.netPnl)}, not counted)` : ""}. The Book page shows the paper
        account, which also includes practice trades and open positions, so its totals differ on purpose.
      </p>
      <Panel title="Calibration on real settlements">
        <ul className="space-y-2 text-sm">
          {calibration.map((bucket) => (
            <li key={bucket.label} className="flex items-center justify-between gap-3 font-mono tabular-nums">
              <span>Model ≈ {bucket.label}</span>
              <span className="text-muted">{bucket.n} settled</span>
              <span>{bucket.n ? pct(bucket.hit) : "—"} hit</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">Hit rate is how often Up/Yes won at that model probability, not how often the trade made money.</p>
      </Panel>
      <Panel title="Audit trail">
        <ul className="space-y-3">
          {audit.map((entry) => (
            <li key={entry.id} className="border-b border-line pb-3 last:border-0">
              <p className="text-xs text-muted">
                {clock(entry.at)} · {entry.actor}
              </p>
              <p className="font-medium">{entry.action}</p>
              <p className="text-sm text-muted">{entry.detail}</p>
            </li>
          ))}
          {audit.length === 0 && <li className="text-sm text-muted">The trail starts when the desk boots.</li>}
        </ul>
      </Panel>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-mono text-lg tabular-nums">{value}</p>
    </div>
  );
}
