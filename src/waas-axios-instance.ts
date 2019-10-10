import {AxiosInstance} from "axios";
import Bottleneck from "bottleneck";
import * as Debug from "debug";
import * as t from "typeforce";
import {LimiterEnabled} from "./limiter";
import {MiningError, TimeoutError} from "./errors";
import {IBlockchainTransactionStatus} from "./interfaces";
import Timeout = NodeJS.Timeout;

const debug = Debug("waas-js-sdk:waas-axios-instance");

export const recipientType = t.compile({
    to: "String",
    amount: "String",
});

export interface IWaitForTxStatus {
    status: "confirmed" | "pending" | "error";
    response: IBlockchainTransactionStatus;
}

@LimiterEnabled
export abstract class WaasAxiosInstance {

    public limiter?: Bottleneck;

    protected constructor(protected readonly instance: AxiosInstance) {
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

    /**
     * wrap async call to the bottleneck limiter
     * @param fn - function that returns a promise function. Pass the promise function's arguments via the functions argument
     * @param args - promise function arguments
     */
    protected async wrap<T>(fn: (args: any) => Promise<T>, ...args: any): Promise<T> {
        if (!this.limiter) {
            throw new Error("Cannot wrap function without limiter instance");
        }

        return this.limiter.schedule(fn, args);
    }
}
