import * as t from "typeforce";
import {EthereumContract} from "./eth-contract";
import {IEthereumTransaction, IEthStatus, ITransactionSearchParams} from "./interfaces/ethereum";
import {ITransactionEvent} from "./interfaces/ethereum-contract";
import {wrapSearchRequestIterable} from "./utils/search-request-wrapper";
import {Waas} from "./waas";
import {IWaasMethod} from "./waas-method";

export interface IEthereumTxSearchItemData {
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
     * @see [docs]{@link https://docs.tangany.com/#5b262285-c8a0-4e36-8a41-4a2b1f0cdb1b}
     */
    public async get(): Promise<IEthereumTransaction> {
        return this.getTransactionDetails(this.txHash);
    }

    /**
     * Returns an async iterable object that is able to query lists of transactions based on passed filter criteria
     * @example
     * const iterable = new Waas().eth().getTransactions(qs);
     * // fetch a single page
     * const iterator = iterable[Symbol.asyncIterator]()
     * const txPage = (await iterator.next).value
     * // fetch all pages
     * for await (value of iterable) {
     *     console.log(await value.list[0].get); // fetch transaction details
     * }
     */
    public getTransactions(params: ITransactionSearchParams = {}) {
        return wrapSearchRequestIterable<IEthereumTransaction, IEthereumTxSearchItemData>(this.waas, "eth/transactions", params);
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
    public async getStatus(): Promise<IEthStatus>{
        return this.waas.wrap<IEthStatus>(() => this.waas.instance.get(`eth/status`));
    }

    /**
     * Queries the details for a given transaction hash.
     * @param txHash - Either the transaction hash of this object instance or any other
     */
    private async getTransactionDetails(txHash: string): Promise<IEthereumTransaction> {
        return this.waas.wrap<IEthereumTransaction>(() => this.waas.instance.get(`eth/transaction/${txHash}`));
    }

    /**
     * Returns calls to interact with universal Ethereum smart contracts
     * @param address - Smart contract address
     */
    public contract(address: string): EthereumContract {
        return new EthereumContract(this.waas, address);
    }

}
