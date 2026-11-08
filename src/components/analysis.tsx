import { useMemo } from "react";
import { BtcLiveChart } from "@/components/charts";
import { Panel, Pill } from "@/components/widgets";
import { classifyBlock, summarizeBlocks, type BlockKind } from "@/lib/trading/blocks";
import { realizedVol } from "@/lib/trading/engine";
import { circuitMessage } from "@/lib/trading/engine";
import { coolOffReason, exposureOf, recentLossStreak } from "@/lib/trading/ledger";
import { overlayQuotes, useLive } from "@/lib/trading/live-store";
import { radarRow, type RadarRow } from "@/lib/trading/radar";
import { useDesk } from "@/lib/trading/store";
import type { ScoreRow } from "@/lib/trading/types";
import { remain } from "@/lib/trading/format";

const cents = (n: number) => `${(n * 100).toFixed(n * 100 < 10 ? 1 : 0)}¢`;

/** Live view of every open real window against the strategy's gates, computed with the worker's own evaluator. */
export function useRadar(recent: ScoreRow[]): { rows: RadarRow[]; spot: number; liveAgeMs: number | null } {
  const d = useDesk();
  const btc = useLive((s) => s.btc);
  const quotes = useLive((s) => s.quotes);
  const series = useLive((s) => s.series);
  const feed = useLive((s) => s.feed);
  const spreadBp = useLive((s) => s.spreadBp);
  return useMemo(() => {
    const now = Date.now();
    const liveFresh = btc != null && now - btc.at < 5000;
    const spot = liveFresh && btc ? btc.price : d.spot;
    const staleMs = liveFresh && btc ? now - btc.at + 250 : 6000;
    const vol = realizedVol(d.spots, d.spotDtMs);
    const p15 = (() => {
      if (!series.length) return null;
      const target = now - 15_000;
      const hit = series.reduce((b, r) => (Math.abs(r[0] - target) < Math.abs(b[0] - target) ? r : b), series[0]);
      return Math.abs(hit[0] - target) <= 3000 ? hit[1] : null;
    })();
    const exposure = exposureOf(d.positions, d.orders);
    const ordersLastHour = d.orders.filter((o) => now - o.submittedAt < 3_600_000 && (o.status === "open" || o.status === "filled")).length;
    const markets = overlayQuotes(d.liveMarkets.filter((m) => m.status === "open" && m.endAt > now && m.startAt <= now + 60_000), quotes);
    const circuit = d.circuitKind ? circuitMessage(d.circuitKind as "daily" | "drawdown" | "reconcile") : null;
    const rows = markets.map((m) =>
      radarRow(m, {
        spot, now, risk: d.risk, vol, blendW: d.blend.w, staleMs,
        feed: liveFresh ? { p15, spreadBp, venues: feed?.venues?.filter((v) => v.used).length ?? 1 } : null,
        lossStreak: recentLossStreak(recent, now), killed: d.killed, circuit, cash: d.cash, exposure, ordersLastHour,
        coolOff: coolOffReason(recent, now),
      }),
    );
    rows.sort((a, b) => a.endAt - b.endAt);
    return { rows, spot, liveAgeMs: liveFresh && btc ? now - btc.at : null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.now, d.liveMarkets, d.spot, btc, quotes, series, d.risk, d.killed, d.circuitKind, recent]);
}

const STAGE: Record<RadarRow["stage"], { label: string; tone: "good" | "bad" | "neutral" }> = {
  early: { label: "Watching", tone: "neutral" },
  forming: { label: "Setup forming", tone: "neutral" },
  ready: { label: "Ready to trade", tone: "good" },
  blocked: { label: "Held back", tone: "bad" },
  watch: { label: "Watching", tone: "neutral" },
};

export function WindowRadar({ recent }: { recent: ScoreRow[] }) {
  const { rows } = useRadar(recent);
  return (
    <Panel title="Window radar · every open window against the gates">
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No open windows right now. New 5-minute windows appear every five minutes.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <RadarItem key={r.id} r={r} />
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">
        The strategy waits until BTC is clearly on one side late in a window. "Watching" is the normal state for most of each window, not a rejection.
      </p>
    </Panel>
  );
}

function RadarItem({ r }: { r: RadarRow }) {
  const st = STAGE[r.stage];
  const up = r.z >= 0;
  const zPct = Math.min(100, (Math.abs(r.z) / r.needZ) * 100);
  const edgePct = Math.min(100, Math.max(0, (r.edge / r.needEdge) * 100));
  const info = r.reason ? classifyBlock(r.reason) : null;
  return (
    <li className="rounded-lg border border-line bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Pill>{r.group}</Pill>
          <span className="font-mono text-sm tabular-nums">{remain(r.secLeft * 1000)} left</span>
          {r.toZoneSec > 0 && <span className="text-xs text-muted">acts in {remain(r.toZoneSec * 1000)}</span>}
        </div>
        <Pill tone={st.tone}>{st.label}</Pill>
      </div>
      {r.gap != null && (
        <p className="mt-2 text-sm">
          BTC is <b className={up ? "text-primary" : "text-danger"}>${Math.abs(r.gap).toFixed(0)} {up ? "above" : "below"}</b> the open
          <span className="text-muted"> · {Math.abs(r.z).toFixed(2)} sd, needs {r.needZ.toFixed(2)}</span>
        </p>
      )}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Meter label="Distance from open" pct={zPct} ok={Math.abs(r.z) >= r.needZ} />
        <Meter label={`Edge ${r.edge >= 0 ? "+" : ""}${(r.edge * 100).toFixed(1)}¢ (needs ${(r.needEdge * 100).toFixed(1)}¢)`} pct={edgePct} ok={r.edge >= r.needEdge} />
      </div>
      <p className="mt-2 font-mono text-xs tabular-nums text-muted">
        Up {cents(r.bid)} / {cents(r.ask)} · model {Math.round(r.pModel * 100)}% · market {Math.round(r.mid * 100)}%
      </p>
      {info && r.stage === "blocked" && (
        <p className="mt-1 text-xs">
          <b>{info.label}:</b> <span className="text-muted">{r.reason}</span>
        </p>
      )}
    </li>
  );
}

function Meter({ label, pct, ok }: { label: string; pct: number; ok: boolean }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted">{label}</p>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full ${ok ? "bg-primary" : "bg-muted"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Live BTC with the price on every exchange, plus the open Polymarket windows with live quotes. */
export function LiveTape({ recent }: { recent: ScoreRow[] }) {
  const feed = useLive((s) => s.feed);
  const series = useLive((s) => s.series);
  const book = useLive((s) => s.book);
  const spreadBp = useLive((s) => s.spreadBp);
  const { rows, spot, liveAgeMs } = useRadar(recent);
  const d = useDesk();
  const opens = d.liveMarkets
    .filter((m) => m.status === "open" && m.openSpot && m.endAt > Date.now())
    .slice(0, 4)
    .map((m) => ({ label: m.group, price: m.openSpot as number }));
  const lag = liveAgeMs == null ? "no live print" : `${(liveAgeMs / 1000).toFixed(1)}s old`;
  return (
    <Panel
      title="Live tape"
      action={
        <div className="flex items-center gap-2">
          <Pill tone={liveAgeMs != null ? "good" : "bad"}>BTC {liveAgeMs != null ? "live" : "offline"}</Pill>
          <Pill tone={book === "live" ? "good" : "neutral"}>Polymarket {book === "live" ? "live" : book}</Pill>
        </div>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-3xl font-medium tabular-nums tracking-tight">${spot.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted">{lag}{spreadBp != null ? ` · exchanges within ${spreadBp.toFixed(1)} bp` : ""}</p>
        </div>
        <ul className="flex flex-wrap gap-2 text-xs">
          {(feed?.venues ?? []).map((v) => (
            <li key={v.id} className="flex items-center gap-1.5 rounded-full border border-line px-2 py-1">
              <span className={`inline-block size-2 rounded-full ${v.used ? "bg-primary" : v.state === "error" ? "bg-danger" : "bg-muted"}`} />
              {v.name}
              <span className="text-muted">{v.used ? "voting" : v.state}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-3">
        <BtcLiveChart series={series} opens={opens} />
      </div>
      {rows.length > 0 && (
        <ul className="mt-3 divide-y divide-line text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2">
              <span className="flex items-center gap-2">
                <Pill>{r.group}</Pill>
                <span className="font-mono tabular-nums">{remain(r.secLeft * 1000)}</span>
              </span>
              <span className="font-mono tabular-nums">Up {cents(r.bid)} / {cents(r.ask)}</span>
              <span className="font-mono tabular-nums text-muted">model {Math.round(r.pModel * 100)}%</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

const KIND_ORDER: BlockKind[] = ["quality", "data", "guard", "risk", "stop", "waiting"];
const KIND_COLOR: Record<BlockKind, string> = {
  waiting: "bg-muted", quality: "bg-primary", data: "bg-danger", guard: "bg-danger", risk: "bg-primary", stop: "bg-danger",
};

/** What is behind "blocked": counts by meaning, with what each means and whether anything needs doing. */
export function BlockBreakdown({ reasons }: { reasons: Array<string | null> }) {
  const sum = useMemo(() => summarizeBlocks(reasons), [reasons]);
  if (!sum.total) return <p className="text-sm text-muted">Nothing has been held back yet.</p>;
  const real = sum.total - sum.byKind.waiting;
  return (
    <div className="space-y-3">
      <p className="text-sm">
        <b>{real}</b> real rejection{real === 1 ? "" : "s"} and <b>{sum.byKind.waiting}</b> "not yet" in this log.
      </p>
      <ul className="space-y-2">
        {KIND_ORDER.filter((k) => sum.byKind[k] > 0).map((k) => {
          const info = classifyBlock(sum.top.find((t) => t.kind === k)?.sample ?? "");
          return (
            <li key={k}>
              <div className="flex items-center justify-between text-sm">
                <span>{info.label}</span>
                <span className="font-mono tabular-nums">{sum.byKind[k]}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
                <div className={`h-full rounded-full ${KIND_COLOR[k]}`} style={{ width: `${(sum.byKind[k] / sum.total) * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted">{info.hint}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


/** Which price feeds are really live, and whether the worker process is the new build. */
export function FeedHealth() {
  const version = useDesk((s) => s.workerVersion);
  const health = useDesk((s) => s.health);
  const alive = useDesk((s) => s.workerAlive);
  const feedError = useDesk((s) => s.liveError);
  const old = alive && version !== "helios-worker-2";
  const live = health?.venues.filter((v) => v.used).length ?? 0;
  return (
    <Panel title="Feed health" action={<Pill tone={!alive ? "bad" : old || live === 0 ? "bad" : "good"}>{!alive ? "Worker offline" : old ? "Old worker" : live === 0 ? "No price feed" : `${live} venue${live === 1 ? "" : "s"} live`}</Pill>}>
      {old && (
        <p className="mb-3 rounded-md border border-danger bg-danger-soft p-3 text-sm">
          The worker process is still the old build ({version ?? "unknown"}). The new feeds and trading logic only run after you restart it: <span className="font-mono">systemctl restart helio-worker</span> (or however you run it), then reload this page.
        </p>
      )}
      {alive && !old && live === 0 && (
        <p className="mb-3 rounded-md border border-danger bg-danger-soft p-3 text-sm">No BTC price venue is delivering. Check the VPS can reach Coinbase, Binance and Kraken websockets (outbound 443).</p>
      )}
      <ul className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
        {(health?.venues ?? []).map((v) => (
          <li key={v.name} className="rounded-md border border-line bg-raised p-3">
            <span className="font-medium">{v.name}</span>{" "}
            <span className={v.used ? "text-primary" : "text-danger"}>{v.used ? "live" : v.state}</span>
            <p className="font-mono text-xs text-muted">{v.ageMs == null ? "no price yet" : `last price ${(v.ageMs / 1000).toFixed(1)}s ago`}</p>
          </li>
        ))}
        <li className="rounded-md border border-line bg-raised p-3">
          <span className="font-medium">Polymarket book</span>{" "}
          <span className={health?.book?.state === "live" ? "text-primary" : "text-danger"}>{health?.book?.state ?? "rest only"}</span>
          <p className="font-mono text-xs text-muted">{health?.book ? `${health.book.quotes}/${health.book.tokens} windows priced` : "polling"}</p>
        </li>
      </ul>
      {feedError && <p className="mt-3 text-xs text-muted">Last feed error: {feedError}</p>}
      <p className="mt-2 text-xs text-muted">Worker {version ?? "unknown"}.</p>
    </Panel>
  );
}
