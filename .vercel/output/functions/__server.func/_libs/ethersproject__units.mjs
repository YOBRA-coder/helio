import { n as __esmMin, r as __exportAll } from "../_runtime.mjs";
import { O as Logger, c as init_lib_esm$1, d as parseFixed, k as init_lib_esm$2, l as formatFixed } from "./@ethersproject/abstract-provider+[...].mjs";
//#region node_modules/@ethersproject/units/lib.esm/_version.js
var version;
var init__version = __esmMin((() => {
	version = "units/5.8.0";
}));
//#endregion
//#region node_modules/@ethersproject/units/lib.esm/index.js
var lib_esm_exports = /* @__PURE__ */ __exportAll({
	commify: () => commify,
	formatEther: () => formatEther,
	formatUnits: () => formatUnits,
	parseEther: () => parseEther,
	parseUnits: () => parseUnits
});
function commify(value) {
	const comps = String(value).split(".");
	if (comps.length > 2 || !comps[0].match(/^-?[0-9]*$/) || comps[1] && !comps[1].match(/^[0-9]*$/) || value === "." || value === "-.") logger.throwArgumentError("invalid value", "value", value);
	let whole = comps[0];
	let negative = "";
	if (whole.substring(0, 1) === "-") {
		negative = "-";
		whole = whole.substring(1);
	}
	while (whole.substring(0, 1) === "0") whole = whole.substring(1);
	if (whole === "") whole = "0";
	let suffix = "";
	if (comps.length === 2) suffix = "." + (comps[1] || "0");
	while (suffix.length > 2 && suffix[suffix.length - 1] === "0") suffix = suffix.substring(0, suffix.length - 1);
	const formatted = [];
	while (whole.length) if (whole.length <= 3) {
		formatted.unshift(whole);
		break;
	} else {
		const index = whole.length - 3;
		formatted.unshift(whole.substring(index));
		whole = whole.substring(0, index);
	}
	return negative + formatted.join(",") + suffix;
}
function formatUnits(value, unitName) {
	if (typeof unitName === "string") {
		const index = names.indexOf(unitName);
		if (index !== -1) unitName = 3 * index;
	}
	return formatFixed(value, unitName != null ? unitName : 18);
}
function parseUnits(value, unitName) {
	if (typeof value !== "string") logger.throwArgumentError("value must be a string", "value", value);
	if (typeof unitName === "string") {
		const index = names.indexOf(unitName);
		if (index !== -1) unitName = 3 * index;
	}
	return parseFixed(value, unitName != null ? unitName : 18);
}
function formatEther(wei) {
	return formatUnits(wei, 18);
}
function parseEther(ether) {
	return parseUnits(ether, 18);
}
var logger, names;
var init_lib_esm = __esmMin((() => {
	init_lib_esm$1();
	init_lib_esm$2();
	init__version();
	logger = new Logger(version);
	names = [
		"wei",
		"kwei",
		"mwei",
		"gwei",
		"szabo",
		"finney",
		"ether"
	];
}));
//#endregion
export { lib_esm_exports as n, init_lib_esm as t };
