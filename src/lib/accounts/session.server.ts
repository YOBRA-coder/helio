/** Request-bound session helpers. MUST keep the `.server` suffix: imports the start server runtime. */
import { deleteCookie, getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";
import { AccountStore, SESSION_MS, type User } from "./store.ts";
import { dataDir } from "../trading/desk-io.ts";

export const COOKIE = "helios_session";

let store: AccountStore | null = null;
export function accounts(): AccountStore {
  store ??= new AccountStore(dataDir(), process.env);
  return store;
}

/** Block cross-site POSTs: when the browser sends an Origin, it must match our host. */
export function assertSameSite() {
  const origin = getRequestHeader("origin");
  const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host");
  if (!origin || !host) return;
  let oh = "";
  try {
    oh = new URL(origin).host;
  } catch {
    throw new Error("Bad origin");
  }
  if (oh !== host) throw new Error("Cross-site request refused");
}

export function clientIp(): string {
  return (getRequestHeader("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
}

export function startSession(token: string) {
  const secure = getRequestHeader("x-forwarded-proto") === "https" || process.env.HELIOS_COOKIE_SECURE === "1";
  setCookie(COOKIE, token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: Math.floor(SESSION_MS / 1000) });
}

export function endSession() {
  deleteCookie(COOKIE, { path: "/" });
}

export async function currentUser(): Promise<User | null> {
  return accounts().userForToken(getCookie(COOKIE));
}

export function sessionToken() {
  return getCookie(COOKIE);
}
