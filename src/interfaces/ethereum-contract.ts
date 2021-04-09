import {IHateoasLink, ISearchResponse} from "./common";

/**
 * Represents the basic configuration to execute a smart contract function.
 * Besides the Solidity types, `wallet` can also be used as function parameter type to specify a wallet name as input.
 * This name is then translated to an address.
 */
interface IContractFunction {
    function: string;

    /**
     * The associated endpoints allow an array of arguments, which may each contain arbitrary JSON-compatible values.
     * In order not to lose this flexibility, the type `unknown` is used.
     */
    inputs?: unknown[];
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

/**
 * Query parameters describing filters to narrow down a search in all events of a contract.
 * `hash` must contain lower case Ethereum transaction hash
 * `blocknr` must be stringified numbers > "0"
 * `event` must be a stringified event string like "approved"
 * `index` must be >= "0" and `limit` must be within "1" and "100"
 */
export interface IEventSearchParams {
    hash?: string;
    blocknr?: string;
    event?: string;
    sort?: "event" | "eventdesc" | "blocknr" | "blocknrdesc" | "logindex" | "logindexdesc" | "timestamp" | "timestampdesc";
    limit?: number;
    index?: number;
    argumentFilters?: IEventArgumentFilter[];
}

/**
 * Represents a single filter item to search smart contract events based on their arguments.
 * All properties are optional because they can be combined depending on the use case.
 */
export interface IEventArgumentFilter {

    /**
     * This can be the positional number (e.g. 2) or the name of an event argument (e.g. "from")
     */
    position?: number | string;

    /**
     * Defines the Solidity type of the event argument. The API-side default is `address`.
     */
    type?: string;

    /**
     * Defines the argument value to filter by. The associated endpoints allow any JSON-compatible values.
     * In order not to lose this flexibility, the type `unknown` is used for array values, which enables arbitrary nesting.
     */
    value?: string | boolean | number | unknown[];
}

export interface IEventSearchResponse extends ISearchResponse {
    list: {
        event: string;
        links: IHateoasLink<"event">[];
    }[];
}

/**
 * Search result object of an Ethereum event
 */
export interface ITransactionEvent {
    event: string;
    contract: string;
    timestamp: number;
    transactionIndex: number;
    logIndex: number;
    blockNr: number;
    inputs: {
        value: string;
        name: string;
        type: string;
    }[];
}
