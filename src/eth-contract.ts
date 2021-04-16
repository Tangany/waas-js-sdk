import * as t from "typeforce";
import {IContractCall, IEventSearchParams} from "./interfaces/ethereum-contract";
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
     * Returns an async iterable object that is able to query lists of Ethereum smart contract events based on passed filter criteria
     * @example
     * const iterable = api.eth().contract(contract).getEvents(query); // returns an AsyncIterable object
     * for await (const page of iterable) {
     *   const e = await page.list[0].get(); // returns the event data for the first match of every query iteration
     *   console.log(e.event);
     * }
     *
     * const eventsIterator = api.eth().contract(contract).getEvents(query)[Symbol.asyncIterator]() // returns a new AsyncIterator Object
     * console.log(await eventsIterator.next()); // {value: { event: ...}, done: false}
     */
    public getEvents(params?: IEventSearchParams): EthEventPageIterable {
        let url = `${this.baseUrl}/events`;

        // Build a query string for event argument filters due to its custom format
        if (params?.argumentFilters) {
            // TODO: It may be better to use the EventArgumentFilterCollection type in the search params interface (instead of this conversion) but this is a breaking change
            const filters = new EventArgumentFilterCollection(params.argumentFilters);
            url += filters.toQueryString();
            delete params.argumentFilters; // Remove this property as it is SDK-specific and cannot be processed by the endpoint
        }

        return new EthEventPageIterable(this.waas, {url, params});
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
