import * as t from "typeforce";
import {EthereumContract} from "./eth-contract";
import {EthMonitorSearch} from "./eth-monitor-search";
import {EthTransaction} from "./eth-transaction";
import {ISearchOptions, ISearchRequestConfig} from "./interfaces/common";
import {IEthereumTransaction, IEthStatus, ITransactionSearchParams} from "./interfaces/ethereum";
import {ITransactionEvent} from "./interfaces/ethereum-contract";
import {EthTransactionIterable} from "./iterables/auto-pagination/eth-transaction-iterable";
import {EthTransactionPageIterable} from "./iterables/pagewise/eth-transaction-page-iterable";
import {Waas} from "./waas";
import {IWaasMethod} from "./waas-method";

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
     * @see [docs]{@link https://docs.tangany.com/#5b262285-c8a0-4e36-8a41-4a2b1f0cdb1b}
     */
    public async get(): Promise<IEthereumTransaction> {
        return this.getTransactionDetails(this.txHash);
    }

    /**
     * Returns an asynchronous iterable to iterate **page by page** through the transactions that matched the search parameters.
     * @param [params] - Optional search parameters
     * @see [docs]{@link https://docs.tangany.com/#63266651-76f9-4a4c-a971-0a39d6ede955}
     */
    public getTransactions(params?: ITransactionSearchParams): EthTransactionPageIterable;

    /**
     * Returns an asynchronous iterable that yields **one transaction object per iteration**.
     * A page of transactions that match the search parameters is fetched and saved once, so that all items can be returned one by one.
     * After that, the next page is loaded from the API and processed item by item again.
     * @param [params] - Optional search parameters
     * @param [options] - Additional options that do not affect the API request but the SDK-side processing
     * @see [docs]{@link https://docs.tangany.com/#63266651-76f9-4a4c-a971-0a39d6ede955}
     */
    public getTransactions(params?: ITransactionSearchParams, options?: { autoPagination: true }): EthTransactionIterable;

    /**
     * Returns an asynchronous iterable to iterate **page by page** through the transactions that matched the search parameters.
     * @param [params] - Optional search parameters
     * @param [options] - Additional options that do not affect the API request but the SDK-side processing
     * @see [docs]{@link https://docs.tangany.com/#63266651-76f9-4a4c-a971-0a39d6ede955}
     */
    // tslint:disable-next-line:unified-signatures
    public getTransactions(params?: ITransactionSearchParams, options?: ISearchOptions): EthTransactionPageIterable;

    public getTransactions(params?: ITransactionSearchParams, options?: ISearchOptions): EthTransactionIterable | EthTransactionPageIterable {
        const initialRequest: ISearchRequestConfig = {url: "eth/transactions", params};
        if (options?.autoPagination) {
            return new EthTransactionIterable(this.waas, initialRequest);
        } else {
            return new EthTransactionPageIterable(this.waas, initialRequest);
        }
    }

    /**
     * Returns details of the event corresponding to the passed log index of the current transaction hash.
     * @param index - Log index of the event that can be obtained by
     */
    public async getEvent(index: number): Promise<ITransactionEvent> {
        return this.waas.wrap<ITransactionEvent>(
            () => this.waas.instance.get(`/eth/transaction/${this.txHash}/event/${index}`));
    }

    /**
     * Helper: resolves when transaction is mined and rejects on errors or timeout
     * Attention: method polls the API frequently and may result in excessive quota usage
     * @param [timeout] - reject timeout in ms
     * @param [ms] - milliseconds delay between API polling attempts
     */
    public async wait(timeout = 20e3, ms = 4e2): Promise<IEthereumTransaction> {

        const call = async () => this
            .get()

        return Waas.waitForTxStatus(call, this.txHash, timeout, ms) as Promise<IEthereumTransaction>;
    }

    /**
     * Get status and information about Ethereum full-node.
     * The status faulty indicates that one or more info properties are missing.
     * The status unavailable is returned if all info properties are missing.
     */
    public async getStatus(): Promise<IEthStatus> {
        return this.waas.wrap<IEthStatus>(() => this.waas.instance.get(`eth/status`));
    }

    /**
     * Queries the details for a given transaction hash.
     * @param txHash - Either the transaction hash of this object instance or any other
     */
    private async getTransactionDetails(txHash: string): Promise<IEthereumTransaction> {
        return new EthTransaction(this.waas, txHash).get();
    }

    /**
     * Returns calls to interact with universal Ethereum smart contracts
     * @param address - Smart contract address
     */
    public contract(address: string): EthereumContract {
        return new EthereumContract(this.waas, address);
    }

    /**
     * Returns an object to interact with Ethereum-based monitors (possibly of different wallets).
     */
    public monitor(): EthMonitorSearch {
        return new EthMonitorSearch(this.waas);
    }

}
