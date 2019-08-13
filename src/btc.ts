import {AxiosInstance} from "axios";
import * as t from "typeforce";
import {IBitcoinTransactionStatus} from "./interfaces";
import {WaasAxiosInstance} from "./waas-axios-instance";

export class Bitcoin extends WaasAxiosInstance {

    /**
     * Instantiates a new Bitcoin interface
     * @param instance - axios instance created by {@link WaasApi}
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
        return this.instance.get(`btc/transaction/${this.txHash}`);
    }

    /**
     * Helper: resolves when transaction is mined and rejects on errors or timeout
     * @param [timeout] - reject timeout in ms
     */
    public async wait(timeout = 20000): Promise<IBitcoinTransactionStatus> {
        const call = () => this.get().then((s: IBitcoinTransactionStatus) => {

            return {
                status: s.data.status,
                response: s,
            };
        });

        return this.waitForTxStatus(call, this.txHash, timeout) as Promise<IBitcoinTransactionStatus>;
    }
}
