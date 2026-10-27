import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { s as loadTape } from "./tape-fetch-xqAH3ngP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tape-DApiTzJI.js
var fetchTape_createServerFn_handler = createServerRpc({
	id: "10f952f4d3b3cfd195261ae67af1a81cac02f8c25a8667d42d10266a56dbadec",
	name: "fetchTape",
	filename: "src/lib/trading/tape.ts"
}, (opts) => fetchTape.__executeServer(opts));
var fetchTape = createServerFn({ method: "GET" }).handler(fetchTape_createServerFn_handler, async () => loadTape());
var fetchResolutionsFn_createServerFn_handler = createServerRpc({
	id: "66e192131d4f2484dbb79ed78ab4c47ec3b3947e0043798a9dd0ce445e32ab16",
	name: "fetchResolutionsFn",
	filename: "src/lib/trading/tape.ts"
}, (opts) => fetchResolutionsFn.__executeServer(opts));
var fetchResolutionsFn = createServerFn({ method: "POST" }).validator((input) => input).handler(fetchResolutionsFn_createServerFn_handler, async ({ data }) => {
	const { fetchResolutions } = await import("./tape-fetch-xqAH3ngP.mjs").then((n) => n.u).then((n) => n.u);
	return fetchResolutions(data.ids);
});
//#endregion
export { fetchResolutionsFn_createServerFn_handler, fetchTape_createServerFn_handler };
