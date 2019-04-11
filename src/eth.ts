import {WaasAxiosInstance} from "./waas-axios-instance";
import {AxiosInstance, AxiosResponse} from "axios";
import {ITransactionStatus} from "./interfaces";
import {TimeoutError} from "./errors/timeout-error";

/**
 * @param instance - api instance created by a new WaasApi instance
 */
export class Ethereum extends WaasAxiosInstance {

    constructor(instance: AxiosInstance) {
        super(instance);
    }

    /**
     * Returns the mining status for a ethereum transaction.
     * @param txHash - ethereum transaction hash
     * @see {@link https://tangany.docs.stoplight.io/api/ethereum/get-transaction-status}
     */
    public async getTxStatus(txHash: string): Promise<AxiosResponse<ITransactionStatus>> {
        return this.instance.get(`eth/transaction/${txHash}`);
    }

    /**
     * helper: resolves when given transaction is mined or errored
     * @param txHash - transaction hash
     * @param timeout - throw when not mined until timeout ms
     */
    public async waitForMined(txHash: string, timeout = 20000): Promise<ITransactionStatus> {
        return new Promise(async (resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new TimeoutError("timeout for retrieving mined status for transaction"));

                return;
            }, timeout);

            const checkMined = async (): Promise<void> => {
                const {isError, blockNr} = (await this.getTxStatus(txHash)).data;
                if (isError || typeof blockNr === "number") {
                    clearTimeout(timer);
                    resolve({isError, blockNr});
                } else {
                    setTimeout(checkMined, 100);
                }

                return;
            };

            try {
                return checkMined();
            } catch (e) {
                clearTimeout(timer);
                throw e;
            }
        });
    }
}
