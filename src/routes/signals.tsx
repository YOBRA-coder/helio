import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  const [query, setQuery] = useState("");
  const [win, setWin] = useState<"all" | "5m" | "15m" | "1h" | "4h">("all");
  const [reason, setReason] = useState<string | null>(null);
  const reasons = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of signals) {
      if (x.status !== "blocked" || !x.rejectedReason) continue;
      const key = x.rejectedReason.replace(/-?\d+(\.\d+)?/g, "#");
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [signals]);
  const windowOf = (q: string) => {
    const m = q.match(/(\d{1,2}(?::\d{2})?\s?[AP]M)\s?-\s?(\d{1,2}(?::\d{2})?\s?[AP]M)/i);
    if (!m) return /4:00PM|12:00PM-4/i.test(q) ? "4h" : "1h";
    const toMin = (t: string) => {
      const [, h, mi, ap] = t.match(/(\d{1,2})(?::(\d{2}))?\s?([AP])M/i) ?? [];
      return ((Number(h) % 12) + (ap?.toUpperCase() === "P" ? 12 : 0)) * 60 + Number(mi ?? 0);
    };
    const d = (toMin(m[2]) - toMin(m[1]) + 1440) % 1440;
    return d <= 5 ? "5m" : d <= 15 ? "15m" : d <= 60 ? "1h" : "4h";
  };
  const rows = signals.filter((signal) => {
    if (query && !signal.question.toLowerCase().includes(query.toLowerCase())) return false;
    if (win !== "all" && windowOf(signal.question) !== win) return false;
    if (reason && (signal.rejectedReason ?? "").replace(/-?\d+(\.\d+)?/g, "#") !== reason) return false;
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
      {reasons.length > 0 && (
        <div className="rounded-lg border border-line bg-surface p-4">
          <p className="text-sm font-semibold">Why signals were blocked</p>
          <ul className="mt-2 space-y-1">
            {reasons.map(([text, n]) => (
              <li key={text}>
                <button type="button" onClick={() => { setReason(reason === text ? null : text); setTab("Blocked"); }} className={`flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm ${reason === text ? "bg-primary text-primary-fg" : ""}`}>
                  <span className="min-w-0 flex-1">{text.replace("#", "…")}</span>
                  <span className="font-mono tabular-nums">{n}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Tap a reason to filter. Mostly "net edge below the minimum" means the filter is working.</p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search windows" aria-label="Search signals" className="h-11 min-w-0 flex-1 rounded-md border border-line bg-raised px-3 text-sm" />
        {(["all", "5m", "15m", "1h", "4h"] as const).map((w) => (
          <button key={w} type="button" onClick={() => setWin(w)} className={win === w ? "h-11 rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg" : "h-11 rounded-full border border-line bg-surface px-4 text-sm"}>{w === "all" ? "All windows" : w}</button>
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
