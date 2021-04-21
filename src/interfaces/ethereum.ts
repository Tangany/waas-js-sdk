import {Optional, TransactionStatus} from "../types/common";
import {IHateoasLink, INodeStatus, IRecipient, ISearchResponse} from "./common";

/**
 * Represents an Ethereum transaction recipient configuration.
 * One of the properties `to` or `wallet` must be set.
 * If both are set, the specified address needs to belong to the wallet.
 */
export interface IEthereumRecipient extends Optional<IRecipient, "amount"> {
    /** Ethereum transaction data payload */
    data?: string;
}

/**
 * Represents the transaction status response for the Ethereum network
 */
export interface IEthereumTransaction {
    isError: boolean;
    blockNr: number | null;
    status: TransactionStatus;
    confirmations: number | null;
    data: string | null;
    from: string | null;
    to: string | null;
    contractCreation: string | null;
    gasPrice: string | null;
    gas: number | null;
    gasUsed: number | null;
    nonce: number | null;
    value: string | null;
    timestamp: number | null;
    transactionIndex: number | null;
}

/**
 * Represents an Ethereum transaction estimation
 */
export interface IEthereumTransactionEstimation {
    gas: string;
    gasPrice: string;
    fee: string;
    data: string;
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

export interface IEthStatus extends INodeStatus<IEthStatusInfo> {
}

interface IEthStatusInfo {
    peerCount: number | null;
    protocolVersion: string | null;
    blockNumber: number | null;
    chainId: number | null;
    gasPrice: number | null;
}

/**
 * Represents the response of a ERC20 token wallet balance
 */
export interface ITokenBalance {
    balance: string;
    currency: string;
}

/**
 * Query parameters describing filters to narrow down a search in all transactions of a chain.
 * `from` and `to` must contain lower case Ethereum addresses
 * `blocknr` and `nonce` must be stringified numbers > "0"
 * `iserror` must be a stringified boolean "true" or "false"
 * `index` must be >= "0" and `limit` must be within "1" and "100"
 */
export interface ITransactionSearchParams {
    from?: string;
    to?: string;
    blocknr?: string;
    nonce?: string;
    iserror?: string;
    sort?: "value" | "valuedesc" | "blocknr" | "blocknrdesc" | "nonce" | "noncedesc" | "to" | "todesc" | "from" | "fromdesc" | "timestamp" | "timestampdesc" | "transactionindex" | "transactionindexdesc";
    limit?: string;
    index?: string;
}

export interface IWalletTransactionSearchParams extends ITransactionSearchParams {
    direction?: "in" | "out";
}

export interface ITransactionSearchResponse extends ISearchResponse {
    list: {
        hash: string;
        links: IHateoasLink<"transaction">[];
    }[];
}
