import { Link, useRouterState } from "@tanstack/react-router";
import {
  Ban,
  Bell,
  Crosshair,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  Radar,
  ScrollText,
  SlidersHorizontal,
  UserRound,
  Wallet,
  Zap,
} from "lucide-react";
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { MODEL_VERSION, THEMES } from "@/lib/trading/engine";
import { remain } from "@/lib/trading/format";
import { useDesk } from "@/lib/trading/store";

const NAV = [
  { to: "/", label: "Desk", icon: LayoutDashboard },
  { to: "/markets", label: "Markets", icon: Radar },
  { to: "/signals", label: "Signals", icon: Crosshair },
  { to: "/book", label: "Book", icon: Wallet },
  { to: "/trial", label: "Trial", icon: Gauge },
  { to: "/live", label: "Live", icon: Zap },
  { to: "/lab", label: "Lab", icon: FlaskConical },
  { to: "/audit", label: "Audit", icon: ScrollText },
  { to: "/controls", label: "Limits", icon: SlidersHorizontal },
  { to: "/account", label: "Account", icon: UserRound },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const killed = useDesk((s) => s.killed);
  const mode = useDesk((s) => s.mode);
  const circuitKind = useDesk((s) => s.circuitKind);
  const source = useDesk((s) => s.source);
  const email = useDesk((s) => s.email);
  const signedIn = useDesk((s) => s.signedIn);
  const liveStatusVenue = useDesk((s) => s.live.status);
  const heartbeatAgeMs = useDesk((s) => s.heartbeatAgeMs);
  const setKilled = useDesk((s) => s.setKilled);
  const alerts = useDesk((s) => s.alerts);
  const markAlertsRead = useDesk((s) => s.markAlertsRead);
  const [open, setOpen] = useState(false);
  const unread = alerts.filter((a) => !a.read).length;
  const page = NAV.find((item) => item.to === pathname)?.label ?? "Desk";

  return (
    <div className="min-h-screen text-fg">
      <header className="chrome sticky top-0 z-30 border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-fg">
              <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
                <circle cx="16" cy="16" r="4.5" fill="currentColor" />
                <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold tracking-tight">Helios Desk</span>
              <span className="block text-xs text-muted">BTC trader · {MODEL_VERSION}</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={cn(
                "hidden rounded-full px-3 py-1 text-xs font-medium sm:inline",
                liveStatusVenue === "armed" ? "bg-danger text-danger-fg" : "bg-primary-soft text-primary",
              )}
            >
              {liveStatusVenue === "armed" ? "LIVE ARMED" : liveStatusVenue === "dry" ? "Paper + live dry-run" : "Paper"}
            </span>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                mode === "auto" ? "bg-primary text-primary-fg" : "bg-raised text-fg",
              )}
            >
              {mode === "auto" ? "Auto" : "Manual"}
            </span>
            <Link
              to={signedIn ? "/account" : "/login"}
              className="hidden h-11 items-center rounded-lg border border-line bg-surface px-3 text-sm sm:inline-flex"
            >
              {signedIn ? (email ?? "Account") : "Sign in"}
            </Link>
            <button
              type="button"
              className="relative grid size-11 place-items-center rounded-lg border border-line bg-surface"
              aria-label="Alerts"
              onClick={() => {
                setOpen((v) => !v);
                markAlertsRead();
              }}
            >
              <Bell className="size-4" />
              {unread > 0 && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-danger" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setKilled(!killed)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-transform duration-150 ease-out active:scale-[0.96]",
                killed ? "bg-danger text-danger-fg" : "border border-line bg-surface text-fg",
              )}
            >
              <Ban className="size-4" />
              {killed ? "Stopped" : "Kill"}
            </button>
          </div>
        </div>
        {open && (
          <div className="mx-auto max-w-6xl px-4 pb-4">
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="px-2 pb-2 text-xs uppercase tracking-wide text-muted">Alerts</p>
              {alerts.length === 0 && <p className="px-2 text-sm text-muted">No alerts yet.</p>}
              <ul className="max-h-64 space-y-2 overflow-auto">
                {alerts.slice(0, 8).map((alert) => (
                  <li key={alert.id} className="rounded-md bg-raised px-3 py-2">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-sm text-muted">{alert.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-5 md:grid-cols-[12rem_1fr]">
        <nav className="hidden md:block">
          <ul className="sticky top-24 space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex h-11 items-center gap-2 rounded-md px-3 text-sm",
                      active ? "bg-primary-soft font-medium text-primary" : "text-muted hover:bg-raised hover:text-fg",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main className="min-w-0 pb-24 md:pb-10">
          <div className="glow pointer-events-none -mx-4 -mt-5 mb-4 h-16" />
          <div className="mb-4 flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{page}</p>
            <ThemeRail />
          </div>
          {source === "local" && (
            <div className="mb-4 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
              Browser desk: paper trading runs in this tab only and stops when you close it.{" "}
              {signedIn ? (
                <>Your account is signed in, but the worker has not started your desk yet (<span className="font-mono">npm run worker</span>).</>
              ) : (
                <><Link to="/login" className="underline">Sign in</Link> to get a 24/7 desk with your own keys and record.</>
              )}
            </div>
          )}
          {source === "server-offline" && (
            <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm">
              The desk worker is offline{heartbeatAgeMs != null ? ` (last seen ${Math.round(heartbeatAgeMs / 1000)}s ago)` : ""}. Numbers below are the last saved state.
              Restart it with <span className="font-mono">npm run worker</span>.
            </div>
          )}
          {(killed || circuitKind) && (
            <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-4 py-3 text-sm">
              {killed
                ? "Kill switch is on. New paper orders are blocked. Resting orders follow the cancel policy in Controls. Open positions stay put."
                : circuitKind === "reconcile"
                  ? "Reconciliation drill is active. New paper orders are paused."
                  : circuitKind === "daily"
                    ? "Daily loss limit is active. New paper orders are paused."
                    : "Drawdown breaker is active. New paper orders are paused."}
            </div>
          )}
          {children}
          <p className="mt-8 text-sm text-muted">
            Paper-first research desk. Live orders are off unless you configure, pass the trial gate, and arm them. No custody, no promised win rate. Deposits and withdrawals stay on Polymarket.
          </p>
        </main>
      </div>

      <nav className="chrome fixed inset-x-0 bottom-0 z-30 border-t border-line md:hidden">
        <ul className="flex overflow-x-auto">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <li key={item.to} className="min-w-[4.25rem] flex-1">
                <Link
                  to={item.to}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-1 px-0.5 text-xs",
                    active ? "bg-primary-soft text-primary" : "text-muted",
                  )}
                >
                  <Icon className="size-4" />
                  <span className="w-full truncate text-center">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-line bg-surface p-4", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "quiet" | "danger" | "ghost";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-transform duration-150 ease-out active:not-disabled:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "bg-primary text-primary-fg",
        variant === "quiet" && "border border-line bg-raised text-fg",
        variant === "danger" && "bg-danger text-danger-fg",
        variant === "ghost" && "bg-transparent text-fg",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "bad";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        tone === "neutral" && "bg-raised text-muted",
        tone === "good" && "bg-primary-soft text-primary",
        tone === "bad" && "bg-danger-soft text-danger",
      )}
    >
      {children}
    </span>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl font-medium tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Spark({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) {
    return <div className={cn("h-20 rounded-md bg-raised", className)} />;
  }
  const w = 320;
  const h = 84;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const line = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - 8 - ((v - min) / span) * (h - 16);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const last = data[data.length - 1];
  const first = data[0];
  const up = last >= first;
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-24 w-full", up ? "text-primary" : "text-danger", className)} aria-hidden="true">
      <path d={area} fill="currentColor" opacity="0.16" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function ProbBar({ model, market }: { model: number; market: number }) {
  const m = Math.min(100, Math.max(0, model * 100));
  const k = Math.min(100, Math.max(0, market * 100));
  return (
    <div className="relative h-2 rounded-full bg-raised" title="Bar is the model. Marker is the market.">
      <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${m}%` }} />
      <div className="absolute -top-1 h-4 w-0.5 bg-fg" style={{ left: `${k}%` }} />
    </div>
  );
}

export function ThemeRail() {
  const theme = useDesk((s) => s.theme);
  const setTheme = useDesk((s) => s.setTheme);
  const active = THEMES.find((item) => item.id === theme) ?? THEMES[0];
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {THEMES.map((item) => {
          const on = theme === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => setTheme(item.id)}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium",
                on ? "border-primary bg-primary-soft text-fg" : "border-line bg-surface text-muted",
              )}
            >
              <span data-theme={item.id} className="size-2.5 rounded-full bg-primary" />
              {item.name}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-muted">{active.line}</p>
    </div>
  );
}
export function ThemeSwatches() {
  const theme = useDesk((s) => s.theme);
  const setTheme = useDesk((s) => s.setTheme);
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {THEMES.map((item) => (
        <button
          key={item.id}
          type="button"
          data-theme={item.id}
          aria-pressed={theme === item.id}
          onClick={() => setTheme(item.id)}
          className={cn(
            "rounded-lg border bg-bg p-4 text-left text-fg",
            theme === item.id ? "border-primary" : "border-line",
          )}
        >
          <span className="mb-3 flex gap-2">
            <span className="h-10 flex-1 rounded-md border border-line bg-surface" />
            <span className="h-10 w-10 rounded-md bg-primary" />
            <span className="h-10 w-6 rounded-md bg-danger" />
          </span>
          <span className="block text-sm font-semibold">{item.name}</span>
          <span className="mt-1 block text-sm text-muted">{item.line}</span>
        </button>
      ))}
    </div>
  );
}

export function Countdown({ end }: { end: number }) {
  const now = useDesk((s) => s.now);
  return <span className="font-mono tabular-nums">{now ? remain(end - now) : "—"}</span>;
}
