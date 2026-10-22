/** Password hashing and secret sealing. Node-only (imported from server code and the worker). */
import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>;
const SCRYPT = { N: 1 << 15, r: 8, p: 1, maxmem: 128 * 1024 * 1024 };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, SCRYPT);
  return `s1$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [v, saltB64, keyB64] = stored.split("$");
  if (v !== "s1" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const got = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, SCRYPT);
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function masterKey(env: Record<string, string | undefined>): Buffer | null {
  const raw = env.HELIOS_MASTER_KEY?.trim();
  if (!raw || raw.length < 16) return null;
  return createHash("sha256").update(raw).digest();
}

export function hasMasterKey(env: Record<string, string | undefined> = process.env) {
  return masterKey(env) != null;
}

/** AES-256-GCM. `aad` binds the blob to its owner so one user's file cannot be swapped into another's. */
export function seal(plain: string, aad: string, env: Record<string, string | undefined> = process.env): string {
  const key = masterKey(env);
  if (!key) throw new Error("HELIOS_MASTER_KEY is not set (need 16+ characters)");
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  c.setAAD(Buffer.from(aad));
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1.${iv.toString("base64")}.${c.getAuthTag().toString("base64")}.${ct.toString("base64")}`;
}

export function open(blob: string, aad: string, env: Record<string, string | undefined> = process.env): string {
  const key = masterKey(env);
  if (!key) throw new Error("HELIOS_MASTER_KEY is not set");
  const [v, iv, tag, ct] = blob.split(".");
  if (v !== "v1" || !iv || !tag || !ct) throw new Error("bad blob");
  const d = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  d.setAAD(Buffer.from(aad));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
}
