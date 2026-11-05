import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AccountStore } from "./store.ts";

const env = { HELIOS_MASTER_KEY: "x".repeat(32) };

test("change password: needs the old one, signs out other sessions, keeps this one", async () => {
  const store = new AccountStore(await mkdtemp(join(tmpdir(), "helios-acc-")), env);
  const { user } = await store.signUp("Me@Example.com", "first-password-1");
  assert.ok(user);
  const a = await store.signIn("me@example.com", "first-password-1");
  const b = await store.signIn("me@example.com", "first-password-1");
  assert.ok(a.token && b.token);
  assert.equal((await store.changePassword(user.id, "wrong-password", "second-password-2", a.token)).ok, false);
  assert.equal((await store.changePassword(user.id, "first-password-1", "short", a.token)).ok, false);
  assert.equal((await store.changePassword(user.id, "first-password-1", "second-password-2", a.token)).ok, true);
  assert.ok(await store.userForToken(a.token), "the session that changed it stays signed in");
  assert.equal(await store.userForToken(b.token), null, "other sessions are signed out");
  assert.equal((await store.signIn("me@example.com", "first-password-1")).token, undefined);
  assert.ok((await store.signIn("me@example.com", "second-password-2")).token);
});

test("operator reset: works without the old password, signs out everywhere, never stores the password in clear", async () => {
  const root = await mkdtemp(join(tmpdir(), "helios-acc-"));
  const store = new AccountStore(root, env);
  await store.signUp("me@example.com", "first-password-1");
  const a = await store.signIn("me@example.com", "first-password-1");
  assert.equal((await store.resetPasswordByEmail("nobody@example.com", "brand-new-pass-9")).ok, false);
  assert.equal((await store.resetPasswordByEmail("ME@example.com", "short")).ok, false);
  assert.equal((await store.resetPasswordByEmail("ME@example.com", "brand-new-pass-9")).ok, true);
  assert.equal(await store.userForToken(a.token), null);
  assert.equal((await store.signIn("me@example.com", "first-password-1")).token, undefined);
  assert.ok((await store.signIn("me@example.com", "brand-new-pass-9")).token);
  assert.ok(!(await readFile(join(root, "users.json"), "utf8")).includes("brand-new-pass-9"));
});
