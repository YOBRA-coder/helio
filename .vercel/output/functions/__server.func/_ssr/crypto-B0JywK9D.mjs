import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
//#region node_modules/.nitro/vite/services/ssr/assets/crypto-B0JywK9D.js
/** Password hashing and secret sealing. Node-only (imported from server code and the worker). */
var crypto_exports = /* @__PURE__ */ __exportAll({
	hasMasterKey: () => hasMasterKey,
	hashPassword: () => hashPassword,
	newToken: () => newToken,
	open: () => open,
	seal: () => seal,
	sha256: () => sha256,
	verifyPassword: () => verifyPassword
});
var scrypt$1 = promisify(scrypt);
var SCRYPT = {
	N: 32768,
	r: 8,
	p: 1,
	maxmem: 134217728
};
async function hashPassword(password) {
	const salt = randomBytes(16);
	const key = await scrypt$1(password, salt, 64, SCRYPT);
	return `s1$${salt.toString("base64")}$${key.toString("base64")}`;
}
async function verifyPassword(password, stored) {
	const [v, saltB64, keyB64] = stored.split("$");
	if (v !== "s1" || !saltB64 || !keyB64) return false;
	const expected = Buffer.from(keyB64, "base64");
	const got = await scrypt$1(password, Buffer.from(saltB64, "base64"), expected.length, SCRYPT);
	return got.length === expected.length && timingSafeEqual(got, expected);
}
function newToken() {
	return randomBytes(32).toString("base64url");
}
function sha256(s) {
	return createHash("sha256").update(s).digest("hex");
}
function masterKey(env) {
	const raw = env.HELIOS_MASTER_KEY?.trim();
	if (!raw || raw.length < 16) return null;
	return createHash("sha256").update(raw).digest();
}
function hasMasterKey(env = process.env) {
	return masterKey(env) != null;
}
/** AES-256-GCM. `aad` binds the blob to its owner so one user's file cannot be swapped into another's. */
function seal(plain, aad, env = process.env) {
	const key = masterKey(env);
	if (!key) throw new Error("HELIOS_MASTER_KEY is not set (need 16+ characters)");
	const iv = randomBytes(12);
	const c = createCipheriv("aes-256-gcm", key, iv);
	c.setAAD(Buffer.from(aad));
	const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
	return `v1.${iv.toString("base64")}.${c.getAuthTag().toString("base64")}.${ct.toString("base64")}`;
}
function open(blob, aad, env = process.env) {
	const key = masterKey(env);
	if (!key) throw new Error("HELIOS_MASTER_KEY is not set");
	const [v, iv, tag, ct] = blob.split(".");
	if (v !== "v1" || !iv || !tag || !ct) throw new Error("bad blob");
	const d = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
	d.setAAD(Buffer.from(aad));
	d.setAuthTag(Buffer.from(tag, "base64"));
	return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
}
//#endregion
export { seal as a, open as i, hashPassword as n, sha256 as o, newToken as r, verifyPassword as s, crypto_exports as t };
