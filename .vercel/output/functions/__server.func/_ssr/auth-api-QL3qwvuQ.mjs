import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-api-QL3qwvuQ.js
var getMe_createServerFn_handler = createServerRpc({
	id: "41996e041589bf38c6cace7d166f1e72718dcb5e3bb5f2e11322c833bd6dad24",
	name: "getMe",
	filename: "src/lib/trading/auth-api.ts"
}, (opts) => getMe.__executeServer(opts));
var getMe = createServerFn({ method: "GET" }).handler(getMe_createServerFn_handler, async () => {
	const { accounts, currentUser } = await import("./session.server-DrfJoKi0.mjs");
	const { hasMasterKey } = await import("./crypto-B0JywK9D.mjs").then((n) => n.t);
	const u = await currentUser();
	const none = (await accounts().listUserIds()).length === 0;
	return {
		user: u ? {
			email: u.email,
			admin: u.admin
		} : null,
		signupOpen: none || process.env.HELIOS_ALLOW_SIGNUP !== "0",
		masterKeySet: hasMasterKey()
	};
});
var signUpFn_createServerFn_handler = createServerRpc({
	id: "7a0861cc1111038f043213a2e109ad8c5a26120f56794d21ac926ea908b6d209",
	name: "signUpFn",
	filename: "src/lib/trading/auth-api.ts"
}, (opts) => signUpFn.__executeServer(opts));
var signUpFn = createServerFn({ method: "POST" }).validator((i) => i).handler(signUpFn_createServerFn_handler, async ({ data }) => {
	const s = await import("./session.server-DrfJoKi0.mjs");
	s.assertSameSite();
	const r = await s.accounts().signUp(String(data.email ?? ""), String(data.password ?? ""));
	if (!r.user) return {
		ok: false,
		error: r.error
	};
	const login = await s.accounts().signIn(r.user.email, String(data.password), s.clientIp());
	if (login.token) s.startSession(login.token);
	return { ok: true };
});
var signInFn_createServerFn_handler = createServerRpc({
	id: "fa5e9f7b3a10dbfe7e312dc5834fdea67cd504686ee884e80714c3381ccdf5a2",
	name: "signInFn",
	filename: "src/lib/trading/auth-api.ts"
}, (opts) => signInFn.__executeServer(opts));
var signInFn = createServerFn({ method: "POST" }).validator((i) => i).handler(signInFn_createServerFn_handler, async ({ data }) => {
	const s = await import("./session.server-DrfJoKi0.mjs");
	s.assertSameSite();
	const r = await s.accounts().signIn(String(data.email ?? ""), String(data.password ?? ""), s.clientIp());
	if (!r.token) return {
		ok: false,
		error: r.error
	};
	s.startSession(r.token);
	return { ok: true };
});
var signOutFn_createServerFn_handler = createServerRpc({
	id: "90c30146b3cd35dea9a368bf061e162d2d80141362bcaf36b6f9b514027791b3",
	name: "signOutFn",
	filename: "src/lib/trading/auth-api.ts"
}, (opts) => signOutFn.__executeServer(opts));
var signOutFn = createServerFn({ method: "POST" }).handler(signOutFn_createServerFn_handler, async () => {
	const s = await import("./session.server-DrfJoKi0.mjs");
	s.assertSameSite();
	await s.accounts().signOut(s.sessionToken());
	s.endSession();
	return { ok: true };
});
var getSettings_createServerFn_handler = createServerRpc({
	id: "8673949ba5aa0f1785fabaee3557b443fdde93d2e18ad891572525cab7a78833",
	name: "getSettings",
	filename: "src/lib/trading/auth-api.ts"
}, (opts) => getSettings.__executeServer(opts));
var getSettings = createServerFn({ method: "GET" }).handler(getSettings_createServerFn_handler, async () => {
	const s = await import("./session.server-DrfJoKi0.mjs");
	const { hasMasterKey } = await import("./crypto-B0JywK9D.mjs").then((n) => n.t);
	const u = await s.currentUser();
	if (!u) return null;
	const sec = await s.accounts().loadSecrets(u.id);
	let eoa = null;
	if (sec.polyPrivateKey) try {
		const { Wallet } = await import("../_libs/ethers.mjs").then((n) => n.t);
		eoa = new Wallet(sec.polyPrivateKey).address;
	} catch {
		eoa = null;
	}
	return {
		masterKeySet: hasMasterKey(),
		hasPrivateKey: Boolean(sec.polyPrivateKey),
		eoaAddress: eoa,
		funder: sec.polyFunder ?? null,
		signatureType: sec.polySignatureType ?? 2,
		hasApiCreds: Boolean(sec.polyApiKey && sec.polyApiSecret && sec.polyApiPassphrase),
		hasWorldMonitor: Boolean(sec.worldMonitorKey),
		hasWebhook: Boolean(sec.webhookUrl),
		liveGloballyEnabled: process.env.HELIOS_LIVE_ENABLED === "1"
	};
});
var saveSettings_createServerFn_handler = createServerRpc({
	id: "03ba1b308e4858380baf7b9ea35b04c2c5b5b59b505c9c5c146a36243d02a009",
	name: "saveSettings",
	filename: "src/lib/trading/auth-api.ts"
}, (opts) => saveSettings.__executeServer(opts));
var saveSettings = createServerFn({ method: "POST" }).validator((i) => i).handler(saveSettings_createServerFn_handler, async ({ data }) => {
	const s = await import("./session.server-DrfJoKi0.mjs");
	const { hasMasterKey } = await import("./crypto-B0JywK9D.mjs").then((n) => n.t);
	s.assertSameSite();
	const u = await s.currentUser();
	if (!u) return {
		ok: false,
		error: "Sign in first."
	};
	const patch = { clear: data.clear };
	if (Boolean(data.polyPrivateKey || data.polyApiKey || data.polyApiSecret || data.polyApiPassphrase || data.worldMonitorKey || data.webhookUrl) && !hasMasterKey()) return {
		ok: false,
		error: "The server has no HELIOS_MASTER_KEY, so it cannot store secrets safely. Ask the operator to set one."
	};
	if (data.polyPrivateKey) {
		const k = data.polyPrivateKey.trim();
		if (!/^(0x)?[0-9a-fA-F]{64}$/.test(k)) return {
			ok: false,
			error: "That does not look like a 32-byte private key."
		};
		patch.polyPrivateKey = k.startsWith("0x") ? k : `0x${k}`;
	}
	if (data.polyFunder) {
		if (!/^0x[0-9a-fA-F]{40}$/.test(data.polyFunder.trim())) return {
			ok: false,
			error: "Funder address must be a 0x… wallet address."
		};
		patch.polyFunder = data.polyFunder.trim();
	}
	if (data.polySignatureType != null) {
		if (![
			0,
			1,
			2
		].includes(Number(data.polySignatureType))) return {
			ok: false,
			error: "Signature type must be 0, 1 or 2."
		};
		patch.polySignatureType = Number(data.polySignatureType);
	}
	if (data.webhookUrl && !/^https:\/\/[^\s]{8,300}$/.test(data.webhookUrl.trim())) return {
		ok: false,
		error: "Webhook must be an https URL."
	};
	for (const k of [
		"polyApiKey",
		"polyApiSecret",
		"polyApiPassphrase",
		"worldMonitorKey",
		"webhookUrl"
	]) if (data[k]) patch[k] = String(data[k]).slice(0, 400);
	await s.accounts().saveSecrets(u.id, patch);
	return { ok: true };
});
var testConnection_createServerFn_handler = createServerRpc({
	id: "f6f7aadbe2bca34250f9c39f8535ea0ba5313ff85d9dbc8cb5cf686e0dfe13f0",
	name: "testConnection",
	filename: "src/lib/trading/auth-api.ts"
}, (opts) => testConnection.__executeServer(opts));
var testConnection = createServerFn({ method: "POST" }).handler(testConnection_createServerFn_handler, async () => {
	const s = await import("./session.server-DrfJoKi0.mjs");
	s.assertSameSite();
	const u = await s.currentUser();
	if (!u) return {
		ok: false,
		balance: null,
		allowanceOk: null,
		messages: ["Sign in first."]
	};
	const sec = await s.accounts().loadSecrets(u.id);
	if (!sec.polyPrivateKey || !sec.polyFunder) return {
		ok: false,
		balance: null,
		allowanceOk: null,
		messages: ["Save a private key and funder address first."]
	};
	const { Hub } = await import("./hub-B4dajWE6.mjs");
	const { checkConnection, loadSdk, safeError } = await import("./live-ab9wFk_-.mjs");
	try {
		return await checkConnection(await loadSdk(Hub.sdkEnv(process.env, sec)));
	} catch (e) {
		return {
			ok: false,
			balance: null,
			allowanceOk: null,
			messages: [`Could not start the exchange client: ${safeError(e)}`]
		};
	}
});
var deleteAccount_createServerFn_handler = createServerRpc({
	id: "7803d5d212e09a58b9287ee117cf0791595efd16e86ac99d6839baef979bc881",
	name: "deleteAccount",
	filename: "src/lib/trading/auth-api.ts"
}, (opts) => deleteAccount.__executeServer(opts));
var deleteAccount = createServerFn({ method: "POST" }).validator((i) => i).handler(deleteAccount_createServerFn_handler, async ({ data }) => {
	const s = await import("./session.server-DrfJoKi0.mjs");
	s.assertSameSite();
	const u = await s.currentUser();
	if (!u) return {
		ok: false,
		error: "Sign in first."
	};
	if (!(await s.accounts().signIn(u.email, String(data.password ?? ""), s.clientIp())).token) return {
		ok: false,
		error: "Password is wrong."
	};
	await s.accounts().deleteUser(u.id);
	s.endSession();
	return { ok: true };
});
//#endregion
export { deleteAccount_createServerFn_handler, getMe_createServerFn_handler, getSettings_createServerFn_handler, saveSettings_createServerFn_handler, signInFn_createServerFn_handler, signOutFn_createServerFn_handler, signUpFn_createServerFn_handler, testConnection_createServerFn_handler };
