import {HttpError} from "./http-error";
import {IBitcoinTransactionStatus, IBlockchainTransactionStatus, IEthereumTransactionStatus} from "../interfaces";

export class MiningError extends HttpError {
    constructor(public readonly txData: IBlockchainTransactionStatus, message = "Transaction was not mined due to an error") {
        super(message, 400);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, MiningError.prototype);
    }
}

export function isEthereumMiningErrorData(txData: IBlockchainTransactionStatus): txData is IEthereumTransactionStatus {
    return txData.data.hasOwnProperty("isError");
}

export function isBitcoinMiningErrorData(txData: IBlockchainTransactionStatus): txData is IBitcoinTransactionStatus {
    return !isEthereumMiningErrorData(txData);
}
