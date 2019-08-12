import {AxiosInstance} from "axios";
import * as t from "typeforce";
import {IBitcoinTransactionStatus} from "./interfaces";
import {IWaitForTxStatus, WaasAxiosInstance} from "./waas-axios-instance";

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
     * Returns the status for a eth transaction. The transaction is not mined until a blockNr is assigned.
     * @see {@link https://tangany.docs.stoplight.io/api/bitcoin/get-btc-tx-status}
     */
    public async get(): Promise<IBitcoinTransactionStatus> {
        return this.instance.get(`btc/transaction/${this.txHash}`);
    }

    /**
     * Helper: resolves when given Ethereum transaction is mined or errored
     * @param [timeout] - throw when not mined until timeout ms
     */
    public async wait(timeout = 20000): Promise<IBitcoinTransactionStatus> {
        const call: Promise<IWaitForTxStatus> = this.get().then((s: IBitcoinTransactionStatus) => {

            return {
                status: s.data.status,
                response: s,
            };
        });

        return this.waitForTxStatus(call, this.txHash, timeout) as Promise<IBitcoinTransactionStatus>;
    }
}
