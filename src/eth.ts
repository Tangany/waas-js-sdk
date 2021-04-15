import * as t from "typeforce";
import {EthereumContract} from "./eth-contract";
import {EthTransaction} from "./eth-transaction";
import {IEthereumTransaction, IEthStatus, ITransactionSearchParams} from "./interfaces/ethereum";
import {ITransactionEvent} from "./interfaces/ethereum-contract";
import {IMonitorSearchParams} from "./interfaces/monitor";
import {MonitorPageIterable} from "./iterables/monitor-page-iterable";
import {EthTransactionPageIterable} from "./iterables/eth-transaction-page-iterable"
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
     * Returns an async iterable object that is able to query lists of transactions based on passed filter criteria
     * @example
     * const iterable = new Waas().eth().getTransactions(query);
     * // fetch a single page
     * const iterator = iterable[Symbol.asyncIterator]();
     * const txPage = (await iterator.next()).value;
     * // fetch all pages
     * for await (const page of iterable) {
     *     console.log(await page.list[0].get()); // get details for a list result
     * }
     */
    public getTransactions(params?: ITransactionSearchParams): EthTransactionPageIterable {
        return new EthTransactionPageIterable(this.waas, {url: "eth/transactions", params});
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
    public monitor() {
        return {
            /**
             * Returns an asynchronous iterable to iterate all Ethereum-based monitors.
             * @param [params] - Optional search parameters
             * @see [docs]{@link https://docs.tangany.com/#0cf31f8c-9ae1-4709-9ca6-842452d74b10}
             */
            list: (params?: IMonitorSearchParams): MonitorPageIterable => {
                return new MonitorPageIterable(this.waas, {url: "eth/monitors", params});
            }
        }
    }

}
