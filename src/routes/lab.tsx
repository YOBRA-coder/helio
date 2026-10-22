import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { EquityChart } from "@/components/equity-chart";
import { getBacktest, startBacktest, type BacktestView } from "@/lib/trading/desk-api";
import { Button, Panel, Pill, Stat } from "@/components/widgets";
import { money, pct, signedMoney } from "@/lib/trading/format";
import { useDesk } from "@/lib/trading/store";
import type { BacktestPeriod } from "@/lib/trading/types";

export const Route = createFileRoute("/lab")({
  head: () => ({ meta: [{ title: "Lab · Helios Desk" }] }),
  component: LabPage,
});

function LabPage() {
  return (
    <div className="space-y-8">
      <RealBacktest />
      <details className="rounded-lg border border-line bg-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold">Coin-flip sanity check (synthetic, not real data)</summary>
        <div className="mt-4">
          <SyntheticLab />
        </div>
      </details>
    </div>
  );
}

function RealBacktest() {
  const signedIn = useDesk((s) => s.signedIn);
  const [view, setView] = useState<BacktestView | null>(null);
  const [days, setDays] = useState("7");
  const [max, setMax] = useState("400");
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState<BacktestPeriod["name"]>("test");
  const running = view?.job.status === "running";

  useEffect(() => {
    let live = true;
    const load = () => void getBacktest().then((v) => live && setView(v)).catch(() => {});
    load();
    const t = window.setInterval(load, running ? 2000 : 15000);
    return () => {
      live = false;
      window.clearInterval(t);
    };
  }, [running]);

  const r = view?.report;
  const period = r?.periods.find((p) => p.name === name) ?? r?.periods[2];

  return (
    <div className="space-y-4">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Backtest on what actually happened.</h1>
        <p className="mt-2 text-muted">
          Downloads resolved Polymarket Bitcoin windows with their price history and Coinbase candles, then replays the live
          rules minute by minute using only what was known at each moment. Settings are chosen on a validation slice; the
          test slice is scored once.
        </p>
      </div>
      <Panel title="Run">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Days back (1–30)</span>
            <input value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" className="h-11 w-24 rounded-md border border-line bg-raised px-3 font-mono" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Max windows per type</span>
            <input value={max} onChange={(e) => setMax(e.target.value)} inputMode="numeric" className="h-11 w-28 rounded-md border border-line bg-raised px-3 font-mono" />
          </label>
          <Button
            type="button"
            disabled={running || !signedIn}
            onClick={async () => {
              setMsg(null);
              const res = await startBacktest({ data: { days: Number(days), max: Number(max) } });
              if (!res.ok) setMsg(res.error ?? "Could not start");
              setView(await getBacktest());
            }}
          >
            {running ? "Running…" : "Fetch real data and run"}
          </Button>
        </div>
        {!signedIn && <p className="mt-2 text-sm text-muted">Sign in to run it. The server needs internet access to Polymarket and Coinbase.</p>}
        {msg && <p className="mt-2 text-sm text-danger">{msg}</p>}
        {running && view && (
          <p className="mt-3 text-sm text-muted" role="status">
            {view.job.phase}: {view.job.done}/{view.job.total || "…"} · this can take several minutes for many windows.
          </p>
        )}
        {view?.job.status === "error" && <p className="mt-3 text-sm text-danger">Failed: {view.job.error}. Check the server can reach the internet.</p>}
        <p className="mt-3 text-xs text-muted">
          Or from a terminal: <span className="font-mono">npm run backtest -- --days 7 --max 400</span>
        </p>
      </Panel>

      {!r && !running && (
        <Panel title="No real-data result yet">
          <p className="text-sm text-muted">Run it once and the result stays here. Nothing below is simulated.</p>
        </Panel>
      )}

      {r && period && (
        <>
          <p className={`rounded-lg border px-4 py-3 text-sm ${r.periods[2].netPnl > 0 && r.brier && r.brier.model < r.brier.market ? "border-line bg-surface" : "border-danger bg-danger-soft"}`}>
            <span className="font-semibold">Verdict: </span>{r.verdict}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Windows replayed" value={String(r.marketsUsed)} hint={`${new Date(r.range.from).toLocaleDateString()} → ${new Date(r.range.to).toLocaleDateString()}`} />
            <Stat label="Chosen min edge" value={r.chosen.minEdge.toFixed(2)} hint={`haircut ${r.chosen.uncertaintyHaircut}`} />
            <Stat label="Brier: model" value={r.brier ? r.brier.model.toFixed(4) : "—"} hint="lower is better" />
            <Stat label="Brier: market" value={r.brier ? r.brier.market.toFixed(4) : "—"} hint="the bar to beat" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {r.periods.map((p) => (
              <button key={p.name} type="button" onClick={() => setName(p.name)} className={name === p.name ? "h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-semibold capitalize text-primary-fg" : "h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm capitalize"}>
                {p.name}
              </button>
            ))}
          </div>
          <Panel title={`${period.name} equity · replayed on real data`}>
            <EquityChart data={period.curve} />
          </Panel>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Trades" value={String(period.trades)} />
            <Metric label="Win rate" value={pct(period.winRate)} />
            <Metric label="Net P&L" value={signedMoney(period.netPnl)} />
            <Metric label="Fees" value={money(period.fees)} />
            <Metric label="Profit factor" value={Number.isFinite(period.profitFactor) ? period.profitFactor.toFixed(2) : "∞"} />
            <Metric label="Expectancy" value={signedMoney(period.expectancy)} />
            <Metric label="Max drawdown" value={money(period.maxDrawdown)} />
            <Metric label="No trade" value={String(period.rejected)} />
          </div>
          {r.defaultTest && (
            <Panel title="Test slice: shipped defaults vs chosen settings">
              <p className="text-sm text-muted">
                Defaults (edge {0.02}, haircut 0.35): {r.defaultTest.trades} trades, {signedMoney(r.defaultTest.netPnl)}. Chosen: {r.periods[2].trades} trades, {signedMoney(r.periods[2].netPnl)}.
                If the chosen settings only win because they were picked on validation, expect them to fade live.
              </p>
            </Panel>
          )}
          <Panel title="By window type">
            <ul className="space-y-2 text-sm">
              {r.byGroup.map((g) => (
                <li key={g.group} className="flex justify-between gap-3 font-mono tabular-nums">
                  <span className="w-12 font-sans">{g.group}</span><span className="text-muted">{g.trades} trades</span><span className="text-muted">{pct(g.winRate)}</span><span>{signedMoney(g.netPnl)}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <details className="rounded-lg border border-line bg-surface p-4">
            <summary className="cursor-pointer text-sm font-semibold">Parameter sweep (train / validation)</summary>
            <table className="mt-3 w-full text-left font-mono text-xs tabular-nums">
              <thead className="text-muted"><tr><th>edge</th><th>haircut</th><th>train n</th><th>train exp</th><th>val n</th><th>val exp</th></tr></thead>
              <tbody>
                {r.sweep.map((s, i) => (
                  <tr key={i} className={s.params.minEdge === r.chosen.minEdge && s.params.uncertaintyHaircut === r.chosen.uncertaintyHaircut ? "text-primary" : ""}>
                    <td>{s.params.minEdge}</td><td>{s.params.uncertaintyHaircut}</td><td>{s.train.trades}</td><td>{s.train.expectancy.toFixed(2)}</td><td>{s.validation.trades}</td><td>{s.validation.expectancy.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
          <Panel title="Assumptions and caveats">
            <ul className="space-y-2 text-sm text-muted">
              {r.assumptions.map((a) => <li key={a}>{a}</li>)}
              {r.notes.map((a) => <li key={a} className="text-danger">{a}</li>)}
            </ul>
            <div className="mt-3"><Pill>Model {r.modelVersion}</Pill></div>
          </Panel>
        </>
      )}
    </div>
  );
}

function SyntheticLab() {
  const report = useDesk((s) => s.backtest);
  const runStudy = useDesk((s) => s.runStudy);
  const [name, setName] = useState<BacktestPeriod["name"]>("test");
  const period = report?.periods.find((item) => item.name === name) ?? report?.periods[2];

  return (
    <div className="space-y-4">
      <div className="max-w-3xl">
        <h2 className="text-xl font-semibold tracking-tight">A backtest that is allowed to lose.</h2>
        <p className="mt-2 text-muted">
          This study is synthetic, time-ordered, and costed. It does not peek at the settlement. It is not a live track
          record and it is not a promise.
        </p>
      </div>
      <Button type="button" onClick={() => runStudy()}>
        {report ? "Run the study again" : "Run train, validation, and test"}
      </Button>
      {!report && (
        <Panel title="Not run yet">
          <p className="text-sm text-muted">
            Uses your current fee, slippage, haircut, minimum edge, and stake. Results stay on this page and are labeled
            simulated.
          </p>
        </Panel>
      )}
      {report && period && (
        <>
          <div className="flex gap-2 overflow-x-auto">
            {report.periods.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setName(item.name)}
                className={
                  name === item.name
                    ? "h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-semibold capitalize text-primary-fg"
                    : "h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm capitalize"
                }
              >
                {item.name}
              </button>
            ))}
          </div>
          <Panel title={`${period.name} equity · simulated`}>
            <EquityChart data={period.curve} />
          </Panel>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Trades" value={String(period.trades)} />
            <Metric label="Win rate" value={pct(period.winRate)} />
            <Metric label="Net P&L" value={signedMoney(period.netPnl)} />
            <Metric label="Fees" value={money(period.fees)} />
            <Metric label="Profit factor" value={Number.isFinite(period.profitFactor) ? period.profitFactor.toFixed(2) : "—"} />
            <Metric label="Expectancy" value={signedMoney(period.expectancy)} />
            <Metric label="Max drawdown" value={money(period.maxDrawdown)} />
            <Metric label="Rejected" value={String(period.rejected)} />
          </div>
          <Panel title="Sample path">
            <ul className="space-y-2 text-sm">
              {period.sample.map((trade, index) => (
                <li key={`${period.name}-${index}`} className="flex items-center justify-between gap-3 font-mono tabular-nums">
                  <span>{trade.rejected ? "Rejected" : trade.won ? "Settled up" : "Settled down"}</span>
                  <span className="text-muted">{(trade.price * 100).toFixed(1)}¢</span>
                  <span>{trade.rejected ? "—" : signedMoney(trade.pnl)}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Assumptions">
            <ul className="space-y-2 text-sm text-muted">
              {report.assumptions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="mt-3">
              <Pill>Model {report.modelVersion}</Pill>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-mono text-xl tabular-nums">{value}</p>
    </div>
  );
}
