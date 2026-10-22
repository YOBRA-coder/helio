import { Button, Countdown, Panel, Pill, ProbBar } from "@/components/widgets";
import { money, px } from "@/lib/trading/format";
import { useDesk } from "@/lib/trading/store";
import type { Signal } from "@/lib/trading/types";

export function SignalCard({ signal, quiet = false }: { signal: Signal; quiet?: boolean }) {
  const approve = useDesk((s) => s.approve);
  const reject = useDesk((s) => s.reject);
  const dispatch = useDesk((s) => s.dispatch);
  const liveStatus = useDesk((s) => s.live.status);
  const source = useDesk((s) => s.source);
  const risk = useDesk((s) => s.risk);
  const market = useDesk((s) =>
    s.simMarkets.find((m) => m.id === signal.marketId) ?? s.liveMarkets.find((m) => m.id === signal.marketId),
  );
  const touch = market
    ? signal.side === "yes"
      ? market.yesAsk
      : 1 - market.yesBid
    : null;
  const outcome = signal.side === "yes" ? "Yes / Up" : "No / Down";
  const hair = signal.uncertainty * risk.uncertaintyHaircut;
  const fee = signal.executablePrice * risk.feeRate;
  const checkEdge = signal.probability - hair - signal.executablePrice - fee;

  return (
    <Panel
      title={signal.question}
      action={
        <Pill tone={signal.status === "pending" ? "good" : signal.status === "blocked" || signal.status === "expired" ? "bad" : "neutral"}>
          {signal.status}
        </Pill>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Pill>{signal.kind === "live" ? "Polymarket" : "Simulated"}</Pill>
        <Pill>{signal.mode}</Pill>
        <Pill>{outcome}</Pill>
      </div>
      <div className="grid grid-cols-2 gap-3 font-mono text-sm tabular-nums sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted">Model</p>
          <p>{(signal.probability * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted">Limit</p>
          <p>{px(signal.executablePrice)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Stake</p>
          <p>{money(signal.stake)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Net edge</p>
          <p className={signal.edge >= 0 ? "text-primary" : "text-danger"}>{signal.edge.toFixed(3)}</p>
        </div>
      </div>
      {!quiet && (
        <>
          <div className="mt-4">
            <ProbBar model={signal.probability} market={signal.executablePrice} />
            <p className="mt-2 text-xs text-muted">Bar is the model on this side. Marker is the executable price.</p>
          </div>
          <div className="mt-4 rounded-md bg-raised p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted">How the edge is built (per share)</p>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-sm tabular-nums">
              <dt>Model chance this side wins</dt><dd>{signal.probability.toFixed(3)}</dd>
              <dt className="text-muted">− uncertainty haircut (±{(signal.uncertainty * 100).toFixed(1)} pts × {risk.uncertaintyHaircut})</dt><dd>−{hair.toFixed(3)}</dd>
              <dt className="text-muted">− price paid (touch + slippage)</dt><dd>−{signal.executablePrice.toFixed(3)}</dd>
              <dt className="text-muted">− fee ({(risk.feeRate * 100).toFixed(2)}%)</dt><dd>−{fee.toFixed(3)}</dd>
              <dt className="border-t border-line pt-1 font-semibold">Net edge</dt>
              <dd className={`border-t border-line pt-1 font-semibold ${signal.edge >= 0 ? "text-primary" : "text-danger"}`}>{signal.edge.toFixed(3)}</dd>
            </dl>
            <p className="mt-2 text-xs text-muted">
              Market mid for YES was {(signal.marketMid * 100).toFixed(1)}¢; model YES {(signal.pYesBase * 100).toFixed(1)}%
              {Math.abs(signal.pYesCtx - signal.pYesBase) > 0.0005 ? ` (context-adjusted ${(signal.pYesCtx * 100).toFixed(1)}%)` : ""}.
              {Math.abs(checkEdge - signal.edge) > 0.002 ? " Figures may differ slightly if limits changed after this signal." : ""}
            </p>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            {signal.rationale.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <ul className="mt-3 space-y-1 text-sm">
            {signal.risks.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      )}
      {signal.rejectedReason && <p className="mt-3 text-sm text-danger">{signal.rejectedReason}</p>}
      {signal.status === "pending" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={() => approve(signal.id)}>
            Approve paper order
          </Button>
          {liveStatus !== "off" && signal.kind === "live" && source !== "local" && (
            <Button type="button" variant="quiet" onClick={() => void dispatch({ type: "liveSend", signalId: signal.id })}>
              {liveStatus === "armed" ? "Approve + send live" : "Approve + live dry-run"}
            </Button>
          )}
          <Button type="button" variant="quiet" onClick={() => reject(signal.id)}>
            Dismiss
          </Button>
          <p className="text-sm text-muted">
            Expires in <Countdown end={signal.expiresAt} />
            {touch != null && ` · touch now ${px(touch)}`}
          </p>
        </div>
      )}
    </Panel>
  );
}
