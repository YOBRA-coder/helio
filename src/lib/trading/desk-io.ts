/**
 * Node-only persistence shared by the worker (writer) and the server functions (reader/enqueuer).
 * One writer: the worker. Everything else sends commands through the queue directory.
 */
import { randomBytes } from "node:crypto";
import { mkdir, readdir, readFile, rename, unlink, writeFile, appendFile, copyFile } from "node:fs/promises";
import { join } from "node:path";
import type { DeskCommand, DeskCore } from "./types.ts";

export const HEARTBEAT_STALE_MS = 20_000;

export function dataDir(env: Record<string, string | undefined> = process.env) {
  return env.HELIOS_DATA_DIR?.trim() || join(process.cwd(), "data");
}

export interface Snapshot {
  core: DeskCore;
  heartbeat: number;
  workerStartedAt: number;
  workerVersion: string;
  tapeAt: number;
  quotesAt: number;
  feedError: string | null;
  liveEnv: { enabled: boolean; hasKey: boolean; hasFunder: boolean; hasOwnerToken: boolean };
  lastCommandNote: string | null;
}

export async function writeAtomic(path: string, data: string) {
  const tmp = `${path}.${process.pid}.${randomBytes(3).toString("hex")}.tmp`;
  await writeFile(tmp, data, "utf8");
  await rename(tmp, path);
}

export async function writeSnapshot(dir: string, snap: Snapshot) {
  await mkdir(dir, { recursive: true });
  await writeAtomic(join(dir, "desk.json"), JSON.stringify(snap));
}

export async function backupSnapshot(dir: string) {
  try {
    await copyFile(join(dir, "desk.json"), join(dir, "desk.bak.json"));
  } catch {
    /* nothing to back up yet */
  }
}

export async function readSnapshot(dir: string): Promise<Snapshot | null> {
  for (const name of ["desk.json", "desk.bak.json"]) {
    try {
      const parsed = JSON.parse(await readFile(join(dir, name), "utf8")) as Snapshot;
      if (parsed && typeof parsed === "object" && parsed.core) return parsed;
    } catch {
      /* try the backup */
    }
  }
  return null;
}

export async function appendJournal(dir: string, rows: unknown[]) {
  if (rows.length === 0) return;
  await mkdir(dir, { recursive: true });
  await appendFile(join(dir, "journal.jsonl"), rows.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
}

export async function enqueueCommand(dir: string, cmd: DeskCommand) {
  const qdir = join(dir, "commands");
  await mkdir(qdir, { recursive: true });
  const name = `${Date.now().toString().padStart(15, "0")}-${randomBytes(4).toString("hex")}.json`;
  await writeAtomic(join(qdir, name), JSON.stringify(cmd));
  return name;
}

export async function drainCommands(dir: string): Promise<DeskCommand[]> {
  const qdir = join(dir, "commands");
  let names: string[] = [];
  try {
    names = (await readdir(qdir)).filter((n) => n.endsWith(".json")).sort();
  } catch {
    return [];
  }
  const out: DeskCommand[] = [];
  for (const name of names.slice(0, 50)) {
    const path = join(qdir, name);
    try {
      const cmd = JSON.parse(await readFile(path, "utf8")) as DeskCommand;
      if (cmd && typeof cmd === "object" && typeof cmd.type === "string") out.push(cmd);
    } catch {
      /* malformed: drop it */
    }
    await unlink(path).catch(() => {});
  }
  return out;
}

export async function writeRestore(dir: string, text: string) {
  await mkdir(dir, { recursive: true });
  await writeAtomic(join(dir, "restore.json"), text);
}

/** Returns the pending restore payload (and removes the file), or null. */
export async function takeRestore(dir: string): Promise<unknown | null> {
  const path = join(dir, "restore.json");
  try {
    const raw = await readFile(path, "utf8");
    await unlink(path).catch(() => {});
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
