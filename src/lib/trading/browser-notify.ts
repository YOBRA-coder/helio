/**
 * Device notifications for new trades. Runs in the browser, so it works while the app (or its installed
 * PWA) is alive. For alerts with the app fully closed, use the phone-alert URL on the Account page:
 * the worker sends those from the server, 24/7.
 */
import type { DeskState } from "./store.ts";

const KEY = "helios-notify";

export type NotifyState = "unsupported" | "blocked" | "off" | "on";

export function notifyState(): NotifyState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  try {
    return Notification.permission === "granted" && window.localStorage.getItem(KEY) === "1" ? "on" : "off";
  } catch {
    return "off";
  }
}

export async function setNotifications(on: boolean): Promise<NotifyState> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  try {
    if (on && Notification.permission !== "granted") await Notification.requestPermission();
    window.localStorage.setItem(KEY, on && Notification.permission === "granted" ? "1" : "0");
  } catch {
    /* storage blocked: treat as off */
  }
  return notifyState();
}

export async function showNotice(title: string, body: string, tag: string) {
  if (notifyState() !== "on") return;
  const opts: NotificationOptions & { vibrate?: number[]; renotify?: boolean } = {
    body,
    tag,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [140, 70, 140],
    renotify: true,
    data: { url: "/book" },
  };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, opts);
    else new Notification(title, opts);
  } catch {
    /* some browsers refuse; the in-app alerts still work */
  }
}

const short = (q: string) => (q.length > 80 ? `${q.slice(0, 77)}...` : q);

/** Watches the desk store and announces each new order (and each approval request) once. */
export function watchTrades(store: { subscribe: (fn: (s: DeskState) => void) => () => void }): () => void {
  const seen = new Set<string>();
  let primed = false;
  let lastSource = "";
  return store.subscribe((s) => {
    if (!s.booted || s.source === "connecting") return;
    // first sight, or the desk switched between browser and server: remember what exists, announce nothing
    if (!primed || s.source !== lastSource) {
      lastSource = s.source;
      primed = true;
      seen.clear();
      for (const o of s.orders) seen.add(o.id);
      for (const g of s.signals) seen.add(g.id);
      return;
    }
    for (const o of [...s.orders].reverse()) {
      if (seen.has(o.id)) continue;
      seen.add(o.id);
      if (o.kind === "sim-window") continue;
      void showNotice(
        `Trade placed · ${o.side === "yes" ? "Up/Yes" : "Down/No"} $${o.debit.toFixed(2)}`,
        `${o.mode === "auto" ? "Auto paper order" : "Approved paper order"} @ ${o.limitPrice.toFixed(2)}. ${short(o.question)}`,
        `order-${o.id}`,
      );
    }
    for (const g of [...s.signals].reverse()) {
      if (seen.has(g.id)) continue;
      seen.add(g.id);
      if (g.status !== "pending" || g.kind === "sim-window") continue;
      void showNotice(`Approval needed · ${g.side === "yes" ? "Up/Yes" : "Down/No"}`, `@ ${g.executablePrice.toFixed(2)}, expires in 35s. ${short(g.question)}`, `sig-${g.id}`);
    }
  });
}
