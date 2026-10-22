import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SignalCard } from "@/components/signal-card";
import { Button } from "@/components/widgets";
import { downloadText, toCsv } from "@/lib/trading/format";
import { useDesk } from "@/lib/trading/store";

export const Route = createFileRoute("/signals")({
  head: () => ({ meta: [{ title: "Signals · Helios Desk" }] }),
  component: SignalsPage,
});

const TABS = ["Pending", "Blocked", "History", "All"] as const;

function SignalsPage() {
  const signals = useDesk((s) => s.signals);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Pending");
  const rows = signals.filter((signal) => {
    if (tab === "Pending") return signal.status === "pending";
    if (tab === "Blocked") return signal.status === "blocked" || signal.status === "expired" || signal.status === "rejected";
    if (tab === "All") return true;
    return signal.status === "executed" || signal.status === "approved";
  });
  const exportCsv = () =>
    downloadText(
      `helios-signals-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv([
        ["time", "status", "kind", "window question", "side", "model p(side)", "price", "stake", "edge", "reason"],
        ...signals.map((x) => [new Date(x.createdAt).toISOString(), x.status, x.kind, x.question, x.side, x.probability.toFixed(4), x.executablePrice.toFixed(4), x.stake.toFixed(2), x.edge.toFixed(4), x.rejectedReason ?? ""]),
      ]),
    );

  return (
    <div className="space-y-4">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Every idea has to clear the gate.</h1>
        <p className="mt-2 text-muted">
          Manual mode waits for a deliberate approval. If the touch moves more than 2.5¢, or 35 seconds pass, the
          approval dies. Auto mode can submit only when the same hard gates pass, and it is off until you turn it on.
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={
              tab === item
                ? "h-11 shrink-0 rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg"
                : "h-11 shrink-0 rounded-full border border-line bg-surface px-4 text-sm"
            }
          >
            {item}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{signals.length} signals kept · {signals.filter((x) => x.status === "executed").length} executed · {signals.filter((x) => x.status === "blocked").length} blocked</p>
        <Button type="button" variant="quiet" onClick={exportCsv}>Export CSV</Button>
      </div>
      <div className="space-y-3">
        {rows.map((signal) => (
          <SignalCard key={signal.id} signal={signal} quiet={tab !== "Pending" && tab !== "All"} />
        ))}
        {rows.length === 0 && (
          <p className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
            Nothing in this tab. The baseline is picky on purpose. A quiet log is a working filter, not a broken feed.
          </p>
        )}
      </div>
    </div>
  );
}
