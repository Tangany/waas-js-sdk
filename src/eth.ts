import {Waas} from "./waas";
import {IEthereumTransactionStatus} from "./interfaces";
import * as t from "typeforce";
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

        return this.transactionHash;
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
    public async get(): Promise<IEthereumTransactionStatus> {
        return this.waas.wrap<IEthereumTransactionStatus>(() => this.waas.instance.get(`eth/transaction/${this.txHash}`));
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

        return Waas.waitForTxStatus(call, this.txHash, timeout, ms) as Promise<IEthereumTransactionStatus>;
    }
}
