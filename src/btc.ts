import {IBitcoinTransactionStatus} from "./interfaces";
import {WaasAxiosInstance} from "./waas-axios-instance";
import {AxiosInstance} from "axios";
import * as t from "typeforce";

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
}
