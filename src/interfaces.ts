import {WalletSecurity, WalletVersion} from "./waas";

export type BlockchainTransactionStatuses = "unknown" | "pending" | "confirmed" | "error";

/**
 * Represents the response of a ERC20 token wallet balance
 */
export interface ITokenBalance {
    balance: string;
    currency: string;
}

/**
 * Represents a wallet list operation response
 */
export interface ITransaction {
    hash: string;
}

/**
 * Represents a wallet response
 */
export interface IWallet {
    wallet: string;
    security: WalletSecurity;
    updated: string;
    created: string;
    version: string | WalletVersion.LATEST;
}

/**
 * Represents a wallet list operation response
 */
export interface IWalletList {
    list: IWallet[];
    skiptoken: string;
}

/**
 * Represents the response of a soft-deleted wallet
 */
export interface ISoftDeletedWallet {
    recoveryId: string;
    scheduledPurgeDate: string;
}

/**
 * Represents the response of a Blockchain wallet balance
 */
export interface IWalletBalance {
    address: string;
    balance: string;
    currency: string;
}

export type IBlockchainTransactionStatus = IEthereumTransactionStatus | IBitcoinTransactionStatus;

/**
 * Represents the transaction status response for the Ethereum network
 */
export interface IEthereumTransactionStatus {
    isError: boolean;
    blockNr: number | null;
    status: BlockchainTransactionStatuses;
    confirmations: number | null;
    data: string | null;
}

/**
 * Represents the transaction status response for the Bitcoin network
 */
export interface IBitcoinTransactionStatus {
    status: BlockchainTransactionStatuses;
    confirmations: number | null;
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
 * Represents a transaction recipient configuration
 * @param to - Recipient address
 * @param amount - Float currency amount formatted as a string
 */
export interface IRecipient {
    to: string;
    amount: string;
}

/**
 * Represents a transaction recipient configuration
 * @param to - Recipient ethereum address
 * @param amount - Float Ether amount formatted as a string
 * @param [data] - Ethereum transaction data payload
 */
export interface IEthereumRecipient extends IRecipient {
    data?: string;
}

export interface IWaasError {
    statusCode: number;
    activityId: string;
    message: string;
}

/**
 * Represents the current state of an asynchronous request
 */
export interface IAsyncRequestStatus<T extends Record<string, any>> {
    process: string,
    status: {
        stage: string,
        [k: string]: string,
    },
    created: Date,
    updated: Date,
    output: null | T
}

/**
 * Represents the output of an asynchronous request for ethereum transactions
 */
export interface IAsyncEthereumTransactionOutput {
    hash: string;
    blockNr: number;
    data: string;
    status: string;
}

/**
 * Represents an RLP encoded transaction that is already signed
 */
export interface ITransmittableTransaction {
    rawTransaction: string;
}

/**
 * Represents the configuration of a Smart Contract method call
 */
export interface IContractMethod {
    function: string,
    inputs: string[],
}
