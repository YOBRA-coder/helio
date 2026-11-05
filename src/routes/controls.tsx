import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button, Panel, ThemeSwatches } from "@/components/widgets";
import { DEFAULT_RISK, MODEL_VERSION } from "@/lib/trading/engine";
import { limitUsage } from "@/lib/trading/ledger";
import type { RiskConfig } from "@/lib/trading/types";
import { useDesk } from "@/lib/trading/store";

export const Route = createFileRoute("/controls")({
  head: () => ({ meta: [{ title: "Controls · Helios Desk" }] }),
  component: ControlsPage,
});

const LIMIT_KEYS = ["maxStake", "minStake", "maxExposure", "dailyLossLimit", "drawdownLimit", "maxOrdersPerHour", "minEdge", "maxSpread", "minLiquidity", "feeCoef", "slippage"] as const;
const pick = (r: RiskConfig) => Object.fromEntries(LIMIT_KEYS.map((k) => [k, r[k]])) as Partial<RiskConfig>;
const PRESETS: Array<{ id: string; name: string; note: string; values: Partial<RiskConfig> }> = [
  {
    id: "small",
    name: "Small bets, more trades",
    note: "$5 to $10 per bet, room for ~20 open at once, up to 30 orders an hour",
    values: { maxStake: 10, minStake: 5, maxExposure: 100, dailyLossLimit: 40, drawdownLimit: 100, maxOrdersPerHour: 30, minEdge: 0.02, maxSpread: 0.07, minLiquidity: 1000 },
  },
  { id: "default", name: "Balanced (default)", note: "$5 to $30 per bet, 12 orders an hour", values: pick(DEFAULT_RISK) },
  {
    id: "big",
    name: "Big bets, fewer trades",
    note: "$20 to $100 per bet, only clearer edges, 6 orders an hour",
    values: { maxStake: 100, minStake: 20, maxExposure: 300, dailyLossLimit: 250, drawdownLimit: 400, maxOrdersPerHour: 6, minEdge: 0.03, maxSpread: 0.04, minLiquidity: 3000 },
  },
];

const money = (n: number) => `$${Math.round(n * 100) / 100}`;

function ControlsPage() {
  const mode = useDesk((s) => s.mode);
  const setMode = useDesk((s) => s.setMode);
  const killed = useDesk((s) => s.killed);
  const setKilled = useDesk((s) => s.setKilled);
  const risk = useDesk((s) => s.risk);
  const updateRisk = useDesk((s) => s.updateRisk);
  // limits as they were when this page opened, so one tap can undo experiments
  const [opened] = useState(() => pick(risk));
  const same = (v: Partial<RiskConfig>) => LIMIT_KEYS.every((k) => v[k] === undefined || Math.abs((risk[k] as number) - (v[k] as number)) < 1e-9);
  const circuitKind = useDesk((s) => s.circuitKind);
  const deskCash = useDesk((s) => s.cash);
  const orders = useDesk((s) => s.orders);
  const positions = useDesk((s) => s.positions);
  const dayStartEquity = useDesk((s) => s.dayStartEquity);
  const peakEquity = useDesk((s) => s.peakEquity);
  const scores = useDesk((s) => s.scores);
  const now = useDesk((s) => s.now);
  const usage = limitUsage({ risk, orders, positions, cash: deskCash, dayStartEquity, peakEquity, scores, killed, circuitKind }, now || Date.now());
  const openSlots = Math.max(1, Math.floor(risk.maxExposure / Math.max(1, risk.maxStake)));
  const reconcileNote = useDesk((s) => s.reconcileNote);
  const simulateMismatch = useDesk((s) => s.simulateMismatch);
  const clearMismatch = useDesk((s) => s.clearMismatch);
  const [confirmAuto, setConfirmAuto] = useState(false);
  const [armed, setArmed] = useState(false);
  const [confirmResume, setConfirmResume] = useState(false);

  return (
    <div className="space-y-4">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Limits, themes, and the stop.</h1>
        <p className="mt-2 text-muted">
          Five atmospheres restyle the whole desk. The model cannot raise a risk limit. Auto mode ships off. This
          build never asks for a wallet seed and never sends a live order.
        </p>
      </div>

      <Panel title="Themes">
        <ThemeSwatches />
      </Panel>

      <Panel title="Mode">
        <p className="mb-3 text-sm text-muted">
          Manual asks before every paper order. Auto may submit qualifying paper orders without a click. Switching back
          to manual stops new autonomous submissions. Open paper orders stay working unless the kill switch cancels them.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={mode === "manual" ? "primary" : "quiet"} onClick={() => setMode("manual")}>
            Manual
          </Button>
          <Button type="button" variant={mode === "auto" ? "primary" : "quiet"} onClick={() => setConfirmAuto(true)}>
            Auto
          </Button>
        </div>
      </Panel>

      <Panel title="Kill switch">
        <p className="text-sm text-muted">
          Turning it on blocks every new paper order. {risk.cancelOnKill ? "Resting paper orders are cancelled and their reserved cash returns." : "Resting paper orders are left working."} Positions are not force-closed. A real Polymarket account is not connected, so nothing is cancelled there.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="danger" onClick={() => setKilled(true)} disabled={killed}>
            {killed ? "Emergency stop is on" : "Emergency stop"}
          </Button>
          {killed && (
            <Button type="button" variant="quiet" onClick={() => setConfirmResume(true)}>
              Release stop
            </Button>
          )}
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={risk.cancelOnKill}
            onChange={(event) => updateRisk({ cancelOnKill: event.target.checked })}
          />
          Cancel resting paper orders when the stop is hit
        </label>
      </Panel>

      <Panel title="Where the limits stand right now">
        {usage.stops.length > 0 && (
          <ul className="mb-3 space-y-1 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
            {usage.stops.map((t) => <li key={t}>{t}</li>)}
          </ul>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {usage.rows.map((r) => (
            <div key={r.key} className={`rounded-lg border px-3 py-2 ${r.hit ? "border-danger" : "border-line"}`}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span>{r.label}</span>
                <span className={`font-mono tabular-nums ${r.hit ? "text-danger" : "text-primary"}`}>
                  {r.unit === "$" ? `${money(r.used)} / ${money(r.cap)}` : `${r.used} / ${r.cap}`}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
                <div className={`h-full ${r.hit ? "bg-danger" : "bg-primary"}`} style={{ width: `${Math.min(100, (r.used / Math.max(1e-9, r.cap)) * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted">{r.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          At ${risk.maxStake} max and ${risk.maxExposure} exposure, about {openSlots} full-size bets (or {Math.floor(risk.maxExposure / Math.max(1, risk.minStake))} minimum-size bets) can be open at once.
        </p>
      </Panel>

      <Panel title="How the limits work (and what blocks a signal)">
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
          <li><b>Max / min stake.</b> The max is a ceiling, not the usual bet. A thin edge and a model that has not earned trust yet scale the bet down, but never below the min. Set both to the same amount for flat bets.</li>
          <li><b>Open exposure.</b> Total money in open bets. When it is full, new signals are blocked until windows settle. Small bets leave room for many more open trades.</li>
          <li><b>Orders per hour.</b> A rolling 60 minutes. Busy, volatile hours hit it, then trading pauses until old orders age out. This is the usual reason for "bets, then nothing, then bets again". Raise it, or use small bets so the same exposure covers more trades.</li>
          <li><b>Daily loss and drawdown.</b> Circuit breakers. They pause every new order, not just risky ones. The daily one resets at 00:00 UTC.</li>
          <li><b>Minimum edge, max spread, min liquidity.</b> Quality filters. Loosening them gives more trades and usually worse ones; the win rate on thin edges is where the fees and slippage eat the profit.</li>
          <li><b>Also blocks, not set here.</b> The closer strategy only acts in the last 40% of a window, needs BTC at least 1 standard deviation from the open, and a 55¢ to 97¢ price. After 4 losses in a row it cools off for an hour. Quiet markets simply have no qualifying moment.</li>
        </ul>
        <p className="mt-3 text-xs text-muted">
          More trades is not the same as more profit. Each trade pays about 1¢ to 2¢ per share in fees and slippage, so the extra trades need a real edge to pay for themselves. Check the Trial page before scaling up.
        </p>
      </Panel>

      <Panel title="Risk limits">
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => updateRisk(p.values)}
              className={`rounded-xl border px-3 py-2 text-left ${same(p.values) ? "border-primary text-primary" : "border-line text-muted"}`}
            >
              <span className="block text-sm font-semibold">{p.name}{same(p.values) ? " · active" : ""}</span>
              <span className="block text-xs">{p.note}</span>
            </button>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant="quiet" onClick={() => updateRisk(pick(DEFAULT_RISK))} disabled={same(pick(DEFAULT_RISK))}>Reset to defaults</Button>
          <Button variant="quiet" onClick={() => updateRisk(opened)} disabled={same(opened)}>Undo changes since opening</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Slider label="Max stake (biggest single bet)" value={risk.maxStake} min={5} max={500} step={5} format={(n) => `$${n}`} onChange={(maxStake) => updateRisk({ maxStake })} />
          <Slider label="Min stake (smallest single bet)" value={risk.minStake} min={5} max={Math.max(5, risk.maxStake)} step={5} format={(n) => `$${n}`} onChange={(minStake) => updateRisk({ minStake })} />
          <Slider label="Max open exposure" value={risk.maxExposure} min={5} max={2000} step={5} format={(n) => `$${n}`} onChange={(maxExposure) => updateRisk({ maxExposure })} />
          <Slider label="Daily loss limit" value={risk.dailyLossLimit} min={2} max={1000} step={2} format={(n) => `$${n}`} onChange={(dailyLossLimit) => updateRisk({ dailyLossLimit })} />
          <Slider label="Drawdown breaker" value={risk.drawdownLimit} min={50} max={2000} step={10} format={(n) => `$${n}`} onChange={(drawdownLimit) => updateRisk({ drawdownLimit })} />
          <Slider label="Orders per hour" value={risk.maxOrdersPerHour} min={1} max={60} step={1} format={(n) => String(n)} onChange={(maxOrdersPerHour) => updateRisk({ maxOrdersPerHour })} />
          <Slider label="Minimum net edge" value={risk.minEdge} min={0} max={0.1} step={0.005} format={(n) => n.toFixed(3)} onChange={(minEdge) => updateRisk({ minEdge })} />
          <Slider label="Max spread" value={risk.maxSpread} min={0.01} max={0.12} step={0.005} format={(n) => `${Math.round(n * 100)}¢`} onChange={(maxSpread) => updateRisk({ maxSpread })} />
          <Slider label="Min liquidity" value={risk.minLiquidity} min={0} max={20000} step={100} format={(n) => `$${n}`} onChange={(minLiquidity) => updateRisk({ minLiquidity })} />
          <Slider label="Polymarket taker fee (per share at 50¢)" value={risk.feeCoef} min={0} max={0.1} step={0.005} format={(n) => `${(n * 25).toFixed(2)}¢`} onChange={(feeCoef) => updateRisk({ feeCoef })} />
          <Slider label="Slippage" value={risk.slippage} min={0} max={0.03} step={0.001} format={(n) => `${(n * 100).toFixed(1)}¢`} onChange={(slippage) => updateRisk({ slippage })} />
        </div>
        <p className="mt-3 text-sm text-muted">Model {MODEL_VERSION}. Uncertainty haircut {risk.uncertaintyHaircut}. Freshness window {Math.round(risk.freshnessMs / 1000)}s.</p>
      </Panel>

      <Panel title="Reconciliation">
        <p className="text-sm text-muted">{reconcileNote}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="quiet" onClick={() => simulateMismatch()}>
            Simulate a mismatch
          </Button>
          <Button type="button" variant="quiet" onClick={() => clearMismatch()} disabled={circuitKind !== "reconcile"}>
            Mark reconciled
          </Button>
        </div>
      </Panel>

      <Panel title="Cash, in and out">
        <p className="text-sm text-muted">
          Version one does not accept deposits or process withdrawals, and it does not custody funds. Move collateral
          only through Polymarket. This desk can show paper balances and link you out. It will not claim a transfer
          settled.
        </p>
        <a className="mt-3 inline-flex h-11 items-center font-semibold text-primary" href="https://polymarket.com" target="_blank" rel="noreferrer">
          Open Polymarket
        </a>
      </Panel>

      <Panel title="How to use the desk">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Read a short window or a live Bitcoin contract. If resolution text or the strike is missing, it stays blocked.</li>
          <li>In manual mode, approve a proposal before the timer or the price drift kills it.</li>
          <li>Auto mode is optional and still cannot skip a hard gate. It only places paper orders.</li>
          <li>The kill switch is the emergency stop. Read the line under it so you know whether resting orders cancel.</li>
          <li>Use the lab before you trust any number. Simulated and live results are never mixed, because live results do not exist here.</li>
        </ol>
      </Panel>

      {confirmAuto && (
        <dialog open className="scrim fixed inset-0 z-40 m-0 grid place-items-end p-4 sm:place-items-center">
          <div className="w-full max-w-md rounded-lg border border-line bg-surface p-4" role="dialog" aria-modal="true" aria-labelledby="auto-title">
            <h2 id="auto-title" className="text-lg font-semibold">Enable auto paper mode?</h2>
            <p className="mt-2 text-sm text-muted">
              Qualifying paper orders can submit without another click. Risk gates still apply. This does not connect an exchange account.
            </p>
            <label className="mt-3 flex items-start gap-3 text-sm">
              <input type="checkbox" checked={armed} onChange={(event) => setArmed(event.target.checked)} />
              I understand these are paper orders inside the limits I set.
            </label>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                disabled={!armed}
                onClick={() => {
                  setMode("auto");
                  setConfirmAuto(false);
                  setArmed(false);
                }}
              >
                Enable auto
              </Button>
              <Button type="button" variant="quiet" onClick={() => setConfirmAuto(false)}>
                Keep manual
              </Button>
            </div>
          </div>
        </dialog>
      )}

      {confirmResume && (
        <dialog open className="scrim fixed inset-0 z-40 m-0 grid place-items-end p-4 sm:place-items-center">
          <div className="w-full max-w-md rounded-lg border border-line bg-surface p-4" role="dialog" aria-modal="true">
            <h2 className="text-lg font-semibold">Release the emergency stop?</h2>
            <p className="mt-2 text-sm text-muted">New paper orders will be allowed again. Gates and the daily loss limit still apply.</p>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  setKilled(false);
                  setConfirmResume(false);
                }}
              >
                Release
              </Button>
              <Button type="button" variant="quiet" onClick={() => setConfirmResume(false)}>
                Keep it stopped
              </Button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (value: number) => void;
}) {
  // The thumb follows the finger instantly; the setting is sent once, when the finger lifts.
  const [draft, setDraft] = useState<number | null>(null);
  const timer = useRef<number | null>(null);
  const latest = useRef<number | null>(null);
  const commit = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    if (latest.current != null) onChange(latest.current);
    latest.current = null;
    setDraft(null);
  };
  const shown = draft ?? value;
  return (
    <label className="block text-sm">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-primary">{format(shown)}</span>
      </span>
      <input
        className="mt-2 touch-pan-y"
        type="range"
        min={min}
        max={max}
        step={step}
        value={shown}
        onChange={(event) => {
          const v = Number(event.target.value);
          latest.current = v;
          setDraft(v);
          if (timer.current) window.clearTimeout(timer.current);
          timer.current = window.setTimeout(commit, 700); // safety net if no release event arrives
        }}
        onPointerUp={commit}
        onTouchEnd={commit}
        onKeyUp={commit}
        onBlur={commit}
        aria-label={label}
      />
    </label>
  );
}
