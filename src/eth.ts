import {IWaitForTxStatus, WaasAxiosInstance} from "./waas-axios-instance";
import {AxiosInstance} from "axios";
import {IEthereumTransactionStatus} from "./interfaces";
import * as t from "typeforce";

/**
 * Instantiates a new Ethereum interface
 * @param instance - axios instance created by {@link Waas}
 * @param [txHash] - Ethereum transaction hash
 */
export class Ethereum extends WaasAxiosInstance {

    constructor(instance: AxiosInstance, private readonly transactionHash?: string) {
        super(instance);
        t("?String", transactionHash);
    }

    get txHash() {
        t("String", this.transactionHash);

        return this.transactionHash;
    }

    /**
     * Returns the status for an Ethereum transaction. The transaction is not mined until a blockNr is assigned.
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum/get-eth-tx-status}
     */
    public async get(): Promise<IEthereumTransactionStatus> {
        return this.wrap<IEthereumTransactionStatus>(() => this.instance.get(`eth/transaction/${this.transactionHash}`));
    }

    /**
     * Helper: resolves when transaction is mined and rejects on errors or timeout
     * Attention: method polls the API frequently and may result in excessive quota usage
     * @param [timeout] - reject timeout in ms
     * @param [ms] - milliseconds delay between API polling attempts
     */
    public async wait(timeout = 20e3, ms = 4e2): Promise<IEthereumTransactionStatus> {

        const call = () => this.get().then((res: IEthereumTransactionStatus) => {

            let status: IWaitForTxStatus["status"];

            // tslint:disable-next-line:prefer-conditional-expression
            if (typeof res.data.blockNr === "number") {
                status = "confirmed";
            } else if (res.data.isError) {
                status = "error";
            } else {
                status = "pending";
            }

            return {
                status,
                response: res,
            };
        });

        return this.waitForTxStatus(call, this.txHash, timeout, ms) as Promise<IEthereumTransactionStatus>;

    }
}
