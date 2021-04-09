import {NodeStatus} from "../types/common";

export interface IWaasError {
    statusCode: number;
    activityId: string;
    message: string;
}

export interface IPaginationResponse {
    links: {
        next: string | null;
        previous: string | null;
    };
}

/**
 * A single HATEOAS link containing information to perform related resource operations
 */
export interface IHateoasLink<TRelation> {
    href: string;
    type: string;
    rel: TRelation;
}

/**
 * Represents the response of an asynchronous endpoint that returns a link to its status.
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
 * Represents a transaction recipient configuration.
 * One of the properties `to` or `wallet` must be set.
 * If both are set, the specified address needs to belong to the wallet.
 */
export interface IRecipient {
    /** Recipient address */
    to?: string;

    /** Name of a wallet in the current key vault */
    wallet?: string;

    /** Float currency amount formatted as a string */
    amount: string;
}

export interface ITransactionSentResponse {
    hash: string;
}

export interface INodeStatus<T> {
    status: NodeStatus;
    info: T;
}

/**
 * API response object sent to the client as a search result.
 * It contains the number of results, an result array and pagination links.
 */
export interface ISearchResponse extends IPaginationResponse {
    hits: {
        total: number;
    };
    // The object definition for "list" describes only the minimum content and needs to be overwritten depending on the resource.
    list: {
        links: IHateoasLink<string>[];
    }[];
}
