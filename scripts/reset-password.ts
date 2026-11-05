/**
 * Operator password reset. Run on the server that holds the data folder:
 *   npm run reset-password -- you@example.com            (prints a new random password)
 *   npm run reset-password -- you@example.com 'MyNewPass123'
 * Also used at boot when HELIOS_RESET_EMAIL and HELIOS_RESET_PASSWORD are both set (see scripts/start-all.mjs).
 * The account is signed out everywhere. Saved exchange keys and the desk are untouched.
 */
import { randomBytes } from "node:crypto";
import { AccountStore } from "../src/lib/accounts/store.ts";
import { dataDir } from "../src/lib/trading/desk-io.ts";

const [email, given] = process.argv.slice(2);
if (!email) {
  console.error("Usage: npm run reset-password -- <email> [new password, 10+ characters]");
  process.exit(2);
}
const password = given || randomBytes(12).toString("base64url");
const store = new AccountStore(dataDir(), process.env);
const r = await store.resetPasswordByEmail(email, password);
if (!r.ok) {
  console.error(`[reset-password] ${r.error}`);
  process.exit(1);
}
console.log(`[reset-password] password changed for ${email.trim().toLowerCase()} and all sessions signed out`);
if (!given) console.log(`[reset-password] new password: ${password}`);
