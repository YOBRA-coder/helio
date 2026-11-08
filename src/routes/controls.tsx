import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AutoBanner, AutoConfirmDialog } from "@/components/auto-status";
import { Button, Panel, ThemeSwatches } from "@/components/widgets";
import { DEFAULT_RISK, MODEL_VERSION } from "@/lib/trading/engine";
import { limitUsage, sanitizeRisk } from "@/lib/trading/ledger";
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

      <AutoBanner />

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

      <PacePanel />

      <Panel title="Risk limits">
        <LimitsForm />
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

      <AutoConfirmDialog open={confirmAuto} onClose={() => setConfirmAuto(false)} />

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

type LimitKey = (typeof LIMIT_KEYS)[number];
interface Field {
  key: LimitKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: "$" | "¢" | "";
  /** shown value = stored value * scale (fees and slippage are stored as fractions of a dollar) */
  scale?: number;
}
const FIELDS: Field[] = [
  { key: "maxStake", label: "Max stake (biggest single bet)", min: 5, max: 1000, step: 5, unit: "$" },
  { key: "minStake", label: "Min stake (smallest single bet)", min: 5, max: 1000, step: 5, unit: "$" },
  { key: "maxExposure", label: "Max open exposure", min: 5, max: 5000, step: 5, unit: "$" },
  { key: "dailyLossLimit", label: "Daily loss limit", min: 2, max: 2000, step: 1, unit: "$" },
  { key: "drawdownLimit", label: "Drawdown breaker", min: 50, max: 3000, step: 10, unit: "$" },
  { key: "maxOrdersPerHour", label: "Orders per hour", min: 1, max: 60, step: 1, unit: "" },
  { key: "minEdge", label: "Minimum net edge (cents per share)", min: 0, max: 20, step: 0.5, unit: "¢", scale: 100 },
  { key: "maxSpread", label: "Max spread (cents)", min: 0.5, max: 20, step: 0.5, unit: "¢", scale: 100 },
  { key: "minLiquidity", label: "Min liquidity", min: 0, max: 100000, step: 100, unit: "$" },
  { key: "feeCoef", label: "Taker fee coefficient (per share, x0.25 = cents at 50¢)", min: 0, max: 0.2, step: 0.005, unit: "" },
  { key: "slippage", label: "Slippage (cents)", min: 0, max: 5, step: 0.1, unit: "¢", scale: 100 },
];
const round = (n: number) => Math.round(n * 1e6) / 1e6;

/**
 * Limits are edited as a draft and applied only when you press Save. Nothing is sent while you drag or type, so a
 * slip of the thumb can no longer change a limit, and you can type an exact number.
 */
function LimitsForm() {
  const risk = useDesk((s) => s.risk);
  const updateRisk = useDesk((s) => s.updateRisk);
  const [draft, setDraft] = useState<Partial<RiskConfig>>(() => pick(risk));
  const [opened] = useState(() => pick(risk));
  const dirty = useMemo(() => LIMIT_KEYS.some((k) => Math.abs(round(draft[k] as number) - round(risk[k] as number)) > 1e-9), [draft, risk]);
  // follow the saved values while there is nothing unsaved (for example after another tab or the worker changed them)
  useEffect(() => {
    if (!dirty) setDraft(pick(risk));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [risk]);
  const same = (v: Partial<RiskConfig>) => LIMIT_KEYS.every((k) => v[k] === undefined || Math.abs((draft[k] as number) - (v[k] as number)) < 1e-9);
  const minOverMax = (draft.minStake as number) > (draft.maxStake as number);
  const save = () => {
    const clean = sanitizeRisk({ ...risk, ...(draft as RiskConfig) });
    const next = pick(clean);
    setDraft(next);
    updateRisk(next);
  };
  return (
    <div>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setDraft({ ...draft, ...p.values })}
            className={`rounded-xl border px-3 py-2 text-left ${same(p.values) ? "border-primary text-primary" : "border-line text-muted"}`}
          >
            <span className="block text-sm font-semibold">{p.name}{same(p.values) ? " · loaded" : ""}</span>
            <span className="block text-xs">{p.note}</span>
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="quiet" onClick={() => setDraft(pick(DEFAULT_RISK))} disabled={same(pick(DEFAULT_RISK))}>Load defaults</Button>
        <Button variant="quiet" onClick={() => setDraft(opened)} disabled={same(opened)}>Load what it was when I opened this page</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {FIELDS.map((f) => (
          <NumberField
            key={f.key}
            field={f}
            value={draft[f.key] as number}
            saved={risk[f.key] as number}
            onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
          />
        ))}
      </div>
      {minOverMax && <p className="mt-3 text-sm text-danger" role="alert">Min stake cannot be bigger than max stake.</p>}
      <div className={`sticky bottom-20 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 md:bottom-4 ${dirty ? "border-primary bg-surface" : "border-line bg-surface"}`}>
        <p className="text-sm">{dirty ? "You have unsaved changes. Nothing is applied until you save." : "All limits are saved."}</p>
        <div className="flex gap-2">
          <Button type="button" variant="quiet" disabled={!dirty} onClick={() => setDraft(pick(risk))}>Discard</Button>
          <Button type="button" disabled={!dirty || minOverMax} onClick={save}>Save limits</Button>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">Model {MODEL_VERSION}. Uncertainty haircut {risk.uncertaintyHaircut}. Freshness window {Math.round(risk.freshnessMs / 1000)}s.</p>
    </div>
  );
}

function NumberField({ field, value, saved, onChange }: { field: Field; value: number; saved: number; onChange: (v: number) => void }) {
  const scale = field.scale ?? 1;
  const shown = round(value * scale);
  const [text, setText] = useState(String(shown));
  // keep the text box in step when the value changes from outside (presets, discard, save)
  useEffect(() => {
    if (round(Number(text) / 1) !== shown) setText(String(shown));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);
  const clampShown = (n: number) => Math.min(field.max, Math.max(field.min, n));
  const set = (n: number) => {
    const c = round(clampShown(n));
    setText(String(c));
    onChange(round(c / scale));
  };
  const changed = Math.abs(round(value) - round(saved)) > 1e-9;
  return (
    <div className="block text-sm">
      <span className="flex items-center justify-between gap-3">
        <label htmlFor={`lim-${field.key}`}>{field.label}</label>
        {changed && <span className="text-xs text-primary">was {round(saved * scale)}{field.unit === "¢" ? "¢" : ""}</span>}
      </span>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" className="h-10 w-10 rounded-lg border border-line text-lg" aria-label={`Decrease ${field.label}`} onClick={() => set(shown - field.step)}>−</button>
        <div className="relative flex-1">
          {field.unit === "$" && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>}
          <input
            id={`lim-${field.key}`}
            className={`h-10 w-full rounded-lg border border-line bg-surface font-mono tabular-nums ${field.unit === "$" ? "pl-6" : "pl-3"} pr-3`}
            type="text"
            inputMode="decimal"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              const n = Number(e.target.value);
              if (e.target.value.trim() !== "" && Number.isFinite(n)) onChange(round(n / scale));
            }}
            onBlur={() => set(Number.isFinite(Number(text)) && text.trim() !== "" ? Number(text) : shown)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
          {field.unit === "¢" && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">¢</span>}
        </div>
        <button type="button" className="h-10 w-10 rounded-lg border border-line text-lg" aria-label={`Increase ${field.label}`} onClick={() => set(shown + field.step)}>+</button>
      </div>
      {/* the slider only moves the draft: it sends nothing, and it never changes a number on its own */}
      <input className="mt-2 w-full touch-pan-y" type="range" min={field.min} max={field.max} step={field.step} value={clampShown(shown)} onChange={(e) => set(Number(e.target.value))} aria-label={`${field.label} slider`} />
    </div>
  );
}


const PACE_OPTIONS: Array<{ id: "selective" | "balanced" | "active"; name: string; text: string }> = [
  { id: "selective", name: "Selective", text: "Acts only in the last 40% of a window and only when BTC is 1.0 sd from the open. Fewest trades, highest hit rate. Can go hours without a bet." },
  { id: "balanced", name: "Balanced", text: "Acts in the last half of a window from 0.75 sd and 1.5¢ edge. A steady flow of trades with the loss guards on." },
  { id: "active", name: "Active", text: "Acts earlier (last 65%) from 0.5 sd and 1¢ edge, prices from 45¢. Most trades, more variance. Use with small stakes." },
];

function PacePanel() {
  const pace = useDesk((s) => s.risk.pace) ?? "balanced";
  const updateRisk = useDesk((s) => s.updateRisk);
  return (
    <Panel title="Trading pace">
      <p className="text-sm text-muted">How readily the bot takes a trade. Every pace keeps the loss guards, the loss-streak slowdown, exposure and daily-loss limits.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {PACE_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={pace === o.id}
            onClick={() => updateRisk({ pace: o.id })}
            className={`rounded-md border p-3 text-left ${pace === o.id ? "border-primary bg-primary-soft" : "border-line bg-raised"}`}
          >
            <span className="text-sm font-semibold">{o.name}</span>
            <span className="mt-1 block text-xs text-muted">{o.text}</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}
