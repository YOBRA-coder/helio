import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalibrationChart, EquityDrawdownChart, PnlCurve } from "@/components/charts";
import { Button, Panel, Pill, Stat } from "@/components/widgets";
import { clock, money, pct, signedMoney } from "@/lib/trading/format";
import { useDesk } from "@/lib/trading/store";
import type { Bucket } from "@/lib/trading/trial";

export const Route = createFileRoute("/trial")({
  head: () => ({ meta: [{ title: "Trial · Helios Desk" }] }),
  component: TrialPage,
});

function TrialPage() {
  const trial = useDesk((s) => s.trial);
  const curve = useDesk((s) => s.curve);
  const context = useDesk((s) => s.context);
  const source = useDesk((s) => s.source);
  const startedAt = useDesk((s) => s.trialStartedAt);
  const resetTrial = useDesk((s) => s.resetTrial);
  const [confirm, setConfirm] = useState(false);
  const sum = trial?.summary;

  return (
    <div className="space-y-4">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">A week of paper, scored honestly.</h1>
        <p className="mt-2 text-muted">
          Only settled trades on real Polymarket markets count here. Simulated windows are priced with a built-in bias so
          the desk has something to rehearse on, so they never enter the record. Fills use the ask plus your slippage and a
          fee, and positions settle only when Polymarket reports a resolution.
        </p>
      </div>

      {source === "local" && (
        <p className="rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
          This is the browser desk, so the clock stops when the tab closes. Run the worker for an unattended trial.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Trial clock" value={sum ? `${sum.days.toFixed(1)} d` : "—"} hint={startedAt ? `since ${clock(startedAt)}` : undefined} />
        <Stat label="Settled trades" value={String(sum?.trades ?? 0)} hint={`${sum?.officialTrades ?? 0} official resolutions`} />
        <Stat label="Net P&L" value={sum ? signedMoney(sum.netPnl) : "—"} hint={sum ? `fees ${money(sum.fees)}` : undefined} />
        <Stat label="Win rate" value={sum ? pct(sum.winRate) : "—"} hint={sum ? `PF ${Number.isFinite(sum.profitFactor) ? sum.profitFactor.toFixed(2) : "∞"}` : undefined} />
      </div>

      <Panel title="Equity and drawdown · paper">
        <EquityDrawdownChart data={curve} />
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Cumulative P&L per settled trade">
          <PnlCurve pnls={sum?.pnls ?? []} />
        </Panel>
        <Panel title="Calibration: model vs what happened">
          <CalibrationChart rows={sum?.calibration ?? []} />
          <p className="mt-2 text-sm">{trial?.calibration}</p>
          <p className="mt-2 text-xs text-muted">Dots on the dashed line mean the model’s 70% really wins 70% of the time. Dots far from it mean overconfidence.</p>
        </Panel>
      </div>

      <Panel
        title="Live eligibility"
        action={<Pill tone={trial?.eligible ? "good" : "bad"}>{trial?.eligible ? "Eligible for a tiny live test" : "Not yet"}</Pill>}
      >
        <ul className="space-y-2">
          {(trial?.checks ?? []).map((c) => (
            <li key={c.id} className="flex items-start gap-3 text-sm">
              <span className={c.pass ? "text-primary" : "text-danger"} aria-hidden="true">{c.pass ? "✓" : "✗"}</span>
              <span className="min-w-0 flex-1">
                <span className="block">{c.label}</span>
                <span className="block font-mono text-xs text-muted">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">{trial?.power}</p>
        <p className="mt-2 text-xs text-muted">
          Passing means the paper record does not rule the idea out. It is not proof of an edge, and live fills will be worse
          than paper fills.
        </p>
      </Panel>

      {sum && sum.brierModel != null && (
        <Panel title="Calibration (Brier score, lower is better)">
          <div className="grid gap-3 font-mono text-sm tabular-nums sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted">Model</p>
              <p>{sum.brierModel.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Model + context</p>
              <p>{sum.brierCtx?.toFixed(4) ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Shadow: momentum</p>
              <p>{sum.brierAlt?.toFixed(4) ?? "needs 10+"}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Market price</p>
              <p>{sum.brierMarket?.toFixed(4) ?? "—"}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted">
            A coin flip scores 0.25. If the model does not beat the market column, its “edge” is noise and the gate stays
            closed.
          </p>
        </Panel>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Breakdown title="By window" rows={sum?.byGroup ?? []} />
        <Breakdown title="By time to expiry at entry" rows={sum?.byTtx ?? []} />
      </div>

      <Panel title="Context signals">
        <div className="mb-3 flex flex-wrap gap-2">
          <Pill tone={context?.worldMonitor.status === "ok" ? "good" : context?.worldMonitor.status === "error" ? "bad" : "neutral"}>
            World Monitor: {context?.worldMonitor.status ?? "off"}
          </Pill>
          {context?.fearGreed != null && <Pill>Fear &amp; Greed {Math.round(context.fearGreed)}</Pill>}
          {context && context.stakeScale < 1 && <Pill tone="bad">Stake ×{context.stakeScale}</Pill>}
        </div>
        <p className="mb-3 text-sm text-muted">
          {context?.worldMonitor.detail ?? "Waiting for the first context refresh."} Context can shrink stake or block a
          trade; it never creates one. Its effect on probabilities is capped at ±2 points, off unless enabled, and scored
          separately above.
        </p>
        <ul className="space-y-2 text-sm">
          {(context?.crowd ?? []).map((c) => (
            <li key={`${c.source}-${c.title}`} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 flex-1 truncate">
                {c.url ? (
                  <a className="underline decoration-line underline-offset-2" href={c.url} target="_blank" rel="noreferrer">{c.title}</a>
                ) : (
                  c.title
                )}
              </span>
              <span className="font-mono tabular-nums">{(c.yes * 100).toFixed(0)}%</span>
              <span className="w-24 text-right text-xs text-muted">{c.source}</span>
            </li>
          ))}
          {(context?.crowd.length ?? 0) === 0 && <li className="text-muted">No related markets loaded yet.</li>}
        </ul>
      </Panel>

      <Panel title="Recent settled trades">
        <ul className="space-y-2 text-sm">
          {(trial?.recent ?? []).slice(0, 15).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 font-mono tabular-nums">
              <span className="w-24 text-muted">{clock(r.settledAt)}</span>
              <span className="min-w-0 flex-1 truncate font-sans">{r.group} · {r.side.toUpperCase()}{r.kind === "sim-window" ? " · sim" : ""}</span>
              <span className={r.pnl >= 0 ? "text-primary" : "text-danger"}>{signedMoney(r.pnl)}</span>
            </li>
          ))}
          {(trial?.recent.length ?? 0) === 0 && <li className="text-muted">No settled trades yet.</li>}
        </ul>
      </Panel>

      <Panel title="Start over">
        <p className="text-sm text-muted">
          Clears the paper book, scores, and trial clock. Limits, mode, and live setup are kept. Do this after you change the
          model so old results do not flatter the new version.
        </p>
        <div className="mt-3 flex gap-2">
          {!confirm ? (
            <Button type="button" variant="quiet" onClick={() => setConfirm(true)}>Reset trial</Button>
          ) : (
            <>
              <Button type="button" variant="danger" onClick={() => { resetTrial(); setConfirm(false); }}>Yes, wipe the record</Button>
              <Button type="button" variant="quiet" onClick={() => setConfirm(false)}>Cancel</Button>
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: Bucket[] }) {
  return (
    <Panel title={title}>
      <ul className="space-y-2 text-sm">
        {rows.map((b) => (
          <li key={b.key} className="flex items-center justify-between gap-3 font-mono tabular-nums">
            <span className="w-24 font-sans">{b.key}</span>
            <span className="text-muted">{b.trades} trades</span>
            <span className="text-muted">{b.trades ? pct(b.wins / b.trades) : "—"}</span>
            <span className={b.pnl >= 0 ? "text-primary" : "text-danger"}>{signedMoney(b.pnl)}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-muted">No data yet.</li>}
      </ul>
    </Panel>
  );
}
