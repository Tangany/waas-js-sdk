import {AxiosInstance} from "axios";
import {MiningError, TimeoutError} from "./errors";
import {IBlockchainTransactionStatus} from "./interfaces";
import Timeout = NodeJS.Timeout;
import * as Debug from "debug";

const debug = Debug("waas-js-sdk:waas-axios-instance");

export interface IWaitForTxStatus {
    status: "confirmed" | "pending" | "error";
    response: IBlockchainTransactionStatus;
}

export abstract class WaasAxiosInstance {
    protected readonly instance: AxiosInstance;

    protected constructor(instance: AxiosInstance) {
        this.instance = instance;
    }

    /**
     *  Execute the statusGetterCall periodically until timeout and resolves the status
     * @param statusGetterCall - function to fetch the transaction status from a blockchain
     * @param [hash} - transaction hash
     * @param [timeout] - if the statusGetterCall did not resolved during the timeout period (in ms) the function will reject
     * @param [ms] - milliseconds delay between api polling attempts
     */
    protected waitForTxStatus = async (statusGetterCall: () => Promise<IWaitForTxStatus>, hash?: string, timeout = 20e3, ms = 400): Promise<IBlockchainTransactionStatus> =>
        new Promise(async (resolve, reject) => {
            let subtimer: Timeout;

            // reject function when the global timer completes;
            const globalTimer = global.setTimeout(() => { // https://github.com/Microsoft/TypeScript/issues/30128
                clearTimeout(subtimer);
                debug("global timeout for waiter");
                reject(new TimeoutError(`Timeout for retrieving transaction status for ${hash || "transaction"}`));

                return;
            }, timeout);

            // poll api
            const pollSafely = () => poll()
                .catch(e => {
                    clearTimeout(globalTimer);
                    reject(e);

                    return;
                });

            const poll = async (): Promise<void> => {
                debug("waiting for getter call");
                const {status, response} = await statusGetterCall();
                debug("received getter response", {status}, response.data);

                switch (status) {
                    case "confirmed":
                        clearTimeout(globalTimer);
                        resolve(response);

                        return;
                    case "error":
                        clearTimeout(globalTimer);
                        reject(new MiningError(response));

                        return;
                    case "pending":
                    default:
                        subtimer = global.setTimeout(pollSafely, ms);
                }
            };

            await pollSafely();

        })

}
