import { createServerFn } from "@tanstack/react-start";

export interface Me {
  user: { email: string; admin: boolean } | null;
  signupOpen: boolean;
  masterKeySet: boolean;
}

export interface SettingsView {
  masterKeySet: boolean;
  hasPrivateKey: boolean;
  eoaAddress: string | null;
  funder: string | null;
  signatureType: number;
  hasApiCreds: boolean;
  hasWorldMonitor: boolean;
  hasWebhook: boolean;
  liveGloballyEnabled: boolean;
}

type Result = { ok: boolean; error?: string };

export const getMe = createServerFn({ method: "GET" }).handler(async (): Promise<Me> => {
  const { accounts, currentUser } = await import("../accounts/session.server.ts");
  const { hasMasterKey } = await import("../accounts/crypto.ts");
  const u = await currentUser();
  const none = (await accounts().listUserIds()).length === 0;
  return {
    user: u ? { email: u.email, admin: u.admin } : null,
    signupOpen: none || process.env.HELIOS_ALLOW_SIGNUP !== "0",
    masterKeySet: hasMasterKey(),
  };
});

export const signUpFn = createServerFn({ method: "POST" })
  .validator((i: { email: string; password: string }) => i)
  .handler(async ({ data }): Promise<Result> => {
    const s = await import("../accounts/session.server.ts");
    s.assertSameSite();
    const r = await s.accounts().signUp(String(data.email ?? ""), String(data.password ?? ""));
    if (!r.user) return { ok: false, error: r.error };
    const login = await s.accounts().signIn(r.user.email, String(data.password), s.clientIp());
    if (login.token) s.startSession(login.token);
    return { ok: true };
  });

export const signInFn = createServerFn({ method: "POST" })
  .validator((i: { email: string; password: string }) => i)
  .handler(async ({ data }): Promise<Result> => {
    const s = await import("../accounts/session.server.ts");
    s.assertSameSite();
    const r = await s.accounts().signIn(String(data.email ?? ""), String(data.password ?? ""), s.clientIp());
    if (!r.token) return { ok: false, error: r.error };
    s.startSession(r.token);
    return { ok: true };
  });

export const signOutFn = createServerFn({ method: "POST" }).handler(async (): Promise<Result> => {
  const s = await import("../accounts/session.server.ts");
  s.assertSameSite();
  await s.accounts().signOut(s.sessionToken());
  s.endSession();
  return { ok: true };
});

export const getSettings = createServerFn({ method: "GET" }).handler(async (): Promise<SettingsView | null> => {
  const s = await import("../accounts/session.server.ts");
  const { hasMasterKey } = await import("../accounts/crypto.ts");
  const u = await s.currentUser();
  if (!u) return null;
  const sec = await s.accounts().loadSecrets(u.id);
  let eoa: string | null = null;
  if (sec.polyPrivateKey) {
    try {
      const { Wallet } = await import("ethers");
      eoa = new Wallet(sec.polyPrivateKey).address;
    } catch {
      eoa = null;
    }
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
    liveGloballyEnabled: process.env.HELIOS_LIVE_ENABLED === "1",
  };
});

export interface SettingsInput {
  polyPrivateKey?: string;
  polyFunder?: string;
  polySignatureType?: number;
  polyApiKey?: string;
  polyApiSecret?: string;
  polyApiPassphrase?: string;
  worldMonitorKey?: string;
  webhookUrl?: string;
  clear?: Array<"polyPrivateKey" | "polyFunder" | "polyApiKey" | "polyApiSecret" | "polyApiPassphrase" | "worldMonitorKey" | "webhookUrl">;
}

export const saveSettings = createServerFn({ method: "POST" })
  .validator((i: SettingsInput) => i)
  .handler(async ({ data }): Promise<Result> => {
    const s = await import("../accounts/session.server.ts");
    const { hasMasterKey } = await import("../accounts/crypto.ts");
    s.assertSameSite();
    const u = await s.currentUser();
    if (!u) return { ok: false, error: "Sign in first." };
    const patch: SettingsInput = { clear: data.clear };
    const touchesSecret = Boolean(data.polyPrivateKey || data.polyApiKey || data.polyApiSecret || data.polyApiPassphrase || data.worldMonitorKey || data.webhookUrl);
    if (touchesSecret && !hasMasterKey()) return { ok: false, error: "The server has no HELIOS_MASTER_KEY, so it cannot store secrets safely. Ask the operator to set one." };
    if (data.polyPrivateKey) {
      const k = data.polyPrivateKey.trim();
      if (!/^(0x)?[0-9a-fA-F]{64}$/.test(k)) return { ok: false, error: "That does not look like a 32-byte private key." };
      patch.polyPrivateKey = k.startsWith("0x") ? k : `0x${k}`;
    }
    if (data.polyFunder) {
      if (!/^0x[0-9a-fA-F]{40}$/.test(data.polyFunder.trim())) return { ok: false, error: "Funder address must be a 0x… wallet address." };
      patch.polyFunder = data.polyFunder.trim();
    }
    if (data.polySignatureType != null) {
      if (![0, 1, 2].includes(Number(data.polySignatureType))) return { ok: false, error: "Signature type must be 0, 1 or 2." };
      patch.polySignatureType = Number(data.polySignatureType);
    }
    if (data.webhookUrl && !/^https:\/\/[^\s]{8,300}$/.test(data.webhookUrl.trim())) return { ok: false, error: "Webhook must be an https URL." };
    for (const k of ["polyApiKey", "polyApiSecret", "polyApiPassphrase", "worldMonitorKey", "webhookUrl"] as const) {
      if (data[k]) patch[k] = String(data[k]).slice(0, 400);
    }
    await s.accounts().saveSecrets(u.id, patch);
    return { ok: true };
  });

export const testConnection = createServerFn({ method: "POST" }).handler(async () => {
  const s = await import("../accounts/session.server.ts");
  s.assertSameSite();
  const u = await s.currentUser();
  if (!u) return { ok: false, balance: null, allowanceOk: null, messages: ["Sign in first."] };
  const sec = await s.accounts().loadSecrets(u.id);
  if (!sec.polyPrivateKey || !sec.polyFunder) return { ok: false, balance: null, allowanceOk: null, messages: ["Save a private key and funder address first."] };
  const { Hub } = await import("./hub.ts");
  const { checkConnection, loadSdk, safeError } = await import("./live.ts");
  try {
    const sdk = await loadSdk(Hub.sdkEnv(process.env, sec));
    return await checkConnection(sdk);
  } catch (e) {
    return { ok: false, balance: null, allowanceOk: null, messages: [`Could not start the exchange client: ${safeError(e)}`] };
  }
});

export const deleteAccount = createServerFn({ method: "POST" })
  .validator((i: { password: string }) => i)
  .handler(async ({ data }): Promise<Result> => {
    const s = await import("../accounts/session.server.ts");
    s.assertSameSite();
    const u = await s.currentUser();
    if (!u) return { ok: false, error: "Sign in first." };
    const check = await s.accounts().signIn(u.email, String(data.password ?? ""), s.clientIp());
    if (!check.token) return { ok: false, error: "Password is wrong." };
    await s.accounts().deleteUser(u.id);
    s.endSession();
    return { ok: true };
  });
