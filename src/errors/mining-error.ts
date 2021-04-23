import {IBitcoinTransaction} from "../interfaces/bitcoin";
import {IEthereumTransaction} from "../interfaces/ethereum";
import {Transaction} from "../types/common";
import {HttpError} from "./http-error";

export class MiningError extends HttpError {
    constructor(public readonly txData: Transaction, message = "Transaction was not mined due to an error") {
        super(message, 400);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, MiningError.prototype);
    }
}

export function isEthereumMiningErrorData(txData: Transaction): txData is IEthereumTransaction {
    return txData.hasOwnProperty("isError");
}

export function isBitcoinMiningErrorData(txData: Transaction): txData is IBitcoinTransaction {
    return !isEthereumMiningErrorData(txData);
}
