import { O as Logger, S as init_lib_esm, T as joinSignature, a as defineReadOnly, g as concat, h as arrayify, k as init_lib_esm$1, o as resolveProperties, t as Provider, w as isHexString, y as hexDataSlice } from "./@ethersproject/abstract-provider+[...].mjs";
import { r as keccak256, t as getAddress } from "./@ethersproject/address+[...].mjs";
import { n as hashMessage, t as TypedDataEncoder } from "./@ethersproject/hash+[...].mjs";
import { t as Signer } from "./ethersproject__abstract-signer.mjs";
import { c as SigningKey, n as defaultPath, o as computeAddress, r as entropyToMnemonic, s as serialize, t as HDNode } from "./@ethersproject/hdnode+[...].mjs";
import { i as randomBytes, n as decryptJsonWalletSync, r as encrypt, t as decryptJsonWallet } from "./@ethersproject/json-wallets+[...].mjs";
//#region node_modules/@ethersproject/wallet/lib.esm/_version.js
init_lib_esm$1();
init_lib_esm();
var version = "wallet/5.8.0";
//#endregion
//#region node_modules/@ethersproject/wallet/lib.esm/index.js
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
function isAccount(value) {
	return value != null && isHexString(value.privateKey, 32) && value.address != null;
}
function hasMnemonic(value) {
	const mnemonic = value.mnemonic;
	return mnemonic && mnemonic.phrase;
}
var Wallet = class Wallet extends Signer {
	constructor(privateKey, provider) {
		super();
		if (isAccount(privateKey)) {
			const signingKey = new SigningKey(privateKey.privateKey);
			defineReadOnly(this, "_signingKey", () => signingKey);
			defineReadOnly(this, "address", computeAddress(this.publicKey));
			if (this.address !== getAddress(privateKey.address)) logger.throwArgumentError("privateKey/address mismatch", "privateKey", "[REDACTED]");
			if (hasMnemonic(privateKey)) {
				const srcMnemonic = privateKey.mnemonic;
				defineReadOnly(this, "_mnemonic", () => ({
					phrase: srcMnemonic.phrase,
					path: srcMnemonic.path || "m/44'/60'/0'/0/0",
					locale: srcMnemonic.locale || "en"
				}));
				const mnemonic = this.mnemonic;
				const node = HDNode.fromMnemonic(mnemonic.phrase, null, mnemonic.locale).derivePath(mnemonic.path);
				if (computeAddress(node.privateKey) !== this.address) logger.throwArgumentError("mnemonic/address mismatch", "privateKey", "[REDACTED]");
			} else defineReadOnly(this, "_mnemonic", () => null);
		} else {
			if (SigningKey.isSigningKey(privateKey)) {
				/* istanbul ignore if */
				if (privateKey.curve !== "secp256k1") logger.throwArgumentError("unsupported curve; must be secp256k1", "privateKey", "[REDACTED]");
				defineReadOnly(this, "_signingKey", () => privateKey);
			} else {
				if (typeof privateKey === "string") {
					if (privateKey.match(/^[0-9a-f]*$/i) && privateKey.length === 64) privateKey = "0x" + privateKey;
				}
				const signingKey = new SigningKey(privateKey);
				defineReadOnly(this, "_signingKey", () => signingKey);
			}
			defineReadOnly(this, "_mnemonic", () => null);
			defineReadOnly(this, "address", computeAddress(this.publicKey));
		}
		/* istanbul ignore if */
		if (provider && !Provider.isProvider(provider)) logger.throwArgumentError("invalid provider", "provider", provider);
		defineReadOnly(this, "provider", provider || null);
	}
	get mnemonic() {
		return this._mnemonic();
	}
	get privateKey() {
		return this._signingKey().privateKey;
	}
	get publicKey() {
		return this._signingKey().publicKey;
	}
	getAddress() {
		return Promise.resolve(this.address);
	}
	connect(provider) {
		return new Wallet(this, provider);
	}
	signTransaction(transaction) {
		return resolveProperties(transaction).then((tx) => {
			if (tx.from != null) {
				if (getAddress(tx.from) !== this.address) logger.throwArgumentError("transaction from address mismatch", "transaction.from", transaction.from);
				delete tx.from;
			}
			const signature = this._signingKey().signDigest(keccak256(serialize(tx)));
			return serialize(tx, signature);
		});
	}
	signMessage(message) {
		return __awaiter(this, void 0, void 0, function* () {
			return joinSignature(this._signingKey().signDigest(hashMessage(message)));
		});
	}
	_signTypedData(domain, types, value) {
		return __awaiter(this, void 0, void 0, function* () {
			const populated = yield TypedDataEncoder.resolveNames(domain, types, value, (name) => {
				if (this.provider == null) logger.throwError("cannot resolve ENS names without a provider", Logger.errors.UNSUPPORTED_OPERATION, {
					operation: "resolveName",
					value: name
				});
				return this.provider.resolveName(name);
			});
			return joinSignature(this._signingKey().signDigest(TypedDataEncoder.hash(populated.domain, types, populated.value)));
		});
	}
	encrypt(password, options, progressCallback) {
		if (typeof options === "function" && !progressCallback) {
			progressCallback = options;
			options = {};
		}
		if (progressCallback && typeof progressCallback !== "function") throw new Error("invalid callback");
		if (!options) options = {};
		return encrypt(this, password, options, progressCallback);
	}
	/**
	*  Static methods to create Wallet instances.
	*/
	static createRandom(options) {
		let entropy = randomBytes(16);
		if (!options) options = {};
		if (options.extraEntropy) entropy = arrayify(hexDataSlice(keccak256(concat([entropy, options.extraEntropy])), 0, 16));
		const mnemonic = entropyToMnemonic(entropy, options.locale);
		return Wallet.fromMnemonic(mnemonic, options.path, options.locale);
	}
	static fromEncryptedJson(json, password, progressCallback) {
		return decryptJsonWallet(json, password, progressCallback).then((account) => {
			return new Wallet(account);
		});
	}
	static fromEncryptedJsonSync(json, password) {
		return new Wallet(decryptJsonWalletSync(json, password));
	}
	static fromMnemonic(mnemonic, path, wordlist) {
		if (!path) path = defaultPath;
		return new Wallet(HDNode.fromMnemonic(mnemonic, null, wordlist).derivePath(path));
	}
};
//#endregion
export { Wallet as t };
