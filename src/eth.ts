import {WaasAxiosInstance} from "./waas-axios-instance";
import {AxiosInstance} from "axios";
import {IEthereumTransactionStatus} from "./interfaces";
import {TimeoutError} from "./errors";
import * as t from "typeforce";

/**
 * Instantiates a new Ethereum interface
 * @param instance - axios instance created by {@link WaasApi}
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
        return this.instance.get(`eth/transaction/${this.transactionHash}`);
    }

    /**
     * Helper: resolves when given Ethereum transaction is mined or errored
     * @param [timeout] - throw when not mined until timeout ms
     */
    public async wait(timeout = 20000): Promise<IEthereumTransactionStatus["data"]> {
        return new Promise(async (resolve, reject) => {
            // reject function when the global timer completes;
            const timer = setTimeout(() => {
                reject(new TimeoutError(`Timeout for retrieving transaction status for ${this.transactionHash}`));

                return;
            }, timeout);

            const checkMined = async (): Promise<void> => {
                const {isError, blockNr} = (await this.get()).data;
                if (isError || typeof blockNr === "number") {
                    clearTimeout(timer);
                    resolve({isError, blockNr});
                } else {
                    // wait a little and retry the call
                    setTimeout(checkMined, 100);
                }

                return;
            };

            checkMined()
                .catch(e => {
                    clearTimeout(timer);
                    reject(e);

                    return;
                });
        });
    }
}
