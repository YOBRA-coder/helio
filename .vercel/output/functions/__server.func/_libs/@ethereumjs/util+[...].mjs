import { i as __require, t as __commonJSMin } from "../../_runtime.mjs";
import { t as require_dist$1 } from "../ethereumjs__rlp.mjs";
//#region node_modules/@noble/curves/node_modules/@noble/hashes/_assert.js
var require__assert$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.output = exports.exists = exports.hash = exports.bytes = exports.bool = exports.number = exports.isBytes = void 0;
	function number(n) {
		if (!Number.isSafeInteger(n) || n < 0) throw new Error(`positive integer expected, not ${n}`);
	}
	exports.number = number;
	function bool(b) {
		if (typeof b !== "boolean") throw new Error(`boolean expected, not ${b}`);
	}
	exports.bool = bool;
	function isBytes(a) {
		return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
	}
	exports.isBytes = isBytes;
	function bytes(b, ...lengths) {
		if (!isBytes(b)) throw new Error("Uint8Array expected");
		if (lengths.length > 0 && !lengths.includes(b.length)) throw new Error(`Uint8Array expected of length ${lengths}, not of length=${b.length}`);
	}
	exports.bytes = bytes;
	function hash(h) {
		if (typeof h !== "function" || typeof h.create !== "function") throw new Error("Hash should be wrapped by utils.wrapConstructor");
		number(h.outputLen);
		number(h.blockLen);
	}
	exports.hash = hash;
	function exists(instance, checkFinished = true) {
		if (instance.destroyed) throw new Error("Hash instance has been destroyed");
		if (checkFinished && instance.finished) throw new Error("Hash#digest() has already been called");
	}
	exports.exists = exists;
	function output(out, instance) {
		bytes(out);
		const min = instance.outputLen;
		if (out.length < min) throw new Error(`digestInto() expects output buffer of length at least ${min}`);
	}
	exports.output = output;
	exports.default = {
		number,
		bool,
		bytes,
		hash,
		exists,
		output
	};
}));
//#endregion
//#region node_modules/@noble/curves/node_modules/@noble/hashes/cryptoNode.js
var require_cryptoNode$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.crypto = void 0;
	var nc$1 = __require("node:crypto");
	exports.crypto = nc$1 && typeof nc$1 === "object" && "webcrypto" in nc$1 ? nc$1.webcrypto : void 0;
}));
//#endregion
//#region node_modules/@noble/curves/node_modules/@noble/hashes/utils.js
var require_utils$3 = /* @__PURE__ */ __commonJSMin(((exports) => {
	/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.randomBytes = exports.wrapXOFConstructorWithOpts = exports.wrapConstructorWithOpts = exports.wrapConstructor = exports.checkOpts = exports.Hash = exports.concatBytes = exports.toBytes = exports.utf8ToBytes = exports.asyncLoop = exports.nextTick = exports.hexToBytes = exports.bytesToHex = exports.byteSwap32 = exports.byteSwapIfBE = exports.byteSwap = exports.isLE = exports.rotl = exports.rotr = exports.createView = exports.u32 = exports.u8 = exports.isBytes = void 0;
	var crypto_1 = require_cryptoNode$1();
	var _assert_js_1 = require__assert$1();
	function isBytes(a) {
		return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
	}
	exports.isBytes = isBytes;
	var u8 = (arr) => new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
	exports.u8 = u8;
	var u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
	exports.u32 = u32;
	var createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
	exports.createView = createView;
	var rotr = (word, shift) => word << 32 - shift | word >>> shift;
	exports.rotr = rotr;
	var rotl = (word, shift) => word << shift | word >>> 32 - shift >>> 0;
	exports.rotl = rotl;
	exports.isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
	var byteSwap = (word) => word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
	exports.byteSwap = byteSwap;
	exports.byteSwapIfBE = exports.isLE ? (n) => n : (n) => (0, exports.byteSwap)(n);
	function byteSwap32(arr) {
		for (let i = 0; i < arr.length; i++) arr[i] = (0, exports.byteSwap)(arr[i]);
	}
	exports.byteSwap32 = byteSwap32;
	var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
	/**
	* @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
	*/
	function bytesToHex(bytes) {
		(0, _assert_js_1.bytes)(bytes);
		let hex = "";
		for (let i = 0; i < bytes.length; i++) hex += hexes[bytes[i]];
		return hex;
	}
	exports.bytesToHex = bytesToHex;
	var asciis = {
		_0: 48,
		_9: 57,
		_A: 65,
		_F: 70,
		_a: 97,
		_f: 102
	};
	function asciiToBase16(char) {
		if (char >= asciis._0 && char <= asciis._9) return char - asciis._0;
		if (char >= asciis._A && char <= asciis._F) return char - (asciis._A - 10);
		if (char >= asciis._a && char <= asciis._f) return char - (asciis._a - 10);
	}
	/**
	* @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
	*/
	function hexToBytes(hex) {
		if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
		const hl = hex.length;
		const al = hl / 2;
		if (hl % 2) throw new Error("padded hex string expected, got unpadded hex of length " + hl);
		const array = new Uint8Array(al);
		for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
			const n1 = asciiToBase16(hex.charCodeAt(hi));
			const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
			if (n1 === void 0 || n2 === void 0) {
				const char = hex[hi] + hex[hi + 1];
				throw new Error("hex string expected, got non-hex character \"" + char + "\" at index " + hi);
			}
			array[ai] = n1 * 16 + n2;
		}
		return array;
	}
	exports.hexToBytes = hexToBytes;
	var nextTick = async () => {};
	exports.nextTick = nextTick;
	async function asyncLoop(iters, tick, cb) {
		let ts = Date.now();
		for (let i = 0; i < iters; i++) {
			cb(i);
			const diff = Date.now() - ts;
			if (diff >= 0 && diff < tick) continue;
			await (0, exports.nextTick)();
			ts += diff;
		}
	}
	exports.asyncLoop = asyncLoop;
	/**
	* @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
	*/
	function utf8ToBytes(str) {
		if (typeof str !== "string") throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
		return new Uint8Array(new TextEncoder().encode(str));
	}
	exports.utf8ToBytes = utf8ToBytes;
	/**
	* Normalizes (non-hex) string or Uint8Array to Uint8Array.
	* Warning: when Uint8Array is passed, it would NOT get copied.
	* Keep in mind for future mutable operations.
	*/
	function toBytes(data) {
		if (typeof data === "string") data = utf8ToBytes(data);
		(0, _assert_js_1.bytes)(data);
		return data;
	}
	exports.toBytes = toBytes;
	/**
	* Copies several Uint8Arrays into one.
	*/
	function concatBytes(...arrays) {
		let sum = 0;
		for (let i = 0; i < arrays.length; i++) {
			const a = arrays[i];
			(0, _assert_js_1.bytes)(a);
			sum += a.length;
		}
		const res = new Uint8Array(sum);
		for (let i = 0, pad = 0; i < arrays.length; i++) {
			const a = arrays[i];
			res.set(a, pad);
			pad += a.length;
		}
		return res;
	}
	exports.concatBytes = concatBytes;
	var Hash = class {
		clone() {
			return this._cloneInto();
		}
	};
	exports.Hash = Hash;
	var toStr = {}.toString;
	function checkOpts(defaults, opts) {
		if (opts !== void 0 && toStr.call(opts) !== "[object Object]") throw new Error("Options should be object or undefined");
		return Object.assign(defaults, opts);
	}
	exports.checkOpts = checkOpts;
	function wrapConstructor(hashCons) {
		const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
		const tmp = hashCons();
		hashC.outputLen = tmp.outputLen;
		hashC.blockLen = tmp.blockLen;
		hashC.create = () => hashCons();
		return hashC;
	}
	exports.wrapConstructor = wrapConstructor;
	function wrapConstructorWithOpts(hashCons) {
		const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
		const tmp = hashCons({});
		hashC.outputLen = tmp.outputLen;
		hashC.blockLen = tmp.blockLen;
		hashC.create = (opts) => hashCons(opts);
		return hashC;
	}
	exports.wrapConstructorWithOpts = wrapConstructorWithOpts;
	function wrapXOFConstructorWithOpts(hashCons) {
		const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
		const tmp = hashCons({});
		hashC.outputLen = tmp.outputLen;
		hashC.blockLen = tmp.blockLen;
		hashC.create = (opts) => hashCons(opts);
		return hashC;
	}
	exports.wrapXOFConstructorWithOpts = wrapXOFConstructorWithOpts;
	/**
	* Secure PRNG. Uses `crypto.getRandomValues`, which defers to OS.
	*/
	function randomBytes(bytesLength = 32) {
		if (crypto_1.crypto && typeof crypto_1.crypto.getRandomValues === "function") return crypto_1.crypto.getRandomValues(new Uint8Array(bytesLength));
		throw new Error("crypto.getRandomValues must be defined");
	}
	exports.randomBytes = randomBytes;
}));
//#endregion
//#region node_modules/@noble/curves/node_modules/@noble/hashes/_md.js
var require__md = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.HashMD = exports.Maj = exports.Chi = void 0;
	var _assert_js_1 = require__assert$1();
	var utils_js_1 = require_utils$3();
	function setBigUint64(view, byteOffset, value, isLE) {
		if (typeof view.setBigUint64 === "function") return view.setBigUint64(byteOffset, value, isLE);
		const _32n = BigInt(32);
		const _u32_max = BigInt(4294967295);
		const wh = Number(value >> _32n & _u32_max);
		const wl = Number(value & _u32_max);
		const h = isLE ? 4 : 0;
		const l = isLE ? 0 : 4;
		view.setUint32(byteOffset + h, wh, isLE);
		view.setUint32(byteOffset + l, wl, isLE);
	}
	var Chi = (a, b, c) => a & b ^ ~a & c;
	exports.Chi = Chi;
	var Maj = (a, b, c) => a & b ^ a & c ^ b & c;
	exports.Maj = Maj;
	/**
	* Merkle-Damgard hash construction base class.
	* Could be used to create MD5, RIPEMD, SHA1, SHA2.
	*/
	var HashMD = class extends utils_js_1.Hash {
		constructor(blockLen, outputLen, padOffset, isLE) {
			super();
			this.blockLen = blockLen;
			this.outputLen = outputLen;
			this.padOffset = padOffset;
			this.isLE = isLE;
			this.finished = false;
			this.length = 0;
			this.pos = 0;
			this.destroyed = false;
			this.buffer = new Uint8Array(blockLen);
			this.view = (0, utils_js_1.createView)(this.buffer);
		}
		update(data) {
			(0, _assert_js_1.exists)(this);
			const { view, buffer, blockLen } = this;
			data = (0, utils_js_1.toBytes)(data);
			const len = data.length;
			for (let pos = 0; pos < len;) {
				const take = Math.min(blockLen - this.pos, len - pos);
				if (take === blockLen) {
					const dataView = (0, utils_js_1.createView)(data);
					for (; blockLen <= len - pos; pos += blockLen) this.process(dataView, pos);
					continue;
				}
				buffer.set(data.subarray(pos, pos + take), this.pos);
				this.pos += take;
				pos += take;
				if (this.pos === blockLen) {
					this.process(view, 0);
					this.pos = 0;
				}
			}
			this.length += data.length;
			this.roundClean();
			return this;
		}
		digestInto(out) {
			(0, _assert_js_1.exists)(this);
			(0, _assert_js_1.output)(out, this);
			this.finished = true;
			const { buffer, view, blockLen, isLE } = this;
			let { pos } = this;
			buffer[pos++] = 128;
			this.buffer.subarray(pos).fill(0);
			if (this.padOffset > blockLen - pos) {
				this.process(view, 0);
				pos = 0;
			}
			for (let i = pos; i < blockLen; i++) buffer[i] = 0;
			setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
			this.process(view, 0);
			const oview = (0, utils_js_1.createView)(out);
			const len = this.outputLen;
			if (len % 4) throw new Error("_sha2: outputLen should be aligned to 32bit");
			const outLen = len / 4;
			const state = this.get();
			if (outLen > state.length) throw new Error("_sha2: outputLen bigger than state");
			for (let i = 0; i < outLen; i++) oview.setUint32(4 * i, state[i], isLE);
		}
		digest() {
			const { buffer, outputLen } = this;
			this.digestInto(buffer);
			const res = buffer.slice(0, outputLen);
			this.destroy();
			return res;
		}
		_cloneInto(to) {
			to || (to = new this.constructor());
			to.set(...this.get());
			const { blockLen, buffer, length, finished, destroyed, pos } = this;
			to.length = length;
			to.pos = pos;
			to.finished = finished;
			to.destroyed = destroyed;
			if (length % blockLen) to.buffer.set(buffer);
			return to;
		}
	};
	exports.HashMD = HashMD;
}));
//#endregion
//#region node_modules/@noble/curves/node_modules/@noble/hashes/sha256.js
var require_sha256 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.sha224 = exports.sha256 = void 0;
	var _md_js_1 = require__md();
	var utils_js_1 = require_utils$3();
	var SHA256_K = /* @__PURE__ */ new Uint32Array([
		1116352408,
		1899447441,
		3049323471,
		3921009573,
		961987163,
		1508970993,
		2453635748,
		2870763221,
		3624381080,
		310598401,
		607225278,
		1426881987,
		1925078388,
		2162078206,
		2614888103,
		3248222580,
		3835390401,
		4022224774,
		264347078,
		604807628,
		770255983,
		1249150122,
		1555081692,
		1996064986,
		2554220882,
		2821834349,
		2952996808,
		3210313671,
		3336571891,
		3584528711,
		113926993,
		338241895,
		666307205,
		773529912,
		1294757372,
		1396182291,
		1695183700,
		1986661051,
		2177026350,
		2456956037,
		2730485921,
		2820302411,
		3259730800,
		3345764771,
		3516065817,
		3600352804,
		4094571909,
		275423344,
		430227734,
		506948616,
		659060556,
		883997877,
		958139571,
		1322822218,
		1537002063,
		1747873779,
		1955562222,
		2024104815,
		2227730452,
		2361852424,
		2428436474,
		2756734187,
		3204031479,
		3329325298
	]);
	var SHA256_IV = /* @__PURE__ */ new Uint32Array([
		1779033703,
		3144134277,
		1013904242,
		2773480762,
		1359893119,
		2600822924,
		528734635,
		1541459225
	]);
	var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
	var SHA256 = class extends _md_js_1.HashMD {
		constructor() {
			super(64, 32, 8, false);
			this.A = SHA256_IV[0] | 0;
			this.B = SHA256_IV[1] | 0;
			this.C = SHA256_IV[2] | 0;
			this.D = SHA256_IV[3] | 0;
			this.E = SHA256_IV[4] | 0;
			this.F = SHA256_IV[5] | 0;
			this.G = SHA256_IV[6] | 0;
			this.H = SHA256_IV[7] | 0;
		}
		get() {
			const { A, B, C, D, E, F, G, H } = this;
			return [
				A,
				B,
				C,
				D,
				E,
				F,
				G,
				H
			];
		}
		set(A, B, C, D, E, F, G, H) {
			this.A = A | 0;
			this.B = B | 0;
			this.C = C | 0;
			this.D = D | 0;
			this.E = E | 0;
			this.F = F | 0;
			this.G = G | 0;
			this.H = H | 0;
		}
		process(view, offset) {
			for (let i = 0; i < 16; i++, offset += 4) SHA256_W[i] = view.getUint32(offset, false);
			for (let i = 16; i < 64; i++) {
				const W15 = SHA256_W[i - 15];
				const W2 = SHA256_W[i - 2];
				const s0 = (0, utils_js_1.rotr)(W15, 7) ^ (0, utils_js_1.rotr)(W15, 18) ^ W15 >>> 3;
				const s1 = (0, utils_js_1.rotr)(W2, 17) ^ (0, utils_js_1.rotr)(W2, 19) ^ W2 >>> 10;
				SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
			}
			let { A, B, C, D, E, F, G, H } = this;
			for (let i = 0; i < 64; i++) {
				const sigma1 = (0, utils_js_1.rotr)(E, 6) ^ (0, utils_js_1.rotr)(E, 11) ^ (0, utils_js_1.rotr)(E, 25);
				const T1 = H + sigma1 + (0, _md_js_1.Chi)(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
				const T2 = ((0, utils_js_1.rotr)(A, 2) ^ (0, utils_js_1.rotr)(A, 13) ^ (0, utils_js_1.rotr)(A, 22)) + (0, _md_js_1.Maj)(A, B, C) | 0;
				H = G;
				G = F;
				F = E;
				E = D + T1 | 0;
				D = C;
				C = B;
				B = A;
				A = T1 + T2 | 0;
			}
			A = A + this.A | 0;
			B = B + this.B | 0;
			C = C + this.C | 0;
			D = D + this.D | 0;
			E = E + this.E | 0;
			F = F + this.F | 0;
			G = G + this.G | 0;
			H = H + this.H | 0;
			this.set(A, B, C, D, E, F, G, H);
		}
		roundClean() {
			SHA256_W.fill(0);
		}
		destroy() {
			this.set(0, 0, 0, 0, 0, 0, 0, 0);
			this.buffer.fill(0);
		}
	};
	var SHA224 = class extends SHA256 {
		constructor() {
			super();
			this.A = -1056596264;
			this.B = 914150663;
			this.C = 812702999;
			this.D = -150054599;
			this.E = -4191439;
			this.F = 1750603025;
			this.G = 1694076839;
			this.H = -1090891868;
			this.outputLen = 28;
		}
	};
	/**
	* SHA2-256 hash function
	* @param message - data that would be hashed
	*/
	exports.sha256 = (0, utils_js_1.wrapConstructor)(() => new SHA256());
	exports.sha224 = (0, utils_js_1.wrapConstructor)(() => new SHA224());
}));
//#endregion
//#region node_modules/@noble/curves/node_modules/@noble/hashes/hmac.js
var require_hmac = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.hmac = exports.HMAC = void 0;
	var _assert_js_1 = require__assert$1();
	var utils_js_1 = require_utils$3();
	var HMAC = class extends utils_js_1.Hash {
		constructor(hash, _key) {
			super();
			this.finished = false;
			this.destroyed = false;
			(0, _assert_js_1.hash)(hash);
			const key = (0, utils_js_1.toBytes)(_key);
			this.iHash = hash.create();
			if (typeof this.iHash.update !== "function") throw new Error("Expected instance of class which extends utils.Hash");
			this.blockLen = this.iHash.blockLen;
			this.outputLen = this.iHash.outputLen;
			const blockLen = this.blockLen;
			const pad = new Uint8Array(blockLen);
			pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
			for (let i = 0; i < pad.length; i++) pad[i] ^= 54;
			this.iHash.update(pad);
			this.oHash = hash.create();
			for (let i = 0; i < pad.length; i++) pad[i] ^= 106;
			this.oHash.update(pad);
			pad.fill(0);
		}
		update(buf) {
			(0, _assert_js_1.exists)(this);
			this.iHash.update(buf);
			return this;
		}
		digestInto(out) {
			(0, _assert_js_1.exists)(this);
			(0, _assert_js_1.bytes)(out, this.outputLen);
			this.finished = true;
			this.iHash.digestInto(out);
			this.oHash.update(out);
			this.oHash.digestInto(out);
			this.destroy();
		}
		digest() {
			const out = new Uint8Array(this.oHash.outputLen);
			this.digestInto(out);
			return out;
		}
		_cloneInto(to) {
			to || (to = Object.create(Object.getPrototypeOf(this), {}));
			const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
			to = to;
			to.finished = finished;
			to.destroyed = destroyed;
			to.blockLen = blockLen;
			to.outputLen = outputLen;
			to.oHash = oHash._cloneInto(to.oHash);
			to.iHash = iHash._cloneInto(to.iHash);
			return to;
		}
		destroy() {
			this.destroyed = true;
			this.oHash.destroy();
			this.iHash.destroy();
		}
	};
	exports.HMAC = HMAC;
	/**
	* HMAC: RFC2104 message authentication code.
	* @param hash - function that would be used e.g. sha256
	* @param key - message key
	* @param message - message data
	*/
	var hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
	exports.hmac = hmac;
	exports.hmac.create = (hash, key) => new HMAC(hash, key);
}));
//#endregion
//#region node_modules/@noble/curves/abstract/utils.js
var require_utils$2 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.bitMask = void 0;
	exports.isBytes = isBytes;
	exports.abytes = abytes;
	exports.bytesToHex = bytesToHex;
	exports.numberToHexUnpadded = numberToHexUnpadded;
	exports.hexToNumber = hexToNumber;
	exports.hexToBytes = hexToBytes;
	exports.bytesToNumberBE = bytesToNumberBE;
	exports.bytesToNumberLE = bytesToNumberLE;
	exports.numberToBytesBE = numberToBytesBE;
	exports.numberToBytesLE = numberToBytesLE;
	exports.numberToVarBytesBE = numberToVarBytesBE;
	exports.ensureBytes = ensureBytes;
	exports.concatBytes = concatBytes;
	exports.equalBytes = equalBytes;
	exports.utf8ToBytes = utf8ToBytes;
	exports.bitLen = bitLen;
	exports.bitGet = bitGet;
	exports.bitSet = bitSet;
	exports.createHmacDrbg = createHmacDrbg;
	exports.validateObject = validateObject;
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	var _0n = /* @__PURE__ */ BigInt(0);
	var _1n = /* @__PURE__ */ BigInt(1);
	var _2n = /* @__PURE__ */ BigInt(2);
	function isBytes(a) {
		return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
	}
	function abytes(item) {
		if (!isBytes(item)) throw new Error("Uint8Array expected");
	}
	var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
	/**
	* @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
	*/
	function bytesToHex(bytes) {
		abytes(bytes);
		let hex = "";
		for (let i = 0; i < bytes.length; i++) hex += hexes[bytes[i]];
		return hex;
	}
	function numberToHexUnpadded(num) {
		const hex = num.toString(16);
		return hex.length & 1 ? `0${hex}` : hex;
	}
	function hexToNumber(hex) {
		if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
		return BigInt(hex === "" ? "0" : `0x${hex}`);
	}
	var asciis = {
		_0: 48,
		_9: 57,
		_A: 65,
		_F: 70,
		_a: 97,
		_f: 102
	};
	function asciiToBase16(char) {
		if (char >= asciis._0 && char <= asciis._9) return char - asciis._0;
		if (char >= asciis._A && char <= asciis._F) return char - (asciis._A - 10);
		if (char >= asciis._a && char <= asciis._f) return char - (asciis._a - 10);
	}
	/**
	* @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
	*/
	function hexToBytes(hex) {
		if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
		const hl = hex.length;
		const al = hl / 2;
		if (hl % 2) throw new Error("padded hex string expected, got unpadded hex of length " + hl);
		const array = new Uint8Array(al);
		for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
			const n1 = asciiToBase16(hex.charCodeAt(hi));
			const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
			if (n1 === void 0 || n2 === void 0) {
				const char = hex[hi] + hex[hi + 1];
				throw new Error("hex string expected, got non-hex character \"" + char + "\" at index " + hi);
			}
			array[ai] = n1 * 16 + n2;
		}
		return array;
	}
	function bytesToNumberBE(bytes) {
		return hexToNumber(bytesToHex(bytes));
	}
	function bytesToNumberLE(bytes) {
		abytes(bytes);
		return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
	}
	function numberToBytesBE(n, len) {
		return hexToBytes(n.toString(16).padStart(len * 2, "0"));
	}
	function numberToBytesLE(n, len) {
		return numberToBytesBE(n, len).reverse();
	}
	function numberToVarBytesBE(n) {
		return hexToBytes(numberToHexUnpadded(n));
	}
	/**
	* Takes hex string or Uint8Array, converts to Uint8Array.
	* Validates output length.
	* Will throw error for other types.
	* @param title descriptive title for an error e.g. 'private key'
	* @param hex hex string or Uint8Array
	* @param expectedLength optional, will compare to result array's length
	* @returns
	*/
	function ensureBytes(title, hex, expectedLength) {
		let res;
		if (typeof hex === "string") try {
			res = hexToBytes(hex);
		} catch (e) {
			throw new Error(`${title} must be valid hex string, got "${hex}". Cause: ${e}`);
		}
		else if (isBytes(hex)) res = Uint8Array.from(hex);
		else throw new Error(`${title} must be hex string or Uint8Array`);
		const len = res.length;
		if (typeof expectedLength === "number" && len !== expectedLength) throw new Error(`${title} expected ${expectedLength} bytes, got ${len}`);
		return res;
	}
	/**
	* Copies several Uint8Arrays into one.
	*/
	function concatBytes(...arrays) {
		let sum = 0;
		for (let i = 0; i < arrays.length; i++) {
			const a = arrays[i];
			abytes(a);
			sum += a.length;
		}
		const res = new Uint8Array(sum);
		for (let i = 0, pad = 0; i < arrays.length; i++) {
			const a = arrays[i];
			res.set(a, pad);
			pad += a.length;
		}
		return res;
	}
	function equalBytes(a, b) {
		if (a.length !== b.length) return false;
		let diff = 0;
		for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
		return diff === 0;
	}
	/**
	* @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
	*/
	function utf8ToBytes(str) {
		if (typeof str !== "string") throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
		return new Uint8Array(new TextEncoder().encode(str));
	}
	/**
	* Calculates amount of bits in a bigint.
	* Same as `n.toString(2).length`
	*/
	function bitLen(n) {
		let len = 0;
		for (; n > _0n; n >>= _1n, len += 1);
		return len;
	}
	/**
	* Gets single bit at position.
	* NOTE: first bit position is 0 (same as arrays)
	* Same as `!!+Array.from(n.toString(2)).reverse()[pos]`
	*/
	function bitGet(n, pos) {
		return n >> BigInt(pos) & _1n;
	}
	/**
	* Sets single bit at position.
	*/
	function bitSet(n, pos, value) {
		return n | (value ? _1n : _0n) << BigInt(pos);
	}
	/**
	* Calculate mask for N bits. Not using ** operator with bigints because of old engines.
	* Same as BigInt(`0b${Array(i).fill('1').join('')}`)
	*/
	var bitMask = (n) => (_2n << BigInt(n - 1)) - _1n;
	exports.bitMask = bitMask;
	var u8n = (data) => new Uint8Array(data);
	var u8fr = (arr) => Uint8Array.from(arr);
	/**
	* Minimal HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
	* @returns function that will call DRBG until 2nd arg returns something meaningful
	* @example
	*   const drbg = createHmacDRBG<Key>(32, 32, hmac);
	*   drbg(seed, bytesToKey); // bytesToKey must return Key or undefined
	*/
	function createHmacDrbg(hashLen, qByteLen, hmacFn) {
		if (typeof hashLen !== "number" || hashLen < 2) throw new Error("hashLen must be a number");
		if (typeof qByteLen !== "number" || qByteLen < 2) throw new Error("qByteLen must be a number");
		if (typeof hmacFn !== "function") throw new Error("hmacFn must be a function");
		let v = u8n(hashLen);
		let k = u8n(hashLen);
		let i = 0;
		const reset = () => {
			v.fill(1);
			k.fill(0);
			i = 0;
		};
		const h = (...b) => hmacFn(k, v, ...b);
		const reseed = (seed = u8n()) => {
			k = h(u8fr([0]), seed);
			v = h();
			if (seed.length === 0) return;
			k = h(u8fr([1]), seed);
			v = h();
		};
		const gen = () => {
			if (i++ >= 1e3) throw new Error("drbg: tried 1000 values");
			let len = 0;
			const out = [];
			while (len < qByteLen) {
				v = h();
				const sl = v.slice();
				out.push(sl);
				len += v.length;
			}
			return concatBytes(...out);
		};
		const genUntil = (seed, pred) => {
			reset();
			reseed(seed);
			let res = void 0;
			while (!(res = pred(gen()))) reseed();
			reset();
			return res;
		};
		return genUntil;
	}
	var validatorFns = {
		bigint: (val) => typeof val === "bigint",
		function: (val) => typeof val === "function",
		boolean: (val) => typeof val === "boolean",
		string: (val) => typeof val === "string",
		stringOrUint8Array: (val) => typeof val === "string" || isBytes(val),
		isSafeInteger: (val) => Number.isSafeInteger(val),
		array: (val) => Array.isArray(val),
		field: (val, object) => object.Fp.isValid(val),
		hash: (val) => typeof val === "function" && Number.isSafeInteger(val.outputLen)
	};
	function validateObject(object, validators, optValidators = {}) {
		const checkField = (fieldName, type, isOptional) => {
			const checkVal = validatorFns[type];
			if (typeof checkVal !== "function") throw new Error(`Invalid validator "${type}", expected function`);
			const val = object[fieldName];
			if (isOptional && val === void 0) return;
			if (!checkVal(val, object)) throw new Error(`Invalid param ${String(fieldName)}=${val} (${typeof val}), expected ${type}`);
		};
		for (const [fieldName, type] of Object.entries(validators)) checkField(fieldName, type, false);
		for (const [fieldName, type] of Object.entries(optValidators)) checkField(fieldName, type, true);
		return object;
	}
}));
//#endregion
//#region node_modules/@noble/curves/abstract/modular.js
var require_modular = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.isNegativeLE = void 0;
	exports.mod = mod;
	exports.pow = pow;
	exports.pow2 = pow2;
	exports.invert = invert;
	exports.tonelliShanks = tonelliShanks;
	exports.FpSqrt = FpSqrt;
	exports.validateField = validateField;
	exports.FpPow = FpPow;
	exports.FpInvertBatch = FpInvertBatch;
	exports.FpDiv = FpDiv;
	exports.FpIsSquare = FpIsSquare;
	exports.nLength = nLength;
	exports.Field = Field;
	exports.FpSqrtOdd = FpSqrtOdd;
	exports.FpSqrtEven = FpSqrtEven;
	exports.hashToPrivateScalar = hashToPrivateScalar;
	exports.getFieldBytesLength = getFieldBytesLength;
	exports.getMinHashLength = getMinHashLength;
	exports.mapHashToField = mapHashToField;
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	var utils_js_1 = require_utils$2();
	var _0n = BigInt(0);
	var _1n = BigInt(1);
	var _2n = BigInt(2);
	var _3n = BigInt(3);
	var _4n = BigInt(4);
	var _5n = BigInt(5);
	var _8n = BigInt(8);
	var _9n = BigInt(9);
	var _16n = BigInt(16);
	function mod(a, b) {
		const result = a % b;
		return result >= _0n ? result : b + result;
	}
	/**
	* Efficiently raise num to power and do modular division.
	* Unsafe in some contexts: uses ladder, so can expose bigint bits.
	* @example
	* pow(2n, 6n, 11n) // 64n % 11n == 9n
	*/
	function pow(num, power, modulo) {
		if (modulo <= _0n || power < _0n) throw new Error("Expected power/modulo > 0");
		if (modulo === _1n) return _0n;
		let res = _1n;
		while (power > _0n) {
			if (power & _1n) res = res * num % modulo;
			num = num * num % modulo;
			power >>= _1n;
		}
		return res;
	}
	function pow2(x, power, modulo) {
		let res = x;
		while (power-- > _0n) {
			res *= res;
			res %= modulo;
		}
		return res;
	}
	function invert(number, modulo) {
		if (number === _0n || modulo <= _0n) throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
		let a = mod(number, modulo);
		let b = modulo;
		let x = _0n, y = _1n, u = _1n, v = _0n;
		while (a !== _0n) {
			const q = b / a;
			const r = b % a;
			const m = x - u * q;
			const n = y - v * q;
			b = a, a = r, x = u, y = v, u = m, v = n;
		}
		if (b !== _1n) throw new Error("invert: does not exist");
		return mod(x, modulo);
	}
	/**
	* Tonelli-Shanks square root search algorithm.
	* 1. https://eprint.iacr.org/2012/685.pdf (page 12)
	* 2. Square Roots from 1; 24, 51, 10 to Dan Shanks
	* Will start an infinite loop if field order P is not prime.
	* @param P field order
	* @returns function that takes field Fp (created from P) and number n
	*/
	function tonelliShanks(P) {
		const legendreC = (P - _1n) / _2n;
		let Q, S, Z;
		for (Q = P - _1n, S = 0; Q % _2n === _0n; Q /= _2n, S++);
		for (Z = _2n; Z < P && pow(Z, legendreC, P) !== P - _1n; Z++);
		if (S === 1) {
			const p1div4 = (P + _1n) / _4n;
			return function tonelliFast(Fp, n) {
				const root = Fp.pow(n, p1div4);
				if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
				return root;
			};
		}
		const Q1div2 = (Q + _1n) / _2n;
		return function tonelliSlow(Fp, n) {
			if (Fp.pow(n, legendreC) === Fp.neg(Fp.ONE)) throw new Error("Cannot find square root");
			let r = S;
			let g = Fp.pow(Fp.mul(Fp.ONE, Z), Q);
			let x = Fp.pow(n, Q1div2);
			let b = Fp.pow(n, Q);
			while (!Fp.eql(b, Fp.ONE)) {
				if (Fp.eql(b, Fp.ZERO)) return Fp.ZERO;
				let m = 1;
				for (let t2 = Fp.sqr(b); m < r; m++) {
					if (Fp.eql(t2, Fp.ONE)) break;
					t2 = Fp.sqr(t2);
				}
				const ge = Fp.pow(g, _1n << BigInt(r - m - 1));
				g = Fp.sqr(ge);
				x = Fp.mul(x, ge);
				b = Fp.mul(b, g);
				r = m;
			}
			return x;
		};
	}
	function FpSqrt(P) {
		if (P % _4n === _3n) {
			const p1div4 = (P + _1n) / _4n;
			return function sqrt3mod4(Fp, n) {
				const root = Fp.pow(n, p1div4);
				if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
				return root;
			};
		}
		if (P % _8n === _5n) {
			const c1 = (P - _5n) / _8n;
			return function sqrt5mod8(Fp, n) {
				const n2 = Fp.mul(n, _2n);
				const v = Fp.pow(n2, c1);
				const nv = Fp.mul(n, v);
				const i = Fp.mul(Fp.mul(nv, _2n), v);
				const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
				if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
				return root;
			};
		}
		if (P % _16n === _9n) {}
		return tonelliShanks(P);
	}
	var isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n) === _1n;
	exports.isNegativeLE = isNegativeLE;
	var FIELD_FIELDS = [
		"create",
		"isValid",
		"is0",
		"neg",
		"inv",
		"sqrt",
		"sqr",
		"eql",
		"add",
		"sub",
		"mul",
		"pow",
		"div",
		"addN",
		"subN",
		"mulN",
		"sqrN"
	];
	function validateField(field) {
		const opts = FIELD_FIELDS.reduce((map, val) => {
			map[val] = "function";
			return map;
		}, {
			ORDER: "bigint",
			MASK: "bigint",
			BYTES: "isSafeInteger",
			BITS: "isSafeInteger"
		});
		return (0, utils_js_1.validateObject)(field, opts);
	}
	/**
	* Same as `pow` but for Fp: non-constant-time.
	* Unsafe in some contexts: uses ladder, so can expose bigint bits.
	*/
	function FpPow(f, num, power) {
		if (power < _0n) throw new Error("Expected power > 0");
		if (power === _0n) return f.ONE;
		if (power === _1n) return num;
		let p = f.ONE;
		let d = num;
		while (power > _0n) {
			if (power & _1n) p = f.mul(p, d);
			d = f.sqr(d);
			power >>= _1n;
		}
		return p;
	}
	/**
	* Efficiently invert an array of Field elements.
	* `inv(0)` will return `undefined` here: make sure to throw an error.
	*/
	function FpInvertBatch(f, nums) {
		const tmp = new Array(nums.length);
		const lastMultiplied = nums.reduce((acc, num, i) => {
			if (f.is0(num)) return acc;
			tmp[i] = acc;
			return f.mul(acc, num);
		}, f.ONE);
		const inverted = f.inv(lastMultiplied);
		nums.reduceRight((acc, num, i) => {
			if (f.is0(num)) return acc;
			tmp[i] = f.mul(acc, tmp[i]);
			return f.mul(acc, num);
		}, inverted);
		return tmp;
	}
	function FpDiv(f, lhs, rhs) {
		return f.mul(lhs, typeof rhs === "bigint" ? invert(rhs, f.ORDER) : f.inv(rhs));
	}
	function FpIsSquare(f) {
		const legendreConst = (f.ORDER - _1n) / _2n;
		return (x) => {
			const p = f.pow(x, legendreConst);
			return f.eql(p, f.ZERO) || f.eql(p, f.ONE);
		};
	}
	function nLength(n, nBitLength) {
		const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
		return {
			nBitLength: _nBitLength,
			nByteLength: Math.ceil(_nBitLength / 8)
		};
	}
	/**
	* Initializes a finite field over prime. **Non-primes are not supported.**
	* Do not init in loop: slow. Very fragile: always run a benchmark on a change.
	* Major performance optimizations:
	* * a) denormalized operations like mulN instead of mul
	* * b) same object shape: never add or remove keys
	* * c) Object.freeze
	* @param ORDER prime positive bigint
	* @param bitLen how many bits the field consumes
	* @param isLE (def: false) if encoding / decoding should be in little-endian
	* @param redef optional faster redefinitions of sqrt and other methods
	*/
	function Field(ORDER, bitLen, isLE = false, redef = {}) {
		if (ORDER <= _0n) throw new Error(`Expected Field ORDER > 0, got ${ORDER}`);
		const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen);
		if (BYTES > 2048) throw new Error("Field lengths over 2048 bytes are not supported");
		const sqrtP = FpSqrt(ORDER);
		const f = Object.freeze({
			ORDER,
			BITS,
			BYTES,
			MASK: (0, utils_js_1.bitMask)(BITS),
			ZERO: _0n,
			ONE: _1n,
			create: (num) => mod(num, ORDER),
			isValid: (num) => {
				if (typeof num !== "bigint") throw new Error(`Invalid field element: expected bigint, got ${typeof num}`);
				return _0n <= num && num < ORDER;
			},
			is0: (num) => num === _0n,
			isOdd: (num) => (num & _1n) === _1n,
			neg: (num) => mod(-num, ORDER),
			eql: (lhs, rhs) => lhs === rhs,
			sqr: (num) => mod(num * num, ORDER),
			add: (lhs, rhs) => mod(lhs + rhs, ORDER),
			sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
			mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
			pow: (num, power) => FpPow(f, num, power),
			div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
			sqrN: (num) => num * num,
			addN: (lhs, rhs) => lhs + rhs,
			subN: (lhs, rhs) => lhs - rhs,
			mulN: (lhs, rhs) => lhs * rhs,
			inv: (num) => invert(num, ORDER),
			sqrt: redef.sqrt || ((n) => sqrtP(f, n)),
			invertBatch: (lst) => FpInvertBatch(f, lst),
			cmov: (a, b, c) => c ? b : a,
			toBytes: (num) => isLE ? (0, utils_js_1.numberToBytesLE)(num, BYTES) : (0, utils_js_1.numberToBytesBE)(num, BYTES),
			fromBytes: (bytes) => {
				if (bytes.length !== BYTES) throw new Error(`Fp.fromBytes: expected ${BYTES}, got ${bytes.length}`);
				return isLE ? (0, utils_js_1.bytesToNumberLE)(bytes) : (0, utils_js_1.bytesToNumberBE)(bytes);
			}
		});
		return Object.freeze(f);
	}
	function FpSqrtOdd(Fp, elm) {
		if (!Fp.isOdd) throw new Error(`Field doesn't have isOdd`);
		const root = Fp.sqrt(elm);
		return Fp.isOdd(root) ? root : Fp.neg(root);
	}
	function FpSqrtEven(Fp, elm) {
		if (!Fp.isOdd) throw new Error(`Field doesn't have isOdd`);
		const root = Fp.sqrt(elm);
		return Fp.isOdd(root) ? Fp.neg(root) : root;
	}
	/**
	* "Constant-time" private key generation utility.
	* Same as mapKeyToField, but accepts less bytes (40 instead of 48 for 32-byte field).
	* Which makes it slightly more biased, less secure.
	* @deprecated use mapKeyToField instead
	*/
	function hashToPrivateScalar(hash, groupOrder, isLE = false) {
		hash = (0, utils_js_1.ensureBytes)("privateHash", hash);
		const hashLen = hash.length;
		const minLen = nLength(groupOrder).nByteLength + 8;
		if (minLen < 24 || hashLen < minLen || hashLen > 1024) throw new Error(`hashToPrivateScalar: expected ${minLen}-1024 bytes of input, got ${hashLen}`);
		return mod(isLE ? (0, utils_js_1.bytesToNumberLE)(hash) : (0, utils_js_1.bytesToNumberBE)(hash), groupOrder - _1n) + _1n;
	}
	/**
	* Returns total number of bytes consumed by the field element.
	* For example, 32 bytes for usual 256-bit weierstrass curve.
	* @param fieldOrder number of field elements, usually CURVE.n
	* @returns byte length of field
	*/
	function getFieldBytesLength(fieldOrder) {
		if (typeof fieldOrder !== "bigint") throw new Error("field order must be bigint");
		const bitLength = fieldOrder.toString(2).length;
		return Math.ceil(bitLength / 8);
	}
	/**
	* Returns minimal amount of bytes that can be safely reduced
	* by field order.
	* Should be 2^-128 for 128-bit curve such as P256.
	* @param fieldOrder number of field elements, usually CURVE.n
	* @returns byte length of target hash
	*/
	function getMinHashLength(fieldOrder) {
		const length = getFieldBytesLength(fieldOrder);
		return length + Math.ceil(length / 2);
	}
	/**
	* "Constant-time" private key generation utility.
	* Can take (n + n/2) or more bytes of uniform input e.g. from CSPRNG or KDF
	* and convert them into private scalar, with the modulo bias being negligible.
	* Needs at least 48 bytes of input for 32-byte private key.
	* https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/
	* FIPS 186-5, A.2 https://csrc.nist.gov/publications/detail/fips/186/5/final
	* RFC 9380, https://www.rfc-editor.org/rfc/rfc9380#section-5
	* @param hash hash output from SHA3 or a similar function
	* @param groupOrder size of subgroup - (e.g. secp256k1.CURVE.n)
	* @param isLE interpret hash bytes as LE num
	* @returns valid private scalar
	*/
	function mapHashToField(key, fieldOrder, isLE = false) {
		const len = key.length;
		const fieldLen = getFieldBytesLength(fieldOrder);
		const minLen = getMinHashLength(fieldOrder);
		if (len < 16 || len < minLen || len > 1024) throw new Error(`expected ${minLen}-1024 bytes of input, got ${len}`);
		const reduced = mod(isLE ? (0, utils_js_1.bytesToNumberBE)(key) : (0, utils_js_1.bytesToNumberLE)(key), fieldOrder - _1n) + _1n;
		return isLE ? (0, utils_js_1.numberToBytesLE)(reduced, fieldLen) : (0, utils_js_1.numberToBytesBE)(reduced, fieldLen);
	}
}));
//#endregion
//#region node_modules/@noble/curves/abstract/curve.js
var require_curve = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.wNAF = wNAF;
	exports.validateBasic = validateBasic;
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	var modular_js_1 = require_modular();
	var utils_js_1 = require_utils$2();
	var _0n = BigInt(0);
	var _1n = BigInt(1);
	function wNAF(c, bits) {
		const constTimeNegate = (condition, item) => {
			const neg = item.negate();
			return condition ? neg : item;
		};
		const opts = (W) => {
			return {
				windows: Math.ceil(bits / W) + 1,
				windowSize: 2 ** (W - 1)
			};
		};
		return {
			constTimeNegate,
			unsafeLadder(elm, n) {
				let p = c.ZERO;
				let d = elm;
				while (n > _0n) {
					if (n & _1n) p = p.add(d);
					d = d.double();
					n >>= _1n;
				}
				return p;
			},
			/**
			* Creates a wNAF precomputation window. Used for caching.
			* Default window size is set by `utils.precompute()` and is equal to 8.
			* Number of precomputed points depends on the curve size:
			* 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
			* - 𝑊 is the window size
			* - 𝑛 is the bitlength of the curve order.
			* For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
			* @returns precomputed point tables flattened to a single array
			*/
			precomputeWindow(elm, W) {
				const { windows, windowSize } = opts(W);
				const points = [];
				let p = elm;
				let base = p;
				for (let window = 0; window < windows; window++) {
					base = p;
					points.push(base);
					for (let i = 1; i < windowSize; i++) {
						base = base.add(p);
						points.push(base);
					}
					p = base.double();
				}
				return points;
			},
			/**
			* Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
			* @param W window size
			* @param precomputes precomputed tables
			* @param n scalar (we don't check here, but should be less than curve order)
			* @returns real and fake (for const-time) points
			*/
			wNAF(W, precomputes, n) {
				const { windows, windowSize } = opts(W);
				let p = c.ZERO;
				let f = c.BASE;
				const mask = BigInt(2 ** W - 1);
				const maxNumber = 2 ** W;
				const shiftBy = BigInt(W);
				for (let window = 0; window < windows; window++) {
					const offset = window * windowSize;
					let wbits = Number(n & mask);
					n >>= shiftBy;
					if (wbits > windowSize) {
						wbits -= maxNumber;
						n += _1n;
					}
					const offset1 = offset;
					const offset2 = offset + Math.abs(wbits) - 1;
					const cond1 = window % 2 !== 0;
					const cond2 = wbits < 0;
					if (wbits === 0) f = f.add(constTimeNegate(cond1, precomputes[offset1]));
					else p = p.add(constTimeNegate(cond2, precomputes[offset2]));
				}
				return {
					p,
					f
				};
			},
			wNAFCached(P, precomputesMap, n, transform) {
				const W = P._WINDOW_SIZE || 1;
				let comp = precomputesMap.get(P);
				if (!comp) {
					comp = this.precomputeWindow(P, W);
					if (W !== 1) precomputesMap.set(P, transform(comp));
				}
				return this.wNAF(W, comp, n);
			}
		};
	}
	function validateBasic(curve) {
		(0, modular_js_1.validateField)(curve.Fp);
		(0, utils_js_1.validateObject)(curve, {
			n: "bigint",
			h: "bigint",
			Gx: "field",
			Gy: "field"
		}, {
			nBitLength: "isSafeInteger",
			nByteLength: "isSafeInteger"
		});
		return Object.freeze({
			...(0, modular_js_1.nLength)(curve.n, curve.nBitLength),
			...curve,
			p: curve.Fp.ORDER
		});
	}
}));
//#endregion
//#region node_modules/@noble/curves/abstract/weierstrass.js
var require_weierstrass = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DER = void 0;
	exports.weierstrassPoints = weierstrassPoints;
	exports.weierstrass = weierstrass;
	exports.SWUFpSqrtRatio = SWUFpSqrtRatio;
	exports.mapToCurveSimpleSWU = mapToCurveSimpleSWU;
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	var curve_js_1 = require_curve();
	var mod = require_modular();
	var ut = require_utils$2();
	var utils_js_1 = require_utils$2();
	function validatePointOpts(curve) {
		const opts = (0, curve_js_1.validateBasic)(curve);
		ut.validateObject(opts, {
			a: "field",
			b: "field"
		}, {
			allowedPrivateKeyLengths: "array",
			wrapPrivateKey: "boolean",
			isTorsionFree: "function",
			clearCofactor: "function",
			allowInfinityPoint: "boolean",
			fromBytes: "function",
			toBytes: "function"
		});
		const { endo, Fp, a } = opts;
		if (endo) {
			if (!Fp.eql(a, Fp.ZERO)) throw new Error("Endomorphism can only be defined for Koblitz curves that have a=0");
			if (typeof endo !== "object" || typeof endo.beta !== "bigint" || typeof endo.splitScalar !== "function") throw new Error("Expected endomorphism with beta: bigint and splitScalar: function");
		}
		return Object.freeze({ ...opts });
	}
	var { bytesToNumberBE: b2n, hexToBytes: h2b } = ut;
	exports.DER = {
		Err: class DERErr extends Error {
			constructor(m = "") {
				super(m);
			}
		},
		_parseInt(data) {
			const { Err: E } = exports.DER;
			if (data.length < 2 || data[0] !== 2) throw new E("Invalid signature integer tag");
			const len = data[1];
			const res = data.subarray(2, len + 2);
			if (!len || res.length !== len) throw new E("Invalid signature integer: wrong length");
			if (res[0] & 128) throw new E("Invalid signature integer: negative");
			if (res[0] === 0 && !(res[1] & 128)) throw new E("Invalid signature integer: unnecessary leading zero");
			return {
				d: b2n(res),
				l: data.subarray(len + 2)
			};
		},
		toSig(hex) {
			const { Err: E } = exports.DER;
			const data = typeof hex === "string" ? h2b(hex) : hex;
			ut.abytes(data);
			let l = data.length;
			if (l < 2 || data[0] != 48) throw new E("Invalid signature tag");
			if (data[1] !== l - 2) throw new E("Invalid signature: incorrect length");
			const { d: r, l: sBytes } = exports.DER._parseInt(data.subarray(2));
			const { d: s, l: rBytesLeft } = exports.DER._parseInt(sBytes);
			if (rBytesLeft.length) throw new E("Invalid signature: left bytes after parsing");
			return {
				r,
				s
			};
		},
		hexFromSig(sig) {
			const slice = (s) => Number.parseInt(s[0], 16) & 8 ? "00" + s : s;
			const h = (num) => {
				const hex = num.toString(16);
				return hex.length & 1 ? `0${hex}` : hex;
			};
			const s = slice(h(sig.s));
			const r = slice(h(sig.r));
			const shl = s.length / 2;
			const rhl = r.length / 2;
			const sl = h(shl);
			const rl = h(rhl);
			return `30${h(rhl + shl + 4)}02${rl}${r}02${sl}${s}`;
		}
	};
	var _0n = BigInt(0);
	var _1n = BigInt(1);
	var _2n = BigInt(2);
	var _3n = BigInt(3);
	var _4n = BigInt(4);
	function weierstrassPoints(opts) {
		const CURVE = validatePointOpts(opts);
		const { Fp } = CURVE;
		const toBytes = CURVE.toBytes || ((_c, point, _isCompressed) => {
			const a = point.toAffine();
			return ut.concatBytes(Uint8Array.from([4]), Fp.toBytes(a.x), Fp.toBytes(a.y));
		});
		const fromBytes = CURVE.fromBytes || ((bytes) => {
			const tail = bytes.subarray(1);
			return {
				x: Fp.fromBytes(tail.subarray(0, Fp.BYTES)),
				y: Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES))
			};
		});
		/**
		* y² = x³ + ax + b: Short weierstrass curve formula
		* @returns y²
		*/
		function weierstrassEquation(x) {
			const { a, b } = CURVE;
			const x2 = Fp.sqr(x);
			const x3 = Fp.mul(x2, x);
			return Fp.add(Fp.add(x3, Fp.mul(x, a)), b);
		}
		if (!Fp.eql(Fp.sqr(CURVE.Gy), weierstrassEquation(CURVE.Gx))) throw new Error("bad generator point: equation left != right");
		function isWithinCurveOrder(num) {
			return typeof num === "bigint" && _0n < num && num < CURVE.n;
		}
		function assertGE(num) {
			if (!isWithinCurveOrder(num)) throw new Error("Expected valid bigint: 0 < bigint < curve.n");
		}
		function normPrivateKeyToScalar(key) {
			const { allowedPrivateKeyLengths: lengths, nByteLength, wrapPrivateKey, n } = CURVE;
			if (lengths && typeof key !== "bigint") {
				if (ut.isBytes(key)) key = ut.bytesToHex(key);
				if (typeof key !== "string" || !lengths.includes(key.length)) throw new Error("Invalid key");
				key = key.padStart(nByteLength * 2, "0");
			}
			let num;
			try {
				num = typeof key === "bigint" ? key : ut.bytesToNumberBE((0, utils_js_1.ensureBytes)("private key", key, nByteLength));
			} catch (error) {
				throw new Error(`private key must be ${nByteLength} bytes, hex or bigint, not ${typeof key}`);
			}
			if (wrapPrivateKey) num = mod.mod(num, n);
			assertGE(num);
			return num;
		}
		const pointPrecomputes = /* @__PURE__ */ new Map();
		function assertPrjPoint(other) {
			if (!(other instanceof Point)) throw new Error("ProjectivePoint expected");
		}
		/**
		* Projective Point works in 3d / projective (homogeneous) coordinates: (x, y, z) ∋ (x=x/z, y=y/z)
		* Default Point works in 2d / affine coordinates: (x, y)
		* We're doing calculations in projective, because its operations don't require costly inversion.
		*/
		class Point {
			constructor(px, py, pz) {
				this.px = px;
				this.py = py;
				this.pz = pz;
				if (px == null || !Fp.isValid(px)) throw new Error("x required");
				if (py == null || !Fp.isValid(py)) throw new Error("y required");
				if (pz == null || !Fp.isValid(pz)) throw new Error("z required");
			}
			static fromAffine(p) {
				const { x, y } = p || {};
				if (!p || !Fp.isValid(x) || !Fp.isValid(y)) throw new Error("invalid affine point");
				if (p instanceof Point) throw new Error("projective point not allowed");
				const is0 = (i) => Fp.eql(i, Fp.ZERO);
				if (is0(x) && is0(y)) return Point.ZERO;
				return new Point(x, y, Fp.ONE);
			}
			get x() {
				return this.toAffine().x;
			}
			get y() {
				return this.toAffine().y;
			}
			/**
			* Takes a bunch of Projective Points but executes only one
			* inversion on all of them. Inversion is very slow operation,
			* so this improves performance massively.
			* Optimization: converts a list of projective points to a list of identical points with Z=1.
			*/
			static normalizeZ(points) {
				const toInv = Fp.invertBatch(points.map((p) => p.pz));
				return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
			}
			/**
			* Converts hash string or Uint8Array to Point.
			* @param hex short/long ECDSA hex
			*/
			static fromHex(hex) {
				const P = Point.fromAffine(fromBytes((0, utils_js_1.ensureBytes)("pointHex", hex)));
				P.assertValidity();
				return P;
			}
			static fromPrivateKey(privateKey) {
				return Point.BASE.multiply(normPrivateKeyToScalar(privateKey));
			}
			_setWindowSize(windowSize) {
				this._WINDOW_SIZE = windowSize;
				pointPrecomputes.delete(this);
			}
			assertValidity() {
				if (this.is0()) {
					if (CURVE.allowInfinityPoint && !Fp.is0(this.py)) return;
					throw new Error("bad point: ZERO");
				}
				const { x, y } = this.toAffine();
				if (!Fp.isValid(x) || !Fp.isValid(y)) throw new Error("bad point: x or y not FE");
				const left = Fp.sqr(y);
				const right = weierstrassEquation(x);
				if (!Fp.eql(left, right)) throw new Error("bad point: equation left != right");
				if (!this.isTorsionFree()) throw new Error("bad point: not in prime-order subgroup");
			}
			hasEvenY() {
				const { y } = this.toAffine();
				if (Fp.isOdd) return !Fp.isOdd(y);
				throw new Error("Field doesn't support isOdd");
			}
			/**
			* Compare one point to another.
			*/
			equals(other) {
				assertPrjPoint(other);
				const { px: X1, py: Y1, pz: Z1 } = this;
				const { px: X2, py: Y2, pz: Z2 } = other;
				const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
				const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
				return U1 && U2;
			}
			/**
			* Flips point to one corresponding to (x, -y) in Affine coordinates.
			*/
			negate() {
				return new Point(this.px, Fp.neg(this.py), this.pz);
			}
			double() {
				const { a, b } = CURVE;
				const b3 = Fp.mul(b, _3n);
				const { px: X1, py: Y1, pz: Z1 } = this;
				let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
				let t0 = Fp.mul(X1, X1);
				let t1 = Fp.mul(Y1, Y1);
				let t2 = Fp.mul(Z1, Z1);
				let t3 = Fp.mul(X1, Y1);
				t3 = Fp.add(t3, t3);
				Z3 = Fp.mul(X1, Z1);
				Z3 = Fp.add(Z3, Z3);
				X3 = Fp.mul(a, Z3);
				Y3 = Fp.mul(b3, t2);
				Y3 = Fp.add(X3, Y3);
				X3 = Fp.sub(t1, Y3);
				Y3 = Fp.add(t1, Y3);
				Y3 = Fp.mul(X3, Y3);
				X3 = Fp.mul(t3, X3);
				Z3 = Fp.mul(b3, Z3);
				t2 = Fp.mul(a, t2);
				t3 = Fp.sub(t0, t2);
				t3 = Fp.mul(a, t3);
				t3 = Fp.add(t3, Z3);
				Z3 = Fp.add(t0, t0);
				t0 = Fp.add(Z3, t0);
				t0 = Fp.add(t0, t2);
				t0 = Fp.mul(t0, t3);
				Y3 = Fp.add(Y3, t0);
				t2 = Fp.mul(Y1, Z1);
				t2 = Fp.add(t2, t2);
				t0 = Fp.mul(t2, t3);
				X3 = Fp.sub(X3, t0);
				Z3 = Fp.mul(t2, t1);
				Z3 = Fp.add(Z3, Z3);
				Z3 = Fp.add(Z3, Z3);
				return new Point(X3, Y3, Z3);
			}
			add(other) {
				assertPrjPoint(other);
				const { px: X1, py: Y1, pz: Z1 } = this;
				const { px: X2, py: Y2, pz: Z2 } = other;
				let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
				const a = CURVE.a;
				const b3 = Fp.mul(CURVE.b, _3n);
				let t0 = Fp.mul(X1, X2);
				let t1 = Fp.mul(Y1, Y2);
				let t2 = Fp.mul(Z1, Z2);
				let t3 = Fp.add(X1, Y1);
				let t4 = Fp.add(X2, Y2);
				t3 = Fp.mul(t3, t4);
				t4 = Fp.add(t0, t1);
				t3 = Fp.sub(t3, t4);
				t4 = Fp.add(X1, Z1);
				let t5 = Fp.add(X2, Z2);
				t4 = Fp.mul(t4, t5);
				t5 = Fp.add(t0, t2);
				t4 = Fp.sub(t4, t5);
				t5 = Fp.add(Y1, Z1);
				X3 = Fp.add(Y2, Z2);
				t5 = Fp.mul(t5, X3);
				X3 = Fp.add(t1, t2);
				t5 = Fp.sub(t5, X3);
				Z3 = Fp.mul(a, t4);
				X3 = Fp.mul(b3, t2);
				Z3 = Fp.add(X3, Z3);
				X3 = Fp.sub(t1, Z3);
				Z3 = Fp.add(t1, Z3);
				Y3 = Fp.mul(X3, Z3);
				t1 = Fp.add(t0, t0);
				t1 = Fp.add(t1, t0);
				t2 = Fp.mul(a, t2);
				t4 = Fp.mul(b3, t4);
				t1 = Fp.add(t1, t2);
				t2 = Fp.sub(t0, t2);
				t2 = Fp.mul(a, t2);
				t4 = Fp.add(t4, t2);
				t0 = Fp.mul(t1, t4);
				Y3 = Fp.add(Y3, t0);
				t0 = Fp.mul(t5, t4);
				X3 = Fp.mul(t3, X3);
				X3 = Fp.sub(X3, t0);
				t0 = Fp.mul(t3, t1);
				Z3 = Fp.mul(t5, Z3);
				Z3 = Fp.add(Z3, t0);
				return new Point(X3, Y3, Z3);
			}
			subtract(other) {
				return this.add(other.negate());
			}
			is0() {
				return this.equals(Point.ZERO);
			}
			wNAF(n) {
				return wnaf.wNAFCached(this, pointPrecomputes, n, (comp) => {
					const toInv = Fp.invertBatch(comp.map((p) => p.pz));
					return comp.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
				});
			}
			/**
			* Non-constant-time multiplication. Uses double-and-add algorithm.
			* It's faster, but should only be used when you don't care about
			* an exposed private key e.g. sig verification, which works over *public* keys.
			*/
			multiplyUnsafe(n) {
				const I = Point.ZERO;
				if (n === _0n) return I;
				assertGE(n);
				if (n === _1n) return this;
				const { endo } = CURVE;
				if (!endo) return wnaf.unsafeLadder(this, n);
				let { k1neg, k1, k2neg, k2 } = endo.splitScalar(n);
				let k1p = I;
				let k2p = I;
				let d = this;
				while (k1 > _0n || k2 > _0n) {
					if (k1 & _1n) k1p = k1p.add(d);
					if (k2 & _1n) k2p = k2p.add(d);
					d = d.double();
					k1 >>= _1n;
					k2 >>= _1n;
				}
				if (k1neg) k1p = k1p.negate();
				if (k2neg) k2p = k2p.negate();
				k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
				return k1p.add(k2p);
			}
			/**
			* Constant time multiplication.
			* Uses wNAF method. Windowed method may be 10% faster,
			* but takes 2x longer to generate and consumes 2x memory.
			* Uses precomputes when available.
			* Uses endomorphism for Koblitz curves.
			* @param scalar by which the point would be multiplied
			* @returns New point
			*/
			multiply(scalar) {
				assertGE(scalar);
				let n = scalar;
				let point, fake;
				const { endo } = CURVE;
				if (endo) {
					const { k1neg, k1, k2neg, k2 } = endo.splitScalar(n);
					let { p: k1p, f: f1p } = this.wNAF(k1);
					let { p: k2p, f: f2p } = this.wNAF(k2);
					k1p = wnaf.constTimeNegate(k1neg, k1p);
					k2p = wnaf.constTimeNegate(k2neg, k2p);
					k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
					point = k1p.add(k2p);
					fake = f1p.add(f2p);
				} else {
					const { p, f } = this.wNAF(n);
					point = p;
					fake = f;
				}
				return Point.normalizeZ([point, fake])[0];
			}
			/**
			* Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
			* Not using Strauss-Shamir trick: precomputation tables are faster.
			* The trick could be useful if both P and Q are not G (not in our case).
			* @returns non-zero affine point
			*/
			multiplyAndAddUnsafe(Q, a, b) {
				const G = Point.BASE;
				const mul = (P, a) => a === _0n || a === _1n || !P.equals(G) ? P.multiplyUnsafe(a) : P.multiply(a);
				const sum = mul(this, a).add(mul(Q, b));
				return sum.is0() ? void 0 : sum;
			}
			toAffine(iz) {
				const { px: x, py: y, pz: z } = this;
				const is0 = this.is0();
				if (iz == null) iz = is0 ? Fp.ONE : Fp.inv(z);
				const ax = Fp.mul(x, iz);
				const ay = Fp.mul(y, iz);
				const zz = Fp.mul(z, iz);
				if (is0) return {
					x: Fp.ZERO,
					y: Fp.ZERO
				};
				if (!Fp.eql(zz, Fp.ONE)) throw new Error("invZ was invalid");
				return {
					x: ax,
					y: ay
				};
			}
			isTorsionFree() {
				const { h: cofactor, isTorsionFree } = CURVE;
				if (cofactor === _1n) return true;
				if (isTorsionFree) return isTorsionFree(Point, this);
				throw new Error("isTorsionFree() has not been declared for the elliptic curve");
			}
			clearCofactor() {
				const { h: cofactor, clearCofactor } = CURVE;
				if (cofactor === _1n) return this;
				if (clearCofactor) return clearCofactor(Point, this);
				return this.multiplyUnsafe(CURVE.h);
			}
			toRawBytes(isCompressed = true) {
				this.assertValidity();
				return toBytes(Point, this, isCompressed);
			}
			toHex(isCompressed = true) {
				return ut.bytesToHex(this.toRawBytes(isCompressed));
			}
		}
		Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
		Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
		const _bits = CURVE.nBitLength;
		const wnaf = (0, curve_js_1.wNAF)(Point, CURVE.endo ? Math.ceil(_bits / 2) : _bits);
		return {
			CURVE,
			ProjectivePoint: Point,
			normPrivateKeyToScalar,
			weierstrassEquation,
			isWithinCurveOrder
		};
	}
	function validateOpts(curve) {
		const opts = (0, curve_js_1.validateBasic)(curve);
		ut.validateObject(opts, {
			hash: "hash",
			hmac: "function",
			randomBytes: "function"
		}, {
			bits2int: "function",
			bits2int_modN: "function",
			lowS: "boolean"
		});
		return Object.freeze({
			lowS: true,
			...opts
		});
	}
	function weierstrass(curveDef) {
		const CURVE = validateOpts(curveDef);
		const { Fp, n: CURVE_ORDER } = CURVE;
		const compressedLen = Fp.BYTES + 1;
		const uncompressedLen = 2 * Fp.BYTES + 1;
		function isValidFieldElement(num) {
			return _0n < num && num < Fp.ORDER;
		}
		function modN(a) {
			return mod.mod(a, CURVE_ORDER);
		}
		function invN(a) {
			return mod.invert(a, CURVE_ORDER);
		}
		const { ProjectivePoint: Point, normPrivateKeyToScalar, weierstrassEquation, isWithinCurveOrder } = weierstrassPoints({
			...CURVE,
			toBytes(_c, point, isCompressed) {
				const a = point.toAffine();
				const x = Fp.toBytes(a.x);
				const cat = ut.concatBytes;
				if (isCompressed) return cat(Uint8Array.from([point.hasEvenY() ? 2 : 3]), x);
				else return cat(Uint8Array.from([4]), x, Fp.toBytes(a.y));
			},
			fromBytes(bytes) {
				const len = bytes.length;
				const head = bytes[0];
				const tail = bytes.subarray(1);
				if (len === compressedLen && (head === 2 || head === 3)) {
					const x = ut.bytesToNumberBE(tail);
					if (!isValidFieldElement(x)) throw new Error("Point is not on curve");
					const y2 = weierstrassEquation(x);
					let y;
					try {
						y = Fp.sqrt(y2);
					} catch (sqrtError) {
						const suffix = sqrtError instanceof Error ? ": " + sqrtError.message : "";
						throw new Error("Point is not on curve" + suffix);
					}
					const isYOdd = (y & _1n) === _1n;
					if ((head & 1) === 1 !== isYOdd) y = Fp.neg(y);
					return {
						x,
						y
					};
				} else if (len === uncompressedLen && head === 4) return {
					x: Fp.fromBytes(tail.subarray(0, Fp.BYTES)),
					y: Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES))
				};
				else throw new Error(`Point of length ${len} was invalid. Expected ${compressedLen} compressed bytes or ${uncompressedLen} uncompressed bytes`);
			}
		});
		const numToNByteStr = (num) => ut.bytesToHex(ut.numberToBytesBE(num, CURVE.nByteLength));
		function isBiggerThanHalfOrder(number) {
			return number > CURVE_ORDER >> _1n;
		}
		function normalizeS(s) {
			return isBiggerThanHalfOrder(s) ? modN(-s) : s;
		}
		const slcNum = (b, from, to) => ut.bytesToNumberBE(b.slice(from, to));
		/**
		* ECDSA signature with its (r, s) properties. Supports DER & compact representations.
		*/
		class Signature {
			constructor(r, s, recovery) {
				this.r = r;
				this.s = s;
				this.recovery = recovery;
				this.assertValidity();
			}
			static fromCompact(hex) {
				const l = CURVE.nByteLength;
				hex = (0, utils_js_1.ensureBytes)("compactSignature", hex, l * 2);
				return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
			}
			static fromDER(hex) {
				const { r, s } = exports.DER.toSig((0, utils_js_1.ensureBytes)("DER", hex));
				return new Signature(r, s);
			}
			assertValidity() {
				if (!isWithinCurveOrder(this.r)) throw new Error("r must be 0 < r < CURVE.n");
				if (!isWithinCurveOrder(this.s)) throw new Error("s must be 0 < s < CURVE.n");
			}
			addRecoveryBit(recovery) {
				return new Signature(this.r, this.s, recovery);
			}
			recoverPublicKey(msgHash) {
				const { r, s, recovery: rec } = this;
				const h = bits2int_modN((0, utils_js_1.ensureBytes)("msgHash", msgHash));
				if (rec == null || ![
					0,
					1,
					2,
					3
				].includes(rec)) throw new Error("recovery id invalid");
				const radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
				if (radj >= Fp.ORDER) throw new Error("recovery id 2 or 3 invalid");
				const prefix = (rec & 1) === 0 ? "02" : "03";
				const R = Point.fromHex(prefix + numToNByteStr(radj));
				const ir = invN(radj);
				const u1 = modN(-h * ir);
				const u2 = modN(s * ir);
				const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2);
				if (!Q) throw new Error("point at infinify");
				Q.assertValidity();
				return Q;
			}
			hasHighS() {
				return isBiggerThanHalfOrder(this.s);
			}
			normalizeS() {
				return this.hasHighS() ? new Signature(this.r, modN(-this.s), this.recovery) : this;
			}
			toDERRawBytes() {
				return ut.hexToBytes(this.toDERHex());
			}
			toDERHex() {
				return exports.DER.hexFromSig({
					r: this.r,
					s: this.s
				});
			}
			toCompactRawBytes() {
				return ut.hexToBytes(this.toCompactHex());
			}
			toCompactHex() {
				return numToNByteStr(this.r) + numToNByteStr(this.s);
			}
		}
		const utils = {
			isValidPrivateKey(privateKey) {
				try {
					normPrivateKeyToScalar(privateKey);
					return true;
				} catch (error) {
					return false;
				}
			},
			normPrivateKeyToScalar,
			/**
			* Produces cryptographically secure private key from random of size
			* (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
			*/
			randomPrivateKey: () => {
				const length = mod.getMinHashLength(CURVE.n);
				return mod.mapHashToField(CURVE.randomBytes(length), CURVE.n);
			},
			/**
			* Creates precompute table for an arbitrary EC point. Makes point "cached".
			* Allows to massively speed-up `point.multiply(scalar)`.
			* @returns cached point
			* @example
			* const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
			* fast.multiply(privKey); // much faster ECDH now
			*/
			precompute(windowSize = 8, point = Point.BASE) {
				point._setWindowSize(windowSize);
				point.multiply(BigInt(3));
				return point;
			}
		};
		/**
		* Computes public key for a private key. Checks for validity of the private key.
		* @param privateKey private key
		* @param isCompressed whether to return compact (default), or full key
		* @returns Public key, full when isCompressed=false; short when isCompressed=true
		*/
		function getPublicKey(privateKey, isCompressed = true) {
			return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
		}
		/**
		* Quick and dirty check for item being public key. Does not validate hex, or being on-curve.
		*/
		function isProbPub(item) {
			const arr = ut.isBytes(item);
			const str = typeof item === "string";
			const len = (arr || str) && item.length;
			if (arr) return len === compressedLen || len === uncompressedLen;
			if (str) return len === 2 * compressedLen || len === 2 * uncompressedLen;
			if (item instanceof Point) return true;
			return false;
		}
		/**
		* ECDH (Elliptic Curve Diffie Hellman).
		* Computes shared public key from private key and public key.
		* Checks: 1) private key validity 2) shared key is on-curve.
		* Does NOT hash the result.
		* @param privateA private key
		* @param publicB different public key
		* @param isCompressed whether to return compact (default), or full key
		* @returns shared public key
		*/
		function getSharedSecret(privateA, publicB, isCompressed = true) {
			if (isProbPub(privateA)) throw new Error("first arg must be private key");
			if (!isProbPub(publicB)) throw new Error("second arg must be public key");
			return Point.fromHex(publicB).multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
		}
		const bits2int = CURVE.bits2int || function(bytes) {
			const num = ut.bytesToNumberBE(bytes);
			const delta = bytes.length * 8 - CURVE.nBitLength;
			return delta > 0 ? num >> BigInt(delta) : num;
		};
		const bits2int_modN = CURVE.bits2int_modN || function(bytes) {
			return modN(bits2int(bytes));
		};
		const ORDER_MASK = ut.bitMask(CURVE.nBitLength);
		/**
		* Converts to bytes. Checks if num in `[0..ORDER_MASK-1]` e.g.: `[0..2^256-1]`.
		*/
		function int2octets(num) {
			if (typeof num !== "bigint") throw new Error("bigint expected");
			if (!(_0n <= num && num < ORDER_MASK)) throw new Error(`bigint expected < 2^${CURVE.nBitLength}`);
			return ut.numberToBytesBE(num, CURVE.nByteLength);
		}
		function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
			if (["recovered", "canonical"].some((k) => k in opts)) throw new Error("sign() legacy options not supported");
			const { hash, randomBytes } = CURVE;
			let { lowS, prehash, extraEntropy: ent } = opts;
			if (lowS == null) lowS = true;
			msgHash = (0, utils_js_1.ensureBytes)("msgHash", msgHash);
			if (prehash) msgHash = (0, utils_js_1.ensureBytes)("prehashed msgHash", hash(msgHash));
			const h1int = bits2int_modN(msgHash);
			const d = normPrivateKeyToScalar(privateKey);
			const seedArgs = [int2octets(d), int2octets(h1int)];
			if (ent != null && ent !== false) {
				const e = ent === true ? randomBytes(Fp.BYTES) : ent;
				seedArgs.push((0, utils_js_1.ensureBytes)("extraEntropy", e));
			}
			const seed = ut.concatBytes(...seedArgs);
			const m = h1int;
			function k2sig(kBytes) {
				const k = bits2int(kBytes);
				if (!isWithinCurveOrder(k)) return;
				const ik = invN(k);
				const q = Point.BASE.multiply(k).toAffine();
				const r = modN(q.x);
				if (r === _0n) return;
				const s = modN(ik * modN(m + r * d));
				if (s === _0n) return;
				let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n);
				let normS = s;
				if (lowS && isBiggerThanHalfOrder(s)) {
					normS = normalizeS(s);
					recovery ^= 1;
				}
				return new Signature(r, normS, recovery);
			}
			return {
				seed,
				k2sig
			};
		}
		const defaultSigOpts = {
			lowS: CURVE.lowS,
			prehash: false
		};
		const defaultVerOpts = {
			lowS: CURVE.lowS,
			prehash: false
		};
		/**
		* Signs message hash with a private key.
		* ```
		* sign(m, d, k) where
		*   (x, y) = G × k
		*   r = x mod n
		*   s = (m + dr)/k mod n
		* ```
		* @param msgHash NOT message. msg needs to be hashed to `msgHash`, or use `prehash`.
		* @param privKey private key
		* @param opts lowS for non-malleable sigs. extraEntropy for mixing randomness into k. prehash will hash first arg.
		* @returns signature with recovery param
		*/
		function sign(msgHash, privKey, opts = defaultSigOpts) {
			const { seed, k2sig } = prepSig(msgHash, privKey, opts);
			const C = CURVE;
			return ut.createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac)(seed, k2sig);
		}
		Point.BASE._setWindowSize(8);
		/**
		* Verifies a signature against message hash and public key.
		* Rejects lowS signatures by default: to override,
		* specify option `{lowS: false}`. Implements section 4.1.4 from https://www.secg.org/sec1-v2.pdf:
		*
		* ```
		* verify(r, s, h, P) where
		*   U1 = hs^-1 mod n
		*   U2 = rs^-1 mod n
		*   R = U1⋅G - U2⋅P
		*   mod(R.x, n) == r
		* ```
		*/
		function verify(signature, msgHash, publicKey, opts = defaultVerOpts) {
			const sg = signature;
			msgHash = (0, utils_js_1.ensureBytes)("msgHash", msgHash);
			publicKey = (0, utils_js_1.ensureBytes)("publicKey", publicKey);
			if ("strict" in opts) throw new Error("options.strict was renamed to lowS");
			const { lowS, prehash } = opts;
			let _sig = void 0;
			let P;
			try {
				if (typeof sg === "string" || ut.isBytes(sg)) try {
					_sig = Signature.fromDER(sg);
				} catch (derError) {
					if (!(derError instanceof exports.DER.Err)) throw derError;
					_sig = Signature.fromCompact(sg);
				}
				else if (typeof sg === "object" && typeof sg.r === "bigint" && typeof sg.s === "bigint") {
					const { r, s } = sg;
					_sig = new Signature(r, s);
				} else throw new Error("PARSE");
				P = Point.fromHex(publicKey);
			} catch (error) {
				if (error.message === "PARSE") throw new Error(`signature must be Signature instance, Uint8Array or hex string`);
				return false;
			}
			if (lowS && _sig.hasHighS()) return false;
			if (prehash) msgHash = CURVE.hash(msgHash);
			const { r, s } = _sig;
			const h = bits2int_modN(msgHash);
			const is = invN(s);
			const u1 = modN(h * is);
			const u2 = modN(r * is);
			const R = Point.BASE.multiplyAndAddUnsafe(P, u1, u2)?.toAffine();
			if (!R) return false;
			return modN(R.x) === r;
		}
		return {
			CURVE,
			getPublicKey,
			getSharedSecret,
			sign,
			verify,
			ProjectivePoint: Point,
			Signature,
			utils
		};
	}
	/**
	* Implementation of the Shallue and van de Woestijne method for any weierstrass curve.
	* TODO: check if there is a way to merge this with uvRatio in Edwards; move to modular.
	* b = True and y = sqrt(u / v) if (u / v) is square in F, and
	* b = False and y = sqrt(Z * (u / v)) otherwise.
	* @param Fp
	* @param Z
	* @returns
	*/
	function SWUFpSqrtRatio(Fp, Z) {
		const q = Fp.ORDER;
		let l = _0n;
		for (let o = q - _1n; o % _2n === _0n; o /= _2n) l += _1n;
		const c1 = l;
		const _2n_pow_c1_1 = _2n << c1 - _1n - _1n;
		const _2n_pow_c1 = _2n_pow_c1_1 * _2n;
		const c2 = (q - _1n) / _2n_pow_c1;
		const c3 = (c2 - _1n) / _2n;
		const c4 = _2n_pow_c1 - _1n;
		const c5 = _2n_pow_c1_1;
		const c6 = Fp.pow(Z, c2);
		const c7 = Fp.pow(Z, (c2 + _1n) / _2n);
		let sqrtRatio = (u, v) => {
			let tv1 = c6;
			let tv2 = Fp.pow(v, c4);
			let tv3 = Fp.sqr(tv2);
			tv3 = Fp.mul(tv3, v);
			let tv5 = Fp.mul(u, tv3);
			tv5 = Fp.pow(tv5, c3);
			tv5 = Fp.mul(tv5, tv2);
			tv2 = Fp.mul(tv5, v);
			tv3 = Fp.mul(tv5, u);
			let tv4 = Fp.mul(tv3, tv2);
			tv5 = Fp.pow(tv4, c5);
			let isQR = Fp.eql(tv5, Fp.ONE);
			tv2 = Fp.mul(tv3, c7);
			tv5 = Fp.mul(tv4, tv1);
			tv3 = Fp.cmov(tv2, tv3, isQR);
			tv4 = Fp.cmov(tv5, tv4, isQR);
			for (let i = c1; i > _1n; i--) {
				let tv5 = i - _2n;
				tv5 = _2n << tv5 - _1n;
				let tvv5 = Fp.pow(tv4, tv5);
				const e1 = Fp.eql(tvv5, Fp.ONE);
				tv2 = Fp.mul(tv3, tv1);
				tv1 = Fp.mul(tv1, tv1);
				tvv5 = Fp.mul(tv4, tv1);
				tv3 = Fp.cmov(tv2, tv3, e1);
				tv4 = Fp.cmov(tvv5, tv4, e1);
			}
			return {
				isValid: isQR,
				value: tv3
			};
		};
		if (Fp.ORDER % _4n === _3n) {
			const c1 = (Fp.ORDER - _3n) / _4n;
			const c2 = Fp.sqrt(Fp.neg(Z));
			sqrtRatio = (u, v) => {
				let tv1 = Fp.sqr(v);
				const tv2 = Fp.mul(u, v);
				tv1 = Fp.mul(tv1, tv2);
				let y1 = Fp.pow(tv1, c1);
				y1 = Fp.mul(y1, tv2);
				const y2 = Fp.mul(y1, c2);
				const tv3 = Fp.mul(Fp.sqr(y1), v);
				const isQR = Fp.eql(tv3, u);
				return {
					isValid: isQR,
					value: Fp.cmov(y2, y1, isQR)
				};
			};
		}
		return sqrtRatio;
	}
	/**
	* Simplified Shallue-van de Woestijne-Ulas Method
	* https://www.rfc-editor.org/rfc/rfc9380#section-6.6.2
	*/
	function mapToCurveSimpleSWU(Fp, opts) {
		mod.validateField(Fp);
		if (!Fp.isValid(opts.A) || !Fp.isValid(opts.B) || !Fp.isValid(opts.Z)) throw new Error("mapToCurveSimpleSWU: invalid opts");
		const sqrtRatio = SWUFpSqrtRatio(Fp, opts.Z);
		if (!Fp.isOdd) throw new Error("Fp.isOdd is not implemented!");
		return (u) => {
			let tv1, tv2, tv3, tv4, tv5, tv6, x, y;
			tv1 = Fp.sqr(u);
			tv1 = Fp.mul(tv1, opts.Z);
			tv2 = Fp.sqr(tv1);
			tv2 = Fp.add(tv2, tv1);
			tv3 = Fp.add(tv2, Fp.ONE);
			tv3 = Fp.mul(tv3, opts.B);
			tv4 = Fp.cmov(opts.Z, Fp.neg(tv2), !Fp.eql(tv2, Fp.ZERO));
			tv4 = Fp.mul(tv4, opts.A);
			tv2 = Fp.sqr(tv3);
			tv6 = Fp.sqr(tv4);
			tv5 = Fp.mul(tv6, opts.A);
			tv2 = Fp.add(tv2, tv5);
			tv2 = Fp.mul(tv2, tv3);
			tv6 = Fp.mul(tv6, tv4);
			tv5 = Fp.mul(tv6, opts.B);
			tv2 = Fp.add(tv2, tv5);
			x = Fp.mul(tv1, tv3);
			const { isValid, value } = sqrtRatio(tv2, tv6);
			y = Fp.mul(tv1, u);
			y = Fp.mul(y, value);
			x = Fp.cmov(x, tv3, isValid);
			y = Fp.cmov(y, value, isValid);
			const e1 = Fp.isOdd(u) === Fp.isOdd(y);
			y = Fp.cmov(Fp.neg(y), y, e1);
			x = Fp.div(x, tv4);
			return {
				x,
				y
			};
		};
	}
}));
//#endregion
//#region node_modules/@noble/curves/_shortw_utils.js
var require__shortw_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getHash = getHash;
	exports.createCurve = createCurve;
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	var hmac_1 = require_hmac();
	var utils_1 = require_utils$3();
	var weierstrass_js_1 = require_weierstrass();
	function getHash(hash) {
		return {
			hash,
			hmac: (key, ...msgs) => (0, hmac_1.hmac)(hash, key, (0, utils_1.concatBytes)(...msgs)),
			randomBytes: utils_1.randomBytes
		};
	}
	function createCurve(curveDef, defHash) {
		const create = (hash) => (0, weierstrass_js_1.weierstrass)({
			...curveDef,
			...getHash(hash)
		});
		return Object.freeze({
			...create(defHash),
			create
		});
	}
}));
//#endregion
//#region node_modules/@noble/curves/abstract/hash-to-curve.js
var require_hash_to_curve = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.expand_message_xmd = expand_message_xmd;
	exports.expand_message_xof = expand_message_xof;
	exports.hash_to_field = hash_to_field;
	exports.isogenyMap = isogenyMap;
	exports.createHasher = createHasher;
	var modular_js_1 = require_modular();
	var utils_js_1 = require_utils$2();
	var os2ip = utils_js_1.bytesToNumberBE;
	function i2osp(value, length) {
		if (value < 0 || value >= 1 << 8 * length) throw new Error(`bad I2OSP call: value=${value} length=${length}`);
		const res = Array.from({ length }).fill(0);
		for (let i = length - 1; i >= 0; i--) {
			res[i] = value & 255;
			value >>>= 8;
		}
		return new Uint8Array(res);
	}
	function strxor(a, b) {
		const arr = new Uint8Array(a.length);
		for (let i = 0; i < a.length; i++) arr[i] = a[i] ^ b[i];
		return arr;
	}
	function anum(item) {
		if (!Number.isSafeInteger(item)) throw new Error("number expected");
	}
	function expand_message_xmd(msg, DST, lenInBytes, H) {
		(0, utils_js_1.abytes)(msg);
		(0, utils_js_1.abytes)(DST);
		anum(lenInBytes);
		if (DST.length > 255) DST = H((0, utils_js_1.concatBytes)((0, utils_js_1.utf8ToBytes)("H2C-OVERSIZE-DST-"), DST));
		const { outputLen: b_in_bytes, blockLen: r_in_bytes } = H;
		const ell = Math.ceil(lenInBytes / b_in_bytes);
		if (ell > 255) throw new Error("Invalid xmd length");
		const DST_prime = (0, utils_js_1.concatBytes)(DST, i2osp(DST.length, 1));
		const Z_pad = i2osp(0, r_in_bytes);
		const l_i_b_str = i2osp(lenInBytes, 2);
		const b = new Array(ell);
		const b_0 = H((0, utils_js_1.concatBytes)(Z_pad, msg, l_i_b_str, i2osp(0, 1), DST_prime));
		b[0] = H((0, utils_js_1.concatBytes)(b_0, i2osp(1, 1), DST_prime));
		for (let i = 1; i <= ell; i++) {
			const args = [
				strxor(b_0, b[i - 1]),
				i2osp(i + 1, 1),
				DST_prime
			];
			b[i] = H((0, utils_js_1.concatBytes)(...args));
		}
		return (0, utils_js_1.concatBytes)(...b).slice(0, lenInBytes);
	}
	function expand_message_xof(msg, DST, lenInBytes, k, H) {
		(0, utils_js_1.abytes)(msg);
		(0, utils_js_1.abytes)(DST);
		anum(lenInBytes);
		if (DST.length > 255) {
			const dkLen = Math.ceil(2 * k / 8);
			DST = H.create({ dkLen }).update((0, utils_js_1.utf8ToBytes)("H2C-OVERSIZE-DST-")).update(DST).digest();
		}
		if (lenInBytes > 65535 || DST.length > 255) throw new Error("expand_message_xof: invalid lenInBytes");
		return H.create({ dkLen: lenInBytes }).update(msg).update(i2osp(lenInBytes, 2)).update(DST).update(i2osp(DST.length, 1)).digest();
	}
	/**
	* Hashes arbitrary-length byte strings to a list of one or more elements of a finite field F
	* https://www.rfc-editor.org/rfc/rfc9380#section-5.2
	* @param msg a byte string containing the message to hash
	* @param count the number of elements of F to output
	* @param options `{DST: string, p: bigint, m: number, k: number, expand: 'xmd' | 'xof', hash: H}`, see above
	* @returns [u_0, ..., u_(count - 1)], a list of field elements.
	*/
	function hash_to_field(msg, count, options) {
		(0, utils_js_1.validateObject)(options, {
			DST: "stringOrUint8Array",
			p: "bigint",
			m: "isSafeInteger",
			k: "isSafeInteger",
			hash: "hash"
		});
		const { p, k, m, hash, expand, DST: _DST } = options;
		(0, utils_js_1.abytes)(msg);
		anum(count);
		const DST = typeof _DST === "string" ? (0, utils_js_1.utf8ToBytes)(_DST) : _DST;
		const log2p = p.toString(2).length;
		const L = Math.ceil((log2p + k) / 8);
		const len_in_bytes = count * m * L;
		let prb;
		if (expand === "xmd") prb = expand_message_xmd(msg, DST, len_in_bytes, hash);
		else if (expand === "xof") prb = expand_message_xof(msg, DST, len_in_bytes, k, hash);
		else if (expand === "_internal_pass") prb = msg;
		else throw new Error("expand must be \"xmd\" or \"xof\"");
		const u = new Array(count);
		for (let i = 0; i < count; i++) {
			const e = new Array(m);
			for (let j = 0; j < m; j++) {
				const elm_offset = L * (j + i * m);
				const tv = prb.subarray(elm_offset, elm_offset + L);
				e[j] = (0, modular_js_1.mod)(os2ip(tv), p);
			}
			u[i] = e;
		}
		return u;
	}
	function isogenyMap(field, map) {
		const COEFF = map.map((i) => Array.from(i).reverse());
		return (x, y) => {
			const [xNum, xDen, yNum, yDen] = COEFF.map((val) => val.reduce((acc, i) => field.add(field.mul(acc, x), i)));
			x = field.div(xNum, xDen);
			y = field.mul(y, field.div(yNum, yDen));
			return {
				x,
				y
			};
		};
	}
	function createHasher(Point, mapToCurve, def) {
		if (typeof mapToCurve !== "function") throw new Error("mapToCurve() must be defined");
		return {
			hashToCurve(msg, options) {
				const u = hash_to_field(msg, 2, {
					...def,
					DST: def.DST,
					...options
				});
				const u0 = Point.fromAffine(mapToCurve(u[0]));
				const u1 = Point.fromAffine(mapToCurve(u[1]));
				const P = u0.add(u1).clearCofactor();
				P.assertValidity();
				return P;
			},
			encodeToCurve(msg, options) {
				const u = hash_to_field(msg, 1, {
					...def,
					DST: def.encodeDST,
					...options
				});
				const P = Point.fromAffine(mapToCurve(u[0])).clearCofactor();
				P.assertValidity();
				return P;
			},
			mapToCurve(scalars) {
				if (!Array.isArray(scalars)) throw new Error("mapToCurve: expected array of bigints");
				for (const i of scalars) if (typeof i !== "bigint") throw new Error(`mapToCurve: expected array of bigints, got ${i} in array`);
				const P = Point.fromAffine(mapToCurve(scalars)).clearCofactor();
				P.assertValidity();
				return P;
			}
		};
	}
}));
//#endregion
//#region node_modules/@noble/curves/secp256k1.js
var require_secp256k1$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.encodeToCurve = exports.hashToCurve = exports.schnorr = exports.secp256k1 = void 0;
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	var sha256_1 = require_sha256();
	var utils_1 = require_utils$3();
	var _shortw_utils_js_1 = require__shortw_utils();
	var hash_to_curve_js_1 = require_hash_to_curve();
	var modular_js_1 = require_modular();
	var utils_js_1 = require_utils$2();
	var weierstrass_js_1 = require_weierstrass();
	var secp256k1P = BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f");
	var secp256k1N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
	var _1n = BigInt(1);
	var _2n = BigInt(2);
	var divNearest = (a, b) => (a + b / _2n) / b;
	/**
	* √n = n^((p+1)/4) for fields p = 3 mod 4. We unwrap the loop and multiply bit-by-bit.
	* (P+1n/4n).toString(2) would produce bits [223x 1, 0, 22x 1, 4x 0, 11, 00]
	*/
	function sqrtMod(y) {
		const P = secp256k1P;
		const _3n = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
		const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
		const b2 = y * y * y % P;
		const b3 = b2 * b2 * y % P;
		const b6 = (0, modular_js_1.pow2)(b3, _3n, P) * b3 % P;
		const b9 = (0, modular_js_1.pow2)(b6, _3n, P) * b3 % P;
		const b11 = (0, modular_js_1.pow2)(b9, _2n, P) * b2 % P;
		const b22 = (0, modular_js_1.pow2)(b11, _11n, P) * b11 % P;
		const b44 = (0, modular_js_1.pow2)(b22, _22n, P) * b22 % P;
		const b88 = (0, modular_js_1.pow2)(b44, _44n, P) * b44 % P;
		const b176 = (0, modular_js_1.pow2)(b88, _88n, P) * b88 % P;
		const b220 = (0, modular_js_1.pow2)(b176, _44n, P) * b44 % P;
		const b223 = (0, modular_js_1.pow2)(b220, _3n, P) * b3 % P;
		const t1 = (0, modular_js_1.pow2)(b223, _23n, P) * b22 % P;
		const t2 = (0, modular_js_1.pow2)(t1, _6n, P) * b2 % P;
		const root = (0, modular_js_1.pow2)(t2, _2n, P);
		if (!Fp.eql(Fp.sqr(root), y)) throw new Error("Cannot find square root");
		return root;
	}
	var Fp = (0, modular_js_1.Field)(secp256k1P, void 0, void 0, { sqrt: sqrtMod });
	exports.secp256k1 = (0, _shortw_utils_js_1.createCurve)({
		a: BigInt(0),
		b: BigInt(7),
		Fp,
		n: secp256k1N,
		Gx: BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
		Gy: BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
		h: BigInt(1),
		lowS: true,
		/**
		* secp256k1 belongs to Koblitz curves: it has efficiently computable endomorphism.
		* Endomorphism uses 2x less RAM, speeds up precomputation by 2x and ECDH / key recovery by 20%.
		* For precomputed wNAF it trades off 1/2 init time & 1/3 ram for 20% perf hit.
		* Explanation: https://gist.github.com/paulmillr/eb670806793e84df628a7c434a873066
		*/
		endo: {
			beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
			splitScalar: (k) => {
				const n = secp256k1N;
				const a1 = BigInt("0x3086d221a7d46bcde86c90e49284eb15");
				const b1 = -_1n * BigInt("0xe4437ed6010e88286f547fa90abfe4c3");
				const a2 = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8");
				const b2 = a1;
				const POW_2_128 = BigInt("0x100000000000000000000000000000000");
				const c1 = divNearest(b2 * k, n);
				const c2 = divNearest(-b1 * k, n);
				let k1 = (0, modular_js_1.mod)(k - c1 * a1 - c2 * a2, n);
				let k2 = (0, modular_js_1.mod)(-c1 * b1 - c2 * b2, n);
				const k1neg = k1 > POW_2_128;
				const k2neg = k2 > POW_2_128;
				if (k1neg) k1 = n - k1;
				if (k2neg) k2 = n - k2;
				if (k1 > POW_2_128 || k2 > POW_2_128) throw new Error("splitScalar: Endomorphism failed, k=" + k);
				return {
					k1neg,
					k1,
					k2neg,
					k2
				};
			}
		}
	}, sha256_1.sha256);
	var _0n = BigInt(0);
	var fe = (x) => typeof x === "bigint" && _0n < x && x < secp256k1P;
	var ge = (x) => typeof x === "bigint" && _0n < x && x < secp256k1N;
	/** An object mapping tags to their tagged hash prefix of [SHA256(tag) | SHA256(tag)] */
	var TAGGED_HASH_PREFIXES = {};
	function taggedHash(tag, ...messages) {
		let tagP = TAGGED_HASH_PREFIXES[tag];
		if (tagP === void 0) {
			const tagH = (0, sha256_1.sha256)(Uint8Array.from(tag, (c) => c.charCodeAt(0)));
			tagP = (0, utils_js_1.concatBytes)(tagH, tagH);
			TAGGED_HASH_PREFIXES[tag] = tagP;
		}
		return (0, sha256_1.sha256)((0, utils_js_1.concatBytes)(tagP, ...messages));
	}
	var pointToBytes = (point) => point.toRawBytes(true).slice(1);
	var numTo32b = (n) => (0, utils_js_1.numberToBytesBE)(n, 32);
	var modP = (x) => (0, modular_js_1.mod)(x, secp256k1P);
	var modN = (x) => (0, modular_js_1.mod)(x, secp256k1N);
	var Point = exports.secp256k1.ProjectivePoint;
	var GmulAdd = (Q, a, b) => Point.BASE.multiplyAndAddUnsafe(Q, a, b);
	function schnorrGetExtPubKey(priv) {
		let d_ = exports.secp256k1.utils.normPrivateKeyToScalar(priv);
		let p = Point.fromPrivateKey(d_);
		return {
			scalar: p.hasEvenY() ? d_ : modN(-d_),
			bytes: pointToBytes(p)
		};
	}
	/**
	* lift_x from BIP340. Convert 32-byte x coordinate to elliptic curve point.
	* @returns valid point checked for being on-curve
	*/
	function lift_x(x) {
		if (!fe(x)) throw new Error("bad x: need 0 < x < p");
		let y = sqrtMod(modP(modP(x * x) * x + BigInt(7)));
		if (y % _2n !== _0n) y = modP(-y);
		const p = new Point(x, y, _1n);
		p.assertValidity();
		return p;
	}
	/**
	* Create tagged hash, convert it to bigint, reduce modulo-n.
	*/
	function challenge(...args) {
		return modN((0, utils_js_1.bytesToNumberBE)(taggedHash("BIP0340/challenge", ...args)));
	}
	/**
	* Schnorr public key is just `x` coordinate of Point as per BIP340.
	*/
	function schnorrGetPublicKey(privateKey) {
		return schnorrGetExtPubKey(privateKey).bytes;
	}
	/**
	* Creates Schnorr signature as per BIP340. Verifies itself before returning anything.
	* auxRand is optional and is not the sole source of k generation: bad CSPRNG won't be dangerous.
	*/
	function schnorrSign(message, privateKey, auxRand = (0, utils_1.randomBytes)(32)) {
		const m = (0, utils_js_1.ensureBytes)("message", message);
		const { bytes: px, scalar: d } = schnorrGetExtPubKey(privateKey);
		const a = (0, utils_js_1.ensureBytes)("auxRand", auxRand, 32);
		const rand = taggedHash("BIP0340/nonce", numTo32b(d ^ (0, utils_js_1.bytesToNumberBE)(taggedHash("BIP0340/aux", a))), px, m);
		const k_ = modN((0, utils_js_1.bytesToNumberBE)(rand));
		if (k_ === _0n) throw new Error("sign failed: k is zero");
		const { bytes: rx, scalar: k } = schnorrGetExtPubKey(k_);
		const e = challenge(rx, px, m);
		const sig = /* @__PURE__ */ new Uint8Array(64);
		sig.set(rx, 0);
		sig.set(numTo32b(modN(k + e * d)), 32);
		if (!schnorrVerify(sig, m, px)) throw new Error("sign: Invalid signature produced");
		return sig;
	}
	/**
	* Verifies Schnorr signature.
	* Will swallow errors & return false except for initial type validation of arguments.
	*/
	function schnorrVerify(signature, message, publicKey) {
		const sig = (0, utils_js_1.ensureBytes)("signature", signature, 64);
		const m = (0, utils_js_1.ensureBytes)("message", message);
		const pub = (0, utils_js_1.ensureBytes)("publicKey", publicKey, 32);
		try {
			const P = lift_x((0, utils_js_1.bytesToNumberBE)(pub));
			const r = (0, utils_js_1.bytesToNumberBE)(sig.subarray(0, 32));
			if (!fe(r)) return false;
			const s = (0, utils_js_1.bytesToNumberBE)(sig.subarray(32, 64));
			if (!ge(s)) return false;
			const R = GmulAdd(P, s, modN(-challenge(numTo32b(r), pointToBytes(P), m)));
			if (!R || !R.hasEvenY() || R.toAffine().x !== r) return false;
			return true;
		} catch (error) {
			return false;
		}
	}
	exports.schnorr = (() => ({
		getPublicKey: schnorrGetPublicKey,
		sign: schnorrSign,
		verify: schnorrVerify,
		utils: {
			randomPrivateKey: exports.secp256k1.utils.randomPrivateKey,
			lift_x,
			pointToBytes,
			numberToBytesBE: utils_js_1.numberToBytesBE,
			bytesToNumberBE: utils_js_1.bytesToNumberBE,
			taggedHash,
			mod: modular_js_1.mod
		}
	}))();
	var isoMap = /* @__PURE__ */ (() => (0, hash_to_curve_js_1.isogenyMap)(Fp, [
		[
			"0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa8c7",
			"0x7d3d4c80bc321d5b9f315cea7fd44c5d595d2fc0bf63b92dfff1044f17c6581",
			"0x534c328d23f234e6e2a413deca25caece4506144037c40314ecbd0b53d9dd262",
			"0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa88c"
		],
		[
			"0xd35771193d94918a9ca34ccbb7b640dd86cd409542f8487d9fe6b745781eb49b",
			"0xedadc6f64383dc1df7c4b2d51b54225406d36b641f5e41bbc52a56612a8c6d14",
			"0x0000000000000000000000000000000000000000000000000000000000000001"
		],
		[
			"0x4bda12f684bda12f684bda12f684bda12f684bda12f684bda12f684b8e38e23c",
			"0xc75e0c32d5cb7c0fa9d0a54b12a0a6d5647ab046d686da6fdffc90fc201d71a3",
			"0x29a6194691f91a73715209ef6512e576722830a201be2018a765e85a9ecee931",
			"0x2f684bda12f684bda12f684bda12f684bda12f684bda12f684bda12f38e38d84"
		],
		[
			"0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffff93b",
			"0x7a06534bb8bdb49fd5e9e6632722c2989467c1bfc8e8d978dfb425d2685c2573",
			"0x6484aa716545ca2cf3a70c3fa8fe337e0a3d21162f0d6299a7bf8192bfd2a76f",
			"0x0000000000000000000000000000000000000000000000000000000000000001"
		]
	].map((i) => i.map((j) => BigInt(j)))))();
	var mapSWU = /* @__PURE__ */ (() => (0, weierstrass_js_1.mapToCurveSimpleSWU)(Fp, {
		A: BigInt("0x3f8731abdd661adca08a5558f0f5d272e953d363cb6f0e5d405447c01a444533"),
		B: BigInt("1771"),
		Z: Fp.create(BigInt("-11"))
	}))();
	var htf = /* @__PURE__ */ (() => (0, hash_to_curve_js_1.createHasher)(exports.secp256k1.ProjectivePoint, (scalars) => {
		const { x, y } = mapSWU(Fp.create(scalars[0]));
		return isoMap(x, y);
	}, {
		DST: "secp256k1_XMD:SHA-256_SSWU_RO_",
		encodeDST: "secp256k1_XMD:SHA-256_SSWU_NU_",
		p: Fp.ORDER,
		m: 1,
		k: 128,
		expand: "xmd",
		hash: sha256_1.sha256
	}))();
	exports.hashToCurve = (() => htf.hashToCurve)();
	exports.encodeToCurve = (() => htf.encodeToCurve)();
}));
//#endregion
//#region node_modules/ethereum-cryptography/secp256k1.js
var require_secp256k1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.secp256k1 = void 0;
	var secp256k1_1 = require_secp256k1$1();
	Object.defineProperty(exports, "secp256k1", {
		enumerable: true,
		get: function() {
			return secp256k1_1.secp256k1;
		}
	});
}));
//#endregion
//#region node_modules/@ethereumjs/util/dist/constants.js
var require_constants = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.MAX_WITHDRAWALS_PER_PAYLOAD = exports.RLP_EMPTY_STRING = exports.KECCAK256_RLP = exports.KECCAK256_RLP_S = exports.KECCAK256_RLP_ARRAY = exports.KECCAK256_RLP_ARRAY_S = exports.KECCAK256_NULL = exports.KECCAK256_NULL_S = exports.TWO_POW256 = exports.SECP256K1_ORDER_DIV_2 = exports.SECP256K1_ORDER = exports.MAX_INTEGER_BIGINT = exports.MAX_INTEGER = exports.MAX_UINT64 = void 0;
	var buffer_1 = __require("buffer");
	var secp256k1_1 = require_secp256k1();
	/**
	* 2^64-1
	*/
	exports.MAX_UINT64 = BigInt("0xffffffffffffffff");
	/**
	* The max integer that the evm can handle (2^256-1)
	*/
	exports.MAX_INTEGER = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
	/**
	* The max integer that the evm can handle (2^256-1) as a bigint
	* 2^256-1 equals to 340282366920938463463374607431768211455
	* We use literal value instead of calculated value for compatibility issue.
	*/
	exports.MAX_INTEGER_BIGINT = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");
	exports.SECP256K1_ORDER = secp256k1_1.secp256k1.CURVE.n;
	exports.SECP256K1_ORDER_DIV_2 = secp256k1_1.secp256k1.CURVE.n / BigInt(2);
	/**
	* 2^256
	*/
	exports.TWO_POW256 = BigInt("0x10000000000000000000000000000000000000000000000000000000000000000");
	/**
	* Keccak-256 hash of null
	*/
	exports.KECCAK256_NULL_S = "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
	/**
	* Keccak-256 hash of null
	*/
	exports.KECCAK256_NULL = buffer_1.Buffer.from(exports.KECCAK256_NULL_S, "hex");
	/**
	* Keccak-256 of an RLP of an empty array
	*/
	exports.KECCAK256_RLP_ARRAY_S = "1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347";
	/**
	* Keccak-256 of an RLP of an empty array
	*/
	exports.KECCAK256_RLP_ARRAY = buffer_1.Buffer.from(exports.KECCAK256_RLP_ARRAY_S, "hex");
	/**
	* Keccak-256 hash of the RLP of null
	*/
	exports.KECCAK256_RLP_S = "56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421";
	/**
	* Keccak-256 hash of the RLP of null
	*/
	exports.KECCAK256_RLP = buffer_1.Buffer.from(exports.KECCAK256_RLP_S, "hex");
	/**
	*  RLP encoded empty string
	*/
	exports.RLP_EMPTY_STRING = buffer_1.Buffer.from([128]);
	exports.MAX_WITHDRAWALS_PER_PAYLOAD = 16;
}));
//#endregion
//#region node_modules/@ethereumjs/util/dist/units.js
var require_units = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.GWEI_TO_WEI = void 0;
	/** Easy conversion from Gwei to wei */
	exports.GWEI_TO_WEI = BigInt(1e9);
}));
//#endregion
//#region node_modules/ethereum-cryptography/node_modules/@noble/hashes/_assert.js
var require__assert = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.output = exports.exists = exports.hash = exports.bytes = exports.bool = exports.number = exports.isBytes = void 0;
	function number(n) {
		if (!Number.isSafeInteger(n) || n < 0) throw new Error(`positive integer expected, not ${n}`);
	}
	exports.number = number;
	function bool(b) {
		if (typeof b !== "boolean") throw new Error(`boolean expected, not ${b}`);
	}
	exports.bool = bool;
	function isBytes(a) {
		return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
	}
	exports.isBytes = isBytes;
	function bytes(b, ...lengths) {
		if (!isBytes(b)) throw new Error("Uint8Array expected");
		if (lengths.length > 0 && !lengths.includes(b.length)) throw new Error(`Uint8Array expected of length ${lengths}, not of length=${b.length}`);
	}
	exports.bytes = bytes;
	function hash(h) {
		if (typeof h !== "function" || typeof h.create !== "function") throw new Error("Hash should be wrapped by utils.wrapConstructor");
		number(h.outputLen);
		number(h.blockLen);
	}
	exports.hash = hash;
	function exists(instance, checkFinished = true) {
		if (instance.destroyed) throw new Error("Hash instance has been destroyed");
		if (checkFinished && instance.finished) throw new Error("Hash#digest() has already been called");
	}
	exports.exists = exists;
	function output(out, instance) {
		bytes(out);
		const min = instance.outputLen;
		if (out.length < min) throw new Error(`digestInto() expects output buffer of length at least ${min}`);
	}
	exports.output = output;
	exports.default = {
		number,
		bool,
		bytes,
		hash,
		exists,
		output
	};
}));
//#endregion
//#region node_modules/ethereum-cryptography/node_modules/@noble/hashes/_u64.js
var require__u64 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.add5L = exports.add5H = exports.add4H = exports.add4L = exports.add3H = exports.add3L = exports.add = exports.rotlBL = exports.rotlBH = exports.rotlSL = exports.rotlSH = exports.rotr32L = exports.rotr32H = exports.rotrBL = exports.rotrBH = exports.rotrSL = exports.rotrSH = exports.shrSL = exports.shrSH = exports.toBig = exports.split = exports.fromBig = void 0;
	var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
	var _32n = /* @__PURE__ */ BigInt(32);
	function fromBig(n, le = false) {
		if (le) return {
			h: Number(n & U32_MASK64),
			l: Number(n >> _32n & U32_MASK64)
		};
		return {
			h: Number(n >> _32n & U32_MASK64) | 0,
			l: Number(n & U32_MASK64) | 0
		};
	}
	exports.fromBig = fromBig;
	function split(lst, le = false) {
		let Ah = new Uint32Array(lst.length);
		let Al = new Uint32Array(lst.length);
		for (let i = 0; i < lst.length; i++) {
			const { h, l } = fromBig(lst[i], le);
			[Ah[i], Al[i]] = [h, l];
		}
		return [Ah, Al];
	}
	exports.split = split;
	var toBig = (h, l) => BigInt(h >>> 0) << _32n | BigInt(l >>> 0);
	exports.toBig = toBig;
	var shrSH = (h, _l, s) => h >>> s;
	exports.shrSH = shrSH;
	var shrSL = (h, l, s) => h << 32 - s | l >>> s;
	exports.shrSL = shrSL;
	var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
	exports.rotrSH = rotrSH;
	var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
	exports.rotrSL = rotrSL;
	var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
	exports.rotrBH = rotrBH;
	var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
	exports.rotrBL = rotrBL;
	var rotr32H = (_h, l) => l;
	exports.rotr32H = rotr32H;
	var rotr32L = (h, _l) => h;
	exports.rotr32L = rotr32L;
	var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
	exports.rotlSH = rotlSH;
	var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
	exports.rotlSL = rotlSL;
	var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
	exports.rotlBH = rotlBH;
	var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
	exports.rotlBL = rotlBL;
	function add(Ah, Al, Bh, Bl) {
		const l = (Al >>> 0) + (Bl >>> 0);
		return {
			h: Ah + Bh + (l / 2 ** 32 | 0) | 0,
			l: l | 0
		};
	}
	exports.add = add;
	var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
	exports.add3L = add3L;
	var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
	exports.add3H = add3H;
	var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
	exports.add4L = add4L;
	var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
	exports.add4H = add4H;
	var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
	exports.add5L = add5L;
	var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
	exports.add5H = add5H;
	exports.default = {
		fromBig,
		split,
		toBig,
		shrSH,
		shrSL,
		rotrSH,
		rotrSL,
		rotrBH,
		rotrBL,
		rotr32H,
		rotr32L,
		rotlSH,
		rotlSL,
		rotlBH,
		rotlBL,
		add,
		add3L,
		add3H,
		add4L,
		add4H,
		add5H,
		add5L
	};
}));
//#endregion
//#region node_modules/ethereum-cryptography/node_modules/@noble/hashes/cryptoNode.js
var require_cryptoNode = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.crypto = void 0;
	var nc = __require("node:crypto");
	exports.crypto = nc && typeof nc === "object" && "webcrypto" in nc ? nc.webcrypto : void 0;
}));
//#endregion
//#region node_modules/ethereum-cryptography/node_modules/@noble/hashes/utils.js
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.randomBytes = exports.wrapXOFConstructorWithOpts = exports.wrapConstructorWithOpts = exports.wrapConstructor = exports.checkOpts = exports.Hash = exports.concatBytes = exports.toBytes = exports.utf8ToBytes = exports.asyncLoop = exports.nextTick = exports.hexToBytes = exports.bytesToHex = exports.byteSwap32 = exports.byteSwapIfBE = exports.byteSwap = exports.isLE = exports.rotl = exports.rotr = exports.createView = exports.u32 = exports.u8 = exports.isBytes = void 0;
	var crypto_1 = require_cryptoNode();
	var _assert_js_1 = require__assert();
	function isBytes(a) {
		return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
	}
	exports.isBytes = isBytes;
	var u8 = (arr) => new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
	exports.u8 = u8;
	var u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
	exports.u32 = u32;
	var createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
	exports.createView = createView;
	var rotr = (word, shift) => word << 32 - shift | word >>> shift;
	exports.rotr = rotr;
	var rotl = (word, shift) => word << shift | word >>> 32 - shift >>> 0;
	exports.rotl = rotl;
	exports.isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
	var byteSwap = (word) => word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
	exports.byteSwap = byteSwap;
	exports.byteSwapIfBE = exports.isLE ? (n) => n : (n) => (0, exports.byteSwap)(n);
	function byteSwap32(arr) {
		for (let i = 0; i < arr.length; i++) arr[i] = (0, exports.byteSwap)(arr[i]);
	}
	exports.byteSwap32 = byteSwap32;
	var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
	/**
	* @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
	*/
	function bytesToHex(bytes) {
		(0, _assert_js_1.bytes)(bytes);
		let hex = "";
		for (let i = 0; i < bytes.length; i++) hex += hexes[bytes[i]];
		return hex;
	}
	exports.bytesToHex = bytesToHex;
	var asciis = {
		_0: 48,
		_9: 57,
		_A: 65,
		_F: 70,
		_a: 97,
		_f: 102
	};
	function asciiToBase16(char) {
		if (char >= asciis._0 && char <= asciis._9) return char - asciis._0;
		if (char >= asciis._A && char <= asciis._F) return char - (asciis._A - 10);
		if (char >= asciis._a && char <= asciis._f) return char - (asciis._a - 10);
	}
	/**
	* @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
	*/
	function hexToBytes(hex) {
		if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
		const hl = hex.length;
		const al = hl / 2;
		if (hl % 2) throw new Error("padded hex string expected, got unpadded hex of length " + hl);
		const array = new Uint8Array(al);
		for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
			const n1 = asciiToBase16(hex.charCodeAt(hi));
			const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
			if (n1 === void 0 || n2 === void 0) {
				const char = hex[hi] + hex[hi + 1];
				throw new Error("hex string expected, got non-hex character \"" + char + "\" at index " + hi);
			}
			array[ai] = n1 * 16 + n2;
		}
		return array;
	}
	exports.hexToBytes = hexToBytes;
	var nextTick = async () => {};
	exports.nextTick = nextTick;
	async function asyncLoop(iters, tick, cb) {
		let ts = Date.now();
		for (let i = 0; i < iters; i++) {
			cb(i);
			const diff = Date.now() - ts;
			if (diff >= 0 && diff < tick) continue;
			await (0, exports.nextTick)();
			ts += diff;
		}
	}
	exports.asyncLoop = asyncLoop;
	/**
	* @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
	*/
	function utf8ToBytes(str) {
		if (typeof str !== "string") throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
		return new Uint8Array(new TextEncoder().encode(str));
	}
	exports.utf8ToBytes = utf8ToBytes;
	/**
	* Normalizes (non-hex) string or Uint8Array to Uint8Array.
	* Warning: when Uint8Array is passed, it would NOT get copied.
	* Keep in mind for future mutable operations.
	*/
	function toBytes(data) {
		if (typeof data === "string") data = utf8ToBytes(data);
		(0, _assert_js_1.bytes)(data);
		return data;
	}
	exports.toBytes = toBytes;
	/**
	* Copies several Uint8Arrays into one.
	*/
	function concatBytes(...arrays) {
		let sum = 0;
		for (let i = 0; i < arrays.length; i++) {
			const a = arrays[i];
			(0, _assert_js_1.bytes)(a);
			sum += a.length;
		}
		const res = new Uint8Array(sum);
		for (let i = 0, pad = 0; i < arrays.length; i++) {
			const a = arrays[i];
			res.set(a, pad);
			pad += a.length;
		}
		return res;
	}
	exports.concatBytes = concatBytes;
	var Hash = class {
		clone() {
			return this._cloneInto();
		}
	};
	exports.Hash = Hash;
	var toStr = {}.toString;
	function checkOpts(defaults, opts) {
		if (opts !== void 0 && toStr.call(opts) !== "[object Object]") throw new Error("Options should be object or undefined");
		return Object.assign(defaults, opts);
	}
	exports.checkOpts = checkOpts;
	function wrapConstructor(hashCons) {
		const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
		const tmp = hashCons();
		hashC.outputLen = tmp.outputLen;
		hashC.blockLen = tmp.blockLen;
		hashC.create = () => hashCons();
		return hashC;
	}
	exports.wrapConstructor = wrapConstructor;
	function wrapConstructorWithOpts(hashCons) {
		const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
		const tmp = hashCons({});
		hashC.outputLen = tmp.outputLen;
		hashC.blockLen = tmp.blockLen;
		hashC.create = (opts) => hashCons(opts);
		return hashC;
	}
	exports.wrapConstructorWithOpts = wrapConstructorWithOpts;
	function wrapXOFConstructorWithOpts(hashCons) {
		const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
		const tmp = hashCons({});
		hashC.outputLen = tmp.outputLen;
		hashC.blockLen = tmp.blockLen;
		hashC.create = (opts) => hashCons(opts);
		return hashC;
	}
	exports.wrapXOFConstructorWithOpts = wrapXOFConstructorWithOpts;
	/**
	* Secure PRNG. Uses `crypto.getRandomValues`, which defers to OS.
	*/
	function randomBytes(bytesLength = 32) {
		if (crypto_1.crypto && typeof crypto_1.crypto.getRandomValues === "function") return crypto_1.crypto.getRandomValues(new Uint8Array(bytesLength));
		throw new Error("crypto.getRandomValues must be defined");
	}
	exports.randomBytes = randomBytes;
}));
//#endregion
//#region node_modules/ethereum-cryptography/node_modules/@noble/hashes/sha3.js
var require_sha3 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.shake256 = exports.shake128 = exports.keccak_512 = exports.keccak_384 = exports.keccak_256 = exports.keccak_224 = exports.sha3_512 = exports.sha3_384 = exports.sha3_256 = exports.sha3_224 = exports.Keccak = exports.keccakP = void 0;
	var _assert_js_1 = require__assert();
	var _u64_js_1 = require__u64();
	var utils_js_1 = require_utils$1();
	var SHA3_PI = [];
	var SHA3_ROTL = [];
	var _SHA3_IOTA = [];
	var _0n = /* @__PURE__ */ BigInt(0);
	var _1n = /* @__PURE__ */ BigInt(1);
	var _2n = /* @__PURE__ */ BigInt(2);
	var _7n = /* @__PURE__ */ BigInt(7);
	var _256n = /* @__PURE__ */ BigInt(256);
	var _0x71n = /* @__PURE__ */ BigInt(113);
	for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
		[x, y] = [y, (2 * x + 3 * y) % 5];
		SHA3_PI.push(2 * (5 * y + x));
		SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
		let t = _0n;
		for (let j = 0; j < 7; j++) {
			R = (R << _1n ^ (R >> _7n) * _0x71n) % _256n;
			if (R & _2n) t ^= _1n << (_1n << /* @__PURE__ */ BigInt(j)) - _1n;
		}
		_SHA3_IOTA.push(t);
	}
	var [SHA3_IOTA_H, SHA3_IOTA_L] = /* @__PURE__ */ (0, _u64_js_1.split)(_SHA3_IOTA, true);
	var rotlH = (h, l, s) => s > 32 ? (0, _u64_js_1.rotlBH)(h, l, s) : (0, _u64_js_1.rotlSH)(h, l, s);
	var rotlL = (h, l, s) => s > 32 ? (0, _u64_js_1.rotlBL)(h, l, s) : (0, _u64_js_1.rotlSL)(h, l, s);
	function keccakP(s, rounds = 24) {
		const B = /* @__PURE__ */ new Uint32Array(10);
		for (let round = 24 - rounds; round < 24; round++) {
			for (let x = 0; x < 10; x++) B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
			for (let x = 0; x < 10; x += 2) {
				const idx1 = (x + 8) % 10;
				const idx0 = (x + 2) % 10;
				const B0 = B[idx0];
				const B1 = B[idx0 + 1];
				const Th = rotlH(B0, B1, 1) ^ B[idx1];
				const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
				for (let y = 0; y < 50; y += 10) {
					s[x + y] ^= Th;
					s[x + y + 1] ^= Tl;
				}
			}
			let curH = s[2];
			let curL = s[3];
			for (let t = 0; t < 24; t++) {
				const shift = SHA3_ROTL[t];
				const Th = rotlH(curH, curL, shift);
				const Tl = rotlL(curH, curL, shift);
				const PI = SHA3_PI[t];
				curH = s[PI];
				curL = s[PI + 1];
				s[PI] = Th;
				s[PI + 1] = Tl;
			}
			for (let y = 0; y < 50; y += 10) {
				for (let x = 0; x < 10; x++) B[x] = s[y + x];
				for (let x = 0; x < 10; x++) s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
			}
			s[0] ^= SHA3_IOTA_H[round];
			s[1] ^= SHA3_IOTA_L[round];
		}
		B.fill(0);
	}
	exports.keccakP = keccakP;
	var Keccak = class Keccak extends utils_js_1.Hash {
		constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
			super();
			this.blockLen = blockLen;
			this.suffix = suffix;
			this.outputLen = outputLen;
			this.enableXOF = enableXOF;
			this.rounds = rounds;
			this.pos = 0;
			this.posOut = 0;
			this.finished = false;
			this.destroyed = false;
			(0, _assert_js_1.number)(outputLen);
			if (0 >= this.blockLen || this.blockLen >= 200) throw new Error("Sha3 supports only keccak-f1600 function");
			this.state = /* @__PURE__ */ new Uint8Array(200);
			this.state32 = (0, utils_js_1.u32)(this.state);
		}
		keccak() {
			if (!utils_js_1.isLE) (0, utils_js_1.byteSwap32)(this.state32);
			keccakP(this.state32, this.rounds);
			if (!utils_js_1.isLE) (0, utils_js_1.byteSwap32)(this.state32);
			this.posOut = 0;
			this.pos = 0;
		}
		update(data) {
			(0, _assert_js_1.exists)(this);
			const { blockLen, state } = this;
			data = (0, utils_js_1.toBytes)(data);
			const len = data.length;
			for (let pos = 0; pos < len;) {
				const take = Math.min(blockLen - this.pos, len - pos);
				for (let i = 0; i < take; i++) state[this.pos++] ^= data[pos++];
				if (this.pos === blockLen) this.keccak();
			}
			return this;
		}
		finish() {
			if (this.finished) return;
			this.finished = true;
			const { state, suffix, pos, blockLen } = this;
			state[pos] ^= suffix;
			if ((suffix & 128) !== 0 && pos === blockLen - 1) this.keccak();
			state[blockLen - 1] ^= 128;
			this.keccak();
		}
		writeInto(out) {
			(0, _assert_js_1.exists)(this, false);
			(0, _assert_js_1.bytes)(out);
			this.finish();
			const bufferOut = this.state;
			const { blockLen } = this;
			for (let pos = 0, len = out.length; pos < len;) {
				if (this.posOut >= blockLen) this.keccak();
				const take = Math.min(blockLen - this.posOut, len - pos);
				out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
				this.posOut += take;
				pos += take;
			}
			return out;
		}
		xofInto(out) {
			if (!this.enableXOF) throw new Error("XOF is not possible for this instance");
			return this.writeInto(out);
		}
		xof(bytes) {
			(0, _assert_js_1.number)(bytes);
			return this.xofInto(new Uint8Array(bytes));
		}
		digestInto(out) {
			(0, _assert_js_1.output)(out, this);
			if (this.finished) throw new Error("digest() was already called");
			this.writeInto(out);
			this.destroy();
			return out;
		}
		digest() {
			return this.digestInto(new Uint8Array(this.outputLen));
		}
		destroy() {
			this.destroyed = true;
			this.state.fill(0);
		}
		_cloneInto(to) {
			const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
			to || (to = new Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
			to.state32.set(this.state32);
			to.pos = this.pos;
			to.posOut = this.posOut;
			to.finished = this.finished;
			to.rounds = rounds;
			to.suffix = suffix;
			to.outputLen = outputLen;
			to.enableXOF = enableXOF;
			to.destroyed = this.destroyed;
			return to;
		}
	};
	exports.Keccak = Keccak;
	var gen = (suffix, blockLen, outputLen) => (0, utils_js_1.wrapConstructor)(() => new Keccak(blockLen, suffix, outputLen));
	exports.sha3_224 = gen(6, 144, 28);
	/**
	* SHA3-256 hash function
	* @param message - that would be hashed
	*/
	exports.sha3_256 = gen(6, 136, 32);
	exports.sha3_384 = gen(6, 104, 48);
	exports.sha3_512 = gen(6, 72, 64);
	exports.keccak_224 = gen(1, 144, 28);
	/**
	* keccak-256 hash function. Different from SHA3-256.
	* @param message - that would be hashed
	*/
	exports.keccak_256 = gen(1, 136, 32);
	exports.keccak_384 = gen(1, 104, 48);
	exports.keccak_512 = gen(1, 72, 64);
	var genShake = (suffix, blockLen, outputLen) => (0, utils_js_1.wrapXOFConstructorWithOpts)((opts = {}) => new Keccak(blockLen, suffix, opts.dkLen === void 0 ? outputLen : opts.dkLen, true));
	exports.shake128 = genShake(31, 168, 16);
	exports.shake256 = genShake(31, 136, 32);
}));
//#endregion
//#region node_modules/ethereum-cryptography/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var __importDefault = exports && exports.__importDefault || function(mod) {
		return mod && mod.__esModule ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.crypto = exports.utf8ToBytes = exports.createView = exports.concatBytes = exports.toHex = exports.bytesToHex = exports.assertBytes = exports.assertBool = void 0;
	exports.bytesToUtf8 = bytesToUtf8;
	exports.hexToBytes = hexToBytes;
	exports.equalsBytes = equalsBytes;
	exports.wrapHash = wrapHash;
	var _assert_1 = __importDefault(require__assert());
	var utils_1 = require_utils$1();
	exports.assertBool = _assert_1.default.bool;
	exports.assertBytes = _assert_1.default.bytes;
	var utils_2 = require_utils$1();
	Object.defineProperty(exports, "bytesToHex", {
		enumerable: true,
		get: function() {
			return utils_2.bytesToHex;
		}
	});
	Object.defineProperty(exports, "toHex", {
		enumerable: true,
		get: function() {
			return utils_2.bytesToHex;
		}
	});
	Object.defineProperty(exports, "concatBytes", {
		enumerable: true,
		get: function() {
			return utils_2.concatBytes;
		}
	});
	Object.defineProperty(exports, "createView", {
		enumerable: true,
		get: function() {
			return utils_2.createView;
		}
	});
	Object.defineProperty(exports, "utf8ToBytes", {
		enumerable: true,
		get: function() {
			return utils_2.utf8ToBytes;
		}
	});
	function bytesToUtf8(data) {
		if (!(data instanceof Uint8Array)) throw new TypeError(`bytesToUtf8 expected Uint8Array, got ${typeof data}`);
		return new TextDecoder().decode(data);
	}
	function hexToBytes(data) {
		const sliced = data.startsWith("0x") ? data.substring(2) : data;
		return (0, utils_1.hexToBytes)(sliced);
	}
	function equalsBytes(a, b) {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
		return true;
	}
	function wrapHash(hash) {
		return (msg) => {
			_assert_1.default.bytes(msg);
			return hash(msg);
		};
	}
	exports.crypto = (() => {
		const webCrypto = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
		const nodeRequire = typeof module !== "undefined" && typeof module.require === "function" && module.require.bind(module);
		return {
			node: nodeRequire && !webCrypto ? nodeRequire("crypto") : void 0,
			web: webCrypto
		};
	})();
}));
//#endregion
//#region node_modules/ethereum-cryptography/keccak.js
var require_keccak = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.keccak512 = exports.keccak384 = exports.keccak256 = exports.keccak224 = void 0;
	var sha3_1 = require_sha3();
	var utils_js_1 = require_utils();
	exports.keccak224 = (0, utils_js_1.wrapHash)(sha3_1.keccak_224);
	exports.keccak256 = (() => {
		const k = (0, utils_js_1.wrapHash)(sha3_1.keccak_256);
		k.create = sha3_1.keccak_256.create;
		return k;
	})();
	exports.keccak384 = (0, utils_js_1.wrapHash)(sha3_1.keccak_384);
	exports.keccak512 = (0, utils_js_1.wrapHash)(sha3_1.keccak_512);
}));
//#endregion
//#region node_modules/@ethereumjs/util/dist/internal.js
var require_internal = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.isHexString = exports.getKeys = exports.fromAscii = exports.fromUtf8 = exports.toAscii = exports.arrayContainsArray = exports.getBinarySize = exports.padToEven = exports.stripHexPrefix = exports.isHexPrefixed = void 0;
	/**
	* Returns a `Boolean` on whether or not the a `String` starts with '0x'
	* @param str the string input value
	* @return a boolean if it is or is not hex prefixed
	* @throws if the str input is not a string
	*/
	function isHexPrefixed(str) {
		if (typeof str !== "string") throw new Error(`[isHexPrefixed] input must be type 'string', received type ${typeof str}`);
		return str[0] === "0" && str[1] === "x";
	}
	exports.isHexPrefixed = isHexPrefixed;
	/**
	* Removes '0x' from a given `String` if present
	* @param str the string value
	* @returns the string without 0x prefix
	*/
	var stripHexPrefix = (str) => {
		if (typeof str !== "string") throw new Error(`[stripHexPrefix] input must be type 'string', received ${typeof str}`);
		return isHexPrefixed(str) ? str.slice(2) : str;
	};
	exports.stripHexPrefix = stripHexPrefix;
	/**
	* Pads a `String` to have an even length
	* @param value
	* @return output
	*/
	function padToEven(value) {
		let a = value;
		if (typeof a !== "string") throw new Error(`[padToEven] value must be type 'string', received ${typeof a}`);
		if (a.length % 2) a = `0${a}`;
		return a;
	}
	exports.padToEven = padToEven;
	/**
	* Get the binary size of a string
	* @param str
	* @returns the number of bytes contained within the string
	*/
	function getBinarySize(str) {
		if (typeof str !== "string") throw new Error(`[getBinarySize] method requires input type 'string', received ${typeof str}`);
		return Buffer.byteLength(str, "utf8");
	}
	exports.getBinarySize = getBinarySize;
	/**
	* Returns TRUE if the first specified array contains all elements
	* from the second one. FALSE otherwise.
	*
	* @param superset
	* @param subset
	*
	*/
	function arrayContainsArray(superset, subset, some) {
		if (Array.isArray(superset) !== true) throw new Error(`[arrayContainsArray] method requires input 'superset' to be an array, got type '${typeof superset}'`);
		if (Array.isArray(subset) !== true) throw new Error(`[arrayContainsArray] method requires input 'subset' to be an array, got type '${typeof subset}'`);
		return subset[some === true ? "some" : "every"]((value) => superset.indexOf(value) >= 0);
	}
	exports.arrayContainsArray = arrayContainsArray;
	/**
	* Should be called to get ascii from its hex representation
	*
	* @param string in hex
	* @returns ascii string representation of hex value
	*/
	function toAscii(hex) {
		let str = "";
		let i = 0;
		const l = hex.length;
		if (hex.substring(0, 2) === "0x") i = 2;
		for (; i < l; i += 2) {
			const code = parseInt(hex.substr(i, 2), 16);
			str += String.fromCharCode(code);
		}
		return str;
	}
	exports.toAscii = toAscii;
	/**
	* Should be called to get hex representation (prefixed by 0x) of utf8 string
	*
	* @param string
	* @param optional padding
	* @returns hex representation of input string
	*/
	function fromUtf8(stringValue) {
		return `0x${padToEven(Buffer.from(stringValue, "utf8").toString("hex")).replace(/^0+|0+$/g, "")}`;
	}
	exports.fromUtf8 = fromUtf8;
	/**
	* Should be called to get hex representation (prefixed by 0x) of ascii string
	*
	* @param  string
	* @param  optional padding
	* @returns  hex representation of input string
	*/
	function fromAscii(stringValue) {
		let hex = "";
		for (let i = 0; i < stringValue.length; i++) {
			const n = stringValue.charCodeAt(i).toString(16);
			hex += n.length < 2 ? `0${n}` : n;
		}
		return `0x${hex}`;
	}
	exports.fromAscii = fromAscii;
	/**
	* Returns the keys from an array of objects.
	* @example
	* ```js
	* getKeys([{a: '1', b: '2'}, {a: '3', b: '4'}], 'a') => ['1', '3']
	*````
	* @param  params
	* @param  key
	* @param  allowEmpty
	* @returns output just a simple array of output keys
	*/
	function getKeys(params, key, allowEmpty) {
		if (!Array.isArray(params)) throw new Error(`[getKeys] method expects input 'params' to be an array, got ${typeof params}`);
		if (typeof key !== "string") throw new Error(`[getKeys] method expects input 'key' to be type 'string', got ${typeof params}`);
		const result = [];
		for (let i = 0; i < params.length; i++) {
			let value = params[i][key];
			if (allowEmpty === true && !value) value = "";
			else if (typeof value !== "string") throw new Error(`invalid abi - expected type 'string', received ${typeof value}`);
			result.push(value);
		}
		return result;
	}
	exports.getKeys = getKeys;
	/**
	* Is the string a hex string.
	*
	* @param  value
	* @param  length
	* @returns  output the string is a hex string
	*/
	function isHexString(value, length) {
		if (typeof value !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) return false;
		if (typeof length !== "undefined" && length > 0 && value.length !== 2 + 2 * length) return false;
		return true;
	}
	exports.isHexString = isHexString;
}));
//#endregion
//#region node_modules/@ethereumjs/util/dist/helpers.js
var require_helpers = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.assertIsString = exports.assertIsArray = exports.assertIsBuffer = exports.assertIsHexString = void 0;
	var internal_1 = require_internal();
	/**
	* Throws if a string is not hex prefixed
	* @param {string} input string to check hex prefix of
	*/
	var assertIsHexString = function(input) {
		if (!(0, internal_1.isHexString)(input)) {
			const msg = `This method only supports 0x-prefixed hex strings but input was: ${input}`;
			throw new Error(msg);
		}
	};
	exports.assertIsHexString = assertIsHexString;
	/**
	* Throws if input is not a buffer
	* @param {Buffer} input value to check
	*/
	var assertIsBuffer = function(input) {
		if (!Buffer.isBuffer(input)) {
			const msg = `This method only supports Buffer but input was: ${input}`;
			throw new Error(msg);
		}
	};
	exports.assertIsBuffer = assertIsBuffer;
	/**
	* Throws if input is not an array
	* @param {number[]} input value to check
	*/
	var assertIsArray = function(input) {
		if (!Array.isArray(input)) {
			const msg = `This method only supports number arrays but input was: ${input}`;
			throw new Error(msg);
		}
	};
	exports.assertIsArray = assertIsArray;
	/**
	* Throws if input is not a string
	* @param {string} input value to check
	*/
	var assertIsString = function(input) {
		if (typeof input !== "string") {
			const msg = `This method only supports strings but input was: ${input}`;
			throw new Error(msg);
		}
	};
	exports.assertIsString = assertIsString;
}));
//#endregion
//#region node_modules/@ethereumjs/util/dist/bytes.js
var require_bytes = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.intToUnpaddedBuffer = exports.bigIntToUnpaddedBuffer = exports.bigIntToHex = exports.bufArrToArr = exports.arrToBufArr = exports.validateNoLeadingZeroes = exports.baToJSON = exports.toUtf8 = exports.short = exports.addHexPrefix = exports.toUnsigned = exports.fromSigned = exports.bufferToInt = exports.bigIntToBuffer = exports.bufferToBigInt = exports.bufferToHex = exports.toBuffer = exports.unpadHexString = exports.unpadArray = exports.unpadBuffer = exports.setLengthRight = exports.setLengthLeft = exports.zeros = exports.intToBuffer = exports.intToHex = void 0;
	var helpers_1 = require_helpers();
	var internal_1 = require_internal();
	/**
	* Converts a `Number` into a hex `String`
	* @param {Number} i
	* @return {String}
	*/
	var intToHex = function(i) {
		if (!Number.isSafeInteger(i) || i < 0) throw new Error(`Received an invalid integer type: ${i}`);
		return `0x${i.toString(16)}`;
	};
	exports.intToHex = intToHex;
	/**
	* Converts an `Number` to a `Buffer`
	* @param {Number} i
	* @return {Buffer}
	*/
	var intToBuffer = function(i) {
		const hex = (0, exports.intToHex)(i);
		return Buffer.from((0, internal_1.padToEven)(hex.slice(2)), "hex");
	};
	exports.intToBuffer = intToBuffer;
	/**
	* Returns a buffer filled with 0s.
	* @param bytes the number of bytes the buffer should be
	*/
	var zeros = function(bytes) {
		return Buffer.allocUnsafe(bytes).fill(0);
	};
	exports.zeros = zeros;
	/**
	* Pads a `Buffer` with zeros till it has `length` bytes.
	* Truncates the beginning or end of input if its length exceeds `length`.
	* @param msg the value to pad (Buffer)
	* @param length the number of bytes the output should be
	* @param right whether to start padding form the left or right
	* @return (Buffer)
	*/
	var setLength = function(msg, length, right) {
		const buf = (0, exports.zeros)(length);
		if (right) {
			if (msg.length < length) {
				msg.copy(buf);
				return buf;
			}
			return msg.slice(0, length);
		} else {
			if (msg.length < length) {
				msg.copy(buf, length - msg.length);
				return buf;
			}
			return msg.slice(-length);
		}
	};
	/**
	* Left Pads a `Buffer` with leading zeros till it has `length` bytes.
	* Or it truncates the beginning if it exceeds.
	* @param msg the value to pad (Buffer)
	* @param length the number of bytes the output should be
	* @return (Buffer)
	*/
	var setLengthLeft = function(msg, length) {
		(0, helpers_1.assertIsBuffer)(msg);
		return setLength(msg, length, false);
	};
	exports.setLengthLeft = setLengthLeft;
	/**
	* Right Pads a `Buffer` with trailing zeros till it has `length` bytes.
	* it truncates the end if it exceeds.
	* @param msg the value to pad (Buffer)
	* @param length the number of bytes the output should be
	* @return (Buffer)
	*/
	var setLengthRight = function(msg, length) {
		(0, helpers_1.assertIsBuffer)(msg);
		return setLength(msg, length, true);
	};
	exports.setLengthRight = setLengthRight;
	/**
	* Trims leading zeros from a `Buffer`, `String` or `Number[]`.
	* @param a (Buffer|Array|String)
	* @return (Buffer|Array|String)
	*/
	var stripZeros = function(a) {
		let first = a[0];
		while (a.length > 0 && first.toString() === "0") {
			a = a.slice(1);
			first = a[0];
		}
		return a;
	};
	/**
	* Trims leading zeros from a `Buffer`.
	* @param a (Buffer)
	* @return (Buffer)
	*/
	var unpadBuffer = function(a) {
		(0, helpers_1.assertIsBuffer)(a);
		return stripZeros(a);
	};
	exports.unpadBuffer = unpadBuffer;
	/**
	* Trims leading zeros from an `Array` (of numbers).
	* @param a (number[])
	* @return (number[])
	*/
	var unpadArray = function(a) {
		(0, helpers_1.assertIsArray)(a);
		return stripZeros(a);
	};
	exports.unpadArray = unpadArray;
	/**
	* Trims leading zeros from a hex-prefixed `String`.
	* @param a (String)
	* @return (String)
	*/
	var unpadHexString = function(a) {
		(0, helpers_1.assertIsHexString)(a);
		a = (0, internal_1.stripHexPrefix)(a);
		return "0x" + stripZeros(a);
	};
	exports.unpadHexString = unpadHexString;
	/**
	* Attempts to turn a value into a `Buffer`.
	* Inputs supported: `Buffer`, `String` (hex-prefixed), `Number`, null/undefined, `BigInt` and other objects
	* with a `toArray()` or `toBuffer()` method.
	* @param v the value
	*/
	var toBuffer = function(v) {
		if (v === null || v === void 0) return Buffer.allocUnsafe(0);
		if (Buffer.isBuffer(v)) return Buffer.from(v);
		if (Array.isArray(v) || v instanceof Uint8Array) return Buffer.from(v);
		if (typeof v === "string") {
			if (!(0, internal_1.isHexString)(v)) throw new Error(`Cannot convert string to buffer. toBuffer only supports 0x-prefixed hex strings and this string was given: ${v}`);
			return Buffer.from((0, internal_1.padToEven)((0, internal_1.stripHexPrefix)(v)), "hex");
		}
		if (typeof v === "number") return (0, exports.intToBuffer)(v);
		if (typeof v === "bigint") {
			if (v < BigInt(0)) throw new Error(`Cannot convert negative bigint to buffer. Given: ${v}`);
			let n = v.toString(16);
			if (n.length % 2) n = "0" + n;
			return Buffer.from(n, "hex");
		}
		if (v.toArray) return Buffer.from(v.toArray());
		if (v.toBuffer) return Buffer.from(v.toBuffer());
		throw new Error("invalid type");
	};
	exports.toBuffer = toBuffer;
	/**
	* Converts a `Buffer` into a `0x`-prefixed hex `String`.
	* @param buf `Buffer` object to convert
	*/
	var bufferToHex = function(buf) {
		buf = (0, exports.toBuffer)(buf);
		return "0x" + buf.toString("hex");
	};
	exports.bufferToHex = bufferToHex;
	/**
	* Converts a {@link Buffer} to a {@link bigint}
	*/
	function bufferToBigInt(buf) {
		const hex = (0, exports.bufferToHex)(buf);
		if (hex === "0x") return BigInt(0);
		return BigInt(hex);
	}
	exports.bufferToBigInt = bufferToBigInt;
	/**
	* Converts a {@link bigint} to a {@link Buffer}
	*/
	function bigIntToBuffer(num) {
		return (0, exports.toBuffer)("0x" + num.toString(16));
	}
	exports.bigIntToBuffer = bigIntToBuffer;
	/**
	* Converts a `Buffer` to a `Number`.
	* @param buf `Buffer` object to convert
	* @throws If the input number exceeds 53 bits.
	*/
	var bufferToInt = function(buf) {
		const res = Number(bufferToBigInt(buf));
		if (!Number.isSafeInteger(res)) throw new Error("Number exceeds 53 bits");
		return res;
	};
	exports.bufferToInt = bufferToInt;
	/**
	* Interprets a `Buffer` as a signed integer and returns a `BigInt`. Assumes 256-bit numbers.
	* @param num Signed integer value
	*/
	var fromSigned = function(num) {
		return BigInt.asIntN(256, bufferToBigInt(num));
	};
	exports.fromSigned = fromSigned;
	/**
	* Converts a `BigInt` to an unsigned integer and returns it as a `Buffer`. Assumes 256-bit numbers.
	* @param num
	*/
	var toUnsigned = function(num) {
		return bigIntToBuffer(BigInt.asUintN(256, num));
	};
	exports.toUnsigned = toUnsigned;
	/**
	* Adds "0x" to a given `String` if it does not already start with "0x".
	*/
	var addHexPrefix = function(str) {
		if (typeof str !== "string") return str;
		return (0, internal_1.isHexPrefixed)(str) ? str : "0x" + str;
	};
	exports.addHexPrefix = addHexPrefix;
	/**
	* Shortens a string  or buffer's hex string representation to maxLength (default 50).
	*
	* Examples:
	*
	* Input:  '657468657265756d000000000000000000000000000000000000000000000000'
	* Output: '657468657265756d0000000000000000000000000000000000…'
	*/
	function short(buffer, maxLength = 50) {
		const bufferStr = Buffer.isBuffer(buffer) ? buffer.toString("hex") : buffer;
		if (bufferStr.length <= maxLength) return bufferStr;
		return bufferStr.slice(0, maxLength) + "…";
	}
	exports.short = short;
	/**
	* Returns the utf8 string representation from a hex string.
	*
	* Examples:
	*
	* Input 1: '657468657265756d000000000000000000000000000000000000000000000000'
	* Input 2: '657468657265756d'
	* Input 3: '000000000000000000000000000000000000000000000000657468657265756d'
	*
	* Output (all 3 input variants): 'ethereum'
	*
	* Note that this method is not intended to be used with hex strings
	* representing quantities in both big endian or little endian notation.
	*
	* @param string Hex string, should be `0x` prefixed
	* @return Utf8 string
	*/
	var toUtf8 = function(hex) {
		const zerosRegexp = /^(00)+|(00)+$/g;
		hex = (0, internal_1.stripHexPrefix)(hex);
		if (hex.length % 2 !== 0) throw new Error("Invalid non-even hex string input for toUtf8() provided");
		return Buffer.from(hex.replace(zerosRegexp, ""), "hex").toString("utf8");
	};
	exports.toUtf8 = toUtf8;
	/**
	* Converts a `Buffer` or `Array` to JSON.
	* @param ba (Buffer|Array)
	* @return (Array|String|null)
	*/
	var baToJSON = function(ba) {
		if (Buffer.isBuffer(ba)) return `0x${ba.toString("hex")}`;
		else if (ba instanceof Array) {
			const array = [];
			for (let i = 0; i < ba.length; i++) array.push((0, exports.baToJSON)(ba[i]));
			return array;
		}
	};
	exports.baToJSON = baToJSON;
	/**
	* Checks provided Buffers for leading zeroes and throws if found.
	*
	* Examples:
	*
	* Valid values: 0x1, 0x, 0x01, 0x1234
	* Invalid values: 0x0, 0x00, 0x001, 0x0001
	*
	* Note: This method is useful for validating that RLP encoded integers comply with the rule that all
	* integer values encoded to RLP must be in the most compact form and contain no leading zero bytes
	* @param values An object containing string keys and Buffer values
	* @throws if any provided value is found to have leading zero bytes
	*/
	var validateNoLeadingZeroes = function(values) {
		for (const [k, v] of Object.entries(values)) if (v !== void 0 && v.length > 0 && v[0] === 0) throw new Error(`${k} cannot have leading zeroes, received: ${v.toString("hex")}`);
	};
	exports.validateNoLeadingZeroes = validateNoLeadingZeroes;
	function arrToBufArr(arr) {
		if (!Array.isArray(arr)) return Buffer.from(arr);
		return arr.map((a) => arrToBufArr(a));
	}
	exports.arrToBufArr = arrToBufArr;
	function bufArrToArr(arr) {
		if (!Array.isArray(arr)) return Uint8Array.from(arr ?? []);
		return arr.map((a) => bufArrToArr(a));
	}
	exports.bufArrToArr = bufArrToArr;
	/**
	* Converts a {@link bigint} to a `0x` prefixed hex string
	*/
	var bigIntToHex = (num) => {
		return "0x" + num.toString(16);
	};
	exports.bigIntToHex = bigIntToHex;
	/**
	* Convert value from bigint to an unpadded Buffer
	* (useful for RLP transport)
	* @param value value to convert
	*/
	function bigIntToUnpaddedBuffer(value) {
		return (0, exports.unpadBuffer)(bigIntToBuffer(value));
	}
	exports.bigIntToUnpaddedBuffer = bigIntToUnpaddedBuffer;
	function intToUnpaddedBuffer(value) {
		return (0, exports.unpadBuffer)((0, exports.intToBuffer)(value));
	}
	exports.intToUnpaddedBuffer = intToUnpaddedBuffer;
}));
//#endregion
//#region node_modules/@ethereumjs/util/dist/account.js
var require_account = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.accountBodyToRLP = exports.accountBodyToSlim = exports.accountBodyFromSlim = exports.isZeroAddress = exports.zeroAddress = exports.importPublic = exports.privateToAddress = exports.privateToPublic = exports.publicToAddress = exports.pubToAddress = exports.isValidPublic = exports.isValidPrivate = exports.generateAddress2 = exports.generateAddress = exports.isValidChecksumAddress = exports.toChecksumAddress = exports.isValidAddress = exports.Account = void 0;
	var rlp_1 = require_dist$1();
	var keccak_1 = require_keccak();
	var secp256k1_1 = require_secp256k1();
	var utils_1 = require_utils();
	var bytes_1 = require_bytes();
	var constants_1 = require_constants();
	var helpers_1 = require_helpers();
	var internal_1 = require_internal();
	var _0n = BigInt(0);
	exports.Account = class Account {
		/**
		* This constructor assigns and validates the values.
		* Use the static factory methods to assist in creating an Account from varying data types.
		*/
		constructor(nonce = _0n, balance = _0n, storageRoot = constants_1.KECCAK256_RLP, codeHash = constants_1.KECCAK256_NULL) {
			this.nonce = nonce;
			this.balance = balance;
			this.storageRoot = storageRoot;
			this.codeHash = codeHash;
			this._validate();
		}
		static fromAccountData(accountData) {
			const { nonce, balance, storageRoot, codeHash } = accountData;
			return new Account(nonce !== void 0 ? (0, bytes_1.bufferToBigInt)((0, bytes_1.toBuffer)(nonce)) : void 0, balance !== void 0 ? (0, bytes_1.bufferToBigInt)((0, bytes_1.toBuffer)(balance)) : void 0, storageRoot !== void 0 ? (0, bytes_1.toBuffer)(storageRoot) : void 0, codeHash !== void 0 ? (0, bytes_1.toBuffer)(codeHash) : void 0);
		}
		static fromRlpSerializedAccount(serialized) {
			const values = (0, bytes_1.arrToBufArr)(rlp_1.RLP.decode(Uint8Array.from(serialized)));
			if (!Array.isArray(values)) throw new Error("Invalid serialized account input. Must be array");
			return this.fromValuesArray(values);
		}
		static fromValuesArray(values) {
			const [nonce, balance, storageRoot, codeHash] = values;
			return new Account((0, bytes_1.bufferToBigInt)(nonce), (0, bytes_1.bufferToBigInt)(balance), storageRoot, codeHash);
		}
		_validate() {
			if (this.nonce < _0n) throw new Error("nonce must be greater than zero");
			if (this.balance < _0n) throw new Error("balance must be greater than zero");
			if (this.storageRoot.length !== 32) throw new Error("storageRoot must have a length of 32");
			if (this.codeHash.length !== 32) throw new Error("codeHash must have a length of 32");
		}
		/**
		* Returns a Buffer Array of the raw Buffers for the account, in order.
		*/
		raw() {
			return [
				(0, bytes_1.bigIntToUnpaddedBuffer)(this.nonce),
				(0, bytes_1.bigIntToUnpaddedBuffer)(this.balance),
				this.storageRoot,
				this.codeHash
			];
		}
		/**
		* Returns the RLP serialization of the account as a `Buffer`.
		*/
		serialize() {
			return Buffer.from(rlp_1.RLP.encode((0, bytes_1.bufArrToArr)(this.raw())));
		}
		/**
		* Returns a `Boolean` determining if the account is a contract.
		*/
		isContract() {
			return !this.codeHash.equals(constants_1.KECCAK256_NULL);
		}
		/**
		* Returns a `Boolean` determining if the account is empty complying to the definition of
		* account emptiness in [EIP-161](https://eips.ethereum.org/EIPS/eip-161):
		* "An account is considered empty when it has no code and zero nonce and zero balance."
		*/
		isEmpty() {
			return this.balance === _0n && this.nonce === _0n && this.codeHash.equals(constants_1.KECCAK256_NULL);
		}
	};
	/**
	* Checks if the address is a valid. Accepts checksummed addresses too.
	*/
	var isValidAddress = function(hexAddress) {
		try {
			(0, helpers_1.assertIsString)(hexAddress);
		} catch (e) {
			return false;
		}
		return /^0x[0-9a-fA-F]{40}$/.test(hexAddress);
	};
	exports.isValidAddress = isValidAddress;
	/**
	* Returns a checksummed address.
	*
	* If an eip1191ChainId is provided, the chainId will be included in the checksum calculation. This
	* has the effect of checksummed addresses for one chain having invalid checksums for others.
	* For more details see [EIP-1191](https://eips.ethereum.org/EIPS/eip-1191).
	*
	* WARNING: Checksums with and without the chainId will differ and the EIP-1191 checksum is not
	* backwards compatible to the original widely adopted checksum format standard introduced in
	* [EIP-55](https://eips.ethereum.org/EIPS/eip-55), so this will break in existing applications.
	* Usage of this EIP is therefore discouraged unless you have a very targeted use case.
	*/
	var toChecksumAddress = function(hexAddress, eip1191ChainId) {
		(0, helpers_1.assertIsHexString)(hexAddress);
		const address = (0, internal_1.stripHexPrefix)(hexAddress).toLowerCase();
		let prefix = "";
		if (eip1191ChainId !== void 0) prefix = (0, bytes_1.bufferToBigInt)((0, bytes_1.toBuffer)(eip1191ChainId)).toString() + "0x";
		const buf = Buffer.from(prefix + address, "utf8");
		const hash = (0, utils_1.bytesToHex)((0, keccak_1.keccak256)(buf));
		let ret = "0x";
		for (let i = 0; i < address.length; i++) if (parseInt(hash[i], 16) >= 8) ret += address[i].toUpperCase();
		else ret += address[i];
		return ret;
	};
	exports.toChecksumAddress = toChecksumAddress;
	/**
	* Checks if the address is a valid checksummed address.
	*
	* See toChecksumAddress' documentation for details about the eip1191ChainId parameter.
	*/
	var isValidChecksumAddress = function(hexAddress, eip1191ChainId) {
		return (0, exports.isValidAddress)(hexAddress) && (0, exports.toChecksumAddress)(hexAddress, eip1191ChainId) === hexAddress;
	};
	exports.isValidChecksumAddress = isValidChecksumAddress;
	/**
	* Generates an address of a newly created contract.
	* @param from The address which is creating this new address
	* @param nonce The nonce of the from account
	*/
	var generateAddress = function(from, nonce) {
		(0, helpers_1.assertIsBuffer)(from);
		(0, helpers_1.assertIsBuffer)(nonce);
		if ((0, bytes_1.bufferToBigInt)(nonce) === BigInt(0)) return Buffer.from((0, keccak_1.keccak256)(rlp_1.RLP.encode((0, bytes_1.bufArrToArr)([from, null])))).slice(-20);
		return Buffer.from((0, keccak_1.keccak256)(rlp_1.RLP.encode((0, bytes_1.bufArrToArr)([from, nonce])))).slice(-20);
	};
	exports.generateAddress = generateAddress;
	/**
	* Generates an address for a contract created using CREATE2.
	* @param from The address which is creating this new address
	* @param salt A salt
	* @param initCode The init code of the contract being created
	*/
	var generateAddress2 = function(from, salt, initCode) {
		(0, helpers_1.assertIsBuffer)(from);
		(0, helpers_1.assertIsBuffer)(salt);
		(0, helpers_1.assertIsBuffer)(initCode);
		if (from.length !== 20) throw new Error("Expected from to be of length 20");
		if (salt.length !== 32) throw new Error("Expected salt to be of length 32");
		const address = (0, keccak_1.keccak256)(Buffer.concat([
			Buffer.from("ff", "hex"),
			from,
			salt,
			(0, keccak_1.keccak256)(initCode)
		]));
		return (0, bytes_1.toBuffer)(address).slice(-20);
	};
	exports.generateAddress2 = generateAddress2;
	/**
	* Checks if the private key satisfies the rules of the curve secp256k1.
	*/
	var isValidPrivate = function(privateKey) {
		return secp256k1_1.secp256k1.utils.isValidPrivateKey(privateKey);
	};
	exports.isValidPrivate = isValidPrivate;
	/**
	* Checks if the public key satisfies the rules of the curve secp256k1
	* and the requirements of Ethereum.
	* @param publicKey The two points of an uncompressed key, unless sanitize is enabled
	* @param sanitize Accept public keys in other formats
	*/
	var isValidPublic = function(publicKey, sanitize = false) {
		(0, helpers_1.assertIsBuffer)(publicKey);
		if (publicKey.length === 64) try {
			secp256k1_1.secp256k1.ProjectivePoint.fromHex(Buffer.concat([Buffer.from([4]), publicKey]));
			return true;
		} catch (e) {
			return false;
		}
		if (!sanitize) return false;
		try {
			secp256k1_1.secp256k1.ProjectivePoint.fromHex(publicKey);
			return true;
		} catch (e) {
			return false;
		}
	};
	exports.isValidPublic = isValidPublic;
	/**
	* Returns the ethereum address of a given public key.
	* Accepts "Ethereum public keys" and SEC1 encoded keys.
	* @param pubKey The two points of an uncompressed key, unless sanitize is enabled
	* @param sanitize Accept public keys in other formats
	*/
	var pubToAddress = function(pubKey, sanitize = false) {
		(0, helpers_1.assertIsBuffer)(pubKey);
		if (sanitize && pubKey.length !== 64) pubKey = Buffer.from(secp256k1_1.secp256k1.ProjectivePoint.fromHex(pubKey).toRawBytes(false).slice(1));
		if (pubKey.length !== 64) throw new Error("Expected pubKey to be of length 64");
		return Buffer.from((0, keccak_1.keccak256)(pubKey)).slice(-20);
	};
	exports.pubToAddress = pubToAddress;
	exports.publicToAddress = exports.pubToAddress;
	/**
	* Returns the ethereum public key of a given private key.
	* @param privateKey A private key must be 256 bits wide
	*/
	var privateToPublic = function(privateKey) {
		(0, helpers_1.assertIsBuffer)(privateKey);
		return Buffer.from(secp256k1_1.secp256k1.ProjectivePoint.fromPrivateKey(privateKey).toRawBytes(false).slice(1));
	};
	exports.privateToPublic = privateToPublic;
	/**
	* Returns the ethereum address of a given private key.
	* @param privateKey A private key must be 256 bits wide
	*/
	var privateToAddress = function(privateKey) {
		return (0, exports.publicToAddress)((0, exports.privateToPublic)(privateKey));
	};
	exports.privateToAddress = privateToAddress;
	/**
	* Converts a public key to the Ethereum format.
	*/
	var importPublic = function(publicKey) {
		(0, helpers_1.assertIsBuffer)(publicKey);
		if (publicKey.length !== 64) publicKey = Buffer.from(secp256k1_1.secp256k1.ProjectivePoint.fromHex(publicKey).toRawBytes(false).slice(1));
		return publicKey;
	};
	exports.importPublic = importPublic;
	/**
	* Returns the zero address.
	*/
	var zeroAddress = function() {
		const addr = (0, bytes_1.zeros)(20);
		return (0, bytes_1.bufferToHex)(addr);
	};
	exports.zeroAddress = zeroAddress;
	/**
	* Checks if a given address is the zero address.
	*/
	var isZeroAddress = function(hexAddress) {
		try {
			(0, helpers_1.assertIsString)(hexAddress);
		} catch (e) {
			return false;
		}
		return (0, exports.zeroAddress)() === hexAddress;
	};
	exports.isZeroAddress = isZeroAddress;
	function accountBodyFromSlim(body) {
		const [nonce, balance, storageRoot, codeHash] = body;
		return [
			nonce,
			balance,
			(0, bytes_1.arrToBufArr)(storageRoot).length === 0 ? constants_1.KECCAK256_RLP : storageRoot,
			(0, bytes_1.arrToBufArr)(codeHash).length === 0 ? constants_1.KECCAK256_NULL : codeHash
		];
	}
	exports.accountBodyFromSlim = accountBodyFromSlim;
	var emptyUint8Arr = /* @__PURE__ */ new Uint8Array(0);
	function accountBodyToSlim(body) {
		const [nonce, balance, storageRoot, codeHash] = body;
		return [
			nonce,
			balance,
			(0, bytes_1.arrToBufArr)(storageRoot).equals(constants_1.KECCAK256_RLP) ? emptyUint8Arr : storageRoot,
			(0, bytes_1.arrToBufArr)(codeHash).equals(constants_1.KECCAK256_NULL) ? emptyUint8Arr : codeHash
		];
	}
	exports.accountBodyToSlim = accountBodyToSlim;
	/**
	* Converts a slim account (per snap protocol spec) to the RLP encoded version of the account
	* @param body Array of 4 Buffer-like items to represent the account
	* @returns RLP encoded version of the account
	*/
	function accountBodyToRLP(body, couldBeSlim = true) {
		const accountBody = couldBeSlim ? accountBodyFromSlim(body) : body;
		return (0, bytes_1.arrToBufArr)(rlp_1.RLP.encode(accountBody));
	}
	exports.accountBodyToRLP = accountBodyToRLP;
}));
//#endregion
//#region node_modules/@ethereumjs/util/dist/address.js
var require_address = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Address = void 0;
	var account_1 = require_account();
	var bytes_1 = require_bytes();
	exports.Address = class Address {
		constructor(buf) {
			if (buf.length !== 20) throw new Error("Invalid address length");
			this.buf = buf;
		}
		/**
		* Returns the zero address.
		*/
		static zero() {
			return new Address((0, bytes_1.zeros)(20));
		}
		/**
		* Returns an Address object from a hex-encoded string.
		* @param str - Hex-encoded address
		*/
		static fromString(str) {
			if (!(0, account_1.isValidAddress)(str)) throw new Error("Invalid address");
			return new Address((0, bytes_1.toBuffer)(str));
		}
		/**
		* Returns an address for a given public key.
		* @param pubKey The two points of an uncompressed key
		*/
		static fromPublicKey(pubKey) {
			if (!Buffer.isBuffer(pubKey)) throw new Error("Public key should be Buffer");
			const buf = (0, account_1.pubToAddress)(pubKey);
			return new Address(buf);
		}
		/**
		* Returns an address for a given private key.
		* @param privateKey A private key must be 256 bits wide
		*/
		static fromPrivateKey(privateKey) {
			if (!Buffer.isBuffer(privateKey)) throw new Error("Private key should be Buffer");
			const buf = (0, account_1.privateToAddress)(privateKey);
			return new Address(buf);
		}
		/**
		* Generates an address for a newly created contract.
		* @param from The address which is creating this new address
		* @param nonce The nonce of the from account
		*/
		static generate(from, nonce) {
			if (typeof nonce !== "bigint") throw new Error("Expected nonce to be a bigint");
			return new Address((0, account_1.generateAddress)(from.buf, (0, bytes_1.bigIntToBuffer)(nonce)));
		}
		/**
		* Generates an address for a contract created using CREATE2.
		* @param from The address which is creating this new address
		* @param salt A salt
		* @param initCode The init code of the contract being created
		*/
		static generate2(from, salt, initCode) {
			if (!Buffer.isBuffer(salt)) throw new Error("Expected salt to be a Buffer");
			if (!Buffer.isBuffer(initCode)) throw new Error("Expected initCode to be a Buffer");
			return new Address((0, account_1.generateAddress2)(from.buf, salt, initCode));
		}
		/**
		* Is address equal to another.
		*/
		equals(address) {
			return this.buf.equals(address.buf);
		}
		/**
		* Is address zero.
		*/
		isZero() {
			return this.equals(Address.zero());
		}
		/**
		* True if address is in the address range defined
		* by EIP-1352
		*/
		isPrecompileOrSystemAddress() {
			const address = (0, bytes_1.bufferToBigInt)(this.buf);
			return address >= BigInt(0) && address <= BigInt("0xffff");
		}
		/**
		* Returns hex encoding of address.
		*/
		toString() {
			return "0x" + this.buf.toString("hex");
		}
		/**
		* Returns Buffer representation of address.
		*/
		toBuffer() {
			return Buffer.from(this.buf);
		}
	};
}));
//#endregion
//#region node_modules/@ethereumjs/util/dist/types.js
var require_types = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.toType = exports.TypeOutput = void 0;
	var bytes_1 = require_bytes();
	var internal_1 = require_internal();
	/**
	* Type output options
	*/
	var TypeOutput;
	(function(TypeOutput) {
		TypeOutput[TypeOutput["Number"] = 0] = "Number";
		TypeOutput[TypeOutput["BigInt"] = 1] = "BigInt";
		TypeOutput[TypeOutput["Buffer"] = 2] = "Buffer";
		TypeOutput[TypeOutput["PrefixedHexString"] = 3] = "PrefixedHexString";
	})(TypeOutput = exports.TypeOutput || (exports.TypeOutput = {}));
	function toType(input, outputType) {
		if (input === null) return null;
		if (input === void 0) return;
		if (typeof input === "string" && !(0, internal_1.isHexString)(input)) throw new Error(`A string must be provided with a 0x-prefix, given: ${input}`);
		else if (typeof input === "number" && !Number.isSafeInteger(input)) throw new Error("The provided number is greater than MAX_SAFE_INTEGER (please use an alternative input type)");
		const output = (0, bytes_1.toBuffer)(input);
		switch (outputType) {
			case TypeOutput.Buffer: return output;
			case TypeOutput.BigInt: return (0, bytes_1.bufferToBigInt)(output);
			case TypeOutput.Number: {
				const bigInt = (0, bytes_1.bufferToBigInt)(output);
				if (bigInt > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("The provided number is greater than MAX_SAFE_INTEGER (please use an alternative output type)");
				return Number(bigInt);
			}
			case TypeOutput.PrefixedHexString: return (0, bytes_1.bufferToHex)(output);
			default: throw new Error("unknown outputType");
		}
	}
	exports.toType = toType;
}));
//#endregion
//#region node_modules/@ethereumjs/util/dist/withdrawal.js
var require_withdrawal = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Withdrawal = void 0;
	var address_1 = require_address();
	var bytes_1 = require_bytes();
	var types_1 = require_types();
	exports.Withdrawal = class Withdrawal {
		/**
		* This constructor assigns and validates the values.
		* Use the static factory methods to assist in creating a Withdrawal object from varying data types.
		* Its amount is in Gwei to match CL representation and for eventual ssz withdrawalsRoot
		*/
		constructor(index, validatorIndex, address, amount) {
			this.index = index;
			this.validatorIndex = validatorIndex;
			this.address = address;
			this.amount = amount;
		}
		static fromWithdrawalData(withdrawalData) {
			const { index: indexData, validatorIndex: validatorIndexData, address: addressData, amount: amountData } = withdrawalData;
			const index = (0, types_1.toType)(indexData, types_1.TypeOutput.BigInt);
			const validatorIndex = (0, types_1.toType)(validatorIndexData, types_1.TypeOutput.BigInt);
			const address = new address_1.Address((0, types_1.toType)(addressData, types_1.TypeOutput.Buffer));
			const amount = (0, types_1.toType)(amountData, types_1.TypeOutput.BigInt);
			return new Withdrawal(index, validatorIndex, address, amount);
		}
		static fromValuesArray(withdrawalArray) {
			if (withdrawalArray.length !== 4) throw Error(`Invalid withdrawalArray length expected=4 actual=${withdrawalArray.length}`);
			const [index, validatorIndex, address, amount] = withdrawalArray;
			return Withdrawal.fromWithdrawalData({
				index,
				validatorIndex,
				address,
				amount
			});
		}
		/**
		* Convert a withdrawal to a buffer array
		* @param withdrawal the withdrawal to convert
		* @returns buffer array of the withdrawal
		*/
		static toBufferArray(withdrawal) {
			const { index, validatorIndex, address, amount } = withdrawal;
			const indexBuffer = (0, types_1.toType)(index, types_1.TypeOutput.BigInt) === BigInt(0) ? Buffer.alloc(0) : (0, types_1.toType)(index, types_1.TypeOutput.Buffer);
			const validatorIndexBuffer = (0, types_1.toType)(validatorIndex, types_1.TypeOutput.BigInt) === BigInt(0) ? Buffer.alloc(0) : (0, types_1.toType)(validatorIndex, types_1.TypeOutput.Buffer);
			let addressBuffer;
			if (address instanceof address_1.Address) addressBuffer = address.buf;
			else addressBuffer = (0, types_1.toType)(address, types_1.TypeOutput.Buffer);
			const amountBuffer = (0, types_1.toType)(amount, types_1.TypeOutput.BigInt) === BigInt(0) ? Buffer.alloc(0) : (0, types_1.toType)(amount, types_1.TypeOutput.Buffer);
			return [
				indexBuffer,
				validatorIndexBuffer,
				addressBuffer,
				amountBuffer
			];
		}
		raw() {
			return Withdrawal.toBufferArray(this);
		}
		toValue() {
			return {
				index: this.index,
				validatorIndex: this.validatorIndex,
				address: this.address.buf,
				amount: this.amount
			};
		}
		toJSON() {
			return {
				index: (0, bytes_1.bigIntToHex)(this.index),
				validatorIndex: (0, bytes_1.bigIntToHex)(this.validatorIndex),
				address: "0x" + this.address.buf.toString("hex"),
				amount: (0, bytes_1.bigIntToHex)(this.amount)
			};
		}
	};
}));
//#endregion
//#region node_modules/@ethereumjs/util/dist/signature.js
var require_signature = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.hashPersonalMessage = exports.isValidSignature = exports.fromRpcSig = exports.toCompactSig = exports.toRpcSig = exports.ecrecover = exports.ecsign = void 0;
	var keccak_1 = require_keccak();
	var secp256k1_1 = require_secp256k1();
	var bytes_1 = require_bytes();
	var constants_1 = require_constants();
	var helpers_1 = require_helpers();
	/**
	* Returns the ECDSA signature of a message hash.
	*
	* If `chainId` is provided assume an EIP-155-style signature and calculate the `v` value
	* accordingly, otherwise return a "static" `v` just derived from the `recovery` bit
	*/
	function ecsign(msgHash, privateKey, chainId) {
		const sig = secp256k1_1.secp256k1.sign(msgHash, privateKey);
		const buf = sig.toCompactRawBytes();
		return {
			r: Buffer.from(buf.slice(0, 32)),
			s: Buffer.from(buf.slice(32, 64)),
			v: chainId === void 0 ? BigInt(sig.recovery + 27) : BigInt(sig.recovery + 35) + BigInt(chainId) * BigInt(2)
		};
	}
	exports.ecsign = ecsign;
	function calculateSigRecovery(v, chainId) {
		if (v === BigInt(0) || v === BigInt(1)) return v;
		if (chainId === void 0) return v - BigInt(27);
		return v - (chainId * BigInt(2) + BigInt(35));
	}
	function isValidSigRecovery(recovery) {
		return recovery === BigInt(0) || recovery === BigInt(1);
	}
	/**
	* ECDSA public key recovery from signature.
	* NOTE: Accepts `v === 0 | v === 1` for EIP1559 transactions
	* @returns Recovered public key
	*/
	var ecrecover = function(msgHash, v, r, s, chainId) {
		const signature = Buffer.concat([(0, bytes_1.setLengthLeft)(r, 32), (0, bytes_1.setLengthLeft)(s, 32)], 64);
		const recovery = calculateSigRecovery(v, chainId);
		if (!isValidSigRecovery(recovery)) throw new Error("Invalid signature v value");
		const senderPubKey = secp256k1_1.secp256k1.Signature.fromCompact(signature).addRecoveryBit(Number(recovery)).recoverPublicKey(msgHash);
		return Buffer.from(senderPubKey.toRawBytes(false).slice(1));
	};
	exports.ecrecover = ecrecover;
	/**
	* Convert signature parameters into the format of `eth_sign` RPC method.
	* NOTE: Accepts `v === 0 | v === 1` for EIP1559 transactions
	* @returns Signature
	*/
	var toRpcSig = function(v, r, s, chainId) {
		if (!isValidSigRecovery(calculateSigRecovery(v, chainId))) throw new Error("Invalid signature v value");
		return (0, bytes_1.bufferToHex)(Buffer.concat([
			(0, bytes_1.setLengthLeft)(r, 32),
			(0, bytes_1.setLengthLeft)(s, 32),
			(0, bytes_1.toBuffer)(v)
		]));
	};
	exports.toRpcSig = toRpcSig;
	/**
	* Convert signature parameters into the format of Compact Signature Representation (EIP-2098).
	* NOTE: Accepts `v === 0 | v === 1` for EIP1559 transactions
	* @returns Signature
	*/
	var toCompactSig = function(v, r, s, chainId) {
		if (!isValidSigRecovery(calculateSigRecovery(v, chainId))) throw new Error("Invalid signature v value");
		let ss = s;
		if (v > BigInt(28) && v % BigInt(2) === BigInt(1) || v === BigInt(1) || v === BigInt(28)) {
			ss = Buffer.from(s);
			ss[0] |= 128;
		}
		return (0, bytes_1.bufferToHex)(Buffer.concat([(0, bytes_1.setLengthLeft)(r, 32), (0, bytes_1.setLengthLeft)(ss, 32)]));
	};
	exports.toCompactSig = toCompactSig;
	/**
	* Convert signature format of the `eth_sign` RPC method to signature parameters
	*
	* NOTE: For an extracted `v` value < 27 (see Geth bug https://github.com/ethereum/go-ethereum/issues/2053)
	* `v + 27` is returned for the `v` value
	* NOTE: After EIP1559, `v` could be `0` or `1` but this function assumes
	* it's a signed message (EIP-191 or EIP-712) adding `27` at the end. Remove if needed.
	*/
	var fromRpcSig = function(sig) {
		const buf = (0, bytes_1.toBuffer)(sig);
		let r;
		let s;
		let v;
		if (buf.length >= 65) {
			r = buf.slice(0, 32);
			s = buf.slice(32, 64);
			v = (0, bytes_1.bufferToBigInt)(buf.slice(64));
		} else if (buf.length === 64) {
			r = buf.slice(0, 32);
			s = buf.slice(32, 64);
			v = BigInt((0, bytes_1.bufferToInt)(buf.slice(32, 33)) >> 7);
			s[0] &= 127;
		} else throw new Error("Invalid signature length");
		if (v < 27) v = v + BigInt(27);
		return {
			v,
			r,
			s
		};
	};
	exports.fromRpcSig = fromRpcSig;
	/**
	* Validate a ECDSA signature.
	* NOTE: Accepts `v === 0 | v === 1` for EIP1559 transactions
	* @param homesteadOrLater Indicates whether this is being used on either the homestead hardfork or a later one
	*/
	var isValidSignature = function(v, r, s, homesteadOrLater = true, chainId) {
		if (r.length !== 32 || s.length !== 32) return false;
		if (!isValidSigRecovery(calculateSigRecovery(v, chainId))) return false;
		const rBigInt = (0, bytes_1.bufferToBigInt)(r);
		const sBigInt = (0, bytes_1.bufferToBigInt)(s);
		if (rBigInt === BigInt(0) || rBigInt >= constants_1.SECP256K1_ORDER || sBigInt === BigInt(0) || sBigInt >= constants_1.SECP256K1_ORDER) return false;
		if (homesteadOrLater && sBigInt >= constants_1.SECP256K1_ORDER_DIV_2) return false;
		return true;
	};
	exports.isValidSignature = isValidSignature;
	/**
	* Returns the keccak-256 hash of `message`, prefixed with the header used by the `eth_sign` RPC call.
	* The output of this function can be fed into `ecsign` to produce the same signature as the `eth_sign`
	* call for a given `message`, or fed to `ecrecover` along with a signature to recover the public key
	* used to produce the signature.
	*/
	var hashPersonalMessage = function(message) {
		(0, helpers_1.assertIsBuffer)(message);
		const prefix = Buffer.from(`\u0019Ethereum Signed Message:\n${message.length}`, "utf-8");
		return Buffer.from((0, keccak_1.keccak256)(Buffer.concat([prefix, message])));
	};
	exports.hashPersonalMessage = hashPersonalMessage;
}));
//#endregion
//#region node_modules/@ethereumjs/util/dist/encoding.js
var require_encoding = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.compactBytesToNibbles = exports.bytesToNibbles = exports.nibblesToCompactBytes = exports.nibblesToBytes = exports.hasTerminator = void 0;
	/**
	*
	* @param s byte sequence
	* @returns boolean indicating if input hex nibble sequence has terminator indicating leaf-node
	*          terminator is represented with 16 because a nibble ranges from 0 - 15(f)
	*/
	var hasTerminator = (nibbles) => {
		return nibbles.length > 0 && nibbles[nibbles.length - 1] === 16;
	};
	exports.hasTerminator = hasTerminator;
	var nibblesToBytes = (nibbles, bytes) => {
		for (let bi = 0, ni = 0; ni < nibbles.length; bi += 1, ni += 2) bytes[bi] = nibbles[ni] << 4 | nibbles[ni + 1];
	};
	exports.nibblesToBytes = nibblesToBytes;
	var nibblesToCompactBytes = (nibbles) => {
		let terminator = 0;
		if ((0, exports.hasTerminator)(nibbles)) {
			terminator = 1;
			nibbles = nibbles.subarray(0, nibbles.length - 1);
		}
		const buf = new Uint8Array(nibbles.length / 2 + 1);
		buf[0] = terminator << 5;
		if ((nibbles.length & 1) === 1) {
			buf[0] |= 16;
			buf[0] |= nibbles[0];
			nibbles = nibbles.subarray(1);
		}
		(0, exports.nibblesToBytes)(nibbles, buf.subarray(1));
		return buf;
	};
	exports.nibblesToCompactBytes = nibblesToCompactBytes;
	var bytesToNibbles = (str) => {
		const l = str.length * 2 + 1;
		const nibbles = new Uint8Array(l);
		for (let i = 0; i < str.length; i++) {
			const b = str[i];
			nibbles[i * 2] = b / 16;
			nibbles[i * 2 + 1] = b % 16;
		}
		nibbles[l - 1] = 16;
		return nibbles;
	};
	exports.bytesToNibbles = bytesToNibbles;
	var compactBytesToNibbles = (compact) => {
		if (compact.length === 0) return compact;
		let base = (0, exports.bytesToNibbles)(compact);
		if (base[0] < 2) base = base.subarray(0, base.length - 1);
		const chop = 2 - (base[0] & 1);
		return base.subarray(chop);
	};
	exports.compactBytesToNibbles = compactBytesToNibbles;
}));
/**
* A test helper to generates compact path for a subset of key bytes
*
* TODO: Commenting the code for now as this seems to be helper function
* (from geth codebase )
*
*/
//#endregion
//#region node_modules/@ethereumjs/util/dist/asyncEventEmitter.js
var require_asyncEventEmitter = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Ported to Typescript from original implementation below:
	* https://github.com/ahultgren/async-eventemitter -- MIT licensed
	*
	* Type Definitions based on work by: patarapolw <https://github.com/patarapolw> -- MIT licensed
	* that was contributed to Definitely Typed below:
	* https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/async-eventemitter
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.AsyncEventEmitter = void 0;
	var events_1 = __require("events");
	async function runInSeries(context, tasks, data) {
		let error;
		for await (const task of tasks) try {
			if (task.length < 2) task.call(context, data);
			else await new Promise((resolve, reject) => {
				task.call(context, data, (error) => {
					if (error) reject(error);
					else resolve();
				});
			});
		} catch (e) {
			error = e;
		}
		if (error) throw error;
	}
	var AsyncEventEmitter = class extends events_1.EventEmitter {
		emit(event, ...args) {
			let [data, callback] = args;
			const self = this;
			let listeners = self._events[event] ?? [];
			if (callback === void 0 && typeof data === "function") {
				callback = data;
				data = void 0;
			}
			if (event === "newListener" || event === "removeListener") {
				data = {
					event: data,
					fn: callback
				};
				callback = void 0;
			}
			listeners = Array.isArray(listeners) ? listeners : [listeners];
			runInSeries(self, listeners.slice(), data).then(callback).catch(callback);
			return self.listenerCount(event) > 0;
		}
		once(event, listener) {
			const self = this;
			let g;
			if (typeof listener !== "function") throw new TypeError("listener must be a function");
			if (listener.length >= 2) g = function(e, next) {
				self.removeListener(event, g);
				listener(e, next);
			};
			else g = function(e) {
				self.removeListener(event, g);
				listener(e, g);
			};
			self.on(event, g);
			return self;
		}
		first(event, listener) {
			let listeners = this._events[event] ?? [];
			if (typeof listener !== "function") throw new TypeError("listener must be a function");
			if (!Array.isArray(listeners)) this._events[event] = listeners = [listeners];
			listeners.unshift(listener);
			return this;
		}
		before(event, target, listener) {
			return this.beforeOrAfter(event, target, listener);
		}
		after(event, target, listener) {
			return this.beforeOrAfter(event, target, listener, "after");
		}
		beforeOrAfter(event, target, listener, beforeOrAfter) {
			let listeners = this._events[event] ?? [];
			let i;
			let index;
			const add = beforeOrAfter === "after" ? 1 : 0;
			if (typeof listener !== "function") throw new TypeError("listener must be a function");
			if (typeof target !== "function") throw new TypeError("target must be a function");
			if (!Array.isArray(listeners)) this._events[event] = listeners = [listeners];
			index = listeners.length;
			for (i = listeners.length; i--;) if (listeners[i] === target) {
				index = i + add;
				break;
			}
			listeners.splice(index, 0, listener);
			return this;
		}
		on(event, listener) {
			return super.on(event, listener);
		}
		addListener(event, listener) {
			return super.addListener(event, listener);
		}
		prependListener(event, listener) {
			return super.prependListener(event, listener);
		}
		prependOnceListener(event, listener) {
			return super.prependOnceListener(event, listener);
		}
		removeAllListeners(event) {
			return super.removeAllListeners(event);
		}
		removeListener(event, listener) {
			return super.removeListener(event, listener);
		}
		eventNames() {
			return super.eventNames();
		}
		listeners(event) {
			return super.listeners(event);
		}
		listenerCount(event) {
			return super.listenerCount(event);
		}
		getMaxListeners() {
			return super.getMaxListeners();
		}
		setMaxListeners(maxListeners) {
			return super.setMaxListeners(maxListeners);
		}
	};
	exports.AsyncEventEmitter = AsyncEventEmitter;
}));
//#endregion
//#region node_modules/@ethereumjs/util/dist/lock.js
var require_lock = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Lock = void 0;
	var Lock = class {
		constructor() {
			this.permits = 1;
			this.promiseResolverQueue = [];
		}
		/**
		* Returns a promise used to wait for a permit to become available. This method should be awaited on.
		* @returns  A promise that gets resolved when execution is allowed to proceed.
		*/
		async acquire() {
			if (this.permits > 0) {
				this.permits -= 1;
				return Promise.resolve(true);
			}
			return new Promise((resolver) => this.promiseResolverQueue.push(resolver));
		}
		/**
		* Increases the number of permits by one. If there are other functions waiting, one of them will
		* continue to execute in a future iteration of the event loop.
		*/
		release() {
			this.permits += 1;
			if (this.permits > 1 && this.promiseResolverQueue.length > 0) console.warn("Lock.permits should never be > 0 when there is someone waiting.");
			else if (this.permits === 1 && this.promiseResolverQueue.length > 0) {
				this.permits -= 1;
				const nextResolver = this.promiseResolverQueue.shift();
				if (nextResolver) nextResolver(true);
			}
		}
	};
	exports.Lock = Lock;
}));
//#endregion
//#region node_modules/micro-ftch/index.js
var require_micro_ftch = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.InvalidStatusCodeError = exports.InvalidCertError = void 0;
	var DEFAULT_OPT = Object.freeze({
		redirect: true,
		expectStatusCode: 200,
		headers: {},
		full: false,
		keepAlive: true,
		cors: false,
		referrer: false,
		sslAllowSelfSigned: false,
		_redirectCount: 0
	});
	var InvalidCertError = class extends Error {
		constructor(msg, fingerprint256) {
			super(msg);
			this.fingerprint256 = fingerprint256;
		}
	};
	exports.InvalidCertError = InvalidCertError;
	var InvalidStatusCodeError = class extends Error {
		constructor(statusCode) {
			super(`Request Failed. Status Code: ${statusCode}`);
			this.statusCode = statusCode;
		}
	};
	exports.InvalidStatusCodeError = InvalidStatusCodeError;
	function detectType(b, type) {
		if (!type || type === "text" || type === "json") try {
			let text = new TextDecoder("utf8", { fatal: true }).decode(b);
			if (type === "text") return text;
			try {
				return JSON.parse(text);
			} catch (err) {
				if (type === "json") throw err;
				return text;
			}
		} catch (err) {
			if (type === "text" || type === "json") throw err;
		}
		return b;
	}
	var agents = {};
	function fetchNode(url, _options) {
		let options = {
			...DEFAULT_OPT,
			..._options
		};
		const http = __require("http");
		const https = __require("https");
		const zlib = __require("zlib");
		const { promisify } = __require("util");
		const { resolve: urlResolve } = __require("url");
		const isSecure = !!/^https/.test(url);
		let opts = {
			method: options.method || "GET",
			headers: { "Accept-Encoding": "gzip, deflate, br" }
		};
		const compactFP = (s) => s.replace(/:| /g, "").toLowerCase();
		if (options.keepAlive) {
			const agentOpt = {
				keepAlive: true,
				keepAliveMsecs: 3e4,
				maxFreeSockets: 1024,
				maxCachedSessions: 1024
			};
			const agentKey = [isSecure, isSecure && options.sslPinnedCertificates?.map((i) => compactFP(i)).sort()].join();
			opts.agent = agents[agentKey] || (agents[agentKey] = new (isSecure ? https : http).Agent(agentOpt));
		}
		if (options.type === "json") opts.headers["Content-Type"] = "application/json";
		if (options.data) {
			if (!options.method) opts.method = "POST";
			opts.body = options.type === "json" ? JSON.stringify(options.data) : options.data;
		}
		opts.headers = {
			...opts.headers,
			...options.headers
		};
		if (options.sslAllowSelfSigned) opts.rejectUnauthorized = false;
		const handleRes = async (res) => {
			const status = res.statusCode;
			if (options.redirect && 300 <= status && status < 400 && res.headers["location"]) {
				if (options._redirectCount == 10) throw new Error("Request failed. Too much redirects.");
				options._redirectCount += 1;
				return await fetchNode(urlResolve(url, res.headers["location"]), options);
			}
			if (options.expectStatusCode && status !== options.expectStatusCode) {
				res.resume();
				throw new InvalidStatusCodeError(status);
			}
			let buf = [];
			for await (const chunk of res) buf.push(chunk);
			let bytes = Buffer.concat(buf);
			const encoding = res.headers["content-encoding"];
			if (encoding === "br") bytes = await promisify(zlib.brotliDecompress)(bytes);
			if (encoding === "gzip" || encoding === "deflate") bytes = await promisify(zlib.unzip)(bytes);
			const body = detectType(bytes, options.type);
			if (options.full) return {
				headers: res.headers,
				status,
				body
			};
			return body;
		};
		return new Promise((resolve, reject) => {
			const handleError = async (err) => {
				if (err && err.code === "DEPTH_ZERO_SELF_SIGNED_CERT") try {
					await fetchNode(url, {
						...options,
						sslAllowSelfSigned: true,
						sslPinnedCertificates: []
					});
				} catch (e) {
					if (e && e.fingerprint256) err = new InvalidCertError(`Self-signed SSL certificate: ${e.fingerprint256}`, e.fingerprint256);
				}
				reject(err);
			};
			const req = (isSecure ? https : http).request(url, opts, (res) => {
				res.on("error", handleError);
				(async () => {
					try {
						resolve(await handleRes(res));
					} catch (error) {
						reject(error);
					}
				})();
			});
			req.on("error", handleError);
			const pinned = options.sslPinnedCertificates?.map((i) => compactFP(i));
			const mfetchSecureConnect = (socket) => {
				const fp256 = compactFP(socket.getPeerCertificate()?.fingerprint256 || "");
				if (!fp256 && socket.isSessionReused()) return;
				if (pinned.includes(fp256)) return;
				req.emit("error", new InvalidCertError(`Invalid SSL certificate: ${fp256} Expected: ${pinned}`, fp256));
				return req.abort();
			};
			if (options.sslPinnedCertificates) req.on("socket", (socket) => {
				if (socket.listeners("secureConnect").map((i) => (i.name || "").replace("bound ", "")).includes("mfetchSecureConnect")) return;
				socket.on("secureConnect", mfetchSecureConnect.bind(null, socket));
			});
			if (options.keepAlive) req.setNoDelay(true);
			if (opts.body) req.write(opts.body);
			req.end();
		});
	}
	var SAFE_HEADERS = new Set([
		"Accept",
		"Accept-Language",
		"Content-Language",
		"Content-Type"
	].map((i) => i.toLowerCase()));
	var FORBIDDEN_HEADERS = new Set([
		"Accept-Charset",
		"Accept-Encoding",
		"Access-Control-Request-Headers",
		"Access-Control-Request-Method",
		"Connection",
		"Content-Length",
		"Cookie",
		"Cookie2",
		"Date",
		"DNT",
		"Expect",
		"Host",
		"Keep-Alive",
		"Origin",
		"Referer",
		"TE",
		"Trailer",
		"Transfer-Encoding",
		"Upgrade",
		"Via"
	].map((i) => i.toLowerCase()));
	async function fetchBrowser(url, _options) {
		let options = {
			...DEFAULT_OPT,
			..._options
		};
		const headers = new Headers();
		if (options.type === "json") headers.set("Content-Type", "application/json");
		let parsed = new URL(url);
		if (parsed.username) {
			const auth = btoa(`${parsed.username}:${parsed.password}`);
			headers.set("Authorization", `Basic ${auth}`);
			parsed.username = "";
			parsed.password = "";
		}
		url = "" + parsed;
		for (let k in options.headers) {
			const name = k.toLowerCase();
			if (SAFE_HEADERS.has(name) || options.cors && !FORBIDDEN_HEADERS.has(name)) headers.set(k, options.headers[k]);
		}
		let opts = {
			headers,
			redirect: options.redirect ? "follow" : "manual"
		};
		if (!options.referrer) opts.referrerPolicy = "no-referrer";
		if (options.cors) opts.mode = "cors";
		if (options.data) {
			if (!options.method) opts.method = "POST";
			opts.body = options.type === "json" ? JSON.stringify(options.data) : options.data;
		}
		const res = await fetch(url, opts);
		if (options.expectStatusCode && res.status !== options.expectStatusCode) throw new InvalidStatusCodeError(res.status);
		const body = detectType(new Uint8Array(await res.arrayBuffer()), options.type);
		if (options.full) return {
			headers: Object.fromEntries(res.headers.entries()),
			status: res.status,
			body
		};
		return body;
	}
	var IS_NODE = !!(typeof process == "object" && process.versions && process.versions.node && process.versions.v8);
	function fetchUrl(url, options) {
		return (IS_NODE ? fetchNode : fetchBrowser)(url, options);
	}
	exports.default = fetchUrl;
}));
//#endregion
//#region node_modules/@ethereumjs/util/dist/provider.js
var require_provider = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getProvider = exports.fetchFromProvider = void 0;
	var micro_ftch_1 = require_micro_ftch();
	var fetchFromProvider = async (url, params) => {
		return (await (0, micro_ftch_1.default)(url, {
			headers: { "content-type": "application/json" },
			type: "json",
			data: {
				method: params.method,
				params: params.params,
				jsonrpc: "2.0",
				id: 1
			}
		})).result;
	};
	exports.fetchFromProvider = fetchFromProvider;
	var getProvider = (provider) => {
		if (typeof provider === "string") return provider;
		else if (provider?.connection?.url !== void 0) return provider.connection.url;
		else throw new Error("Must provide valid provider URL or Web3Provider");
	};
	exports.getProvider = getProvider;
}));
//#endregion
//#region node_modules/@ethereumjs/util/dist/index.js
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
	exports.toAscii = exports.stripHexPrefix = exports.padToEven = exports.isHexString = exports.isHexPrefixed = exports.getKeys = exports.getBinarySize = exports.fromUtf8 = exports.fromAscii = exports.arrayContainsArray = void 0;
	/**
	* Constants
	*/
	__exportStar(require_constants(), exports);
	/**
	* Units helpers
	*/
	__exportStar(require_units(), exports);
	/**
	* Account class and helper functions
	*/
	__exportStar(require_account(), exports);
	/**
	* Address type
	*/
	__exportStar(require_address(), exports);
	/**
	* Withdrawal type
	*/
	__exportStar(require_withdrawal(), exports);
	/**
	* ECDSA signature
	*/
	__exportStar(require_signature(), exports);
	/**
	* Utilities for manipulating Buffers, byte arrays, etc.
	*/
	__exportStar(require_bytes(), exports);
	/**
	* Helpful TypeScript types
	*/
	__exportStar(require_types(), exports);
	/**
	* Helper function for working with compact encoding
	*/
	__exportStar(require_encoding(), exports);
	/**
	* Export ethjs-util methods
	*/
	__exportStar(require_asyncEventEmitter(), exports);
	var internal_1 = require_internal();
	Object.defineProperty(exports, "arrayContainsArray", {
		enumerable: true,
		get: function() {
			return internal_1.arrayContainsArray;
		}
	});
	Object.defineProperty(exports, "fromAscii", {
		enumerable: true,
		get: function() {
			return internal_1.fromAscii;
		}
	});
	Object.defineProperty(exports, "fromUtf8", {
		enumerable: true,
		get: function() {
			return internal_1.fromUtf8;
		}
	});
	Object.defineProperty(exports, "getBinarySize", {
		enumerable: true,
		get: function() {
			return internal_1.getBinarySize;
		}
	});
	Object.defineProperty(exports, "getKeys", {
		enumerable: true,
		get: function() {
			return internal_1.getKeys;
		}
	});
	Object.defineProperty(exports, "isHexPrefixed", {
		enumerable: true,
		get: function() {
			return internal_1.isHexPrefixed;
		}
	});
	Object.defineProperty(exports, "isHexString", {
		enumerable: true,
		get: function() {
			return internal_1.isHexString;
		}
	});
	Object.defineProperty(exports, "padToEven", {
		enumerable: true,
		get: function() {
			return internal_1.padToEven;
		}
	});
	Object.defineProperty(exports, "stripHexPrefix", {
		enumerable: true,
		get: function() {
			return internal_1.stripHexPrefix;
		}
	});
	Object.defineProperty(exports, "toAscii", {
		enumerable: true,
		get: function() {
			return internal_1.toAscii;
		}
	});
	__exportStar(require_lock(), exports);
	__exportStar(require_provider(), exports);
}));
//#endregion
export { require_keccak as n, require_dist as t };
