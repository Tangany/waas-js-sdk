import {WalletSecurity, WalletVersion} from "./waas";

export type BlockchainTransactionStatuses = "unknown" | "pending" | "confirmed" | "error";
type NodeStatus = "live" | "unavailable" | "faulty";

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
 * Represents the transaction status response for the Bitcoin network
 */
export interface IBitcoinTransactionStatus {
    status: BlockchainTransactionStatuses;
    confirmations: number | null;
    blockHash: string | null;
    blockNr: number | null;
}

/**
 * Represents the transaction status after a sweep operation
 */
export interface IBitcoinSweepResult extends Pick<IBitcoinTransactionStatus, "status" | "blockNr">{
    hash: string | null;
}

/**
 * Represents a Bitcoin transaction estimation
 */
export interface IBitcoinTransactionEstimation {
    fee: string;
    feeRate: number;
}

/**
 * Represents an Ethereum transaction estimation
 */
export interface IEthereumTransactionEstimation {
    gas: string;
    gasPrice: string;
    fee: string;
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
 * Represents the response of an asynchronous endpoints that returns a link to its status.
 */
export interface IAsyncEndpointResponse {
    statusUri: string
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
 * Represents the basic configuration to execute a smart contract function.
 * Besides the Solidity types, `wallet` can also be used as function parameter type to specify a wallet name as input.
 * This name is then translated to an address.
 */
interface IContractFunction {
    function: string;
    inputs: (boolean | number | string)[];
}

/**
 * Configuration to execute a smart contract function triggered by sending a transaction.
 */
export interface IContractTransaction extends IContractFunction {
    amount?: string
}

/**
 * Configuration for a smart contract function method call (this means readonly).
 */
export interface IContractCall extends IContractFunction {
    outputs: string[];
}

export interface IContractCallResponse {
    list: {
        type: string;
        value: string;
    }[];
}

export type ContractCallResult = IContractCallResponse["list"]

/* ----------- INTERFACES FOR SEARCH REQUESTS ----------- */
export type ISearchQueryParams = ISearchTxQueryParams | ISearchContractEventsQueryParams;

/**
 * Query parameters describing filters to narrow down a search in all transactions of a chain.
 * `from` and `to` must contain lower case Ethereum addresses
 * `blocknr` and `nonce` must be stringified numbers > "0"
 * `iserror` must be a stringified boolean "true" or "false"
 * `index` must be >= "0" and `limit` must be within "1" and "100"
 */
export interface ISearchTxQueryParams {
    from?: string;
    to?: string;
    blocknr?: string;
    nonce?: string;
    iserror?: string;
    sort?: "value" | "valuedesc" | "blocknr" | "blocknrdesc" | "nonce" | "noncedesc" | "to" | "todesc" | "from" | "fromdesc" | "timestamp" | "timestampdesc";
    limit?: string;
    index?: string;
}

export interface IWalletSearchTxQueryParams extends ISearchTxQueryParams {
    direction?: "in" | "out";
}

/**
 * Query parameters describing filters to narrow down a search in all events of a contract.
 * `hash` must contain lower case Ethereum transaction hash
 * `blocknr` must be stringified numbers > "0"
 * `event` must be a stringified event string like "approved"
 * `index` must be >= "0" and `limit` must be within "1" and "100"
 */
export interface ISearchContractEventsQueryParams {
    hash?: string;
    blocknr?: string;
    event?: string;
    sort?: "event" | "eventdesc" | "blocknr" | "blocknrdesc" | "logindex" | "logindexdesc" | "timestamp" | "timestampdesc";
    limit?: number;
    index?: number;
}

export interface ISearchTxResponse extends ISearchResponse {
    list: ITxListItem[];
}

/**
 * Same as {@link ISearchResponse} except an adjusted `list` property
 */
export interface ISearchContractEventsResponse extends ISearchResponse {
    list: IContractEventListItem[];
}

/**
 * Search response object sent to user as a search result.
 * It contains the number of results, an result array and pagination links
 */
export interface ISearchResponse {
    hits: {
        total: number;
    };
    // The object definition for "list" describes only the minimum content and should be overwritten depending on the resource.
    list: {
        links: ILinksItem[]
    }[];
    links: {
        next: string | null;
        previous: string | null;
    };
}

/**
 * A single link object containing information to retrieve a search result
 */
interface ILinksItem {
    href: string;
    type: "GET";
    rel: string;
}

/**
 * A single search result in the search result list of a search response.
 * Always contains the transaction hash and an array of possibilities to obtain the transaction
 */
interface ITxListItem {
    hash: string;
    links: ITxLinksItem[];
}

interface ITxLinksItem extends ILinksItem {
    rel: "transaction";
}

/**
 * Same as {@link ITxListItem} except  an `event` property instead of a `hash` property
 */
interface IContractEventListItem {
    event: string;
    links: IContractEventLinksItem[];
}

interface IContractEventLinksItem extends ILinksItem {
    rel: "event";
}

/**
 * Search result object of an Ethereum event
 */
export interface ISearchTxEventResponse {
    event: string;
    contract: string;
    timestamp: number;
    transactionIndex: number;
    logIndex: number;
    blockNr: number;
    inputs: IEventInput[];
}

/**
 * An Ethereum event input.
 */
interface IEventInput {
    value: string;
    name: string;
    type: string;
}

/* ----------- END OF INTERFACES FOR SEARCH REQUESTS ----------- */

export interface IEthStatus {
    status: NodeStatus;
    info: IEthStatusInfo;
}

interface IEthStatusInfo {
    peerCount: number | null;
    protocolVersion: string | null;
    blockNumber: number | null;
    chainId: number | null;
    gasPrice: number | null;
}

export interface IBtcStatus {
    status: NodeStatus;
    info: IBtcNodeGetInfo;
}

interface IBtcNodeGetInfo {
    version: number | null;
    protocolversion: number | null;
    blocks: number | null;
    timeoffset: number | null;
    connections: number | null;
    difficulty: number | null;
    testnet: boolean | null;
    relayfee: number | null;
}
