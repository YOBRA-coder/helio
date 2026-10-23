import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Panel, ThemeSwatches } from "@/components/widgets";
import { MODEL_VERSION } from "@/lib/trading/engine";
import { useDesk } from "@/lib/trading/store";

export const Route = createFileRoute("/controls")({
  head: () => ({ meta: [{ title: "Controls · Helios Desk" }] }),
  component: ControlsPage,
});

function ControlsPage() {
  const mode = useDesk((s) => s.mode);
  const setMode = useDesk((s) => s.setMode);
  const killed = useDesk((s) => s.killed);
  const setKilled = useDesk((s) => s.setKilled);
  const risk = useDesk((s) => s.risk);
  const updateRisk = useDesk((s) => s.updateRisk);
  const circuitKind = useDesk((s) => s.circuitKind);
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

      <Panel title="Risk limits">
        <div className="grid gap-4 md:grid-cols-2">
          <Slider label="Max stake" value={risk.maxStake} min={1} max={500} step={1} format={(n) => `$${n}`} onChange={(maxStake) => updateRisk({ maxStake })} />
          <Slider label="Max open exposure" value={risk.maxExposure} min={5} max={2000} step={5} format={(n) => `$${n}`} onChange={(maxExposure) => updateRisk({ maxExposure })} />
          <Slider label="Daily loss limit" value={risk.dailyLossLimit} min={2} max={1000} step={2} format={(n) => `$${n}`} onChange={(dailyLossLimit) => updateRisk({ dailyLossLimit })} />
          <Slider label="Drawdown breaker" value={risk.drawdownLimit} min={50} max={2000} step={10} format={(n) => `$${n}`} onChange={(drawdownLimit) => updateRisk({ drawdownLimit })} />
          <Slider label="Orders per hour" value={risk.maxOrdersPerHour} min={1} max={30} step={1} format={(n) => String(n)} onChange={(maxOrdersPerHour) => updateRisk({ maxOrdersPerHour })} />
          <Slider label="Minimum net edge" value={risk.minEdge} min={0} max={0.1} step={0.005} format={(n) => n.toFixed(3)} onChange={(minEdge) => updateRisk({ minEdge })} />
          <Slider label="Max spread" value={risk.maxSpread} min={0.01} max={0.12} step={0.005} format={(n) => `${Math.round(n * 100)}¢`} onChange={(maxSpread) => updateRisk({ maxSpread })} />
          <Slider label="Min liquidity" value={risk.minLiquidity} min={0} max={20000} step={100} format={(n) => `$${n}`} onChange={(minLiquidity) => updateRisk({ minLiquidity })} />
          <Slider label="Fee assumption" value={risk.feeRate} min={0} max={0.03} step={0.001} format={(n) => `${(n * 100).toFixed(1)}%`} onChange={(feeRate) => updateRisk({ feeRate })} />
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
  return (
    <label className="block text-sm">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-primary">{format(value)}</span>
      </span>
      <input
        className="mt-2"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
    </label>
  );
}
