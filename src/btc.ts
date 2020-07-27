import * as t from "typeforce";
import {IBitcoinTransactionStatus} from "./interfaces";
import {Waas} from "./waas";
import {IWaasMethod} from "./waas-method";

export class Bitcoin implements IWaasMethod {

    /**
     * Instantiates a new Bitcoin interface
     * @param waas - {@link Waas} instance
     * @param [transactionHash] - Bitcoin transaction hash
     */
    constructor(public waas: Waas, private readonly transactionHash?: string) {
        t("?String", transactionHash);
    }

    get txHash() {
        t("String", this.transactionHash);

        return this.transactionHash;
    }

    /**
     * Returns the status for a Bitcoin transaction
     * @see [docs]{@link https://docs.tangany.com/#e9f7074c-50ea-432c-8835-1d278ad68f1c}
     */
    public async get(): Promise<IBitcoinTransactionStatus> {
        return this.waas.wrap<IBitcoinTransactionStatus>(() => this.waas.instance.get(`btc/transaction/${this.txHash}`));
    }

    /**
     * Establish a sticky session with a Ethereum full node by fetching and setting affinity cookies for the current Waas instance
     */
    public async fetchAffinityCookie(): Promise<void> {
        await this.waas.wrap(() => this.waas.instance.head("btc/transaction/0000000000000000000000000000000000000000000000000000000000000000"));
    }

    /**
     * Helper: resolves when transaction is mined and rejects on errors or timeout
     * Attention: method polls the API frequently and may result in high quota usage
     * @param [timeout] - reject timeout in ms
     * @param [ms] - milliseconds delay between api polling attempts
     */
    public async wait(timeout = 20e3, ms = 8e2): Promise<IBitcoinTransactionStatus> {
        const call = () => this.get()

        return Waas.waitForTxStatus(call, this.txHash, timeout, ms) as Promise<IBitcoinTransactionStatus>;
    }
}
