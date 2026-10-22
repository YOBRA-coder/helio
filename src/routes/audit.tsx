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
  const fills = useDesk((s) => s.fills);
  const curve = useDesk((s) => s.curve);
  const settled = positions.filter((p) => p.status === "settled");
  const wins = settled.filter((p) => p.realized > 0);
  const losses = settled.filter((p) => p.realized < 0);
  const net = settled.reduce((sum, p) => sum + p.realized, 0);
  const fees = fills.reduce((sum, f) => sum + f.fee, 0);
  const grossWin = wins.reduce((sum, p) => sum + p.realized, 0);
  const grossLoss = losses.reduce((sum, p) => sum + -p.realized, 0);
  const peak = curve.reduce((m, p) => Math.max(m, p.equity), curve[0]?.equity ?? 0);
  let maxDd = 0;
  let running = curve[0]?.equity ?? 0;
  for (const point of curve) {
    running = Math.max(running, point.equity);
    maxDd = Math.max(maxDd, running - point.equity);
  }
  const buckets = [0.2, 0.4, 0.6, 0.8, 1];
  const calibration = buckets.map((hi, index) => {
    const lo = index === 0 ? 0 : buckets[index - 1];
    const rows = settled.filter((p) => p.yesWon != null && p.entryYesProb > lo && p.entryYesProb <= hi);
    const hit = rows.filter((p) => p.yesWon).length;
    return { label: `${Math.round(lo * 100)}–${Math.round(hi * 100)}%`, n: rows.length, hit: rows.length ? hit / rows.length : 0 };
  });

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
        <Mini label="Settled trades" value={String(settled.length)} />
        <Mini label="Win rate" value={settled.length ? pct(wins.length / settled.length) : "—"} />
        <Mini label="Avg win / loss" value={`${wins.length ? money(grossWin / wins.length) : "—"} / ${losses.length ? money(grossLoss / losses.length) : "—"}`} />
        <Mini label="Net P&L" value={signedMoney(net)} />
        <Mini label="Fees" value={money(fees)} />
        <Mini label="Profit factor" value={grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : "—"} />
        <Mini label="Expectancy" value={settled.length ? signedMoney(net / settled.length) : "—"} />
        <Mini label="Max drawdown" value={money(maxDd || Math.max(0, peak - (curve.at(-1)?.equity ?? peak)))} />
      </div>
      <Panel title="Calibration on simulated settlements">
        <ul className="space-y-2 text-sm">
          {calibration.map((bucket) => (
            <li key={bucket.label} className="flex items-center justify-between gap-3 font-mono tabular-nums">
              <span>Model {bucket.label}</span>
              <span className="text-muted">{bucket.n} settled</span>
              <span>{bucket.n ? pct(bucket.hit) : "—"} hit</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">Hit rate is how often Yes won, not how often the trade made money.</p>
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
