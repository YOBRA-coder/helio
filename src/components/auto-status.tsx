import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/widgets";
import { circuitMessage } from "@/lib/trading/engine";
import { coolOffReason } from "@/lib/trading/ledger";
import { useDesk } from "@/lib/trading/store";

export interface AutoHealth {
  state: "manual" | "ok" | "stalled";
  title: string;
  /** what is wrong, in plain words (empty when fine) */
  problems: string[];
  /** auto trading of paper orders is on but real-money (live) auto is not connected */
  liveAutoOff: boolean;
}

/** One answer to "is auto actually trading?", from what the desk already knows. Works whether or not auto is already on. */
export function useAutoHealth(): AutoHealth {
  const mode = useDesk((s) => s.mode);
  const killed = useDesk((s) => s.killed);
  const circuit = useDesk((s) => s.circuitKind);
  const source = useDesk((s) => s.source);
  const scores = useDesk((s) => s.scores);
  const now = useDesk((s) => s.now);
  const live = useDesk((s) => s.live);
  const liveAutoOff = live.status !== "armed" || !live.auto;
  if (mode !== "auto") return { state: "manual", title: "Auto is off: every order waits for your tap", problems: [], liveAutoOff };
  const problems: string[] = [];
  if (killed) problems.push("The emergency stop is on, so nothing is being placed.");
  if (circuit) problems.push(circuitMessage(circuit as "daily" | "drawdown" | "reconcile"));
  if (source === "server-offline") problems.push("The desk worker is offline. Auto cannot place anything until it is back.");
  const cool = coolOffReason(scores, now || Date.now());
  if (cool) problems.push(cool);
  return problems.length
    ? { state: "stalled", title: "Auto is on but not trading", problems, liveAutoOff }
    : { state: "ok", title: "Auto is on and watching", problems, liveAutoOff };
}

export function AutoConfirmDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setMode = useDesk((s) => s.setMode);
  const mode = useDesk((s) => s.mode);
  const [armed, setArmed] = useState(false);
  if (!open) return null;
  return (
    <dialog open className="scrim fixed inset-0 z-40 m-0 grid place-items-end p-4 sm:place-items-center">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-4" role="dialog" aria-modal="true" aria-labelledby="auto-title">
        <h2 id="auto-title" className="text-lg font-semibold">{mode === "auto" ? "Reconnect auto paper mode?" : "Enable auto paper mode?"}</h2>
        <p className="mt-2 text-sm text-muted">
          Qualifying paper orders can submit without another click. Risk gates still apply. This does not connect an exchange account.
          {mode === "auto" ? " Auto is already on; this re-sends the setting so the worker picks it up again." : ""}
        </p>
        <label className="mt-3 flex items-start gap-3 text-sm">
          <input type="checkbox" checked={armed} onChange={(e) => setArmed(e.target.checked)} />
          I understand these are paper orders inside the limits I set.
        </label>
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            disabled={!armed}
            onClick={() => {
              setMode("auto");
              setArmed(false);
              onClose();
            }}
          >
            {mode === "auto" ? "Reconnect auto" : "Enable auto"}
          </Button>
          <Button type="button" variant="quiet" onClick={onClose}>
            Not now
          </Button>
        </div>
      </div>
    </dialog>
  );
}

/**
 * Always-visible auto status with the next step. It prompts when auto is off, when it is on but stalled, and, even
 * when auto is already on, when the live (real-money) auto link is not connected.
 */
export function AutoBanner() {
  const h = useAutoHealth();
  const killed = useDesk((s) => s.killed);
  const setKilled = useDesk((s) => s.setKilled);
  const [dlg, setDlg] = useState(false);
  const [hideLive, setHideLive] = useState(() => {
    try {
      return window.sessionStorage.getItem("helios.hideLiveAuto") === "1";
    } catch {
      return false;
    }
  });
  const showLive = h.state === "ok" && h.liveAutoOff && !hideLive;
  // Healthy paper auto needs no banner. Show it only when auto is off, stalled, or live auto is not set up yet.
  if (h.state === "ok" && !showLive) return <AutoConfirmDialog open={dlg} onClose={() => setDlg(false)} />;
  const tone = h.state === "stalled" ? "border-danger bg-danger-soft" : h.state === "ok" ? "border-line bg-surface" : "border-primary bg-primary-soft";
  return (
    <>
      <section className={`rounded-lg border px-4 py-3 ${tone}`} aria-label="Auto trading status">
        {h.state !== "ok" ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{h.title}</p>
              {h.problems.map((p) => (
                <p key={p} className="mt-1 text-sm text-muted">{p}</p>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {h.state === "manual" && <Button type="button" onClick={() => setDlg(true)}>Turn on auto</Button>}
              {h.state === "stalled" && killed && <Button type="button" variant="quiet" onClick={() => setKilled(false)}>Release stop</Button>}
              {h.state === "stalled" && <Button type="button" variant="quiet" onClick={() => setDlg(true)}>Reconnect auto</Button>}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted">Paper auto is running. Live auto (real orders) is not connected.</span>
            <span className="flex gap-2">
              <Link to="/live" className="font-semibold text-primary">Set up live auto</Link>
              <button
                type="button"
                className="text-muted"
                onClick={() => {
                  setHideLive(true);
                  try {
                    window.sessionStorage.setItem("helios.hideLiveAuto", "1");
                  } catch {
                    /* ignore */
                  }
                }}
              >
                Later
              </button>
            </span>
          </div>
        )}
      </section>
      <AutoConfirmDialog open={dlg} onClose={() => setDlg(false)} />
    </>
  );
}
