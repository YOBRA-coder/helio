import { a as getCookie, i as deleteCookie$1, o as getRequestHeader, s as setCookie$1 } from "./ssr.mjs";
import { dataDir } from "./desk-io-e10SEdvf.mjs";
import { a as seal, i as open, n as hashPassword, o as sha256, r as newToken, s as verifyPassword } from "./crypto-B0JywK9D.mjs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/session.server-DrfJoKi0.js
/**
* Accounts on disk: users.json, sessions.json, and a private directory per user.
* Single web-server process is the only writer of users/sessions; the worker only reads user dirs.
*/
var SESSION_MS = 2592e6;
var EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
async function writeAtomic(path, data) {
	const tmp = `${path}.${randomBytes(3).toString("hex")}.tmp`;
	await writeFile(tmp, data, {
		encoding: "utf8",
		mode: 384
	});
	await rename(tmp, path);
}
async function readJson(path, fallback) {
	try {
		return JSON.parse(await readFile(path, "utf8"));
	} catch {
		return fallback;
	}
}
var chain = Promise.resolve();
/** Serialise read-modify-write cycles inside this process. */
function locked(fn) {
	const run = chain.then(fn, fn);
	chain = run.catch(() => {});
	return run;
}
var AccountStore = class {
	root;
	env;
	fails = /* @__PURE__ */ new Map();
	constructor(root, env = process.env) {
		this.root = root;
		this.env = env;
	}
	userDir(id) {
		if (!/^[a-f0-9]{16}$/.test(id)) throw new Error("bad user id");
		return join(this.root, "users", id);
	}
	async users() {
		return readJson(join(this.root, "users.json"), []);
	}
	async signUp(emailRaw, password) {
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
			const user = {
				id: randomBytes(8).toString("hex"),
				email,
				hash,
				createdAt: Date.now(),
				admin: first
			};
			await writeAtomic(join(this.root, "users.json"), JSON.stringify([...users, user]));
			await mkdir(this.userDir(user.id), { recursive: true });
			return { user };
		});
	}
	async signIn(emailRaw, password, ip = "?") {
		const email = emailRaw.trim().toLowerCase();
		const key = `${email}|${ip}`;
		const f = this.fails.get(key);
		if (f && f.n >= 5 && Date.now() < f.until) return { error: "Too many attempts. Try again in a few minutes." };
		const user = (await this.users()).find((u) => u.email === email);
		const ok = user ? await verifyPassword(password, user.hash) : (await verifyPassword(password, "s1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA"), false);
		if (!user || !ok) {
			const n = (f && Date.now() < f.until ? f.n : 0) + 1;
			this.fails.set(key, {
				n,
				until: Date.now() + 9e5
			});
			return { error: "Email or password is wrong." };
		}
		this.fails.delete(key);
		const token = newToken();
		await locked(async () => {
			const sessions = await this.sessions();
			sessions[sha256(token)] = {
				userId: user.id,
				exp: Date.now() + SESSION_MS
			};
			await this.saveSessions(sessions);
		});
		return {
			token,
			user
		};
	}
	async sessions() {
		const s = await readJson(join(this.root, "sessions.json"), {});
		const now = Date.now();
		for (const k of Object.keys(s)) if (s[k].exp < now) delete s[k];
		return s;
	}
	async saveSessions(s) {
		await mkdir(this.root, { recursive: true });
		await writeAtomic(join(this.root, "sessions.json"), JSON.stringify(s));
	}
	async userForToken(token) {
		if (!token) return null;
		const s = (await this.sessions())[sha256(token)];
		if (!s) return null;
		return (await this.users()).find((u) => u.id === s.userId) ?? null;
	}
	async signOut(token) {
		if (!token) return;
		await locked(async () => {
			const s = await this.sessions();
			delete s[sha256(token)];
			await this.saveSessions(s);
		});
	}
	async saveSecrets(userId, patch) {
		return locked(async () => {
			const next = { ...await this.loadSecrets(userId) };
			for (const k of patch.clear ?? []) delete next[k];
			for (const [k, v] of Object.entries(patch)) {
				if (k === "clear" || v === void 0 || v === "") continue;
				next[k] = typeof v === "string" ? v.trim() : v;
			}
			await mkdir(this.userDir(userId), { recursive: true });
			await writeAtomic(join(this.userDir(userId), "secrets.enc"), seal(JSON.stringify(next), userId, this.env));
		});
	}
	async loadSecrets(userId) {
		try {
			const blob = await readFile(join(this.userDir(userId), "secrets.enc"), "utf8");
			return JSON.parse(open(blob, userId, this.env));
		} catch {
			return {};
		}
	}
	async deleteUser(userId) {
		await locked(async () => {
			const users = (await this.users()).filter((u) => u.id !== userId);
			await writeAtomic(join(this.root, "users.json"), JSON.stringify(users));
			const s = await this.sessions();
			for (const k of Object.keys(s)) if (s[k].userId === userId) delete s[k];
			await this.saveSessions(s);
			await rm(this.userDir(userId), {
				recursive: true,
				force: true
			});
		});
	}
	async listUserIds() {
		try {
			return (await readdir(join(this.root, "users"))).filter((n) => /^[a-f0-9]{16}$/.test(n));
		} catch {
			return [];
		}
	}
};
/** Request-bound session helpers. MUST keep the `.server` suffix: imports the start server runtime. */
var COOKIE = "helios_session";
var store = null;
function accounts() {
	store ??= new AccountStore(dataDir(), process.env);
	return store;
}
/** Block cross-site POSTs: when the browser sends an Origin, it must match our host. */
function assertSameSite() {
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
function clientIp() {
	return (getRequestHeader("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
}
function startSession(token) {
	const secure = getRequestHeader("x-forwarded-proto") === "https" || process.env.HELIOS_COOKIE_SECURE === "1";
	setCookie$1(COOKIE, token, {
		httpOnly: true,
		sameSite: "lax",
		secure,
		path: "/",
		maxAge: Math.floor(SESSION_MS / 1e3)
	});
}
function endSession() {
	deleteCookie$1(COOKIE, { path: "/" });
}
async function currentUser() {
	return accounts().userForToken(getCookie(COOKIE));
}
function sessionToken() {
	return getCookie(COOKIE);
}
//#endregion
export { accounts, assertSameSite, clientIp, currentUser, endSession, sessionToken, startSession };
