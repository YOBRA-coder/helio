import { i as __require, t as __commonJSMin } from "../../_runtime.mjs";
import { n as require_keccak, t as require_dist$1 } from "../@ethereumjs/util+[...].mjs";
//#region node_modules/is-hex-prefixed/src/index.js
var require_src$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Returns a `Boolean` on whether or not the a `String` starts with '0x'
	* @param {String} str the string input value
	* @return {Boolean} a boolean if it is or is not hex prefixed
	* @throws if the str input is not a string
	*/
	module.exports = function isHexPrefixed(str) {
		if (typeof str !== "string") throw new Error("[is-hex-prefixed] value must be type 'string', is currently type " + typeof str + ", while checking isHexPrefixed.");
		return str.slice(0, 2) === "0x";
	};
}));
//#endregion
//#region node_modules/strip-hex-prefix/src/index.js
var require_src = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isHexPrefixed = require_src$1();
	/**
	* Removes '0x' from a given `String` is present
	* @param {String} str the string value
	* @return {String|Optional} a string by pass if necessary
	*/
	module.exports = function stripHexPrefix(str) {
		if (typeof str !== "string") return str;
		return isHexPrefixed(str) ? str.slice(2) : str;
	};
}));
//#endregion
//#region node_modules/ethjs-util/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var isHexPrefixed = require_src$1();
	var stripHexPrefix = require_src();
	/**
	* Pads a `String` to have an even length
	* @param {String} value
	* @return {String} output
	*/
	function padToEven(value) {
		var a = value;
		if (typeof a !== "string") throw new Error("[ethjs-util] while padding to even, value must be string, is currently " + typeof a + ", while padToEven.");
		if (a.length % 2) a = "0" + a;
		return a;
	}
	/**
	* Converts a `Number` into a hex `String`
	* @param {Number} i
	* @return {String}
	*/
	function intToHex(i) {
		return "0x" + i.toString(16);
	}
	/**
	* Converts an `Number` to a `Buffer`
	* @param {Number} i
	* @return {Buffer}
	*/
	function intToBuffer(i) {
		var hex = intToHex(i);
		return new Buffer(padToEven(hex.slice(2)), "hex");
	}
	/**
	* Get the binary size of a string
	* @param {String} str
	* @return {Number}
	*/
	function getBinarySize(str) {
		if (typeof str !== "string") throw new Error("[ethjs-util] while getting binary size, method getBinarySize requires input 'str' to be type String, got '" + typeof str + "'.");
		return Buffer.byteLength(str, "utf8");
	}
	/**
	* Returns TRUE if the first specified array contains all elements
	* from the second one. FALSE otherwise.
	*
	* @param {array} superset
	* @param {array} subset
	*
	* @returns {boolean}
	*/
	function arrayContainsArray(superset, subset, some) {
		if (Array.isArray(superset) !== true) throw new Error("[ethjs-util] method arrayContainsArray requires input 'superset' to be an array got type '" + typeof superset + "'");
		if (Array.isArray(subset) !== true) throw new Error("[ethjs-util] method arrayContainsArray requires input 'subset' to be an array got type '" + typeof subset + "'");
		return subset[Boolean(some) && "some" || "every"](function(value) {
			return superset.indexOf(value) >= 0;
		});
	}
	/**
	* Should be called to get utf8 from it's hex representation
	*
	* @method toUtf8
	* @param {String} string in hex
	* @returns {String} ascii string representation of hex value
	*/
	function toUtf8(hex) {
		return new Buffer(padToEven(stripHexPrefix(hex).replace(/^0+|0+$/g, "")), "hex").toString("utf8");
	}
	/**
	* Should be called to get ascii from it's hex representation
	*
	* @method toAscii
	* @param {String} string in hex
	* @returns {String} ascii string representation of hex value
	*/
	function toAscii(hex) {
		var str = "";
		var i = 0, l = hex.length;
		if (hex.substring(0, 2) === "0x") i = 2;
		for (; i < l; i += 2) {
			var code = parseInt(hex.substr(i, 2), 16);
			str += String.fromCharCode(code);
		}
		return str;
	}
	/**
	* Should be called to get hex representation (prefixed by 0x) of utf8 string
	*
	* @method fromUtf8
	* @param {String} string
	* @param {Number} optional padding
	* @returns {String} hex representation of input string
	*/
	function fromUtf8(stringValue) {
		return "0x" + padToEven(new Buffer(stringValue, "utf8").toString("hex")).replace(/^0+|0+$/g, "");
	}
	/**
	* Should be called to get hex representation (prefixed by 0x) of ascii string
	*
	* @method fromAscii
	* @param {String} string
	* @param {Number} optional padding
	* @returns {String} hex representation of input string
	*/
	function fromAscii(stringValue) {
		var hex = "";
		for (var i = 0; i < stringValue.length; i++) {
			var n = stringValue.charCodeAt(i).toString(16);
			hex += n.length < 2 ? "0" + n : n;
		}
		return "0x" + hex;
	}
	/**
	* getKeys([{a: 1, b: 2}, {a: 3, b: 4}], 'a') => [1, 3]
	*
	* @method getKeys get specific key from inner object array of objects
	* @param {String} params
	* @param {String} key
	* @param {Boolean} allowEmpty
	* @returns {Array} output just a simple array of output keys
	*/
	function getKeys(params, key, allowEmpty) {
		if (!Array.isArray(params)) throw new Error("[ethjs-util] method getKeys expecting type Array as 'params' input, got '" + typeof params + "'");
		if (typeof key !== "string") throw new Error("[ethjs-util] method getKeys expecting type String for input 'key' got '" + typeof key + "'.");
		var result = [];
		for (var i = 0; i < params.length; i++) {
			var value = params[i][key];
			if (allowEmpty && !value) value = "";
			else if (typeof value !== "string") throw new Error("invalid abi");
			result.push(value);
		}
		return result;
	}
	/**
	* Is the string a hex string.
	*
	* @method check if string is hex string of specific length
	* @param {String} value
	* @param {Number} length
	* @returns {Boolean} output the string is a hex string
	*/
	function isHexString(value, length) {
		if (typeof value !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) return false;
		if (length && value.length !== 2 + 2 * length) return false;
		return true;
	}
	module.exports = {
		arrayContainsArray,
		intToBuffer,
		getBinarySize,
		isHexPrefixed,
		stripHexPrefix,
		padToEven,
		intToHex,
		fromAscii,
		fromUtf8,
		toAscii,
		toUtf8,
		getKeys,
		isHexString
	};
}));
//#endregion
//#region node_modules/@metamask/eth-sig-util/dist/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.numberToBuffer = exports.normalize = exports.recoverPublicKey = exports.concatSig = exports.legacyToBuffer = exports.isNullish = exports.padWithZeroes = void 0;
	var util_1 = require_dist$1();
	var ethjs_util_1 = require_lib();
	/**
	* Pads the front of the given hex string with zeroes until it reaches the
	* target length. If the input string is already longer than or equal to the
	* target length, it is returned unmodified.
	*
	* If the input string is "0x"-prefixed or not a hex string, an error will be
	* thrown.
	*
	* @param hexString - The hexadecimal string to pad with zeroes.
	* @param targetLength - The target length of the hexadecimal string.
	* @returns The input string front-padded with zeroes, or the original string
	* if it was already greater than or equal to to the target length.
	*/
	function padWithZeroes(hexString, targetLength) {
		if (hexString !== "" && !/^[a-f0-9]+$/iu.test(hexString)) throw new Error(`Expected an unprefixed hex string. Received: ${hexString}`);
		if (targetLength < 0) throw new Error(`Expected a non-negative integer target length. Received: ${targetLength}`);
		return String.prototype.padStart.call(hexString, targetLength, "0");
	}
	exports.padWithZeroes = padWithZeroes;
	/**
	* Returns `true` if the given value is nullish.
	*
	* @param value - The value being checked.
	* @returns Whether the value is nullish.
	*/
	function isNullish(value) {
		return value === null || value === void 0;
	}
	exports.isNullish = isNullish;
	/**
	* Convert a value to a Buffer. This function should be equivalent to the `toBuffer` function in
	* `ethereumjs-util@5.2.1`.
	*
	* @param value - The value to convert to a Buffer.
	* @returns The given value as a Buffer.
	*/
	function legacyToBuffer(value) {
		return typeof value === "string" && !(0, ethjs_util_1.isHexString)(value) ? Buffer.from(value) : (0, util_1.toBuffer)(value);
	}
	exports.legacyToBuffer = legacyToBuffer;
	/**
	* Concatenate an extended ECDSA signature into a single '0x'-prefixed hex string.
	*
	* @param v - The 'v' portion of the signature.
	* @param r - The 'r' portion of the signature.
	* @param s - The 's' portion of the signature.
	* @returns The concatenated ECDSA signature as a '0x'-prefixed string.
	*/
	function concatSig(v, r, s) {
		const rSig = (0, util_1.fromSigned)(r);
		const sSig = (0, util_1.fromSigned)(s);
		const vSig = (0, util_1.bufferToInt)(v);
		const rStr = padWithZeroes((0, util_1.toUnsigned)(rSig).toString("hex"), 64);
		const sStr = padWithZeroes((0, util_1.toUnsigned)(sSig).toString("hex"), 64);
		const vStr = (0, ethjs_util_1.stripHexPrefix)((0, ethjs_util_1.intToHex)(vSig));
		return (0, util_1.addHexPrefix)(rStr.concat(sStr, vStr));
	}
	exports.concatSig = concatSig;
	/**
	* Recover the public key from the given signature and message hash.
	*
	* @param messageHash - The hash of the signed message.
	* @param signature - The signature.
	* @returns The public key of the signer.
	*/
	function recoverPublicKey(messageHash, signature) {
		const sigParams = (0, util_1.fromRpcSig)(signature);
		return (0, util_1.ecrecover)(messageHash, sigParams.v, sigParams.r, sigParams.s);
	}
	exports.recoverPublicKey = recoverPublicKey;
	/**
	* Normalize the input to a lower-cased '0x'-prefixed hex string.
	*
	* @param input - The value to normalize.
	* @returns The normalized value.
	*/
	function normalize(input) {
		if (!input) return;
		if (typeof input === "number") {
			if (input < 0) return "0x";
			const buffer = (0, util_1.toBuffer)(input);
			input = (0, util_1.bufferToHex)(buffer);
		}
		if (typeof input !== "string") {
			let msg = "eth-sig-util.normalize() requires hex string or integer input.";
			msg += ` received ${typeof input}: ${input}`;
			throw new Error(msg);
		}
		return (0, util_1.addHexPrefix)(input.toLowerCase());
	}
	exports.normalize = normalize;
	/**
	* Node's Buffer.from() method does not seem to buffer numbers correctly out of the box.
	* This helper method formats the number correct for Buffer.from to return correct buffer.
	*
	* @param num - The number to convert to buffer.
	* @returns The number in buffer form.
	*/
	function numberToBuffer(num) {
		const hexVal = num.toString(16);
		const prepend = hexVal.length % 2 ? "0" : "";
		return Buffer.from(prepend + hexVal, "hex");
	}
	exports.numberToBuffer = numberToBuffer;
}));
//#endregion
//#region node_modules/@metamask/eth-sig-util/dist/personal-sign.js
var require_personal_sign = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.extractPublicKey = exports.recoverPersonalSignature = exports.personalSign = void 0;
	var util_1 = require_dist$1();
	var utils_1 = require_utils();
	/**
	* Create an Ethereum-specific signature for a message.
	*
	* This function is equivalent to the `eth_sign` Ethereum JSON-RPC method as specified in EIP-1417,
	* as well as the MetaMask's `personal_sign` method.
	*
	* @param options - The personal sign options.
	* @param options.privateKey - The key to sign with.
	* @param options.data - The hex data to sign.
	* @returns The '0x'-prefixed hex encoded signature.
	*/
	function personalSign({ privateKey, data }) {
		if ((0, utils_1.isNullish)(data)) throw new Error("Missing data parameter");
		else if ((0, utils_1.isNullish)(privateKey)) throw new Error("Missing privateKey parameter");
		const message = (0, utils_1.legacyToBuffer)(data);
		const msgHash = (0, util_1.hashPersonalMessage)(message);
		const sig = (0, util_1.ecsign)(msgHash, privateKey);
		return (0, utils_1.concatSig)((0, util_1.toBuffer)(sig.v), sig.r, sig.s);
	}
	exports.personalSign = personalSign;
	/**
	* Recover the address of the account used to create the given Ethereum signature. The message
	* must have been signed using the `personalSign` function, or an equivalent function.
	*
	* @param options - The signature recovery options.
	* @param options.data - The hex data that was signed.
	* @param options.signature - The '0x'-prefixed hex encoded message signature.
	* @returns The '0x'-prefixed hex encoded address of the message signer.
	*/
	function recoverPersonalSignature({ data, signature }) {
		if ((0, utils_1.isNullish)(data)) throw new Error("Missing data parameter");
		else if ((0, utils_1.isNullish)(signature)) throw new Error("Missing signature parameter");
		const publicKey = getPublicKeyFor(data, signature);
		const sender = (0, util_1.publicToAddress)(publicKey);
		return (0, util_1.bufferToHex)(sender);
	}
	exports.recoverPersonalSignature = recoverPersonalSignature;
	/**
	* Recover the public key of the account used to create the given Ethereum signature. The message
	* must have been signed using the `personalSign` function, or an equivalent function.
	*
	* @param options - The public key recovery options.
	* @param options.data - The hex data that was signed.
	* @param options.signature - The '0x'-prefixed hex encoded message signature.
	* @returns The '0x'-prefixed hex encoded public key of the message signer.
	*/
	function extractPublicKey({ data, signature }) {
		if ((0, utils_1.isNullish)(data)) throw new Error("Missing data parameter");
		else if ((0, utils_1.isNullish)(signature)) throw new Error("Missing signature parameter");
		return `0x${getPublicKeyFor(data, signature).toString("hex")}`;
	}
	exports.extractPublicKey = extractPublicKey;
	/**
	* Get the public key for the given signature and message.
	*
	* @param message - The message that was signed.
	* @param signature - The '0x'-prefixed hex encoded message signature.
	* @returns The public key of the signer.
	*/
	function getPublicKeyFor(message, signature) {
		const messageHash = (0, util_1.hashPersonalMessage)((0, utils_1.legacyToBuffer)(message));
		return (0, utils_1.recoverPublicKey)(messageHash, signature);
	}
}));
//#endregion
//#region node_modules/bn.js/lib/bn.js
var require_bn = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(module$1, exports$2) {
		"use strict";
		function assert(val, msg) {
			if (!val) throw new Error(msg || "Assertion failed");
		}
		function inherits(ctor, superCtor) {
			ctor.super_ = superCtor;
			var TempCtor = function() {};
			TempCtor.prototype = superCtor.prototype;
			ctor.prototype = new TempCtor();
			ctor.prototype.constructor = ctor;
		}
		function BN(number, base, endian) {
			if (BN.isBN(number)) return number;
			this.negative = 0;
			this.words = null;
			this.length = 0;
			this.red = null;
			if (number !== null) {
				if (base === "le" || base === "be") {
					endian = base;
					base = 10;
				}
				this._init(number || 0, base || 10, endian || "be");
			}
		}
		if (typeof module$1 === "object") module$1.exports = BN;
		else exports$2.BN = BN;
		BN.BN = BN;
		BN.wordSize = 26;
		var Buffer;
		try {
			if (typeof window !== "undefined" && typeof window.Buffer !== "undefined") Buffer = window.Buffer;
			else Buffer = __require("buffer").Buffer;
		} catch (e) {}
		BN.isBN = function isBN(num) {
			if (num instanceof BN) return true;
			return num !== null && typeof num === "object" && num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
		};
		BN.max = function max(left, right) {
			if (left.cmp(right) > 0) return left;
			return right;
		};
		BN.min = function min(left, right) {
			if (left.cmp(right) < 0) return left;
			return right;
		};
		BN.prototype._init = function init(number, base, endian) {
			if (typeof number === "number") return this._initNumber(number, base, endian);
			if (typeof number === "object") return this._initArray(number, base, endian);
			if (base === "hex") base = 16;
			assert(base === (base | 0) && base >= 2 && base <= 36);
			number = number.toString().replace(/\s+/g, "");
			var start = 0;
			if (number[0] === "-") {
				start++;
				this.negative = 1;
			}
			if (start < number.length) {
				if (base === 16) this._parseHex(number, start, endian);
				else {
					this._parseBase(number, base, start);
					if (endian === "le") this._initArray(this.toArray(), base, endian);
				}
			}
		};
		BN.prototype._initNumber = function _initNumber(number, base, endian) {
			if (number < 0) {
				this.negative = 1;
				number = -number;
			}
			if (number < 67108864) {
				this.words = [number & 67108863];
				this.length = 1;
			} else if (number < 4503599627370496) {
				this.words = [number & 67108863, number / 67108864 & 67108863];
				this.length = 2;
			} else {
				assert(number < 9007199254740992);
				this.words = [
					number & 67108863,
					number / 67108864 & 67108863,
					1
				];
				this.length = 3;
			}
			if (endian !== "le") return;
			this._initArray(this.toArray(), base, endian);
		};
		BN.prototype._initArray = function _initArray(number, base, endian) {
			assert(typeof number.length === "number");
			if (number.length <= 0) {
				this.words = [0];
				this.length = 1;
				return this;
			}
			this.length = Math.ceil(number.length / 3);
			this.words = new Array(this.length);
			for (var i = 0; i < this.length; i++) this.words[i] = 0;
			var j, w;
			var off = 0;
			if (endian === "be") for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
				w = number[i] | number[i - 1] << 8 | number[i - 2] << 16;
				this.words[j] |= w << off & 67108863;
				this.words[j + 1] = w >>> 26 - off & 67108863;
				off += 24;
				if (off >= 26) {
					off -= 26;
					j++;
				}
			}
			else if (endian === "le") for (i = 0, j = 0; i < number.length; i += 3) {
				w = number[i] | number[i + 1] << 8 | number[i + 2] << 16;
				this.words[j] |= w << off & 67108863;
				this.words[j + 1] = w >>> 26 - off & 67108863;
				off += 24;
				if (off >= 26) {
					off -= 26;
					j++;
				}
			}
			return this.strip();
		};
		function parseHex4Bits(string, index) {
			var c = string.charCodeAt(index);
			if (c >= 65 && c <= 70) return c - 55;
			else if (c >= 97 && c <= 102) return c - 87;
			else return c - 48 & 15;
		}
		function parseHexByte(string, lowerBound, index) {
			var r = parseHex4Bits(string, index);
			if (index - 1 >= lowerBound) r |= parseHex4Bits(string, index - 1) << 4;
			return r;
		}
		BN.prototype._parseHex = function _parseHex(number, start, endian) {
			this.length = Math.ceil((number.length - start) / 6);
			this.words = new Array(this.length);
			for (var i = 0; i < this.length; i++) this.words[i] = 0;
			var off = 0;
			var j = 0;
			var w;
			if (endian === "be") for (i = number.length - 1; i >= start; i -= 2) {
				w = parseHexByte(number, start, i) << off;
				this.words[j] |= w & 67108863;
				if (off >= 18) {
					off -= 18;
					j += 1;
					this.words[j] |= w >>> 26;
				} else off += 8;
			}
			else for (i = (number.length - start) % 2 === 0 ? start + 1 : start; i < number.length; i += 2) {
				w = parseHexByte(number, start, i) << off;
				this.words[j] |= w & 67108863;
				if (off >= 18) {
					off -= 18;
					j += 1;
					this.words[j] |= w >>> 26;
				} else off += 8;
			}
			this.strip();
		};
		function parseBase(str, start, end, mul) {
			var r = 0;
			var len = Math.min(str.length, end);
			for (var i = start; i < len; i++) {
				var c = str.charCodeAt(i) - 48;
				r *= mul;
				if (c >= 49) r += c - 49 + 10;
				else if (c >= 17) r += c - 17 + 10;
				else r += c;
			}
			return r;
		}
		BN.prototype._parseBase = function _parseBase(number, base, start) {
			this.words = [0];
			this.length = 1;
			for (var limbLen = 0, limbPow = 1; limbPow <= 67108863; limbPow *= base) limbLen++;
			limbLen--;
			limbPow = limbPow / base | 0;
			var total = number.length - start;
			var mod = total % limbLen;
			var end = Math.min(total, total - mod) + start;
			var word = 0;
			for (var i = start; i < end; i += limbLen) {
				word = parseBase(number, i, i + limbLen, base);
				this.imuln(limbPow);
				if (this.words[0] + word < 67108864) this.words[0] += word;
				else this._iaddn(word);
			}
			if (mod !== 0) {
				var pow = 1;
				word = parseBase(number, i, number.length, base);
				for (i = 0; i < mod; i++) pow *= base;
				this.imuln(pow);
				if (this.words[0] + word < 67108864) this.words[0] += word;
				else this._iaddn(word);
			}
			this.strip();
		};
		BN.prototype.copy = function copy(dest) {
			dest.words = new Array(this.length);
			for (var i = 0; i < this.length; i++) dest.words[i] = this.words[i];
			dest.length = this.length;
			dest.negative = this.negative;
			dest.red = this.red;
		};
		BN.prototype.clone = function clone() {
			var r = new BN(null);
			this.copy(r);
			return r;
		};
		BN.prototype._expand = function _expand(size) {
			while (this.length < size) this.words[this.length++] = 0;
			return this;
		};
		BN.prototype.strip = function strip() {
			while (this.length > 1 && this.words[this.length - 1] === 0) this.length--;
			return this._normSign();
		};
		BN.prototype._normSign = function _normSign() {
			if (this.length === 1 && this.words[0] === 0) this.negative = 0;
			return this;
		};
		BN.prototype.inspect = function inspect() {
			return (this.red ? "<BN-R: " : "<BN: ") + this.toString(16) + ">";
		};
		var zeros = [
			"",
			"0",
			"00",
			"000",
			"0000",
			"00000",
			"000000",
			"0000000",
			"00000000",
			"000000000",
			"0000000000",
			"00000000000",
			"000000000000",
			"0000000000000",
			"00000000000000",
			"000000000000000",
			"0000000000000000",
			"00000000000000000",
			"000000000000000000",
			"0000000000000000000",
			"00000000000000000000",
			"000000000000000000000",
			"0000000000000000000000",
			"00000000000000000000000",
			"000000000000000000000000",
			"0000000000000000000000000"
		];
		var groupSizes = [
			0,
			0,
			25,
			16,
			12,
			11,
			10,
			9,
			8,
			8,
			7,
			7,
			7,
			7,
			6,
			6,
			6,
			6,
			6,
			6,
			6,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5
		];
		var groupBases = [
			0,
			0,
			33554432,
			43046721,
			16777216,
			48828125,
			60466176,
			40353607,
			16777216,
			43046721,
			1e7,
			19487171,
			35831808,
			62748517,
			7529536,
			11390625,
			16777216,
			24137569,
			34012224,
			47045881,
			64e6,
			4084101,
			5153632,
			6436343,
			7962624,
			9765625,
			11881376,
			14348907,
			17210368,
			20511149,
			243e5,
			28629151,
			33554432,
			39135393,
			45435424,
			52521875,
			60466176
		];
		BN.prototype.toString = function toString(base, padding) {
			base = base || 10;
			padding = padding | 0 || 1;
			var out;
			if (base === 16 || base === "hex") {
				out = "";
				var off = 0;
				var carry = 0;
				for (var i = 0; i < this.length; i++) {
					var w = this.words[i];
					var word = ((w << off | carry) & 16777215).toString(16);
					carry = w >>> 24 - off & 16777215;
					off += 2;
					if (off >= 26) {
						off -= 26;
						i--;
					}
					if (carry !== 0 || i !== this.length - 1) out = zeros[6 - word.length] + word + out;
					else out = word + out;
				}
				if (carry !== 0) out = carry.toString(16) + out;
				while (out.length % padding !== 0) out = "0" + out;
				if (this.negative !== 0) out = "-" + out;
				return out;
			}
			if (base === (base | 0) && base >= 2 && base <= 36) {
				var groupSize = groupSizes[base];
				var groupBase = groupBases[base];
				out = "";
				var c = this.clone();
				c.negative = 0;
				while (!c.isZero()) {
					var r = c.modn(groupBase).toString(base);
					c = c.idivn(groupBase);
					if (!c.isZero()) out = zeros[groupSize - r.length] + r + out;
					else out = r + out;
				}
				if (this.isZero()) out = "0" + out;
				while (out.length % padding !== 0) out = "0" + out;
				if (this.negative !== 0) out = "-" + out;
				return out;
			}
			assert(false, "Base should be between 2 and 36");
		};
		BN.prototype.toNumber = function toNumber() {
			var ret = this.words[0];
			if (this.length === 2) ret += this.words[1] * 67108864;
			else if (this.length === 3 && this.words[2] === 1) ret += 4503599627370496 + this.words[1] * 67108864;
			else if (this.length > 2) assert(false, "Number can only safely store up to 53 bits");
			return this.negative !== 0 ? -ret : ret;
		};
		BN.prototype.toJSON = function toJSON() {
			return this.toString(16);
		};
		BN.prototype.toBuffer = function toBuffer(endian, length) {
			assert(typeof Buffer !== "undefined");
			return this.toArrayLike(Buffer, endian, length);
		};
		BN.prototype.toArray = function toArray(endian, length) {
			return this.toArrayLike(Array, endian, length);
		};
		BN.prototype.toArrayLike = function toArrayLike(ArrayType, endian, length) {
			var byteLength = this.byteLength();
			var reqLength = length || Math.max(1, byteLength);
			assert(byteLength <= reqLength, "byte array longer than desired length");
			assert(reqLength > 0, "Requested array length <= 0");
			this.strip();
			var littleEndian = endian === "le";
			var res = new ArrayType(reqLength);
			var b, i;
			var q = this.clone();
			if (!littleEndian) {
				for (i = 0; i < reqLength - byteLength; i++) res[i] = 0;
				for (i = 0; !q.isZero(); i++) {
					b = q.andln(255);
					q.iushrn(8);
					res[reqLength - i - 1] = b;
				}
			} else {
				for (i = 0; !q.isZero(); i++) {
					b = q.andln(255);
					q.iushrn(8);
					res[i] = b;
				}
				for (; i < reqLength; i++) res[i] = 0;
			}
			return res;
		};
		if (Math.clz32) BN.prototype._countBits = function _countBits(w) {
			return 32 - Math.clz32(w);
		};
		else BN.prototype._countBits = function _countBits(w) {
			var t = w;
			var r = 0;
			if (t >= 4096) {
				r += 13;
				t >>>= 13;
			}
			if (t >= 64) {
				r += 7;
				t >>>= 7;
			}
			if (t >= 8) {
				r += 4;
				t >>>= 4;
			}
			if (t >= 2) {
				r += 2;
				t >>>= 2;
			}
			return r + t;
		};
		BN.prototype._zeroBits = function _zeroBits(w) {
			if (w === 0) return 26;
			var t = w;
			var r = 0;
			if ((t & 8191) === 0) {
				r += 13;
				t >>>= 13;
			}
			if ((t & 127) === 0) {
				r += 7;
				t >>>= 7;
			}
			if ((t & 15) === 0) {
				r += 4;
				t >>>= 4;
			}
			if ((t & 3) === 0) {
				r += 2;
				t >>>= 2;
			}
			if ((t & 1) === 0) r++;
			return r;
		};
		BN.prototype.bitLength = function bitLength() {
			var w = this.words[this.length - 1];
			var hi = this._countBits(w);
			return (this.length - 1) * 26 + hi;
		};
		function toBitArray(num) {
			var w = new Array(num.bitLength());
			for (var bit = 0; bit < w.length; bit++) {
				var off = bit / 26 | 0;
				var wbit = bit % 26;
				w[bit] = (num.words[off] & 1 << wbit) >>> wbit;
			}
			return w;
		}
		BN.prototype.zeroBits = function zeroBits() {
			if (this.isZero()) return 0;
			var r = 0;
			for (var i = 0; i < this.length; i++) {
				var b = this._zeroBits(this.words[i]);
				r += b;
				if (b !== 26) break;
			}
			return r;
		};
		BN.prototype.byteLength = function byteLength() {
			return Math.ceil(this.bitLength() / 8);
		};
		BN.prototype.toTwos = function toTwos(width) {
			if (this.negative !== 0) return this.abs().inotn(width).iaddn(1);
			return this.clone();
		};
		BN.prototype.fromTwos = function fromTwos(width) {
			if (this.testn(width - 1)) return this.notn(width).iaddn(1).ineg();
			return this.clone();
		};
		BN.prototype.isNeg = function isNeg() {
			return this.negative !== 0;
		};
		BN.prototype.neg = function neg() {
			return this.clone().ineg();
		};
		BN.prototype.ineg = function ineg() {
			if (!this.isZero()) this.negative ^= 1;
			return this;
		};
		BN.prototype.iuor = function iuor(num) {
			while (this.length < num.length) this.words[this.length++] = 0;
			for (var i = 0; i < num.length; i++) this.words[i] = this.words[i] | num.words[i];
			return this.strip();
		};
		BN.prototype.ior = function ior(num) {
			assert((this.negative | num.negative) === 0);
			return this.iuor(num);
		};
		BN.prototype.or = function or(num) {
			if (this.length > num.length) return this.clone().ior(num);
			return num.clone().ior(this);
		};
		BN.prototype.uor = function uor(num) {
			if (this.length > num.length) return this.clone().iuor(num);
			return num.clone().iuor(this);
		};
		BN.prototype.iuand = function iuand(num) {
			var b;
			if (this.length > num.length) b = num;
			else b = this;
			for (var i = 0; i < b.length; i++) this.words[i] = this.words[i] & num.words[i];
			this.length = b.length;
			return this.strip();
		};
		BN.prototype.iand = function iand(num) {
			assert((this.negative | num.negative) === 0);
			return this.iuand(num);
		};
		BN.prototype.and = function and(num) {
			if (this.length > num.length) return this.clone().iand(num);
			return num.clone().iand(this);
		};
		BN.prototype.uand = function uand(num) {
			if (this.length > num.length) return this.clone().iuand(num);
			return num.clone().iuand(this);
		};
		BN.prototype.iuxor = function iuxor(num) {
			var a;
			var b;
			if (this.length > num.length) {
				a = this;
				b = num;
			} else {
				a = num;
				b = this;
			}
			for (var i = 0; i < b.length; i++) this.words[i] = a.words[i] ^ b.words[i];
			if (this !== a) for (; i < a.length; i++) this.words[i] = a.words[i];
			this.length = a.length;
			return this.strip();
		};
		BN.prototype.ixor = function ixor(num) {
			assert((this.negative | num.negative) === 0);
			return this.iuxor(num);
		};
		BN.prototype.xor = function xor(num) {
			if (this.length > num.length) return this.clone().ixor(num);
			return num.clone().ixor(this);
		};
		BN.prototype.uxor = function uxor(num) {
			if (this.length > num.length) return this.clone().iuxor(num);
			return num.clone().iuxor(this);
		};
		BN.prototype.inotn = function inotn(width) {
			assert(typeof width === "number" && width >= 0);
			var bytesNeeded = Math.ceil(width / 26) | 0;
			var bitsLeft = width % 26;
			this._expand(bytesNeeded);
			if (bitsLeft > 0) bytesNeeded--;
			for (var i = 0; i < bytesNeeded; i++) this.words[i] = ~this.words[i] & 67108863;
			if (bitsLeft > 0) {
				this.words[i] = ~this.words[i] & 67108863 >> 26 - bitsLeft;
				i++;
			}
			for (; i < this.length; i++) this.words[i] = 0;
			return this.strip();
		};
		BN.prototype.notn = function notn(width) {
			return this.clone().inotn(width);
		};
		BN.prototype.setn = function setn(bit, val) {
			assert(typeof bit === "number" && bit >= 0);
			var off = bit / 26 | 0;
			var wbit = bit % 26;
			this._expand(off + 1);
			if (val) this.words[off] = this.words[off] | 1 << wbit;
			else this.words[off] = this.words[off] & ~(1 << wbit);
			return this.strip();
		};
		BN.prototype.iadd = function iadd(num) {
			var r;
			if (this.negative !== 0 && num.negative === 0) {
				this.negative = 0;
				r = this.isub(num);
				this.negative ^= 1;
				return this._normSign();
			} else if (this.negative === 0 && num.negative !== 0) {
				num.negative = 0;
				r = this.isub(num);
				num.negative = 1;
				return r._normSign();
			}
			var a, b;
			if (this.length > num.length) {
				a = this;
				b = num;
			} else {
				a = num;
				b = this;
			}
			var carry = 0;
			for (var i = 0; i < b.length; i++) {
				r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
				this.words[i] = r & 67108863;
				carry = r >>> 26;
			}
			for (; carry !== 0 && i < a.length; i++) {
				r = (a.words[i] | 0) + carry;
				this.words[i] = r & 67108863;
				carry = r >>> 26;
			}
			this.length = a.length;
			if (carry !== 0) {
				this.words[this.length] = carry;
				this.length++;
			} else if (a !== this) for (; i < a.length; i++) this.words[i] = a.words[i];
			return this;
		};
		BN.prototype.add = function add(num) {
			var res;
			if (num.negative !== 0 && this.negative === 0) {
				num.negative = 0;
				res = this.sub(num);
				num.negative ^= 1;
				return res;
			} else if (num.negative === 0 && this.negative !== 0) {
				this.negative = 0;
				res = num.sub(this);
				this.negative = 1;
				return res;
			}
			if (this.length > num.length) return this.clone().iadd(num);
			return num.clone().iadd(this);
		};
		BN.prototype.isub = function isub(num) {
			if (num.negative !== 0) {
				num.negative = 0;
				var r = this.iadd(num);
				num.negative = 1;
				return r._normSign();
			} else if (this.negative !== 0) {
				this.negative = 0;
				this.iadd(num);
				this.negative = 1;
				return this._normSign();
			}
			var cmp = this.cmp(num);
			if (cmp === 0) {
				this.negative = 0;
				this.length = 1;
				this.words[0] = 0;
				return this;
			}
			var a, b;
			if (cmp > 0) {
				a = this;
				b = num;
			} else {
				a = num;
				b = this;
			}
			var carry = 0;
			for (var i = 0; i < b.length; i++) {
				r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
				carry = r >> 26;
				this.words[i] = r & 67108863;
			}
			for (; carry !== 0 && i < a.length; i++) {
				r = (a.words[i] | 0) + carry;
				carry = r >> 26;
				this.words[i] = r & 67108863;
			}
			if (carry === 0 && i < a.length && a !== this) for (; i < a.length; i++) this.words[i] = a.words[i];
			this.length = Math.max(this.length, i);
			if (a !== this) this.negative = 1;
			return this.strip();
		};
		BN.prototype.sub = function sub(num) {
			return this.clone().isub(num);
		};
		function smallMulTo(self, num, out) {
			out.negative = num.negative ^ self.negative;
			var len = self.length + num.length | 0;
			out.length = len;
			len = len - 1 | 0;
			var a = self.words[0] | 0;
			var b = num.words[0] | 0;
			var r = a * b;
			var lo = r & 67108863;
			var carry = r / 67108864 | 0;
			out.words[0] = lo;
			for (var k = 1; k < len; k++) {
				var ncarry = carry >>> 26;
				var rword = carry & 67108863;
				var maxJ = Math.min(k, num.length - 1);
				for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
					var i = k - j | 0;
					a = self.words[i] | 0;
					b = num.words[j] | 0;
					r = a * b + rword;
					ncarry += r / 67108864 | 0;
					rword = r & 67108863;
				}
				out.words[k] = rword | 0;
				carry = ncarry | 0;
			}
			if (carry !== 0) out.words[k] = carry | 0;
			else out.length--;
			return out.strip();
		}
		var comb10MulTo = function comb10MulTo(self, num, out) {
			var a = self.words;
			var b = num.words;
			var o = out.words;
			var c = 0;
			var lo;
			var mid;
			var hi;
			var a0 = a[0] | 0;
			var al0 = a0 & 8191;
			var ah0 = a0 >>> 13;
			var a1 = a[1] | 0;
			var al1 = a1 & 8191;
			var ah1 = a1 >>> 13;
			var a2 = a[2] | 0;
			var al2 = a2 & 8191;
			var ah2 = a2 >>> 13;
			var a3 = a[3] | 0;
			var al3 = a3 & 8191;
			var ah3 = a3 >>> 13;
			var a4 = a[4] | 0;
			var al4 = a4 & 8191;
			var ah4 = a4 >>> 13;
			var a5 = a[5] | 0;
			var al5 = a5 & 8191;
			var ah5 = a5 >>> 13;
			var a6 = a[6] | 0;
			var al6 = a6 & 8191;
			var ah6 = a6 >>> 13;
			var a7 = a[7] | 0;
			var al7 = a7 & 8191;
			var ah7 = a7 >>> 13;
			var a8 = a[8] | 0;
			var al8 = a8 & 8191;
			var ah8 = a8 >>> 13;
			var a9 = a[9] | 0;
			var al9 = a9 & 8191;
			var ah9 = a9 >>> 13;
			var b0 = b[0] | 0;
			var bl0 = b0 & 8191;
			var bh0 = b0 >>> 13;
			var b1 = b[1] | 0;
			var bl1 = b1 & 8191;
			var bh1 = b1 >>> 13;
			var b2 = b[2] | 0;
			var bl2 = b2 & 8191;
			var bh2 = b2 >>> 13;
			var b3 = b[3] | 0;
			var bl3 = b3 & 8191;
			var bh3 = b3 >>> 13;
			var b4 = b[4] | 0;
			var bl4 = b4 & 8191;
			var bh4 = b4 >>> 13;
			var b5 = b[5] | 0;
			var bl5 = b5 & 8191;
			var bh5 = b5 >>> 13;
			var b6 = b[6] | 0;
			var bl6 = b6 & 8191;
			var bh6 = b6 >>> 13;
			var b7 = b[7] | 0;
			var bl7 = b7 & 8191;
			var bh7 = b7 >>> 13;
			var b8 = b[8] | 0;
			var bl8 = b8 & 8191;
			var bh8 = b8 >>> 13;
			var b9 = b[9] | 0;
			var bl9 = b9 & 8191;
			var bh9 = b9 >>> 13;
			out.negative = self.negative ^ num.negative;
			out.length = 19;
			lo = Math.imul(al0, bl0);
			mid = Math.imul(al0, bh0);
			mid = mid + Math.imul(ah0, bl0) | 0;
			hi = Math.imul(ah0, bh0);
			var w0 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w0 >>> 26) | 0;
			w0 &= 67108863;
			lo = Math.imul(al1, bl0);
			mid = Math.imul(al1, bh0);
			mid = mid + Math.imul(ah1, bl0) | 0;
			hi = Math.imul(ah1, bh0);
			lo = lo + Math.imul(al0, bl1) | 0;
			mid = mid + Math.imul(al0, bh1) | 0;
			mid = mid + Math.imul(ah0, bl1) | 0;
			hi = hi + Math.imul(ah0, bh1) | 0;
			var w1 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w1 >>> 26) | 0;
			w1 &= 67108863;
			lo = Math.imul(al2, bl0);
			mid = Math.imul(al2, bh0);
			mid = mid + Math.imul(ah2, bl0) | 0;
			hi = Math.imul(ah2, bh0);
			lo = lo + Math.imul(al1, bl1) | 0;
			mid = mid + Math.imul(al1, bh1) | 0;
			mid = mid + Math.imul(ah1, bl1) | 0;
			hi = hi + Math.imul(ah1, bh1) | 0;
			lo = lo + Math.imul(al0, bl2) | 0;
			mid = mid + Math.imul(al0, bh2) | 0;
			mid = mid + Math.imul(ah0, bl2) | 0;
			hi = hi + Math.imul(ah0, bh2) | 0;
			var w2 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w2 >>> 26) | 0;
			w2 &= 67108863;
			lo = Math.imul(al3, bl0);
			mid = Math.imul(al3, bh0);
			mid = mid + Math.imul(ah3, bl0) | 0;
			hi = Math.imul(ah3, bh0);
			lo = lo + Math.imul(al2, bl1) | 0;
			mid = mid + Math.imul(al2, bh1) | 0;
			mid = mid + Math.imul(ah2, bl1) | 0;
			hi = hi + Math.imul(ah2, bh1) | 0;
			lo = lo + Math.imul(al1, bl2) | 0;
			mid = mid + Math.imul(al1, bh2) | 0;
			mid = mid + Math.imul(ah1, bl2) | 0;
			hi = hi + Math.imul(ah1, bh2) | 0;
			lo = lo + Math.imul(al0, bl3) | 0;
			mid = mid + Math.imul(al0, bh3) | 0;
			mid = mid + Math.imul(ah0, bl3) | 0;
			hi = hi + Math.imul(ah0, bh3) | 0;
			var w3 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w3 >>> 26) | 0;
			w3 &= 67108863;
			lo = Math.imul(al4, bl0);
			mid = Math.imul(al4, bh0);
			mid = mid + Math.imul(ah4, bl0) | 0;
			hi = Math.imul(ah4, bh0);
			lo = lo + Math.imul(al3, bl1) | 0;
			mid = mid + Math.imul(al3, bh1) | 0;
			mid = mid + Math.imul(ah3, bl1) | 0;
			hi = hi + Math.imul(ah3, bh1) | 0;
			lo = lo + Math.imul(al2, bl2) | 0;
			mid = mid + Math.imul(al2, bh2) | 0;
			mid = mid + Math.imul(ah2, bl2) | 0;
			hi = hi + Math.imul(ah2, bh2) | 0;
			lo = lo + Math.imul(al1, bl3) | 0;
			mid = mid + Math.imul(al1, bh3) | 0;
			mid = mid + Math.imul(ah1, bl3) | 0;
			hi = hi + Math.imul(ah1, bh3) | 0;
			lo = lo + Math.imul(al0, bl4) | 0;
			mid = mid + Math.imul(al0, bh4) | 0;
			mid = mid + Math.imul(ah0, bl4) | 0;
			hi = hi + Math.imul(ah0, bh4) | 0;
			var w4 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w4 >>> 26) | 0;
			w4 &= 67108863;
			lo = Math.imul(al5, bl0);
			mid = Math.imul(al5, bh0);
			mid = mid + Math.imul(ah5, bl0) | 0;
			hi = Math.imul(ah5, bh0);
			lo = lo + Math.imul(al4, bl1) | 0;
			mid = mid + Math.imul(al4, bh1) | 0;
			mid = mid + Math.imul(ah4, bl1) | 0;
			hi = hi + Math.imul(ah4, bh1) | 0;
			lo = lo + Math.imul(al3, bl2) | 0;
			mid = mid + Math.imul(al3, bh2) | 0;
			mid = mid + Math.imul(ah3, bl2) | 0;
			hi = hi + Math.imul(ah3, bh2) | 0;
			lo = lo + Math.imul(al2, bl3) | 0;
			mid = mid + Math.imul(al2, bh3) | 0;
			mid = mid + Math.imul(ah2, bl3) | 0;
			hi = hi + Math.imul(ah2, bh3) | 0;
			lo = lo + Math.imul(al1, bl4) | 0;
			mid = mid + Math.imul(al1, bh4) | 0;
			mid = mid + Math.imul(ah1, bl4) | 0;
			hi = hi + Math.imul(ah1, bh4) | 0;
			lo = lo + Math.imul(al0, bl5) | 0;
			mid = mid + Math.imul(al0, bh5) | 0;
			mid = mid + Math.imul(ah0, bl5) | 0;
			hi = hi + Math.imul(ah0, bh5) | 0;
			var w5 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w5 >>> 26) | 0;
			w5 &= 67108863;
			lo = Math.imul(al6, bl0);
			mid = Math.imul(al6, bh0);
			mid = mid + Math.imul(ah6, bl0) | 0;
			hi = Math.imul(ah6, bh0);
			lo = lo + Math.imul(al5, bl1) | 0;
			mid = mid + Math.imul(al5, bh1) | 0;
			mid = mid + Math.imul(ah5, bl1) | 0;
			hi = hi + Math.imul(ah5, bh1) | 0;
			lo = lo + Math.imul(al4, bl2) | 0;
			mid = mid + Math.imul(al4, bh2) | 0;
			mid = mid + Math.imul(ah4, bl2) | 0;
			hi = hi + Math.imul(ah4, bh2) | 0;
			lo = lo + Math.imul(al3, bl3) | 0;
			mid = mid + Math.imul(al3, bh3) | 0;
			mid = mid + Math.imul(ah3, bl3) | 0;
			hi = hi + Math.imul(ah3, bh3) | 0;
			lo = lo + Math.imul(al2, bl4) | 0;
			mid = mid + Math.imul(al2, bh4) | 0;
			mid = mid + Math.imul(ah2, bl4) | 0;
			hi = hi + Math.imul(ah2, bh4) | 0;
			lo = lo + Math.imul(al1, bl5) | 0;
			mid = mid + Math.imul(al1, bh5) | 0;
			mid = mid + Math.imul(ah1, bl5) | 0;
			hi = hi + Math.imul(ah1, bh5) | 0;
			lo = lo + Math.imul(al0, bl6) | 0;
			mid = mid + Math.imul(al0, bh6) | 0;
			mid = mid + Math.imul(ah0, bl6) | 0;
			hi = hi + Math.imul(ah0, bh6) | 0;
			var w6 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w6 >>> 26) | 0;
			w6 &= 67108863;
			lo = Math.imul(al7, bl0);
			mid = Math.imul(al7, bh0);
			mid = mid + Math.imul(ah7, bl0) | 0;
			hi = Math.imul(ah7, bh0);
			lo = lo + Math.imul(al6, bl1) | 0;
			mid = mid + Math.imul(al6, bh1) | 0;
			mid = mid + Math.imul(ah6, bl1) | 0;
			hi = hi + Math.imul(ah6, bh1) | 0;
			lo = lo + Math.imul(al5, bl2) | 0;
			mid = mid + Math.imul(al5, bh2) | 0;
			mid = mid + Math.imul(ah5, bl2) | 0;
			hi = hi + Math.imul(ah5, bh2) | 0;
			lo = lo + Math.imul(al4, bl3) | 0;
			mid = mid + Math.imul(al4, bh3) | 0;
			mid = mid + Math.imul(ah4, bl3) | 0;
			hi = hi + Math.imul(ah4, bh3) | 0;
			lo = lo + Math.imul(al3, bl4) | 0;
			mid = mid + Math.imul(al3, bh4) | 0;
			mid = mid + Math.imul(ah3, bl4) | 0;
			hi = hi + Math.imul(ah3, bh4) | 0;
			lo = lo + Math.imul(al2, bl5) | 0;
			mid = mid + Math.imul(al2, bh5) | 0;
			mid = mid + Math.imul(ah2, bl5) | 0;
			hi = hi + Math.imul(ah2, bh5) | 0;
			lo = lo + Math.imul(al1, bl6) | 0;
			mid = mid + Math.imul(al1, bh6) | 0;
			mid = mid + Math.imul(ah1, bl6) | 0;
			hi = hi + Math.imul(ah1, bh6) | 0;
			lo = lo + Math.imul(al0, bl7) | 0;
			mid = mid + Math.imul(al0, bh7) | 0;
			mid = mid + Math.imul(ah0, bl7) | 0;
			hi = hi + Math.imul(ah0, bh7) | 0;
			var w7 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w7 >>> 26) | 0;
			w7 &= 67108863;
			lo = Math.imul(al8, bl0);
			mid = Math.imul(al8, bh0);
			mid = mid + Math.imul(ah8, bl0) | 0;
			hi = Math.imul(ah8, bh0);
			lo = lo + Math.imul(al7, bl1) | 0;
			mid = mid + Math.imul(al7, bh1) | 0;
			mid = mid + Math.imul(ah7, bl1) | 0;
			hi = hi + Math.imul(ah7, bh1) | 0;
			lo = lo + Math.imul(al6, bl2) | 0;
			mid = mid + Math.imul(al6, bh2) | 0;
			mid = mid + Math.imul(ah6, bl2) | 0;
			hi = hi + Math.imul(ah6, bh2) | 0;
			lo = lo + Math.imul(al5, bl3) | 0;
			mid = mid + Math.imul(al5, bh3) | 0;
			mid = mid + Math.imul(ah5, bl3) | 0;
			hi = hi + Math.imul(ah5, bh3) | 0;
			lo = lo + Math.imul(al4, bl4) | 0;
			mid = mid + Math.imul(al4, bh4) | 0;
			mid = mid + Math.imul(ah4, bl4) | 0;
			hi = hi + Math.imul(ah4, bh4) | 0;
			lo = lo + Math.imul(al3, bl5) | 0;
			mid = mid + Math.imul(al3, bh5) | 0;
			mid = mid + Math.imul(ah3, bl5) | 0;
			hi = hi + Math.imul(ah3, bh5) | 0;
			lo = lo + Math.imul(al2, bl6) | 0;
			mid = mid + Math.imul(al2, bh6) | 0;
			mid = mid + Math.imul(ah2, bl6) | 0;
			hi = hi + Math.imul(ah2, bh6) | 0;
			lo = lo + Math.imul(al1, bl7) | 0;
			mid = mid + Math.imul(al1, bh7) | 0;
			mid = mid + Math.imul(ah1, bl7) | 0;
			hi = hi + Math.imul(ah1, bh7) | 0;
			lo = lo + Math.imul(al0, bl8) | 0;
			mid = mid + Math.imul(al0, bh8) | 0;
			mid = mid + Math.imul(ah0, bl8) | 0;
			hi = hi + Math.imul(ah0, bh8) | 0;
			var w8 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w8 >>> 26) | 0;
			w8 &= 67108863;
			lo = Math.imul(al9, bl0);
			mid = Math.imul(al9, bh0);
			mid = mid + Math.imul(ah9, bl0) | 0;
			hi = Math.imul(ah9, bh0);
			lo = lo + Math.imul(al8, bl1) | 0;
			mid = mid + Math.imul(al8, bh1) | 0;
			mid = mid + Math.imul(ah8, bl1) | 0;
			hi = hi + Math.imul(ah8, bh1) | 0;
			lo = lo + Math.imul(al7, bl2) | 0;
			mid = mid + Math.imul(al7, bh2) | 0;
			mid = mid + Math.imul(ah7, bl2) | 0;
			hi = hi + Math.imul(ah7, bh2) | 0;
			lo = lo + Math.imul(al6, bl3) | 0;
			mid = mid + Math.imul(al6, bh3) | 0;
			mid = mid + Math.imul(ah6, bl3) | 0;
			hi = hi + Math.imul(ah6, bh3) | 0;
			lo = lo + Math.imul(al5, bl4) | 0;
			mid = mid + Math.imul(al5, bh4) | 0;
			mid = mid + Math.imul(ah5, bl4) | 0;
			hi = hi + Math.imul(ah5, bh4) | 0;
			lo = lo + Math.imul(al4, bl5) | 0;
			mid = mid + Math.imul(al4, bh5) | 0;
			mid = mid + Math.imul(ah4, bl5) | 0;
			hi = hi + Math.imul(ah4, bh5) | 0;
			lo = lo + Math.imul(al3, bl6) | 0;
			mid = mid + Math.imul(al3, bh6) | 0;
			mid = mid + Math.imul(ah3, bl6) | 0;
			hi = hi + Math.imul(ah3, bh6) | 0;
			lo = lo + Math.imul(al2, bl7) | 0;
			mid = mid + Math.imul(al2, bh7) | 0;
			mid = mid + Math.imul(ah2, bl7) | 0;
			hi = hi + Math.imul(ah2, bh7) | 0;
			lo = lo + Math.imul(al1, bl8) | 0;
			mid = mid + Math.imul(al1, bh8) | 0;
			mid = mid + Math.imul(ah1, bl8) | 0;
			hi = hi + Math.imul(ah1, bh8) | 0;
			lo = lo + Math.imul(al0, bl9) | 0;
			mid = mid + Math.imul(al0, bh9) | 0;
			mid = mid + Math.imul(ah0, bl9) | 0;
			hi = hi + Math.imul(ah0, bh9) | 0;
			var w9 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w9 >>> 26) | 0;
			w9 &= 67108863;
			lo = Math.imul(al9, bl1);
			mid = Math.imul(al9, bh1);
			mid = mid + Math.imul(ah9, bl1) | 0;
			hi = Math.imul(ah9, bh1);
			lo = lo + Math.imul(al8, bl2) | 0;
			mid = mid + Math.imul(al8, bh2) | 0;
			mid = mid + Math.imul(ah8, bl2) | 0;
			hi = hi + Math.imul(ah8, bh2) | 0;
			lo = lo + Math.imul(al7, bl3) | 0;
			mid = mid + Math.imul(al7, bh3) | 0;
			mid = mid + Math.imul(ah7, bl3) | 0;
			hi = hi + Math.imul(ah7, bh3) | 0;
			lo = lo + Math.imul(al6, bl4) | 0;
			mid = mid + Math.imul(al6, bh4) | 0;
			mid = mid + Math.imul(ah6, bl4) | 0;
			hi = hi + Math.imul(ah6, bh4) | 0;
			lo = lo + Math.imul(al5, bl5) | 0;
			mid = mid + Math.imul(al5, bh5) | 0;
			mid = mid + Math.imul(ah5, bl5) | 0;
			hi = hi + Math.imul(ah5, bh5) | 0;
			lo = lo + Math.imul(al4, bl6) | 0;
			mid = mid + Math.imul(al4, bh6) | 0;
			mid = mid + Math.imul(ah4, bl6) | 0;
			hi = hi + Math.imul(ah4, bh6) | 0;
			lo = lo + Math.imul(al3, bl7) | 0;
			mid = mid + Math.imul(al3, bh7) | 0;
			mid = mid + Math.imul(ah3, bl7) | 0;
			hi = hi + Math.imul(ah3, bh7) | 0;
			lo = lo + Math.imul(al2, bl8) | 0;
			mid = mid + Math.imul(al2, bh8) | 0;
			mid = mid + Math.imul(ah2, bl8) | 0;
			hi = hi + Math.imul(ah2, bh8) | 0;
			lo = lo + Math.imul(al1, bl9) | 0;
			mid = mid + Math.imul(al1, bh9) | 0;
			mid = mid + Math.imul(ah1, bl9) | 0;
			hi = hi + Math.imul(ah1, bh9) | 0;
			var w10 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w10 >>> 26) | 0;
			w10 &= 67108863;
			lo = Math.imul(al9, bl2);
			mid = Math.imul(al9, bh2);
			mid = mid + Math.imul(ah9, bl2) | 0;
			hi = Math.imul(ah9, bh2);
			lo = lo + Math.imul(al8, bl3) | 0;
			mid = mid + Math.imul(al8, bh3) | 0;
			mid = mid + Math.imul(ah8, bl3) | 0;
			hi = hi + Math.imul(ah8, bh3) | 0;
			lo = lo + Math.imul(al7, bl4) | 0;
			mid = mid + Math.imul(al7, bh4) | 0;
			mid = mid + Math.imul(ah7, bl4) | 0;
			hi = hi + Math.imul(ah7, bh4) | 0;
			lo = lo + Math.imul(al6, bl5) | 0;
			mid = mid + Math.imul(al6, bh5) | 0;
			mid = mid + Math.imul(ah6, bl5) | 0;
			hi = hi + Math.imul(ah6, bh5) | 0;
			lo = lo + Math.imul(al5, bl6) | 0;
			mid = mid + Math.imul(al5, bh6) | 0;
			mid = mid + Math.imul(ah5, bl6) | 0;
			hi = hi + Math.imul(ah5, bh6) | 0;
			lo = lo + Math.imul(al4, bl7) | 0;
			mid = mid + Math.imul(al4, bh7) | 0;
			mid = mid + Math.imul(ah4, bl7) | 0;
			hi = hi + Math.imul(ah4, bh7) | 0;
			lo = lo + Math.imul(al3, bl8) | 0;
			mid = mid + Math.imul(al3, bh8) | 0;
			mid = mid + Math.imul(ah3, bl8) | 0;
			hi = hi + Math.imul(ah3, bh8) | 0;
			lo = lo + Math.imul(al2, bl9) | 0;
			mid = mid + Math.imul(al2, bh9) | 0;
			mid = mid + Math.imul(ah2, bl9) | 0;
			hi = hi + Math.imul(ah2, bh9) | 0;
			var w11 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w11 >>> 26) | 0;
			w11 &= 67108863;
			lo = Math.imul(al9, bl3);
			mid = Math.imul(al9, bh3);
			mid = mid + Math.imul(ah9, bl3) | 0;
			hi = Math.imul(ah9, bh3);
			lo = lo + Math.imul(al8, bl4) | 0;
			mid = mid + Math.imul(al8, bh4) | 0;
			mid = mid + Math.imul(ah8, bl4) | 0;
			hi = hi + Math.imul(ah8, bh4) | 0;
			lo = lo + Math.imul(al7, bl5) | 0;
			mid = mid + Math.imul(al7, bh5) | 0;
			mid = mid + Math.imul(ah7, bl5) | 0;
			hi = hi + Math.imul(ah7, bh5) | 0;
			lo = lo + Math.imul(al6, bl6) | 0;
			mid = mid + Math.imul(al6, bh6) | 0;
			mid = mid + Math.imul(ah6, bl6) | 0;
			hi = hi + Math.imul(ah6, bh6) | 0;
			lo = lo + Math.imul(al5, bl7) | 0;
			mid = mid + Math.imul(al5, bh7) | 0;
			mid = mid + Math.imul(ah5, bl7) | 0;
			hi = hi + Math.imul(ah5, bh7) | 0;
			lo = lo + Math.imul(al4, bl8) | 0;
			mid = mid + Math.imul(al4, bh8) | 0;
			mid = mid + Math.imul(ah4, bl8) | 0;
			hi = hi + Math.imul(ah4, bh8) | 0;
			lo = lo + Math.imul(al3, bl9) | 0;
			mid = mid + Math.imul(al3, bh9) | 0;
			mid = mid + Math.imul(ah3, bl9) | 0;
			hi = hi + Math.imul(ah3, bh9) | 0;
			var w12 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w12 >>> 26) | 0;
			w12 &= 67108863;
			lo = Math.imul(al9, bl4);
			mid = Math.imul(al9, bh4);
			mid = mid + Math.imul(ah9, bl4) | 0;
			hi = Math.imul(ah9, bh4);
			lo = lo + Math.imul(al8, bl5) | 0;
			mid = mid + Math.imul(al8, bh5) | 0;
			mid = mid + Math.imul(ah8, bl5) | 0;
			hi = hi + Math.imul(ah8, bh5) | 0;
			lo = lo + Math.imul(al7, bl6) | 0;
			mid = mid + Math.imul(al7, bh6) | 0;
			mid = mid + Math.imul(ah7, bl6) | 0;
			hi = hi + Math.imul(ah7, bh6) | 0;
			lo = lo + Math.imul(al6, bl7) | 0;
			mid = mid + Math.imul(al6, bh7) | 0;
			mid = mid + Math.imul(ah6, bl7) | 0;
			hi = hi + Math.imul(ah6, bh7) | 0;
			lo = lo + Math.imul(al5, bl8) | 0;
			mid = mid + Math.imul(al5, bh8) | 0;
			mid = mid + Math.imul(ah5, bl8) | 0;
			hi = hi + Math.imul(ah5, bh8) | 0;
			lo = lo + Math.imul(al4, bl9) | 0;
			mid = mid + Math.imul(al4, bh9) | 0;
			mid = mid + Math.imul(ah4, bl9) | 0;
			hi = hi + Math.imul(ah4, bh9) | 0;
			var w13 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w13 >>> 26) | 0;
			w13 &= 67108863;
			lo = Math.imul(al9, bl5);
			mid = Math.imul(al9, bh5);
			mid = mid + Math.imul(ah9, bl5) | 0;
			hi = Math.imul(ah9, bh5);
			lo = lo + Math.imul(al8, bl6) | 0;
			mid = mid + Math.imul(al8, bh6) | 0;
			mid = mid + Math.imul(ah8, bl6) | 0;
			hi = hi + Math.imul(ah8, bh6) | 0;
			lo = lo + Math.imul(al7, bl7) | 0;
			mid = mid + Math.imul(al7, bh7) | 0;
			mid = mid + Math.imul(ah7, bl7) | 0;
			hi = hi + Math.imul(ah7, bh7) | 0;
			lo = lo + Math.imul(al6, bl8) | 0;
			mid = mid + Math.imul(al6, bh8) | 0;
			mid = mid + Math.imul(ah6, bl8) | 0;
			hi = hi + Math.imul(ah6, bh8) | 0;
			lo = lo + Math.imul(al5, bl9) | 0;
			mid = mid + Math.imul(al5, bh9) | 0;
			mid = mid + Math.imul(ah5, bl9) | 0;
			hi = hi + Math.imul(ah5, bh9) | 0;
			var w14 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w14 >>> 26) | 0;
			w14 &= 67108863;
			lo = Math.imul(al9, bl6);
			mid = Math.imul(al9, bh6);
			mid = mid + Math.imul(ah9, bl6) | 0;
			hi = Math.imul(ah9, bh6);
			lo = lo + Math.imul(al8, bl7) | 0;
			mid = mid + Math.imul(al8, bh7) | 0;
			mid = mid + Math.imul(ah8, bl7) | 0;
			hi = hi + Math.imul(ah8, bh7) | 0;
			lo = lo + Math.imul(al7, bl8) | 0;
			mid = mid + Math.imul(al7, bh8) | 0;
			mid = mid + Math.imul(ah7, bl8) | 0;
			hi = hi + Math.imul(ah7, bh8) | 0;
			lo = lo + Math.imul(al6, bl9) | 0;
			mid = mid + Math.imul(al6, bh9) | 0;
			mid = mid + Math.imul(ah6, bl9) | 0;
			hi = hi + Math.imul(ah6, bh9) | 0;
			var w15 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w15 >>> 26) | 0;
			w15 &= 67108863;
			lo = Math.imul(al9, bl7);
			mid = Math.imul(al9, bh7);
			mid = mid + Math.imul(ah9, bl7) | 0;
			hi = Math.imul(ah9, bh7);
			lo = lo + Math.imul(al8, bl8) | 0;
			mid = mid + Math.imul(al8, bh8) | 0;
			mid = mid + Math.imul(ah8, bl8) | 0;
			hi = hi + Math.imul(ah8, bh8) | 0;
			lo = lo + Math.imul(al7, bl9) | 0;
			mid = mid + Math.imul(al7, bh9) | 0;
			mid = mid + Math.imul(ah7, bl9) | 0;
			hi = hi + Math.imul(ah7, bh9) | 0;
			var w16 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w16 >>> 26) | 0;
			w16 &= 67108863;
			lo = Math.imul(al9, bl8);
			mid = Math.imul(al9, bh8);
			mid = mid + Math.imul(ah9, bl8) | 0;
			hi = Math.imul(ah9, bh8);
			lo = lo + Math.imul(al8, bl9) | 0;
			mid = mid + Math.imul(al8, bh9) | 0;
			mid = mid + Math.imul(ah8, bl9) | 0;
			hi = hi + Math.imul(ah8, bh9) | 0;
			var w17 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w17 >>> 26) | 0;
			w17 &= 67108863;
			lo = Math.imul(al9, bl9);
			mid = Math.imul(al9, bh9);
			mid = mid + Math.imul(ah9, bl9) | 0;
			hi = Math.imul(ah9, bh9);
			var w18 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w18 >>> 26) | 0;
			w18 &= 67108863;
			o[0] = w0;
			o[1] = w1;
			o[2] = w2;
			o[3] = w3;
			o[4] = w4;
			o[5] = w5;
			o[6] = w6;
			o[7] = w7;
			o[8] = w8;
			o[9] = w9;
			o[10] = w10;
			o[11] = w11;
			o[12] = w12;
			o[13] = w13;
			o[14] = w14;
			o[15] = w15;
			o[16] = w16;
			o[17] = w17;
			o[18] = w18;
			if (c !== 0) {
				o[19] = c;
				out.length++;
			}
			return out;
		};
		if (!Math.imul) comb10MulTo = smallMulTo;
		function bigMulTo(self, num, out) {
			out.negative = num.negative ^ self.negative;
			out.length = self.length + num.length;
			var carry = 0;
			var hncarry = 0;
			for (var k = 0; k < out.length - 1; k++) {
				var ncarry = hncarry;
				hncarry = 0;
				var rword = carry & 67108863;
				var maxJ = Math.min(k, num.length - 1);
				for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
					var i = k - j;
					var r = (self.words[i] | 0) * (num.words[j] | 0);
					var lo = r & 67108863;
					ncarry = ncarry + (r / 67108864 | 0) | 0;
					lo = lo + rword | 0;
					rword = lo & 67108863;
					ncarry = ncarry + (lo >>> 26) | 0;
					hncarry += ncarry >>> 26;
					ncarry &= 67108863;
				}
				out.words[k] = rword;
				carry = ncarry;
				ncarry = hncarry;
			}
			if (carry !== 0) out.words[k] = carry;
			else out.length--;
			return out.strip();
		}
		function jumboMulTo(self, num, out) {
			return new FFTM().mulp(self, num, out);
		}
		BN.prototype.mulTo = function mulTo(num, out) {
			var res;
			var len = this.length + num.length;
			if (this.length === 10 && num.length === 10) res = comb10MulTo(this, num, out);
			else if (len < 63) res = smallMulTo(this, num, out);
			else if (len < 1024) res = bigMulTo(this, num, out);
			else res = jumboMulTo(this, num, out);
			return res;
		};
		function FFTM(x, y) {
			this.x = x;
			this.y = y;
		}
		FFTM.prototype.makeRBT = function makeRBT(N) {
			var t = new Array(N);
			var l = BN.prototype._countBits(N) - 1;
			for (var i = 0; i < N; i++) t[i] = this.revBin(i, l, N);
			return t;
		};
		FFTM.prototype.revBin = function revBin(x, l, N) {
			if (x === 0 || x === N - 1) return x;
			var rb = 0;
			for (var i = 0; i < l; i++) {
				rb |= (x & 1) << l - i - 1;
				x >>= 1;
			}
			return rb;
		};
		FFTM.prototype.permute = function permute(rbt, rws, iws, rtws, itws, N) {
			for (var i = 0; i < N; i++) {
				rtws[i] = rws[rbt[i]];
				itws[i] = iws[rbt[i]];
			}
		};
		FFTM.prototype.transform = function transform(rws, iws, rtws, itws, N, rbt) {
			this.permute(rbt, rws, iws, rtws, itws, N);
			for (var s = 1; s < N; s <<= 1) {
				var l = s << 1;
				var rtwdf = Math.cos(2 * Math.PI / l);
				var itwdf = Math.sin(2 * Math.PI / l);
				for (var p = 0; p < N; p += l) {
					var rtwdf_ = rtwdf;
					var itwdf_ = itwdf;
					for (var j = 0; j < s; j++) {
						var re = rtws[p + j];
						var ie = itws[p + j];
						var ro = rtws[p + j + s];
						var io = itws[p + j + s];
						var rx = rtwdf_ * ro - itwdf_ * io;
						io = rtwdf_ * io + itwdf_ * ro;
						ro = rx;
						rtws[p + j] = re + ro;
						itws[p + j] = ie + io;
						rtws[p + j + s] = re - ro;
						itws[p + j + s] = ie - io;
						if (j !== l) {
							rx = rtwdf * rtwdf_ - itwdf * itwdf_;
							itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
							rtwdf_ = rx;
						}
					}
				}
			}
		};
		FFTM.prototype.guessLen13b = function guessLen13b(n, m) {
			var N = Math.max(m, n) | 1;
			var odd = N & 1;
			var i = 0;
			for (N = N / 2 | 0; N; N = N >>> 1) i++;
			return 1 << i + 1 + odd;
		};
		FFTM.prototype.conjugate = function conjugate(rws, iws, N) {
			if (N <= 1) return;
			for (var i = 0; i < N / 2; i++) {
				var t = rws[i];
				rws[i] = rws[N - i - 1];
				rws[N - i - 1] = t;
				t = iws[i];
				iws[i] = -iws[N - i - 1];
				iws[N - i - 1] = -t;
			}
		};
		FFTM.prototype.normalize13b = function normalize13b(ws, N) {
			var carry = 0;
			for (var i = 0; i < N / 2; i++) {
				var w = Math.round(ws[2 * i + 1] / N) * 8192 + Math.round(ws[2 * i] / N) + carry;
				ws[i] = w & 67108863;
				if (w < 67108864) carry = 0;
				else carry = w / 67108864 | 0;
			}
			return ws;
		};
		FFTM.prototype.convert13b = function convert13b(ws, len, rws, N) {
			var carry = 0;
			for (var i = 0; i < len; i++) {
				carry = carry + (ws[i] | 0);
				rws[2 * i] = carry & 8191;
				carry = carry >>> 13;
				rws[2 * i + 1] = carry & 8191;
				carry = carry >>> 13;
			}
			for (i = 2 * len; i < N; ++i) rws[i] = 0;
			assert(carry === 0);
			assert((carry & -8192) === 0);
		};
		FFTM.prototype.stub = function stub(N) {
			var ph = new Array(N);
			for (var i = 0; i < N; i++) ph[i] = 0;
			return ph;
		};
		FFTM.prototype.mulp = function mulp(x, y, out) {
			var N = 2 * this.guessLen13b(x.length, y.length);
			var rbt = this.makeRBT(N);
			var _ = this.stub(N);
			var rws = new Array(N);
			var rwst = new Array(N);
			var iwst = new Array(N);
			var nrws = new Array(N);
			var nrwst = new Array(N);
			var niwst = new Array(N);
			var rmws = out.words;
			rmws.length = N;
			this.convert13b(x.words, x.length, rws, N);
			this.convert13b(y.words, y.length, nrws, N);
			this.transform(rws, _, rwst, iwst, N, rbt);
			this.transform(nrws, _, nrwst, niwst, N, rbt);
			for (var i = 0; i < N; i++) {
				var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
				iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
				rwst[i] = rx;
			}
			this.conjugate(rwst, iwst, N);
			this.transform(rwst, iwst, rmws, _, N, rbt);
			this.conjugate(rmws, _, N);
			this.normalize13b(rmws, N);
			out.negative = x.negative ^ y.negative;
			out.length = x.length + y.length;
			return out.strip();
		};
		BN.prototype.mul = function mul(num) {
			var out = new BN(null);
			out.words = new Array(this.length + num.length);
			return this.mulTo(num, out);
		};
		BN.prototype.mulf = function mulf(num) {
			var out = new BN(null);
			out.words = new Array(this.length + num.length);
			return jumboMulTo(this, num, out);
		};
		BN.prototype.imul = function imul(num) {
			return this.clone().mulTo(num, this);
		};
		BN.prototype.imuln = function imuln(num) {
			assert(typeof num === "number");
			assert(num < 67108864);
			var carry = 0;
			for (var i = 0; i < this.length; i++) {
				var w = (this.words[i] | 0) * num;
				var lo = (w & 67108863) + (carry & 67108863);
				carry >>= 26;
				carry += w / 67108864 | 0;
				carry += lo >>> 26;
				this.words[i] = lo & 67108863;
			}
			if (carry !== 0) {
				this.words[i] = carry;
				this.length++;
			}
			if (num === 0) {
				this.length = 1;
				this._normSign();
			}
			return this;
		};
		BN.prototype.muln = function muln(num) {
			return this.clone().imuln(num);
		};
		BN.prototype.sqr = function sqr() {
			return this.mul(this);
		};
		BN.prototype.isqr = function isqr() {
			return this.imul(this.clone());
		};
		BN.prototype.pow = function pow(num) {
			var w = toBitArray(num);
			if (w.length === 0) return new BN(1);
			var res = this;
			for (var i = 0; i < w.length; i++, res = res.sqr()) if (w[i] !== 0) break;
			if (++i < w.length) for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
				if (w[i] === 0) continue;
				res = res.mul(q);
			}
			return res;
		};
		BN.prototype.iushln = function iushln(bits) {
			assert(typeof bits === "number" && bits >= 0);
			var r = bits % 26;
			var s = (bits - r) / 26;
			var carryMask = 67108863 >>> 26 - r << 26 - r;
			var i;
			if (r !== 0) {
				var carry = 0;
				for (i = 0; i < this.length; i++) {
					var newCarry = this.words[i] & carryMask;
					var c = (this.words[i] | 0) - newCarry << r;
					this.words[i] = c | carry;
					carry = newCarry >>> 26 - r;
				}
				if (carry) {
					this.words[i] = carry;
					this.length++;
				}
			}
			if (s !== 0) {
				for (i = this.length - 1; i >= 0; i--) this.words[i + s] = this.words[i];
				for (i = 0; i < s; i++) this.words[i] = 0;
				this.length += s;
			}
			return this.strip();
		};
		BN.prototype.ishln = function ishln(bits) {
			assert(this.negative === 0);
			return this.iushln(bits);
		};
		BN.prototype.iushrn = function iushrn(bits, hint, extended) {
			assert(typeof bits === "number" && bits >= 0);
			var h;
			if (hint) h = (hint - hint % 26) / 26;
			else h = 0;
			var r = bits % 26;
			var s = Math.min((bits - r) / 26, this.length);
			var mask = 67108863 ^ 67108863 >>> r << r;
			var maskedWords = extended;
			h -= s;
			h = Math.max(0, h);
			if (maskedWords) {
				for (var i = 0; i < s; i++) maskedWords.words[i] = this.words[i];
				maskedWords.length = s;
			}
			if (s === 0) {} else if (this.length > s) {
				this.length -= s;
				for (i = 0; i < this.length; i++) this.words[i] = this.words[i + s];
			} else {
				this.words[0] = 0;
				this.length = 1;
			}
			var carry = 0;
			for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
				var word = this.words[i] | 0;
				this.words[i] = carry << 26 - r | word >>> r;
				carry = word & mask;
			}
			if (maskedWords && carry !== 0) maskedWords.words[maskedWords.length++] = carry;
			if (this.length === 0) {
				this.words[0] = 0;
				this.length = 1;
			}
			return this.strip();
		};
		BN.prototype.ishrn = function ishrn(bits, hint, extended) {
			assert(this.negative === 0);
			return this.iushrn(bits, hint, extended);
		};
		BN.prototype.shln = function shln(bits) {
			return this.clone().ishln(bits);
		};
		BN.prototype.ushln = function ushln(bits) {
			return this.clone().iushln(bits);
		};
		BN.prototype.shrn = function shrn(bits) {
			return this.clone().ishrn(bits);
		};
		BN.prototype.ushrn = function ushrn(bits) {
			return this.clone().iushrn(bits);
		};
		BN.prototype.testn = function testn(bit) {
			assert(typeof bit === "number" && bit >= 0);
			var r = bit % 26;
			var s = (bit - r) / 26;
			var q = 1 << r;
			if (this.length <= s) return false;
			return !!(this.words[s] & q);
		};
		BN.prototype.imaskn = function imaskn(bits) {
			assert(typeof bits === "number" && bits >= 0);
			var r = bits % 26;
			var s = (bits - r) / 26;
			assert(this.negative === 0, "imaskn works only with positive numbers");
			if (this.length <= s) return this;
			if (r !== 0) s++;
			this.length = Math.min(s, this.length);
			if (r !== 0) {
				var mask = 67108863 ^ 67108863 >>> r << r;
				this.words[this.length - 1] &= mask;
			}
			if (this.length === 0) {
				this.words[0] = 0;
				this.length = 1;
			}
			return this.strip();
		};
		BN.prototype.maskn = function maskn(bits) {
			return this.clone().imaskn(bits);
		};
		BN.prototype.iaddn = function iaddn(num) {
			assert(typeof num === "number");
			assert(num < 67108864);
			if (num < 0) return this.isubn(-num);
			if (this.negative !== 0) {
				if (this.length === 1 && (this.words[0] | 0) < num) {
					this.words[0] = num - (this.words[0] | 0);
					this.negative = 0;
					return this;
				}
				this.negative = 0;
				this.isubn(num);
				this.negative = 1;
				return this;
			}
			return this._iaddn(num);
		};
		BN.prototype._iaddn = function _iaddn(num) {
			this.words[0] += num;
			for (var i = 0; i < this.length && this.words[i] >= 67108864; i++) {
				this.words[i] -= 67108864;
				if (i === this.length - 1) this.words[i + 1] = 1;
				else this.words[i + 1]++;
			}
			this.length = Math.max(this.length, i + 1);
			return this;
		};
		BN.prototype.isubn = function isubn(num) {
			assert(typeof num === "number");
			assert(num < 67108864);
			if (num < 0) return this.iaddn(-num);
			if (this.negative !== 0) {
				this.negative = 0;
				this.iaddn(num);
				this.negative = 1;
				return this;
			}
			this.words[0] -= num;
			if (this.length === 1 && this.words[0] < 0) {
				this.words[0] = -this.words[0];
				this.negative = 1;
			} else for (var i = 0; i < this.length && this.words[i] < 0; i++) {
				this.words[i] += 67108864;
				this.words[i + 1] -= 1;
			}
			return this.strip();
		};
		BN.prototype.addn = function addn(num) {
			return this.clone().iaddn(num);
		};
		BN.prototype.subn = function subn(num) {
			return this.clone().isubn(num);
		};
		BN.prototype.iabs = function iabs() {
			this.negative = 0;
			return this;
		};
		BN.prototype.abs = function abs() {
			return this.clone().iabs();
		};
		BN.prototype._ishlnsubmul = function _ishlnsubmul(num, mul, shift) {
			var len = num.length + shift;
			var i;
			this._expand(len);
			var w;
			var carry = 0;
			for (i = 0; i < num.length; i++) {
				w = (this.words[i + shift] | 0) + carry;
				var right = (num.words[i] | 0) * mul;
				w -= right & 67108863;
				carry = (w >> 26) - (right / 67108864 | 0);
				this.words[i + shift] = w & 67108863;
			}
			for (; i < this.length - shift; i++) {
				w = (this.words[i + shift] | 0) + carry;
				carry = w >> 26;
				this.words[i + shift] = w & 67108863;
			}
			if (carry === 0) return this.strip();
			assert(carry === -1);
			carry = 0;
			for (i = 0; i < this.length; i++) {
				w = -(this.words[i] | 0) + carry;
				carry = w >> 26;
				this.words[i] = w & 67108863;
			}
			this.negative = 1;
			return this.strip();
		};
		BN.prototype._wordDiv = function _wordDiv(num, mode) {
			var shift = this.length - num.length;
			var a = this.clone();
			var b = num;
			var bhi = b.words[b.length - 1] | 0;
			shift = 26 - this._countBits(bhi);
			if (shift !== 0) {
				b = b.ushln(shift);
				a.iushln(shift);
				bhi = b.words[b.length - 1] | 0;
			}
			var m = a.length - b.length;
			var q;
			if (mode !== "mod") {
				q = new BN(null);
				q.length = m + 1;
				q.words = new Array(q.length);
				for (var i = 0; i < q.length; i++) q.words[i] = 0;
			}
			var diff = a.clone()._ishlnsubmul(b, 1, m);
			if (diff.negative === 0) {
				a = diff;
				if (q) q.words[m] = 1;
			}
			for (var j = m - 1; j >= 0; j--) {
				var qj = (a.words[b.length + j] | 0) * 67108864 + (a.words[b.length + j - 1] | 0);
				qj = Math.min(qj / bhi | 0, 67108863);
				a._ishlnsubmul(b, qj, j);
				while (a.negative !== 0) {
					qj--;
					a.negative = 0;
					a._ishlnsubmul(b, 1, j);
					if (!a.isZero()) a.negative ^= 1;
				}
				if (q) q.words[j] = qj;
			}
			if (q) q.strip();
			a.strip();
			if (mode !== "div" && shift !== 0) a.iushrn(shift);
			return {
				div: q || null,
				mod: a
			};
		};
		BN.prototype.divmod = function divmod(num, mode, positive) {
			assert(!num.isZero());
			if (this.isZero()) return {
				div: new BN(0),
				mod: new BN(0)
			};
			var div, mod, res;
			if (this.negative !== 0 && num.negative === 0) {
				res = this.neg().divmod(num, mode);
				if (mode !== "mod") div = res.div.neg();
				if (mode !== "div") {
					mod = res.mod.neg();
					if (positive && mod.negative !== 0) mod.iadd(num);
				}
				return {
					div,
					mod
				};
			}
			if (this.negative === 0 && num.negative !== 0) {
				res = this.divmod(num.neg(), mode);
				if (mode !== "mod") div = res.div.neg();
				return {
					div,
					mod: res.mod
				};
			}
			if ((this.negative & num.negative) !== 0) {
				res = this.neg().divmod(num.neg(), mode);
				if (mode !== "div") {
					mod = res.mod.neg();
					if (positive && mod.negative !== 0) mod.isub(num);
				}
				return {
					div: res.div,
					mod
				};
			}
			if (num.length > this.length || this.cmp(num) < 0) return {
				div: new BN(0),
				mod: this
			};
			if (num.length === 1) {
				if (mode === "div") return {
					div: this.divn(num.words[0]),
					mod: null
				};
				if (mode === "mod") return {
					div: null,
					mod: new BN(this.modn(num.words[0]))
				};
				return {
					div: this.divn(num.words[0]),
					mod: new BN(this.modn(num.words[0]))
				};
			}
			return this._wordDiv(num, mode);
		};
		BN.prototype.div = function div(num) {
			return this.divmod(num, "div", false).div;
		};
		BN.prototype.mod = function mod(num) {
			return this.divmod(num, "mod", false).mod;
		};
		BN.prototype.umod = function umod(num) {
			return this.divmod(num, "mod", true).mod;
		};
		BN.prototype.divRound = function divRound(num) {
			var dm = this.divmod(num);
			if (dm.mod.isZero()) return dm.div;
			var mod = dm.mod.abs();
			var half = num.abs().iushrn(1);
			var r2 = num.words[0] & 1;
			var cmp = mod.cmp(half);
			if (cmp < 0 || r2 === 1 && cmp === 0) return dm.div;
			var up = new BN(1);
			up.negative = this.negative ^ num.negative;
			return dm.div.iadd(up);
		};
		BN.prototype.modn = function modn(num) {
			assert(num <= 67108863);
			var p = (1 << 26) % num;
			var acc = 0;
			for (var i = this.length - 1; i >= 0; i--) acc = (p * acc + (this.words[i] | 0)) % num;
			return acc;
		};
		BN.prototype.idivn = function idivn(num) {
			assert(num <= 67108863);
			var carry = 0;
			for (var i = this.length - 1; i >= 0; i--) {
				var w = (this.words[i] | 0) + carry * 67108864;
				this.words[i] = w / num | 0;
				carry = w % num;
			}
			return this.strip();
		};
		BN.prototype.divn = function divn(num) {
			return this.clone().idivn(num);
		};
		BN.prototype.egcd = function egcd(p) {
			assert(p.negative === 0);
			assert(!p.isZero());
			var x = this;
			var y = p.clone();
			if (x.negative !== 0) x = x.umod(p);
			else x = x.clone();
			var A = new BN(1);
			var B = new BN(0);
			var C = new BN(0);
			var D = new BN(1);
			var g = 0;
			while (x.isEven() && y.isEven()) {
				x.iushrn(1);
				y.iushrn(1);
				++g;
			}
			var yp = y.clone();
			var xp = x.clone();
			while (!x.isZero()) {
				for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
				if (i > 0) {
					x.iushrn(i);
					while (i-- > 0) {
						if (A.isOdd() || B.isOdd()) {
							A.iadd(yp);
							B.isub(xp);
						}
						A.iushrn(1);
						B.iushrn(1);
					}
				}
				for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
				if (j > 0) {
					y.iushrn(j);
					while (j-- > 0) {
						if (C.isOdd() || D.isOdd()) {
							C.iadd(yp);
							D.isub(xp);
						}
						C.iushrn(1);
						D.iushrn(1);
					}
				}
				if (x.cmp(y) >= 0) {
					x.isub(y);
					A.isub(C);
					B.isub(D);
				} else {
					y.isub(x);
					C.isub(A);
					D.isub(B);
				}
			}
			return {
				a: C,
				b: D,
				gcd: y.iushln(g)
			};
		};
		BN.prototype._invmp = function _invmp(p) {
			assert(p.negative === 0);
			assert(!p.isZero());
			var a = this;
			var b = p.clone();
			if (a.negative !== 0) a = a.umod(p);
			else a = a.clone();
			var x1 = new BN(1);
			var x2 = new BN(0);
			var delta = b.clone();
			while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
				for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
				if (i > 0) {
					a.iushrn(i);
					while (i-- > 0) {
						if (x1.isOdd()) x1.iadd(delta);
						x1.iushrn(1);
					}
				}
				for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
				if (j > 0) {
					b.iushrn(j);
					while (j-- > 0) {
						if (x2.isOdd()) x2.iadd(delta);
						x2.iushrn(1);
					}
				}
				if (a.cmp(b) >= 0) {
					a.isub(b);
					x1.isub(x2);
				} else {
					b.isub(a);
					x2.isub(x1);
				}
			}
			var res;
			if (a.cmpn(1) === 0) res = x1;
			else res = x2;
			if (res.cmpn(0) < 0) res.iadd(p);
			return res;
		};
		BN.prototype.gcd = function gcd(num) {
			if (this.isZero()) return num.abs();
			if (num.isZero()) return this.abs();
			var a = this.clone();
			var b = num.clone();
			a.negative = 0;
			b.negative = 0;
			for (var shift = 0; a.isEven() && b.isEven(); shift++) {
				a.iushrn(1);
				b.iushrn(1);
			}
			do {
				while (a.isEven()) a.iushrn(1);
				while (b.isEven()) b.iushrn(1);
				var r = a.cmp(b);
				if (r < 0) {
					var t = a;
					a = b;
					b = t;
				} else if (r === 0 || b.cmpn(1) === 0) break;
				a.isub(b);
			} while (true);
			return b.iushln(shift);
		};
		BN.prototype.invm = function invm(num) {
			return this.egcd(num).a.umod(num);
		};
		BN.prototype.isEven = function isEven() {
			return (this.words[0] & 1) === 0;
		};
		BN.prototype.isOdd = function isOdd() {
			return (this.words[0] & 1) === 1;
		};
		BN.prototype.andln = function andln(num) {
			return this.words[0] & num;
		};
		BN.prototype.bincn = function bincn(bit) {
			assert(typeof bit === "number");
			var r = bit % 26;
			var s = (bit - r) / 26;
			var q = 1 << r;
			if (this.length <= s) {
				this._expand(s + 1);
				this.words[s] |= q;
				return this;
			}
			var carry = q;
			for (var i = s; carry !== 0 && i < this.length; i++) {
				var w = this.words[i] | 0;
				w += carry;
				carry = w >>> 26;
				w &= 67108863;
				this.words[i] = w;
			}
			if (carry !== 0) {
				this.words[i] = carry;
				this.length++;
			}
			return this;
		};
		BN.prototype.isZero = function isZero() {
			return this.length === 1 && this.words[0] === 0;
		};
		BN.prototype.cmpn = function cmpn(num) {
			var negative = num < 0;
			if (this.negative !== 0 && !negative) return -1;
			if (this.negative === 0 && negative) return 1;
			this.strip();
			var res;
			if (this.length > 1) res = 1;
			else {
				if (negative) num = -num;
				assert(num <= 67108863, "Number is too big");
				var w = this.words[0] | 0;
				res = w === num ? 0 : w < num ? -1 : 1;
			}
			if (this.negative !== 0) return -res | 0;
			return res;
		};
		BN.prototype.cmp = function cmp(num) {
			if (this.negative !== 0 && num.negative === 0) return -1;
			if (this.negative === 0 && num.negative !== 0) return 1;
			var res = this.ucmp(num);
			if (this.negative !== 0) return -res | 0;
			return res;
		};
		BN.prototype.ucmp = function ucmp(num) {
			if (this.length > num.length) return 1;
			if (this.length < num.length) return -1;
			var res = 0;
			for (var i = this.length - 1; i >= 0; i--) {
				var a = this.words[i] | 0;
				var b = num.words[i] | 0;
				if (a === b) continue;
				if (a < b) res = -1;
				else if (a > b) res = 1;
				break;
			}
			return res;
		};
		BN.prototype.gtn = function gtn(num) {
			return this.cmpn(num) === 1;
		};
		BN.prototype.gt = function gt(num) {
			return this.cmp(num) === 1;
		};
		BN.prototype.gten = function gten(num) {
			return this.cmpn(num) >= 0;
		};
		BN.prototype.gte = function gte(num) {
			return this.cmp(num) >= 0;
		};
		BN.prototype.ltn = function ltn(num) {
			return this.cmpn(num) === -1;
		};
		BN.prototype.lt = function lt(num) {
			return this.cmp(num) === -1;
		};
		BN.prototype.lten = function lten(num) {
			return this.cmpn(num) <= 0;
		};
		BN.prototype.lte = function lte(num) {
			return this.cmp(num) <= 0;
		};
		BN.prototype.eqn = function eqn(num) {
			return this.cmpn(num) === 0;
		};
		BN.prototype.eq = function eq(num) {
			return this.cmp(num) === 0;
		};
		BN.red = function red(num) {
			return new Red(num);
		};
		BN.prototype.toRed = function toRed(ctx) {
			assert(!this.red, "Already a number in reduction context");
			assert(this.negative === 0, "red works only with positives");
			return ctx.convertTo(this)._forceRed(ctx);
		};
		BN.prototype.fromRed = function fromRed() {
			assert(this.red, "fromRed works only with numbers in reduction context");
			return this.red.convertFrom(this);
		};
		BN.prototype._forceRed = function _forceRed(ctx) {
			this.red = ctx;
			return this;
		};
		BN.prototype.forceRed = function forceRed(ctx) {
			assert(!this.red, "Already a number in reduction context");
			return this._forceRed(ctx);
		};
		BN.prototype.redAdd = function redAdd(num) {
			assert(this.red, "redAdd works only with red numbers");
			return this.red.add(this, num);
		};
		BN.prototype.redIAdd = function redIAdd(num) {
			assert(this.red, "redIAdd works only with red numbers");
			return this.red.iadd(this, num);
		};
		BN.prototype.redSub = function redSub(num) {
			assert(this.red, "redSub works only with red numbers");
			return this.red.sub(this, num);
		};
		BN.prototype.redISub = function redISub(num) {
			assert(this.red, "redISub works only with red numbers");
			return this.red.isub(this, num);
		};
		BN.prototype.redShl = function redShl(num) {
			assert(this.red, "redShl works only with red numbers");
			return this.red.shl(this, num);
		};
		BN.prototype.redMul = function redMul(num) {
			assert(this.red, "redMul works only with red numbers");
			this.red._verify2(this, num);
			return this.red.mul(this, num);
		};
		BN.prototype.redIMul = function redIMul(num) {
			assert(this.red, "redMul works only with red numbers");
			this.red._verify2(this, num);
			return this.red.imul(this, num);
		};
		BN.prototype.redSqr = function redSqr() {
			assert(this.red, "redSqr works only with red numbers");
			this.red._verify1(this);
			return this.red.sqr(this);
		};
		BN.prototype.redISqr = function redISqr() {
			assert(this.red, "redISqr works only with red numbers");
			this.red._verify1(this);
			return this.red.isqr(this);
		};
		BN.prototype.redSqrt = function redSqrt() {
			assert(this.red, "redSqrt works only with red numbers");
			this.red._verify1(this);
			return this.red.sqrt(this);
		};
		BN.prototype.redInvm = function redInvm() {
			assert(this.red, "redInvm works only with red numbers");
			this.red._verify1(this);
			return this.red.invm(this);
		};
		BN.prototype.redNeg = function redNeg() {
			assert(this.red, "redNeg works only with red numbers");
			this.red._verify1(this);
			return this.red.neg(this);
		};
		BN.prototype.redPow = function redPow(num) {
			assert(this.red && !num.red, "redPow(normalNum)");
			this.red._verify1(this);
			return this.red.pow(this, num);
		};
		var primes = {
			k256: null,
			p224: null,
			p192: null,
			p25519: null
		};
		function MPrime(name, p) {
			this.name = name;
			this.p = new BN(p, 16);
			this.n = this.p.bitLength();
			this.k = new BN(1).iushln(this.n).isub(this.p);
			this.tmp = this._tmp();
		}
		MPrime.prototype._tmp = function _tmp() {
			var tmp = new BN(null);
			tmp.words = new Array(Math.ceil(this.n / 13));
			return tmp;
		};
		MPrime.prototype.ireduce = function ireduce(num) {
			var r = num;
			var rlen;
			do {
				this.split(r, this.tmp);
				r = this.imulK(r);
				r = r.iadd(this.tmp);
				rlen = r.bitLength();
			} while (rlen > this.n);
			var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
			if (cmp === 0) {
				r.words[0] = 0;
				r.length = 1;
			} else if (cmp > 0) r.isub(this.p);
			else if (r.strip !== void 0) r.strip();
			else r._strip();
			return r;
		};
		MPrime.prototype.split = function split(input, out) {
			input.iushrn(this.n, 0, out);
		};
		MPrime.prototype.imulK = function imulK(num) {
			return num.imul(this.k);
		};
		function K256() {
			MPrime.call(this, "k256", "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f");
		}
		inherits(K256, MPrime);
		K256.prototype.split = function split(input, output) {
			var mask = 4194303;
			var outLen = Math.min(input.length, 9);
			for (var i = 0; i < outLen; i++) output.words[i] = input.words[i];
			output.length = outLen;
			if (input.length <= 9) {
				input.words[0] = 0;
				input.length = 1;
				return;
			}
			var prev = input.words[9];
			output.words[output.length++] = prev & mask;
			for (i = 10; i < input.length; i++) {
				var next = input.words[i] | 0;
				input.words[i - 10] = (next & mask) << 4 | prev >>> 22;
				prev = next;
			}
			prev >>>= 22;
			input.words[i - 10] = prev;
			if (prev === 0 && input.length > 10) input.length -= 10;
			else input.length -= 9;
		};
		K256.prototype.imulK = function imulK(num) {
			num.words[num.length] = 0;
			num.words[num.length + 1] = 0;
			num.length += 2;
			var lo = 0;
			for (var i = 0; i < num.length; i++) {
				var w = num.words[i] | 0;
				lo += w * 977;
				num.words[i] = lo & 67108863;
				lo = w * 64 + (lo / 67108864 | 0);
			}
			if (num.words[num.length - 1] === 0) {
				num.length--;
				if (num.words[num.length - 1] === 0) num.length--;
			}
			return num;
		};
		function P224() {
			MPrime.call(this, "p224", "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001");
		}
		inherits(P224, MPrime);
		function P192() {
			MPrime.call(this, "p192", "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff");
		}
		inherits(P192, MPrime);
		function P25519() {
			MPrime.call(this, "25519", "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed");
		}
		inherits(P25519, MPrime);
		P25519.prototype.imulK = function imulK(num) {
			var carry = 0;
			for (var i = 0; i < num.length; i++) {
				var hi = (num.words[i] | 0) * 19 + carry;
				var lo = hi & 67108863;
				hi >>>= 26;
				num.words[i] = lo;
				carry = hi;
			}
			if (carry !== 0) num.words[num.length++] = carry;
			return num;
		};
		BN._prime = function prime(name) {
			if (primes[name]) return primes[name];
			var prime;
			if (name === "k256") prime = new K256();
			else if (name === "p224") prime = new P224();
			else if (name === "p192") prime = new P192();
			else if (name === "p25519") prime = new P25519();
			else throw new Error("Unknown prime " + name);
			primes[name] = prime;
			return prime;
		};
		function Red(m) {
			if (typeof m === "string") {
				var prime = BN._prime(m);
				this.m = prime.p;
				this.prime = prime;
			} else {
				assert(m.gtn(1), "modulus must be greater than 1");
				this.m = m;
				this.prime = null;
			}
		}
		Red.prototype._verify1 = function _verify1(a) {
			assert(a.negative === 0, "red works only with positives");
			assert(a.red, "red works only with red numbers");
		};
		Red.prototype._verify2 = function _verify2(a, b) {
			assert((a.negative | b.negative) === 0, "red works only with positives");
			assert(a.red && a.red === b.red, "red works only with red numbers");
		};
		Red.prototype.imod = function imod(a) {
			if (this.prime) return this.prime.ireduce(a)._forceRed(this);
			return a.umod(this.m)._forceRed(this);
		};
		Red.prototype.neg = function neg(a) {
			if (a.isZero()) return a.clone();
			return this.m.sub(a)._forceRed(this);
		};
		Red.prototype.add = function add(a, b) {
			this._verify2(a, b);
			var res = a.add(b);
			if (res.cmp(this.m) >= 0) res.isub(this.m);
			return res._forceRed(this);
		};
		Red.prototype.iadd = function iadd(a, b) {
			this._verify2(a, b);
			var res = a.iadd(b);
			if (res.cmp(this.m) >= 0) res.isub(this.m);
			return res;
		};
		Red.prototype.sub = function sub(a, b) {
			this._verify2(a, b);
			var res = a.sub(b);
			if (res.cmpn(0) < 0) res.iadd(this.m);
			return res._forceRed(this);
		};
		Red.prototype.isub = function isub(a, b) {
			this._verify2(a, b);
			var res = a.isub(b);
			if (res.cmpn(0) < 0) res.iadd(this.m);
			return res;
		};
		Red.prototype.shl = function shl(a, num) {
			this._verify1(a);
			return this.imod(a.ushln(num));
		};
		Red.prototype.imul = function imul(a, b) {
			this._verify2(a, b);
			return this.imod(a.imul(b));
		};
		Red.prototype.mul = function mul(a, b) {
			this._verify2(a, b);
			return this.imod(a.mul(b));
		};
		Red.prototype.isqr = function isqr(a) {
			return this.imul(a, a.clone());
		};
		Red.prototype.sqr = function sqr(a) {
			return this.mul(a, a);
		};
		Red.prototype.sqrt = function sqrt(a) {
			if (a.isZero()) return a.clone();
			var mod3 = this.m.andln(3);
			assert(mod3 % 2 === 1);
			if (mod3 === 3) {
				var pow = this.m.add(new BN(1)).iushrn(2);
				return this.pow(a, pow);
			}
			var q = this.m.subn(1);
			var s = 0;
			while (!q.isZero() && q.andln(1) === 0) {
				s++;
				q.iushrn(1);
			}
			assert(!q.isZero());
			var one = new BN(1).toRed(this);
			var nOne = one.redNeg();
			var lpow = this.m.subn(1).iushrn(1);
			var z = this.m.bitLength();
			z = new BN(2 * z * z).toRed(this);
			while (this.pow(z, lpow).cmp(nOne) !== 0) z.redIAdd(nOne);
			var c = this.pow(z, q);
			var r = this.pow(a, q.addn(1).iushrn(1));
			var t = this.pow(a, q);
			var m = s;
			while (t.cmp(one) !== 0) {
				var tmp = t;
				for (var i = 0; tmp.cmp(one) !== 0; i++) tmp = tmp.redSqr();
				assert(i < m);
				var b = this.pow(c, new BN(1).iushln(m - i - 1));
				r = r.redMul(b);
				c = b.redSqr();
				t = t.redMul(c);
				m = i;
			}
			return r;
		};
		Red.prototype.invm = function invm(a) {
			var inv = a._invmp(this.m);
			if (inv.negative !== 0) {
				inv.negative = 0;
				return this.imod(inv).redNeg();
			} else return this.imod(inv);
		};
		Red.prototype.pow = function pow(a, num) {
			if (num.isZero()) return new BN(1).toRed(this);
			if (num.cmpn(1) === 0) return a.clone();
			var windowSize = 4;
			var wnd = new Array(1 << windowSize);
			wnd[0] = new BN(1).toRed(this);
			wnd[1] = a;
			for (var i = 2; i < wnd.length; i++) wnd[i] = this.mul(wnd[i - 1], a);
			var res = wnd[0];
			var current = 0;
			var currentLen = 0;
			var start = num.bitLength() % 26;
			if (start === 0) start = 26;
			for (i = num.length - 1; i >= 0; i--) {
				var word = num.words[i];
				for (var j = start - 1; j >= 0; j--) {
					var bit = word >> j & 1;
					if (res !== wnd[0]) res = this.sqr(res);
					if (bit === 0 && current === 0) {
						currentLen = 0;
						continue;
					}
					current <<= 1;
					current |= bit;
					currentLen++;
					if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;
					res = this.mul(res, wnd[current]);
					currentLen = 0;
					current = 0;
				}
				start = 26;
			}
			return res;
		};
		Red.prototype.convertTo = function convertTo(num) {
			var r = num.umod(this.m);
			return r === num ? r.clone() : r;
		};
		Red.prototype.convertFrom = function convertFrom(num) {
			var res = num.clone();
			res.red = null;
			return res;
		};
		BN.mont = function mont(num) {
			return new Mont(num);
		};
		function Mont(m) {
			Red.call(this, m);
			this.shift = this.m.bitLength();
			if (this.shift % 26 !== 0) this.shift += 26 - this.shift % 26;
			this.r = new BN(1).iushln(this.shift);
			this.r2 = this.imod(this.r.sqr());
			this.rinv = this.r._invmp(this.m);
			this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
			this.minv = this.minv.umod(this.r);
			this.minv = this.r.sub(this.minv);
		}
		inherits(Mont, Red);
		Mont.prototype.convertTo = function convertTo(num) {
			return this.imod(num.ushln(this.shift));
		};
		Mont.prototype.convertFrom = function convertFrom(num) {
			var r = this.imod(num.mul(this.rinv));
			r.red = null;
			return r;
		};
		Mont.prototype.imul = function imul(a, b) {
			if (a.isZero() || b.isZero()) {
				a.words[0] = 0;
				a.length = 1;
				return a;
			}
			var t = a.imul(b);
			var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
			var u = t.isub(c).iushrn(this.shift);
			var res = u;
			if (u.cmp(this.m) >= 0) res = u.isub(this.m);
			else if (u.cmpn(0) < 0) res = u.iadd(this.m);
			return res._forceRed(this);
		};
		Mont.prototype.mul = function mul(a, b) {
			if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);
			var t = a.mul(b);
			var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
			var u = t.isub(c).iushrn(this.shift);
			var res = u;
			if (u.cmp(this.m) >= 0) res = u.isub(this.m);
			else if (u.cmpn(0) < 0) res = u.iadd(this.m);
			return res._forceRed(this);
		};
		Mont.prototype.invm = function invm(a) {
			return this.imod(a._invmp(this.m).mul(this.r2))._forceRed(this);
		};
	})(typeof module === "undefined" || module, exports);
}));
//#endregion
//#region node_modules/@metamask/eth-sig-util/dist/ethereumjs-abi-utils.js
var require_ethereumjs_abi_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __importDefault = exports && exports.__importDefault || function(mod) {
		return mod && mod.__esModule ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.rawEncode = exports.parseNumber = exports.solidityPack = void 0;
	var util_1 = require_dist$1();
	var bn_js_1 = __importDefault(require_bn());
	var ethjs_util_1 = require_lib();
	var utils_1 = require_utils();
	/**
	* Packs non-standard encoded values packed according to their respective type in types in a buffer.
	*
	* @param types - Array of types of each value to encode.
	* @param values - Array of values to encode.
	* @returns A buffer containing the packed values.
	*/
	function solidityPack(types, values) {
		if (types.length !== values.length) throw new Error("Number of types are not matching the values");
		const ret = [];
		for (let i = 0; i < types.length; i++) {
			const type = elementaryName(types[i]);
			const value = values[i];
			ret.push(solidityHexValue(type, value, null));
		}
		return Buffer.concat(ret);
	}
	exports.solidityPack = solidityPack;
	/**
	* Checks if a value is an array (represented as a string).
	*
	* @param type - The value to check whether it is an array.
	* @returns A boolean indicating whether the passed value is an array.
	*/
	function isArray(type) {
		return type.endsWith("]");
	}
	/**
	* Parse array type for packing solidity values.
	*
	* @param type - A string that may be an array to parse.
	* @returns A parsed value from the array.
	*/
	function parseTypeArray(type) {
		const tmp = type.match(/(.*)\[(.*?)\]$/u);
		if (tmp) return tmp[2] === "" ? "dynamic" : parseInt(tmp[2], 10);
		return null;
	}
	/**
	* Parse N from type<N>.
	*
	* @param type - Value to parse.
	* @returns Parsed value.
	*/
	function parseTypeN(type) {
		const match = /^\D+(\d+)$/u.exec(type);
		if (match === null) throw new Error(`Invalid parseTypeN input "${type}".`);
		return parseInt(match[1], 10);
	}
	/**
	* Parse a number for determining a solidity hexvalue.
	*
	* @param arg - Number to parse.
	* @returns Parsed value.
	*/
	function parseNumber(arg) {
		const type = typeof arg;
		if (type === "string") {
			if ((0, util_1.isHexPrefixed)(arg)) return new bn_js_1.default((0, ethjs_util_1.stripHexPrefix)(arg), 16);
			return new bn_js_1.default(arg, 10);
		} else if (type === "number") return new bn_js_1.default(arg);
		else if (arg && Object.prototype.hasOwnProperty.call(arg, "toArray") || bn_js_1.default.isBN(arg)) return arg;
		throw new Error("Argument is not a number");
	}
	exports.parseNumber = parseNumber;
	/**
	* Get solidity hex value from type, value and bitsize inputs for packing these values in a buffer.
	*
	* @param type - The type of the value to encode.
	* @param value - The value to encode.
	* @param bitsize - The bitsize of the value to encode.
	* @returns The encoded soldity hex value.
	*/
	function solidityHexValue(type, value, bitsize) {
		if (isArray(type)) {
			const subType = type.replace(/\[.*?\]/u, "");
			if (!isArray(subType)) {
				const arraySize = parseTypeArray(type);
				if (arraySize !== "dynamic" && arraySize !== 0 && arraySize !== null && value.length > arraySize) throw new Error(`Elements exceed array size: ${arraySize}`);
			}
			const arrayValues = value.map((v) => solidityHexValue(subType, v, 256));
			return Buffer.concat(arrayValues);
		} else if (type === "bytes") return value;
		else if (type === "string") return Buffer.from(value, "utf8");
		else if (type === "bool") {
			bitsize = bitsize || 8;
			const padding = Array(bitsize / 4).join("0");
			return Buffer.from(value ? `${padding}1` : `${padding}0`, "hex");
		} else if (type === "address") {
			let bytesize = 20;
			if (bitsize) bytesize = bitsize / 8;
			return (0, util_1.setLengthLeft)((0, util_1.toBuffer)(value), bytesize);
		} else if (type.startsWith("bytes")) {
			const size = parseTypeN(type);
			if (size < 1 || size > 32) throw new Error(`Invalid bytes<N> width: ${size}`);
			if (typeof value === "number") value = (0, utils_1.normalize)(value);
			return (0, util_1.setLengthRight)((0, util_1.toBuffer)(value), size);
		} else if (type.startsWith("uint")) {
			const size = parseTypeN(type);
			if (size % 8 || size < 8 || size > 256) throw new Error(`Invalid uint<N> width: ${size}`);
			const num = parseNumber(value);
			if (num.bitLength() > size) throw new Error(`Supplied uint exceeds width: ${size} vs ${num.bitLength()}`);
			bitsize = bitsize || size;
			return num.toArrayLike(Buffer, "be", bitsize / 8);
		} else if (type.startsWith("int")) {
			const size = parseTypeN(type);
			if (size % 8 || size < 8 || size > 256) throw new Error(`Invalid int<N> width: ${size}`);
			const num = parseNumber(value);
			if (num.bitLength() > size) throw new Error(`Supplied int exceeds width: ${size} vs ${num.bitLength()}`);
			bitsize = bitsize || size;
			return num.toTwos(size).toArrayLike(Buffer, "be", bitsize / 8);
		}
		throw new Error(`Unsupported or invalid type: ${JSON.stringify(type)}`);
	}
	/**
	* Gets the correct solidity type name.
	*
	* @param name - The type name for which we want the corresponding solidity type name.
	* @returns The solidity type name for the input value.
	*/
	function elementaryName(name) {
		if (name.startsWith("int[")) return `int256${name.slice(3)}`;
		else if (name === "int") return "int256";
		else if (name.startsWith("uint[")) return `uint256${name.slice(4)}`;
		else if (name === "uint") return "uint256";
		else if (name.startsWith("fixed[")) return `fixed128x128${name.slice(5)}`;
		else if (name === "fixed") return "fixed128x128";
		else if (name.startsWith("ufixed[")) return `ufixed128x128${name.slice(6)}`;
		else if (name === "ufixed") return "ufixed128x128";
		return name;
	}
	/**
	* @param types
	* @param values
	*/
	function rawEncode(types, values) {
		const output = [];
		const data = [];
		let headLength = 0;
		types.forEach((type) => {
			if (isArray(type)) {
				const size = parseTypeArray(type);
				if (size !== "dynamic" && size !== null) headLength += 32 * size;
				else headLength += 32;
			} else headLength += 32;
		});
		for (let i = 0; i < types.length; i++) {
			const type = elementaryName(types[i]);
			const value = values[i];
			const cur = encodeSingle(type, value);
			if (isDynamic(type)) {
				output.push(encodeSingle("uint256", headLength));
				data.push(cur);
				headLength += cur.length;
			} else output.push(cur);
		}
		return Buffer.concat(output.concat(data));
	}
	exports.rawEncode = rawEncode;
	/**
	* @param type
	* @param arg
	*/
	function encodeSingle(type, arg) {
		if (type === "address") return encodeSingle("uint160", parseNumber(arg));
		else if (type === "bool") return encodeSingle("uint8", arg ? 1 : 0);
		else if (type === "string") return encodeSingle("bytes", Buffer.from(arg, "utf8"));
		else if (isArray(type)) {
			if (typeof arg.length === "undefined") throw new Error("Not an array?");
			const size = parseTypeArray(type);
			if (size !== "dynamic" && size !== 0 && size !== null && arg.length > size) throw new Error(`Elements exceed array size: ${size}`);
			const ret = [];
			type = type.slice(0, type.lastIndexOf("["));
			if (typeof arg === "string") arg = JSON.parse(arg);
			for (const i in arg) if (Object.prototype.hasOwnProperty.call(arg, i)) ret.push(encodeSingle(type, arg[i]));
			if (size === "dynamic") {
				const length = encodeSingle("uint256", arg.length);
				ret.unshift(length);
			}
			return Buffer.concat(ret);
		} else if (type === "bytes") {
			arg = Buffer.from(arg);
			let ret = Buffer.concat([encodeSingle("uint256", arg.length), arg]);
			if (arg.length % 32 !== 0) ret = Buffer.concat([ret, (0, util_1.zeros)(32 - arg.length % 32)]);
			return ret;
		} else if (type.startsWith("bytes")) {
			const size = parseTypeN(type);
			if (size < 1 || size > 32) throw new Error(`Invalid bytes<N> width: ${size}`);
			const nArg = typeof arg === "number" ? (0, utils_1.normalize)(arg) : arg;
			return (0, util_1.setLengthRight)((0, util_1.toBuffer)(nArg), 32);
		} else if (type.startsWith("uint")) {
			const size = parseTypeN(type);
			if (size % 8 || size < 8 || size > 256) throw new Error(`Invalid uint<N> width: ${size}`);
			const num = parseNumber(arg);
			if (num.bitLength() > size) throw new Error(`Supplied uint exceeds width: ${size} vs ${num.bitLength()}`);
			if (num.isNeg()) throw new Error("Supplied uint is negative");
			return num.toArrayLike(Buffer, "be", 32);
		} else if (type.startsWith("int")) {
			const size = parseTypeN(type);
			if (size % 8 || size < 8 || size > 256) throw new Error(`Invalid int<N> width: ${size}`);
			const num = parseNumber(arg);
			if (num.bitLength() > size) throw new Error(`Supplied int exceeds width: ${size} vs ${num.bitLength()}`);
			return num.toTwos(256).toArrayLike(Buffer, "be", 32);
		} else if (type.startsWith("ufixed")) {
			const size = parseTypeNxM(type);
			const num = parseNumber(arg);
			if (num.isNeg()) throw new Error("Supplied ufixed is negative");
			return encodeSingle("uint256", num.mul(new bn_js_1.default(2).pow(new bn_js_1.default(size[1]))));
		} else if (type.startsWith("fixed")) {
			const size = parseTypeNxM(type);
			return encodeSingle("int256", parseNumber(arg).mul(new bn_js_1.default(2).pow(new bn_js_1.default(size[1]))));
		}
		throw new Error(`Unsupported or invalid type: ${JSON.stringify(type)}`);
	}
	/**
	* @param type
	*/
	function isDynamic(type) {
		return type === "string" || type === "bytes" || parseTypeArray(type) === "dynamic";
	}
	/**
	* @param type
	*/
	function parseTypeNxM(type) {
		const match = /^\D+(\d+)x(\d+)$/u.exec(type);
		if (match === null || match.length < 1) throw new Error(`Invalid parseTypeNxM input "${type}".`);
		return [parseInt(match[1], 10), parseInt(match[2], 10)];
	}
}));
//#endregion
//#region node_modules/@metamask/eth-sig-util/dist/sign-typed-data.js
var require_sign_typed_data = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.recoverTypedSignature = exports.signTypedData = exports.typedSignatureHash = exports.TypedDataUtils = exports.TYPED_MESSAGE_SCHEMA = exports.SignTypedDataVersion = void 0;
	var util_1 = require_dist$1();
	var keccak_1 = require_keccak();
	var ethjs_util_1 = require_lib();
	var ethereumjs_abi_utils_1 = require_ethereumjs_abi_utils();
	var utils_1 = require_utils();
	/**
	* Represents the version of `signTypedData` being used.
	*
	* V1 is based upon [an early version of EIP-712](https://github.com/ethereum/EIPs/pull/712/commits/21abe254fe0452d8583d5b132b1d7be87c0439ca)
	* that lacked some later security improvements, and should generally be neglected in favor of
	* later versions.
	*
	* V3 is based on EIP-712, except that arrays and recursive data structures are not supported.
	*
	* V4 is based on EIP-712, and includes full support of arrays and recursive data structures.
	*/
	var SignTypedDataVersion;
	(function(SignTypedDataVersion) {
		SignTypedDataVersion["V1"] = "V1";
		SignTypedDataVersion["V3"] = "V3";
		SignTypedDataVersion["V4"] = "V4";
	})(SignTypedDataVersion = exports.SignTypedDataVersion || (exports.SignTypedDataVersion = {}));
	exports.TYPED_MESSAGE_SCHEMA = {
		type: "object",
		properties: {
			types: {
				type: "object",
				additionalProperties: {
					type: "array",
					items: {
						type: "object",
						properties: {
							name: { type: "string" },
							type: { type: "string" }
						},
						required: ["name", "type"]
					}
				}
			},
			primaryType: { type: "string" },
			domain: { type: "object" },
			message: { type: "object" }
		},
		required: [
			"types",
			"primaryType",
			"domain",
			"message"
		]
	};
	/**
	* Validate that the given value is a valid version string.
	*
	* @param version - The version value to validate.
	* @param allowedVersions - A list of allowed versions. If omitted, all versions are assumed to be
	* allowed.
	*/
	function validateVersion(version, allowedVersions) {
		if (!Object.keys(SignTypedDataVersion).includes(version)) throw new Error(`Invalid version: '${version}'`);
		else if (allowedVersions && !allowedVersions.includes(version)) throw new Error(`SignTypedDataVersion not allowed: '${version}'. Allowed versions are: ${allowedVersions.join(", ")}`);
	}
	/**
	* Encode a single field.
	*
	* @param types - All type definitions.
	* @param name - The name of the field to encode.
	* @param type - The type of the field being encoded.
	* @param value - The value to encode.
	* @param version - The EIP-712 version the encoding should comply with.
	* @returns Encoded representation of the field.
	*/
	function encodeField(types, name, type, value, version) {
		validateVersion(version, [SignTypedDataVersion.V3, SignTypedDataVersion.V4]);
		if (types[type] !== void 0) return ["bytes32", version === SignTypedDataVersion.V4 && value == null ? "0x0000000000000000000000000000000000000000000000000000000000000000" : (0, util_1.arrToBufArr)((0, keccak_1.keccak256)(encodeData(type, value, types, version)))];
		if (value === void 0) throw new Error(`missing value for field ${name} of type ${type}`);
		if (type === "bytes") {
			if (typeof value === "number") value = (0, utils_1.numberToBuffer)(value);
			else if ((0, ethjs_util_1.isHexString)(value)) {
				const prepend = value.length % 2 ? "0" : "";
				value = Buffer.from(prepend + value.slice(2), "hex");
			} else value = Buffer.from(value, "utf8");
			return ["bytes32", (0, util_1.arrToBufArr)((0, keccak_1.keccak256)(value))];
		}
		if (type === "string") {
			if (typeof value === "number") value = (0, utils_1.numberToBuffer)(value);
			else value = Buffer.from(value !== null && value !== void 0 ? value : "", "utf8");
			return ["bytes32", (0, util_1.arrToBufArr)((0, keccak_1.keccak256)(value))];
		}
		if (type.endsWith("]")) {
			if (version === SignTypedDataVersion.V3) throw new Error("Arrays are unimplemented in encodeData; use V4 extension");
			const parsedType = type.slice(0, type.lastIndexOf("["));
			const typeValuePairs = value.map((item) => encodeField(types, name, parsedType, item, version));
			return ["bytes32", (0, util_1.arrToBufArr)((0, keccak_1.keccak256)((0, ethereumjs_abi_utils_1.rawEncode)(typeValuePairs.map(([t]) => t), typeValuePairs.map(([, v]) => v))))];
		}
		return [type, value];
	}
	/**
	* Encodes an object by encoding and concatenating each of its members.
	*
	* @param primaryType - The root type.
	* @param data - The object to encode.
	* @param types - Type definitions for all types included in the message.
	* @param version - The EIP-712 version the encoding should comply with.
	* @returns An encoded representation of an object.
	*/
	function encodeData(primaryType, data, types, version) {
		validateVersion(version, [SignTypedDataVersion.V3, SignTypedDataVersion.V4]);
		const encodedTypes = ["bytes32"];
		const encodedValues = [hashType(primaryType, types)];
		for (const field of types[primaryType]) {
			if (version === SignTypedDataVersion.V3 && data[field.name] === void 0) continue;
			const [type, value] = encodeField(types, field.name, field.type, data[field.name], version);
			encodedTypes.push(type);
			encodedValues.push(value);
		}
		return (0, ethereumjs_abi_utils_1.rawEncode)(encodedTypes, encodedValues);
	}
	/**
	* Encodes the type of an object by encoding a comma delimited list of its members.
	*
	* @param primaryType - The root type to encode.
	* @param types - Type definitions for all types included in the message.
	* @returns An encoded representation of the primary type.
	*/
	function encodeType(primaryType, types) {
		let result = "";
		const unsortedDeps = findTypeDependencies(primaryType, types);
		unsortedDeps.delete(primaryType);
		const deps = [primaryType, ...Array.from(unsortedDeps).sort()];
		for (const type of deps) {
			if (!types[type]) throw new Error(`No type definition specified: ${type}`);
			result += `${type}(${types[type].map(({ name, type: t }) => `${t} ${name}`).join(",")})`;
		}
		return result;
	}
	/**
	* Finds all types within a type definition object.
	*
	* @param primaryType - The root type.
	* @param types - Type definitions for all types included in the message.
	* @param results - The current set of accumulated types.
	* @returns The set of all types found in the type definition.
	*/
	function findTypeDependencies(primaryType, types, results = /* @__PURE__ */ new Set()) {
		if (typeof primaryType !== "string") throw new Error(`Invalid findTypeDependencies input ${JSON.stringify(primaryType)}`);
		const match = primaryType.match(/^\w*/u);
		[primaryType] = match;
		if (results.has(primaryType) || types[primaryType] === void 0) return results;
		results.add(primaryType);
		for (const field of types[primaryType]) findTypeDependencies(field.type, types, results);
		return results;
	}
	/**
	* Hashes an object.
	*
	* @param primaryType - The root type.
	* @param data - The object to hash.
	* @param types - Type definitions for all types included in the message.
	* @param version - The EIP-712 version the encoding should comply with.
	* @returns The hash of the object.
	*/
	function hashStruct(primaryType, data, types, version) {
		validateVersion(version, [SignTypedDataVersion.V3, SignTypedDataVersion.V4]);
		const encoded = encodeData(primaryType, data, types, version);
		const hashed = (0, keccak_1.keccak256)(encoded);
		return (0, util_1.arrToBufArr)(hashed);
	}
	/**
	* Hashes the type of an object.
	*
	* @param primaryType - The root type to hash.
	* @param types - Type definitions for all types included in the message.
	* @returns The hash of the object type.
	*/
	function hashType(primaryType, types) {
		const encodedHashType = Buffer.from(encodeType(primaryType, types), "utf-8");
		return (0, util_1.arrToBufArr)((0, keccak_1.keccak256)(encodedHashType));
	}
	/**
	* Removes properties from a message object that are not defined per EIP-712.
	*
	* @param data - The typed message object.
	* @returns The typed message object with only allowed fields.
	*/
	function sanitizeData(data) {
		const sanitizedData = {};
		for (const key in exports.TYPED_MESSAGE_SCHEMA.properties) if (data[key]) sanitizedData[key] = data[key];
		if ("types" in sanitizedData) sanitizedData.types = Object.assign({ EIP712Domain: [] }, sanitizedData.types);
		return sanitizedData;
	}
	/**
	* Create a EIP-712 Domain Hash.
	* This hash is used at the top of the EIP-712 encoding.
	*
	* @param typedData - The typed message to hash.
	* @param version - The EIP-712 version the encoding should comply with.
	* @returns The hash of the domain object.
	*/
	function eip712DomainHash(typedData, version) {
		validateVersion(version, [SignTypedDataVersion.V3, SignTypedDataVersion.V4]);
		const sanitizedData = sanitizeData(typedData);
		const { domain } = sanitizedData;
		return hashStruct("EIP712Domain", domain, { EIP712Domain: sanitizedData.types.EIP712Domain }, version);
	}
	/**
	* Hash a typed message according to EIP-712. The returned message starts with the EIP-712 prefix,
	* which is "1901", followed by the hash of the domain separator, then the data (if any).
	* The result is hashed again and returned.
	*
	* This function does not sign the message. The resulting hash must still be signed to create an
	* EIP-712 signature.
	*
	* @param typedData - The typed message to hash.
	* @param version - The EIP-712 version the encoding should comply with.
	* @returns The hash of the typed message.
	*/
	function eip712Hash(typedData, version) {
		validateVersion(version, [SignTypedDataVersion.V3, SignTypedDataVersion.V4]);
		const sanitizedData = sanitizeData(typedData);
		const parts = [Buffer.from("1901", "hex")];
		parts.push(eip712DomainHash(typedData, version));
		if (sanitizedData.primaryType !== "EIP712Domain") parts.push(hashStruct(sanitizedData.primaryType, sanitizedData.message, sanitizedData.types, version));
		return (0, util_1.arrToBufArr)((0, keccak_1.keccak256)(Buffer.concat(parts)));
	}
	/**
	* A collection of utility functions used for signing typed data.
	*/
	exports.TypedDataUtils = {
		encodeData,
		encodeType,
		findTypeDependencies,
		hashStruct,
		hashType,
		sanitizeData,
		eip712Hash,
		eip712DomainHash
	};
	/**
	* Generate the "V1" hash for the provided typed message.
	*
	* The hash will be generated in accordance with an earlier version of the EIP-712
	* specification. This hash is used in `signTypedData_v1`.
	*
	* @param typedData - The typed message.
	* @returns The '0x'-prefixed hex encoded hash representing the type of the provided message.
	*/
	function typedSignatureHash(typedData) {
		const hashBuffer = _typedSignatureHash(typedData);
		return (0, util_1.bufferToHex)(hashBuffer);
	}
	exports.typedSignatureHash = typedSignatureHash;
	/**
	* Generate the "V1" hash for the provided typed message.
	*
	* The hash will be generated in accordance with an earlier version of the EIP-712
	* specification. This hash is used in `signTypedData_v1`.
	*
	* @param typedData - The typed message.
	* @returns The hash representing the type of the provided message.
	*/
	function _typedSignatureHash(typedData) {
		const error = /* @__PURE__ */ new Error("Expect argument to be non-empty array");
		if (typeof typedData !== "object" || !("length" in typedData) || !typedData.length) throw error;
		const data = typedData.map(function(e) {
			if (e.type !== "bytes") return e.value;
			return (0, utils_1.legacyToBuffer)(e.value);
		});
		const types = typedData.map(function(e) {
			return e.type;
		});
		const schema = typedData.map(function(e) {
			if (!e.name) throw error;
			return `${e.type} ${e.name}`;
		});
		return (0, util_1.arrToBufArr)((0, keccak_1.keccak256)((0, ethereumjs_abi_utils_1.solidityPack)(["bytes32", "bytes32"], [(0, keccak_1.keccak256)((0, ethereumjs_abi_utils_1.solidityPack)(new Array(typedData.length).fill("string"), schema)), (0, keccak_1.keccak256)((0, ethereumjs_abi_utils_1.solidityPack)(types, data))])));
	}
	/**
	* Sign typed data according to EIP-712. The signing differs based upon the `version`.
	*
	* V1 is based upon [an early version of EIP-712](https://github.com/ethereum/EIPs/pull/712/commits/21abe254fe0452d8583d5b132b1d7be87c0439ca)
	* that lacked some later security improvements, and should generally be neglected in favor of
	* later versions.
	*
	* V3 is based on [EIP-712](https://eips.ethereum.org/EIPS/eip-712), except that arrays and
	* recursive data structures are not supported.
	*
	* V4 is based on [EIP-712](https://eips.ethereum.org/EIPS/eip-712), and includes full support of
	* arrays and recursive data structures.
	*
	* @param options - The signing options.
	* @param options.privateKey - The private key to sign with.
	* @param options.data - The typed data to sign.
	* @param options.version - The signing version to use.
	* @returns The '0x'-prefixed hex encoded signature.
	*/
	function signTypedData({ privateKey, data, version }) {
		validateVersion(version);
		if ((0, utils_1.isNullish)(data)) throw new Error("Missing data parameter");
		else if ((0, utils_1.isNullish)(privateKey)) throw new Error("Missing private key parameter");
		const messageHash = version === SignTypedDataVersion.V1 ? _typedSignatureHash(data) : exports.TypedDataUtils.eip712Hash(data, version);
		const sig = (0, util_1.ecsign)(messageHash, privateKey);
		return (0, utils_1.concatSig)((0, util_1.toBuffer)(sig.v), sig.r, sig.s);
	}
	exports.signTypedData = signTypedData;
	/**
	* Recover the address of the account that created the given EIP-712
	* signature. The version provided must match the version used to
	* create the signature.
	*
	* @param options - The signature recovery options.
	* @param options.data - The typed data that was signed.
	* @param options.signature - The '0x-prefixed hex encoded message signature.
	* @param options.version - The signing version to use.
	* @returns The '0x'-prefixed hex address of the signer.
	*/
	function recoverTypedSignature({ data, signature, version }) {
		validateVersion(version);
		if ((0, utils_1.isNullish)(data)) throw new Error("Missing data parameter");
		else if ((0, utils_1.isNullish)(signature)) throw new Error("Missing signature parameter");
		const messageHash = version === SignTypedDataVersion.V1 ? _typedSignatureHash(data) : exports.TypedDataUtils.eip712Hash(data, version);
		const publicKey = (0, utils_1.recoverPublicKey)(messageHash, signature);
		const sender = (0, util_1.publicToAddress)(publicKey);
		return (0, util_1.bufferToHex)(sender);
	}
	exports.recoverTypedSignature = recoverTypedSignature;
}));
//#endregion
//#region node_modules/tweetnacl/nacl-fast.js
var require_nacl_fast = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(nacl) {
		"use strict";
		var gf = function(init) {
			var i, r = /* @__PURE__ */ new Float64Array(16);
			if (init) for (i = 0; i < init.length; i++) r[i] = init[i];
			return r;
		};
		var randombytes = function() {
			throw new Error("no PRNG");
		};
		var _0 = /* @__PURE__ */ new Uint8Array(16);
		var _9 = /* @__PURE__ */ new Uint8Array(32);
		_9[0] = 9;
		var gf0 = gf(), gf1 = gf([1]), _121665 = gf([56129, 1]), D = gf([
			30883,
			4953,
			19914,
			30187,
			55467,
			16705,
			2637,
			112,
			59544,
			30585,
			16505,
			36039,
			65139,
			11119,
			27886,
			20995
		]), D2 = gf([
			61785,
			9906,
			39828,
			60374,
			45398,
			33411,
			5274,
			224,
			53552,
			61171,
			33010,
			6542,
			64743,
			22239,
			55772,
			9222
		]), X = gf([
			54554,
			36645,
			11616,
			51542,
			42930,
			38181,
			51040,
			26924,
			56412,
			64982,
			57905,
			49316,
			21502,
			52590,
			14035,
			8553
		]), Y = gf([
			26200,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214,
			26214
		]), I = gf([
			41136,
			18958,
			6951,
			50414,
			58488,
			44335,
			6150,
			12099,
			55207,
			15867,
			153,
			11085,
			57099,
			20417,
			9344,
			11139
		]);
		function ts64(x, i, h, l) {
			x[i] = h >> 24 & 255;
			x[i + 1] = h >> 16 & 255;
			x[i + 2] = h >> 8 & 255;
			x[i + 3] = h & 255;
			x[i + 4] = l >> 24 & 255;
			x[i + 5] = l >> 16 & 255;
			x[i + 6] = l >> 8 & 255;
			x[i + 7] = l & 255;
		}
		function vn(x, xi, y, yi, n) {
			var i, d = 0;
			for (i = 0; i < n; i++) d |= x[xi + i] ^ y[yi + i];
			return (1 & d - 1 >>> 8) - 1;
		}
		function crypto_verify_16(x, xi, y, yi) {
			return vn(x, xi, y, yi, 16);
		}
		function crypto_verify_32(x, xi, y, yi) {
			return vn(x, xi, y, yi, 32);
		}
		function core_salsa20(o, p, k, c) {
			var j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
			var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
			for (var i = 0; i < 20; i += 2) {
				u = x0 + x12 | 0;
				x4 ^= u << 7 | u >>> 25;
				u = x4 + x0 | 0;
				x8 ^= u << 9 | u >>> 23;
				u = x8 + x4 | 0;
				x12 ^= u << 13 | u >>> 19;
				u = x12 + x8 | 0;
				x0 ^= u << 18 | u >>> 14;
				u = x5 + x1 | 0;
				x9 ^= u << 7 | u >>> 25;
				u = x9 + x5 | 0;
				x13 ^= u << 9 | u >>> 23;
				u = x13 + x9 | 0;
				x1 ^= u << 13 | u >>> 19;
				u = x1 + x13 | 0;
				x5 ^= u << 18 | u >>> 14;
				u = x10 + x6 | 0;
				x14 ^= u << 7 | u >>> 25;
				u = x14 + x10 | 0;
				x2 ^= u << 9 | u >>> 23;
				u = x2 + x14 | 0;
				x6 ^= u << 13 | u >>> 19;
				u = x6 + x2 | 0;
				x10 ^= u << 18 | u >>> 14;
				u = x15 + x11 | 0;
				x3 ^= u << 7 | u >>> 25;
				u = x3 + x15 | 0;
				x7 ^= u << 9 | u >>> 23;
				u = x7 + x3 | 0;
				x11 ^= u << 13 | u >>> 19;
				u = x11 + x7 | 0;
				x15 ^= u << 18 | u >>> 14;
				u = x0 + x3 | 0;
				x1 ^= u << 7 | u >>> 25;
				u = x1 + x0 | 0;
				x2 ^= u << 9 | u >>> 23;
				u = x2 + x1 | 0;
				x3 ^= u << 13 | u >>> 19;
				u = x3 + x2 | 0;
				x0 ^= u << 18 | u >>> 14;
				u = x5 + x4 | 0;
				x6 ^= u << 7 | u >>> 25;
				u = x6 + x5 | 0;
				x7 ^= u << 9 | u >>> 23;
				u = x7 + x6 | 0;
				x4 ^= u << 13 | u >>> 19;
				u = x4 + x7 | 0;
				x5 ^= u << 18 | u >>> 14;
				u = x10 + x9 | 0;
				x11 ^= u << 7 | u >>> 25;
				u = x11 + x10 | 0;
				x8 ^= u << 9 | u >>> 23;
				u = x8 + x11 | 0;
				x9 ^= u << 13 | u >>> 19;
				u = x9 + x8 | 0;
				x10 ^= u << 18 | u >>> 14;
				u = x15 + x14 | 0;
				x12 ^= u << 7 | u >>> 25;
				u = x12 + x15 | 0;
				x13 ^= u << 9 | u >>> 23;
				u = x13 + x12 | 0;
				x14 ^= u << 13 | u >>> 19;
				u = x14 + x13 | 0;
				x15 ^= u << 18 | u >>> 14;
			}
			x0 = x0 + j0 | 0;
			x1 = x1 + j1 | 0;
			x2 = x2 + j2 | 0;
			x3 = x3 + j3 | 0;
			x4 = x4 + j4 | 0;
			x5 = x5 + j5 | 0;
			x6 = x6 + j6 | 0;
			x7 = x7 + j7 | 0;
			x8 = x8 + j8 | 0;
			x9 = x9 + j9 | 0;
			x10 = x10 + j10 | 0;
			x11 = x11 + j11 | 0;
			x12 = x12 + j12 | 0;
			x13 = x13 + j13 | 0;
			x14 = x14 + j14 | 0;
			x15 = x15 + j15 | 0;
			o[0] = x0 >>> 0 & 255;
			o[1] = x0 >>> 8 & 255;
			o[2] = x0 >>> 16 & 255;
			o[3] = x0 >>> 24 & 255;
			o[4] = x1 >>> 0 & 255;
			o[5] = x1 >>> 8 & 255;
			o[6] = x1 >>> 16 & 255;
			o[7] = x1 >>> 24 & 255;
			o[8] = x2 >>> 0 & 255;
			o[9] = x2 >>> 8 & 255;
			o[10] = x2 >>> 16 & 255;
			o[11] = x2 >>> 24 & 255;
			o[12] = x3 >>> 0 & 255;
			o[13] = x3 >>> 8 & 255;
			o[14] = x3 >>> 16 & 255;
			o[15] = x3 >>> 24 & 255;
			o[16] = x4 >>> 0 & 255;
			o[17] = x4 >>> 8 & 255;
			o[18] = x4 >>> 16 & 255;
			o[19] = x4 >>> 24 & 255;
			o[20] = x5 >>> 0 & 255;
			o[21] = x5 >>> 8 & 255;
			o[22] = x5 >>> 16 & 255;
			o[23] = x5 >>> 24 & 255;
			o[24] = x6 >>> 0 & 255;
			o[25] = x6 >>> 8 & 255;
			o[26] = x6 >>> 16 & 255;
			o[27] = x6 >>> 24 & 255;
			o[28] = x7 >>> 0 & 255;
			o[29] = x7 >>> 8 & 255;
			o[30] = x7 >>> 16 & 255;
			o[31] = x7 >>> 24 & 255;
			o[32] = x8 >>> 0 & 255;
			o[33] = x8 >>> 8 & 255;
			o[34] = x8 >>> 16 & 255;
			o[35] = x8 >>> 24 & 255;
			o[36] = x9 >>> 0 & 255;
			o[37] = x9 >>> 8 & 255;
			o[38] = x9 >>> 16 & 255;
			o[39] = x9 >>> 24 & 255;
			o[40] = x10 >>> 0 & 255;
			o[41] = x10 >>> 8 & 255;
			o[42] = x10 >>> 16 & 255;
			o[43] = x10 >>> 24 & 255;
			o[44] = x11 >>> 0 & 255;
			o[45] = x11 >>> 8 & 255;
			o[46] = x11 >>> 16 & 255;
			o[47] = x11 >>> 24 & 255;
			o[48] = x12 >>> 0 & 255;
			o[49] = x12 >>> 8 & 255;
			o[50] = x12 >>> 16 & 255;
			o[51] = x12 >>> 24 & 255;
			o[52] = x13 >>> 0 & 255;
			o[53] = x13 >>> 8 & 255;
			o[54] = x13 >>> 16 & 255;
			o[55] = x13 >>> 24 & 255;
			o[56] = x14 >>> 0 & 255;
			o[57] = x14 >>> 8 & 255;
			o[58] = x14 >>> 16 & 255;
			o[59] = x14 >>> 24 & 255;
			o[60] = x15 >>> 0 & 255;
			o[61] = x15 >>> 8 & 255;
			o[62] = x15 >>> 16 & 255;
			o[63] = x15 >>> 24 & 255;
		}
		function core_hsalsa20(o, p, k, c) {
			var j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
			var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
			for (var i = 0; i < 20; i += 2) {
				u = x0 + x12 | 0;
				x4 ^= u << 7 | u >>> 25;
				u = x4 + x0 | 0;
				x8 ^= u << 9 | u >>> 23;
				u = x8 + x4 | 0;
				x12 ^= u << 13 | u >>> 19;
				u = x12 + x8 | 0;
				x0 ^= u << 18 | u >>> 14;
				u = x5 + x1 | 0;
				x9 ^= u << 7 | u >>> 25;
				u = x9 + x5 | 0;
				x13 ^= u << 9 | u >>> 23;
				u = x13 + x9 | 0;
				x1 ^= u << 13 | u >>> 19;
				u = x1 + x13 | 0;
				x5 ^= u << 18 | u >>> 14;
				u = x10 + x6 | 0;
				x14 ^= u << 7 | u >>> 25;
				u = x14 + x10 | 0;
				x2 ^= u << 9 | u >>> 23;
				u = x2 + x14 | 0;
				x6 ^= u << 13 | u >>> 19;
				u = x6 + x2 | 0;
				x10 ^= u << 18 | u >>> 14;
				u = x15 + x11 | 0;
				x3 ^= u << 7 | u >>> 25;
				u = x3 + x15 | 0;
				x7 ^= u << 9 | u >>> 23;
				u = x7 + x3 | 0;
				x11 ^= u << 13 | u >>> 19;
				u = x11 + x7 | 0;
				x15 ^= u << 18 | u >>> 14;
				u = x0 + x3 | 0;
				x1 ^= u << 7 | u >>> 25;
				u = x1 + x0 | 0;
				x2 ^= u << 9 | u >>> 23;
				u = x2 + x1 | 0;
				x3 ^= u << 13 | u >>> 19;
				u = x3 + x2 | 0;
				x0 ^= u << 18 | u >>> 14;
				u = x5 + x4 | 0;
				x6 ^= u << 7 | u >>> 25;
				u = x6 + x5 | 0;
				x7 ^= u << 9 | u >>> 23;
				u = x7 + x6 | 0;
				x4 ^= u << 13 | u >>> 19;
				u = x4 + x7 | 0;
				x5 ^= u << 18 | u >>> 14;
				u = x10 + x9 | 0;
				x11 ^= u << 7 | u >>> 25;
				u = x11 + x10 | 0;
				x8 ^= u << 9 | u >>> 23;
				u = x8 + x11 | 0;
				x9 ^= u << 13 | u >>> 19;
				u = x9 + x8 | 0;
				x10 ^= u << 18 | u >>> 14;
				u = x15 + x14 | 0;
				x12 ^= u << 7 | u >>> 25;
				u = x12 + x15 | 0;
				x13 ^= u << 9 | u >>> 23;
				u = x13 + x12 | 0;
				x14 ^= u << 13 | u >>> 19;
				u = x14 + x13 | 0;
				x15 ^= u << 18 | u >>> 14;
			}
			o[0] = x0 >>> 0 & 255;
			o[1] = x0 >>> 8 & 255;
			o[2] = x0 >>> 16 & 255;
			o[3] = x0 >>> 24 & 255;
			o[4] = x5 >>> 0 & 255;
			o[5] = x5 >>> 8 & 255;
			o[6] = x5 >>> 16 & 255;
			o[7] = x5 >>> 24 & 255;
			o[8] = x10 >>> 0 & 255;
			o[9] = x10 >>> 8 & 255;
			o[10] = x10 >>> 16 & 255;
			o[11] = x10 >>> 24 & 255;
			o[12] = x15 >>> 0 & 255;
			o[13] = x15 >>> 8 & 255;
			o[14] = x15 >>> 16 & 255;
			o[15] = x15 >>> 24 & 255;
			o[16] = x6 >>> 0 & 255;
			o[17] = x6 >>> 8 & 255;
			o[18] = x6 >>> 16 & 255;
			o[19] = x6 >>> 24 & 255;
			o[20] = x7 >>> 0 & 255;
			o[21] = x7 >>> 8 & 255;
			o[22] = x7 >>> 16 & 255;
			o[23] = x7 >>> 24 & 255;
			o[24] = x8 >>> 0 & 255;
			o[25] = x8 >>> 8 & 255;
			o[26] = x8 >>> 16 & 255;
			o[27] = x8 >>> 24 & 255;
			o[28] = x9 >>> 0 & 255;
			o[29] = x9 >>> 8 & 255;
			o[30] = x9 >>> 16 & 255;
			o[31] = x9 >>> 24 & 255;
		}
		function crypto_core_salsa20(out, inp, k, c) {
			core_salsa20(out, inp, k, c);
		}
		function crypto_core_hsalsa20(out, inp, k, c) {
			core_hsalsa20(out, inp, k, c);
		}
		var sigma = new Uint8Array([
			101,
			120,
			112,
			97,
			110,
			100,
			32,
			51,
			50,
			45,
			98,
			121,
			116,
			101,
			32,
			107
		]);
		function crypto_stream_salsa20_xor(c, cpos, m, mpos, b, n, k) {
			var z = /* @__PURE__ */ new Uint8Array(16), x = /* @__PURE__ */ new Uint8Array(64);
			var u, i = 0;
			for (; i < 16; i++) z[i] = 0;
			for (i = 0; i < 8; i++) z[i] = n[i];
			while (b >= 64) {
				crypto_core_salsa20(x, z, k, sigma);
				for (i = 0; i < 64; i++) c[cpos + i] = m[mpos + i] ^ x[i];
				u = 1;
				for (i = 8; i < 16; i++) {
					u = u + (z[i] & 255) | 0;
					z[i] = u & 255;
					u >>>= 8;
				}
				b -= 64;
				cpos += 64;
				mpos += 64;
			}
			if (b > 0) {
				crypto_core_salsa20(x, z, k, sigma);
				for (i = 0; i < b; i++) c[cpos + i] = m[mpos + i] ^ x[i];
			}
			return 0;
		}
		function crypto_stream_salsa20(c, cpos, b, n, k) {
			var z = /* @__PURE__ */ new Uint8Array(16), x = /* @__PURE__ */ new Uint8Array(64);
			var u, i = 0;
			for (; i < 16; i++) z[i] = 0;
			for (i = 0; i < 8; i++) z[i] = n[i];
			while (b >= 64) {
				crypto_core_salsa20(x, z, k, sigma);
				for (i = 0; i < 64; i++) c[cpos + i] = x[i];
				u = 1;
				for (i = 8; i < 16; i++) {
					u = u + (z[i] & 255) | 0;
					z[i] = u & 255;
					u >>>= 8;
				}
				b -= 64;
				cpos += 64;
			}
			if (b > 0) {
				crypto_core_salsa20(x, z, k, sigma);
				for (i = 0; i < b; i++) c[cpos + i] = x[i];
			}
			return 0;
		}
		function crypto_stream(c, cpos, d, n, k) {
			var s = /* @__PURE__ */ new Uint8Array(32);
			crypto_core_hsalsa20(s, n, k, sigma);
			var sn = /* @__PURE__ */ new Uint8Array(8);
			for (var i = 0; i < 8; i++) sn[i] = n[i + 16];
			return crypto_stream_salsa20(c, cpos, d, sn, s);
		}
		function crypto_stream_xor(c, cpos, m, mpos, d, n, k) {
			var s = /* @__PURE__ */ new Uint8Array(32);
			crypto_core_hsalsa20(s, n, k, sigma);
			var sn = /* @__PURE__ */ new Uint8Array(8);
			for (var i = 0; i < 8; i++) sn[i] = n[i + 16];
			return crypto_stream_salsa20_xor(c, cpos, m, mpos, d, sn, s);
		}
		var poly1305 = function(key) {
			this.buffer = /* @__PURE__ */ new Uint8Array(16);
			this.r = /* @__PURE__ */ new Uint16Array(10);
			this.h = /* @__PURE__ */ new Uint16Array(10);
			this.pad = /* @__PURE__ */ new Uint16Array(8);
			this.leftover = 0;
			this.fin = 0;
			var t0 = key[0] & 255 | (key[1] & 255) << 8, t1, t2, t3, t4, t5, t6, t7;
			this.r[0] = t0 & 8191;
			t1 = key[2] & 255 | (key[3] & 255) << 8;
			this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
			t2 = key[4] & 255 | (key[5] & 255) << 8;
			this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
			t3 = key[6] & 255 | (key[7] & 255) << 8;
			this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
			t4 = key[8] & 255 | (key[9] & 255) << 8;
			this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
			this.r[5] = t4 >>> 1 & 8190;
			t5 = key[10] & 255 | (key[11] & 255) << 8;
			this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
			t6 = key[12] & 255 | (key[13] & 255) << 8;
			this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
			t7 = key[14] & 255 | (key[15] & 255) << 8;
			this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
			this.r[9] = t7 >>> 5 & 127;
			this.pad[0] = key[16] & 255 | (key[17] & 255) << 8;
			this.pad[1] = key[18] & 255 | (key[19] & 255) << 8;
			this.pad[2] = key[20] & 255 | (key[21] & 255) << 8;
			this.pad[3] = key[22] & 255 | (key[23] & 255) << 8;
			this.pad[4] = key[24] & 255 | (key[25] & 255) << 8;
			this.pad[5] = key[26] & 255 | (key[27] & 255) << 8;
			this.pad[6] = key[28] & 255 | (key[29] & 255) << 8;
			this.pad[7] = key[30] & 255 | (key[31] & 255) << 8;
		};
		poly1305.prototype.blocks = function(m, mpos, bytes) {
			var hibit = this.fin ? 0 : 2048;
			var t0, t1, t2, t3, t4, t5, t6, t7, c;
			var d0, d1, d2, d3, d4, d5, d6, d7, d8, d9;
			var h0 = this.h[0], h1 = this.h[1], h2 = this.h[2], h3 = this.h[3], h4 = this.h[4], h5 = this.h[5], h6 = this.h[6], h7 = this.h[7], h8 = this.h[8], h9 = this.h[9];
			var r0 = this.r[0], r1 = this.r[1], r2 = this.r[2], r3 = this.r[3], r4 = this.r[4], r5 = this.r[5], r6 = this.r[6], r7 = this.r[7], r8 = this.r[8], r9 = this.r[9];
			while (bytes >= 16) {
				t0 = m[mpos + 0] & 255 | (m[mpos + 1] & 255) << 8;
				h0 += t0 & 8191;
				t1 = m[mpos + 2] & 255 | (m[mpos + 3] & 255) << 8;
				h1 += (t0 >>> 13 | t1 << 3) & 8191;
				t2 = m[mpos + 4] & 255 | (m[mpos + 5] & 255) << 8;
				h2 += (t1 >>> 10 | t2 << 6) & 8191;
				t3 = m[mpos + 6] & 255 | (m[mpos + 7] & 255) << 8;
				h3 += (t2 >>> 7 | t3 << 9) & 8191;
				t4 = m[mpos + 8] & 255 | (m[mpos + 9] & 255) << 8;
				h4 += (t3 >>> 4 | t4 << 12) & 8191;
				h5 += t4 >>> 1 & 8191;
				t5 = m[mpos + 10] & 255 | (m[mpos + 11] & 255) << 8;
				h6 += (t4 >>> 14 | t5 << 2) & 8191;
				t6 = m[mpos + 12] & 255 | (m[mpos + 13] & 255) << 8;
				h7 += (t5 >>> 11 | t6 << 5) & 8191;
				t7 = m[mpos + 14] & 255 | (m[mpos + 15] & 255) << 8;
				h8 += (t6 >>> 8 | t7 << 8) & 8191;
				h9 += t7 >>> 5 | hibit;
				c = 0;
				d0 = c;
				d0 += h0 * r0;
				d0 += h1 * (5 * r9);
				d0 += h2 * (5 * r8);
				d0 += h3 * (5 * r7);
				d0 += h4 * (5 * r6);
				c = d0 >>> 13;
				d0 &= 8191;
				d0 += h5 * (5 * r5);
				d0 += h6 * (5 * r4);
				d0 += h7 * (5 * r3);
				d0 += h8 * (5 * r2);
				d0 += h9 * (5 * r1);
				c += d0 >>> 13;
				d0 &= 8191;
				d1 = c;
				d1 += h0 * r1;
				d1 += h1 * r0;
				d1 += h2 * (5 * r9);
				d1 += h3 * (5 * r8);
				d1 += h4 * (5 * r7);
				c = d1 >>> 13;
				d1 &= 8191;
				d1 += h5 * (5 * r6);
				d1 += h6 * (5 * r5);
				d1 += h7 * (5 * r4);
				d1 += h8 * (5 * r3);
				d1 += h9 * (5 * r2);
				c += d1 >>> 13;
				d1 &= 8191;
				d2 = c;
				d2 += h0 * r2;
				d2 += h1 * r1;
				d2 += h2 * r0;
				d2 += h3 * (5 * r9);
				d2 += h4 * (5 * r8);
				c = d2 >>> 13;
				d2 &= 8191;
				d2 += h5 * (5 * r7);
				d2 += h6 * (5 * r6);
				d2 += h7 * (5 * r5);
				d2 += h8 * (5 * r4);
				d2 += h9 * (5 * r3);
				c += d2 >>> 13;
				d2 &= 8191;
				d3 = c;
				d3 += h0 * r3;
				d3 += h1 * r2;
				d3 += h2 * r1;
				d3 += h3 * r0;
				d3 += h4 * (5 * r9);
				c = d3 >>> 13;
				d3 &= 8191;
				d3 += h5 * (5 * r8);
				d3 += h6 * (5 * r7);
				d3 += h7 * (5 * r6);
				d3 += h8 * (5 * r5);
				d3 += h9 * (5 * r4);
				c += d3 >>> 13;
				d3 &= 8191;
				d4 = c;
				d4 += h0 * r4;
				d4 += h1 * r3;
				d4 += h2 * r2;
				d4 += h3 * r1;
				d4 += h4 * r0;
				c = d4 >>> 13;
				d4 &= 8191;
				d4 += h5 * (5 * r9);
				d4 += h6 * (5 * r8);
				d4 += h7 * (5 * r7);
				d4 += h8 * (5 * r6);
				d4 += h9 * (5 * r5);
				c += d4 >>> 13;
				d4 &= 8191;
				d5 = c;
				d5 += h0 * r5;
				d5 += h1 * r4;
				d5 += h2 * r3;
				d5 += h3 * r2;
				d5 += h4 * r1;
				c = d5 >>> 13;
				d5 &= 8191;
				d5 += h5 * r0;
				d5 += h6 * (5 * r9);
				d5 += h7 * (5 * r8);
				d5 += h8 * (5 * r7);
				d5 += h9 * (5 * r6);
				c += d5 >>> 13;
				d5 &= 8191;
				d6 = c;
				d6 += h0 * r6;
				d6 += h1 * r5;
				d6 += h2 * r4;
				d6 += h3 * r3;
				d6 += h4 * r2;
				c = d6 >>> 13;
				d6 &= 8191;
				d6 += h5 * r1;
				d6 += h6 * r0;
				d6 += h7 * (5 * r9);
				d6 += h8 * (5 * r8);
				d6 += h9 * (5 * r7);
				c += d6 >>> 13;
				d6 &= 8191;
				d7 = c;
				d7 += h0 * r7;
				d7 += h1 * r6;
				d7 += h2 * r5;
				d7 += h3 * r4;
				d7 += h4 * r3;
				c = d7 >>> 13;
				d7 &= 8191;
				d7 += h5 * r2;
				d7 += h6 * r1;
				d7 += h7 * r0;
				d7 += h8 * (5 * r9);
				d7 += h9 * (5 * r8);
				c += d7 >>> 13;
				d7 &= 8191;
				d8 = c;
				d8 += h0 * r8;
				d8 += h1 * r7;
				d8 += h2 * r6;
				d8 += h3 * r5;
				d8 += h4 * r4;
				c = d8 >>> 13;
				d8 &= 8191;
				d8 += h5 * r3;
				d8 += h6 * r2;
				d8 += h7 * r1;
				d8 += h8 * r0;
				d8 += h9 * (5 * r9);
				c += d8 >>> 13;
				d8 &= 8191;
				d9 = c;
				d9 += h0 * r9;
				d9 += h1 * r8;
				d9 += h2 * r7;
				d9 += h3 * r6;
				d9 += h4 * r5;
				c = d9 >>> 13;
				d9 &= 8191;
				d9 += h5 * r4;
				d9 += h6 * r3;
				d9 += h7 * r2;
				d9 += h8 * r1;
				d9 += h9 * r0;
				c += d9 >>> 13;
				d9 &= 8191;
				c = (c << 2) + c | 0;
				c = c + d0 | 0;
				d0 = c & 8191;
				c = c >>> 13;
				d1 += c;
				h0 = d0;
				h1 = d1;
				h2 = d2;
				h3 = d3;
				h4 = d4;
				h5 = d5;
				h6 = d6;
				h7 = d7;
				h8 = d8;
				h9 = d9;
				mpos += 16;
				bytes -= 16;
			}
			this.h[0] = h0;
			this.h[1] = h1;
			this.h[2] = h2;
			this.h[3] = h3;
			this.h[4] = h4;
			this.h[5] = h5;
			this.h[6] = h6;
			this.h[7] = h7;
			this.h[8] = h8;
			this.h[9] = h9;
		};
		poly1305.prototype.finish = function(mac, macpos) {
			var g = /* @__PURE__ */ new Uint16Array(10);
			var c, mask, f, i;
			if (this.leftover) {
				i = this.leftover;
				this.buffer[i++] = 1;
				for (; i < 16; i++) this.buffer[i] = 0;
				this.fin = 1;
				this.blocks(this.buffer, 0, 16);
			}
			c = this.h[1] >>> 13;
			this.h[1] &= 8191;
			for (i = 2; i < 10; i++) {
				this.h[i] += c;
				c = this.h[i] >>> 13;
				this.h[i] &= 8191;
			}
			this.h[0] += c * 5;
			c = this.h[0] >>> 13;
			this.h[0] &= 8191;
			this.h[1] += c;
			c = this.h[1] >>> 13;
			this.h[1] &= 8191;
			this.h[2] += c;
			g[0] = this.h[0] + 5;
			c = g[0] >>> 13;
			g[0] &= 8191;
			for (i = 1; i < 10; i++) {
				g[i] = this.h[i] + c;
				c = g[i] >>> 13;
				g[i] &= 8191;
			}
			g[9] -= 8192;
			mask = (c ^ 1) - 1;
			for (i = 0; i < 10; i++) g[i] &= mask;
			mask = ~mask;
			for (i = 0; i < 10; i++) this.h[i] = this.h[i] & mask | g[i];
			this.h[0] = (this.h[0] | this.h[1] << 13) & 65535;
			this.h[1] = (this.h[1] >>> 3 | this.h[2] << 10) & 65535;
			this.h[2] = (this.h[2] >>> 6 | this.h[3] << 7) & 65535;
			this.h[3] = (this.h[3] >>> 9 | this.h[4] << 4) & 65535;
			this.h[4] = (this.h[4] >>> 12 | this.h[5] << 1 | this.h[6] << 14) & 65535;
			this.h[5] = (this.h[6] >>> 2 | this.h[7] << 11) & 65535;
			this.h[6] = (this.h[7] >>> 5 | this.h[8] << 8) & 65535;
			this.h[7] = (this.h[8] >>> 8 | this.h[9] << 5) & 65535;
			f = this.h[0] + this.pad[0];
			this.h[0] = f & 65535;
			for (i = 1; i < 8; i++) {
				f = (this.h[i] + this.pad[i] | 0) + (f >>> 16) | 0;
				this.h[i] = f & 65535;
			}
			mac[macpos + 0] = this.h[0] >>> 0 & 255;
			mac[macpos + 1] = this.h[0] >>> 8 & 255;
			mac[macpos + 2] = this.h[1] >>> 0 & 255;
			mac[macpos + 3] = this.h[1] >>> 8 & 255;
			mac[macpos + 4] = this.h[2] >>> 0 & 255;
			mac[macpos + 5] = this.h[2] >>> 8 & 255;
			mac[macpos + 6] = this.h[3] >>> 0 & 255;
			mac[macpos + 7] = this.h[3] >>> 8 & 255;
			mac[macpos + 8] = this.h[4] >>> 0 & 255;
			mac[macpos + 9] = this.h[4] >>> 8 & 255;
			mac[macpos + 10] = this.h[5] >>> 0 & 255;
			mac[macpos + 11] = this.h[5] >>> 8 & 255;
			mac[macpos + 12] = this.h[6] >>> 0 & 255;
			mac[macpos + 13] = this.h[6] >>> 8 & 255;
			mac[macpos + 14] = this.h[7] >>> 0 & 255;
			mac[macpos + 15] = this.h[7] >>> 8 & 255;
		};
		poly1305.prototype.update = function(m, mpos, bytes) {
			var i, want;
			if (this.leftover) {
				want = 16 - this.leftover;
				if (want > bytes) want = bytes;
				for (i = 0; i < want; i++) this.buffer[this.leftover + i] = m[mpos + i];
				bytes -= want;
				mpos += want;
				this.leftover += want;
				if (this.leftover < 16) return;
				this.blocks(this.buffer, 0, 16);
				this.leftover = 0;
			}
			if (bytes >= 16) {
				want = bytes - bytes % 16;
				this.blocks(m, mpos, want);
				mpos += want;
				bytes -= want;
			}
			if (bytes) {
				for (i = 0; i < bytes; i++) this.buffer[this.leftover + i] = m[mpos + i];
				this.leftover += bytes;
			}
		};
		function crypto_onetimeauth(out, outpos, m, mpos, n, k) {
			var s = new poly1305(k);
			s.update(m, mpos, n);
			s.finish(out, outpos);
			return 0;
		}
		function crypto_onetimeauth_verify(h, hpos, m, mpos, n, k) {
			var x = /* @__PURE__ */ new Uint8Array(16);
			crypto_onetimeauth(x, 0, m, mpos, n, k);
			return crypto_verify_16(h, hpos, x, 0);
		}
		function crypto_secretbox(c, m, d, n, k) {
			var i;
			if (d < 32) return -1;
			crypto_stream_xor(c, 0, m, 0, d, n, k);
			crypto_onetimeauth(c, 16, c, 32, d - 32, c);
			for (i = 0; i < 16; i++) c[i] = 0;
			return 0;
		}
		function crypto_secretbox_open(m, c, d, n, k) {
			var i;
			var x = /* @__PURE__ */ new Uint8Array(32);
			if (d < 32) return -1;
			crypto_stream(x, 0, 32, n, k);
			if (crypto_onetimeauth_verify(c, 16, c, 32, d - 32, x) !== 0) return -1;
			crypto_stream_xor(m, 0, c, 0, d, n, k);
			for (i = 0; i < 32; i++) m[i] = 0;
			return 0;
		}
		function set25519(r, a) {
			var i = 0;
			for (; i < 16; i++) r[i] = a[i] | 0;
		}
		function car25519(o) {
			var i, v, c = 1;
			for (i = 0; i < 16; i++) {
				v = o[i] + c + 65535;
				c = Math.floor(v / 65536);
				o[i] = v - c * 65536;
			}
			o[0] += c - 1 + 37 * (c - 1);
		}
		function sel25519(p, q, b) {
			var t, c = ~(b - 1);
			for (var i = 0; i < 16; i++) {
				t = c & (p[i] ^ q[i]);
				p[i] ^= t;
				q[i] ^= t;
			}
		}
		function pack25519(o, n) {
			var i, j, b;
			var m = gf(), t = gf();
			for (i = 0; i < 16; i++) t[i] = n[i];
			car25519(t);
			car25519(t);
			car25519(t);
			for (j = 0; j < 2; j++) {
				m[0] = t[0] - 65517;
				for (i = 1; i < 15; i++) {
					m[i] = t[i] - 65535 - (m[i - 1] >> 16 & 1);
					m[i - 1] &= 65535;
				}
				m[15] = t[15] - 32767 - (m[14] >> 16 & 1);
				b = m[15] >> 16 & 1;
				m[14] &= 65535;
				sel25519(t, m, 1 - b);
			}
			for (i = 0; i < 16; i++) {
				o[2 * i] = t[i] & 255;
				o[2 * i + 1] = t[i] >> 8;
			}
		}
		function neq25519(a, b) {
			var c = /* @__PURE__ */ new Uint8Array(32), d = /* @__PURE__ */ new Uint8Array(32);
			pack25519(c, a);
			pack25519(d, b);
			return crypto_verify_32(c, 0, d, 0);
		}
		function par25519(a) {
			var d = /* @__PURE__ */ new Uint8Array(32);
			pack25519(d, a);
			return d[0] & 1;
		}
		function unpack25519(o, n) {
			var i = 0;
			for (; i < 16; i++) o[i] = n[2 * i] + (n[2 * i + 1] << 8);
			o[15] &= 32767;
		}
		function A(o, a, b) {
			for (var i = 0; i < 16; i++) o[i] = a[i] + b[i];
		}
		function Z(o, a, b) {
			for (var i = 0; i < 16; i++) o[i] = a[i] - b[i];
		}
		function M(o, a, b) {
			var v, c, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0, t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0, t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0, b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11], b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
			v = a[0];
			t0 += v * b0;
			t1 += v * b1;
			t2 += v * b2;
			t3 += v * b3;
			t4 += v * b4;
			t5 += v * b5;
			t6 += v * b6;
			t7 += v * b7;
			t8 += v * b8;
			t9 += v * b9;
			t10 += v * b10;
			t11 += v * b11;
			t12 += v * b12;
			t13 += v * b13;
			t14 += v * b14;
			t15 += v * b15;
			v = a[1];
			t1 += v * b0;
			t2 += v * b1;
			t3 += v * b2;
			t4 += v * b3;
			t5 += v * b4;
			t6 += v * b5;
			t7 += v * b6;
			t8 += v * b7;
			t9 += v * b8;
			t10 += v * b9;
			t11 += v * b10;
			t12 += v * b11;
			t13 += v * b12;
			t14 += v * b13;
			t15 += v * b14;
			t16 += v * b15;
			v = a[2];
			t2 += v * b0;
			t3 += v * b1;
			t4 += v * b2;
			t5 += v * b3;
			t6 += v * b4;
			t7 += v * b5;
			t8 += v * b6;
			t9 += v * b7;
			t10 += v * b8;
			t11 += v * b9;
			t12 += v * b10;
			t13 += v * b11;
			t14 += v * b12;
			t15 += v * b13;
			t16 += v * b14;
			t17 += v * b15;
			v = a[3];
			t3 += v * b0;
			t4 += v * b1;
			t5 += v * b2;
			t6 += v * b3;
			t7 += v * b4;
			t8 += v * b5;
			t9 += v * b6;
			t10 += v * b7;
			t11 += v * b8;
			t12 += v * b9;
			t13 += v * b10;
			t14 += v * b11;
			t15 += v * b12;
			t16 += v * b13;
			t17 += v * b14;
			t18 += v * b15;
			v = a[4];
			t4 += v * b0;
			t5 += v * b1;
			t6 += v * b2;
			t7 += v * b3;
			t8 += v * b4;
			t9 += v * b5;
			t10 += v * b6;
			t11 += v * b7;
			t12 += v * b8;
			t13 += v * b9;
			t14 += v * b10;
			t15 += v * b11;
			t16 += v * b12;
			t17 += v * b13;
			t18 += v * b14;
			t19 += v * b15;
			v = a[5];
			t5 += v * b0;
			t6 += v * b1;
			t7 += v * b2;
			t8 += v * b3;
			t9 += v * b4;
			t10 += v * b5;
			t11 += v * b6;
			t12 += v * b7;
			t13 += v * b8;
			t14 += v * b9;
			t15 += v * b10;
			t16 += v * b11;
			t17 += v * b12;
			t18 += v * b13;
			t19 += v * b14;
			t20 += v * b15;
			v = a[6];
			t6 += v * b0;
			t7 += v * b1;
			t8 += v * b2;
			t9 += v * b3;
			t10 += v * b4;
			t11 += v * b5;
			t12 += v * b6;
			t13 += v * b7;
			t14 += v * b8;
			t15 += v * b9;
			t16 += v * b10;
			t17 += v * b11;
			t18 += v * b12;
			t19 += v * b13;
			t20 += v * b14;
			t21 += v * b15;
			v = a[7];
			t7 += v * b0;
			t8 += v * b1;
			t9 += v * b2;
			t10 += v * b3;
			t11 += v * b4;
			t12 += v * b5;
			t13 += v * b6;
			t14 += v * b7;
			t15 += v * b8;
			t16 += v * b9;
			t17 += v * b10;
			t18 += v * b11;
			t19 += v * b12;
			t20 += v * b13;
			t21 += v * b14;
			t22 += v * b15;
			v = a[8];
			t8 += v * b0;
			t9 += v * b1;
			t10 += v * b2;
			t11 += v * b3;
			t12 += v * b4;
			t13 += v * b5;
			t14 += v * b6;
			t15 += v * b7;
			t16 += v * b8;
			t17 += v * b9;
			t18 += v * b10;
			t19 += v * b11;
			t20 += v * b12;
			t21 += v * b13;
			t22 += v * b14;
			t23 += v * b15;
			v = a[9];
			t9 += v * b0;
			t10 += v * b1;
			t11 += v * b2;
			t12 += v * b3;
			t13 += v * b4;
			t14 += v * b5;
			t15 += v * b6;
			t16 += v * b7;
			t17 += v * b8;
			t18 += v * b9;
			t19 += v * b10;
			t20 += v * b11;
			t21 += v * b12;
			t22 += v * b13;
			t23 += v * b14;
			t24 += v * b15;
			v = a[10];
			t10 += v * b0;
			t11 += v * b1;
			t12 += v * b2;
			t13 += v * b3;
			t14 += v * b4;
			t15 += v * b5;
			t16 += v * b6;
			t17 += v * b7;
			t18 += v * b8;
			t19 += v * b9;
			t20 += v * b10;
			t21 += v * b11;
			t22 += v * b12;
			t23 += v * b13;
			t24 += v * b14;
			t25 += v * b15;
			v = a[11];
			t11 += v * b0;
			t12 += v * b1;
			t13 += v * b2;
			t14 += v * b3;
			t15 += v * b4;
			t16 += v * b5;
			t17 += v * b6;
			t18 += v * b7;
			t19 += v * b8;
			t20 += v * b9;
			t21 += v * b10;
			t22 += v * b11;
			t23 += v * b12;
			t24 += v * b13;
			t25 += v * b14;
			t26 += v * b15;
			v = a[12];
			t12 += v * b0;
			t13 += v * b1;
			t14 += v * b2;
			t15 += v * b3;
			t16 += v * b4;
			t17 += v * b5;
			t18 += v * b6;
			t19 += v * b7;
			t20 += v * b8;
			t21 += v * b9;
			t22 += v * b10;
			t23 += v * b11;
			t24 += v * b12;
			t25 += v * b13;
			t26 += v * b14;
			t27 += v * b15;
			v = a[13];
			t13 += v * b0;
			t14 += v * b1;
			t15 += v * b2;
			t16 += v * b3;
			t17 += v * b4;
			t18 += v * b5;
			t19 += v * b6;
			t20 += v * b7;
			t21 += v * b8;
			t22 += v * b9;
			t23 += v * b10;
			t24 += v * b11;
			t25 += v * b12;
			t26 += v * b13;
			t27 += v * b14;
			t28 += v * b15;
			v = a[14];
			t14 += v * b0;
			t15 += v * b1;
			t16 += v * b2;
			t17 += v * b3;
			t18 += v * b4;
			t19 += v * b5;
			t20 += v * b6;
			t21 += v * b7;
			t22 += v * b8;
			t23 += v * b9;
			t24 += v * b10;
			t25 += v * b11;
			t26 += v * b12;
			t27 += v * b13;
			t28 += v * b14;
			t29 += v * b15;
			v = a[15];
			t15 += v * b0;
			t16 += v * b1;
			t17 += v * b2;
			t18 += v * b3;
			t19 += v * b4;
			t20 += v * b5;
			t21 += v * b6;
			t22 += v * b7;
			t23 += v * b8;
			t24 += v * b9;
			t25 += v * b10;
			t26 += v * b11;
			t27 += v * b12;
			t28 += v * b13;
			t29 += v * b14;
			t30 += v * b15;
			t0 += 38 * t16;
			t1 += 38 * t17;
			t2 += 38 * t18;
			t3 += 38 * t19;
			t4 += 38 * t20;
			t5 += 38 * t21;
			t6 += 38 * t22;
			t7 += 38 * t23;
			t8 += 38 * t24;
			t9 += 38 * t25;
			t10 += 38 * t26;
			t11 += 38 * t27;
			t12 += 38 * t28;
			t13 += 38 * t29;
			t14 += 38 * t30;
			c = 1;
			v = t0 + c + 65535;
			c = Math.floor(v / 65536);
			t0 = v - c * 65536;
			v = t1 + c + 65535;
			c = Math.floor(v / 65536);
			t1 = v - c * 65536;
			v = t2 + c + 65535;
			c = Math.floor(v / 65536);
			t2 = v - c * 65536;
			v = t3 + c + 65535;
			c = Math.floor(v / 65536);
			t3 = v - c * 65536;
			v = t4 + c + 65535;
			c = Math.floor(v / 65536);
			t4 = v - c * 65536;
			v = t5 + c + 65535;
			c = Math.floor(v / 65536);
			t5 = v - c * 65536;
			v = t6 + c + 65535;
			c = Math.floor(v / 65536);
			t6 = v - c * 65536;
			v = t7 + c + 65535;
			c = Math.floor(v / 65536);
			t7 = v - c * 65536;
			v = t8 + c + 65535;
			c = Math.floor(v / 65536);
			t8 = v - c * 65536;
			v = t9 + c + 65535;
			c = Math.floor(v / 65536);
			t9 = v - c * 65536;
			v = t10 + c + 65535;
			c = Math.floor(v / 65536);
			t10 = v - c * 65536;
			v = t11 + c + 65535;
			c = Math.floor(v / 65536);
			t11 = v - c * 65536;
			v = t12 + c + 65535;
			c = Math.floor(v / 65536);
			t12 = v - c * 65536;
			v = t13 + c + 65535;
			c = Math.floor(v / 65536);
			t13 = v - c * 65536;
			v = t14 + c + 65535;
			c = Math.floor(v / 65536);
			t14 = v - c * 65536;
			v = t15 + c + 65535;
			c = Math.floor(v / 65536);
			t15 = v - c * 65536;
			t0 += c - 1 + 37 * (c - 1);
			c = 1;
			v = t0 + c + 65535;
			c = Math.floor(v / 65536);
			t0 = v - c * 65536;
			v = t1 + c + 65535;
			c = Math.floor(v / 65536);
			t1 = v - c * 65536;
			v = t2 + c + 65535;
			c = Math.floor(v / 65536);
			t2 = v - c * 65536;
			v = t3 + c + 65535;
			c = Math.floor(v / 65536);
			t3 = v - c * 65536;
			v = t4 + c + 65535;
			c = Math.floor(v / 65536);
			t4 = v - c * 65536;
			v = t5 + c + 65535;
			c = Math.floor(v / 65536);
			t5 = v - c * 65536;
			v = t6 + c + 65535;
			c = Math.floor(v / 65536);
			t6 = v - c * 65536;
			v = t7 + c + 65535;
			c = Math.floor(v / 65536);
			t7 = v - c * 65536;
			v = t8 + c + 65535;
			c = Math.floor(v / 65536);
			t8 = v - c * 65536;
			v = t9 + c + 65535;
			c = Math.floor(v / 65536);
			t9 = v - c * 65536;
			v = t10 + c + 65535;
			c = Math.floor(v / 65536);
			t10 = v - c * 65536;
			v = t11 + c + 65535;
			c = Math.floor(v / 65536);
			t11 = v - c * 65536;
			v = t12 + c + 65535;
			c = Math.floor(v / 65536);
			t12 = v - c * 65536;
			v = t13 + c + 65535;
			c = Math.floor(v / 65536);
			t13 = v - c * 65536;
			v = t14 + c + 65535;
			c = Math.floor(v / 65536);
			t14 = v - c * 65536;
			v = t15 + c + 65535;
			c = Math.floor(v / 65536);
			t15 = v - c * 65536;
			t0 += c - 1 + 37 * (c - 1);
			o[0] = t0;
			o[1] = t1;
			o[2] = t2;
			o[3] = t3;
			o[4] = t4;
			o[5] = t5;
			o[6] = t6;
			o[7] = t7;
			o[8] = t8;
			o[9] = t9;
			o[10] = t10;
			o[11] = t11;
			o[12] = t12;
			o[13] = t13;
			o[14] = t14;
			o[15] = t15;
		}
		function S(o, a) {
			M(o, a, a);
		}
		function inv25519(o, i) {
			var c = gf();
			var a = 0;
			for (; a < 16; a++) c[a] = i[a];
			for (a = 253; a >= 0; a--) {
				S(c, c);
				if (a !== 2 && a !== 4) M(c, c, i);
			}
			for (a = 0; a < 16; a++) o[a] = c[a];
		}
		function pow2523(o, i) {
			var c = gf();
			var a = 0;
			for (; a < 16; a++) c[a] = i[a];
			for (a = 250; a >= 0; a--) {
				S(c, c);
				if (a !== 1) M(c, c, i);
			}
			for (a = 0; a < 16; a++) o[a] = c[a];
		}
		function crypto_scalarmult(q, n, p) {
			var z = /* @__PURE__ */ new Uint8Array(32);
			var x = /* @__PURE__ */ new Float64Array(80), r, i;
			var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf();
			for (i = 0; i < 31; i++) z[i] = n[i];
			z[31] = n[31] & 127 | 64;
			z[0] &= 248;
			unpack25519(x, p);
			for (i = 0; i < 16; i++) {
				b[i] = x[i];
				d[i] = a[i] = c[i] = 0;
			}
			a[0] = d[0] = 1;
			for (i = 254; i >= 0; --i) {
				r = z[i >>> 3] >>> (i & 7) & 1;
				sel25519(a, b, r);
				sel25519(c, d, r);
				A(e, a, c);
				Z(a, a, c);
				A(c, b, d);
				Z(b, b, d);
				S(d, e);
				S(f, a);
				M(a, c, a);
				M(c, b, e);
				A(e, a, c);
				Z(a, a, c);
				S(b, a);
				Z(c, d, f);
				M(a, c, _121665);
				A(a, a, d);
				M(c, c, a);
				M(a, d, f);
				M(d, b, x);
				S(b, e);
				sel25519(a, b, r);
				sel25519(c, d, r);
			}
			for (i = 0; i < 16; i++) {
				x[i + 16] = a[i];
				x[i + 32] = c[i];
				x[i + 48] = b[i];
				x[i + 64] = d[i];
			}
			var x32 = x.subarray(32);
			var x16 = x.subarray(16);
			inv25519(x32, x32);
			M(x16, x16, x32);
			pack25519(q, x16);
			return 0;
		}
		function crypto_scalarmult_base(q, n) {
			return crypto_scalarmult(q, n, _9);
		}
		function crypto_box_keypair(y, x) {
			randombytes(x, 32);
			return crypto_scalarmult_base(y, x);
		}
		function crypto_box_beforenm(k, y, x) {
			var s = /* @__PURE__ */ new Uint8Array(32);
			crypto_scalarmult(s, x, y);
			return crypto_core_hsalsa20(k, _0, s, sigma);
		}
		var crypto_box_afternm = crypto_secretbox;
		var crypto_box_open_afternm = crypto_secretbox_open;
		function crypto_box(c, m, d, n, y, x) {
			var k = /* @__PURE__ */ new Uint8Array(32);
			crypto_box_beforenm(k, y, x);
			return crypto_box_afternm(c, m, d, n, k);
		}
		function crypto_box_open(m, c, d, n, y, x) {
			var k = /* @__PURE__ */ new Uint8Array(32);
			crypto_box_beforenm(k, y, x);
			return crypto_box_open_afternm(m, c, d, n, k);
		}
		var K = [
			1116352408,
			3609767458,
			1899447441,
			602891725,
			3049323471,
			3964484399,
			3921009573,
			2173295548,
			961987163,
			4081628472,
			1508970993,
			3053834265,
			2453635748,
			2937671579,
			2870763221,
			3664609560,
			3624381080,
			2734883394,
			310598401,
			1164996542,
			607225278,
			1323610764,
			1426881987,
			3590304994,
			1925078388,
			4068182383,
			2162078206,
			991336113,
			2614888103,
			633803317,
			3248222580,
			3479774868,
			3835390401,
			2666613458,
			4022224774,
			944711139,
			264347078,
			2341262773,
			604807628,
			2007800933,
			770255983,
			1495990901,
			1249150122,
			1856431235,
			1555081692,
			3175218132,
			1996064986,
			2198950837,
			2554220882,
			3999719339,
			2821834349,
			766784016,
			2952996808,
			2566594879,
			3210313671,
			3203337956,
			3336571891,
			1034457026,
			3584528711,
			2466948901,
			113926993,
			3758326383,
			338241895,
			168717936,
			666307205,
			1188179964,
			773529912,
			1546045734,
			1294757372,
			1522805485,
			1396182291,
			2643833823,
			1695183700,
			2343527390,
			1986661051,
			1014477480,
			2177026350,
			1206759142,
			2456956037,
			344077627,
			2730485921,
			1290863460,
			2820302411,
			3158454273,
			3259730800,
			3505952657,
			3345764771,
			106217008,
			3516065817,
			3606008344,
			3600352804,
			1432725776,
			4094571909,
			1467031594,
			275423344,
			851169720,
			430227734,
			3100823752,
			506948616,
			1363258195,
			659060556,
			3750685593,
			883997877,
			3785050280,
			958139571,
			3318307427,
			1322822218,
			3812723403,
			1537002063,
			2003034995,
			1747873779,
			3602036899,
			1955562222,
			1575990012,
			2024104815,
			1125592928,
			2227730452,
			2716904306,
			2361852424,
			442776044,
			2428436474,
			593698344,
			2756734187,
			3733110249,
			3204031479,
			2999351573,
			3329325298,
			3815920427,
			3391569614,
			3928383900,
			3515267271,
			566280711,
			3940187606,
			3454069534,
			4118630271,
			4000239992,
			116418474,
			1914138554,
			174292421,
			2731055270,
			289380356,
			3203993006,
			460393269,
			320620315,
			685471733,
			587496836,
			852142971,
			1086792851,
			1017036298,
			365543100,
			1126000580,
			2618297676,
			1288033470,
			3409855158,
			1501505948,
			4234509866,
			1607167915,
			987167468,
			1816402316,
			1246189591
		];
		function crypto_hashblocks_hl(hh, hl, m, n) {
			var wh = /* @__PURE__ */ new Int32Array(16), wl = /* @__PURE__ */ new Int32Array(16), bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7, bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7, th, tl, i, j, h, l, a, b, c, d;
			var ah0 = hh[0], ah1 = hh[1], ah2 = hh[2], ah3 = hh[3], ah4 = hh[4], ah5 = hh[5], ah6 = hh[6], ah7 = hh[7], al0 = hl[0], al1 = hl[1], al2 = hl[2], al3 = hl[3], al4 = hl[4], al5 = hl[5], al6 = hl[6], al7 = hl[7];
			var pos = 0;
			while (n >= 128) {
				for (i = 0; i < 16; i++) {
					j = 8 * i + pos;
					wh[i] = m[j + 0] << 24 | m[j + 1] << 16 | m[j + 2] << 8 | m[j + 3];
					wl[i] = m[j + 4] << 24 | m[j + 5] << 16 | m[j + 6] << 8 | m[j + 7];
				}
				for (i = 0; i < 80; i++) {
					bh0 = ah0;
					bh1 = ah1;
					bh2 = ah2;
					bh3 = ah3;
					bh4 = ah4;
					bh5 = ah5;
					bh6 = ah6;
					bh7 = ah7;
					bl0 = al0;
					bl1 = al1;
					bl2 = al2;
					bl3 = al3;
					bl4 = al4;
					bl5 = al5;
					bl6 = al6;
					bl7 = al7;
					h = ah7;
					l = al7;
					a = l & 65535;
					b = l >>> 16;
					c = h & 65535;
					d = h >>> 16;
					h = (ah4 >>> 14 | al4 << 18) ^ (ah4 >>> 18 | al4 << 14) ^ (al4 >>> 9 | ah4 << 23);
					l = (al4 >>> 14 | ah4 << 18) ^ (al4 >>> 18 | ah4 << 14) ^ (ah4 >>> 9 | al4 << 23);
					a += l & 65535;
					b += l >>> 16;
					c += h & 65535;
					d += h >>> 16;
					h = ah4 & ah5 ^ ~ah4 & ah6;
					l = al4 & al5 ^ ~al4 & al6;
					a += l & 65535;
					b += l >>> 16;
					c += h & 65535;
					d += h >>> 16;
					h = K[i * 2];
					l = K[i * 2 + 1];
					a += l & 65535;
					b += l >>> 16;
					c += h & 65535;
					d += h >>> 16;
					h = wh[i % 16];
					l = wl[i % 16];
					a += l & 65535;
					b += l >>> 16;
					c += h & 65535;
					d += h >>> 16;
					b += a >>> 16;
					c += b >>> 16;
					d += c >>> 16;
					th = c & 65535 | d << 16;
					tl = a & 65535 | b << 16;
					h = th;
					l = tl;
					a = l & 65535;
					b = l >>> 16;
					c = h & 65535;
					d = h >>> 16;
					h = (ah0 >>> 28 | al0 << 4) ^ (al0 >>> 2 | ah0 << 30) ^ (al0 >>> 7 | ah0 << 25);
					l = (al0 >>> 28 | ah0 << 4) ^ (ah0 >>> 2 | al0 << 30) ^ (ah0 >>> 7 | al0 << 25);
					a += l & 65535;
					b += l >>> 16;
					c += h & 65535;
					d += h >>> 16;
					h = ah0 & ah1 ^ ah0 & ah2 ^ ah1 & ah2;
					l = al0 & al1 ^ al0 & al2 ^ al1 & al2;
					a += l & 65535;
					b += l >>> 16;
					c += h & 65535;
					d += h >>> 16;
					b += a >>> 16;
					c += b >>> 16;
					d += c >>> 16;
					bh7 = c & 65535 | d << 16;
					bl7 = a & 65535 | b << 16;
					h = bh3;
					l = bl3;
					a = l & 65535;
					b = l >>> 16;
					c = h & 65535;
					d = h >>> 16;
					h = th;
					l = tl;
					a += l & 65535;
					b += l >>> 16;
					c += h & 65535;
					d += h >>> 16;
					b += a >>> 16;
					c += b >>> 16;
					d += c >>> 16;
					bh3 = c & 65535 | d << 16;
					bl3 = a & 65535 | b << 16;
					ah1 = bh0;
					ah2 = bh1;
					ah3 = bh2;
					ah4 = bh3;
					ah5 = bh4;
					ah6 = bh5;
					ah7 = bh6;
					ah0 = bh7;
					al1 = bl0;
					al2 = bl1;
					al3 = bl2;
					al4 = bl3;
					al5 = bl4;
					al6 = bl5;
					al7 = bl6;
					al0 = bl7;
					if (i % 16 === 15) for (j = 0; j < 16; j++) {
						h = wh[j];
						l = wl[j];
						a = l & 65535;
						b = l >>> 16;
						c = h & 65535;
						d = h >>> 16;
						h = wh[(j + 9) % 16];
						l = wl[(j + 9) % 16];
						a += l & 65535;
						b += l >>> 16;
						c += h & 65535;
						d += h >>> 16;
						th = wh[(j + 1) % 16];
						tl = wl[(j + 1) % 16];
						h = (th >>> 1 | tl << 31) ^ (th >>> 8 | tl << 24) ^ th >>> 7;
						l = (tl >>> 1 | th << 31) ^ (tl >>> 8 | th << 24) ^ (tl >>> 7 | th << 25);
						a += l & 65535;
						b += l >>> 16;
						c += h & 65535;
						d += h >>> 16;
						th = wh[(j + 14) % 16];
						tl = wl[(j + 14) % 16];
						h = (th >>> 19 | tl << 13) ^ (tl >>> 29 | th << 3) ^ th >>> 6;
						l = (tl >>> 19 | th << 13) ^ (th >>> 29 | tl << 3) ^ (tl >>> 6 | th << 26);
						a += l & 65535;
						b += l >>> 16;
						c += h & 65535;
						d += h >>> 16;
						b += a >>> 16;
						c += b >>> 16;
						d += c >>> 16;
						wh[j] = c & 65535 | d << 16;
						wl[j] = a & 65535 | b << 16;
					}
				}
				h = ah0;
				l = al0;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[0];
				l = hl[0];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[0] = ah0 = c & 65535 | d << 16;
				hl[0] = al0 = a & 65535 | b << 16;
				h = ah1;
				l = al1;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[1];
				l = hl[1];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[1] = ah1 = c & 65535 | d << 16;
				hl[1] = al1 = a & 65535 | b << 16;
				h = ah2;
				l = al2;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[2];
				l = hl[2];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[2] = ah2 = c & 65535 | d << 16;
				hl[2] = al2 = a & 65535 | b << 16;
				h = ah3;
				l = al3;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[3];
				l = hl[3];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[3] = ah3 = c & 65535 | d << 16;
				hl[3] = al3 = a & 65535 | b << 16;
				h = ah4;
				l = al4;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[4];
				l = hl[4];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[4] = ah4 = c & 65535 | d << 16;
				hl[4] = al4 = a & 65535 | b << 16;
				h = ah5;
				l = al5;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[5];
				l = hl[5];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[5] = ah5 = c & 65535 | d << 16;
				hl[5] = al5 = a & 65535 | b << 16;
				h = ah6;
				l = al6;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[6];
				l = hl[6];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[6] = ah6 = c & 65535 | d << 16;
				hl[6] = al6 = a & 65535 | b << 16;
				h = ah7;
				l = al7;
				a = l & 65535;
				b = l >>> 16;
				c = h & 65535;
				d = h >>> 16;
				h = hh[7];
				l = hl[7];
				a += l & 65535;
				b += l >>> 16;
				c += h & 65535;
				d += h >>> 16;
				b += a >>> 16;
				c += b >>> 16;
				d += c >>> 16;
				hh[7] = ah7 = c & 65535 | d << 16;
				hl[7] = al7 = a & 65535 | b << 16;
				pos += 128;
				n -= 128;
			}
			return n;
		}
		function crypto_hash(out, m, n) {
			var hh = /* @__PURE__ */ new Int32Array(8), hl = /* @__PURE__ */ new Int32Array(8), x = /* @__PURE__ */ new Uint8Array(256), i, b = n;
			hh[0] = 1779033703;
			hh[1] = 3144134277;
			hh[2] = 1013904242;
			hh[3] = 2773480762;
			hh[4] = 1359893119;
			hh[5] = 2600822924;
			hh[6] = 528734635;
			hh[7] = 1541459225;
			hl[0] = 4089235720;
			hl[1] = 2227873595;
			hl[2] = 4271175723;
			hl[3] = 1595750129;
			hl[4] = 2917565137;
			hl[5] = 725511199;
			hl[6] = 4215389547;
			hl[7] = 327033209;
			crypto_hashblocks_hl(hh, hl, m, n);
			n %= 128;
			for (i = 0; i < n; i++) x[i] = m[b - n + i];
			x[n] = 128;
			n = 256 - 128 * (n < 112 ? 1 : 0);
			x[n - 9] = 0;
			ts64(x, n - 8, b / 536870912 | 0, b << 3);
			crypto_hashblocks_hl(hh, hl, x, n);
			for (i = 0; i < 8; i++) ts64(out, 8 * i, hh[i], hl[i]);
			return 0;
		}
		function add(p, q) {
			var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf(), g = gf(), h = gf(), t = gf();
			Z(a, p[1], p[0]);
			Z(t, q[1], q[0]);
			M(a, a, t);
			A(b, p[0], p[1]);
			A(t, q[0], q[1]);
			M(b, b, t);
			M(c, p[3], q[3]);
			M(c, c, D2);
			M(d, p[2], q[2]);
			A(d, d, d);
			Z(e, b, a);
			Z(f, d, c);
			A(g, d, c);
			A(h, b, a);
			M(p[0], e, f);
			M(p[1], h, g);
			M(p[2], g, f);
			M(p[3], e, h);
		}
		function cswap(p, q, b) {
			var i = 0;
			for (; i < 4; i++) sel25519(p[i], q[i], b);
		}
		function pack(r, p) {
			var tx = gf(), ty = gf(), zi = gf();
			inv25519(zi, p[2]);
			M(tx, p[0], zi);
			M(ty, p[1], zi);
			pack25519(r, ty);
			r[31] ^= par25519(tx) << 7;
		}
		function scalarmult(p, q, s) {
			var b, i;
			set25519(p[0], gf0);
			set25519(p[1], gf1);
			set25519(p[2], gf1);
			set25519(p[3], gf0);
			for (i = 255; i >= 0; --i) {
				b = s[i / 8 | 0] >> (i & 7) & 1;
				cswap(p, q, b);
				add(q, p);
				add(p, p);
				cswap(p, q, b);
			}
		}
		function scalarbase(p, s) {
			var q = [
				gf(),
				gf(),
				gf(),
				gf()
			];
			set25519(q[0], X);
			set25519(q[1], Y);
			set25519(q[2], gf1);
			M(q[3], X, Y);
			scalarmult(p, q, s);
		}
		function crypto_sign_keypair(pk, sk, seeded) {
			var d = /* @__PURE__ */ new Uint8Array(64);
			var p = [
				gf(),
				gf(),
				gf(),
				gf()
			];
			var i;
			if (!seeded) randombytes(sk, 32);
			crypto_hash(d, sk, 32);
			d[0] &= 248;
			d[31] &= 127;
			d[31] |= 64;
			scalarbase(p, d);
			pack(pk, p);
			for (i = 0; i < 32; i++) sk[i + 32] = pk[i];
			return 0;
		}
		var L = new Float64Array([
			237,
			211,
			245,
			92,
			26,
			99,
			18,
			88,
			214,
			156,
			247,
			162,
			222,
			249,
			222,
			20,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			16
		]);
		function modL(r, x) {
			var carry, i = 63, j, k;
			for (; i >= 32; --i) {
				carry = 0;
				for (j = i - 32, k = i - 12; j < k; ++j) {
					x[j] += carry - 16 * x[i] * L[j - (i - 32)];
					carry = Math.floor((x[j] + 128) / 256);
					x[j] -= carry * 256;
				}
				x[j] += carry;
				x[i] = 0;
			}
			carry = 0;
			for (j = 0; j < 32; j++) {
				x[j] += carry - (x[31] >> 4) * L[j];
				carry = x[j] >> 8;
				x[j] &= 255;
			}
			for (j = 0; j < 32; j++) x[j] -= carry * L[j];
			for (i = 0; i < 32; i++) {
				x[i + 1] += x[i] >> 8;
				r[i] = x[i] & 255;
			}
		}
		function reduce(r) {
			var x = /* @__PURE__ */ new Float64Array(64), i = 0;
			for (; i < 64; i++) x[i] = r[i];
			for (i = 0; i < 64; i++) r[i] = 0;
			modL(r, x);
		}
		function crypto_sign(sm, m, n, sk) {
			var d = /* @__PURE__ */ new Uint8Array(64), h = /* @__PURE__ */ new Uint8Array(64), r = /* @__PURE__ */ new Uint8Array(64);
			var i, j, x = /* @__PURE__ */ new Float64Array(64);
			var p = [
				gf(),
				gf(),
				gf(),
				gf()
			];
			crypto_hash(d, sk, 32);
			d[0] &= 248;
			d[31] &= 127;
			d[31] |= 64;
			var smlen = n + 64;
			for (i = 0; i < n; i++) sm[64 + i] = m[i];
			for (i = 0; i < 32; i++) sm[32 + i] = d[32 + i];
			crypto_hash(r, sm.subarray(32), n + 32);
			reduce(r);
			scalarbase(p, r);
			pack(sm, p);
			for (i = 32; i < 64; i++) sm[i] = sk[i];
			crypto_hash(h, sm, n + 64);
			reduce(h);
			for (i = 0; i < 64; i++) x[i] = 0;
			for (i = 0; i < 32; i++) x[i] = r[i];
			for (i = 0; i < 32; i++) for (j = 0; j < 32; j++) x[i + j] += h[i] * d[j];
			modL(sm.subarray(32), x);
			return smlen;
		}
		function unpackneg(r, p) {
			var t = gf(), chk = gf(), num = gf(), den = gf(), den2 = gf(), den4 = gf(), den6 = gf();
			set25519(r[2], gf1);
			unpack25519(r[1], p);
			S(num, r[1]);
			M(den, num, D);
			Z(num, num, r[2]);
			A(den, r[2], den);
			S(den2, den);
			S(den4, den2);
			M(den6, den4, den2);
			M(t, den6, num);
			M(t, t, den);
			pow2523(t, t);
			M(t, t, num);
			M(t, t, den);
			M(t, t, den);
			M(r[0], t, den);
			S(chk, r[0]);
			M(chk, chk, den);
			if (neq25519(chk, num)) M(r[0], r[0], I);
			S(chk, r[0]);
			M(chk, chk, den);
			if (neq25519(chk, num)) return -1;
			if (par25519(r[0]) === p[31] >> 7) Z(r[0], gf0, r[0]);
			M(r[3], r[0], r[1]);
			return 0;
		}
		function crypto_sign_open(m, sm, n, pk) {
			var i;
			var t = /* @__PURE__ */ new Uint8Array(32), h = /* @__PURE__ */ new Uint8Array(64);
			var p = [
				gf(),
				gf(),
				gf(),
				gf()
			], q = [
				gf(),
				gf(),
				gf(),
				gf()
			];
			if (n < 64) return -1;
			if (unpackneg(q, pk)) return -1;
			for (i = 0; i < n; i++) m[i] = sm[i];
			for (i = 0; i < 32; i++) m[i + 32] = pk[i];
			crypto_hash(h, m, n);
			reduce(h);
			scalarmult(p, q, h);
			scalarbase(q, sm.subarray(32));
			add(p, q);
			pack(t, p);
			n -= 64;
			if (crypto_verify_32(sm, 0, t, 0)) {
				for (i = 0; i < n; i++) m[i] = 0;
				return -1;
			}
			for (i = 0; i < n; i++) m[i] = sm[i + 64];
			return n;
		}
		var crypto_secretbox_KEYBYTES = 32, crypto_secretbox_NONCEBYTES = 24, crypto_secretbox_ZEROBYTES = 32, crypto_secretbox_BOXZEROBYTES = 16, crypto_scalarmult_BYTES = 32, crypto_scalarmult_SCALARBYTES = 32, crypto_box_PUBLICKEYBYTES = 32, crypto_box_SECRETKEYBYTES = 32, crypto_box_BEFORENMBYTES = 32, crypto_box_NONCEBYTES = crypto_secretbox_NONCEBYTES, crypto_box_ZEROBYTES = crypto_secretbox_ZEROBYTES, crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES, crypto_sign_BYTES = 64, crypto_sign_PUBLICKEYBYTES = 32, crypto_sign_SECRETKEYBYTES = 64, crypto_sign_SEEDBYTES = 32, crypto_hash_BYTES = 64;
		nacl.lowlevel = {
			crypto_core_hsalsa20,
			crypto_stream_xor,
			crypto_stream,
			crypto_stream_salsa20_xor,
			crypto_stream_salsa20,
			crypto_onetimeauth,
			crypto_onetimeauth_verify,
			crypto_verify_16,
			crypto_verify_32,
			crypto_secretbox,
			crypto_secretbox_open,
			crypto_scalarmult,
			crypto_scalarmult_base,
			crypto_box_beforenm,
			crypto_box_afternm,
			crypto_box,
			crypto_box_open,
			crypto_box_keypair,
			crypto_hash,
			crypto_sign,
			crypto_sign_keypair,
			crypto_sign_open,
			crypto_secretbox_KEYBYTES,
			crypto_secretbox_NONCEBYTES,
			crypto_secretbox_ZEROBYTES,
			crypto_secretbox_BOXZEROBYTES,
			crypto_scalarmult_BYTES,
			crypto_scalarmult_SCALARBYTES,
			crypto_box_PUBLICKEYBYTES,
			crypto_box_SECRETKEYBYTES,
			crypto_box_BEFORENMBYTES,
			crypto_box_NONCEBYTES,
			crypto_box_ZEROBYTES,
			crypto_box_BOXZEROBYTES,
			crypto_sign_BYTES,
			crypto_sign_PUBLICKEYBYTES,
			crypto_sign_SECRETKEYBYTES,
			crypto_sign_SEEDBYTES,
			crypto_hash_BYTES,
			gf,
			D,
			L,
			pack25519,
			unpack25519,
			M,
			A,
			S,
			Z,
			pow2523,
			add,
			set25519,
			modL,
			scalarmult,
			scalarbase
		};
		function checkLengths(k, n) {
			if (k.length !== crypto_secretbox_KEYBYTES) throw new Error("bad key size");
			if (n.length !== crypto_secretbox_NONCEBYTES) throw new Error("bad nonce size");
		}
		function checkBoxLengths(pk, sk) {
			if (pk.length !== crypto_box_PUBLICKEYBYTES) throw new Error("bad public key size");
			if (sk.length !== crypto_box_SECRETKEYBYTES) throw new Error("bad secret key size");
		}
		function checkArrayTypes() {
			for (var i = 0; i < arguments.length; i++) if (!(arguments[i] instanceof Uint8Array)) throw new TypeError("unexpected type, use Uint8Array");
		}
		function cleanup(arr) {
			for (var i = 0; i < arr.length; i++) arr[i] = 0;
		}
		nacl.randomBytes = function(n) {
			var b = new Uint8Array(n);
			randombytes(b, n);
			return b;
		};
		nacl.secretbox = function(msg, nonce, key) {
			checkArrayTypes(msg, nonce, key);
			checkLengths(key, nonce);
			var m = new Uint8Array(crypto_secretbox_ZEROBYTES + msg.length);
			var c = new Uint8Array(m.length);
			for (var i = 0; i < msg.length; i++) m[i + crypto_secretbox_ZEROBYTES] = msg[i];
			crypto_secretbox(c, m, m.length, nonce, key);
			return c.subarray(crypto_secretbox_BOXZEROBYTES);
		};
		nacl.secretbox.open = function(box, nonce, key) {
			checkArrayTypes(box, nonce, key);
			checkLengths(key, nonce);
			var c = new Uint8Array(crypto_secretbox_BOXZEROBYTES + box.length);
			var m = new Uint8Array(c.length);
			for (var i = 0; i < box.length; i++) c[i + crypto_secretbox_BOXZEROBYTES] = box[i];
			if (c.length < 32) return null;
			if (crypto_secretbox_open(m, c, c.length, nonce, key) !== 0) return null;
			return m.subarray(crypto_secretbox_ZEROBYTES);
		};
		nacl.secretbox.keyLength = crypto_secretbox_KEYBYTES;
		nacl.secretbox.nonceLength = crypto_secretbox_NONCEBYTES;
		nacl.secretbox.overheadLength = crypto_secretbox_BOXZEROBYTES;
		nacl.scalarMult = function(n, p) {
			checkArrayTypes(n, p);
			if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error("bad n size");
			if (p.length !== crypto_scalarmult_BYTES) throw new Error("bad p size");
			var q = new Uint8Array(crypto_scalarmult_BYTES);
			crypto_scalarmult(q, n, p);
			return q;
		};
		nacl.scalarMult.base = function(n) {
			checkArrayTypes(n);
			if (n.length !== crypto_scalarmult_SCALARBYTES) throw new Error("bad n size");
			var q = new Uint8Array(crypto_scalarmult_BYTES);
			crypto_scalarmult_base(q, n);
			return q;
		};
		nacl.scalarMult.scalarLength = crypto_scalarmult_SCALARBYTES;
		nacl.scalarMult.groupElementLength = crypto_scalarmult_BYTES;
		nacl.box = function(msg, nonce, publicKey, secretKey) {
			var k = nacl.box.before(publicKey, secretKey);
			return nacl.secretbox(msg, nonce, k);
		};
		nacl.box.before = function(publicKey, secretKey) {
			checkArrayTypes(publicKey, secretKey);
			checkBoxLengths(publicKey, secretKey);
			var k = new Uint8Array(crypto_box_BEFORENMBYTES);
			crypto_box_beforenm(k, publicKey, secretKey);
			return k;
		};
		nacl.box.after = nacl.secretbox;
		nacl.box.open = function(msg, nonce, publicKey, secretKey) {
			var k = nacl.box.before(publicKey, secretKey);
			return nacl.secretbox.open(msg, nonce, k);
		};
		nacl.box.open.after = nacl.secretbox.open;
		nacl.box.keyPair = function() {
			var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
			var sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
			crypto_box_keypair(pk, sk);
			return {
				publicKey: pk,
				secretKey: sk
			};
		};
		nacl.box.keyPair.fromSecretKey = function(secretKey) {
			checkArrayTypes(secretKey);
			if (secretKey.length !== crypto_box_SECRETKEYBYTES) throw new Error("bad secret key size");
			var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
			crypto_scalarmult_base(pk, secretKey);
			return {
				publicKey: pk,
				secretKey: new Uint8Array(secretKey)
			};
		};
		nacl.box.publicKeyLength = crypto_box_PUBLICKEYBYTES;
		nacl.box.secretKeyLength = crypto_box_SECRETKEYBYTES;
		nacl.box.sharedKeyLength = crypto_box_BEFORENMBYTES;
		nacl.box.nonceLength = crypto_box_NONCEBYTES;
		nacl.box.overheadLength = nacl.secretbox.overheadLength;
		nacl.sign = function(msg, secretKey) {
			checkArrayTypes(msg, secretKey);
			if (secretKey.length !== crypto_sign_SECRETKEYBYTES) throw new Error("bad secret key size");
			var signedMsg = new Uint8Array(crypto_sign_BYTES + msg.length);
			crypto_sign(signedMsg, msg, msg.length, secretKey);
			return signedMsg;
		};
		nacl.sign.open = function(signedMsg, publicKey) {
			checkArrayTypes(signedMsg, publicKey);
			if (publicKey.length !== crypto_sign_PUBLICKEYBYTES) throw new Error("bad public key size");
			var tmp = new Uint8Array(signedMsg.length);
			var mlen = crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
			if (mlen < 0) return null;
			var m = new Uint8Array(mlen);
			for (var i = 0; i < m.length; i++) m[i] = tmp[i];
			return m;
		};
		nacl.sign.detached = function(msg, secretKey) {
			var signedMsg = nacl.sign(msg, secretKey);
			var sig = new Uint8Array(crypto_sign_BYTES);
			for (var i = 0; i < sig.length; i++) sig[i] = signedMsg[i];
			return sig;
		};
		nacl.sign.detached.verify = function(msg, sig, publicKey) {
			checkArrayTypes(msg, sig, publicKey);
			if (sig.length !== crypto_sign_BYTES) throw new Error("bad signature size");
			if (publicKey.length !== crypto_sign_PUBLICKEYBYTES) throw new Error("bad public key size");
			var sm = new Uint8Array(crypto_sign_BYTES + msg.length);
			var m = new Uint8Array(crypto_sign_BYTES + msg.length);
			var i = 0;
			for (; i < crypto_sign_BYTES; i++) sm[i] = sig[i];
			for (i = 0; i < msg.length; i++) sm[i + crypto_sign_BYTES] = msg[i];
			return crypto_sign_open(m, sm, sm.length, publicKey) >= 0;
		};
		nacl.sign.keyPair = function() {
			var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
			var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
			crypto_sign_keypair(pk, sk);
			return {
				publicKey: pk,
				secretKey: sk
			};
		};
		nacl.sign.keyPair.fromSecretKey = function(secretKey) {
			checkArrayTypes(secretKey);
			if (secretKey.length !== crypto_sign_SECRETKEYBYTES) throw new Error("bad secret key size");
			var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
			for (var i = 0; i < pk.length; i++) pk[i] = secretKey[32 + i];
			return {
				publicKey: pk,
				secretKey: new Uint8Array(secretKey)
			};
		};
		nacl.sign.keyPair.fromSeed = function(seed) {
			checkArrayTypes(seed);
			if (seed.length !== crypto_sign_SEEDBYTES) throw new Error("bad seed size");
			var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
			var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
			for (var i = 0; i < 32; i++) sk[i] = seed[i];
			crypto_sign_keypair(pk, sk, true);
			return {
				publicKey: pk,
				secretKey: sk
			};
		};
		nacl.sign.publicKeyLength = crypto_sign_PUBLICKEYBYTES;
		nacl.sign.secretKeyLength = crypto_sign_SECRETKEYBYTES;
		nacl.sign.seedLength = crypto_sign_SEEDBYTES;
		nacl.sign.signatureLength = crypto_sign_BYTES;
		nacl.hash = function(msg) {
			checkArrayTypes(msg);
			var h = new Uint8Array(crypto_hash_BYTES);
			crypto_hash(h, msg, msg.length);
			return h;
		};
		nacl.hash.hashLength = crypto_hash_BYTES;
		nacl.verify = function(x, y) {
			checkArrayTypes(x, y);
			if (x.length === 0 || y.length === 0) return false;
			if (x.length !== y.length) return false;
			return vn(x, 0, y, 0, x.length) === 0 ? true : false;
		};
		nacl.setPRNG = function(fn) {
			randombytes = fn;
		};
		(function() {
			var crypto = typeof self !== "undefined" ? self.crypto || self.msCrypto : null;
			if (crypto && crypto.getRandomValues) {
				var QUOTA = 65536;
				nacl.setPRNG(function(x, n) {
					var i, v = new Uint8Array(n);
					for (i = 0; i < n; i += QUOTA) crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
					for (i = 0; i < n; i++) x[i] = v[i];
					cleanup(v);
				});
			} else if (typeof __require !== "undefined") {
				crypto = __require("crypto");
				if (crypto && crypto.randomBytes) nacl.setPRNG(function(x, n) {
					var i, v = crypto.randomBytes(n);
					for (i = 0; i < n; i++) x[i] = v[i];
					cleanup(v);
				});
			}
		})();
	})(typeof module !== "undefined" && module.exports ? module.exports : self.nacl = self.nacl || {});
}));
//#endregion
//#region node_modules/tweetnacl-util/nacl-util.js
var require_nacl_util = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, f) {
		"use strict";
		if (typeof module !== "undefined" && module.exports) module.exports = f();
		else if (root.nacl) root.nacl.util = f();
		else {
			root.nacl = {};
			root.nacl.util = f();
		}
	})(exports, function() {
		"use strict";
		var util = {};
		function validateBase64(s) {
			if (!/^(?:[A-Za-z0-9+\/]{2}[A-Za-z0-9+\/]{2})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/.test(s)) throw new TypeError("invalid encoding");
		}
		util.decodeUTF8 = function(s) {
			if (typeof s !== "string") throw new TypeError("expected string");
			var i, d = unescape(encodeURIComponent(s)), b = new Uint8Array(d.length);
			for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
			return b;
		};
		util.encodeUTF8 = function(arr) {
			var i, s = [];
			for (i = 0; i < arr.length; i++) s.push(String.fromCharCode(arr[i]));
			return decodeURIComponent(escape(s.join("")));
		};
		if (typeof atob === "undefined") {
			if (typeof Buffer.from !== "undefined") {
				util.encodeBase64 = function(arr) {
					return Buffer.from(arr).toString("base64");
				};
				util.decodeBase64 = function(s) {
					validateBase64(s);
					return new Uint8Array(Array.prototype.slice.call(Buffer.from(s, "base64"), 0));
				};
			} else {
				util.encodeBase64 = function(arr) {
					return new Buffer(arr).toString("base64");
				};
				util.decodeBase64 = function(s) {
					validateBase64(s);
					return new Uint8Array(Array.prototype.slice.call(new Buffer(s, "base64"), 0));
				};
			}
		} else {
			util.encodeBase64 = function(arr) {
				var i, s = [], len = arr.length;
				for (i = 0; i < len; i++) s.push(String.fromCharCode(arr[i]));
				return btoa(s.join(""));
			};
			util.decodeBase64 = function(s) {
				validateBase64(s);
				var i, d = atob(s), b = new Uint8Array(d.length);
				for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
				return b;
			};
		}
		return util;
	});
}));
//#endregion
//#region node_modules/@metamask/eth-sig-util/dist/encryption.js
var require_encryption = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = exports && exports.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getEncryptionPublicKey = exports.decryptSafely = exports.decrypt = exports.encryptSafely = exports.encrypt = void 0;
	var nacl = __importStar(require_nacl_fast());
	var naclUtil = __importStar(require_nacl_util());
	var utils_1 = require_utils();
	/**
	* Encrypt a message.
	*
	* @param options - The encryption options.
	* @param options.publicKey - The public key of the message recipient.
	* @param options.data - The message data.
	* @param options.version - The type of encryption to use.
	* @returns The encrypted data.
	*/
	function encrypt({ publicKey, data, version }) {
		if ((0, utils_1.isNullish)(publicKey)) throw new Error("Missing publicKey parameter");
		else if ((0, utils_1.isNullish)(data)) throw new Error("Missing data parameter");
		else if ((0, utils_1.isNullish)(version)) throw new Error("Missing version parameter");
		switch (version) {
			case "x25519-xsalsa20-poly1305": {
				if (typeof data !== "string") throw new Error("Message data must be given as a string");
				const ephemeralKeyPair = nacl.box.keyPair();
				let pubKeyUInt8Array;
				try {
					pubKeyUInt8Array = naclUtil.decodeBase64(publicKey);
				} catch (err) {
					throw new Error("Bad public key");
				}
				const msgParamsUInt8Array = naclUtil.decodeUTF8(data);
				const nonce = nacl.randomBytes(nacl.box.nonceLength);
				const encryptedMessage = nacl.box(msgParamsUInt8Array, nonce, pubKeyUInt8Array, ephemeralKeyPair.secretKey);
				return {
					version: "x25519-xsalsa20-poly1305",
					nonce: naclUtil.encodeBase64(nonce),
					ephemPublicKey: naclUtil.encodeBase64(ephemeralKeyPair.publicKey),
					ciphertext: naclUtil.encodeBase64(encryptedMessage)
				};
			}
			default: throw new Error("Encryption type/version not supported");
		}
	}
	exports.encrypt = encrypt;
	/**
	* Encrypt a message in a way that obscures the message length.
	*
	* The message is padded to a multiple of 2048 before being encrypted so that the length of the
	* resulting encrypted message can't be used to guess the exact length of the original message.
	*
	* @param options - The encryption options.
	* @param options.publicKey - The public key of the message recipient.
	* @param options.data - The message data.
	* @param options.version - The type of encryption to use.
	* @returns The encrypted data.
	*/
	function encryptSafely({ publicKey, data, version }) {
		if ((0, utils_1.isNullish)(publicKey)) throw new Error("Missing publicKey parameter");
		else if ((0, utils_1.isNullish)(data)) throw new Error("Missing data parameter");
		else if ((0, utils_1.isNullish)(version)) throw new Error("Missing version parameter");
		const DEFAULT_PADDING_LENGTH = 2048;
		const NACL_EXTRA_BYTES = 16;
		if (typeof data === "object" && data && "toJSON" in data) throw new Error("Cannot encrypt with toJSON property.  Please remove toJSON property");
		const dataWithPadding = {
			data,
			padding: ""
		};
		const modVal = Buffer.byteLength(JSON.stringify(dataWithPadding), "utf-8") % DEFAULT_PADDING_LENGTH;
		let padLength = 0;
		if (modVal > 0) padLength = DEFAULT_PADDING_LENGTH - modVal - NACL_EXTRA_BYTES;
		dataWithPadding.padding = "0".repeat(padLength);
		return encrypt({
			publicKey,
			data: JSON.stringify(dataWithPadding),
			version
		});
	}
	exports.encryptSafely = encryptSafely;
	/**
	* Decrypt a message.
	*
	* @param options - The decryption options.
	* @param options.encryptedData - The encrypted data.
	* @param options.privateKey - The private key to decrypt with.
	* @returns The decrypted message.
	*/
	function decrypt({ encryptedData, privateKey }) {
		if ((0, utils_1.isNullish)(encryptedData)) throw new Error("Missing encryptedData parameter");
		else if ((0, utils_1.isNullish)(privateKey)) throw new Error("Missing privateKey parameter");
		switch (encryptedData.version) {
			case "x25519-xsalsa20-poly1305": {
				const receiverPrivateKeyUint8Array = naclDecodeHex(privateKey);
				const receiverEncryptionPrivateKey = nacl.box.keyPair.fromSecretKey(receiverPrivateKeyUint8Array).secretKey;
				const nonce = naclUtil.decodeBase64(encryptedData.nonce);
				const ciphertext = naclUtil.decodeBase64(encryptedData.ciphertext);
				const ephemPublicKey = naclUtil.decodeBase64(encryptedData.ephemPublicKey);
				const decryptedMessage = nacl.box.open(ciphertext, nonce, ephemPublicKey, receiverEncryptionPrivateKey);
				try {
					if (!decryptedMessage) throw new Error();
					const output = naclUtil.encodeUTF8(decryptedMessage);
					if (!output) throw new Error();
					return output;
				} catch (err) {
					if (err && typeof err.message === "string" && err.message.length) throw new Error(`Decryption failed: ${err.message}`);
					throw new Error(`Decryption failed.`);
				}
			}
			default: throw new Error("Encryption type/version not supported.");
		}
	}
	exports.decrypt = decrypt;
	/**
	* Decrypt a message that has been encrypted using `encryptSafely`.
	*
	* @param options - The decryption options.
	* @param options.encryptedData - The encrypted data.
	* @param options.privateKey - The private key to decrypt with.
	* @returns The decrypted message.
	*/
	function decryptSafely({ encryptedData, privateKey }) {
		if ((0, utils_1.isNullish)(encryptedData)) throw new Error("Missing encryptedData parameter");
		else if ((0, utils_1.isNullish)(privateKey)) throw new Error("Missing privateKey parameter");
		return JSON.parse(decrypt({
			encryptedData,
			privateKey
		})).data;
	}
	exports.decryptSafely = decryptSafely;
	/**
	* Get the encryption public key for the given key.
	*
	* @param privateKey - The private key to generate the encryption public key with.
	* @returns The encryption public key.
	*/
	function getEncryptionPublicKey(privateKey) {
		const privateKeyUint8Array = naclDecodeHex(privateKey);
		const encryptionPublicKey = nacl.box.keyPair.fromSecretKey(privateKeyUint8Array).publicKey;
		return naclUtil.encodeBase64(encryptionPublicKey);
	}
	exports.getEncryptionPublicKey = getEncryptionPublicKey;
	/**
	* Convert a hex string to the UInt8Array format used by nacl.
	*
	* @param msgHex - The string to convert.
	* @returns The converted string.
	*/
	function naclDecodeHex(msgHex) {
		const msgBase64 = Buffer.from(msgHex, "hex").toString("base64");
		return naclUtil.decodeBase64(msgBase64);
	}
}));
//#endregion
//#region node_modules/@metamask/eth-sig-util/dist/index.js
var require_dist = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$1) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.normalize = exports.concatSig = void 0;
	__exportStar(require_personal_sign(), exports);
	__exportStar(require_sign_typed_data(), exports);
	__exportStar(require_encryption(), exports);
	var utils_1 = require_utils();
	Object.defineProperty(exports, "concatSig", {
		enumerable: true,
		get: function() {
			return utils_1.concatSig;
		}
	});
	Object.defineProperty(exports, "normalize", {
		enumerable: true,
		get: function() {
			return utils_1.normalize;
		}
	});
}));
//#endregion
export { require_dist as t };
