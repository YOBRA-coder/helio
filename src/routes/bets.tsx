import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Panel, Pill, Stat } from "@/components/widgets";
import { clock, money, remain, signedMoney } from "@/lib/trading/format";
import { overlayQuotes, useLive } from "@/lib/trading/live-store";
import { useDesk } from "@/lib/trading/store";

export const Route = createFileRoute("/bets")({ component: Bets });

type Filter = "all" | "won" | "lost";

function Bets() {
  const positions = useDesk((s) => s.positions);
  const liveMarkets = useDesk((s) => s.liveMarkets);
  const simMarkets = useDesk((s) => s.simMarkets);
  const now = useDesk((s) => s.now);
  const mode = useDesk((s) => s.mode);
  const orders = useDesk((s) => s.orders);
  const quotes = useLive((s) => s.quotes);
  const btc = useLive((s) => s.btc);
  const deskSpot = useDesk((s) => s.spot);
  const [filter, setFilter] = useState<Filter>("all");
  const spot = btc && Date.now() - btc.at < 5000 ? btc.price : deskSpot;

  const markets = useMemo(() => new Map(overlayQuotes([...liveMarkets, ...simMarkets], quotes).map((m) => [m.id, m])), [liveMarkets, simMarkets, quotes]);
  const open = positions.filter((p) => p.status === "open").sort((a, b) => a.endAt - b.endAt);
  const settled = positions.filter((p) => p.status === "settled").sort((a, b) => (b.settledAt ?? 0) - (a.settledAt ?? 0));
  const shown = settled.filter((p) => (filter === "won" ? p.realized > 0 : filter === "lost" ? p.realized <= 0 : true));

  const rows = open.map((p) => {
    const m = markets.get(p.marketId);
    // what the position could be sold for right now: the bid for the side held
    const mark = m ? (p.side === "yes" ? m.yesBid : 1 - m.yesAsk) : p.lastMark;
    const unreal = p.quantity * (mark - p.averageCost);
    const gap = m?.openSpot ? spot - m.openSpot : null;
    const winning = gap == null ? null : p.side === "yes" ? gap >= 0 : gap <= 0;
    return { p, m, mark, unreal, gap, winning };
  });
  const atRisk = open.reduce((a, p) => a + p.quantity * p.averageCost, 0);
  const unrealTotal = rows.reduce((a, r) => a + r.unreal, 0);
  const dayStart = new Date().setHours(0, 0, 0, 0);
  const today = settled.filter((p) => (p.settledAt ?? 0) >= dayStart).reduce((a, p) => a + p.realized, 0);
  const wins = settled.filter((p) => p.realized > 0).length;

  return (
    <>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Bets</h1>
          <p className="text-sm text-muted">Every bet the desk has placed: open ones with live prices, and the settled history. Mode: {mode}.</p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Open bets" value={String(open.length)} hint={`${money(atRisk)} at risk`} />
          <Stat label="Open P&L now" value={signedMoney(unrealTotal)} hint="at today's sell price" />
          <Stat label="Settled today" value={signedMoney(today)} />
          <Stat label="Win rate" value={settled.length ? `${Math.round((wins / settled.length) * 100)}%` : "—"} hint={`${settled.length} settled`} />
        </div>

        <Panel title={`Open bets (${open.length})`}>
          {rows.length === 0 ? (
            <p className="text-sm text-muted">No open bets. The desk bets when a window is leaning clearly enough for your pace setting; see Analysis for what it is waiting on.</p>
          ) : (
            <ul className="space-y-3">
              {rows.map(({ p, mark, unreal, gap, winning }) => (
                <li key={p.id} className="rounded-lg border border-line bg-surface p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Pill>{p.group}</Pill>
                      <b>{p.side === "yes" ? "Up" : "Down"}</b>
                      <span className="text-sm text-muted">{p.quantity.toFixed(1)} shares @ {Math.round(p.averageCost * 100)}¢</span>
                    </div>
                    <Pill tone={winning == null ? "neutral" : winning ? "good" : "bad"}>{winning == null ? "—" : winning ? "Winning now" : "Losing now"}</Pill>
                  </div>
                  <p className="mt-1 text-sm text-muted">{p.question}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <Cell k="Time left" v={remain(p.endAt - now)} />
                    <Cell k="BTC vs open" v={gap == null ? "—" : `${gap >= 0 ? "+" : "−"}$${Math.abs(gap).toFixed(0)}`} />
                    <Cell k="Sell price" v={`${Math.round(mark * 100)}¢`} />
                    <Cell k="P&L now" v={signedMoney(unreal)} tone={unreal >= 0 ? "text-primary" : "text-danger"} />
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`Orders (${orders.length})`}>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">No orders yet. An order appears here the moment the desk sends one, with whether it filled or timed out.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {orders.slice(0, 15).map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="min-w-0 flex-1 truncate">{o.side === "yes" ? "Up" : "Down"} · {o.question}</span>
                  <span className="font-mono text-xs text-muted">{o.quantity.toFixed(1)} @ {Math.round(o.limitPrice * 100)}¢ · {clock(o.submittedAt)}</span>
                  <Pill tone={o.status === "filled" ? "good" : o.status === "cancelled" ? "bad" : "neutral"}>
                    {o.status === "cancelled" ? "not filled" : o.status}
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title={`Settled (${shown.length})`}
          action={
            <div className="flex gap-1">
              {(["all", "won", "lost"] as Filter[]).map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs ${filter === f ? "bg-primary text-primary-fg" : "bg-raised text-muted"}`}>
                  {f}
                </button>
              ))}
            </div>
          }
        >
          {shown.length === 0 ? (
            <p className="text-sm text-muted">Nothing here yet.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {shown.slice(0, 100).map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="flex items-center gap-2">
                    <Pill tone={p.realized > 0 ? "good" : "bad"}>{p.realized > 0 ? "Won" : "Lost"}</Pill>
                    <b>{p.side === "yes" ? "Up" : "Down"}</b>
                    <span className="text-muted">{p.group} · {Math.round(p.averageCost * 100)}¢</span>
                  </span>
                  <span className="text-xs text-muted">{p.settledAt ? clock(p.settledAt) : ""}</span>
                  <span className={`font-mono tabular-nums ${p.realized > 0 ? "text-primary" : "text-danger"}`}>{signedMoney(p.realized)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Cell({ k, v, tone }: { k: string; v: string; tone?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{k}</dt>
      <dd className={`font-mono tabular-nums ${tone ?? ""}`}>{v}</dd>
    </div>
  );
}
