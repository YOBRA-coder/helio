import { createFileRoute, Link } from "@tanstack/react-router";
import { EquityDrawdownChart, SpotChart } from "@/components/charts";
import { Button, Countdown, Panel, Pill, Stat } from "@/components/widgets";
import { money, px, signedMoney, age } from "@/lib/trading/format";
import { useDesk } from "@/lib/trading/store";

export const Route = createFileRoute("/")({
  component: DeskHome,
});

function DeskHome() {
  const booted = useDesk((s) => s.booted);
  const spot = useDesk((s) => s.spot);
  const spots = useDesk((s) => s.spots);
  const spotSource = useDesk((s) => s.spotSource);
  const cash = useDesk((s) => s.cash);
  const positions = useDesk((s) => s.positions);
  const orders = useDesk((s) => s.orders);
  const dayStart = useDesk((s) => s.dayStartEquity);
  const signals = useDesk((s) => s.signals);
  const simMarkets = useDesk((s) => s.simMarkets);
  const liveMarkets = useDesk((s) => s.liveMarkets);
  const liveStatus = useDesk((s) => s.liveStatus);
  const bookStatus = useDesk((s) => s.bookStatus);
  const now = useDesk((s) => s.now);
  const mode = useDesk((s) => s.mode);
  const killed = useDesk((s) => s.killed);
  const circuitKind = useDesk((s) => s.circuitKind);
  const curve = useDesk((s) => s.curve);
  const spotDtMs = useDesk((s) => s.spotDtMs);
  const flatten = useDesk((s) => s.flatten);
  const scores = useDesk((s) => s.trial?.summary);

  const dayStartMs = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  const todayRows = (useDesk((s) => s.trial?.recent) ?? []).filter((r) => r.kind === "live" && r.settledAt >= dayStartMs);
  const todayWins = todayRows.filter((r) => r.pnl > 0).length;
  const todayPnl = todayRows.reduce((a, r) => a + r.pnl, 0);
  const openList = positions.filter((p) => p.status === "open").sort((a, b) => a.endAt - b.endAt);
  const reserved = orders.filter((o) => o.status === "open").reduce((sum, o) => sum + o.debit, 0);
  const marks = positions.filter((p) => p.status === "open").reduce((sum, p) => sum + p.quantity * p.lastMark, 0);
  const equity = cash + reserved + marks;
  const exposure = positions
    .filter((p) => p.status === "open")
    .reduce((sum, p) => sum + p.quantity * p.averageCost, 0) + reserved;
  const pending = signals.filter((s) => s.status === "pending");
  const latestBlock = signals.find((s) => s.status === "blocked" || s.status === "expired");
  const approve = useDesk((s) => s.approve);
  const reject = useDesk((s) => s.reject);
  const first = spots[0];
  const last = spots[spots.length - 1];
  const drift = first && last ? ((last - first) / first) * 100 : 0;
  const openPositions = positions.filter((p) => p.status === "open").length;
  const streamed = liveMarkets.filter((market) => market.yesTokenId).slice(0, 6);
  const onBook = streamed.filter((market) => market.source === "Polymarket CLOB").length;
  const bookLabel =
    bookStatus === "live" ? "Live book" : bookStatus === "connecting" ? "Connecting" : bookStatus === "down" ? "Book down" : "Book idle";

  const read = !booted
    ? "The desk is still opening the tape. No order can leave until a reference print and a fresh book are both in."
    : [
        spot
          ? `BTC reference ${money(spot, 0)}. The path on screen has drifted ${drift >= 0 ? "up" : "down"} ${Math.abs(drift).toFixed(2)}% since this session's first print.`
          : "No BTC print yet. Windows stay dark until Coinbase answers.",
        killed
          ? "Emergency stop is holding. The model can still score, but it will not submit."
          : circuitKind
            ? "A circuit is open. New paper orders stay paused until you clear it."
            : pending.length
              ? `${pending.length} proposal${pending.length === 1 ? "" : "s"} cleared minimum edge. ${mode === "manual" ? "Manual mode will not send them without your approval." : "Auto paper mode may send them if the gates still hold."}`
              : latestBlock
                ? `Nothing is waiting. Latest gate: ${latestBlock.rejectedReason}`
                : "Nothing is waiting. A quiet log means the filter refused the book, not that the feed died.",
        `${liveMarkets.length} live Bitcoin windows from Polymarket. ${onBook} are priced off the public order book. ${simMarkets.length ? `${simMarkets.length} practice windows run underneath. ` : ""}${openPositions} paper position${openPositions === 1 ? "" : "s"} marked.`,
      ].join(" ");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="max-w-3xl lg:col-span-3">
          <h1 className="text-3xl font-semibold tracking-tight">The night desk for BTC contracts.</h1>
          <p className="mt-2 text-muted">
            Helios watches public Polymarket Bitcoin markets, scores them with a transparent baseline, and will only
            paper-trade inside your risk gates. {mode === "manual" ? "Manual approval is on." : "Auto paper mode is on."}{" "}
            {killed ? "The kill switch is holding new orders." : "Prices are live. Orders stay on paper."}
          </p>
        </div>
        <Panel title="Baseline read" className="lg:col-span-2">
          <p className="text-sm leading-relaxed">{read}</p>
          <p className="mt-3 text-xs text-muted">Not a chatbot. This line is the same gates the order path uses.</p>
        </Panel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="BTC reference" value={spot ? money(spot, 0) : "—"} hint={spotSource} />
        <Stat label="Paper equity" value={booted ? money(equity, 0) : "—"} hint="Cash, reserved, and marks" />
        <Stat
          label="Day P&L"
          value={booted ? signedMoney(equity - dayStart) : "—"}
          hint="Simulated session"
        />
        <Stat label="Open exposure" value={booted ? money(exposure, 0) : "—"} hint="Cost of positions and resting orders" />
      </div>

      <Panel title="Today">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Settled today (real windows)</p>
            <p className="mt-1 font-mono text-xl tabular-nums">
              {todayRows.length} · {todayWins}W {todayRows.length - todayWins}L
            </p>
            <p className={`font-mono text-sm tabular-nums ${todayPnl >= 0 ? "text-primary" : "text-danger"}`}>{signedMoney(todayPnl)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-muted">Open positions</p>
            <ul className="mt-1 space-y-1 text-sm">
              {openList.slice(0, 4).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate">{p.group} · {p.side.toUpperCase()} · {p.question}</span>
                  <Countdown end={p.endAt} />
                </li>
              ))}
              {openList.length === 0 && <li className="text-muted">None. Waiting for a signal that clears every gate.</li>}
            </ul>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="BTC reference and window opens" className="lg:col-span-3">
          <SpotChart
            spots={spots}
            dtMs={spotDtMs}
            now={now}
            opens={liveMarkets
              .filter((m) => m.status === "open" && m.openSpot != null)
              .slice(0, 4)
              .map((m) => ({ label: m.group, price: m.openSpot as number }))}
          />
          <p className="mt-2 text-sm text-muted">
            Dashed lines are the open print of each live Up/Down window. A window pays Up when the reference finishes above its line.
            Prints come from Coinbase; Polymarket resolves on its own source, so a close call can settle differently.
          </p>
        </Panel>
        <Panel title="Needs a decision" className="lg:col-span-2">
          {pending.length === 0 && (
            <div className="space-y-2 text-sm text-muted">
              <p>{booted ? "No approval is waiting." : "Syncing the tape…"}</p>
              {latestBlock && <p>Latest gate: {latestBlock.rejectedReason}</p>}
              <Link to="/signals" className="inline-flex h-11 items-center font-semibold text-primary">
                Open the signal log
              </Link>
            </div>
          )}
          {pending.slice(0, 2).length > 0 && (
            <div className="space-y-3">
              {pending.slice(0, 2).map((signal) => (
                <div key={signal.id} className="rounded-md bg-raised p-3">
                  <p className="text-sm font-medium">{signal.question}</p>
                  <p className="mt-1 font-mono text-sm tabular-nums text-primary">
                    {signal.side.toUpperCase()} · edge {signal.edge.toFixed(3)} · <Countdown end={signal.expiresAt} />
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" onClick={() => approve(signal.id)}>
                      Approve
                    </Button>
                    <Button type="button" variant="quiet" onClick={() => reject(signal.id)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Equity and drawdown" className="lg:col-span-3">
          <EquityDrawdownChart data={curve} />
        </Panel>
        <Panel title="Open positions" className="lg:col-span-2">
          <ul className="space-y-2 text-sm">
            {positions
              .filter((p) => p.status === "open")
              .slice(0, 8)
              .map((p) => {
                const pnl = p.quantity * (p.lastMark - p.averageCost) - p.fees;
                return (
                  <li key={p.id} className="rounded-md bg-raised px-3 py-2">
                    <p className="truncate">{p.question}</p>
                    <p className="mt-1 flex items-center justify-between gap-2 font-mono text-xs tabular-nums text-muted">
                      <span>{p.side.toUpperCase()} {p.quantity.toFixed(1)} @ {p.averageCost.toFixed(2)} → {p.lastMark.toFixed(2)}</span>
                      <span className={pnl >= 0 ? "text-primary" : "text-danger"}>{signedMoney(pnl)}</span>
                    </p>
                    <button type="button" onClick={() => flatten(p.id)} className="mt-1 h-9 text-xs font-semibold text-primary">Flatten at the touch</button>
                  </li>
                );
              })}
            {positions.filter((p) => p.status === "open").length === 0 && <li className="text-muted">No open positions.</li>}
          </ul>
          {scores && <p className="mt-3 text-xs text-muted">Record on real markets: {scores.wins}W / {scores.losses}L · net {signedMoney(scores.netPnl)} · <Link to="/trial" className="underline">full trial</Link></p>}
        </Panel>
      </div>

      <Panel
        title="Live Polymarket"
        action={<Pill tone={bookStatus === "live" || onBook > 0 ? "good" : "neutral"}>{bookLabel}</Pill>}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {streamed.map((market) => (
            <article key={market.id} className="rounded-md border border-line bg-raised p-3">
              <div className="flex items-center justify-between gap-2">
                <Pill tone={market.source === "Polymarket CLOB" ? "good" : "neutral"}>{market.group}</Pill>
                <Countdown end={market.endAt} />
              </div>
              <p className="mt-2 text-sm">{market.question}</p>
              <p className="mt-2 flex items-center gap-2 font-mono text-sm tabular-nums">
                {market.source === "Polymarket CLOB" && <span className="live-dot" aria-hidden="true" />}
                {px(market.yesBid)} / {px(market.yesAsk)}
                <span className="text-muted">
                  {market.source === "Polymarket CLOB" ? `live · ${age(now, market.updatedAt)}` : "catalog"}
                </span>
              </p>
            </article>
          ))}
          {streamed.length === 0 && (
            <p className="text-sm text-muted">
              {liveStatus === "error" ? "The public Polymarket feed did not answer." : "Opening the current Bitcoin windows."}
            </p>
          )}
        </div>
        <p className="mt-3 text-sm text-muted">
          5-minute, 15-minute, hourly, and 4-hour windows come from Polymarket's live series. Bids and asks stream from the public order book. No window id is hardcoded, and nothing here is a live order.
        </p>
      </Panel>

      {simMarkets.length > 0 && (
      <Panel
        title="Paper windows"
        action={<Pill tone={liveStatus === "ok" ? "good" : "neutral"}>{liveStatus === "ok" ? "Reference up" : "Feed warming"}</Pill>}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {simMarkets.map((market) => (
            <article key={market.id} className="rounded-md border border-line bg-raised p-3">
              <div className="flex items-center justify-between gap-2">
                <Pill>{market.group}</Pill>
                <Countdown end={market.endAt} />
              </div>
              <p className="mt-2 text-sm">{market.question}</p>
              <div className="relative mt-3 h-2 rounded-full bg-bg">
                <div
                  className="absolute inset-y-0 rounded-full bg-primary"
                  style={{
                    left: `${Math.min(96, market.yesBid * 100)}%`,
                    width: `${Math.max(4, (market.yesAsk - market.yesBid) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 font-mono text-sm tabular-nums text-muted">
                {Math.round(market.yesBid * 100)}–{Math.round(market.yesAsk * 100)}¢ · liq {Math.round(market.liquidity / 1000)}k
              </p>
            </article>
          ))}
          {simMarkets.length === 0 && <p className="text-sm text-muted">Opening the 5m, 15m, and 1h paper windows.</p>}
        </div>
        <p className="mt-3 text-sm text-muted">Simulated, so expiry can be rehearsed without a five-minute id pinned in the code.</p>
      </Panel>
      )}
    </div>
  );
}