import {IBitcoinTransactionStatus} from "./interfaces";
import {WaasAxiosInstance} from "./waas-axios-instance";
import {AxiosInstance, AxiosResponse} from "axios";

/**
 *  instantiates a new Bitcoin interface
 * @param instance - axios instance created by {@link WaasApi}
 * @param [txHash] - Bitcoin transaction hash
 */
export class Bitcoin extends WaasAxiosInstance {
    private readonly txHash?: string;

    constructor(instance: AxiosInstance, txHash?: string) {
        super(instance);
        this.txHash = txHash;
    }

    /**
     * Returns the status for a eth transaction. The transaction is not mined until a blockNr is assigned.
     * @see {@link https://tangany.docs.stoplight.io/api/bitcoin/get-btc-tx-status}
     */
    public async get(): Promise<AxiosResponse<IBitcoinTransactionStatus>> {
        if (!this.txHash) {
            throw new Error("missing argument txHash");
        }

        return this.instance.get(`btc/transaction/${this.txHash}`);
    }
}
