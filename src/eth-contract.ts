import * as t from "typeforce";
import {IContractCall, IEventSearchParams, ITransactionEvent} from "./interfaces/ethereum-contract";
import {ContractCallResult} from "./types/common";
import {callContractFunction} from "./utils/eth-contract-call";
import {wrapSearchRequestIterable} from "./utils/search-request-wrapper";
import {Waas} from "./waas";
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
    public getEvents(params: IEventSearchParams = {}) {
        return wrapSearchRequestIterable<ITransactionEvent, IEthereumContractEventSearchItemData>(this.waas, `${this.baseUrl}/events`, params);
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
