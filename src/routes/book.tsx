import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Panel, Pill } from "@/components/widgets";
import { clock, money, px, signedMoney } from "@/lib/trading/format";
import { useDesk } from "@/lib/trading/store";

export const Route = createFileRoute("/book")({
  head: () => ({ meta: [{ title: "Book · Helios Desk" }] }),
  component: BookPage,
});

const TABS = ["Positions", "Orders", "Fills"] as const;

function BookPage() {
  const cash = useDesk((s) => s.cash);
  const orders = useDesk((s) => s.orders);
  const fills = useDesk((s) => s.fills);
  const positions = useDesk((s) => s.positions);
  const flatten = useDesk((s) => s.flatten);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Positions");
  const reserved = orders.filter((o) => o.status === "open").reduce((sum, o) => sum + o.debit, 0);
  const unrealized = positions
    .filter((p) => p.status === "open")
    .reduce((sum, p) => sum + p.quantity * (p.lastMark - p.averageCost), 0);
  const realized = positions.filter((p) => p.status === "settled").reduce((sum, p) => sum + p.realized, 0);

  return (
    <div className="space-y-4">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Paper book, labeled as paper.</h1>
        <p className="mt-2 text-muted">
          Balances are simulated. Nothing here is a Polymarket wallet. Flatten sells at the current touch. Simulated
          windows settle by themselves at expiry.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel title="Available">
          <p className="font-mono text-2xl tabular-nums">{money(cash, 0)}</p>
        </Panel>
        <Panel title="Reserved">
          <p className="font-mono text-2xl tabular-nums">{money(reserved, 0)}</p>
        </Panel>
        <Panel title="Unrealized / realized">
          <p className="font-mono text-2xl tabular-nums">{signedMoney(unrealized)}</p>
          <p className="text-sm text-muted">Realized {signedMoney(realized)}</p>
        </Panel>
      </div>
      <div className="flex gap-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={
              tab === item
                ? "h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg"
                : "h-11 rounded-full border border-line bg-surface px-4 text-sm"
            }
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "Positions" && (
        <div className="space-y-3">
          {positions.length === 0 && <Empty label="No paper positions yet. Approve a signal to open one." />}
          {positions.map((position) => {
            const unrealized = position.quantity * position.lastMark - position.quantity * position.averageCost;
            return (
              <article key={position.id + position.status + (position.settledAt ?? 0)} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={position.status === "open" ? "good" : "neutral"}>{position.status}</Pill>
                  <Pill>{position.kind === "live" ? "Polymarket paper" : "Sim"}</Pill>
                  <Pill>{position.side}</Pill>
                </div>
                <h2 className="mt-2 text-lg font-semibold">{position.question}</h2>
                <p className="mt-2 font-mono text-sm tabular-nums text-muted">
                  {position.quantity.toFixed(2)} sh · avg {px(position.averageCost)} · mark {px(position.lastMark)} ·{" "}
                  {position.status === "open" ? signedMoney(unrealized) : signedMoney(position.realized)}
                </p>
                {position.settleNote && <p className="mt-2 text-sm text-muted">{position.settleNote}</p>}
                {position.status === "open" && (
                  <Button type="button" variant="quiet" className="mt-3" onClick={() => flatten(position.id)}>
                    Flatten at touch
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      )}
      {tab === "Orders" && (
        <div className="space-y-3">
          {orders.length === 0 && <Empty label="No paper orders yet." />}
          {orders.map((order) => (
            <article key={order.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex flex-wrap gap-2">
                <Pill>{order.status}</Pill>
                <Pill>{order.mode}</Pill>
                <Pill>{order.venue}</Pill>
              </div>
              <h2 className="mt-2 font-semibold">{order.question}</h2>
              <p className="mt-2 font-mono text-sm tabular-nums text-muted">
                {order.side.toUpperCase()} {order.quantity.toFixed(2)} @ {px(order.limitPrice)} · {clock(order.submittedAt)}
              </p>
              <p className="mt-1 text-xs text-muted">Idempotency {order.idempotencyKey}</p>
            </article>
          ))}
        </div>
      )}
      {tab === "Fills" && (
        <div className="space-y-3">
          {fills.length === 0 && <Empty label="Fills show up after a resting paper order is marketable." />}
          {fills.map((fill) => (
            <article key={fill.id} className="rounded-lg border border-line bg-surface p-4">
              <h2 className="font-semibold">{fill.question}</h2>
              <p className="mt-2 font-mono text-sm tabular-nums text-muted">
                {fill.side.toUpperCase()} {fill.quantity.toFixed(2)} @ {px(fill.price)} · fee {money(fill.fee)} · {clock(fill.filledAt)}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">{label}</p>;
}
