import * as t from "typeforce"
import {ISearchContractEventsQueryParams, ISearchTxEventResponse} from "./interfaces";
import {wrapSearchRequest} from "./search-request-wrapper";
import {Waas} from "./waas"
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
     * Queries a list of Ethereum smart contract events based on passed filter criteria.
     * @param [queryParams]
     */
    public async getEvents(queryParams: ISearchContractEventsQueryParams = {}) {
        return wrapSearchRequest<ISearchTxEventResponse, { event: string }>(this.waas, `${this.baseUrl}/events`, queryParams);
    }

}
