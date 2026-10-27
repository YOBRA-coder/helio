import { O as Logger, S as init_lib_esm, _ as hexConcat, a as defineReadOnly, b as hexZeroPad, c as init_lib_esm$2, f as BigNumber, g as concat, h as arrayify, i as deepCopy, k as init_lib_esm$1, s as shallowCopy, w as isHexString, x as hexlify } from "./abstract-provider+[...].mjs";
import { r as keccak256, t as getAddress } from "./address+[...].mjs";
//#region node_modules/@ethersproject/strings/lib.esm/_version.js
init_lib_esm$1();
init_lib_esm();
//#endregion
//#region node_modules/@ethersproject/strings/lib.esm/utf8.js
var logger$1 = new Logger("strings/5.8.0");
var UnicodeNormalizationForm;
(function(UnicodeNormalizationForm) {
	UnicodeNormalizationForm["current"] = "";
	UnicodeNormalizationForm["NFC"] = "NFC";
	UnicodeNormalizationForm["NFD"] = "NFD";
	UnicodeNormalizationForm["NFKC"] = "NFKC";
	UnicodeNormalizationForm["NFKD"] = "NFKD";
})(UnicodeNormalizationForm || (UnicodeNormalizationForm = {}));
var Utf8ErrorReason;
(function(Utf8ErrorReason) {
	Utf8ErrorReason["UNEXPECTED_CONTINUE"] = "unexpected continuation byte";
	Utf8ErrorReason["BAD_PREFIX"] = "bad codepoint prefix";
	Utf8ErrorReason["OVERRUN"] = "string overrun";
	Utf8ErrorReason["MISSING_CONTINUE"] = "missing continuation byte";
	Utf8ErrorReason["OUT_OF_RANGE"] = "out of UTF-8 range";
	Utf8ErrorReason["UTF16_SURROGATE"] = "UTF-16 surrogate";
	Utf8ErrorReason["OVERLONG"] = "overlong representation";
})(Utf8ErrorReason || (Utf8ErrorReason = {}));
function errorFunc(reason, offset, bytes, output, badCodepoint) {
	return logger$1.throwArgumentError(`invalid codepoint at offset ${offset}; ${reason}`, "bytes", bytes);
}
function ignoreFunc(reason, offset, bytes, output, badCodepoint) {
	if (reason === Utf8ErrorReason.BAD_PREFIX || reason === Utf8ErrorReason.UNEXPECTED_CONTINUE) {
		let i = 0;
		for (let o = offset + 1; o < bytes.length; o++) {
			if (bytes[o] >> 6 !== 2) break;
			i++;
		}
		return i;
	}
	if (reason === Utf8ErrorReason.OVERRUN) return bytes.length - offset - 1;
	return 0;
}
function replaceFunc(reason, offset, bytes, output, badCodepoint) {
	if (reason === Utf8ErrorReason.OVERLONG) {
		output.push(badCodepoint);
		return 0;
	}
	output.push(65533);
	return ignoreFunc(reason, offset, bytes, output, badCodepoint);
}
Object.freeze({
	error: errorFunc,
	ignore: ignoreFunc,
	replace: replaceFunc
});
function toUtf8Bytes(str, form = UnicodeNormalizationForm.current) {
	if (form != UnicodeNormalizationForm.current) {
		logger$1.checkNormalize();
		str = str.normalize(form);
	}
	let result = [];
	for (let i = 0; i < str.length; i++) {
		const c = str.charCodeAt(i);
		if (c < 128) result.push(c);
		else if (c < 2048) {
			result.push(c >> 6 | 192);
			result.push(c & 63 | 128);
		} else if ((c & 64512) == 55296) {
			i++;
			const c2 = str.charCodeAt(i);
			if (i >= str.length || (c2 & 64512) !== 56320) throw new Error("invalid utf-8 string");
			const pair = 65536 + ((c & 1023) << 10) + (c2 & 1023);
			result.push(pair >> 18 | 240);
			result.push(pair >> 12 & 63 | 128);
			result.push(pair >> 6 & 63 | 128);
			result.push(pair & 63 | 128);
		} else {
			result.push(c >> 12 | 224);
			result.push(c >> 6 & 63 | 128);
			result.push(c & 63 | 128);
		}
	}
	return arrayify(result);
}
//#endregion
//#region node_modules/@ethersproject/hash/lib.esm/id.js
init_lib_esm$2();
function id(text) {
	return keccak256(toUtf8Bytes(text));
}
//#endregion
//#region node_modules/@ethersproject/hash/lib.esm/_version.js
var version = "hash/5.8.0";
//#endregion
//#region node_modules/@ethersproject/hash/lib.esm/message.js
init_lib_esm();
var messagePrefix = "Ethereum Signed Message:\n";
function hashMessage(message) {
	if (typeof message === "string") message = toUtf8Bytes(message);
	return keccak256(concat([
		toUtf8Bytes(messagePrefix),
		toUtf8Bytes(String(message.length)),
		message
	]));
}
//#endregion
//#region node_modules/@ethersproject/hash/lib.esm/typed-data.js
init_lib_esm();
init_lib_esm$1();
var __awaiter = function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
var logger = new Logger(version);
var padding = /* @__PURE__ */ new Uint8Array(32);
padding.fill(0);
var NegativeOne = BigNumber.from(-1);
var Zero = BigNumber.from(0);
var One = BigNumber.from(1);
var MaxUint256 = BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
function hexPadRight(value) {
	const bytes = arrayify(value);
	const padOffset = bytes.length % 32;
	if (padOffset) return hexConcat([bytes, padding.slice(padOffset)]);
	return hexlify(bytes);
}
var hexTrue = hexZeroPad(One.toHexString(), 32);
var hexFalse = hexZeroPad(Zero.toHexString(), 32);
var domainFieldTypes = {
	name: "string",
	version: "string",
	chainId: "uint256",
	verifyingContract: "address",
	salt: "bytes32"
};
var domainFieldNames = [
	"name",
	"version",
	"chainId",
	"verifyingContract",
	"salt"
];
function checkString(key) {
	return function(value) {
		if (typeof value !== "string") logger.throwArgumentError(`invalid domain value for ${JSON.stringify(key)}`, `domain.${key}`, value);
		return value;
	};
}
var domainChecks = {
	name: checkString("name"),
	version: checkString("version"),
	chainId: function(value) {
		try {
			return BigNumber.from(value).toString();
		} catch (error) {}
		return logger.throwArgumentError(`invalid domain value for "chainId"`, "domain.chainId", value);
	},
	verifyingContract: function(value) {
		try {
			return getAddress(value).toLowerCase();
		} catch (error) {}
		return logger.throwArgumentError(`invalid domain value "verifyingContract"`, "domain.verifyingContract", value);
	},
	salt: function(value) {
		try {
			const bytes = arrayify(value);
			if (bytes.length !== 32) throw new Error("bad length");
			return hexlify(bytes);
		} catch (error) {}
		return logger.throwArgumentError(`invalid domain value "salt"`, "domain.salt", value);
	}
};
function getBaseEncoder(type) {
	{
		const match = type.match(/^(u?)int(\d*)$/);
		if (match) {
			const signed = match[1] === "";
			const width = parseInt(match[2] || "256");
			if (width % 8 !== 0 || width > 256 || match[2] && match[2] !== String(width)) logger.throwArgumentError("invalid numeric width", "type", type);
			const boundsUpper = MaxUint256.mask(signed ? width - 1 : width);
			const boundsLower = signed ? boundsUpper.add(One).mul(NegativeOne) : Zero;
			return function(value) {
				const v = BigNumber.from(value);
				if (v.lt(boundsLower) || v.gt(boundsUpper)) logger.throwArgumentError(`value out-of-bounds for ${type}`, "value", value);
				return hexZeroPad(v.toTwos(256).toHexString(), 32);
			};
		}
	}
	{
		const match = type.match(/^bytes(\d+)$/);
		if (match) {
			const width = parseInt(match[1]);
			if (width === 0 || width > 32 || match[1] !== String(width)) logger.throwArgumentError("invalid bytes width", "type", type);
			return function(value) {
				if (arrayify(value).length !== width) logger.throwArgumentError(`invalid length for ${type}`, "value", value);
				return hexPadRight(value);
			};
		}
	}
	switch (type) {
		case "address": return function(value) {
			return hexZeroPad(getAddress(value), 32);
		};
		case "bool": return function(value) {
			return !value ? hexFalse : hexTrue;
		};
		case "bytes": return function(value) {
			return keccak256(value);
		};
		case "string": return function(value) {
			return id(value);
		};
	}
	return null;
}
function encodeType(name, fields) {
	return `${name}(${fields.map(({ name, type }) => type + " " + name).join(",")})`;
}
var TypedDataEncoder = class TypedDataEncoder {
	constructor(types) {
		defineReadOnly(this, "types", Object.freeze(deepCopy(types)));
		defineReadOnly(this, "_encoderCache", {});
		defineReadOnly(this, "_types", {});
		const links = {};
		const parents = {};
		const subtypes = {};
		Object.keys(types).forEach((type) => {
			links[type] = {};
			parents[type] = [];
			subtypes[type] = {};
		});
		for (const name in types) {
			const uniqueNames = {};
			types[name].forEach((field) => {
				if (uniqueNames[field.name]) logger.throwArgumentError(`duplicate variable name ${JSON.stringify(field.name)} in ${JSON.stringify(name)}`, "types", types);
				uniqueNames[field.name] = true;
				const baseType = field.type.match(/^([^\x5b]*)(\x5b|$)/)[1];
				if (baseType === name) logger.throwArgumentError(`circular type reference to ${JSON.stringify(baseType)}`, "types", types);
				if (getBaseEncoder(baseType)) return;
				if (!parents[baseType]) logger.throwArgumentError(`unknown type ${JSON.stringify(baseType)}`, "types", types);
				parents[baseType].push(name);
				links[name][baseType] = true;
			});
		}
		const primaryTypes = Object.keys(parents).filter((n) => parents[n].length === 0);
		if (primaryTypes.length === 0) logger.throwArgumentError("missing primary type", "types", types);
		else if (primaryTypes.length > 1) logger.throwArgumentError(`ambiguous primary types or unused types: ${primaryTypes.map((t) => JSON.stringify(t)).join(", ")}`, "types", types);
		defineReadOnly(this, "primaryType", primaryTypes[0]);
		function checkCircular(type, found) {
			if (found[type]) logger.throwArgumentError(`circular type reference to ${JSON.stringify(type)}`, "types", types);
			found[type] = true;
			Object.keys(links[type]).forEach((child) => {
				if (!parents[child]) return;
				checkCircular(child, found);
				Object.keys(found).forEach((subtype) => {
					subtypes[subtype][child] = true;
				});
			});
			delete found[type];
		}
		checkCircular(this.primaryType, {});
		for (const name in subtypes) {
			const st = Object.keys(subtypes[name]);
			st.sort();
			this._types[name] = encodeType(name, types[name]) + st.map((t) => encodeType(t, types[t])).join("");
		}
	}
	getEncoder(type) {
		let encoder = this._encoderCache[type];
		if (!encoder) encoder = this._encoderCache[type] = this._getEncoder(type);
		return encoder;
	}
	_getEncoder(type) {
		{
			const encoder = getBaseEncoder(type);
			if (encoder) return encoder;
		}
		const match = type.match(/^(.*)(\x5b(\d*)\x5d)$/);
		if (match) {
			const subtype = match[1];
			const subEncoder = this.getEncoder(subtype);
			const length = parseInt(match[3]);
			return (value) => {
				if (length >= 0 && value.length !== length) logger.throwArgumentError("array length mismatch; expected length ${ arrayLength }", "value", value);
				let result = value.map(subEncoder);
				if (this._types[subtype]) result = result.map(keccak256);
				return keccak256(hexConcat(result));
			};
		}
		const fields = this.types[type];
		if (fields) {
			const encodedType = id(this._types[type]);
			return (value) => {
				const values = fields.map(({ name, type }) => {
					const result = this.getEncoder(type)(value[name]);
					if (this._types[type]) return keccak256(result);
					return result;
				});
				values.unshift(encodedType);
				return hexConcat(values);
			};
		}
		return logger.throwArgumentError(`unknown type: ${type}`, "type", type);
	}
	encodeType(name) {
		const result = this._types[name];
		if (!result) logger.throwArgumentError(`unknown type: ${JSON.stringify(name)}`, "name", name);
		return result;
	}
	encodeData(type, value) {
		return this.getEncoder(type)(value);
	}
	hashStruct(name, value) {
		return keccak256(this.encodeData(name, value));
	}
	encode(value) {
		return this.encodeData(this.primaryType, value);
	}
	hash(value) {
		return this.hashStruct(this.primaryType, value);
	}
	_visit(type, value, callback) {
		if (getBaseEncoder(type)) return callback(type, value);
		const match = type.match(/^(.*)(\x5b(\d*)\x5d)$/);
		if (match) {
			const subtype = match[1];
			const length = parseInt(match[3]);
			if (length >= 0 && value.length !== length) logger.throwArgumentError("array length mismatch; expected length ${ arrayLength }", "value", value);
			return value.map((v) => this._visit(subtype, v, callback));
		}
		const fields = this.types[type];
		if (fields) return fields.reduce((accum, { name, type }) => {
			accum[name] = this._visit(type, value[name], callback);
			return accum;
		}, {});
		return logger.throwArgumentError(`unknown type: ${type}`, "type", type);
	}
	visit(value, callback) {
		return this._visit(this.primaryType, value, callback);
	}
	static from(types) {
		return new TypedDataEncoder(types);
	}
	static getPrimaryType(types) {
		return TypedDataEncoder.from(types).primaryType;
	}
	static hashStruct(name, types, value) {
		return TypedDataEncoder.from(types).hashStruct(name, value);
	}
	static hashDomain(domain) {
		const domainFields = [];
		for (const name in domain) {
			const type = domainFieldTypes[name];
			if (!type) logger.throwArgumentError(`invalid typed-data domain key: ${JSON.stringify(name)}`, "domain", domain);
			domainFields.push({
				name,
				type
			});
		}
		domainFields.sort((a, b) => {
			return domainFieldNames.indexOf(a.name) - domainFieldNames.indexOf(b.name);
		});
		return TypedDataEncoder.hashStruct("EIP712Domain", { EIP712Domain: domainFields }, domain);
	}
	static encode(domain, types, value) {
		return hexConcat([
			"0x1901",
			TypedDataEncoder.hashDomain(domain),
			TypedDataEncoder.from(types).hash(value)
		]);
	}
	static hash(domain, types, value) {
		return keccak256(TypedDataEncoder.encode(domain, types, value));
	}
	static resolveNames(domain, types, value, resolveName) {
		return __awaiter(this, void 0, void 0, function* () {
			domain = shallowCopy(domain);
			const ensCache = {};
			if (domain.verifyingContract && !isHexString(domain.verifyingContract, 20)) ensCache[domain.verifyingContract] = "0x";
			const encoder = TypedDataEncoder.from(types);
			encoder.visit(value, (type, value) => {
				if (type === "address" && !isHexString(value, 20)) ensCache[value] = "0x";
				return value;
			});
			for (const name in ensCache) ensCache[name] = yield resolveName(name);
			if (domain.verifyingContract && ensCache[domain.verifyingContract]) domain.verifyingContract = ensCache[domain.verifyingContract];
			value = encoder.visit(value, (type, value) => {
				if (type === "address" && ensCache[value]) return ensCache[value];
				return value;
			});
			return {
				domain,
				value
			};
		});
	}
	static getPayload(domain, types, value) {
		TypedDataEncoder.hashDomain(domain);
		const domainValues = {};
		const domainTypes = [];
		domainFieldNames.forEach((name) => {
			const value = domain[name];
			if (value == null) return;
			domainValues[name] = domainChecks[name](value);
			domainTypes.push({
				name,
				type: domainFieldTypes[name]
			});
		});
		const encoder = TypedDataEncoder.from(types);
		const typesWithDomain = shallowCopy(types);
		if (typesWithDomain.EIP712Domain) logger.throwArgumentError("types must not contain EIP712Domain type", "types.EIP712Domain", types);
		else typesWithDomain.EIP712Domain = domainTypes;
		encoder.encode(value);
		return {
			types: typesWithDomain,
			domain: domainValues,
			primaryType: encoder.primaryType,
			message: encoder.visit(value, (type, value) => {
				if (type.match(/^bytes(\d*)/)) return hexlify(arrayify(value));
				if (type.match(/^u?int/)) return BigNumber.from(value).toString();
				switch (type) {
					case "address": return value.toLowerCase();
					case "bool": return !!value;
					case "string":
						if (typeof value !== "string") logger.throwArgumentError(`invalid string`, "value", value);
						return value;
				}
				return logger.throwArgumentError("unsupported type", "type", type);
			})
		};
	}
};
//#endregion
export { toUtf8Bytes as a, UnicodeNormalizationForm as i, hashMessage as n, id as r, TypedDataEncoder as t };
