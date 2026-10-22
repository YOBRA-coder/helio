import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Countdown, Panel, Pill } from "@/components/widgets";
import { age, money, px } from "@/lib/trading/format";
import { ModelVsMarketChart } from "@/components/charts";
import { useDesk } from "@/lib/trading/store";
import type { Market } from "@/lib/trading/types";

export const Route = createFileRoute("/markets")({
  head: () => ({ meta: [{ title: "Markets · Helios Desk" }] }),
  component: MarketsPage,
});

const FILTERS = ["All", "Live", "5m", "15m", "1h"] as const;

function MarketsPage() {
  const sim = useDesk((s) => s.simMarkets);
  const live = useDesk((s) => s.liveMarkets);
  const now = useDesk((s) => s.now);
  const liveError = useDesk((s) => s.liveError);
  const bookStatus = useDesk((s) => s.bookStatus);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = [...sim, ...live].filter((market) => {
    if (filter === "Live") return market.kind === "live";
    if (filter === "All") return true;
    return market.group === filter;
  });

  return (
    <div className="space-y-4">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Discover the board. Don't pin one window.</h1>
        <p className="mt-2 text-muted">
          Live rows are discovered from Polymarket, then their bids and asks stream from the public order book. Windows are found automatically, so no five-minute id is hardcoded.
        </p>
      </div>
      {liveError && <p className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{liveError}</p>}
      <div className="flex items-center gap-2">
        <Pill tone={bookStatus === "live" ? "good" : bookStatus === "down" ? "bad" : "neutral"}>
          {bookStatus === "live" ? "Live book" : bookStatus === "connecting" ? "Connecting" : bookStatus === "down" ? "Book down" : "Book idle"}
        </Pill>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={
              filter === item
                ? "h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg"
                : "h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm text-fg"
            }
          >
            {item}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {rows.map((market) => (
          <MarketRow
            key={market.id}
            market={market}
            now={now}
            open={openId === market.id}
            onToggle={() => setOpenId((id) => (id === market.id ? null : market.id))}
          />
        ))}
        {rows.length === 0 && <Panel title="Nothing in this filter">The tape is still warming, or this duration is between windows.</Panel>}
      </div>
    </div>
  );
}

function MarketRow({
  market,
  now,
  open,
  onToggle,
}: {
  market: Market;
  now: number;
  open: boolean;
  onToggle: () => void;
}) {
  const hist = useDesk((s) => s.hist[market.id]);
  const spread = market.yesAsk - market.yesBid;
  const blocked = !market.metadataOk || market.restricted || market.status !== "open";
  return (
    <article className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <Pill tone={market.kind === "live" ? "good" : "neutral"}>{market.kind === "live" ? "Polymarket" : "Simulated"}</Pill>
            <Pill>{market.group || "BTC"}</Pill>
            {blocked && <Pill tone="bad">{market.kind === "live" ? "Watch only" : "Blocked"}</Pill>}
          </div>
          <h2 className="text-lg font-semibold tracking-tight">{market.question}</h2>
        </div>
        <p className="font-mono text-sm tabular-nums text-muted">
          <Countdown end={market.endAt} />
        </p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-sm tabular-nums sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted">Bid / ask</dt>
          <dd>
            {px(market.yesBid)} / {px(market.yesAsk)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Spread</dt>
          <dd>{px(spread)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Liquidity</dt>
          <dd>{money(market.liquidity, 0)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Fresh</dt>
          <dd>{age(now, market.updatedAt)}</dd>
        </div>
      </dl>
      <Button type="button" variant="ghost" className="mt-2 px-0" onClick={onToggle}>
        {open ? "Hide contract" : "Resolution and source"}
      </Button>
      {open && (
        <div className="mt-2 space-y-2 text-sm text-muted">
          <ModelVsMarketChart rows={hist ?? []} />
          <p>{market.resolution}</p>
          <p>
            Outcomes: {market.outcomes[0]} / {market.outcomes[1]}. Source: {market.source}.
            {market.metadataOk ? " Critical metadata is present." : market.kind === "live" ? " Up/down windows stay watch-only until this desk sees the open print. Orders stay on paper." : " Missing strike or resolution text blocks paper orders."}
            {market.restricted ? " Marked restricted, so eligibility is unverified." : ""}
          </p>
          {market.sourceUrl && (
            <a className="font-semibold text-primary" href={market.sourceUrl} target="_blank" rel="noreferrer">
              Open on Polymarket
            </a>
          )}
        </div>
      )}
    </article>
  );
}
