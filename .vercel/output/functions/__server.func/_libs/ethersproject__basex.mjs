import { S as init_lib_esm, a as defineReadOnly, h as arrayify } from "./@ethersproject/abstract-provider+[...].mjs";
//#region node_modules/@ethersproject/basex/lib.esm/index.js
init_lib_esm();
var BaseX = class {
	constructor(alphabet) {
		defineReadOnly(this, "alphabet", alphabet);
		defineReadOnly(this, "base", alphabet.length);
		defineReadOnly(this, "_alphabetMap", {});
		defineReadOnly(this, "_leader", alphabet.charAt(0));
		for (let i = 0; i < alphabet.length; i++) this._alphabetMap[alphabet.charAt(i)] = i;
	}
	encode(value) {
		let source = arrayify(value);
		if (source.length === 0) return "";
		let digits = [0];
		for (let i = 0; i < source.length; ++i) {
			let carry = source[i];
			for (let j = 0; j < digits.length; ++j) {
				carry += digits[j] << 8;
				digits[j] = carry % this.base;
				carry = carry / this.base | 0;
			}
			while (carry > 0) {
				digits.push(carry % this.base);
				carry = carry / this.base | 0;
			}
		}
		let string = "";
		for (let k = 0; source[k] === 0 && k < source.length - 1; ++k) string += this._leader;
		for (let q = digits.length - 1; q >= 0; --q) string += this.alphabet[digits[q]];
		return string;
	}
	decode(value) {
		if (typeof value !== "string") throw new TypeError("Expected String");
		let bytes = [];
		if (value.length === 0) return new Uint8Array(bytes);
		bytes.push(0);
		for (let i = 0; i < value.length; i++) {
			let byte = this._alphabetMap[value[i]];
			if (byte === void 0) throw new Error("Non-base" + this.base + " character");
			let carry = byte;
			for (let j = 0; j < bytes.length; ++j) {
				carry += bytes[j] * this.base;
				bytes[j] = carry & 255;
				carry >>= 8;
			}
			while (carry > 0) {
				bytes.push(carry & 255);
				carry >>= 8;
			}
		}
		for (let k = 0; value[k] === this._leader && k < value.length - 1; ++k) bytes.push(0);
		return arrayify(new Uint8Array(bytes.reverse()));
	}
};
new BaseX("abcdefghijklmnopqrstuvwxyz234567");
var Base58 = new BaseX("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
//#endregion
export { Base58 as t };
