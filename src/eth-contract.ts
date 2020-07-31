import * as t from "typeforce"
import {ISearchContractEventsQueryParams, ISearchTxEventResponse} from "./interfaces";
import {wrapSearchRequestIterable} from "./search-request-wrapper";
import {Waas} from "./waas"
import {IWaasMethod} from "./waas-method";

export interface IEthereumContractEventSearchItemData {
    event: string
}

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
     * const eventsIterable = api.eth().contract(contract).getEvents(query); // returns an AsyncIterable object
     * for await (const value of iterable) {
     *   const e = await value.list[0].get(); // returns the event data for the first match of every query iteration
     *   console.log(e.event);
     * }
     *
     * const eventsIterator = api.eth().contract(contract).getEvents(query)[Symbol.asyncIterator]() // returns an new AsyncIterator Object
     * console.log(await eventsIterator.next()); // {value: { event: ...}, done: false}
     */
    public getEvents(queryParams: ISearchContractEventsQueryParams = {}) {
        return wrapSearchRequestIterable<ISearchTxEventResponse, IEthereumContractEventSearchItemData>(this.waas, `${this.baseUrl}/events`, queryParams);
    }

}
