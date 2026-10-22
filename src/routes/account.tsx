import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Panel, Pill } from "@/components/widgets";
import {
  deleteAccount, getMe, getSettings, saveSettings, signOutFn, testConnection,
  type Me, type SettingsInput, type SettingsView,
} from "@/lib/trading/auth-api";
import { exportBackup, restoreBackup } from "@/lib/trading/desk-api";
import { downloadText } from "@/lib/trading/format";
import { useDesk } from "@/lib/trading/store";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account · Helios Desk" }] }),
  component: AccountPage,
});

type Report = { ok: boolean; balance: number | null; allowanceOk: boolean | null; messages: string[] };

function AccountPage() {
  const nav = useNavigate();
  const setEmailState = useDesk((s) => s.setEmail);
  const [me, setMe] = useState<Me | null>(null);
  const [view, setView] = useState<SettingsView | null>(null);
  const [f, setF] = useState({ key: "", funder: "", sig: "2", apiKey: "", apiSecret: "", apiPass: "", wm: "", hook: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [delPw, setDelPw] = useState("");

  const load = async () => {
    const [m, s] = await Promise.all([getMe(), getSettings()]);
    setMe(m);
    setView(s);
    if (s) setF((p) => ({ ...p, sig: String(s.signatureType) }));
  };
  useEffect(() => {
    void load();
  }, []);

  async function save(input: SettingsInput, done: string) {
    setBusy(true);
    setMsg(null);
    const r = await saveSettings({ data: input }).catch(() => ({ ok: false, error: "Server did not answer." }));
    setMsg(r.ok ? done : (r.error ?? "Could not save."));
    if (r.ok) {
      setF((p) => ({ ...p, key: "", apiKey: "", apiSecret: "", apiPass: "", wm: "", hook: "" }));
      await load();
    }
    setBusy(false);
  }

  if (me && !me.user) {
    return (
      <Panel title="Account">
        <p className="text-sm text-muted">You are not signed in. <a className="underline" href="/login">Sign in or create an account</a>.</p>
      </Panel>
    );
  }

  const input = "h-11 w-full rounded-md border border-line bg-raised px-3 font-mono text-sm";
  return (
    <div className="space-y-4">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Your keys, your desk.</h1>
        <p className="mt-2 text-muted">
          Signed in as <span className="font-mono">{me?.user?.email}</span>. Keys are encrypted on the server with AES-256-GCM
          and only the trading worker can read them. They are never sent back to this page.
        </p>
      </div>

      {view && !view.masterKeySet && (
        <p className="rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm text-danger">
          This server has no <span className="font-mono">HELIOS_MASTER_KEY</span>, so it will not store secrets. The operator must set a long random value and restart.
        </p>
      )}
      {msg && <p className="rounded-lg border border-line bg-surface px-4 py-3 text-sm" role="status">{msg}</p>}

      <Panel title="Polymarket trading wallet" action={<Pill tone={view?.hasPrivateKey ? "good" : "neutral"}>{view?.hasPrivateKey ? "Key saved" : "Not set"}</Pill>}>
        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Use a dedicated wallet holding only what you can lose. Never your main wallet.</li>
          <li>The funder is the wallet that holds the USDC (your Polymarket proxy address); the private key signs for it.</li>
          <li>You can paste the key once; to change it, paste a new one. To remove it, use Remove.</li>
        </ul>
        {view?.eoaAddress && <p className="mb-3 text-sm">Signer address: <span className="font-mono">{view.eoaAddress}</span></p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-muted">Private key</span>
            <input type="password" autoComplete="off" value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })} placeholder={view?.hasPrivateKey ? "•••••••• saved (paste to replace)" : "0x…"} className={input} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Funder address</span>
            <input value={f.funder} onChange={(e) => setF({ ...f, funder: e.target.value })} placeholder={view?.funder ?? "0x…"} className={input} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Signature type</span>
            <select value={f.sig} onChange={(e) => setF({ ...f, sig: e.target.value })} className={input}>
              <option value="0">0 · plain wallet (EOA)</option>
              <option value="1">1 · Polymarket proxy (email/Magic)</option>
              <option value="2">2 · Safe wallet (most browser-wallet accounts)</option>
            </select>
          </label>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-muted">Optional: existing CLOB API credentials {view?.hasApiCreds && "(saved)"}</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <input type="password" autoComplete="off" value={f.apiKey} onChange={(e) => setF({ ...f, apiKey: e.target.value })} placeholder="API key" className={input} />
            <input type="password" autoComplete="off" value={f.apiSecret} onChange={(e) => setF({ ...f, apiSecret: e.target.value })} placeholder="Secret" className={input} />
            <input type="password" autoComplete="off" value={f.apiPass} onChange={(e) => setF({ ...f, apiPass: e.target.value })} placeholder="Passphrase" className={input} />
          </div>
          <p className="mt-2 text-muted">Leave empty to derive them from the private key.</p>
        </details>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => void save({ polyPrivateKey: f.key || undefined, polyFunder: f.funder || undefined, polySignatureType: Number(f.sig), polyApiKey: f.apiKey || undefined, polyApiSecret: f.apiSecret || undefined, polyApiPassphrase: f.apiPass || undefined }, "Wallet settings saved.")}>
            Save wallet
          </Button>
          <Button type="button" variant="quiet" disabled={busy || !view?.hasPrivateKey} onClick={async () => { setBusy(true); setReport(null); setReport(await testConnection()); setBusy(false); }}>
            Test connection
          </Button>
          <Button type="button" variant="quiet" disabled={busy || !view?.hasPrivateKey} onClick={() => void save({ clear: ["polyPrivateKey", "polyFunder", "polyApiKey", "polyApiSecret", "polyApiPassphrase"] }, "Wallet keys removed.")}>
            Remove keys
          </Button>
        </div>
        {report && (
          <div className={`mt-3 rounded-md px-3 py-2 text-sm ${report.ok ? "bg-primary-soft" : "bg-danger-soft text-danger"}`} role="status">
            {report.messages.map((m) => <p key={m}>{m}</p>)}
          </div>
        )}
        <p className="mt-3 text-xs text-muted">
          Live trading also needs the operator to enable it ({view?.liveGloballyEnabled ? "enabled on this server" : "currently disabled on this server"}) and your paper trial to pass the gate.
        </p>
      </Panel>

      <Panel title="World Monitor (optional)" action={<Pill tone={view?.hasWorldMonitor ? "good" : "neutral"}>{view?.hasWorldMonitor ? "Key saved" : "Not set"}</Pill>}>
        <p className="mb-3 text-sm text-muted">Needs a paid World Monitor API plan. Without it Helios uses free sources only: Polymarket crowd odds and the Fear &amp; Greed index.</p>
        <input type="password" autoComplete="off" value={f.wm} onChange={(e) => setF({ ...f, wm: e.target.value })} placeholder={view?.hasWorldMonitor ? "•••••••• saved" : "wm_…"} className={input} />
        <div className="mt-3 flex gap-2">
          <Button type="button" disabled={busy || !f.wm} onClick={() => void save({ worldMonitorKey: f.wm }, "World Monitor key saved. It takes effect within two minutes.")}>Save</Button>
          <Button type="button" variant="quiet" disabled={busy || !view?.hasWorldMonitor} onClick={() => void save({ clear: ["worldMonitorKey"] }, "World Monitor key removed.")}>Remove</Button>
        </div>
      </Panel>

      <Panel title="Alerts webhook (optional)" action={<Pill tone={view?.hasWebhook ? "good" : "neutral"}>{view?.hasWebhook ? "Set" : "Not set"}</Pill>}>
        <p className="mb-3 text-sm text-muted">A phone alert URL. Works with ntfy (https://ntfy.sh/your-secret-topic, then install the ntfy app), Telegram (https://api.telegram.org/bot{"<token>"}/sendMessage?chat_id={"<id>"}), Discord or Slack webhooks. You get a message for settled trades, a daily summary, live orders, breaker trips and disarms.</p>
        <input value={f.hook} onChange={(e) => setF({ ...f, hook: e.target.value })} placeholder={view?.hasWebhook ? "saved (paste to replace)" : "https://…"} className={input} />
        <div className="mt-3 flex gap-2">
          <Button type="button" disabled={busy || !f.hook} onClick={() => void save({ webhookUrl: f.hook }, "Webhook saved.")}>Save</Button>
          <Button type="button" variant="quiet" disabled={busy || !view?.hasWebhook} onClick={() => void save({ clear: ["webhookUrl"] }, "Webhook removed.")}>Remove</Button>
        </div>
      </Panel>

      <Panel title="Backup and restore">
        <p className="mb-3 text-sm text-muted">
          Download your whole paper desk (book, trial record, limits). Saved keys and your password are never included. Restoring replaces the
          current desk, keeps the old one as a one-step backup on the server, and always comes back with live trading off.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" disabled={busy} onClick={async () => {
            const r = await exportBackup().catch(() => ({ ok: false, error: "Server did not answer." } as { ok: boolean; error?: string; filename?: string; json?: string }));
            if (r.ok && r.json && r.filename) { downloadText(r.filename, r.json); setMsg("Backup downloaded."); } else setMsg(r.error ?? "Could not export.");
          }}>Download backup</Button>
          <label className="inline-flex h-11 cursor-pointer items-center rounded-md border border-line bg-surface px-4 text-sm font-medium">
            Restore from file
            <input type="file" accept="application/json,.json" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (!window.confirm("Replace the current desk with this backup? Live trading will be switched off.")) return;
              const r = await restoreBackup({ data: { json: await file.text() } }).catch(() => ({ ok: false, error: "Server did not answer." }));
              setMsg(r.ok ? "Backup sent. The worker applies it within a few seconds." : (r.error ?? "Could not restore."));
            }} />
          </label>
        </div>
      </Panel>

      <Panel title="Session">
        <Button type="button" variant="quiet" onClick={async () => { await signOutFn(); setEmailState(null); await useDesk.getState().syncServer(); await nav({ to: "/login" }); }}>
          Sign out
        </Button>
      </Panel>

      <Panel title="Delete account">
        <p className="mb-3 text-sm text-muted">Removes your desk, trial record, and saved keys from the server. Any open live orders are not cancelled by this, so flatten and disarm first.</p>
        <div className="flex flex-wrap gap-2">
          <input type="password" autoComplete="current-password" value={delPw} onChange={(e) => setDelPw(e.target.value)} placeholder="Password" className="h-11 rounded-md border border-line bg-raised px-3 text-sm" />
          <Button type="button" variant="danger" disabled={!delPw || busy} onClick={async () => {
            const r = await deleteAccount({ data: { password: delPw } });
            if (r.ok) { setEmailState(null); await nav({ to: "/login" }); } else setMsg(r.error ?? "Could not delete.");
          }}>Delete everything</Button>
        </div>
      </Panel>
    </div>
  );
}
