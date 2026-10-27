import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/desk-api-pbfhypf9.js
var COMMAND_TYPES = /* @__PURE__ */ new Set([
	"approve",
	"reject",
	"setMode",
	"setKilled",
	"updateRisk",
	"flatten",
	"simulateMismatch",
	"clearMismatch",
	"markAlertsRead",
	"resetTrial",
	"liveSetStatus",
	"liveUpdate",
	"liveSend"
]);
var getDesk_createServerFn_handler = createServerRpc({
	id: "6bb9d1d4288c61ed75c3223be2cc1284ccfe42ce64bb99900f82a8f3f0753ab2",
	name: "getDesk",
	filename: "src/lib/trading/desk-api.ts"
}, (opts) => getDesk.__executeServer(opts));
var getDesk = createServerFn({ method: "GET" }).handler(getDesk_createServerFn_handler, async () => {
	const { readSnapshot, HEARTBEAT_STALE_MS } = await import("./desk-io-e10SEdvf.mjs");
	const sess = await import("./session.server-DrfJoKi0.mjs");
	const { summarize, evaluateGate, powerNote, calibrationNote, DEFAULT_GATE } = await import("./trial-B01rn2RJ.mjs").then((n) => n.o);
	const { STARTING_CASH } = await import("./engine-BmNSrsOt.mjs").then((n) => n.s).then((n) => n.c);
	const { liveEnv } = await import("./live-ab9wFk_-.mjs");
	const now = Date.now();
	const user = await sess.currentUser();
	const env = {
		...liveEnv(),
		hasOwnerToken: true
	};
	const snap = user ? await readSnapshot(sess.accounts().userDir(user.id)) : null;
	if (!snap) return {
		alive: false,
		heartbeatAgeMs: null,
		workerStartedAt: null,
		tapeAt: 0,
		quotesAt: 0,
		feedError: null,
		lastCommandNote: null,
		core: null,
		trial: null,
		liveEnv: env,
		signedIn: Boolean(user),
		now
	};
	const age = snap.heartbeat > 0 ? now - snap.heartbeat : null;
	const summary = summarize(snap.core, now, STARTING_CASH);
	const gate = evaluateGate(summary, snap.core.risk.drawdownLimit, DEFAULT_GATE);
	const trimmed = {
		...snap.core,
		scores: [],
		hist: Object.fromEntries(Object.entries(snap.core.hist ?? {}).map(([k, v]) => [k, v.slice(-150)])),
		curve: snap.core.curve.slice(-600),
		audit: snap.core.audit.slice(0, 120),
		signals: snap.core.signals.slice(0, 60),
		orders: snap.core.orders.slice(0, 60),
		fills: snap.core.fills.slice(0, 60),
		positions: snap.core.positions.slice(0, 80),
		spots: snap.core.spots.slice(-120)
	};
	return {
		alive: age != null && age < HEARTBEAT_STALE_MS,
		heartbeatAgeMs: age,
		workerStartedAt: snap.workerStartedAt,
		tapeAt: snap.tapeAt,
		quotesAt: snap.quotesAt,
		feedError: snap.feedError,
		lastCommandNote: snap.lastCommandNote,
		core: trimmed,
		trial: {
			summary,
			checks: gate.checks,
			eligible: gate.eligible,
			power: powerNote(summary),
			calibration: calibrationNote(summary),
			recent: snap.core.scores.slice(0, 40)
		},
		liveEnv: snap.liveEnv,
		signedIn: true,
		now
	};
});
var sendCommand_createServerFn_handler = createServerRpc({
	id: "f185d0f9cc4eb0882491ec32077ad50057606be82c2f21c2a6f808ab846c85d0",
	name: "sendCommand",
	filename: "src/lib/trading/desk-api.ts"
}, (opts) => sendCommand.__executeServer(opts));
var sendCommand = createServerFn({ method: "POST" }).validator((input) => input).handler(sendCommand_createServerFn_handler, async ({ data }) => {
	const { enqueueCommand } = await import("./desk-io-e10SEdvf.mjs");
	const sess = await import("./session.server-DrfJoKi0.mjs");
	sess.assertSameSite();
	const user = await sess.currentUser();
	if (!user) return {
		ok: false,
		error: "Sign in to control the server desk."
	};
	const cmd = data.cmd;
	if (!cmd || typeof cmd.type !== "string" || !COMMAND_TYPES.has(cmd.type)) return {
		ok: false,
		error: "Unknown command"
	};
	await enqueueCommand(sess.accounts().userDir(user.id), cmd);
	return { ok: true };
});
var getBacktest_createServerFn_handler = createServerRpc({
	id: "db2bced928ad16e7f468f541f598bbf85a4cdb145ff97544b7b3e3d62f285dcc",
	name: "getBacktest",
	filename: "src/lib/trading/desk-api.ts"
}, (opts) => getBacktest.__executeServer(opts));
var getBacktest = createServerFn({ method: "GET" }).handler(getBacktest_createServerFn_handler, async () => {
	const { jobState, loadReport } = await import("./backtest-job-DZv9Lh3t.mjs");
	return {
		job: jobState(),
		report: await loadReport()
	};
});
var startBacktest_createServerFn_handler = createServerRpc({
	id: "0a4ed536b0c588a8b85afa0871e20249ea29694ac2f7d5c61a38a1637bdd5d88",
	name: "startBacktest",
	filename: "src/lib/trading/desk-api.ts"
}, (opts) => startBacktest.__executeServer(opts));
var startBacktest = createServerFn({ method: "POST" }).validator((i) => i).handler(startBacktest_createServerFn_handler, async ({ data }) => {
	const sess = await import("./session.server-DrfJoKi0.mjs");
	sess.assertSameSite();
	if (!await sess.currentUser()) return {
		ok: false,
		error: "Sign in to run a real-data backtest."
	};
	const { jobState, runJob } = await import("./backtest-job-DZv9Lh3t.mjs");
	if (jobState().status === "running") return {
		ok: false,
		error: "A backtest is already running."
	};
	runJob({
		days: Math.min(30, Math.max(1, Math.round(Number(data.days) || 7))),
		maxPerSeries: Math.min(1500, Math.max(50, Math.round(Number(data.max) || 400))),
		useCache: false
	}).catch(() => {});
	return { ok: true };
});
var MAX_BACKUP_BYTES = 26214400;
/** Everything that makes up the desk (book, scores, trial clock, limits). Keys and passwords are never included. */
var exportBackup_createServerFn_handler = createServerRpc({
	id: "15fb9a660a0fe9004ede28c6ff5e02b10a3131697575818ec627dca8eb1cec9f",
	name: "exportBackup",
	filename: "src/lib/trading/desk-api.ts"
}, (opts) => exportBackup.__executeServer(opts));
var exportBackup = createServerFn({ method: "POST" }).handler(exportBackup_createServerFn_handler, async () => {
	const { readSnapshot } = await import("./desk-io-e10SEdvf.mjs");
	const sess = await import("./session.server-DrfJoKi0.mjs");
	sess.assertSameSite();
	const user = await sess.currentUser();
	if (!user) return {
		ok: false,
		error: "Sign in first."
	};
	const snap = await readSnapshot(sess.accounts().userDir(user.id));
	if (!snap) return {
		ok: false,
		error: "No desk data yet. Start the worker first."
	};
	const body = {
		kind: "helios-backup",
		version: 1,
		exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
		core: snap.core
	};
	return {
		ok: true,
		filename: `helios-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`,
		json: JSON.stringify(body)
	};
});
var restoreBackup_createServerFn_handler = createServerRpc({
	id: "c3bda05130ec6e4413d1b076cd60de02b28c4b2d4e5f5b8def5c9213f2a12328",
	name: "restoreBackup",
	filename: "src/lib/trading/desk-api.ts"
}, (opts) => restoreBackup.__executeServer(opts));
var restoreBackup = createServerFn({ method: "POST" }).validator((i) => i).handler(restoreBackup_createServerFn_handler, async ({ data }) => {
	const { writeRestore, readSnapshot, backupSnapshot } = await import("./desk-io-e10SEdvf.mjs");
	const sess = await import("./session.server-DrfJoKi0.mjs");
	sess.assertSameSite();
	const user = await sess.currentUser();
	if (!user) return {
		ok: false,
		error: "Sign in first."
	};
	if (typeof data.json !== "string" || data.json.length > MAX_BACKUP_BYTES) return {
		ok: false,
		error: "That file is too large to be a Helios backup."
	};
	let parsed;
	try {
		parsed = JSON.parse(data.json);
	} catch {
		return {
			ok: false,
			error: "That is not valid JSON."
		};
	}
	const c = parsed.core;
	if (parsed.kind !== "helios-backup" || !c || typeof c !== "object" || !Array.isArray(c.positions) || !Array.isArray(c.scores) || typeof c.cash !== "number") return {
		ok: false,
		error: "That file is not a Helios backup."
	};
	const dir = sess.accounts().userDir(user.id);
	if (await readSnapshot(dir)) await backupSnapshot(dir);
	await writeRestore(dir, JSON.stringify({ core: c }));
	return { ok: true };
});
var getVersion_createServerFn_handler = createServerRpc({
	id: "52f44871d324c9407981df9887db23f09a353d9b121e1b72cb505c1e57c71fa0",
	name: "getVersion",
	filename: "src/lib/trading/desk-api.ts"
}, (opts) => getVersion.__executeServer(opts));
var getVersion = createServerFn({ method: "GET" }).handler(getVersion_createServerFn_handler, async () => ({ build: "1793084446722" }));
//#endregion
export { exportBackup_createServerFn_handler, getBacktest_createServerFn_handler, getDesk_createServerFn_handler, getVersion_createServerFn_handler, restoreBackup_createServerFn_handler, sendCommand_createServerFn_handler, startBacktest_createServerFn_handler };
