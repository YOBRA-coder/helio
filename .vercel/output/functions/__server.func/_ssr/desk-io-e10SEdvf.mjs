import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { appendFile, copyFile, mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/desk-io-e10SEdvf.js
/**
* Node-only persistence shared by the worker (writer) and the server functions (reader/enqueuer).
* One writer: the worker. Everything else sends commands through the queue directory.
*/
var HEARTBEAT_STALE_MS = 2e4;
function dataDir(env = process.env) {
	return env.HELIOS_DATA_DIR?.trim() || join(process.cwd(), "data");
}
async function writeAtomic(path, data) {
	const tmp = `${path}.${process.pid}.${randomBytes(3).toString("hex")}.tmp`;
	await writeFile(tmp, data, "utf8");
	await rename(tmp, path);
}
async function writeSnapshot(dir, snap) {
	await mkdir(dir, { recursive: true });
	await writeAtomic(join(dir, "desk.json"), JSON.stringify(snap));
}
async function backupSnapshot(dir) {
	try {
		await copyFile(join(dir, "desk.json"), join(dir, "desk.bak.json"));
	} catch {}
}
async function readSnapshot(dir) {
	for (const name of ["desk.json", "desk.bak.json"]) try {
		const parsed = JSON.parse(await readFile(join(dir, name), "utf8"));
		if (parsed && typeof parsed === "object" && parsed.core) return parsed;
	} catch {}
	return null;
}
async function appendJournal(dir, rows) {
	if (rows.length === 0) return;
	await mkdir(dir, { recursive: true });
	await appendFile(join(dir, "journal.jsonl"), rows.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
}
async function enqueueCommand(dir, cmd) {
	const qdir = join(dir, "commands");
	await mkdir(qdir, { recursive: true });
	const name = `${Date.now().toString().padStart(15, "0")}-${randomBytes(4).toString("hex")}.json`;
	await writeAtomic(join(qdir, name), JSON.stringify(cmd));
	return name;
}
async function drainCommands(dir) {
	const qdir = join(dir, "commands");
	let names = [];
	try {
		names = (await readdir(qdir)).filter((n) => n.endsWith(".json")).sort();
	} catch {
		return [];
	}
	const out = [];
	for (const name of names.slice(0, 50)) {
		const path = join(qdir, name);
		try {
			const cmd = JSON.parse(await readFile(path, "utf8"));
			if (cmd && typeof cmd === "object" && typeof cmd.type === "string") out.push(cmd);
		} catch {}
		await unlink(path).catch(() => {});
	}
	return out;
}
async function writeRestore(dir, text) {
	await mkdir(dir, { recursive: true });
	await writeAtomic(join(dir, "restore.json"), text);
}
/** Returns the pending restore payload (and removes the file), or null. */
async function takeRestore(dir) {
	const path = join(dir, "restore.json");
	try {
		const raw = await readFile(path, "utf8");
		await unlink(path).catch(() => {});
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
//#endregion
export { HEARTBEAT_STALE_MS, appendJournal, backupSnapshot, dataDir, drainCommands, enqueueCommand, readSnapshot, takeRestore, writeAtomic, writeRestore, writeSnapshot };
