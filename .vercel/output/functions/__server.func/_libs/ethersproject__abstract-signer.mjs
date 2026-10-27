import { O as Logger, a as defineReadOnly, k as init_lib_esm, o as resolveProperties, s as shallowCopy } from "./@ethersproject/abstract-provider+[...].mjs";
//#region node_modules/@ethersproject/abstract-signer/lib.esm/_version.js
init_lib_esm();
var version = "abstract-signer/5.8.0";
//#endregion
//#region node_modules/@ethersproject/abstract-signer/lib.esm/index.js
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
var allowedTransactionKeys = [
	"accessList",
	"ccipReadEnabled",
	"chainId",
	"customData",
	"data",
	"from",
	"gasLimit",
	"gasPrice",
	"maxFeePerGas",
	"maxPriorityFeePerGas",
	"nonce",
	"to",
	"type",
	"value"
];
var forwardErrors = [
	Logger.errors.INSUFFICIENT_FUNDS,
	Logger.errors.NONCE_EXPIRED,
	Logger.errors.REPLACEMENT_UNDERPRICED
];
var Signer = class Signer {
	constructor() {
		logger.checkAbstract(new.target, Signer);
		defineReadOnly(this, "_isSigner", true);
	}
	getBalance(blockTag) {
		return __awaiter(this, void 0, void 0, function* () {
			this._checkProvider("getBalance");
			return yield this.provider.getBalance(this.getAddress(), blockTag);
		});
	}
	getTransactionCount(blockTag) {
		return __awaiter(this, void 0, void 0, function* () {
			this._checkProvider("getTransactionCount");
			return yield this.provider.getTransactionCount(this.getAddress(), blockTag);
		});
	}
	estimateGas(transaction) {
		return __awaiter(this, void 0, void 0, function* () {
			this._checkProvider("estimateGas");
			const tx = yield resolveProperties(this.checkTransaction(transaction));
			return yield this.provider.estimateGas(tx);
		});
	}
	call(transaction, blockTag) {
		return __awaiter(this, void 0, void 0, function* () {
			this._checkProvider("call");
			const tx = yield resolveProperties(this.checkTransaction(transaction));
			return yield this.provider.call(tx, blockTag);
		});
	}
	sendTransaction(transaction) {
		return __awaiter(this, void 0, void 0, function* () {
			this._checkProvider("sendTransaction");
			const tx = yield this.populateTransaction(transaction);
			const signedTx = yield this.signTransaction(tx);
			return yield this.provider.sendTransaction(signedTx);
		});
	}
	getChainId() {
		return __awaiter(this, void 0, void 0, function* () {
			this._checkProvider("getChainId");
			return (yield this.provider.getNetwork()).chainId;
		});
	}
	getGasPrice() {
		return __awaiter(this, void 0, void 0, function* () {
			this._checkProvider("getGasPrice");
			return yield this.provider.getGasPrice();
		});
	}
	getFeeData() {
		return __awaiter(this, void 0, void 0, function* () {
			this._checkProvider("getFeeData");
			return yield this.provider.getFeeData();
		});
	}
	resolveName(name) {
		return __awaiter(this, void 0, void 0, function* () {
			this._checkProvider("resolveName");
			return yield this.provider.resolveName(name);
		});
	}
	checkTransaction(transaction) {
		for (const key in transaction) if (allowedTransactionKeys.indexOf(key) === -1) logger.throwArgumentError("invalid transaction key: " + key, "transaction", transaction);
		const tx = shallowCopy(transaction);
		if (tx.from == null) tx.from = this.getAddress();
		else tx.from = Promise.all([Promise.resolve(tx.from), this.getAddress()]).then((result) => {
			if (result[0].toLowerCase() !== result[1].toLowerCase()) logger.throwArgumentError("from address mismatch", "transaction", transaction);
			return result[0];
		});
		return tx;
	}
	populateTransaction(transaction) {
		return __awaiter(this, void 0, void 0, function* () {
			const tx = yield resolveProperties(this.checkTransaction(transaction));
			if (tx.to != null) {
				tx.to = Promise.resolve(tx.to).then((to) => __awaiter(this, void 0, void 0, function* () {
					if (to == null) return null;
					const address = yield this.resolveName(to);
					if (address == null) logger.throwArgumentError("provided ENS name resolves to null", "tx.to", to);
					return address;
				}));
				tx.to.catch((error) => {});
			}
			const hasEip1559 = tx.maxFeePerGas != null || tx.maxPriorityFeePerGas != null;
			if (tx.gasPrice != null && (tx.type === 2 || hasEip1559)) logger.throwArgumentError("eip-1559 transaction do not support gasPrice", "transaction", transaction);
			else if ((tx.type === 0 || tx.type === 1) && hasEip1559) logger.throwArgumentError("pre-eip-1559 transaction do not support maxFeePerGas/maxPriorityFeePerGas", "transaction", transaction);
			if ((tx.type === 2 || tx.type == null) && tx.maxFeePerGas != null && tx.maxPriorityFeePerGas != null) tx.type = 2;
			else if (tx.type === 0 || tx.type === 1) {
				if (tx.gasPrice == null) tx.gasPrice = this.getGasPrice();
			} else {
				const feeData = yield this.getFeeData();
				if (tx.type == null) {
					if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
						tx.type = 2;
						if (tx.gasPrice != null) {
							const gasPrice = tx.gasPrice;
							delete tx.gasPrice;
							tx.maxFeePerGas = gasPrice;
							tx.maxPriorityFeePerGas = gasPrice;
						} else {
							if (tx.maxFeePerGas == null) tx.maxFeePerGas = feeData.maxFeePerGas;
							if (tx.maxPriorityFeePerGas == null) tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
						}
					} else if (feeData.gasPrice != null) {
						if (hasEip1559) logger.throwError("network does not support EIP-1559", Logger.errors.UNSUPPORTED_OPERATION, { operation: "populateTransaction" });
						if (tx.gasPrice == null) tx.gasPrice = feeData.gasPrice;
						tx.type = 0;
					} else logger.throwError("failed to get consistent fee data", Logger.errors.UNSUPPORTED_OPERATION, { operation: "signer.getFeeData" });
				} else if (tx.type === 2) {
					if (tx.maxFeePerGas == null) tx.maxFeePerGas = feeData.maxFeePerGas;
					if (tx.maxPriorityFeePerGas == null) tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
				}
			}
			if (tx.nonce == null) tx.nonce = this.getTransactionCount("pending");
			if (tx.gasLimit == null) tx.gasLimit = this.estimateGas(tx).catch((error) => {
				if (forwardErrors.indexOf(error.code) >= 0) throw error;
				return logger.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", Logger.errors.UNPREDICTABLE_GAS_LIMIT, {
					error,
					tx
				});
			});
			if (tx.chainId == null) tx.chainId = this.getChainId();
			else tx.chainId = Promise.all([Promise.resolve(tx.chainId), this.getChainId()]).then((results) => {
				if (results[1] !== 0 && results[0] !== results[1]) logger.throwArgumentError("chainId address mismatch", "transaction", transaction);
				return results[0];
			});
			return yield resolveProperties(tx);
		});
	}
	_checkProvider(operation) {
		if (!this.provider) logger.throwError("missing provider", Logger.errors.UNSUPPORTED_OPERATION, { operation: operation || "_checkProvider" });
	}
	static isSigner(value) {
		return !!(value && value._isSigner);
	}
};
//#endregion
export { Signer as t };
