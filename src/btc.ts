import {AxiosInstance} from "axios";
import * as t from "typeforce";
import {IBitcoinTransactionStatus} from "./interfaces";
import {WaasAxiosInstance} from "./waas-axios-instance";

export class Bitcoin extends WaasAxiosInstance {

    /**
     * Instantiates a new Bitcoin interface
     * @param instance - axios instance created by {@link Waas}
     * @param [transactionHash] - Bitcoin transaction hash
     */
    constructor(instance: AxiosInstance, private readonly transactionHash?: string) {
        super(instance);
        t("?String", transactionHash);
    }

    get txHash() {
        t("String", this.transactionHash);

        return this.transactionHash;
    }

    /**
     * Returns the status for a Bitcoin transaction
     * @see {@link https://tangany.docs.stoplight.io/api/bitcoin/get-btc-tx-status}
     */
    public async get(): Promise<IBitcoinTransactionStatus> {
        return this.wrap<IBitcoinTransactionStatus>(() => this.instance.get(`btc/transaction/${this.txHash}`));
    }

    /**
     * Helper: resolves when transaction is mined and rejects on errors or timeout
     * Attention: method polls the API frequently and may result in high quota usage
     * @param [timeout] - reject timeout in ms
     * @param [ms] - milliseconds delay between api polling attempts
     */
    public async wait(timeout = 20e3, ms = 8e2): Promise<IBitcoinTransactionStatus> {
        const call = () => this.get().then((s: IBitcoinTransactionStatus) => {

            return {
                status: s.data.status,
                response: s,
            };
        });

        return this.waitForTxStatus(call, this.txHash, timeout, ms) as Promise<IBitcoinTransactionStatus>;
    }
}
