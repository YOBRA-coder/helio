/**
 * Accounts on disk: users.json, sessions.json, and a private directory per user.
 * Single web-server process is the only writer of users/sessions; the worker only reads user dirs.
 */
import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { hashPassword, newToken, open, seal, sha256, verifyPassword } from "./crypto.ts";

export interface User {
  id: string;
  email: string;
  hash: string;
  createdAt: number;
  admin: boolean;
}

export interface UserSecrets {
  polyPrivateKey?: string;
  polyFunder?: string;
  polySignatureType?: number;
  polyApiKey?: string;
  polyApiSecret?: string;
  polyApiPassphrase?: string;
  worldMonitorKey?: string;
  webhookUrl?: string;
}

export const SESSION_MS = 30 * 24 * 3_600_000;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

async function writeAtomic(path: string, data: string) {
  const tmp = `${path}.${randomBytes(3).toString("hex")}.tmp`;
  await writeFile(tmp, data, { encoding: "utf8", mode: 0o600 });
  await rename(tmp, path);
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

let chain: Promise<unknown> = Promise.resolve();
/** Serialise read-modify-write cycles inside this process. */
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
}

export class AccountStore {
  root: string;
  env: Record<string, string | undefined>;
  private fails = new Map<string, { n: number; until: number }>();

  constructor(root: string, env: Record<string, string | undefined> = process.env) {
    this.root = root;
    this.env = env;
  }

  userDir(id: string) {
    if (!/^[a-f0-9]{16}$/.test(id)) throw new Error("bad user id");
    return join(this.root, "users", id);
  }

  private async users(): Promise<User[]> {
    return readJson<User[]>(join(this.root, "users.json"), []);
  }

  async signUp(emailRaw: string, password: string): Promise<{ user?: User; error?: string }> {
    const email = emailRaw.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) return { error: "Enter a valid email." };
    if (password.length < 10) return { error: "Use at least 10 characters for the password." };
    if (password.length > 200) return { error: "Password is too long." };
    const hash = await hashPassword(password);
    return locked(async () => {
      await mkdir(this.root, { recursive: true });
      const users = await this.users();
      const first = users.length === 0;
      if (!first && this.env.HELIOS_ALLOW_SIGNUP === "0") return { error: "Sign-up is closed on this server." };
      if (users.some((u) => u.email === email)) return { error: "That email is already registered." };
      const user: User = { id: randomBytes(8).toString("hex"), email, hash, createdAt: Date.now(), admin: first };
      await writeAtomic(join(this.root, "users.json"), JSON.stringify([...users, user]));
      await mkdir(this.userDir(user.id), { recursive: true });
      return { user };
    });
  }

  async signIn(emailRaw: string, password: string, ip = "?"): Promise<{ token?: string; user?: User; error?: string }> {
    const email = emailRaw.trim().toLowerCase();
    const key = `${email}|${ip}`;
    const f = this.fails.get(key);
    if (f && f.n >= 5 && Date.now() < f.until) return { error: "Too many attempts. Try again in a few minutes." };
    const user = (await this.users()).find((u) => u.email === email);
    // Hash even for unknown users so timing does not reveal which emails exist.
    const ok = user ? await verifyPassword(password, user.hash) : (await verifyPassword(password, "s1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA"), false);
    if (!user || !ok) {
      const n = (f && Date.now() < f.until ? f.n : 0) + 1;
      this.fails.set(key, { n, until: Date.now() + 15 * 60_000 });
      return { error: "Email or password is wrong." };
    }
    this.fails.delete(key);
    const token = newToken();
    await locked(async () => {
      const sessions = await this.sessions();
      sessions[sha256(token)] = { userId: user.id, exp: Date.now() + SESSION_MS };
      await this.saveSessions(sessions);
    });
    return { token, user };
  }

  private async sessions(): Promise<Record<string, { userId: string; exp: number }>> {
    const s = await readJson<Record<string, { userId: string; exp: number }>>(join(this.root, "sessions.json"), {});
    const now = Date.now();
    for (const k of Object.keys(s)) if (s[k].exp < now) delete s[k];
    return s;
  }

  private async saveSessions(s: Record<string, { userId: string; exp: number }>) {
    await mkdir(this.root, { recursive: true });
    await writeAtomic(join(this.root, "sessions.json"), JSON.stringify(s));
  }

  async userForToken(token: string | undefined | null): Promise<User | null> {
    if (!token) return null;
    const s = (await this.sessions())[sha256(token)];
    if (!s) return null;
    return (await this.users()).find((u) => u.id === s.userId) ?? null;
  }

  async signOut(token: string | undefined | null) {
    if (!token) return;
    await locked(async () => {
      const s = await this.sessions();
      delete s[sha256(token)];
      await this.saveSessions(s);
    });
  }

  async saveSecrets(userId: string, patch: UserSecrets & { clear?: Array<keyof UserSecrets> }) {
    return locked(async () => {
      const cur = await this.loadSecrets(userId);
      const next: UserSecrets = { ...cur };
      for (const k of patch.clear ?? []) delete next[k];
      for (const [k, v] of Object.entries(patch)) {
        if (k === "clear" || v === undefined || v === "") continue;
        (next as Record<string, unknown>)[k] = typeof v === "string" ? v.trim() : v;
      }
      await mkdir(this.userDir(userId), { recursive: true });
      await writeAtomic(join(this.userDir(userId), "secrets.enc"), seal(JSON.stringify(next), userId, this.env));
    });
  }

  async loadSecrets(userId: string): Promise<UserSecrets> {
    try {
      const blob = await readFile(join(this.userDir(userId), "secrets.enc"), "utf8");
      return JSON.parse(open(blob, userId, this.env)) as UserSecrets;
    } catch {
      return {};
    }
  }

  async deleteUser(userId: string) {
    await locked(async () => {
      const users = (await this.users()).filter((u) => u.id !== userId);
      await writeAtomic(join(this.root, "users.json"), JSON.stringify(users));
      const s = await this.sessions();
      for (const k of Object.keys(s)) if (s[k].userId === userId) delete s[k];
      await this.saveSessions(s);
      await rm(this.userDir(userId), { recursive: true, force: true });
    });
  }

  async listUserIds(): Promise<string[]> {
    try {
      return (await readdir(join(this.root, "users"))).filter((n) => /^[a-f0-9]{16}$/.test(n));
    } catch {
      return [];
    }
  }
}
