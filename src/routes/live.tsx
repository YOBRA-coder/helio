import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Panel, Pill, Stat } from "@/components/widgets";
import { ARM_PHRASE, LIVE_CEILING } from "@/lib/trading/live-const";
import { clock, money, signedMoney } from "@/lib/trading/format";
import { useDesk } from "@/lib/trading/store";

export const Route = createFileRoute("/live")({
  head: () => ({ meta: [{ title: "Live · Helios Desk" }] }),
  component: LivePage,
});

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className={ok ? "text-primary" : "text-danger"} aria-hidden="true">{ok ? "✓" : "✗"}</span>
      <span>{children}</span>
    </li>
  );
}

function LivePage() {
  const live = useDesk((s) => s.live);
  const env = useDesk((s) => s.liveEnv);
  const trial = useDesk((s) => s.trial);
  const source = useDesk((s) => s.source);
  const killed = useDesk((s) => s.killed);
  const dispatch = useDesk((s) => s.dispatch);
  const note = useDesk((s) => s.commandNote);
  const signedIn = useDesk((s) => s.signedIn);
  const [phrase, setPhrase] = useState("");
  const [stake, setStake] = useState<string>("");
  const [expo, setExpo] = useState<string>("");
  const [loss, setLoss] = useState<string>("");

  const serverOk = source === "server";
  const envOk = signedIn && env.enabled && env.hasKey && env.hasFunder;
  const eligible = Boolean(trial?.eligible);
  const openExposure = live.orders
    .filter((o) => o.status === "open" || (o.status === "filled" && !o.settled))
    .reduce((a, o) => a + o.debit, 0);

  return (
    <div className="space-y-4">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Live is a door with four locks.</h1>
        <p className="mt-2 text-muted">
          Paper keeps running underneath, so you can see how far live fills drift from the simulation. Real orders need the
          your saved keys, a passed paper trial, and a typed confirmation. They go out only inside small caps,
          and the kill switch disarms them.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Status" value={live.status === "armed" ? "ARMED" : live.status === "dry" ? "Dry run" : "Off"} hint={live.armedAt ? `since ${clock(live.armedAt)}` : undefined} />
        <Stat label="Live P&L" value={signedMoney(live.realized)} hint={`today ${signedMoney(live.dayRealized)}`} />
        <Stat label="Open live exposure" value={money(openExposure)} hint={`cap ${money(live.maxExposure)}`} />
        <Stat label="Exchange cash" value={live.exchangeCash != null ? money(live.exchangeCash) : "—"} hint={live.lastReconcileAt ? `checked ${clock(live.lastReconcileAt)}` : "not checked"} />
      </div>

      {note && <p className="rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm text-danger">{note}</p>}
      {live.lastError && <p className="rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm text-danger">Last live error: {live.lastError}</p>}

      <Panel title="Checklist">
        <ul className="space-y-2">
          <Check ok={serverOk}>Server worker is running (live never runs from the browser tab).</Check>
          <Check ok={signedIn}>You are signed in (live is tied to your account).</Check>
          <Check ok={env.enabled}>The operator turned live trading on for this server (HELIOS_LIVE_ENABLED=1).</Check>
          <Check ok={env.hasKey && env.hasFunder}>Your signing key and funder address are saved on the <Link to="/account" className="underline">Account</Link> page. They are never sent back to the browser.</Check>
          <Check ok={eligible}>
            Paper trial passed the gate ({trial ? `${trial.checks.filter((c) => c.pass).length}/${trial.checks.length}` : "0/0"} checks). Dry run does not need this; arming does.
          </Check>
          <Check ok={!killed}>Kill switch is released.</Check>
        </ul>
      </Panel>

      <Panel title="Mode">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={live.status === "off" ? "primary" : "quiet"} onClick={() => void dispatch({ type: "liveSetStatus", status: "off" })}>
            Off
          </Button>
          <Button type="button" variant={live.status === "dry" ? "primary" : "quiet"} disabled={!serverOk || !envOk} onClick={() => void dispatch({ type: "liveSetStatus", status: "dry" })}>
            Dry run (sign, don’t post)
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted">Run the dry mode for a day first. It builds and signs the exact orders without sending them, so you can check sizes and prices in the audit log.</p>
        <div className="mt-4 rounded-lg border border-danger p-3">
          <p className="text-sm font-medium">Arm live trading</p>
          <p className="mt-1 text-sm text-muted">Type <span className="font-mono">{ARM_PHRASE}</span> to enable the button.</p>
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-line bg-raised px-3 text-sm"
            placeholder={ARM_PHRASE}
            autoComplete="off"
          />
          <Button
            type="button"
            variant="danger"
            className="mt-3"
            disabled={!serverOk || !envOk || !eligible || killed || phrase !== ARM_PHRASE}
            onClick={() => {
              void dispatch({ type: "liveSetStatus", status: "armed", confirm: phrase });
              setPhrase("");
            }}
          >
            Arm live
          </Button>
        </div>
      </Panel>

      <Panel title="Caps">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Max per order ($, ≤ {LIVE_CEILING.maxStake})</span>
            <input value={stake} onChange={(e) => setStake(e.target.value)} placeholder={String(live.maxStake)} inputMode="decimal" className="h-11 w-full rounded-md border border-line bg-raised px-3 font-mono" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Max open exposure ($, ≤ {LIVE_CEILING.maxExposure})</span>
            <input value={expo} onChange={(e) => setExpo(e.target.value)} placeholder={String(live.maxExposure)} inputMode="decimal" className="h-11 w-full rounded-md border border-line bg-raised px-3 font-mono" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Daily loss stop ($, ≤ {LIVE_CEILING.dailyLossLimit})</span>
            <input value={loss} onChange={(e) => setLoss(e.target.value)} placeholder={String(live.dailyLossLimit)} inputMode="decimal" className="h-11 w-full rounded-md border border-line bg-raised px-3 font-mono" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="quiet"
            onClick={() => {
              void dispatch({
                type: "liveUpdate",
                maxStake: stake ? Number(stake) : undefined,
                maxExposure: expo ? Number(expo) : undefined,
                dailyLossLimit: loss ? Number(loss) : undefined,
              });
              setStake("");
              setExpo("");
              setLoss("");
            }}
          >
            Save caps
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={live.auto}
              disabled={live.status === "off"}
              onChange={(e) => void dispatch({ type: "liveUpdate", auto: e.target.checked })}
            />
            Mirror every executed paper signal live (auto)
          </label>
        </div>
        <p className="mt-2 text-sm text-muted">With auto off, only signals you press “Approve + send live” on go out.</p>
      </Panel>

      <Panel title="Live orders" action={<Pill>{live.orders.length}</Pill>}>
        <ul className="space-y-2 text-sm">
          {live.orders.slice(0, 20).map((o) => (
            <li key={o.id} className="rounded-md bg-raised px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate">{o.question}</span>
                <Pill tone={o.status === "filled" || o.status === "open" ? "good" : o.status === "error" || o.status === "rejected" ? "bad" : "neutral"}>{o.status}</Pill>
              </div>
              <p className="mt-1 font-mono text-xs tabular-nums text-muted">
                {o.side.toUpperCase()} {o.size} @ {o.price.toFixed(2)} · {clock(o.submittedAt)}
                {o.pnl != null ? ` · P&L ${signedMoney(o.pnl)}` : ""}
              </p>
              {o.note && <p className="mt-1 text-xs text-muted">{o.note}</p>}
            </li>
          ))}
          {live.orders.length === 0 && <li className="text-muted">No live or dry-run orders yet.</li>}
        </ul>
      </Panel>

      <Panel title="Before you put money in">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Check Polymarket’s current terms and whether trading is permitted where you are. Helios does not route around regional restrictions, and neither should you.</li>
          <li>This module has been tested against a mock exchange only. Dry-run first, then start with the smallest caps.</li>
          <li>Paper fills are friendlier than real ones: queue position, partial fills, and fees on the taker side all cost more live.</li>
          <li>Keep only what you can lose in the funder wallet.</li>
        </ul>
      </Panel>
    </div>
  );
}
