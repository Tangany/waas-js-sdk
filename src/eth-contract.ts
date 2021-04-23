import * as t from "typeforce";
import {ISearchOptions, ISearchRequestConfig} from "./interfaces/common";
import {IContractCall, IEventSearchParams} from "./interfaces/ethereum-contract";
import {EthEventIterable} from "./iterables/auto-pagination/eth-event-iterable";
import {EthEventPageIterable} from "./iterables/pagewise/eth-event-page-iterable";
import {ContractCallResult} from "./types/common";
import {callContractFunction} from "./utils/eth-contract-call";
import {EventArgumentFilterCollection} from "./utils/event-argument-filter-collection";
import {Waas} from "./waas";
import {IWaasMethod} from "./waas-method";

/**
 * Set of methods regarding universal Ethereum smart contracts
 */
export class EthereumContract implements IWaasMethod {

    private readonly baseUrl: string;

    constructor(public waas: Waas, public readonly address: string) {
        t("String", address);
        this.baseUrl = `eth/contract/${address}`;
    }

    /**
     * Returns an asynchronous iterable to iterate **page by page** through the Ethereum transaction events that matched the search parameters.
     * @param [params] - Optional search parameters
     * @see [docs]{@link https://docs.tangany.com/#d0eb8e46-01f4-4027-a9ff-c2cad21ef1da}
     */
    public getEvents(params?: IEventSearchParams): EthEventPageIterable;

    /**
     * Returns an asynchronous iterable that yields **one Ethereum event per iteration**.
     * A page of transaction events that match the search parameters is fetched and saved once, so that all items can be returned one by one.
     * After that, the next page is loaded from the API and processed item by item again.
     * @param [params] - Optional search parameters
     * @param [options] - Additional options that do not affect the API request but the SDK-side processing
     * @see [docs]{@link https://docs.tangany.com/#d0eb8e46-01f4-4027-a9ff-c2cad21ef1da}
     */
    public getEvents(params?: IEventSearchParams, options?: { autoPagination: true }): EthEventIterable;

    /**
     * Returns an asynchronous iterable to iterate **page by page** through the Ethereum transaction events that matched the search parameters.
     * @param [params] - Optional search parameters
     * @param [options] - Additional options that do not affect the API request but the SDK-side processing
     * @see [docs]{@link https://docs.tangany.com/#d0eb8e46-01f4-4027-a9ff-c2cad21ef1da}
     */
    // tslint:disable-next-line:unified-signatures
    public getEvents(params?: IEventSearchParams, options?: ISearchOptions): EthEventPageIterable;

    public getEvents(params?: IEventSearchParams, options?: ISearchOptions): EthEventPageIterable | EthEventIterable {
        let url = `${this.baseUrl}/events`;
        // Build a query string for event argument filters due to its custom format
        if (params?.argumentFilters) {
            // TODO: It may be better to use the EventArgumentFilterCollection type in the search params interface (instead of this conversion) but this is a breaking change
            const filters = new EventArgumentFilterCollection(params.argumentFilters);
            url += filters.toQueryString();
            delete params.argumentFilters; // Remove this property as it is SDK-specific and cannot be processed by the endpoint
        }

        const initialRequest: ISearchRequestConfig = {url, params};
        if (options?.autoPagination) {
            return new EthEventIterable(this.waas, initialRequest);
        } else {
            return new EthEventPageIterable(this.waas, initialRequest);
        }
    }

    /**
     * Executes readonly functions of arbitrary Ethereum smart contracts.
     * If the contract function does not require any input values, instead of the configuration object,
     * the overload with two parameters (function name and output data types) can be used.
     * The default value for the output types is ["uint256"]. So this argument can be omitted for appropriate functions.
     */
    public async call(config: IContractCall): Promise<ContractCallResult>;
    public async call(functionName: string, types?: string[]): Promise<ContractCallResult>;
    public async call(config: IContractCall | string, types?: string[]): Promise<ContractCallResult> {
        return callContractFunction(this.waas, this.address)(config, types);
    }

}
