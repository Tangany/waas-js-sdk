import {INodeStatus} from "./common";
import {TransactionStatus} from "../types/common";

/**
 * Represents the transaction status response for the Bitcoin network
 */
export interface IBitcoinTransaction {
    status: TransactionStatus;
    confirmations: number | null;
    blockHash: string | null;
    blockNr: number | null;
}

/**
 * Represents a Bitcoin transaction estimation
 */
export interface IBitcoinTransactionEstimation {
    fee: string;
    feeRate: number;
}

/**
 * Represents the transaction status after a sweep operation
 */
export interface IBitcoinSweepResult extends Pick<IBitcoinTransaction, "status" | "blockNr"> {
    hash: string | null;
}

/**
 * Represents the output of an asynchronous request for Bitcoin transactions
 */
export interface IAsyncBitcoinTransactionOutput {
    hash: string;
    blockNr: number | null;
    status: string;
}

export interface IBtcStatus extends INodeStatus<IBtcNodeInfo> {
}

interface IBtcNodeInfo {
    version: number | null;
    protocolversion: number | null;
    blocks: number | null;
    timeoffset: number | null;
    connections: number | null;
    difficulty: number | null;
    testnet: boolean | null;
    relayfee: number | null;
}
