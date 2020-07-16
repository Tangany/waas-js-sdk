import {EthereumContract} from "./eth-contract"
import {wrapSearchRequest} from "./search-request-wrapper";
import {IWaitForTxStatus, Waas} from "./waas";
import {IEthereumTransactionStatus, ISearchTxEventResponse, ISearchTxQueryParams} from "./interfaces";
import * as t from "typeforce";
import {IWaasMethod} from "./waas-method";

export interface ISearchItemData {
    hash: string
}

/**
 * Instantiates a new Ethereum interface
 * @param instance -  {@link Waas} instance
 * @param [txHash] - Ethereum transaction hash
 */
export class Ethereum implements IWaasMethod {

    constructor(public waas: Waas, private readonly transactionHash?: string) {
        t("?String", transactionHash);
    }

    get txHash() {
        t("String", this.transactionHash);
        return this.transactionHash!;
    }

    /**
     * Establish a sticky session with a Ethereum full node by fetching and setting affinity cookies for the current Waas instance
     */
    public async fetchAffinityCookie(): Promise<void> {
        await this.waas.wrap<undefined>(() => this.waas.instance.head("eth/transaction/0x0000000000000000000000000000000000000000000000000000000000000000"));
    }

    /**
     * Returns the status for an Ethereum transaction. The transaction is not mined until a blockNr is assigned.
     * @see [docs]{@link https://docs.tangany.com/?version=latest#5b262285-c8a0-4e36-8a41-4a2b1f0cdb1b}
     */
    public async get(): Promise<IEthereumTransactionStatus> {
        return this.getTransactionDetails(this.txHash);
    }

    /**
     * Queries a list of transactions based on passed filter criteria.
     * @param [queryParams]
     */
    public async getTransactions(queryParams: ISearchTxQueryParams = {}) {
        // Use a custom return object to provide convenient methods instead of the URLs that the user would have to process himself.
        return wrapSearchRequest<IEthereumTransactionStatus, ISearchItemData>(this.waas, "eth/transactions", queryParams);
    }

    /**
     * Returns details of the event corresponding to the passed log index of the current transaction hash.
     * @param index - Log index of the event that can be obtained by
     */
    public async getEvent(index: number): Promise<ISearchTxEventResponse> {
        return this.waas.wrap<ISearchTxEventResponse>(
            () => this.waas.instance.get(`/eth/transaction/${this.txHash}/event/${index}`));
    }

    /**
     * Helper: resolves when transaction is mined and rejects on errors or timeout
     * Attention: method polls the API frequently and may result in excessive quota usage
     * @param [timeout] - reject timeout in ms
     * @param [ms] - milliseconds delay between API polling attempts
     */
    public async wait(timeout = 20e3, ms = 4e2): Promise<IEthereumTransactionStatus> {

        const call = async () => this
            .get()
            .then((res: IEthereumTransactionStatus) => {

                let status: IWaitForTxStatus["status"];

                // tslint:disable-next-line:prefer-conditional-expression
                if (typeof res.blockNr === "number") {
                    status = "confirmed";
                } else if (res.isError) {
                    status = "error";
                } else {
                    status = "pending";
                }

                return {
                    status,
                    response: res,
                };
            });

        return Waas.waitForTxStatus(call, this.txHash, timeout, ms) as Promise<IEthereumTransactionStatus>;
    }

    /**
     * Queries the details for a given transaction hash.
     * @param txHash - Either the transaction hash of this object instance or any other
     */
    private async getTransactionDetails(txHash: string): Promise<IEthereumTransactionStatus> {
        return this.waas.wrap<IEthereumTransactionStatus>(() => this.waas.instance.get(`eth/transaction/${txHash}`));
    }

    /**
     * Returns calls to interact with universal Ethereum smart contracts
     * @param address - Smart contract address
     */
    public contract(address: string): EthereumContract {
        return new EthereumContract(this.waas, address);
    }

}
