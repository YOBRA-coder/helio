import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Panel } from "@/components/widgets";
import { getMe, signInFn, signUpFn, type Me } from "@/lib/trading/auth-api";
import { useDesk } from "@/lib/trading/store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · Helios Desk" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const setEmailState = useDesk((s) => s.setEmail);
  const [me, setMe] = useState<Me | null>(null);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getMe().then((m) => {
      setMe(m);
      if (!m.user && m.signupOpen && (m as Me & { first?: boolean }).first) setMode("up");
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = mode === "up" ? await signUpFn({ data: { email, password } }) : await signInFn({ data: { email, password } });
      if (!res.ok) {
        setError(res.error ?? "Could not sign in.");
        return;
      }
      setEmailState(email.trim().toLowerCase());
      await useDesk.getState().syncServer();
      await nav({ to: "/" });
    } catch {
      setError("The server did not answer. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{mode === "in" ? "Open your desk." : "Make your desk."}</h1>
        <p className="mt-2 text-muted">
          Each account gets its own paper book, trial record, limits, and exchange keys. Nobody else can see or control yours.
        </p>
      </div>
      <Panel>
        <div className="mb-4 flex gap-2">
          <button type="button" onClick={() => setMode("in")} className={mode === "in" ? "h-11 flex-1 rounded-md bg-primary text-sm font-semibold text-primary-fg" : "h-11 flex-1 rounded-md border border-line bg-surface text-sm"}>
            Sign in
          </button>
          <button type="button" disabled={me ? !me.signupOpen : false} onClick={() => setMode("up")} className={mode === "up" ? "h-11 flex-1 rounded-md bg-primary text-sm font-semibold text-primary-fg" : "h-11 flex-1 rounded-md border border-line bg-surface text-sm disabled:opacity-40"}>
            Sign up
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Email</span>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-md border border-line bg-raised px-3" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Password {mode === "up" && "(10+ characters)"}</span>
            <input type="password" required minLength={mode === "up" ? 10 : 1} autoComplete={mode === "up" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 w-full rounded-md border border-line bg-raised px-3" />
          </label>
          {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Working…" : mode === "in" ? "Sign in" : "Create account"}
          </Button>
        </form>
        {me && !me.signupOpen && <p className="mt-3 text-sm text-muted">Sign-up is closed on this server. Ask the operator for an account.</p>}
        <p className="mt-3 text-xs text-muted">Passwords are hashed with scrypt and never stored in clear. There is no password reset by email: the operator can delete an account so you can re-register.</p>
      </Panel>
      <p className="text-sm text-muted">Not ready? The desk also runs a paper-only browser version without an account; it stops when you close the tab.</p>
    </div>
  );
}
